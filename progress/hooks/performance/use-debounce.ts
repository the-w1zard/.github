
// ───────────────────────────────────────────────
// PURE Sauron‑native debounce (no React, no useEffect)
// ───────────────────────────────────────────────

type DebounceConfig =
  | number
  | {
      wait?: number
      leading?: boolean
      trailing?: boolean
      maxWait?: number
    }

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
}

interface AsyncDebouncedFunction<T extends (...args: any[]) => Promise<any>> {
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>
  cancel: () => void
  flush: () => Promise<Awaited<ReturnType<T>> | undefined>
}

// ───────────────────────────────────────────────
// debounce (sync)
// ───────────────────────────────────────────────

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  config: DebounceConfig = 300
): DebouncedFunction<T> {
  const wait = typeof config === 'number' ? config : config.wait ?? 300
  const leading = typeof config === 'number' ? false : config.leading ?? false
  const trailing = typeof config === 'number' ? true : config.trailing ?? true
  const maxWait = typeof config === 'number' ? undefined : config.maxWait

  let timeout: any = null
  let maxTimeout: any = null
  let lastCallTime = 0
  let lastArgs: Parameters<T> | null = null

  const invoke = () => {
    if (lastArgs) {
      fn(...lastArgs)
      lastArgs = null
    }
  }

  const clearTimers = () => {
    if (timeout) clearTimeout(timeout)
    if (maxTimeout) clearTimeout(maxTimeout)
    timeout = null
    maxTimeout = null
  }

  const debounced = (...args: Parameters<T>) => {
    const now = Date.now()
    const first = lastCallTime === 0

    lastCallTime = now
    lastArgs = args

    if (first && leading) {
      invoke()
      lastArgs = null
    }

    clearTimers()

    if (trailing) {
      timeout = setTimeout(() => {
        invoke()
        lastCallTime = 0
        clearTimers()
      }, wait)
    }

    if (maxWait !== undefined && first) {
      maxTimeout = setTimeout(() => {
        invoke()
        lastCallTime = 0
        clearTimers()
      }, maxWait)
    }
  }

  debounced.cancel = () => {
    clearTimers()
    lastCallTime = 0
    lastArgs = null
  }

  debounced.flush = () => {
    clearTimers()
    if (lastArgs) {
      invoke()
      lastCallTime = 0
    }
  }

  return debounced as DebouncedFunction<T>
}

// ───────────────────────────────────────────────
// asyncDebounce
// ───────────────────────────────────────────────

export function asyncDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: DebounceConfig = 300
): AsyncDebouncedFunction<T> {
  const wait = typeof config === 'number' ? config : config.wait ?? 300
  const leading = typeof config === 'number' ? false : config.leading ?? false
  const trailing = typeof config === 'number' ? true : config.trailing ?? true
  const maxWait = typeof config === 'number' ? undefined : config.maxWait

  let timeout: any = null
  let maxTimeout: any = null
  let lastCallTime = 0
  let lastArgs: Parameters<T> | null = null

  let pending: Promise<any> | null = null
  let resolvePending: any = null
  let rejectPending: any = null

  const invoke = async () => {
    if (!lastArgs) return undefined
    const args = lastArgs
    lastArgs = null

    try {
      const result = await fn(...args)
      if (resolvePending) resolvePending(result)
      pending = resolvePending = rejectPending = null
      return result
    } catch (err) {
      if (rejectPending) rejectPending(err)
      pending = resolvePending = rejectPending = null
      throw err
    }
  }

  const clearTimers = () => {
    if (timeout) clearTimeout(timeout)
    if (maxTimeout) clearTimeout(maxTimeout)
    timeout = null
    maxTimeout = null
  }

  const debounced = async (...args: Parameters<T>) => {
    const now = Date.now()
    const first = lastCallTime === 0

    lastCallTime = now
    lastArgs = args

    if (first && leading) {
      const result = await invoke()
      lastCallTime = 0
      return result
    }

    if (!pending) {
      pending = new Promise((resolve, reject) => {
        resolvePending = resolve
        rejectPending = reject
      })
    }

    clearTimers()

    if (trailing) {
      timeout = setTimeout(async () => {
        await invoke()
        lastCallTime = 0
        clearTimers()
      }, wait)
    }

    if (maxWait !== undefined && first) {
      maxTimeout = setTimeout(async () => {
        await invoke()
        lastCallTime = 0
        clearTimers()
      }, maxWait)
    }

    return pending
  }

  debounced.cancel = () => {
    clearTimers()
    lastCallTime = 0
    lastArgs = null
    if (rejectPending) rejectPending(new Error('Debounced function cancelled'))
    pending = resolvePending = rejectPending = null
  }

  debounced.flush = async () => {
    clearTimers()
    if (lastArgs) {
      const result = await invoke()
      lastCallTime = 0
      return result
    }
    return undefined
  }

  return debounced as AsyncDebouncedFunction<T>
}

// ───────────────────────────────────────────────
// useDebounce (Sauron-native)
// ───────────────────────────────────────────────

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  config: DebounceConfig = 300,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useDebounce',
    __sauron_id__,

    (): HookState => ({
      value: debounce(fn, config)
    }),

    (hook) => hook.value
  )
}

// ───────────────────────────────────────────────
// useAsyncDebounce (Sauron-native)
// ───────────────────────────────────────────────

export function useAsyncDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: DebounceConfig = 300,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useAsyncDebounce',
    __sauron_id__,

    (): HookState => ({
      value: asyncDebounce(fn, config)
    }),

    (hook) => hook.value
  )
}
