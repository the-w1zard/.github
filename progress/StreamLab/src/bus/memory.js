/**
 * MemoryBus — a single-process bus adapter for StreamLab.
 *
 * Implements exactly the BusAdapter surface (`sendsub` / `multisub`), with
 * wildcard subscription (`rt:*` suffix matches any sub-rt), topic
 * fan-out, and a tiny LWW CRDT state hook so `mesh`'s cluster state works
 * without wiring a real CRDT implementation.
 *
 * NOTE: messages dispatch on `queueMicrotask` — subscribers are always
 * invoked asynchronously, like a real network/bus hop. Tests must await a
 * flush before asserting observed state.
 */
export class MemoryBus {
    subs = new Map();
    counters = new Map();
    sendsub(rt, _sub_channel, data, ..._rest) {
        this.counters.set(rt, (this.counters.get(rt) ?? 0) + 1);
        queueMicrotask(() => {
            const base = this.subs.get(rt);
            for (const h of base ?? []) {
                try {
                    h(data);
                }
                catch { /* subscriber errors never break the bus */ }
            }
            for (const [pat, set] of this.subs) {
                if (pat !== rt && pat.endsWith("*") && rt.startsWith(pat.slice(0, -1))) {
                    for (const h of set) {
                        try {
                            h(data);
                        }
                        catch { /* ignore */ }
                    }
                }
            }
        });
        return Promise.resolve();
    }
    multisub(rt, _sub_channel, handler) {
        if (!handler)
            return () => { };
        const set = this.subs.get(rt) ?? new Set();
        set.add(handler);
        this.subs.set(rt, set);
        return () => {
            set.delete(handler);
            if (set.size === 0)
                this.subs.delete(rt);
        };
    }
    /** Count of messages sent on a rt (test helper). */
    count(rt) {
        return this.counters.get(rt) ?? 0;
    }
    /** Await pending microtasks + a macrotask so queued messages flush. */
    async flush() {
        await Promise.resolve();
        await new Promise((r) => setTimeout(r, 0));
    }
    /**
     * Tiny LWW (last-write-wins) CRDT state hook — same shape as the bus's
     * useStateCRDT. Each field carries {v: value, ts: timestamp}; merges keep
     * the highest timestamp per field. Good enough to exercise mesh.
     */
    useStateCRDT = (initial) => {
        let state = initial;
        const ts = new Map();
        const apply = (patch) => {
            for (const [k, v] of Object.entries(patch ?? {})) {
                const t = Date.now();
                if ((ts.get(k) ?? 0) < t) {
                    ts.set(k, t);
                    state = { ...state, [k]: v };
                }
            }
        };
        apply(initial);
        const setState = (updater) => {
            const next = typeof updater === "function" ? updater(state) : updater;
            apply(next);
        };
        return [state, setState];
    };
}
