import { _sid , signal, createHook, HookState, type Signal  } from '#the-cloud'
import {  batch as batchSignal, } from '#sauron'
// ─── Shared types ────────────────────────────────────────────────────────────

type BatchConfig = number | { size?: number; wait?: number; maxWait?: number }

interface BatchState<T, R> {
  add:     (item: T) => Promise<R>
  pending: number
  clear:   () => void
}

interface BatchedFunction<T extends any[], R> {
  (...args: T): Promise<R>
  flush: () => Promise<void>
  clear: () => void
}

// ─── Standalone batch (no hook) ──────────────────────────────────────────────

  function batch<T, R>(
  fn: (items: T[]) => Promise<R[]>,
  config: BatchConfig = 10
) {
  const size    = typeof config === 'number' ? config : (config.size ?? 10)
  const wait    = typeof config === 'number' ? 100    : (config.wait ?? 100)
  const maxWait = typeof config === 'number' ? undefined : config.maxWait

  let items:     T[]                        = []
  let resolvers: ((value: R) => void)[]     = []
  let rejecters: ((error: any) => void)[]   = []
  let timeout:    ReturnType<typeof setTimeout> | null = null
  let maxTimeout: ReturnType<typeof setTimeout> | null = null
  let firstItemTime = 0

  async function processBatch(): Promise<void> {
    if (items.length === 0) return
    const batchItems     = items.splice(0, size)
    const batchResolvers = resolvers.splice(0, size)
    const batchRejecters = rejecters.splice(0, size)
    if (timeout)    { clearTimeout(timeout);    timeout    = null }
    if (maxTimeout) { clearTimeout(maxTimeout); maxTimeout = null }
    try {
      const results = await fn(batchItems)
      batchResolvers.forEach((resolve, i) => resolve(results[i]))
    } catch (error) {
      batchRejecters.forEach(reject => reject(error))
    }
    firstItemTime = 0
    if (items.length > 0) { firstItemTime = Date.now(); scheduleBatch() }
  }

  function scheduleBatch(): void {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => processBatch(), wait)
    if (maxWait !== undefined && firstItemTime === 0) {
      firstItemTime = Date.now()
      if (maxTimeout) clearTimeout(maxTimeout)
      maxTimeout = setTimeout(() => processBatch(), maxWait)
    }
  }

  return (item: T): Promise<R> => new Promise((resolve, reject) => {
    items.push(item); resolvers.push(resolve); rejecters.push(reject)
    items.length >= size ? processBatch() : scheduleBatch()
  })
}

// ─── Standalone asyncBatch (no hook) ─────────────────────────────────────────

 function asyncBatch<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: BatchConfig = 10
): BatchedFunction<T, R> {
  const size    = typeof config === 'number' ? config : (config.size ?? 10)
  const wait    = typeof config === 'number' ? 100    : (config.wait ?? 100)
  const maxWait = typeof config === 'number' ? undefined : config.maxWait

  let calls: { args: T; resolve: (value: R) => void; reject: (error: any) => void }[] = []
  let timeout:    ReturnType<typeof setTimeout> | null = null
  let maxTimeout: ReturnType<typeof setTimeout> | null = null
  let firstCallTime = 0

  async function processBatch(): Promise<void> {
    if (calls.length === 0) return
    const batchCalls = calls.splice(0, size)
    if (timeout)    { clearTimeout(timeout);    timeout    = null }
    if (maxTimeout) { clearTimeout(maxTimeout); maxTimeout = null }
    await Promise.all(batchCalls.map(async ({ args, resolve, reject }) => {
      try { resolve(await fn(...args)) } catch (error) { reject(error) }
    }))
    firstCallTime = 0
    if (calls.length > 0) { firstCallTime = Date.now(); scheduleBatch() }
  }

  function scheduleBatch(): void {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => processBatch(), wait)
    if (maxWait !== undefined && firstCallTime === 0) {
      firstCallTime = Date.now()
      if (maxTimeout) clearTimeout(maxTimeout)
      maxTimeout = setTimeout(() => processBatch(), maxWait)
    }
  }

  const batched = (...args: T): Promise<R> => new Promise((resolve, reject) => {
    calls.push({ args, resolve, reject })
    calls.length >= size ? processBatch() : scheduleBatch()
  })

  batched.flush = async () => processBatch()
  batched.clear = () => {
    calls = []
    if (timeout)    clearTimeout(timeout)
    if (maxTimeout) clearTimeout(maxTimeout)
    timeout = maxTimeout = null
    firstCallTime = 0
  }

  return batched as BatchedFunction<T, R>
}

