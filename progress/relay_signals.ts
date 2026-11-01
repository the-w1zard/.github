// Relays.ts 
import { getCurrentComponent, subscribeToHook, notifyHook } from '#the-cloud'
import { staff } from '../../../staff/staff'
import { NginClient } from '../../../staff/ncs'

function _bindComponentToRelay(rk: string): void {
  const component = getCurrentComponent()
  if (!component) return // not inside a render — plain read, nothing to bind

  const hookKey = `${component.id}:Relay:${rk}`
  if (!component.hooks.has(hookKey)) {
    component.hooks.set(hookKey, { value: undefined })

    const unsubRelay = subscribeRelay(rk, () => notifyHook(hookKey))
    component.unmount.add(unsubRelay)

    if (component.render) {
      const unsubRender = subscribeToHook(hookKey, () => component.render?.())
      component.unmount.add(unsubRender)
    }
  }
}
// #region ─── WRAPPERS WRAPPING THE OLD RelayS INTO THE NEW ─────────────────────────────────────
const _trackingStack: Set<string>[] = [];

function _trackAccess(rk: string): void {
  const current = _trackingStack[_trackingStack.length - 1];
  if (current) current.add(rk);
}
export function Relay<T>(initial: T, options?: RelayOptions<T>) {
  const rk = createRelay(`sig:${_sid()}`, initial, options)
  return {
    get value(): T {
      _trackAccess(rk)          // for computed()/effect() dependency tracking
      _bindComponentToRelay(rk) // for React re-render, order-independent
      return readRelay<T>(rk) as T
    },
    set value(v: T) {
      writeRelay(rk, v)
    },
    peek(): T {
      return peekRelay<T>(rk) as T
    },
  }
}
export function effect(fn: () => void | (() => void)): () => void {
  let cleanupFn: (() => void) | void
  let unsubs: (() => void)[] = []

  function run() {
    unsubs.forEach(u => u())
    unsubs = []
    if (cleanupFn) { cleanupFn(); cleanupFn = undefined }

    const tracked = new Set<string>()
    _trackingStack.push(tracked)
    try {
      cleanupFn = fn() as any
    } finally {
      _trackingStack.pop()
    }

    for (const dep of tracked) {
      unsubs.push(subscribeRelay(dep, () => run()))
    }
  }

  run()
  return () => {
    unsubs.forEach(u => u())
    if (cleanupFn) cleanupFn()
  }
}
export function computed<T>(fn: () => T): { readonly value: T; peek(): T } {
  const rk = `computed:${_sid()}`
  createRelay(rk, undefined as any)
  let unsubs: (() => void)[] = []
  let stale = true

  function recompute() {
    unsubs.forEach(u => u())
    unsubs = []
    const tracked = new Set<string>()
    _trackingStack.push(tracked)
    let result: T
    try {
      result = fn()
    } finally {
      _trackingStack.pop()
    }
    writeRelay(rk, result)
    stale = false
    for (const dep of tracked) {
      unsubs.push(subscribeRelay(dep, () => { stale = true; recompute() }))
    }
  }

  recompute()
  return {
    get value(): T {
      if (stale) recompute()
      _trackAccess(rk)
      _bindComponentToRelay(rk)
      return readRelay<T>(rk) as T
    },
    peek(): T {
      if (stale) recompute()
      return peekRelay<T>(rk) as T
    },
  }
}
// #endregion

// #region ─── CACHE LIMIT ────────────────────────────────────────────────────────────
// to control the cache size limit, it employs a first in, first out strategy so as to never let memory run havoc on your performance
const total_cache_size = 5000
// #endregion
// #region ─── GLOBAL STORE ────────────────────────────────────────────────────────────
/**	private total_cache_size = 5000;
 private _contracts: Map<string, {name?: string; key?: string; precondition?: (v: A) => boolean; postcondition?: (v: A) => boolean; invariant?: (snapshot: Record<string, A>) => boolean; block?: boolean}> = new Map();
 private _keyContracts: Map<string, Set<string>> = new Map();
 private _mainMap: Map<string | number | symbol, string> = new Map();
 private _weakMap: WeakMap<object, string> = new WeakMap();
 private _tupleCache: Map<string, string> = new Map();
 private _listeners: Map<string, Set<SignalListener>> = new Map();
 private _conflicts: Map<string, ConflictPolicy> = new Map();
 private _causal: Map<string, CausalEntry[]> = new Map();
 public  _state: Map<string, any> = new Map()
 public  _scopes: Map<string, SignalScope> = new Map()
 public  _initial: Map<string, A> = new Map()
 public  _batches: Set<string | symbol> = new Set()
 public  _batchQueue:Map<string | symbol, A> = new Map()
 public  _batchOpts: Map<string | symbol, {triggerRender?: boolean}>  = new Map()
 public  _globalListeners:Set<(key: string | symbol, value: A) => void>  = new Set()
 public  _global_subscribers: Map<string, Set<() => void>>  = new Map()
 public  _sys: Map<string, SysEntry>  = new Map()
 public  _sealed:  Set<string>  = new Set()
 public  _frozen: Set<string>  = new Set()
 public  _msgHandlers: Map<string, Set<(p: A) => void>> = new Map()
 public  _lastWriteSource: Map<S, S>  = new Map()
 public  _boundaries: Map<A, A>  = new Map()
 public  _conflictStrategies: Map<string, "latest" | "fail" | "accumulate"> = new Map() */
