// bus/hydra/fused-operators.ts — sync hot-path ops with __fuse hooks.
// Inside a fused chain: inline in the dispatch loop. Unfused: degrade to a
// plain wrapping operator, so every op here is usable standalone.
import { Observable } from "./core.ts";
import { FUSED_SKIP } from "./fusion.ts";
function fused(hook, plain) {
    const op = plain;
    op.__fuse = hook;
    return op;
}
/* ─── map ─── */
export const fmap = (fn) => {
    let i = 0;
    return fused(() => (v) => fn(v, i++), (source) => new Observable((sub) => {
        let j = 0;
        return source.subscribe({
            next: (v) => { try {
                sub.next(fn(v, j++));
            }
            catch (e) {
                sub.error(e);
            } },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
        });
    }));
};
/* ─── filter ─── */
export const ffilter = (pred) => {
    let i = 0;
    return fused(() => (v) => (pred(v, i++) ? v : FUSED_SKIP), (source) => new Observable((sub) => {
        let j = 0;
        return source.subscribe({
            next: (v) => {
                let ok = false;
                try {
                    ok = pred(v, j++);
                }
                catch (e) {
                    sub.error(e);
                    return;
                }
                if (ok)
                    sub.next(v);
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
        });
    }));
};
/* ─── tap ─── */
export const ftap = (fn) => {
    return fused(() => (v) => { fn(v); return v; }, (source) => new Observable((sub) => source.subscribe({
        next: (v) => { try {
            fn(v);
        }
        catch (e) {
            sub.error(e);
            return;
        } sub.next(v); },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    })));
};
/* ─── scan ─── */
export const fscan = (fn, seed) => {
    let acc = seed;
    return fused(() => (v) => { acc = fn(acc, v); return acc; }, (source) => new Observable((sub) => source.subscribe({
        next: (v) => { try {
            acc = fn(acc, v);
        }
        catch (e) {
            sub.error(e);
            return;
        } sub.next(acc); },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    })));
};
/* ─── distinctUntilChanged ─── */
export const fdistinct = (eq) => {
    let has = false;
    let prev;
    return fused(() => (v) => {
        if (has && (eq ? eq(prev, v) : prev === v))
            return FUSED_SKIP;
        has = true;
        prev = v;
        return v;
    }, (source) => new Observable((sub) => source.subscribe({
        next: (v) => {
            if (has && (eq ? eq(prev, v) : prev === v))
                return;
            has = true;
            prev = v;
            sub.next(v);
        },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    })));
};
/* ═══════════════════════════════════════════════════════════════════
   Batch #4 — missing daily-use operators, fusable where sync-possible.
   Async operators (time/flatten) ship as plain operators only.
   ═══════════════════════════════════════════════════════════════════ */
/* ─── pluck ─── (fusable) */
export const fpluck = (key) => {
    return fused(() => (v) => v?.[key], (source) => new Observable((sub) => source.subscribe({
        next: (v) => sub.next(v?.[key]),
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    })));
};
/* ─── count ─── (complete-sink: value emitted at completion) ─── */
export const fcount = (pred) => {
    let n = 0;
    const op = (source) => new Observable((sub) => source.subscribe({
        next: (v) => { if (!pred || pred(v))
            n++; },
        error: (e) => sub.error(e),
        complete: () => sub.next(n),
    }));
    op.__fuse = () => (v) => { if (!pred || pred(v))
        n++; return FUSED_SKIP; };
    op.__fuseComplete = () => (sub) => sub.next(n);
    return op;
};
/* ─── every ─── (complete-sink) ─── */
export const fevery = (pred) => {
    let all = true;
    const op = (source) => new Observable((sub) => source.subscribe({
        next: (v) => { if (!pred(v))
            all = false; },
        error: (e) => sub.error(e),
        complete: () => sub.next(all),
    }));
    op.__fuse = () => (v) => { if (!pred(v))
        all = false; return FUSED_SKIP; };
    op.__fuseComplete = () => (sub) => sub.next(all);
    return op;
};
/* ─── find ─── (fusable — first match emitted inline, then completes) ─── */
export const ffind = (pred) => {
    let done = false;
    return fused(() => (v) => {
        if (done)
            return FUSED_SKIP;
        if (pred(v)) {
            done = true;
            return v;
        }
        return FUSED_SKIP;
    }, (source) => new Observable((sub) => source.subscribe({
        next: (v) => { if (!done && pred(v)) {
            done = true;
            sub.next(v);
            sub.complete();
        } },
        error: (e) => sub.error(e),
        complete: () => { if (!done) {
            sub.next(undefined);
            sub.complete();
        } },
    })));
};
/* ─── pairwise ─── (fusable) */
export const fpairwise = () => {
    let prev;
    let has = false;
    return fused(() => (v) => {
        if (!has) {
            has = true;
            prev = v;
            return FUSED_SKIP;
        }
        const pair = [prev, v];
        prev = v;
        return pair;
    }, (source) => new Observable((sub) => source.subscribe({
        next: (v) => {
            if (!has) {
                has = true;
                prev = v;
                return;
            }
            const pair = [prev, v];
            prev = v;
            sub.next(pair);
        },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    })));
};
/* ─── distinct by key ─── (fusable) */
export const fdistinctKey = (key) => {
    const seen = new Set();
    return fused(() => (v) => {
        const k = key(v);
        if (seen.has(k))
            return FUSED_SKIP;
        seen.add(k);
        return v;
    }, (source) => new Observable((sub) => source.subscribe({
        next: (v) => {
            const k = key(v);
            if (seen.has(k))
                return;
            seen.add(k);
            sub.next(v);
        },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    })));
};
/* ─── skipWhile ─── (fusable) */
export const fskipWhile = (pred) => {
    let skipping = true;
    return fused(() => (v) => {
        if (skipping && pred(v))
            return FUSED_SKIP;
        skipping = false;
        return v;
    }, (source) => new Observable((sub) => source.subscribe({
        next: (v) => {
            if (skipping && pred(v))
                return;
            skipping = false;
            sub.next(v);
        },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    })));
};
/* ─── shareLatest: multicast, replays latest to new subscribers ─── */
export const shareLatest = (source) => {
    let latest;
    let has = false;
    let subs = 0;
    let teardown;
    const observers = [];
    return new Observable((sub) => {
        observers.push(sub);
        subs++;
        if (has)
            sub.next(latest);
        if (subs === 1) {
            teardown = source.subscribe({
                next: (v) => { latest = v; has = true; for (const o of observers.slice())
                    o.next(v); },
                error: (e) => { for (const o of observers.slice())
                    o.error(e); },
                complete: () => { for (const o of observers.slice())
                    o.complete(); },
            });
        }
        return () => {
            const i = observers.indexOf(sub);
            if (i >= 0)
                observers.splice(i, 1);
            subs--;
            if (subs === 0 && teardown) {
                teardown();
                teardown = undefined;
            }
        };
    });
};
/* ─── observeOn / subscribeOn (scheduler-aware; plain only) ─── */
export function observeOn(sched, delayMs = 0) {
    return (source) => new Observable((sub) => source.subscribe({
        next: (v) => { sched.schedule(() => { try {
            sub.next(v);
        }
        catch { /* noop */ } }, delayMs); },
        error: (e) => sched.schedule(() => sub.error(e), delayMs),
        complete: () => sched.schedule(() => sub.complete(), delayMs),
    }));
}
export function subscribeOn(sched, delayMs = 0) {
    return (source) => new Observable((sub) => {
        const task = sched.schedule(() => { source.subscribe(sub); }, delayMs);
        return () => task.cancel();
    });
}
/* ─── delayWhen: delay each value by an inner observable of its own ─── */
export function delayWhen(delayFn) {
    return (source) => new Observable((sub) => {
        let active = 0;
        let sourceDone = false;
        const maybeComplete = () => { if (sourceDone && active === 0)
            sub.complete(); };
        const teardown = source.subscribe({
            next: (v) => {
                active++;
                delayFn(v).subscribe({
                    next: () => { },
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
export function retryWhen(notifFn, maxAttempts = Infinity) {
    return (source) => new Observable((sub) => {
        let attempt = 0;
        let upstreamTeardown;
        const errs = new Observable((es) => {
            const attemptOnce = () => {
                attempt++;
                if (attempt > maxAttempts) {
                    sub.error(new Error(`retryWhen: exceeded maxAttempts (${maxAttempts})`));
                    return;
                }
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
export function timeoutWith(ms, fallback, sched) {
    return (source) => new Observable((sub) => {
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
export function partition(source, pred) {
    return [source.pipe(ffilter(pred)), source.pipe(ffilter((v) => !pred(v)))];
}
