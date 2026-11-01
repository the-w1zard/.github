/**
 * GatesRouter — the flood-gate brain.
 *
 * Holds the gate map, opens the FIRST AVAILABLE gate per category, tracks
 * per-gate sustained rate over a sliding window, and when the current
 * gate's rate exceeds its threshold, OPENS the next gate (flood). Traffic
 * spreads across the open gates by least-loaded heuristic. When a gate
 * becomes unready, traffic falls back to the previous gate.
 *
 * This is deliberately transport-agnostic: a `TransportProvider` is the
 * only seam. In the VM we bind it to memory transports; on the real bus it
 * binds WebTransport / WebRTC / WebSocket / UDP / BroadcastChannel /
 * MessagePort / SharedArrayBuffer.
 */
export class GatesRouter {
    map;
    provider;
    opts;
    ladders = new Map();
    rateWindow = []; // per gate
    seq = 0;
    constructor(provider, opts = {}) {
        this.provider = provider;
        this.map = opts.map ?? { ...DEFAULT_GATE_MAP }; // shallow — replaced by defaultGateMap in factory
        this.opts = {
            windowMs: opts.windowMs ?? 1000,
            floodRatio: opts.floodRatio ?? 1.0,
            probeAvailability: opts.probeAvailability ?? true,
            ...opts,
        };
        for (const cat of Object.keys(this.map)) {
            this.ladders.set(cat, this.map[cat].map((d) => this.initRuntime(d)));
            this.rateWindow.push([]);
        }
    }
    initRuntime(d) {
        return {
            descriptor: d,
            handle: null,
            stats: { bytesSent: 0, framesSent: 0, bytesDropped: 0, openedAt: 0 },
            open: false,
            ready: false,
        };
    }
    /** Open the first AVAILABLE gate for a category (probe if configured). */
    async ensureReady(category) {
        const ladder = this.ladders.get(category);
        if (!ladder)
            return null;
        for (let i = 0; i < ladder.length; i++) {
            const rt = ladder[i];
            if (rt.ready && rt.open)
                return rt;
            const available = rt.descriptor.online !== false &&
                (!this.opts.probeAvailability || !this.provider.probe ||
                    await this.provider.probe(rt.descriptor));
            if (!available)
                continue;
            if (!rt.handle) {
                rt.handle = await this.provider.connect(rt.descriptor);
                rt.handle.onOpen?.(() => { rt.open = true; rt.ready = true; });
                rt.handle.onClose?.(() => {
                    rt.open = false;
                    rt.ready = false;
                    // Fall back to the previous gate if one exists.
                    const prev = ladder[i - 1];
                    if (prev)
                        void this.ensureReady(prev.descriptor.category).then(() => { });
                });
                rt.stats.openedAt = Date.now();
                this.opts.onGateOpen?.(category, rt.descriptor, i);
            }
            rt.open = true;
            rt.ready = true;
            return rt;
        }
        return null;
    }
    /** Route one frame to the best open gate for its category (flood-aware). */
    route(frame) {
        const ladder = this.ladders.get(frame.category);
        if (!ladder || ladder.length === 0)
            return false;
        // Open gates only; pick the least-loaded (fewest bytes in current window).
        const open = ladder.filter((g) => g.ready && g.open && g.handle);
        if (open.length === 0)
            return false;
        // Least-loaded by current-window bytes.
        const bucket = this.rateWindow[ladder.indexOf(open[0])];
        let chosen = open[0];
        let min = this.windowBytes(ladder.indexOf(chosen));
        for (const g of open) {
            const idx = ladder.indexOf(g);
            const b = this.windowBytes(idx);
            if (b < min) {
                chosen = g;
                min = b;
            }
        }
        void chosen.handle.send(frame.p);
        chosen.stats.bytesSent += frame.p.byteLength;
        chosen.stats.framesSent++;
        this.record(ladder.indexOf(chosen), frame.p.byteLength);
        this.opts.onFrame?.(frame, chosen.descriptor);
        // Flood check: if the CURRENT active gate's sustained rate exceeds its
        // threshold, open the next gate (cascade — each open gate has its own
        // water mark, so the dam opens one more gate per flood level).
        const active = open[open.length - 1] ?? ladder[0];
        if (active) {
            const idx = ladder.indexOf(active);
            const rate = this.windowBytes(idx) / (this.opts.windowMs / 1000);
            const threshold = active.descriptor.threshold;
            if (threshold !== undefined && rate > threshold * this.opts.floodRatio) {
                this.flood(ladder, frame.category);
            }
        }
        return true;
    }
    /** Open the next not-yet-open gate (flood gate). */
    flood(ladder, category) {
        const next = ladder.find((g) => !g.open);
        if (!next)
            return;
        void this.ensureReady(category).then(() => {
            // ensureReady opens the first AVAILABLE, which may be this one.
        });
        // Ensure it opens even if a lower gate was already open:
        void this.openGate(next, category);
    }
    async openGate(rt, category) {
        const available = rt.descriptor.online !== false &&
            (!this.opts.probeAvailability || !this.provider.probe ||
                await this.provider.probe(rt.descriptor));
        if (!available)
            return;
        if (!rt.handle) {
            rt.handle = await this.provider.connect(rt.descriptor);
            rt.handle.onOpen?.(() => { rt.open = true; rt.ready = true; });
            rt.handle.onClose?.(() => { rt.open = false; rt.ready = false; });
        }
        rt.open = true;
        rt.ready = true;
        rt.stats.openedAt = Date.now();
        this.opts.onGateOpen?.(category, rt.descriptor, this.ladders.get(category).indexOf(rt));
    }
    record(i, bytes) {
        const bucket = this.rateWindow[i] ?? (this.rateWindow[i] = []);
        bucket.push({ at: Date.now(), bytes });
    }
    windowBytes(i) {
        const bucket = this.rateWindow[i] ?? [];
        const cutoff = Date.now() - this.opts.windowMs;
        // Trim stale.
        while (bucket.length && bucket[0].at < cutoff)
            bucket.shift();
        return bucket.reduce((s, e) => s + e.bytes, 0);
    }
    /** Stats snapshot per gate, for tests and the demo. */
    stats() {
        const out = {};
        for (const [cat, ladder] of this.ladders) {
            out[cat] = ladder.map((g) => ({ name: g.descriptor.name, bytes: g.stats.bytesSent, frames: g.stats.framesSent, open: g.open }));
        }
        return out;
    }
    /** Close all gates (teardown). */
    async close() {
        for (const ladder of this.ladders.values()) {
            for (const g of ladder) {
                if (g.handle)
                    await g.handle.close();
                g.open = false;
                g.ready = false;
            }
        }
    }
}
import { DEFAULT_GATE_MAP } from "./gateMap.ts";
