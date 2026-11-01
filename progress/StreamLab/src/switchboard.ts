import type {
  BusAdapter, SwitchboardContext, SwitchboardOptions, SwitchboardResult,
  SwitchboardRoute, SwitchboardRoutes,
} from "./types.ts";

/**
 * switchboard — deterministic (exact-match) routing.
 *
 * A key selector picks a route key from each p; routes are,
 * by default, *deterministic*: the selector is a pure function of the
 * p, so the same p always lands on the same handler. A
 * `default` route catches unknown keys; otherwise unmatched payloads
 * report `unmatched: true`.
 */
export class Switchboard<TPayload = any, TKey extends string = string> {
  private bus: BusAdapter;
  private routes: SwitchboardRoutes<TPayload, TKey>;
  private options: SwitchboardOptions<TPayload, TKey>;
  private store = new Map<string, any>();

  constructor(routes: SwitchboardRoutes<TPayload, TKey>, options: SwitchboardOptions<TPayload, TKey>) {
    this.routes = routes;
    this.options = options;
    // Bus adapter is injected via options (routes are pure by default; if a
    // handler needs to reply through the bus it can use ctx.bus).
    this.bus = (options as unknown as { bus?: BusAdapter }).bus ?? ({} as BusAdapter);
  }

  async route(p: TPayload): Promise<SwitchboardResult> {
    const key = this.options.selectKey(p);
    const handler = (this.routes as Record<string, SwitchboardRoute<TPayload>>)[key] ?? (this.routes as Record<string, SwitchboardRoute<TPayload>>).default;

    if (!handler) {
      if (this.options.onUnmatched) this.options.onUnmatched(p, key);
      return { success: false, matchedKey: null, unmatched: true, result: undefined };
    }

    const ctx: SwitchboardContext<TPayload> = {
      p,
      reply: async (data: unknown) => {
        // Where the bus is wired, replies go back on a sub-rt keyed by the p.
        return this.bus?.sendsub?.(`reply:${String(key)}`, undefined, data) ?? undefined;
      },
      store: this.store,
      bus: this.bus,
    };

    try {
      const result = await handler(p, ctx);
      return { success: true, matchedKey: key, unmatched: false, result };
    } catch (err) {
      return { success: false, matchedKey: key, unmatched: false, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  keys(): TKey[] {
    return Object.keys(this.routes).filter((k) => k !== "default") as TKey[];
  }
}
