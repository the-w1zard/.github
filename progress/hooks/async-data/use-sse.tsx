import { createHook, HookState } from '#the-cloud'
import { staff } from '../../../conduits/staff/staff';
import { _sid } from '../_sid'

// ─── SSE Store ───────────────────────────────────────────────────────────────

export type SSEStore = Record<string, { value: any; ts: number; version?: number }>

const _store: SSEStore = {}
const _storeListeners = new Set<(store: SSEStore) => void>()
const _channelListeners = new Map<string, Set<(value: any, metadata?: any) => void>>()

export function sseSet(key: string, value: any, metadata?: any): void {
  _store[key] = { value, ts: Date.now(), version: metadata?.version }
  _channelListeners.get(key)?.forEach(fn => fn(value, metadata))
  _storeListeners.forEach(fn => fn({ ..._store }))
}

export function sseGet(key: string): { value: any; ts: number; version?: number } | null {
  return _store[key] ?? null
}

export function sseSubscribe(
  _url: string,
  rt: string,
  handler: (value: any, metadata?: any) => void,
  _opts?: { baseDelay?: number; maxDelay?: number; maxAttempts?: number }
): () => void {
  if (!_channelListeners.has(rt)) _channelListeners.set(rt, new Set())
  _channelListeners.get(rt)!.add(handler)

  const unsub = staff.sub( (msg: any) => {
    sseSet(rt, msg?.data ?? msg, msg?.metadata)
    handler(msg?.data ?? msg, msg?.metadata)
  }, `sse:${rt}`,)

  return () => {
    _channelListeners.get(rt)?.delete(handler)
    unsub()
  }
}

export function sseSubscribeStore(handler: (store: SSEStore) => void): () => void {
  _storeListeners.add(handler)
  return () => _storeListeners.delete(handler)
}

// ─── Ymir — conflict resolution engine ───────────────────────────────────────

type ConflictStrategy = 'server-wins' | 'client-wins' | 'merge' | 'version'

interface YmirOptions<T> {
  conflictStrategy?:  ConflictStrategy
  mergeFn?:           (local: T, server: T) => T
  versionField?:      string
  prefetchOnFocus?:   boolean
  prefetchThreshold?: number
  debounce?:          number
  retry?: {
    baseDelay?:  number
    maxDelay?:   number
    maxAttempts?: number
    backoff?:    'exponential' | 'linear' | 'fixed'
  }
}

interface YmirWriteOptions<T> {
  fetcher:    (value: T) => Promise<T>
  optimistic?: boolean
}

export class Ymir<T> {
  serverValue:   T | null = null
  localValue:    T | null = null
  serverVersion: number   = 0

  private listeners = new Set<(value: T) => void>()
  private lastPrefetch = 0

  constructor(private key: string, private opts: YmirOptions<T> = {}) {}

  subscribe(fn: (value: T) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify(value: T) {
    this.listeners.forEach(fn => fn(value))
  }

  shouldPrefetch(): boolean {
    const threshold = this.opts.prefetchThreshold ?? 30_000
    return Date.now() - this.lastPrefetch > threshold
  }

  async write(newValue: T, options: YmirWriteOptions<T>): Promise<T> {
    this.localValue = newValue
    if (options.optimistic) this.notify(newValue)

    const attempts   = this.opts.retry?.maxAttempts ?? 3
    const baseDelay  = this.opts.retry?.baseDelay   ?? 1000
    const maxDelay   = this.opts.retry?.maxDelay    ?? 10_000
    const backoff    = this.opts.retry?.backoff      ?? 'exponential'

    let lastErr: Error | null = null

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const result = await options.fetcher(newValue)
        const resolved = this.resolve(newValue, result)
        this.localValue  = resolved
        this.serverValue = result
        this.notify(resolved)
        sseSet(this.key, resolved)
        staff.send( { data: resolved },`sse:${this.key}`,)
        return resolved
      } catch (e) {
        lastErr = e as Error
        if (attempt < attempts - 1) {
          const delay = backoff === 'exponential'
            ? Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
            : backoff === 'linear'
            ? Math.min(baseDelay * (attempt + 1), maxDelay)
            : baseDelay
          await new Promise(r => setTimeout(r, delay))
        }
      }
    }

