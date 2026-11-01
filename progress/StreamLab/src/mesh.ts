import type {
  BusAdapter, CRDTStateHook, MeshMessage, MeshOptions, MeshPeer, MeshState,
} from "./types.ts";

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
function lwwState(initial: Record<string, any>): [Record<string, any>, (u: unknown) => void] {
  let state: Record<string, any> = { ...initial };
  let ts = new Map<string, number>(Object.entries(initial ?? {}).map(([k]) => [k, 0] as const));
  const set = (patch: unknown) => {
    const p = (patch ?? {}) as Record<string, any>;
    for (const [k, v] of Object.entries(p)) {
      const t = Date.now();
      if ((ts.get(k) ?? 0) < t) { ts.set(k, t); state = { ...state, [k]: v }; }
    }
  };
  return [state, set];
}

export class Mesh<T = unknown, TMeta extends Record<string, unknown> = Record<string, unknown>> {
  private bus: BusAdapter;
  private rt: string;
  private opts: Required<Pick<MeshOptions, "announceInterval" | "peerTimeout" | "maxPeers">> & MeshOptions;
  private peers = new Map<string, MeshPeer<TMeta>>();
  private listeners = new Set<(m: MeshMessage<T>) => void>();
  private heartbeat?: ReturnType<typeof setInterval>;
  private unsub?: () => void;
  /** CRDT-merged cluster state — via the bus hook. */
  private setCluster: (u: unknown) => void;

  public peerId: string;
  public clusterState: Record<string, any>;

  constructor(bus: BusAdapter, rt: string, opts: MeshOptions = {}) {
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

  start(): void {
    if (this.unsub) return;
    this.unsub = this.bus.multisub(this.rt, undefined, (data: unknown) => {
      void this.onMeshMessage(data as MeshMessage<T>);
    });
    this.announce();
    this.heartbeat = setInterval(() => {
      this.prune();
      this.announce();
    }, this.opts.announceInterval);
  }

  stop(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = undefined;
    if (this.unsub) { this.unsub(); this.unsub = undefined; }
  }

  broadcast(p: T): void {
    const msg: MeshMessage<T> = { from: this.peerId, p, timestamp: Date.now() };
    void this.bus.sendsub(this.rt, undefined, msg);
  }

  onMessage(cb: (m: MeshMessage<T>) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  peersList(): MeshPeer<TMeta>[] {
    return [...this.peers.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  state(): MeshState {
    return {
      peerId: this.peerId,
      peers: this.peersList().map((p) => ({ id: p.id, metadata: p.metadata })),
      meshSize: this.peers.size + 1,
    };
  }

  private announce(): void {
    const entry: MeshMessage<never> & { kind: "announce" } = {
      kind: "announce",
      from: this.peerId,
      p: {
        metadata: { role: "streamlab" },
      } as never,
      timestamp: Date.now(),
    };
    void this.bus.sendsub(this.rt, undefined, entry);
  }

  private async onMeshMessage(msg: MeshMessage<T>): Promise<void> {
    if (!msg || typeof msg.from !== "string" || msg.from === this.peerId) return;
    if ((msg as { kind?: string }).kind === "announce") {
      const meta = (msg as unknown as { p: { metadata: TMeta } }).p?.metadata ?? {} as TMeta;
      const existing = this.peers.get(msg.from);
      this.peers.set(msg.from, {
        id: msg.from,
        lastSeen: Date.now(),
        metadata: meta,
        latency: existing ? existing.latency : 0,
      });
      // Merge into the CRDT cluster state — LWW wins per field.
      this.setCluster((prev: Record<string, any>) => ({
        ...prev,
        [`peer:${msg.from}`]: { id: msg.from, metadata: meta, lastSeen: Date.now() },
      }));
      await this.pruneIfOver();
      return;
    }
    for (const cb of [...this.listeners]) {
      try { cb(msg); } catch { /* isolate */ }
    }
  }

  private async pruneIfOver(): Promise<void> {
    if (this.peers.size <= this.opts.maxPeers) return;
    const sorted = [...this.peers.values()].sort((a, b) => a.lastSeen - b.lastSeen);
    const excess = this.peers.size - this.opts.maxPeers;
    for (const p of sorted.slice(0, excess)) this.peers.delete(p.id);
  }

  private prune(): void {
    const cutoff = Date.now() - this.opts.peerTimeout;
    for (const [id, p] of this.peers) {
      if (p.lastSeen < cutoff) this.peers.delete(id);
    }
  }
}