export const _state: Map<string, any> = (globalThis as any).SAURON_RelayS ?? ((globalThis as any).SAURON_RelayS = new Map());
const _mainMap = new Map<string | number | symbol, string>();
const _weakMap = new WeakMap<object, string>();
const _tupleCache = new Map<string, string>();
const _frozen: Set<string> = (globalThis as any).SAURON_SIG_FROZEN ?? ((globalThis as any).SAURON_SIG_FROZEN = new Set());
const _sealed: Set<string> = (globalThis as any).SAURON_SIG_SEALED ?? ((globalThis as any).SAURON_SIG_SEALED = new Set());
const _pending: Set<string> = (globalThis as any).SAURON_SIG_PENDING ?? ((globalThis as any).SAURON_SIG_PENDING = new Set());
const _derivedDeps: Map<string, Set<string>> = (globalThis as any).SAURON_SIG_DEPS ?? ((globalThis as any).SAURON_SIG_DEPS = new Map());
type RelayListener = (value: any, source?: CausalEntry['source']) => void;
const _listeners: Map<string, Set<RelayListener>> = (globalThis as any).SAURON_SIG_LISTENERS ?? ((globalThis as any).SAURON_SIG_LISTENERS = new Map());
const _initial: Map<string, any> = (globalThis as any).SAURON_SIG_INITIAL ?? ((globalThis as any).SAURON_SIG_INITIAL = new Map());
const _RelayVersions = new Map<string, number>(); // Only declared once now!
const _history: Map<string, { value: any; timestamp: number; source?: string }[]> = (globalThis as any).__SAURON_SIG_HISTORY__ ?? ((globalThis as any).__SAURON_SIG_HISTORY__ = new Map())
const _conflicts: Map<string, ConflictPolicy<any>> = (globalThis as any).__SAURON_SIG_CONFLICTS__ ?? ((globalThis as any).__SAURON_SIG_CONFLICTS__ = new Map())
const _scopes: Map<string, RelayScope> = (globalThis as any).__SAURON_SIG_SCOPES__ ?? ((globalThis as any).__SAURON_SIG_SCOPES__ = new Map())
const _effects: Map<string, RelayEffect> = (globalThis as any).__SAURON_SIG_EFFECTS__ ?? ((globalThis as any).__SAURON_SIG_EFFECTS__ = new Map())
const _causal: Map<string, CausalEntry[]> = (globalThis as any).__SAURON_SIG_CAUSAL__ ?? ((globalThis as any).__SAURON_SIG_CAUSAL__ = new Map())
const _lifecycle: Map<string, RelayLifecycle<any>> = (globalThis as any).__SAURON_SIG_LC__ ?? ((globalThis as any).__SAURON_SIG_LC__ = new Map())
const _msgHandlers: Map<string, Set<(p: any) => void>> = (globalThis as any).__SAURON_SIG_MSG__ ?? ((globalThis as any).__SAURON_SIG_MSG__ = new Map())
const _async: Map<string, AsyncRelayState<any>> = (globalThis as any).__SAURON_SIG_ASYNC__ ?? ((globalThis as any).__SAURON_SIG_ASYNC__ = new Map())
const _operators: Map<string, () => void> = (globalThis as any).__SAURON_SIG_OPS__ ?? ((globalThis as any).__SAURON_SIG_OPS__ = new Map())
const _derived: Map<string, () => any> = (globalThis as any).__SAURON_SIG_DERIVED__ ?? ((globalThis as any).__SAURON_SIG_DERIVED__ = new Map())
const _conflictStrategies: Map<string, 'latest' | 'fail' | 'accumulate'> = (globalThis as any).SAURON_SIG_CONFLICT_STRAT ?? ((globalThis as any).SAURON_SIG_CONFLICT_STRAT = new Map());
const _contracts: Map<string, {
  name?: string;
  keys?: string[];
  precondition?: (v: any) => boolean;
  postcondition?: (v: any) => boolean;
  invariant?: (snapshot: Record<string, any>) => boolean;
  block?: boolean;
}> = (globalThis as any).SAURON_SIG_CONTRACTS ?? ((globalThis as any).SAURON_SIG_CONTRACTS = new Map());
const _historyMax: Map<string, number> = (globalThis as any).SAURON_SIG_HIST_MAX ?? ((globalThis as any).SAURON_SIG_HIST_MAX = new Map());
const _historyIdx: Map<string, number> = (globalThis as any).SAURON_SIG_HIST_IDX ?? ((globalThis as any).SAURON_SIG_HIST_IDX = new Map());
const _metrics: Map<string, {
  readCount: number;
  writeCount: number;
  subscriberCount: number;
  lastWrite: number | null;
  flushDuration: number;
}> = (globalThis as any).SAURON_SIG_METRICS ?? ((globalThis as any).SAURON_SIG_METRICS = new Map());
const _schemas: Map<string, RelaySchema<any>> = (globalThis as any).SAURON_SIG_SCHEMAS ?? ((globalThis as any).SAURON_SIG_SCHEMAS = new Map());
const _lastWriteSource = new Map<string, CausalEntry['source']>();
// #endregion
// #region ─── registerSchema ────────────────────────────────────────────────────────────
let _isFlushing = false;
const _finalizationRegistry = new FinalizationRegistry<string>((id) => {
  if (_state.has(id)) _state.delete(id);
  // Unbounded internal registries cleanup
  _listeners.delete(id);
  _metrics.delete(id);
  _history.delete(id);
});
export function registerSchema<T>(key: any, schema: RelaySchema<T>): void {
  const rk = resolveKey(key);
  _schemas.set(rk, schema);
}
function _validateSchema(rk: string, value: any): any {
  const schema = _schemas.get(rk);
  if (!schema) return value; // No schema, pass through [cite: 372, 373]

  try {
    let coercedValue = value;
    // Perform coercion if the schema supports it
    if (schema.coerce) {
      coercedValue = schema.coerce(value);
    }
    // Perform boolean validation check
    if (schema.validate(coercedValue)) {
      return coercedValue;
    }
    console.error(`[Sauron] Schema validation failed for key: ${rk}`);
    return null; // Return null to flag write abort
  } catch (err) {
    console.error(`[Sauron] Schema validation failed for key: ${rk}`, err);
    return null;
  }
}
function _hashTuple(tuple: unknown[]): string {
  const key = JSON.stringify(tuple);
  const cached = _tupleCache.get(key);
  if (cached) return cached;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const result = `tuple:${h.toString(36)}`; // Fixed template backticks
  _tupleCache.set(key, result);
  if (_tupleCache.size > total_cache_size) {
    const toRemove = Math.floor(_tupleCache.size * 0.2);
    const iter = _tupleCache.keys();
    for (let i = 0; i < toRemove; i++) {
      const k = iter.next().value;
      if (k !== undefined) _tupleCache.delete(k);
    }
  }
  return result;
}
export function resolveKey(key: any): string {
  if (typeof key === 'string' || typeof key === 'number' || typeof key === 'symbol') {
    const existing = _mainMap.get(key);
    if (existing) return existing;
    const id = typeof key === 'symbol' ? `sym:${key.toString()}` : `${key}`; // Fixed template backticks
    _mainMap.set(key, id);
    return id;
  }
  if (Array.isArray(key)) {
    const str = JSON.stringify(key);
    if (!_tupleCache.has(str)) {
      _tupleCache.set(str, _hashTuple(key));
    }
    return _tupleCache.get(str)!;
  }
  if (typeof key === 'object' || typeof key === 'function') {
    const existing = _weakMap.get(key);
    if (existing) return existing;
    const id = `ref:${_sid()}`; // Fixed template backticks
    _weakMap.set(key, id);
    _finalizationRegistry.register(key, id);
    return id;
  }
  return `${key}`; // Fixed template backticks
}

// #endregion
// #region ─── TYPES ───────────────────────────────────────────────────────────────────
export interface RelaySchema<T> {
  validate(value: T): boolean
  coerce?(value: unknown): T
}
export type ConflictPolicyName = 'last-write-wins' | 'first-write-wins' | 'merge' | 'reject-on-conflict' | 'queue'
export type ConflictPolicy<T> =
  | ConflictPolicyName
  | ((current: T, incoming: T, meta: { key: string; timestamp: number }) => T)
export interface RelayLifecycle<T> {
  onCreate?(): void
  onWrite?(value: T, prev: T | undefined): void
  onRead?(value: T): void
  onDelete?(): void
  onFreeze?(): void
  onExpire?(): void
  onError?(err: Error): void
}
export interface RelayOptions<T> {
  broadcast?: boolean
  persist?: boolean
  history?: { max: number }
  schema?: RelaySchema<T>
  conflict?: ConflictPolicy<T>
  ttl?: number
  lifecycle?: RelayLifecycle<T>
}
export interface CausalEntry {
  key: string
  value: any
  timestamp: number
  source: 'write' | 'effect' | 'derived' | 'staff' | 'ngin'
  cause?: string
}
export interface RelayMetric {
  writeCount: number
  readCount: number
  subscriberCount: number
  lastWrite: number
  flushDuration: number
}
export interface AsyncRelayState<T> {
  fetcher: () => Promise<T>
  controller: AbortController | null
  retryCount: number
  staleValue: T | undefined
}
export interface RelayScope {
  id: string
  keys: Set<string>
  effects: Set<any>
  suspended: boolean
  pendingFlush: Map<string, any>
}
export interface RelayEffect {
  keys: string[]
  fn: (...values: any[]) => (() => void) | void | Promise<(() => void) | void>
  cleanup: (() => void) | null
  controller: AbortController | null
}
export interface RelayContract {
  name: string
  keys: string[]
  invariant: (snapshot: Record<string, any>) => boolean
  block: boolean
}

