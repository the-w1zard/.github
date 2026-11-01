// bus/hydra/streamify.ts — item #1: universal streamify.
// streamFrom(any) → Observable. Zero-cost path for the emitter: we subscribe
// through the SAME nested-Map Set the emitter dispatches into, so there is no
// wrapper object between the hot loop and the subscriber.
import { Observable } from "./core.ts";
import { emitters } from "./emitter.ts";
/* ─── emitter → Observable (zero-cost path) ───
 * Subscribes directly into the emitter's listener Set for the rt.
 * Cold per subscription (each subscriber gets its own Set entry); complete
 * is not modeled by the emitter — it's a hot bus, so we never complete. */
export function streamFromEmitter(bus, ch) {
    const e = bus ?? emitters;
    const quad = ch.k;
    const trip = ch.sl ?? e.CH_3;
    const subc = ch.ms ?? e.CH_2;
    const root = ch.rt ?? e.CH_1;
    return new Observable((sub) => {
        return e.sub(quad, (data) => sub.next(data), trip, subc, root);
    });
}
export function streamFromSignal(sauron, key) {
    const rk = sauron.resolveKey ? sauron.resolveKey(key) : key;
    return new Observable((sub) => {
        const current = sauron.readSignal(rk);
        if (current !== undefined)
            sub.next(current);
        return sauron.subscribeSignal(rk, (v) => sub.next(v));
    });
}
/* ─── anything → Observable (the universal front door) ─── */
export function streamFrom(src) {
    // already an Observable
    if (src instanceof Observable)
        return src;
    // EMITTERS instance itself isn't a source, but EmitterChain-shaped objects
    // (duck-typed: has .sub and .emit) are
    if (typeof src?.sub === "function" && typeof src?.emit === "function" && typeof src?.CH_1 === "string") {
        return new Observable((sub) => src.sub("*", (d) => sub.next(d), src.CH_3, src.CH_2, src.CH_1));
    }
    // signal surface (duck-typed: has readSignal + subscribeSignal)
    if (typeof src?.readSignal === "function" && typeof src?.subscribeSignal === "function") {
        throw new Error("streamFrom: signal source needs its key — use streamFromSignal(sauron, key)");
    }
    // Promise
    if (typeof src?.then === "function") {
        return new Observable((sub) => {
            let alive = true;
            src.then((v) => { if (alive) {
                sub.next(v);
                sub.complete();
            } }, (e) => { if (alive)
                sub.error(e); });
            return () => { alive = false; };
        });
    }
    // Web ReadableStream
    if (typeof src?.getReader === "function") {
        return new Observable((sub) => {
            const reader = src.getReader();
            let alive = true;
            const pump = () => {
                reader.read().then((r) => {
                    if (!alive)
                        return;
                    if (r.done) {
                        sub.complete();
                        return;
                    }
                    sub.next(r.value);
                    pump();
                }, (e) => { if (alive)
                    sub.error(e); });
            };
            pump();
            return () => { alive = false; try {
                reader.cancel();
            }
            catch { /* noop */ } };
        });
    }
    // syncStream duplex shape ({ sub, send })
    if (typeof src?.sub?.pipeTo === "function") {
        return streamFrom(src.sub);
    }
    // AsyncIterable
    if (typeof src?.[Symbol.asyncIterator] === "function") {
        return new Observable((sub) => {
            let alive = true;
            (async () => {
                try {
                    for await (const v of src) {
                        if (!alive)
                            return;
                        sub.next(v);
                    }
                    if (alive)
                        sub.complete();
                }
                catch (e) {
                    if (alive)
                        sub.error(e);
                }
            })();
            return () => { alive = false; };
        });
    }
    // sync Iterable / Array
    if (typeof src?.[Symbol.iterator] === "function") {
        return new Observable((sub) => {
            try {
                for (const v of src)
                    sub.next(v);
                sub.complete();
            }
            catch (e) {
                sub.error(e);
            }
        });
    }
    // Node EventEmitter-ish (on/off)
    if (typeof src?.on === "function" && typeof src?.off === "function") {
        return new Observable((sub) => {
            const handler = (v) => sub.next(v);
            src.on("data", handler);
            return () => src.off("data", handler);
        });
    }
    throw new Error(`streamFrom: unsupported source ${Object.prototype.toString.call(src)}`);
}
/* ─── Observable → emitter (sink side of the same seam) ─── */
export function streamToEmitter(obs, bus, ch) {
    const e = bus ?? emitters;
    return obs.subscribe({
        next: (v) => {
            e.send(v, ch.k, ch.sl ?? e.CH_3, ch.ms ?? e.CH_2, ch.rt ?? e.CH_1).sendSync();
        },
        error: () => { }, // emitter has no error model; drop
        complete: () => { },
    });
}
