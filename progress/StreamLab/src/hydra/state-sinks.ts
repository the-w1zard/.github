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
import type { Observer, Operator, Subscriber } from './core.ts';

export interface SauronSurface {
  createSignal<T>(key: any, initial?: T | (() => T), options?: any): string;
  writeSignal<T>(key: any, value: T | ((prev: T | undefined) => T), source?: string): void;
  readSignal<T>(key: any): T | undefined;
}

export interface ToSignalOptions {
  /** call with (prev, next) on every emission */
  onChange?: (prev: any, next: any) => void;
  /** keep last N values (ring) — default: just latest */
  history?: number;
}

export interface SignalRef<T = any> {
  get(): T | undefined;
  peek(): T | undefined;
  /** write-through: pushes a value into the stream AND updates the holder */
  set(v: T): void;
  onChange(fn: (v: T, prev: T | undefined) => void): () => void;
  history(): readonly T[];
  unsubscribe(): void;
}

// ─── stream → state ─────────────────────────────────────────────────────────
export function toSignal<T>(source: Observable<T>, initial?: T, options?: ToSignalOptions): SignalRef<T> {
  let latest: T | undefined = initial;
  let hasEmitted = false;
  const ring: T[] = [];
  const changeListeners = new Set<(v: T, prev: T | undefined) => void>();
  const sub: unknown = source.subscribe({
    next: (v: T) => {
      const prev = latest;
      latest = v;
      hasEmitted = true;
      if (options?.history) {
        ring.push(v);
        if (ring.length > options.history) ring.shift();
      }
      if (options?.onChange) options.onChange(prev, v);
      for (const fn of changeListeners) {
        try { fn(v, prev); } catch (e) { console.error('[toSignal listener error]:', e); }
      }
    },
    error: (e: unknown) => console.error('[toSignal stream error]:', e),
  });
  const _unsub = () => { if (typeof sub === 'function') sub(); else if (sub && (sub as any).unsubscribe) (sub as any).unsubscribe(); };
  return {
    get: () => latest,
    peek: () => latest,
    set: (v) => {
      const prev = latest;
      latest = v;
      hasEmitted = true;
      if (options?.history) { ring.push(v); if (ring.length > options.history) ring.shift(); }
      if (options?.onChange) options.onChange(prev, v);
      for (const fn of changeListeners) fn(v, prev);
    },
    onChange(fn) { changeListeners.add(fn); return () => changeListeners.delete(fn); },
    history: () => ring,
    unsubscribe: () => { if (typeof sub === 'function') sub(); else if (sub && (sub as any).unsubscribe) (sub as any).unsubscribe(); },
  };
}

// ─── stream → Sauron signal core ────────────────────────────────────────────
export interface ToSauronOptions {
  sl?: string;
  ms?: string;
  rt?: string;
  /** force render invalidation on write (the collider trick). default: true */
  triggerRender?: boolean;
}

/**
 * Writes every stream value into the Sauron signal core via setSauron.
 * Mirrors the platform operator signature:
 *   toSauron(label, trip, sub, ch, triggerRender)
 * Here as a sink: toSauron(sauron, label, opts) returns an Operator.
 * setSauron(label, value, triggerRender, trip, sub, ch) — duck-typed:
 * pass a `set` fn if your core's signature differs.
 */
export function toSauron<T>(
  sauron: SauronSurface,
  label: string,
  options: ToSauronOptions & { set?: (label: string, v: T, triggerRender: boolean) => void } = {},
): Operator<T, T> {
  const triggerRender = options.triggerRender !== false;
  const set = options.set ?? ((l: string, v: T) => {
    // platform default: create-if-missing then write
    try { sauron.readSignal(l); } catch { /* not created */ }
    sauron.writeSignal(l, v);
  });
  return (source: Observable<T>) =>
    new Observable<T>((sub) =>
      source.subscribe({
        next: (v) => {
          try { set(label, v, triggerRender); } catch (e) { sub.error(e); return; }
          sub.next(v);
        },
        error: (e) => sub.error(e),
        complete: () => sub.complete(),
      })
    );
}

// ─── Lab stub: matches the pasted signal-core surface for tests ─────────────
export class SauronStub implements SauronSurface {
  private _state = new Map<string, any>();
  private _listeners = new Map<string, Set<(v: any) => void>>();
  renderInvalidations = 0;

  createSignal<T>(key: any, initial?: T | (() => T)): string {
    const rk = String(key);
    if (!this._state.has(rk)) {
      this._state.set(rk, typeof initial === 'function' ? (initial as () => T)() : initial);
    }
    return rk;
  }
  writeSignal<T>(key: any, value: T | ((prev: T | undefined) => T)): void {
    const rk = String(key);
    if (!this._state.has(rk)) this.createSignal(rk);
    const prev = this._state.get(rk);
    const next = typeof value === 'function' ? (value as (p: T | undefined) => T)(prev) : value;
    if (Object.is(prev, next)) return;
    this._state.set(rk, next);
    const ls = this._listeners.get(rk);
    if (ls) for (const fn of ls) fn(next);
    this.renderInvalidations++;
  }
  readSignal<T>(key: any): T | undefined {
    return this._state.get(String(key)) as T | undefined;
  }
  // subscribe surface (the platform's subSauron shape, duck-typed for tests)
  subscribe(key: string, fn: (v: any) => void): () => void {
    const rk = String(key);
    if (!this._listeners.has(rk)) this._listeners.set(rk, new Set());
    this._listeners.get(rk)!.add(fn);
    return () => this._listeners.get(rk)?.delete(fn);
  }
}