// #endregion
// #region ─── DERIVED RelayS ────────────────────────────────────────────────────────
const _derivedRelays = new Map<string, {
  compute: (...values: any[]) => any
  deps: string[]
  cached?: { value: any; depVersions: number[] }
  options?: { eager?: boolean; onError?: (err: Error) => void }
}>()

function _computeDerivedValue<T>(rk: string): T {
  const Relay = _derivedRelays.get(rk);
  if (!Relay) throw new Error(`Derived Relay not found: ${rk}`); // Added backticks

  try {
    const depVersions = Relay.deps.map(d => _RelayVersions.get(d) ?? 0);
    const cached = Relay.cached;

    // Check if dependencies haven't changed since last evaluation
    if (cached && cached.depVersions.every((v, i) => v === depVersions[i])) {
      return cached.value as T;
    }

    // Extract runtime state dependencies for execution mapping
    const values = Relay.deps.map(d => readRelay(d));
    const newValue = Relay.compute(...values);

    // Cache the resolved tracking computation snapshot
    Relay.cached = { value: newValue, depVersions };
    return newValue as T;

  } catch (err) {
    Relay.options?.onError?.(err as Error);
    throw err;
  }
}
// #endregion
// #region ─── PRIORITY QUEUE ───────────────────────────────────────────────────────────────────
class PriorityQueue {
  private heap: string[] = [];

  push(key: string) {
    if (this.heap.includes(key)) return; // Prevent duplicate queuing
    this.heap.push(key);
    this._up(this.heap.length - 1);
  }

  pop(): string | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom !== undefined) {
      this.heap[0] = bottom;
      this._down(0);
    }
    return top;
  }

  get size(): number { return this.heap.length; }

  private _up(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (_dependencyGraph.getLevel(this.heap[i]) >= _dependencyGraph.getLevel(this.heap[p])) break;
      this._swap(i, p);
      i = p;
    }
  }

  private _down(i: number) {
    const len = this.heap.length;
    while ((i << 1) + 1 < len) {
      let left = (i << 1) + 1;
      let right = left + 1;
      let best = right < len && _dependencyGraph.getLevel(this.heap[right]) < _dependencyGraph.getLevel(this.heap[left]) ? right : left;
      if (_dependencyGraph.getLevel(this.heap[best]) >= _dependencyGraph.getLevel(this.heap[i])) break;
      this._swap(i, best);
      i = best;
    }
  }

  private _swap(i: number, j: number) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}
const _flushQueue = new PriorityQueue();


export function debounce(sourceKey: any, delay: number): [string, () => void] {
  const sk = resolveKey(sourceKey);
  const dk = resolveKey([sk, 'debounce', delay, _sid()]);

  createRelay(dk, _state.get(sk));
  let timeoutId: any = null;

  const unsubscribe = subscribeRelay(sk, (value) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      writeRelay(dk, value);
    }, delay);
  });

  const dispose = () => {
    unsubscribe();
    if (timeoutId) clearTimeout(timeoutId);
    _state.delete(dk);
    _listeners.delete(dk);
    _initial.delete(dk);
  };

  return [dk, dispose];
}
export function transaction(block: () => void): void {
  // Deep clone structural tracking map for non-primitive recovery
  const backupState = new Map<string, any>();
  for (const [k, v] of _state.entries()) {
    if (v !== null && typeof v === 'object') {
      try {
        backupState.set(k, structuredClone(v));
      } catch {
        // Fallback for non-serializable elements (e.g., class instances, DOM objects)
        backupState.set(k, Object.create(Object.getPrototypeOf(v), Object.getOwnPropertyDescriptors(v)));
      }
    } else {
      backupState.set(k, v);
    }
  }

  try {
    block();
  } catch (error) {
    // Rollback execution block safely
    for (const key of _state.keys()) {
      if (!backupState.has(key)) {
        _state.delete(key);
      }
    }
    for (const [k, v] of backupState.entries()) {
      _state.set(k, v);
    }
    console.warn("Transaction rolled back successfully due to runtime error.");
    throw error;
  }
}
// #endregion
// #region ─── CAUSAL TRACKING ─────────────────────────────────────────────────────────
let _currentCause: string | undefined

function _recordCausal(rk: string, value: any, source: CausalEntry['source'], cause?: string) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return
  const chain = _causal.get(rk) ?? []
  chain.push({ key: rk, value, timestamp: Date.now(), source, cause })
  if (chain.length > 100) chain.shift()
  _causal.set(rk, chain)
}

// #endregion
// #region ─── CONFLICT RESOLUTION ─────────────────────────────────────────────────────

function _resolveConflict(rk: string, prev: any, next: any): any {
  const strategy = _conflictStrategies.get(rk) ?? 'latest';

  if (strategy === 'latest') return next;
  if (strategy === 'fail') {
    console.warn(`[Sauron] Write rejected due to conflict on strict key: ${rk}`);
    return null;
  }
  if (strategy === 'accumulate' && Array.isArray(prev) && Array.isArray(next)) {
    return [...prev, ...next];
  }
  return next;
}

// #endregion
// #region ─── CONTRACT ENFORCEMENT ────────────────────────────────────────────────────

