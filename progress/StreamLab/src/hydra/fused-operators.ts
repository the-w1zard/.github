// bus/hydra/fused-operators.ts — sync hot-path ops with __fuse hooks.
// Inside a fused chain: inline in the dispatch loop. Unfused: degrade to a
// plain wrapping operator, so every op here is usable standalone.

import { Observable } from "./core.ts";
import type { Operator, Teardown, Observer } from "./core.ts";
import { FUSED_SKIP } from "./fusion.ts";

type AnyOp<A, B> = Operator<A, B> & { __fuse?: () => (v: any) => any; __fuseComplete?: () => (sub: { next(v: any): void }) => void };

function fused<A, B>(hook: () => (v: A) => any, plain: Operator<A, B>): Operator<A, B> {
  const op = plain as AnyOp<A, B>;
  op.__fuse = hook as any;
  return op;
}

/* ─── map ─── */
export const fmap = <A, B>(fn: (a: A, i: number) => B): Operator<A, B> => {
  let i = 0;
  return fused(
    () => (v: A) => fn(v, i++),
    (source) =>
      new Observable<B>((sub) => {
        let j = 0;
        return source.subscribe({
          next: (v) => { try { sub.next(fn(v, j++)); } catch (e) { sub.error(e); } },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        });
      })
  );
};

/* ─── filter ─── */
export const ffilter = <T>(pred: (v: T, i: number) => boolean): Operator<T, T> => {
  let i = 0;
  return fused(
    () => (v: T) => (pred(v, i++) ? v : FUSED_SKIP),
    (source) =>
      new Observable<T>((sub) => {
        let j = 0;
        return source.subscribe({
          next: (v) => {
            let ok = false;
            try { ok = pred(v, j++); } catch (e) { sub.error(e); return; }
            if (ok) sub.next(v);
          },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        });
      })
  );
};

/* ─── tap ─── */
export const ftap = <T>(fn: (v: T) => void): Operator<T, T> => {
  return fused(
    () => (v: T) => { fn(v); return v; },
    (source) =>
      new Observable<T>((sub) =>
        source.subscribe({
          next: (v) => { try { fn(v); } catch (e) { sub.error(e); return; } sub.next(v); },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        })
      )
  );
};

/* ─── scan ─── */
export const fscan = <A, B>(fn: (acc: B, a: A) => B, seed: B): Operator<A, B> => {
  let acc = seed;
  return fused(
    () => (v: A) => { acc = fn(acc, v); return acc; },
    (source) =>
      new Observable<B>((sub) =>
        source.subscribe({
          next: (v) => { try { acc = fn(acc, v); } catch (e) { sub.error(e); return; } sub.next(acc); },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        })
      )
  );
};

