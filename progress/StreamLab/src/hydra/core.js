// bus/hydra/core.ts — minimal Observable substrate for the fusion layer.
// Mirrors HYDRA core semantics: function-or-observer subscribe, teardown,
// complete/error latching. Swap this file for the real bus/hydra/core.ts when
// this code moves into the monorepo — the rest of hydra/ imports from here.
export class Observable {
    _sub;
    constructor(sub) {
        this._sub = sub;
    }
    subscribe(sub) {
        let done = false;
        const teardowns = [];
        const runTeardowns = () => {
            for (const t of teardowns.splice(0)) {
                try {
                    t();
                }
                catch { /* noop */ }
            }
        };
        const nextFn = typeof sub === "function" ? sub : sub.next;
        const errorFn = typeof sub === "function" ? undefined : sub.error;
        const completeFn = typeof sub === "function" ? undefined : sub.complete;
        const obs = {
            next: (v) => {
                if (done || !nextFn)
                    return;
                try {
                    nextFn(v);
                }
                catch {
                    done = true;
                    runTeardowns();
                }
            },
            error: (e) => { if (done)
                return; done = true; if (errorFn)
                try {
                    errorFn(e);
                }
                catch { /* noop */ } runTeardowns(); },
            complete: () => { if (done)
                return; done = true; if (completeFn)
                completeFn(); runTeardowns(); },
        };
        const t = this._sub(obs);
        if (typeof t === "function")
            teardowns.push(t);
        return () => { done = true; runTeardowns(); };
    }
    pipe(...ops) {
        let acc = this;
        for (const op of ops)
            acc = op(acc);
        return acc;
    }
    toPromise() {
        return new Promise((res, rej) => {
            let last;
            this.subscribe({ next: (v) => (last = v), error: rej, complete: () => res(last) });
        });
    }
}