function _enforceContracts(rk: string): boolean {
  const contract = _contracts.get(rk);
  if (!contract) return true;

  const currentVal = _state.get(rk);

  if (contract.postcondition && !contract.postcondition(currentVal)) {
    console.error(`[Sauron] Contract violation on key: ${rk}. Changes rolled back.`);
    return false;
  }
  return true;
}
// #endregion
// #region ─── EFFECTS ─────────────────────────────────────────────────────────────────
async function _runEffect(effect: RelayEffect): Promise<void> {
  // 1. Run previous cleanup if one exists
  if (effect.cleanup) {
    try {
      effect.cleanup();
    } catch (err) {
      console.error(`Error during effect cleanup:`, err);
    }
    effect.cleanup = null;
  }

  // 2. Abort active async controller if one is running
  if (effect.controller) {
    effect.controller.abort();
  }
  effect.controller = new AbortController();

  // 3. Execute the core side-effect tracking function
  try {
    const values = effect.keys.map(k => _state.get(k));
    const result = effect.fn(...values);

    if (result instanceof Promise) {
      const cleanupFn = await result;
      if (typeof cleanupFn === 'function') {
        effect.cleanup = cleanupFn;
      }
    } else if (typeof result === 'function') {
      effect.cleanup = result;
    }
  } catch (err) {
    console.error(`Error executing effect:`, err);
  }
}
// #endregion
// #region ─── CREATE Relay ──────────────────────────────────────────────────────────────
export function createRelay<T>(key: any, initial?: T | (() => T), options?: RelayOptions<T>): string {
  const rk = resolveKey(key)

  if (!_state.has(rk)) {
    const value = typeof initial === 'function' ? (initial as () => T)() : initial
    _state.set(rk, value)
    _initial.set(rk, value)

    if (options?.schema) _schemas.set(rk, options.schema)
    if (options?.conflict) _conflicts.set(rk, options.conflict as ConflictPolicy<any>)
    if (options?.history) {
      _historyMax.set(rk, options.history.max)
      _history.set(rk, [{ value, timestamp: Date.now(), source: 'write' }])
      _historyIdx.set(rk, 1)
    }
    if (options?.lifecycle) _lifecycle.set(rk, options.lifecycle as RelayLifecycle<any>)

    if (options?.persist) {
      const ngin = NginClient(staff)
      async function SetValue() {
        await ngin.set(rk).catch(() => { })
      }
      SetValue()
    }

    if (options?.ttl) {
      setTimeout(() => {
        deleteRelay(rk)
        _lifecycle.get(rk)?.onExpire?.()
      }, options.ttl)
    }

    if (options?.broadcast) {
      this.multisub('sig', rk, (incoming: any) => {
        _writeResolved(rk, incoming, 'staff', `staff:sig:${rk}`)
      })
    }

    _lifecycle.get(rk)?.onCreate?.()

    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      const devStore = (globalThis as any).__SAURON_DEV__ ?? ((globalThis as any).__SAURON_DEV__ = new Map())
      devStore.set(rk, { key, resolvedKey: rk, options })
    }
  }

  return rk
}
// #endregion
// #region ─── WRITE Relay ──────────────────────────────────────────────────────────────
export function writeRelay<T>(key: any, value: T | ((prev: T | undefined) => T), source: CausalEntry['source'] = 'write'): void {
  const rk = resolveKey(key)
  if (_frozen.has(rk)) return
  const prev = _state.get(rk) as T | undefined
  const next = typeof value === 'function' ? (value as (prev: T | undefined) => T)(prev) : value
  _currentCause = rk
  _writeResolved(rk, next, source, _currentCause)
  _currentCause = undefined

  if (_state.has(rk)) {
    const opts = (globalThis as any).__SAURON_DEV__?.get(rk)
    if (opts?.options?.broadcast) {
      async function SendCSE() {
        await this.send('sig', { _sc: rk, data: next }).catch(() => { })
      }
      SendCSE()
    }
  }
}
// #endregion
// #region ─── READ Relay ──────────────────────────────────────────────────────────────
export function readRelay<T>(key: any): T | undefined {
  const rk = resolveKey(key)

  if (_derivedRelays.has(rk)) {
    const newValue = _computeDerivedValue(rk)
    const current = _state.get(rk)
    if (!Object.is(current, newValue)) {
      _state.set(rk, newValue)
    }
  }

  const value = _state.get(rk) as T | undefined

  if (_globalRelayHooks?.onRead) {
    try {
      _globalRelayHooks.onRead(rk, value)
    } catch (err) {
      console.error('Global onRead hook error:', err)
    }
  }

  const lc = _lifecycle.get(rk)
  lc?.onRead?.(value as T)
  const m = _metrics.get(rk)
  if (m) m.readCount++
  return value
}
// #endregion
// #region ─── PEEK Relay ──────────────────────────────────────────────────────────────
export function peekRelay<T>(key: any): T | undefined {
  return _state.get(resolveKey(key)) as T | undefined
}
// #endregion
// #region ─── HAS Relay ──────────────────────────────────────────────────────────────
export function hasRelay(key: any): boolean {
  return _state.has(resolveKey(key))
}
// #endregion
// #region ─── FREEZE Relay ──────────────────────────────────────────────────────────────
export function freezeRelay(key: any): void {
  const rk = resolveKey(key)
  _frozen.add(rk)
  _lifecycle.get(rk)?.onFreeze?.()
}
// #endregion
// #region ─── SEAL Relay ──────────────────────────────────────────────────────────────
export function sealRelay(key: any): void {
  _sealed.add(resolveKey(key))
}
// #endregion
// #region ─── RESET Relay ──────────────────────────────────────────────────────────────
export function resetRelay(key: any): void {
  const rk = resolveKey(key)
  const initial = _initial.get(rk)
  if (initial !== undefined) _writeResolved(rk, initial, 'write', 'reset')
}
// #endregion
// #region ─── HYDRATE Relay ──────────────────────────────────────────────────────────────
export function hydrateRelay<T>(key: any, value: T): void {
  const rk = resolveKey(key)
  if (!_state.has(rk)) {
    _state.set(rk, value)
    _initial.set(rk, value)
  }
}
// #endregion
// #region ─── CLONE Relay ──────────────────────────────────────────────────────────────
export function cloneRelay(srcKey: any, destKey: any): void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  const value = _state.get(src)
  _state.set(dest, value)
  _initial.set(dest, value)
  const srcListeners = _listeners.get(src)
  if (srcListeners) _listeners.set(dest, new Set(srcListeners))
}
// #endregion
// #region ─── SUBSCRIBE Relay ──────────────────────────────────────────────────────────────
export function subscribeRelay<T>(key: any, fn: (value: T, source?: CausalEntry['source']) => void): () => void {
  const rk = resolveKey(key)
  if (!_listeners.has(rk)) _listeners.set(rk, new Set())
  _listeners.get(rk)!.add(fn as (value: any) => void)
  const m = _metrics.get(rk) ?? { writeCount: 0, readCount: 0, subscriberCount: 0, lastWrite: 0, flushDuration: 0 }
  m.subscriberCount = _listeners.get(rk)!.size
  _metrics.set(rk, m)
  return () => {
    _listeners.get(rk)?.delete(fn as (value: any) => void)
    const mm = _metrics.get(rk)
    if (mm) mm.subscriberCount = _listeners.get(rk)?.size ?? 0
  }
}
// #endregion
// #region ─── PRESIST Relay ──────────────────────────────────────────────────────────────
export async function persistRelay(key: any, options?: { serialize?: (v: any) => string; deserialize?: (s: string) => any }) {
  const rk = resolveKey(key)
  const ngin = NginClient(staff)
  await ngin.set(rk, options).catch(() => { })
}
// #endregion
// #region ─── UNPRESIST Relay ──────────────────────────────────────────────────────────────
export async function unpersistRelay(key: any) {
  const rk = resolveKey(key)
  const ngin = NginClient(staff)
  await ngin.delete(rk).catch(() => { })
}
// #endregion
// #region ─── ON Relay MESSAGE ──────────────────────────────────────────────────────────────
export function onRelayMessage<T>(key: any, fn: (p: T) => void): () => void {
  const rk = resolveKey(key)
  if (!_msgHandlers.has(rk)) _msgHandlers.set(rk, new Set())
  _msgHandlers.get(rk)!.add(fn as (p: any) => void)
  return () => _msgHandlers.get(rk)?.delete(fn as (p: any) => void)
}
// #endregion
// #region ─── Relay MESSAGE ──────────────────────────────────────────────────────────────
export function RelayMessage(fromKey: any, toKey: any, p: any): void {
  const to = resolveKey(toKey)
  const handlers = _msgHandlers.get(to)
  if (!handlers) return
  for (const fn of handlers) fn(p)
  async function SendCSE() {
    await this.send(`sig:msg:${to}`, { from: resolveKey(fromKey), p }).catch(() => { })
  }
  SendCSE()
}
// #endregion
// #region ─── DELETE Relay ──────────────────────────────────────────────────────────────
export function deleteRelay(key: any): void {
  const rk = resolveKey(key)
  if (_sealed.has(rk)) return
  _lifecycle.get(rk)?.onDelete?.()
  _state.delete(rk)
  _listeners.delete(rk)
  _schemas.delete(rk)
  _conflicts.delete(rk)
  _history.delete(rk)
  _historyMax.delete(rk)
  _historyIdx.delete(rk)
  _lifecycle.delete(rk)
  _metrics.delete(rk)
  _RelayVersions.delete(rk)
  _derivedRelays.delete(rk)
}
// #endregion
// #region ─── DERIVED ─────────────────────────────────────────────────────────────────
export function deriveRelay<T>(
  key: any,
  deps: any[],
  compute: (...values: any[]) => T,
  options?: {
    eager?: boolean
    onError?: (err: Error) => void
  }
): string {
  const rk = resolveKey(key)
  const depKeys = deps.map(resolveKey)

  // Add to dependency graph
  _dependencyGraph.addNode(rk, depKeys)

  // Store derived Relay
  _derivedRelays.set(rk, {
    compute,
    deps: depKeys,
    options
  })

  // Initial computation
  const values = depKeys.map(d => _state.get(d))
  const result = compute(...values)
  _state.set(rk, result)

  // Subscribe to dependencies for auto-updates
  for (const dep of depKeys) {
    subscribeRelay(dep, () => {
      if (options?.eager || (_listeners.get(rk)?.size ?? 0) > 0) {
        const newValue = _computeDerivedValue(rk)
        if (!Object.is(_state.get(rk), newValue)) {
          _writeResolved(rk, newValue, 'derived', dep)
        }
      }
    })
  }

  return rk
}
export function invalidateDerived(key: any): void {
  const rk = resolveKey(key)
  if (_derivedRelays.has(rk)) {
    const newValue = _computeDerivedValue(rk)
    _writeResolved(rk, newValue, 'derived', 'invalidate')
  }
}
// #endregion
// #region ─── ASYNC RelayS ─────────────────────────────────────────────────────────── 
export function createAsyncRelay<T>(
  key: any,
  fetcher: (Relay: AbortRelay) => Promise<T>,
  options?: { staleWhileRevalidate?: boolean; fallback?: T }
) {
  const rk = resolveKey(key);
  const dataKey = resolveKey([key, 'data']);
  const loadingKey = resolveKey([key, 'loading']);
  const errorKey = resolveKey([key, 'error']);

  createRelay(dataKey, options?.fallback);
  createRelay(loadingKey, false);
  createRelay(errorKey, null);

  const run = async () => {
    const state = _async.get(rk)!;
    if (state.controller) {
      state.controller.abort();
    }

    const nextController = new AbortController();
    state.controller = nextController;

    _writeResolved(loadingKey, true, 'write', rk);

    try {
      const data = await fetcher(nextController.Relay);
      if (!nextController.Relay.aborted) {
        _writeResolved(dataKey, data, 'write', rk);
        _writeResolved(errorKey, null, 'write', rk);
      }
    } catch (err) {
      if (!nextController.Relay.aborted) {
        _writeResolved(errorKey, err, 'write', rk);
        _lifecycle.get(rk)?.onError?.(err as Error);
      }
    } finally {
      if (!nextController.Relay.aborted) {
        _writeResolved(loadingKey, false, 'write', rk);
        state.controller = null;
      }
    }
  };

  _async.set(rk, {
    fetcher: run,
    controller: null,
    retryCount: 0,
    staleValue: options?.fallback
  });

  run();
  return { dataKey, loadingKey, errorKey };
}
export function invalidateAsyncRelay(key: any): void {
  const rk = resolveKey(key)
  const state = _async.get(rk)
  if (!state) return
  const dataKey = resolveKey([key, 'data'])
  const loadingKey = resolveKey([key, 'loading'])
  const errorKey = resolveKey([key, 'error'])
  _writeResolved(loadingKey, true, 'write', rk)
  _writeResolved(errorKey, null, 'write', rk)
  state.fetcher().then(result => {
    _writeResolved(dataKey, result, 'write', rk)
    _writeResolved(loadingKey, false, 'write', rk)
  }).catch(err => {
    _writeResolved(errorKey, err, 'write', rk)
    _writeResolved(loadingKey, false, 'write', rk)
  })
}
export function mutateAsyncRelay<T>(key: any, optimistic: T): void {
  const rk = resolveKey(key)
  const dataKey = resolveKey([key, 'data'])
  const state = _async.get(rk)
  if (!state) return
  const prior = _state.get(dataKey)
  _writeResolved(dataKey, optimistic, 'write', rk)
  state.fetcher().catch(() => {
    _writeResolved(dataKey, prior, 'write', rk)
  })
}
export function abortAsyncRelay(key: any): void {
  const rk = resolveKey(key)
  const state = _async.get(rk)
  if (!state?.controller) return
  state.controller.abort()
  state.controller = null
  _writeResolved(resolveKey([key, 'loading']), false, 'write', rk)
}
export function prefetchAsyncRelay<T>(key: any, fetcher: () => Promise<T>): void {
  const rk = resolveKey(key)
  if (_async.has(rk)) return
  createAsyncRelay(key, fetcher)
}
export function readAsyncRelay<T>(key: any): T {
  const dataKey = resolveKey([key, 'data'])
  const loadingKey = resolveKey([key, 'loading'])
  const errorKey = resolveKey([key, 'error'])
  const error = _state.get(errorKey)
  if (error) throw error
  if (_state.get(loadingKey)) throw new Promise<void>(resolve => {
    const unsub = subscribeRelay(loadingKey, (loading: boolean) => {
      if (!loading) { unsub(); resolve() }
    })
  })
  return _state.get(dataKey) as T
}
// #endregion
// #region ─── BATCH + TRANSACTION ─────────────────────────────────────────────────────
const _batchDepth = { n: 0 }
const _batchQueue: (() => void)[] = []
export function batchRelays(fn: () => void): void {
  _batchDepth.n++
  try {
    fn()
  } finally {
    _batchDepth.n--
    if (_batchDepth.n === 0) {
      const queue = _batchQueue.splice(0)
      for (const f of queue) f()
    }
  }
}
export function txRelays(fn: () => void): void {
  const snapshot = new Map(_state)
  try {
    fn()
  } catch (err) {
    _state.clear()
    snapshot.forEach((v, k) => _state.set(k, v))
    throw err
  }
}
// ─── HISTORY + TIME TRAVEL ───────────────────────────────────────────────────
export function enableHistory(key: any, options: { max: number }): void {
  const rk = resolveKey(key)
  _historyMax.set(rk, options.max)
  if (!_history.has(rk)) {
    _history.set(rk, [{ value: _state.get(rk), timestamp: Date.now(), source: 'write' }])
    _historyIdx.set(rk, 1)
  }
}
export function undoRelay(key: any): void {
  const rk = resolveKey(key)
  const h = _history.get(rk)
  if (!h) return
  const idx = (_historyIdx.get(rk) ?? h.length) - 2
  if (idx < 0) return
  _historyIdx.set(rk, idx + 1)
  _writeResolved(rk, h[idx].value, 'write', 'undo')
}
export function redoRelay(key: any): void {
  const rk = resolveKey(key)
  const h = _history.get(rk)
  if (!h) return
  const idx = _historyIdx.get(rk) ?? h.length
  if (idx >= h.length) return
  _historyIdx.set(rk, idx + 1)
  _writeResolved(rk, h[idx].value, 'write', 'redo')
}
export function RelayTimeline(key: any): { value: any; timestamp: number; source?: string }[] {
  return _history.get(resolveKey(key)) ?? []
}
export function snapshotRelays(): Record<string, any> {
  const out: Record<string, any> = {}
  _state.forEach((v, k) => { out[k] = v })
  return out
}
export function restoreRelays(snapshot: Record<string, any>): void {
  batchRelays(() => {
    for (const [k, v] of Object.entries(snapshot)) {
      _writeResolved(k, v, 'write', 'restore')
    }
  })
}
export function diffSnapshots(a: Record<string, any>, b: Record<string, any>): Record<string, { from: any; to: any }> {
  const out: Record<string, { from: any; to: any }> = {}
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    if (!Object.is(a[k], b[k])) out[k] = { from: a[k], to: b[k] }
  }
  return out
}
export function applyPatch(patch: Record<string, { from: any; to: any }>): void {
  batchRelays(() => {
    for (const [k, { to }] of Object.entries(patch)) {
      _writeResolved(k, to, 'write', 'patch')
    }
  })
}
export async function replayRelay(key: any, options?: { speed?: number }): Promise<void> {
  const rk = resolveKey(key)
  const h = _history.get(rk)
  if (!h || h.length < 2) return
  const speed = options?.speed ?? 1
  for (let i = 1; i < h.length; i++) {
    const delay = (h[i].timestamp - h[i - 1].timestamp) / speed
    await new Promise(r => setTimeout(r, delay))
    _writeResolved(rk, h[i].value, 'write', 'replay')
  }
}
// #endregion
// #region ─── CAUSAL TRACING ──────────────────────────────────────────────────────────
export function getCausalChain(key: any): CausalEntry[] {
  return _causal.get(resolveKey(key)) ?? []
}
// #endregion
// #region ─── CONFLICT POLICY ─────────────────────────────────────────────────────────
export function conflictPolicy<T>(key: any, policy: ConflictPolicy<T>): void {
  _conflicts.set(resolveKey(key), policy as ConflictPolicy<any>)
}
// #endregion
// #region ─── CONTRACTS ───────────────────────────────────────────────────────────────
export function declareContract(
  name: string,
  keys: any[],
  invariant: (snapshot: Record<string, any>) => boolean,
  options?: { block?: boolean }
): void {
  _contracts.set(name, {
    name,
    keys: keys.map(resolveKey),
    invariant,
    block: options?.block ?? false
  })
}
export function removeContract(name: string): void {
  _contracts.delete(name)
}
// #endregion
// #region ─── SCOPES ──────────────────────────────────────────────────────────────────
export function createRelayScope(id: string): {
  add(key: any): void
  suspend(): void
  resume(): void
  dispose(): void
  snapshot(): Record<string, any>
  restore(snapshot: Record<string, any>): void
  fork(): ReturnType<typeof createRelayScope>
  merge(forked: ReturnType<typeof createRelayScope>): void
} {
  const scope: RelayScope = { id, keys: new Set(), effects: new Set(), suspended: false, pendingFlush: new Map() }
  _scopes.set(id, scope)

  return {
    add(key: any) {
      scope.keys.add(resolveKey(key))
    },
    suspend() {
      scope.suspended = true
    },
    resume() {
      scope.suspended = false
      batchRelays(() => {
        scope.pendingFlush.forEach((v, k) => _writeResolved(k, v, 'write', `scope:${id}:resume`))
        scope.pendingFlush.clear()
      })
    },
    dispose() {
      for (const rk of scope.keys) deleteRelay(rk)
      for (const ek of scope.effects) _effects.delete(ek)
      _scopes.delete(id)
    },
    snapshot() {
      const out: Record<string, any> = {}
      scope.keys.forEach(rk => { out[rk] = _state.get(rk) })
      return out
    },
    restore(snapshot: Record<string, any>) {
      batchRelays(() => {
        for (const [k, v] of Object.entries(snapshot)) _writeResolved(k, v, 'write', `scope:${id}:restore`)
      })
    },
    fork() {
      const forkedId = `${id}:fork:${_sid()}`
      const forked = createRelayScope(forkedId)
      scope.keys.forEach(rk => {
        const fk = `${forkedId}:${rk}`
        _state.set(fk, _state.get(rk))
        _initial.set(fk, _initial.get(rk))
        forked.add(fk)
      })
      return forked
    },
    merge(forked: any) {
      const forkedScope = _scopes.get(forked.id)
      if (!forkedScope) return
      batchRelays(() => {
        forkedScope.keys.forEach(fk => {
          const baseKey = fk.split(':').slice(2).join(':')
          if (scope.keys.has(baseKey)) {
            _writeResolved(baseKey, _state.get(fk), 'write', `scope:${id}:merge`)
          }
        })
      })
    }
  }
}
// #endregion
// #region ─── EFFECTS ─────────────────────────────────────────────────────────────────
export function effectRelay(
  keys: any[],
  fn: (...values: any[]) => (() => void) | void | Promise<(() => void) | void>
): () => void {
  const id = `effect:${_sid()}`
  const effect: RelayEffect = { keys: keys.map(resolveKey), fn, cleanup: null, controller: null }
  _effects.set(id, effect)
  _runEffect(effect)
  return () => {
    if (effect.cleanup) effect.cleanup()
    if (effect.controller) effect.controller.abort()
    _effects.delete(id)
  }
}
export function effectOnce(
  keys: any[],
  predicate: (...values: any[]) => boolean,
  fn: (...values: any[]) => void
): () => void {
  const dispose = effectRelay(keys, (...values) => {
    if (predicate(...values)) {
      fn(...values)
      dispose()
    }
  })
  return dispose
}
// #endregion
// #region ─── OPERATORS ───────────────────────────────────────────────────────────────
export function mapRelay<A, B>(srcKey: any, destKey: any, fn: (value: A) => B): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  createRelay(dest, fn(_state.get(src) as A))
  return subscribeRelay<A>(src, v => _writeResolved(dest, fn(v), 'derived', src))
}
export function filterRelay<T>(srcKey: any, destKey: any, predicate: (value: T) => boolean): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  return subscribeRelay<T>(src, v => { if (predicate(v)) _writeResolved(dest, v, 'derived', src) })
}
export function debounceRelay(sourceKey: any, delay: number): [string, () => void] {
  const sk = resolveKey(sourceKey);
  const dk = resolveKey([sk, 'debounce', delay, _sid()]);

  _state.set(dk, _state.get(sk));
  let timeoutId: any = null;

  const listeners = _listeners.get(sk) || new Set();
  const listenerCallback = (value: any) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      // Explicitly uses our unified write path
      _writeResolved(dk, value, 'effect');
    }, delay);
  };

  listeners.add(listenerCallback);
  _listeners.set(sk, listeners);

  const dispose = () => {
    if (timeoutId) clearTimeout(timeoutId);

    const parentListeners = _listeners.get(sk);
    if (parentListeners) {
      parentListeners.delete(listenerCallback);
    }

    _state.delete(dk);
    _listeners.delete(dk);
    _initial.delete(dk);
    _metrics.delete(dk);
  };

  return [dk, dispose];
}
export function throttleRelay(srcKey: any, destKey: any, ms: number): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  let last = 0
  return subscribeRelay(src, v => {
    const now = Date.now()
    if (now - last >= ms) { last = now; _writeResolved(dest, v, 'derived', src) }
  })
}
export function mergeRelays(srcKeys: any[], destKey: any): () => void {
  const dest = resolveKey(destKey)
  const unsubs = srcKeys.map(k => {
    const src = resolveKey(k)
    return subscribeRelay(src, v => _writeResolved(dest, v, 'derived', src))
  })
  return () => unsubs.forEach(u => u())
}
export function zipRelays(srcKeys: any[], destKey: any): () => void {
  const dest = resolveKey(destKey)
  const emitted = new Map<string, any>()
  const rks = srcKeys.map(resolveKey)
  const unsubs = rks.map(rk => subscribeRelay(rk, v => {
    emitted.set(rk, v)
    if (rks.every(k => emitted.has(k))) {
      _writeResolved(dest, rks.map(k => emitted.get(k)), 'derived', rk)
      emitted.clear()
    }
  }))
  return () => unsubs.forEach(u => u())
}
export function combineRelays(srcKeys: any[], destKey: any): () => void {
  const dest = resolveKey(destKey)
  const rks = srcKeys.map(resolveKey)
  const emit = (src: string) => {
    const out: Record<string, any> = {}
    rks.forEach(k => { out[k] = _state.get(k) })
    _writeResolved(dest, out, 'derived', src)
  }
  const unsubs = rks.map(rk => subscribeRelay(rk, () => emit(rk)))
  return () => unsubs.forEach(u => u())
}
export function scanRelay<T, A>(srcKey: any, destKey: any, reducer: (acc: A, value: T) => A, seed: A): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  let acc = seed
  _writeResolved(dest, acc, 'derived', src)
  return subscribeRelay<T>(src, v => { acc = reducer(acc, v); _writeResolved(dest, acc, 'derived', src) })
}
export function switchRelay(srcKey: any, destKey: any): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  let innerUnsub: (() => void) | null = null
  return subscribeRelay(src, (targetKey: any) => {
    if (innerUnsub) innerUnsub()
    const inner = resolveKey(targetKey)
    innerUnsub = subscribeRelay(inner, v => _writeResolved(dest, v, 'derived', inner))
  })
}
export function bufferRelay(srcKey: any, destKey: any, count: number): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  const buf: any[] = []
  return subscribeRelay(src, v => {
    buf.push(v)
    if (buf.length >= count) { _writeResolved(dest, [...buf], 'derived', src); buf.length = 0 }
  })
}
export function windowRelay(srcKey: any, destKey: any, ms: number): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  const buf: any[] = []
  const interval = setInterval(() => { if (buf.length) { _writeResolved(dest, [...buf], 'derived', src); buf.length = 0 } }, ms)
  const unsub = subscribeRelay(src, v => buf.push(v))
  return () => { unsub(); clearInterval(interval) }
}
export function distinctRelay<T>(srcKey: any, destKey: any, equals?: (a: T, b: T) => boolean): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  let last: T | undefined
  return subscribeRelay<T>(src, v => {
    const same = last !== undefined && (equals ? equals(last, v) : Object.is(last, v))
    if (!same) { last = v; _writeResolved(dest, v, 'derived', src) }
  })
}
export function auditRelay(srcKey: any, destKey: any, ms: number): () => void {
  const src = resolveKey(srcKey)
  const dest = resolveKey(destKey)
  let timer: ReturnType<typeof setTimeout> | null = null
  let latest: any
  return subscribeRelay(src, v => {
    latest = v
    if (!timer) timer = setTimeout(() => { _writeResolved(dest, latest, 'derived', src); timer = null }, ms)
  })
}
export function sampleRelay(srcKey: any, triggerKey: any, destKey: any): () => void {
  const src = resolveKey(srcKey)
  const trigger = resolveKey(triggerKey)
  const dest = resolveKey(destKey)
  return subscribeRelay(trigger, () => _writeResolved(dest, _state.get(src), 'derived', trigger))
}
export function gateRelay(srcKey: any, gateKey: any, destKey: any): () => void {
  const src = resolveKey(srcKey)
  const gate = resolveKey(gateKey)
  const dest = resolveKey(destKey)
  return subscribeRelay(src, v => { if (_state.get(gate)) _writeResolved(dest, v, 'derived', src) })
}
// #endregion
// #region ─── CORE WRITE ──────────────────────────────────────────────────────────────
export function _writeResolved(rk: string, value: any, source: CausalEntry['source'], cause?: string): void {
  if (_frozen.has(rk)) return;
  _pending.add(rk);
  try {
    const prev = _state.get(rk);

    // 1. Schema Validation & Coercion
    let nextValue = _validateSchema(rk, value);
    if (nextValue === null && value !== null) return; // Halt if validation rejected

    // 2. Conflict Policy Handling
    if (_state.has(rk) && !Object.is(prev, nextValue)) {
      const resolvedValue = _resolveConflict(rk, prev, nextValue);
      if (resolvedValue === null) return; // Strategy aborted write
      nextValue = resolvedValue;
    }

    // 3. Update State & Version Trackers
    _state.set(rk, nextValue);
    const nextVer = (_RelayVersions.get(rk) ?? 0) + 1;
    _RelayVersions.set(rk, nextVer);

    // 4. Contract Checks (If broken, rollbacks or errors trigger)
    if (!_enforceContracts(rk)) {
      // Revert if contract fails and blocks
      _state.set(rk, prev);
      _RelayVersions.set(rk, nextVer - 1);
      return;
    }

    // 5. Audit Logging & Structural History Timeline Tracking
    _recordCausal(rk, nextValue, source, cause);
    const hist = _history.get(rk);
    if (hist) {
      const max = _historyMax.get(rk) ?? 50;
      hist.push({ value: nextValue, timestamp: Date.now(), source });
      if (hist.length > max) hist.shift();
      _historyIdx.set(rk, hist.length);
    }

    // 6. Metrics & Performance Collection
    const m = _metrics.get(rk);
    if (m) {
      m.writeCount++;
      m.lastWrite = Date.now();
    }

    // 7. Invoke Local Hooks
    _lifecycle.get(rk)?.onWrite?.(nextValue, prev);

    // 8. Queue Transitive Dependencies into Priority Engine
    _lastWriteSource.set(rk, source);
    _flushQueue.push(rk);
    _triggerFlushLoop();

  } finally {
    _pending.delete(rk);
  }
}
function _triggerFlushLoop(): void {
  if (_isFlushing) return;
  _isFlushing = true;

  queueMicrotask(() => {
    try {
      while (_flushQueue.size > 0) {
        const currentKey = _flushQueue.pop()!;

        // Notify subscribers directly bound to this Relay instance
        const listeners = _listeners.get(currentKey);
        if (listeners) {
          const currentValue = _state.get(currentKey);
          const src = _lastWriteSource.get(currentKey);
          for (const listener of listeners) {
            try {
              listener(currentValue, src);
            } catch (err) {
              console.error(`Error in listener for key ${currentKey}:`, err);
            }
          }
        }

        // Run side-effects attached to this dependency node
        for (const [effectId, effect] of _effects.entries()) {
          if (effect.keys.includes(currentKey)) {
            _runEffect(effect);
          }
        }
      }
    } finally {
      _isFlushing = false;
    }
  });
}
// #endregion
// #region ─── DEPENDENCY TRACKING (TOPOLOGICAL SORT) ──────────────────────────────────── 
class DependencyGraph {
  private _nodes = new Map<string, {
    deps: Set<string>
    dependents: Set<string>
    level: number
    version: number
  }>()

