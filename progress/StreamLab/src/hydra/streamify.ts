// bus/hydra/streamify.ts — item #1: universal streamify.
// streamFrom(any) → Observable. Zero-cost path for the emitter: we subscribe
// through the SAME nested-Map Set the emitter dispatches into, so there is no
// wrapper object between the hot loop and the subscriber.

import { Observable } from "./core.ts";
import type { Teardown } from "./core.ts";
import { EMITTERS, emitters } from "./emitter.ts";

export interface EmitterChannel {
  /** route channels — mirrors EMITTERS.send/emit args, all optional except quad */
  k: string;
  sl?: string;
  ms?: string;
  rt?: string;
}

/** Type brand so callers get autocomplete + exhaustiveness without a wrapper. */
export interface StreamSourceHint<T = unknown> {
  kind: "emitter" | "signal" | "stream" | "async" | "promise" | "iterable";
  ref: T;
}

/* ─── emitter → Observable (zero-cost path) ───
 * Subscribes directly into the emitter's listener Set for the rt.
 * Cold per subscription (each subscriber gets its own Set entry); complete
 * is not modeled by the emitter — it's a hot bus, so we never complete. */
export function streamFromEmitter(
  bus: EMITTERS | undefined,
  ch: EmitterChannel
): Observable<any> {
  const e = bus ?? emitters;
  const quad = ch.k;
  const trip = ch.sl ?? e.CH_3;
  const subc = ch.ms ?? e.CH_2;
  const root = ch.rt ?? e.CH_1;
  return new Observable<any>((sub) => {
    return e.sub(quad, (data) => sub.next(data), trip, subc, root);
  });
}

/* ─── signal → Observable (stateful hot stream, replays current value) ─── */
export interface SignalSurface {
  readSignal<T = any>(key: any): T | undefined;
  subscribeSignal<T = any>(key: any, fn: (value: T, source?: string) => void): () => void;
  resolveKey?(key: any): string;
}

export function streamFromSignal(sauron: SignalSurface, key: any): Observable<any> {
  const rk = sauron.resolveKey ? sauron.resolveKey(key) : key;
  return new Observable<any>((sub) => {
    const current = sauron.readSignal(rk);
    if (current !== undefined) sub.next(current);
    return sauron.subscribeSignal(rk, (v) => sub.next(v));
  });
}

/* ─── anything → Observable (the universal front door) ─── */
export function streamFrom(src: any): Observable<any> {
  // already an Observable
  if (src instanceof Observable) return src;

  // EMITTERS instance itself isn't a source, but EmitterChain-shaped objects
  // (duck-typed: has .sub and .emit) are
  if (typeof src?.sub === "function" && typeof src?.emit === "function" && typeof src?.CH_1 === "string") {
    return new Observable<any>((sub) => src.sub("*" as any, (d: any) => sub.next(d), src.CH_3, src.CH_2, src.CH_1));
  }

  // signal surface (duck-typed: has readSignal + subscribeSignal)
  if (typeof src?.readSignal === "function" && typeof src?.subscribeSignal === "function") {
    throw new Error("streamFrom: signal source needs its key — use streamFromSignal(sauron, key)");
  }

  // Promise
  if (typeof src?.then === "function") {
    return new Observable<any>((sub) => {
      let alive = true;
      src.then(
        (v: any) => { if (alive) { sub.next(v); sub.complete(); } },
        (e: any) => { if (alive) sub.error(e); }
      );
      return () => { alive = false; };
    });
  }

  // Web ReadableStream
  if (typeof src?.getReader === "function") {
    return new Observable<any>((sub) => {
      const reader = src.getReader();
      let alive = true;
      const pump = () => {
        reader.read().then(
          (r: any) => {
            if (!alive) return;
            if (r.done) { sub.complete(); return; }
            sub.next(r.value);
            pump();
          },
          (e: any) => { if (alive) sub.error(e); }
        );
      };
      pump();
      return () => { alive = false; try { reader.cancel(); } catch { /* noop */ } };
    });
  }

  // syncStream duplex shape ({ sub, send })
  if (typeof src?.sub?.pipeTo === "function") {
    return streamFrom(src.sub);
  }

  // AsyncIterable
  if (typeof src?.[Symbol.asyncIterator as any] === "function") {
    return new Observable<any>((sub) => {
      let alive = true;
      (async () => {
        try {
          for await (const v of src) {
            if (!alive) return;
            sub.next(v);
          }
          if (alive) sub.complete();
        } catch (e) {
          if (alive) sub.error(e);
        }
      })();
      return () => { alive = false; };
    });
  }

  // sync Iterable / Array
  if (typeof src?.[Symbol.iterator as any] === "function") {
    return new Observable<any>((sub) => {
      try {
        for (const v of src) sub.next(v);
        sub.complete();
      } catch (e) {
        sub.error(e);
      }
    });
  }

  // Node EventEmitter-ish (on/off)
  if (typeof src?.on === "function" && typeof src?.off === "function") {
    return new Observable<any>((sub) => {
      const handler = (v: any) => sub.next(v);
      src.on("data", handler);
      return () => src.off("data", handler);
    });
  }

  throw new Error(`streamFrom: unsupported source ${Object.prototype.toString.call(src)}`);
}

/* ─── Observable → emitter (sink side of the same seam) ─── */
export function streamToEmitter(
  obs: Observable<any>,
  bus: EMITTERS | undefined,
  ch: EmitterChannel
): Teardown {
  const e = bus ?? emitters;
  return obs.subscribe({
    next: (v) => {
      e.send(v, ch.k, ch.sl ?? e.CH_3, ch.ms ?? e.CH_2, ch.rt ?? e.CH_1).sendSync();
    },
    error: () => {}, // emitter has no error model; drop
    complete: () => {},
  });
}
