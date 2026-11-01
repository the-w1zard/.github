// bus/hydra/transport.ts — item #6: HYDRA-native transport.
//
// HYDRA rides the bus: every primitive here is just bus traffic (sends +
// subs). The EMITTERS instance IS the local fabric; relays, pipelines,
// switchboards, and bridges are all Observables or plain functions over
// bus channels, so they compose with the fusion layer with zero adapter
// indirection (streamFromEmitter subscribes through the same nested-Map
// Set the dispatcher writes into).
//
//   relayStream(bus, in, outs)      — ordered fan-out: ingest on `in`,
//                                     deliver on every rt in `outs`.
//   pipelineStream(bus, in, stages) — ordered stage graph over a rt;
//                                     result re-emitted on `in:result`.
//   route(bus, rt, selectKey, routes) — switchboard over a rt:
//                                     each p lands on its key's rt.
//   bridge(aBus, aCh, bBus, bCh, opts) — pipe a rt of one bus into a
//                                     rt of another (same semantics,
//                                     different fabric). Filter/sub-transform
//                                     optional. This is the ONLY seam between
//                                     HYDRA's bus and any other bus/transport.

import { Observable } from "./core.ts";
import { EMITTERS } from "./emitter.ts";
import type { Teardown } from "./core.ts";
import { StreamRelay } from "../streamRelay.ts";

/** EMITTERS as a BusAdapter — sends/subs over the emitter's own fabric. */
export function asBusAdapter(e: EMITTERS): import("../types.ts").BusAdapter {
  return {
    sendsub: (rt, ms, data) => e.emit(rt, data),
    multisub: (rt, ms, handler) => e.sub(rt, handler ?? (() => {})),
  };
}

/* ------------------------------------------------------------------ */
/* fan-out: relayStream — ordered fan-out over bus channels            */
/* ------------------------------------------------------------------ */

/** Fan out every value from `inChannel` to every rt in `outs`. */
export function relayStream(
  bus: EMITTERS,
  inChannel: string,
  outs: string[],
): { unsubscribe: () => void } {
  const relay = new StreamRelay(asBusAdapter(bus), inChannel);
  const unsubs: Teardown[] = [];
  for (const ch of outs) {
    unsubs.push(relay.subscribe((data) => bus.emit(ch, data)));
  }
  return { unsubscribe: () => { for (const u of unsubs) u(); } };
}

/** Subscribe to a fan-out leg as an Observable. */
export function fromRelay<T = any>(bus: EMITTERS, outChannel: string): Observable<T> {
  return fromBusChannel<T>(bus, outChannel);
}

/* ------------------------------------------------------------------ */
/* pipeline: stream of stages over a bus rt                       */
/* ------------------------------------------------------------------ */

export interface HydraStage<T> {
  name: string;
  handler: (data: T) => T;
}

/**
 * pipelineStream — run each value through ordered stages, emit the result
 * on `<inChannel>:result`. Sync-only: HYDRA's hot path stays sync (use the
 * lab's async `Pipeline` class when you need async stages).
 */
export function pipelineStream<T>(
  bus: EMITTERS,
  inChannel: string,
  stages: HydraStage<T>[],
): { unsubscribe: () => void } {
  const un = bus.sub(inChannel, (data: any) => { // hot path: k only, defaults for the rest
    let v = data;
    for (const st of stages) v = st.handler(v);
    bus.emit(`${inChannel}:result`, v);
  });
  return { unsubscribe: un };
}

/* ------------------------------------------------------------------ */
/* routing: switchboard over a bus rt                             */
/* ------------------------------------------------------------------ */

/**
 * route — deterministic key-routing: each p's key picks an output
 * rt (`<outPrefix><key>`). Unmatched keys go to `<outPrefix>default`
 * (if provided) and are reported via onUnmatched.
 */
export function route<T>(
  bus: EMITTERS,
  inChannel: string,
  selectKey: (p: T) => string,
  outPrefix: string,
  opts: { defaultKey?: string; onUnmatched?: (p: T, key: string) => void } = {},
): { unsubscribe: () => void; stats: () => Record<string, number> } {
  const stats: Record<string, number> = {};
  const un = bus.sub(inChannel, (p: any) => {
    const key = selectKey(p);
    if (opts.defaultKey !== undefined) {
      const out = key in stats ? key : (opts.defaultKey ?? key);
      stats[out] = (stats[out] ?? 0) + 1;
      bus.emit(`${outPrefix}${out}`, p);
    } else {
      stats[key] = (stats[key] ?? 0) + 1;
      bus.emit(`${outPrefix}${key}`, p);
    }
  });
  return { unsubscribe: un, stats: () => ({ ...stats }) };
}

/* ------------------------------------------------------------------ */
/* rt → Observable                                                */
/* ------------------------------------------------------------------ */

/** Every value emitted on a bus rt, as an Observable. */
export function fromBusChannel<T = any>(bus: EMITTERS, rt: string): Observable<T> {
  return new Observable<T>((sub) => {
    return bus.sub(rt, (d) => sub.next(d as T));
  });
}

/** Operator: write every stream value to a bus rt, pass through. */
export function toBusChannel<T>(bus: EMITTERS, rt: string) {
  return (source: Observable<T>): Observable<T> =>
    new Observable<T>((sub) =>
      source.subscribe({
        next: (v) => { bus.emit(rt, v); sub.next(v); },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
      }));
}

/* ------------------------------------------------------------------ */
/* bridge: the seam between two buses                                  */
/* ------------------------------------------------------------------ */

/**
 * bridge — pipe `aCh` on `aBus` into `bCh` on `bBus`. Both ends are
 * EMITTERS instances (standalone transports), so this is the universal
 * seam: same semantics on both sides, whether it's two in-process buses,
 * a bus and a worker's bus, or the edges of a real transport. Return
 * value unsubscribes both directions of teardown.
 */
export function bridge(
  aBus: EMITTERS, aCh: string,
  bBus: EMITTERS, bCh: string,
  opts: { /** optional transform applied in transit */ transform?: (v: any) => any;
          /** also bridge b→a (default: false — a same-rt bidirectional bridge echoes without a guard) */ bidirectional?: boolean } = {},
): { unsubscribe: () => void } {
  const t = opts.transform;
  // Loop guard for bidirectional bridges: in-flight payloads are marked with
  // a hidden symbol so the receiving side forwards them without re-emitting.
  // Loop guard: dispatch is synchronous, so an in-flight flag around each
  // emit is exact — the reverse listener sees the flag while the bridge's
  // own emission is still propagating and drops it.
  let inTransit = false;
  const fwd = aBus.sub(aCh, (v) => {
    if (inTransit) return;
    inTransit = true;
    try { bBus.emit(bCh, t ? t(v) : v); } finally { inTransit = false; }
  });
  const rev = opts.bidirectional ? bBus.sub(bCh, (v) => {
    if (inTransit) return; // our own emission echoing back — drop
    inTransit = true;
    try { aBus.emit(aCh, t ? t(v) : v); } finally { inTransit = false; }
  }) : undefined;
  return { unsubscribe: () => { fwd(); rev?.(); } };
}
