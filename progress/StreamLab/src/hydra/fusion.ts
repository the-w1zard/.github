// bus/hydra/fusion.ts — operator fusion, the perf headliner.
// A fusable chain compiles into ONE dispatch loop instead of N Observables +
// N Subscribers. Fusion covers the maximal prefix of fusable ops; the tail
// pipes normally and is subscribed once.

import { Observable } from "./core.ts";
import type { Operator, Teardown } from "./core.ts";

/** Built by `__fuse()` on an operator: one value's work in the loop. */
export type FuseStep = (v: any) => any;
/** Built by `__fuseComplete()` on complete-sink operators (count/every). */
export type FuseComplete = (sub: { next(v: any): void }) => void;

export type AnyOp = Operator<any, any> & {
  __fuse?: () => FuseStep;
  __fuseComplete?: () => FuseComplete;
};

export function fuse(source: Observable<any>, ops: AnyOp[]): Observable<any> {
  let split = 0;
  while (split < ops.length && typeof ops[split]?.__fuse === "function") split++;

  const prefix = ops.slice(0, split);
  const tail = ops.slice(split);

  const fusedSource: Observable<any> = new Observable((sub) => {
    const steps: any[] = prefix.map((op) => op.__fuse?.() as any);
    const completes = prefix.map((op) => op.__fuseComplete?.()).filter(Boolean) as FuseComplete[];

    const dispatch = (input: any): void => {
      let v = input;
      try {
        for (const step of steps) {
          const out = step(v);
          if (out === FUSED_SKIP) return;
          if (out !== FUSED_PASS) v = out;
        }
        sub.next(v);
      } catch (e) {
        sub.error(e);
      }
    };

    const upstream: Teardown = source.subscribe({
      next: dispatch,
      error: (e) => sub.error(e),
      complete: () => {
        // complete-sink operators (count/every) fire their pending value first
        for (const c of completes) c(sub);
        sub.complete();
      },
    });
    return upstream;
  });

  return tail.length === 0 ? fusedSource : fusedSource.pipe(...(tail as Operator<any, any>[]));
}

/** Filter didn't pass; stop dispatch for this value. */
export const FUSED_SKIP = Symbol("hydra.fuse.skip");
/** Pass-through sentinel (undefined step result = unchanged value). */
export const FUSED_PASS = undefined;

/** pipe() that fuses automatically. */
export function pipeFused(source: Observable<any>, ...ops: AnyOp[]): Observable<any> {
  return fuse(source, ops);
}

/** Add .pipeFused to an Observable class without touching .pipe. */
export function attachPipeFused(ObservableClass: { prototype: any }): void {
  ObservableClass.prototype.pipeFused = function (this: Observable<any>, ...ops: AnyOp[]) {
    return fuse(this, ops);
  };
}
