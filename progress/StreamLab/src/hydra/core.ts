// bus/hydra/core.ts — minimal Observable substrate for the fusion layer.
// Mirrors HYDRA core semantics: function-or-observer subscribe, teardown,
// complete/error latching. Swap this file for the real bus/hydra/core.ts when
// this code moves into the monorepo — the rest of hydra/ imports from here.

export type Teardown = () => void;

export interface Observer<T> {
  next(v: T): void;
  error(e: unknown): void;
  complete(): void;
}

export type Subscriber<T> = Partial<Observer<T>>;

export type Operator<A, B> = (source: Observable<A>) => Observable<B>;

export class Observable<T> {
  _sub: (sub: Observer<T>) => Teardown | void;
  constructor(sub: (sub: Observer<T>) => Teardown | void) {
    this._sub = sub;
  }

  subscribe(sub: Subscriber<T> | ((v: T) => void)): Teardown {
    let done = false;
    const teardowns: Teardown[] = [];
    const runTeardowns = () => {
      for (const t of teardowns.splice(0)) { try { t(); } catch { /* noop */ } }
    };
    const nextFn = typeof sub === "function" ? sub : sub.next;
    const errorFn = typeof sub === "function" ? undefined : sub.error;
    const completeFn = typeof sub === "function" ? undefined : sub.complete;
    const obs: Observer<T> = {
      next: (v) => {
        if (done || !nextFn) return;
        try { nextFn(v); } catch { done = true; runTeardowns(); }
      },
      error: (e) => { if (done) return; done = true; if (errorFn) try { errorFn(e); } catch { /* noop */ } runTeardowns(); },
      complete: () => { if (done) return; done = true; if (completeFn) completeFn(); runTeardowns(); },
    };
    const t = this._sub(obs);
    if (typeof t === "function") teardowns.push(t);
    return () => { done = true; runTeardowns(); };
  }

  pipe(...ops: Operator<any, any>[]): Observable<any> {
    let acc: Observable<any> = this;
    for (const op of ops) acc = op(acc);
    return acc;
  }

  toPromise(): Promise<T> {
    return new Promise((res, rej) => {
      let last: T | undefined;
      this.subscribe({ next: (v) => (last = v), error: rej, complete: () => res(last as T) });
    });
  }
}