  addNode(key: string, deps: string[]): void {
    if (this._nodes.has(key)) {
      const node = this._nodes.get(key)!
      const oldDeps = new Set(node.deps)
      node.deps = new Set(deps)

      for (const dep of oldDeps) {
        const depNode = this._nodes.get(dep)
        if (depNode) depNode.dependents.delete(key)
      }

      for (const dep of deps) {
        if (!this._nodes.has(dep)) {
          this._nodes.set(dep, { deps: new Set<string>(), dependents: new Set<string>(), level: 0, version: 0 })
        }
        this._nodes.get(dep)!.dependents.add(key)
      }
    } else {
      const node: { deps: Set<string>; dependents: Set<string>; level: number; version: number } = { deps: new Set(deps), dependents: new Set<string>(), level: 0, version: 0 }
      for (const dep of deps) {
        if (!this._nodes.has(dep)) {
          this._nodes.set(dep, { deps: new Set<string>(), dependents: new Set<string>(), level: 0, version: 0 })
        }
        this._nodes.get(dep)!.dependents.add(key)
      }
      this._nodes.set(key, node)
    }
    this._computeLevels()
  }

  private _computeLevels(): void {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // 1. Establish the current in-degree graph
    for (const [key, node] of this._nodes.entries()) {
      inDegree.set(key, node.deps.size);
      node.level = 0;
      if (node.deps.size === 0) {
        queue.push(key);
      }
    }

    // 2. Perform BFS to compute strict topological depths
    while (queue.length > 0) {
      const currentKey = queue.shift()!;
      const currentNode = this._nodes.get(currentKey)!;

      for (const depKey of currentNode.dependents) {
        const depNode = this._nodes.get(depKey)!;
        depNode.level = Math.max(depNode.level, currentNode.level + 1);

        const remaining = (inDegree.get(depKey) ?? 0) - 1;
        inDegree.set(depKey, remaining);
        if (remaining === 0) {
          queue.push(depKey);
        }
      }
    }
  }