/* ─── distinctUntilChanged ─── */
export const fdistinct = <T>(eq?: (a: T, b: T) => boolean): Operator<T, T> => {
  let has = false;
  let prev: T;
  return fused(
    () => (v: T) => {
      if (has && (eq ? eq(prev, v) : prev === v)) return FUSED_SKIP;
      has = true;
      prev = v;
      return v;
    },
    (source) =>
      new Observable<T>((sub) =>
        source.subscribe({
          next: (v) => {
            if (has && (eq ? eq(prev, v) : prev === v)) return;
            has = true;
            prev = v;
            sub.next(v);
          },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        })
      )
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Batch #4 — missing daily-use operators, fusable where sync-possible.
   Async operators (time/flatten) ship as plain operators only.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── pluck ─── (fusable) */
export const fpluck = <T, K extends keyof T>(key: K): Operator<T, T[K]> => {
  return fused(
    () => (v: T) => v?.[key],
    (source) =>
      new Observable<T[K]>((sub) =>
        source.subscribe({
          next: (v) => sub.next((v as any)?.[key]),
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        })
      )
  );
};

/* ─── count ─── (complete-sink: value emitted at completion) ─── */
export const fcount = <T>(pred?: (v: T) => boolean): Operator<T, number> => {
  let n = 0;
  const op: AnyOp<T, number> = (source) =>
    new Observable<number>((sub) =>
      source.subscribe({
        next: (v) => { if (!pred || pred(v)) n++; },
        error: (e) => sub.error(e),
        complete: () => sub.next(n),
      })
    );
  op.__fuse = () => (v: T) => { if (!pred || pred(v)) n++; return FUSED_SKIP; };
  op.__fuseComplete = () => (sub: any) => sub.next(n);
  return op;
};

/* ─── every ─── (complete-sink) ─── */
export const fevery = <T>(pred: (v: T) => boolean): Operator<T, boolean> => {
  let all = true;
  const op: AnyOp<T, boolean> = (source) =>
    new Observable<boolean>((sub) =>
      source.subscribe({
        next: (v) => { if (!pred(v)) all = false; },
        error: (e) => sub.error(e),
        complete: () => sub.next(all),
      })
    );
  op.__fuse = () => (v: T) => { if (!pred(v)) all = false; return FUSED_SKIP; };
  op.__fuseComplete = () => (sub: any) => sub.next(all);
  return op;
};

/* ─── find ─── (fusable — first match emitted inline, then completes) ─── */
export const ffind = <T>(pred: (v: T) => boolean): Operator<T, T | undefined> => {
  let done = false;
  return fused(
    () => (v: T) => {
      if (done) return FUSED_SKIP;
      if (pred(v)) { done = true; return v; }
      return FUSED_SKIP;
    },
    (source) =>
      new Observable<T | undefined>((sub) =>
        source.subscribe({
          next: (v) => { if (!done && pred(v)) { done = true; sub.next(v); sub.complete(); } },
          error: (e) => sub.error(e),
          complete: () => { if (!done) { sub.next(undefined); sub.complete(); } },
        })
      )
  );
};

/* ─── pairwise ─── (fusable) */
export const fpairwise = <T>(): Operator<T, [T, T]> => {
  let prev: T;
  let has = false;
  return fused(
    () => (v: T) => {
      if (!has) { has = true; prev = v; return FUSED_SKIP; }
      const pair: [T, T] = [prev, v];
      prev = v;
      return pair;
    },
    (source) =>
      new Observable<[T, T]>((sub) =>
        source.subscribe({
          next: (v) => {
            if (!has) { has = true; prev = v; return; }
            const pair: [T, T] = [prev, v];
            prev = v;
            sub.next(pair);
          },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        })
      )
  );
};

/* ─── distinct by key ─── (fusable) */
export const fdistinctKey = <T>(key: (v: T) => any): Operator<T, T> => {
  const seen = new Set<any>();
  return fused(
    () => (v: T) => {
      const k = key(v);
      if (seen.has(k)) return FUSED_SKIP;
      seen.add(k);
      return v;
    },
    (source) =>
      new Observable<T>((sub) =>
        source.subscribe({
          next: (v) => {
            const k = key(v);
            if (seen.has(k)) return;
            seen.add(k);
            sub.next(v);
          },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        })
      )
  );
};

/* ─── skipWhile ─── (fusable) */
export const fskipWhile = <T>(pred: (v: T) => boolean): Operator<T, T> => {
  let skipping = true;
  return fused(
    () => (v: T) => {
      if (skipping && pred(v)) return FUSED_SKIP;
      skipping = false;
      return v;
    },
    (source) =>
      new Observable<T>((sub) =>
        source.subscribe({
          next: (v) => {
            if (skipping && pred(v)) return;
            skipping = false;
            sub.next(v);
          },
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        })
      )
  );
};

/* ─── shareLatest: multicast, replays latest to new subscribers ─── */
export const shareLatest = <T>(source: Observable<T>): Observable<T> => {
  let latest: T;
  let has = false;
  let subs = 0;
  let teardown: Teardown | undefined;
  const observers: Observer<T>[] = [];
  return new Observable<T>((sub) => {
    observers.push(sub);
    subs++;
    if (has) sub.next(latest);
    if (subs === 1) {
      teardown = source.subscribe({
        next: (v) => { latest = v; has = true; for (const o of observers.slice()) o.next(v); },
        error: (e) => { for (const o of observers.slice()) o.error(e); },
        complete: () => { for (const o of observers.slice()) o.complete(); },
      });
    }
    return () => {
      const i = observers.indexOf(sub);
      if (i >= 0) observers.splice(i, 1);
      subs--;
      if (subs === 0 && teardown) { teardown(); teardown = undefined; }
    };
  });
};

/* ─── observeOn / subscribeOn (scheduler-aware; plain only) ─── */
export function observeOn<T>(sched: { schedule: (fn: () => void, d: number) => { cancel(): void } }, delayMs = 0): Operator<T, T> {
  return (source) =>
    new Observable<T>((sub) =>
      source.subscribe({
        next: (v) => { sched.schedule(() => { try { sub.next(v); } catch { /* noop */ } }, delayMs); },
        error: (e) => sched.schedule(() => sub.error(e), delayMs),
        complete: () => sched.schedule(() => sub.complete(), delayMs),
      })
    );
}

export function subscribeOn<T>(sched: { schedule: (fn: () => void, d: number) => { cancel(): void } }, delayMs = 0): Operator<T, T> {
  return (source) =>
    new Observable<T>((sub) => {
      const task = sched.schedule(() => { source.subscribe(sub); }, delayMs);
      return () => task.cancel();
    });
}

/* ─── delayWhen: delay each value by an inner observable of its own ─── */
export function delayWhen<T>(delayFn: (v: T) => Observable<any>): Operator<T, T> {
  return (source) =>
    new Observable<T>((sub) => {
      let active = 0;
      let sourceDone = false;
      const maybeComplete = () => { if (sourceDone && active === 0) sub.complete(); };
      const teardown = source.subscribe({
        next: (v) => {
          active++;
          delayFn(v).subscribe({
            next: () => {},
            error: (e) => sub.error(e),
            complete: () => { active--; sub.next(v); maybeComplete(); },
          });
        },
        error: (e) => sub.error(e),
        complete: () => { sourceDone = true; maybeComplete(); },
      });
      return teardown;
    });
}

/* ─── retryWhen: defers retry strategy to a stream of error counts ─── */
export function retryWhen<T>(notifFn: (errs: Observable<any>) => Observable<any>, maxAttempts = Infinity): Operator<T, T> {
  return (source) =>
    new Observable<T>((sub) => {
      let attempt = 0;
      let upstreamTeardown: Teardown | undefined;
      const errs: Observable<any> = new Observable<any>((es) => {
        const attemptOnce = () => {
          attempt++;
          if (attempt > maxAttempts) { sub.error(new Error(`retryWhen: exceeded maxAttempts (${maxAttempts})`)); return; }
          upstreamTeardown = source.subscribe({
            next: (v) => sub.next(v),
            error: (e) => es.next(e),
            complete: () => sub.complete(),
          });
        };
        attemptOnce();
        notifFn(errs).subscribe({
          next: () => attemptOnce(),
          error: (e) => sub.error(e),
          complete: () => sub.complete(),
        });
      });
      return errs.subscribe({});
    });
}

/* ─── timeoutWith: timeout to a fallback stream ─── */
export function timeoutWith<T>(ms: number, fallback: Observable<T>, sched: { schedule: (fn: () => void, d: number) => { cancel(): void } }): Operator<T, T> {
  return (source) =>
    new Observable<T>((sub) => {
      let task = sched.schedule(() => {
        upTear();
        fallback.subscribe(sub);
      }, ms);
      const upTear = source.subscribe({
        next: (v) => { task.cancel(); task = sched.schedule(() => { upTear(); fallback.subscribe(sub); }, ms); sub.next(v); },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
      });
      return () => { task.cancel(); upTear(); };
    });
}

/* ─── partition: split a stream into [pass, fail] ─── */
export function partition<T>(source: Observable<T>, pred: (v: T) => boolean): [Observable<T>, Observable<T>] {
  return [source.pipe(ffilter(pred)), source.pipe(ffilter((v: T) => !pred(v)))];
}
