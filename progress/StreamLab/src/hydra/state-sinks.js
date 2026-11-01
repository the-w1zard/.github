// bus/hydra/state-sinks.ts — Item #2: stream ⇄ state bridges
//
// Two directions, both zero-ceremony:
//
//   stream → state:   toSignal(stream)          — continuous "latest value" holder
//                     toSauron(label, ...)      — writes into the platform signal core
//                                                (setSauron), optionally triggering render
//   state → stream:   fromSignalSurface(...)    — already covered by streamFromSignal in
//                                                streamify.ts
//
// Sauron surface (duck-typed so HYDRA doesn't import the 19k-line core directly):
//   createSignal(key, initial, opts) → resolved key
//   writeSignal(key, value | (prev) => next, source?)
//   readSignal(key)
// The lab stub below matches the pasted signal-core method signatures.
import { Observable } from './core.ts';
// ─── stream → state ─────────────────────────────────────────────────────────
export function toSignal(source, initial, options) {
    let latest = initial;
    let hasEmitted = false;
    const ring = [];
    const changeListeners = new Set();
    const sub = source.subscribe({
        next: (v) => {
            const prev = latest;
            latest = v;
            hasEmitted = true;
            if (options?.history) {
                ring.push(v);
                if (ring.length > options.history)
                    ring.shift();
            }
            if (options?.onChange)
                options.onChange(prev, v);
            for (const fn of changeListeners) {
                try {
                    fn(v, prev);
                }
                catch (e) {
                    console.error('[toSignal listener error]:', e);
                }
            }
        },
        error: (e) => console.error('[toSignal stream error]:', e),
    });
    const _unsub = () => { if (typeof sub === 'function')
        sub();
    else if (sub && sub.unsubscribe)
        sub.unsubscribe(); };
    return {
        get: () => latest,
        peek: () => latest,
        set: (v) => {
            const prev = latest;
            latest = v;
            hasEmitted = true;
            if (options?.history) {
                ring.push(v);
                if (ring.length > options.history)
                    ring.shift();
            }
            if (options?.onChange)
                options.onChange(prev, v);
            for (const fn of changeListeners)
                fn(v, prev);
        },
        onChange(fn) { changeListeners.add(fn); return () => changeListeners.delete(fn); },
        history: () => ring,
        unsubscribe: () => { if (typeof sub === 'function')
            sub();
        else if (sub && sub.unsubscribe)
            sub.unsubscribe(); },
    };
}
/**
 * Writes every stream value into the Sauron signal core via setSauron.
 * Mirrors the platform operator signature:
 *   toSauron(label, trip, sub, ch, triggerRender)
 * Here as a sink: toSauron(sauron, label, opts) returns an Operator.
 * setSauron(label, value, triggerRender, trip, sub, ch) — duck-typed:
 * pass a `set` fn if your core's signature differs.
 */
export function toSauron(sauron, label, options = {}) {
    const triggerRender = options.triggerRender !== false;
    const set = options.set ?? ((l, v) => {
        // platform default: create-if-missing then write
        try {
            sauron.readSignal(l);
        }
        catch { /* not created */ }
        sauron.writeSignal(l, v);
    });
    return (source) => new Observable((sub) => source.subscribe({
        next: (v) => {
            try {
                set(label, v, triggerRender);
            }
            catch (e) {
                sub.error(e);
                return;
            }
            sub.next(v);
        },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
    }));
}
// ─── Lab stub: matches the pasted signal-core surface for tests ─────────────
export class SauronStub {
    _state = new Map();
    _listeners = new Map();
    renderInvalidations = 0;
    createSignal(key, initial) {
        const rk = String(key);
        if (!this._state.has(rk)) {
            this._state.set(rk, typeof initial === 'function' ? initial() : initial);
        }
        return rk;
    }
    writeSignal(key, value) {
        const rk = String(key);
        if (!this._state.has(rk))
            this.createSignal(rk);
        const prev = this._state.get(rk);
        const next = typeof value === 'function' ? value(prev) : value;
        if (Object.is(prev, next))
            return;
        this._state.set(rk, next);
        const ls = this._listeners.get(rk);
        if (ls)
            for (const fn of ls)
                fn(next);
        this.renderInvalidations++;
    }
    readSignal(key) {
        return this._state.get(String(key));
    }
    // subscribe surface (the platform's subSauron shape, duck-typed for tests)
    subscribe(key, fn) {
        const rk = String(key);
        if (!this._listeners.has(rk))
            this._listeners.set(rk, new Set());
        this._listeners.get(rk).add(fn);
        return () => this._listeners.get(rk)?.delete(fn);
    }
}