  getDependents(key: string): string[] {
    const node = this._nodes.get(key)
    return node ? Array.from(node.dependents) : []
  }

  getLevel(key: string): number {
    return this._nodes.get(key)?.level ?? 0
  }

  markDirty(key: string): void {
    const node = this._nodes.get(key)
    if (!node) return
    node.version++

    // Propagate to dependents
    for (const dep of node.dependents) {
      const depNode = this._nodes.get(dep)
      if (depNode) depNode.version++
    }
  }
}
const _dependencyGraph = new DependencyGraph();

// #endregion
// #region ─── CSE ADAPTERS ────────────────────────────────────────────────────────────
type ChannelOptions = {
  ttl?: number
}
const SAURON_BUS_ROOT = 'sauron_Relays';

export function fromChannel<T>(key: any): () => void {
  const rk = resolveKey(key)
  createRelay(key, undefined)

  return this.multisub(SAURON_BUS_ROOT, rk, (p: any) => {
    _writeResolved(rk, p, 'staff', rk)
  })
}

export function toChannel1(key: any, options: ChannelOptions = {}): () => void {
  const rk = resolveKey(key)

  return subscribeRelay(key, (v, source?: CausalEntry['source']) => {
    if (source === 'staff') return; // this value just arrived from the bus — don't send it back out
    this.sendsub(SAURON_BUS_ROOT, rk, v, options.ttl).catch(() => { })
  })
}
export function toChannel(key: any, options: ChannelOptions = {}): () => void {
  const rk = resolveKey(key)
  return subscribeRelay(key, (v, source) => {
    if (source === 'staff') return; // arrived from the bus — don't rebroadcast
    this.sendsub(SAURON_BUS_ROOT, rk, v, options.ttl).catch(() => { })
  })
}
export function fromLoaderData<T>(key: any, loaderData: any, field: string): void {
  const rk = resolveKey(key)
  const value = loaderData?.[field] as T
  if (value !== undefined) _writeResolved(rk, value, 'staff', `loader:${field}`)
}
// #endregion
// #region ─── NGIN ADAPTERS ───────────────────────────────────────────────────────────
export async function watchRelay<T>(key: any): Promise<() => void> {
  const rk = resolveKey(key)
  const ngin = NginClient(staff)
  await ngin.watch(rk, (value: T) => _writeResolved(rk, value, 'ngin', `ngin:watch:${rk}`))
  return () => { }
}
export async function atomicWriteRelay<T>(key: any, fn: (current: T | null) => T): Promise<void> {
  const rk = resolveKey(key)
  const ngin = NginClient(staff)
  const result = await ngin.atomic.mutate(rk, fn) as T
  _writeResolved(rk, result, 'ngin', rk)
}
export async function incrementRelay(key: any, by = 1): Promise<number> {
  const rk = resolveKey(key)
  const ngin = NginClient(staff)
  const result = await ngin.atomic.increment(rk, by)
  _writeResolved(rk, result, 'ngin', rk)
  return result
}
export async function lockRelay(key: any, ttl?: number): Promise<string | null> {
  const ngin = NginClient(staff)
  return ngin.lock(resolveKey(key), ttl)
}
export async function unlockRelay(key: any, owner: string): Promise<boolean> {
  const ngin = NginClient(staff)
  return ngin.unlock(resolveKey(key), owner)
}
export function transactionRelay(block: () => void): void {
  const backupState = new Map<string, any>();

  for (const [k, v] of _state.entries()) {
    if (v !== null && typeof v === 'object') {
      try {
        backupState.set(k, structuredClone(v));
      } catch {
        backupState.set(k, Object.create(Object.getPrototypeOf(v), Object.getOwnPropertyDescriptors(v)));
      }
    } else {
      backupState.set(k, v);
    }
  }

  try {
    block();
  } catch (error) {
    for (const currentKey of _state.keys()) {
      if (!backupState.has(currentKey)) {
        _state.delete(currentKey);
      }
    }

    for (const [k, v] of backupState.entries()) {
      _state.set(k, v);
    }

    console.error("Atomic transaction aborted. Engine rolled back state cleanly.", error);
    throw error;
  }
}
export async function queryRelays(expr: any): Promise<{ key: string; value: any }[]> {
  const ngin = NginClient(staff)
  return ngin.query(expr)
}
// ─── PRODUCTION OBSERVABILITY ────────────────────────────────────────────────
type MetricsSink = (metric: RelayMetric & { key: string }) => void
let _metricsSink: MetricsSink | null = null
export function registerMetricsSink(sink: MetricsSink): void {
  _metricsSink = sink
}
export function hotRelays(n: number): { key: string; writeCount: number }[] {
  return Array.from(_metrics.entries())
    .map(([k, m]) => ({ key: k, writeCount: m.writeCount }))
    .sort((a, b) => b.writeCount - a.writeCount)
    .slice(0, n)
}
export function staleRelays(thresholdMs: number): string[] {
  const now = Date.now()
  return Array.from(_metrics.entries())
    .filter(([k, m]) => m.subscriberCount > 0 && (now - (m.lastWrite ?? 0) > thresholdMs))
    .map(([k]) => k)
}
export function orphanRelays(): string[] {
  return Array.from(_metrics.entries())
    .filter(([k, m]) => m.subscriberCount === 0 && !_async.has(k))
    .map(([k]) => k)
}
export function exportGraph(): { Relays: any[]; derived: any[]; contracts: any[]; scopes: any[] } {
  return {
    Relays: Array.from(_state.keys()).map(k => ({
      key: k,
      value: _state.get(k),
      metrics: _metrics.get(k),
      frozen: _frozen.has(k),
      sealed: _sealed.has(k)
    })),
    derived: Array.from(_derived.keys()).map(k => ({
      key: k,
      deps: Array.from(_derivedDeps.entries()).filter(([, v]) => v.has(k)).map(([dk]) => dk)
    })),
    contracts: Array.from(_contracts.values()),
    scopes: Array.from(_scopes.entries()).map(([id, s]) => ({ id, keys: Array.from(s.keys) }))
  }
}
// #endregion
// #region ─── GLOBAL Relay MIDDLEWARE ──────────────────────────────────────────────
let _globalRelayHooks: {
  onWrite?: (key: string, value: any, prev: any) => void
  onRead?: (key: string, value: any) => void
  onError?: (key: string, err: Error) => void
} | null = null

export function useGlobalRelayMiddleware(hooks: {
  onWrite?: (key: string, value: any, prev: any) => void
  onRead?: (key: string, value: any) => void
  onError?: (key: string, err: Error) => void
}): void {
  _globalRelayHooks = hooks
}
// #endregion
// #region ─── DEVTOOLS ────────────────────────────────────────────────────────────────
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
  (globalThis as any).__SAURON_RelayS_API__ = {
    read: readRelay,
    write: writeRelay,
    snapshot: snapshotRelays,
    restore: restoreRelays,
    graph: exportGraph,
    causal: getCausalChain,
    timeline: RelayTimeline,
    metrics: () => Object.fromEntries(_metrics)
  }
}
// #endregion