    if (!options.optimistic && this.serverValue !== null) this.notify(this.serverValue)
    throw lastErr
  }

  private resolve(local: T, server: T): T {
    const strategy = this.opts.conflictStrategy ?? 'server-wins'
    if (strategy === 'client-wins') return local
    if (strategy === 'server-wins') return server
    if (strategy === 'merge' && this.opts.mergeFn) return this.opts.mergeFn(local, server)
    if (strategy === 'version') {
      const field = this.opts.versionField ?? 'version'
      const lv = (local as any)[field] ?? 0
      const sv = (server as any)[field] ?? 0
      return lv >= sv ? local : server
    }
    return server
  }
}

// ─── useSSE ───────────────────────────────────────────────────────────────────

export interface UseSSEOptions {
  baseDelay?:  number
  maxDelay?:   number
  maxAttempts?: number
  transform?:  (data: any) => any
}

interface SSEHookState extends HookState {
  data:      any
  connected: boolean
  error:     Error | null
  unsub:     (() => void) | null
}

export function useSSE<T = unknown>(
  url:           string,
  rt:       string,
  options:       UseSSEOptions = {},
  __sauron_id__ = _sid()
): { data: T | null; connected: boolean; error: Error | null } {
  return createHook(
    'useSSE',
    __sauron_id__,
    (): SSEHookState => {
      const s: SSEHookState = {
        value:     undefined,
        data:      null,
        connected: false,
        error:     null,
        unsub:     null
      }
      s.cleanup = () => { s.unsub?.(); s.unsub = null }
      return s
    },
    (s: HookState, key, notify) => {
      const state = s as SSEHookState
      if (!state.unsub) {
        state.unsub = sseSubscribe(url, rt, (incoming: any) => {
          state.connected = true
          state.data      = options.transform ? options.transform(incoming) : incoming
          notify(key)
        }, { baseDelay: options.baseDelay, maxDelay: options.maxDelay, maxAttempts: options.maxAttempts })
      }
      return { data: state.data as T | null, connected: state.connected, error: state.error }
    }
  )
}

// ─── useSSEStore ──────────────────────────────────────────────────────────────

interface SSEStoreHookState extends HookState {
  store: SSEStore
  unsub: (() => void) | null
}

export function useSSEStore(__sauron_id__ = _sid()): SSEStore {
  return createHook(
    'useSSEStore',
    __sauron_id__,
    (): SSEStoreHookState => {
      const s: SSEStoreHookState = { value: undefined, store: { ..._store }, unsub: null }
      s.cleanup = () => { s.unsub?.(); s.unsub = null }
      return s
    },
    (s: HookState, key, notify) => {
      const state = s as SSEStoreHookState
      if (!state.unsub) {
        state.unsub = sseSubscribeStore(store => { state.store = store; notify(key) })
      }
      return state.store
    }
  )
}

// ─── useSSEValue ──────────────────────────────────────────────────────────────

interface SSEValueHookState extends HookState {
  data: any
  unsub: (() => void) | null
}

export function useSSEValue<T = unknown>(rt: string, __sauron_id__ = _sid()): T | null {
  return createHook(
    'useSSEValue',
    __sauron_id__,
    (): SSEValueHookState => {
      const existing = sseGet(rt)
      const s: SSEValueHookState = { value: undefined, data: existing?.value ?? null, unsub: null }
      s.cleanup = () => { s.unsub?.(); s.unsub = null }
      return s
    },
    (s: HookState, key, notify) => {
      const state = s as SSEValueHookState
      if (!state.unsub) {
        state.unsub = sseSubscribe('store', rt, (data: any) => { state.data = data; notify(key) })
      }
      return state.data as T | null
    }
  )
}

// ─── useYmir ──────────────────────────────────────────────────────────────────

