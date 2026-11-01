/**
 * mesh — resilient peer mesh with CRDT-merged cluster state.
 *
 * Peers discover each other through announce heartbeats on the mesh rt;
 * every peer's `peers` table is reconciled through the bus's CRDT state hook
 * (last-write-wins per field by default — plug in your real distributed
 * state primitive to get proper conflict-free merging). Stale peers are
 * pruned after `peerTimeout`, and a broadcast fan-out distributes messages
 * mesh-wide.
 */
/**
 * Local LWW state hook fallback — used when the bus adapter doesn't expose
 * useStateCRDT. Merge is last-write-wins per top-level field.
 */
function lwwState(initial) {
    let state = { ...initial };
    let ts = new Map(Object.entries(initial ?? {}).map(([k]) => [k, 0]));
    const set = (patch) => {
        const p = (patch ?? {});
        for (const [k, v] of Object.entries(p)) {
            const t = Date.now();
            if ((ts.get(k) ?? 0) < t) {
                ts.set(k, t);
                state = { ...state, [k]: v };
            }
        }
    };
    return [state, set];
}
export class Mesh {
    bus;
    rt;
    opts;
    peers = new Map();
    listeners = new Set();
    heartbeat;
    unsub;
    /** CRDT-merged cluster state — via the bus hook. */
    setCluster;
    peerId;
    clusterState;
    constructor(bus, rt, opts = {}) {
        this.bus = bus;
        this.rt = rt;
        this.opts = {
            announceInterval: opts.announceInterval ?? 5000,
            peerTimeout: opts.peerTimeout ?? 15000,
            maxPeers: opts.maxPeers ?? 64,
            ...opts,
        };
        this.peerId = opts.peerId ?? `peer-${Math.random().toString(36).slice(2, 8)}`;
        // Cluster state is CRDT-merged: every peer's announce carries its view,
        // the hook merges with LWW so the `peers` table converges.
        const [cluster, setCluster] = (bus.useStateCRDT ?? lwwState)({});
        this.clusterState = cluster;
        this.setCluster = setCluster;
    }
    start() {
        if (this.unsub)
            return;
        this.unsub = this.bus.multisub(this.rt, undefined, (data) => {
            void this.onMeshMessage(data);
        });
        this.announce();
        this.heartbeat = setInterval(() => {
            this.prune();
            this.announce();
        }, this.opts.announceInterval);
    }
    stop() {
        if (this.heartbeat)
            clearInterval(this.heartbeat);
        this.heartbeat = undefined;
        if (this.unsub) {
            this.unsub();
            this.unsub = undefined;
        }
    }
    broadcast(p) {
        const msg = { from: this.peerId, p, timestamp: Date.now() };
        void this.bus.sendsub(this.rt, undefined, msg);
    }
    onMessage(cb) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }
    peersList() {
        return [...this.peers.values()].sort((a, b) => a.id.localeCompare(b.id));
    }
    state() {
        return {
            peerId: this.peerId,
            peers: this.peersList().map((p) => ({ id: p.id, metadata: p.metadata })),
            meshSize: this.peers.size + 1,
        };
    }
    announce() {
        const entry = {
            kind: "announce",
            from: this.peerId,
            p: {
                metadata: { role: "streamlab" },
            },
            timestamp: Date.now(),
        };
        void this.bus.sendsub(this.rt, undefined, entry);
    }
    async onMeshMessage(msg) {
        if (!msg || typeof msg.from !== "string" || msg.from === this.peerId)
            return;
        if (msg.kind === "announce") {
            const meta = msg.p?.metadata ?? {};
            const existing = this.peers.get(msg.from);
            this.peers.set(msg.from, {
                id: msg.from,
                lastSeen: Date.now(),
                metadata: meta,
                latency: existing ? existing.latency : 0,
            });
            // Merge into the CRDT cluster state — LWW wins per field.
            this.setCluster((prev) => ({
                ...prev,
                [`peer:${msg.from}`]: { id: msg.from, metadata: meta, lastSeen: Date.now() },
            }));
            await this.pruneIfOver();
            return;
        }
        for (const cb of [...this.listeners]) {
            try {
                cb(msg);
            }
            catch { /* isolate */ }
        }
    }
    async pruneIfOver() {
        if (this.peers.size <= this.opts.maxPeers)
            return;
        const sorted = [...this.peers.values()].sort((a, b) => a.lastSeen - b.lastSeen);
        const excess = this.peers.size - this.opts.maxPeers;
        for (const p of sorted.slice(0, excess))
            this.peers.delete(p.id);
    }
    prune() {
        const cutoff = Date.now() - this.opts.peerTimeout;
        for (const [id, p] of this.peers) {
            if (p.lastSeen < cutoff)
                this.peers.delete(id);
        }
    }
}