// ─── useBatch ────────────────────────────────────────────────────────────────

interface UseBatchHookState<T, R> extends HookState {
  items:         T[]
  resolvers:     ((value: R) => void)[]
  rejecters:     ((error: any) => void)[]
  timeout:       ReturnType<typeof setTimeout> | null
  maxTimeout:    ReturnType<typeof setTimeout> | null
  firstItemTime: number
  pending:       Signal<number>
}

export function useBatch<T, R>(
  fn:     (items: T[]) => Promise<R[]>,
  config: BatchConfig = 10,
  __sauron_id__ = _sid()
): BatchState<T, R> {
  const size    = typeof config === 'number' ? config : (config.size ?? 10)
  const wait    = typeof config === 'number' ? 100    : (config.wait ?? 100)
  const maxWait = typeof config === 'number' ? undefined : config.maxWait

  return createHook(
    'useBatch',
    __sauron_id__,
    (): UseBatchHookState<T, R> => {
      const s: UseBatchHookState<T, R> = {
        value:         undefined,
        items:         [],
        resolvers:     [],
        rejecters:     [],
        timeout:       null,
        maxTimeout:    null,
        firstItemTime: 0,
        pending:       signal(0)
      }
      s.cleanup = () => {
        if (s.timeout)    clearTimeout(s.timeout)
        if (s.maxTimeout) clearTimeout(s.maxTimeout)
      }
      return s
    },
    (s: UseBatchHookState<T, R>) => {
      const processBatch = async () => {
        if (s.items.length === 0) return
        const batchItems     = s.items.splice(0, size)
        const batchResolvers = s.resolvers.splice(0, size)
        const batchRejecters = s.rejecters.splice(0, size)
        if (s.timeout)    { clearTimeout(s.timeout);    s.timeout    = null }
        if (s.maxTimeout) { clearTimeout(s.maxTimeout); s.maxTimeout = null }
        s.pending.value -= batchItems.length
        try {
          const results = await fn(batchItems)
          batchResolvers.forEach((resolve, i) => resolve(results[i]))
        } catch (error) {
          batchRejecters.forEach(reject => reject(error))
        }
        s.firstItemTime = 0
        if (s.items.length > 0) { s.firstItemTime = Date.now(); scheduleBatch() }
      }

      const scheduleBatch = () => {
        if (s.timeout) clearTimeout(s.timeout)
        s.timeout = setTimeout(() => processBatch(), wait)
        if (maxWait !== undefined && s.firstItemTime === 0) {
          s.firstItemTime = Date.now()
          if (s.maxTimeout) clearTimeout(s.maxTimeout)
          s.maxTimeout = setTimeout(() => processBatch(), maxWait)
        }
      }

      const add = (item: T): Promise<R> => new Promise((resolve, reject) => {
        s.items.push(item); s.resolvers.push(resolve); s.rejecters.push(reject)
        s.pending.value += 1
        s.items.length >= size ? processBatch() : scheduleBatch()
      })

      const clear = () => {
        s.items = []; s.resolvers = []; s.rejecters = []
        s.pending.value = 0
        if (s.timeout)    clearTimeout(s.timeout)
        if (s.maxTimeout) clearTimeout(s.maxTimeout)
        s.timeout = s.maxTimeout = null
        s.firstItemTime = 0
      }

      return { add, pending: s.pending.value, clear }
    }
  )
}

// ─── useBatch2 ───────────────────────────────────────────────────────────────

interface UseBatch2HookState<T extends any[], R> extends HookState {
  callback:   (...args: T) => R
  updates:    (() => void)[]
  isBatching: boolean
  processor:  ReturnType<typeof asyncBatch<[() => void], void>>
}