export interface UseYmirOptions<T> {
  conflictStrategy?:  ConflictStrategy
  mergeFn?:           (local: T, server: T) => T
  versionField?:      string
  prefetchOnFocus?:   boolean
  prefetchThreshold?: number
  debounce?:          number
  retry?: {
    baseDelay?:   number
    maxDelay?:    number
    maxAttempts?: number
    backoff?:     'exponential' | 'linear' | 'fixed'
  }
  loader: () => Promise<T>
  writer: (value: T) => Promise<T>
}

interface YmirHookState<T> extends HookState {
  data:        T | null
  pending:     boolean
  error:       Error | null
  lastFetched: number
  ymir:        Ymir<T>
  unsubs:      (() => void)[]
}

export function useYmir<T = unknown>(
  key:           string,
  options:       UseYmirOptions<T>,
  __sauron_id__ = _sid()
): {
  value:       T | null
  setValue:    (value: T | ((prev: T | null) => T)) => Promise<T>
  pending:     boolean
  error:       Error | null
  refresh:     () => Promise<T>
  lastFetched: number
} {
  return createHook(
    'useYmir',
    __sauron_id__,
    (): YmirHookState<T> => {
      const s: YmirHookState<T> = {
        value:       undefined,
        data:        null,
        pending:     false,
        error:       null,
        lastFetched: 0,
        ymir:        new Ymir<T>(key, options),
        unsubs:      []
      }
      s.cleanup = () => { s.unsubs.forEach(u => u()); s.unsubs = [] }
      return s
    },
    (s: HookState, hookKey, notify) => {
      const state = s as YmirHookState<T>

      if (state.unsubs.length === 0) {
        // subscribe to ymir value changes
        state.unsubs.push(state.ymir.subscribe(val => { state.data = val; notify(hookKey) }))

        // subscribe to staff sse rt for this key
        state.unsubs.push(staff.sub(`sse:${key}`, (msg: any) => {
          state.ymir.serverValue = msg?.data ?? msg
          if (msg?.metadata?.version) state.ymir.serverVersion = msg.metadata.version
          state.lastFetched = Date.now()
          notify(hookKey)
        }))

        // prefetch on focus
        if (options.prefetchOnFocus && typeof window !== 'undefined') {
          const onFocus = async () => {
            if (!state.ymir.shouldPrefetch()) return
            try {
              state.pending = true; notify(hookKey)
              const data = await options.loader()
              state.ymir.serverValue = data
              state.lastFetched = Date.now()
              sseSet(key, data)
            } catch (e) {
              state.error = e as Error
            } finally {
              state.pending = false; notify(hookKey)
            }
          }
          window.addEventListener('focus', onFocus)
          state.unsubs.push(() => window.removeEventListener('focus', onFocus))
        }

        // load initial
        ;(async () => {
          try {
            state.pending = true; notify(hookKey)
            const data = await options.loader()
            state.ymir.serverValue = data
            state.ymir.localValue  = data
            state.data             = data
            state.lastFetched      = Date.now()
            sseSet(key, data)
          } catch (e) {
            state.error = e as Error
          } finally {
            state.pending = false; notify(hookKey)
          }
        })()
      }

      const setValue = async (valueOrFn: T | ((prev: T | null) => T)): Promise<T> => {
        const next = typeof valueOrFn === 'function' ? (valueOrFn as (p: T | null) => T)(state.data) : valueOrFn
        try {
          state.pending = true; state.error = null; notify(hookKey)
          return await state.ymir.write(next, { fetcher: options.writer, optimistic: true })
        } catch (e) {
          state.error = e as Error; throw e
        } finally {
          state.pending = false; notify(hookKey)
        }
      }

      const refresh = async (): Promise<T> => {
        try {
          state.pending = true; notify(hookKey)
          const data = await options.loader()
          state.ymir.serverValue = data
          state.ymir.localValue  = data
          state.data             = data
          state.lastFetched      = Date.now()
          sseSet(key, data)
          return data
        } catch (e) {
          state.error = e as Error; throw e
        } finally {
          state.pending = false; notify(hookKey)
        }
      }

      return {
        value:       state.data,
        setValue,
        pending:     state.pending,
        error:       state.error,
        refresh,
        lastFetched: state.lastFetched
      }
    }
  )
}
