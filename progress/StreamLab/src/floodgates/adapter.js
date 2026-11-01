import { GatesRouter } from "./router.ts";
/**
 * FloodGateAdapter — a BusAdapter that routes every send/sub through the
 * flood-gate fabric. Setting `floodGates: true` on your adapter instance
 * makes the lab's six primitives run over multi-gate transport:
 *
 *   - sendsubs / state / duplex / streams / signals / binary / sharedmemory
 *     each have their own gate ladder (the STAFF fabric)
 *   - traffic opens gates only as the flood demands — never throttled
 *   - offline transports are probed and skipped
 *
 * Wire fidelity: the same sendsub/multisub envelope passes through, so
 * primitives don't care they're flood-routed.
 */
export class FloodGateAdapter {
    router;
    subs = new Map();
    seq = 0;
    constructor(provider, opts = {}) {
        this.router = new GatesRouter(provider, opts);
    }
    sendsub(rt, ms, data, ...rest) {
        const p = new TextEncoder().encode(JSON.stringify({ rt, ms, data, rest }));
        const frame = {
            category: (ms?.startsWith(":syncAck") ? "duplex" : "sendsubs"),
            p,
            seq: this.seq++,
        };
        this.router.route(frame);
        const key = `${rt}${ms ? "#" + ms : ""}`;
        const set = this.subs.get(key);
        if (set)
            for (const h of set)
                queueMicrotask(() => h(data, { rt, subChannel: ms }));
        return Promise.resolve();
    }
    multisub(rt, ms, handler) {
        const key = `${rt}${ms ? "#" + ms : ""}`;
        if (!this.subs.has(key))
            this.subs.set(key, new Set());
        if (handler)
            this.subs.get(key).add(handler);
        return () => this.subs.get(key)?.delete(handler);
    }
    useStateCRDT;
    routerStats() { return this.router.stats(); }
    async close() {
        await this.router.close();
    }
}