export function useBatch2<T extends any[], R>(
  callback: (...args: T) => R,
  config:   BatchConfig = 10,
  __sauron_id__ = _sid()
): [(...args: T) => R, (update: () => void) => void, () => Promise<void>, () => void, () => number] {
  return createHook(
    'useBatch2',
    __sauron_id__,
    (): UseBatch2HookState<T, R> => {
      const s: UseBatch2HookState<T, R> = {
        value:      undefined,
        callback,
        updates:    [],
        isBatching: false,
        processor:  asyncBatch<[() => void], void>(
          async (fn) => { fn() },
          config
        )
      }
      s.cleanup = () => s.processor.clear()
      return s
    },
    (s: UseBatch2HookState<T, R>) => {
      const batchedCall = (...args: T): R => {
        s.isBatching = true
        try {
          const result = s.callback(...args)
          queueMicrotask(() => {
            if (s.updates.length > 0) {
              /**Argument of type '() => void' is not assignable to parameter of type '(items: unknown[]) => Promise<unknown[]>'.
  Type 'void' is not assignable to type 'Promise<unknown[]>'.ts(2345)
function(): void */
              batchSignal(() => {
                s.updates.forEach(u => u())
                s.updates = []
              })
            }
            s.isBatching = false
          })
          return result
        } catch (error) {
          s.isBatching = false
          throw error
        }
      }

      const addUpdate = (update: () => void) => {
        s.isBatching ? s.updates.push(update) : update()
      }

      const flush = async () => {
        if (s.updates.length > 0) {
          /**Argument of type '() => void' is not assignable to parameter of type '(items: unknown[]) => Promise<unknown[]>'.
  Type 'void' is not assignable to type 'Promise<unknown[]>'.ts(2345)
(method) Array<() => void>.forEach(callbackfn: (value: () => void, index: number, array: (() => void)[]) => void, thisArg?: any): void
Performs the specified action for each element in an array.

@param callbackfn — A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.

@param thisArg — An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

 */
          batchSignal(() => { s.updates.forEach(u => u()); s.updates = [] })
        }
        await s.processor.flush()
      }

      const clear = () => { s.updates = []; s.processor.clear() }

      const getPendingCount = () => s.updates.length

      return [batchedCall, addUpdate, flush, clear, getPendingCount]
    }
  )
}

// ─── useBatch3 ───────────────────────────────────────────────────────────────

interface UseBatch3HookState<T extends any[], R> extends HookState {
  callback:     (...args: T) => R
  updates:      Map<string, (() => void)[]>
  isBatching:   boolean
  processor:    ReturnType<typeof asyncBatch<[() => void], void>>
  batchSignal:  Signal<Record<string, number>> | null
}

export function useBatch3<T extends any[], R>(
  callback:  (...args: T) => R,
  config:    BatchConfig = 10,
  signalId?: string,
  __sauron_id__ = _sid()
): [(...args: T) => R, (componentId: string, update: () => void) => void, () => Promise<void>, () => void] {
  return createHook(
    'useBatch3',
    __sauron_id__,
    (): UseBatch3HookState<T, R> => {
      const s: UseBatch3HookState<T, R> = {
        value:       undefined,
        callback,
        updates:     new Map(),
        isBatching:  false,
        processor:   asyncBatch<[() => void], void>(
          async (fn) => { fn() },
          config
        ),
        batchSignal: signalId ? signal<Record<string, number>>({}) : null
      }
      s.cleanup = () => s.processor.clear()
      return s
    },
    (s: UseBatch3HookState<T, R>) => {
      const batchedCall = (...args: T): R => {
        s.isBatching = true
        try {
          const result = s.callback(...args)
          queueMicrotask(() => {
            /**Argument of type '() => void' is not assignable to parameter of type '(items: unknown[]) => Promise<unknown[]>'.
  Type 'void' is not assignable to type 'Promise<unknown[]>'.ts(2345)
 */
            batchSignal(() => {
              s.updates.forEach((componentUpdates, componentId) => {
                if (componentUpdates.length > 0) {
                  componentUpdates.forEach(u => u())
                  s.updates.set(componentId, [])
                }
              })
              if (s.batchSignal) {
                s.batchSignal.value = {
                  ...s.batchSignal.peek(),
                  [signalId!]: Date.now()
                }
              }
            })
            s.isBatching = false
          })
          return result
        } catch (error) {
          s.isBatching = false
          throw error
        }
      }

      const addUpdate = (componentId: string, update: () => void) => {
        if (!s.updates.has(componentId)) s.updates.set(componentId, [])
        s.isBatching ? s.updates.get(componentId)!.push(update) : update()
      }

      const flush = async () => {
        /**
         * Argument of type '() => void' is not assignable to parameter of type '(items: unknown[]) => Promise<unknown[]>'.
  Type 'void' is not assignable to type 'Promise<unknown[]>'.ts(2345)
function(): void
         */
        batchSignal(() => {
          s.updates.forEach((updates, componentId) => {
            if (updates.length > 0) {
              updates.forEach(u => u())
              s.updates.set(componentId, [])
            }
          })
        })
        await s.processor.flush()
      }

      const clear = () => { s.updates.clear(); s.processor.clear() }

      return [batchedCall, addUpdate, flush, clear]
    }
  )
}





