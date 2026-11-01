/**
 * switchboard — deterministic (exact-match) routing.
 *
 * A key selector picks a route key from each p; routes are,
 * by default, *deterministic*: the selector is a pure function of the
 * p, so the same p always lands on the same handler. A
 * `default` route catches unknown keys; otherwise unmatched payloads
 * report `unmatched: true`.
 */
export class Switchboard {
    bus;
    routes;
    options;
    store = new Map();
    constructor(routes, options) {
        this.routes = routes;
        this.options = options;
        // Bus adapter is injected via options (routes are pure by default; if a
        // handler needs to reply through the bus it can use ctx.bus).
        this.bus = options.bus ?? {};
    }
    async route(p) {
        const key = this.options.selectKey(p);
        const handler = this.routes[key] ?? this.routes.default;
        if (!handler) {
            if (this.options.onUnmatched)
                this.options.onUnmatched(p, key);
            return { success: false, matchedKey: null, unmatched: true, result: undefined };
        }
        const ctx = {
            p,
            reply: async (data) => {
                // Where the bus is wired, replies go back on a sub-rt keyed by the p.
                return this.bus?.sendsub?.(`reply:${String(key)}`, undefined, data) ?? undefined;
            },
            store: this.store,
            bus: this.bus,
        };
        try {
            const result = await handler(p, ctx);
            return { success: true, matchedKey: key, unmatched: false, result };
        }
        catch (err) {
            return { success: false, matchedKey: key, unmatched: false, error: err instanceof Error ? err : new Error(String(err)) };
        }
    }
    keys() {
        return Object.keys(this.routes).filter((k) => k !== "default");
    }
}
