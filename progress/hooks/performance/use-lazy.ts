import {  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// Global dedupe registry
// ───────────────────────────────────────────────

const inFlight = new Map<string, Promise<any>>()

// ───────────────────────────────────────────────
// useLazy — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Deterministic lazy loader with:
//   • eager / manual triggering
//   • retry / backoff
//   • timeout
//   • dedupe
//   • reset / reload
// ───────────────────────────────────────────────

export function useLazy<T>(
  loader: () => Promise<T>,
  options: {
    eager?: boolean
    retry?: number
    retryDelay?: number
    timeout?: number
    dedupe?: boolean
  } = {},
  __sauron_id__ = _sid()
) {
  const {
    eager = false,
    retry = 0,
    retryDelay = 300,
    timeout = 0,
    dedupe = true
  } = options

  return createHook(
    'useLazy',
    __sauron_id__,

    (): HookState => ({
      value: {
        data: null as T | null,
        status: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
        error: null as string | null,
        attempts: 0,
        loader,
        triggered: eager
      }
    }),

    (hook, key) => {
      const s = hook.value

      const execute = async (attempt = 0): Promise<void> => {
        s.status = 'loading'
        s.error = null
        s.attempts = attempt + 1
        notifyHook(key)

        const dedupeKey = loader.toString()
        let promise: Promise<T>

        if (dedupe && inFlight.has(dedupeKey)) {
          promise = inFlight.get(dedupeKey)!
        } else {
          let p = Promise.resolve().then(() => loader())

          if (timeout > 0) {
            p = Promise.race([
              p,
              new Promise<T>((_, reject) =>
                setTimeout(
                  () => reject(new Error(`Timeout after ${timeout}ms`)),
                  timeout
                )
              )
            ])
          }

          if (dedupe) {
            inFlight.set(dedupeKey, p)
            p.finally(() => inFlight.delete(dedupeKey))
          }

          promise = p
        }

        try {
          const result = await promise
          s.data = result
          s.status = 'loaded'
          s.error = null
          notifyHook(key)
        } catch (err: any) {
          if (attempt < retry) {
            await new Promise((r) =>
              setTimeout(r, retryDelay * (attempt + 1))
            )
            return execute(attempt + 1)
          }

          s.status = 'error'
          s.error = err?.message ?? 'Load failed'
          notifyHook(key)
        }
      }

      const load = () => {
        if (s.status === 'loading') return
        s.triggered = true
        execute(0)
      }

      const reload = () => execute(0)

      const reset = () => {
        s.data = null
        s.status = 'idle'
        s.error = null
        s.attempts = 0
        s.triggered = false
        notifyHook(key)
      }

      if (eager && !s.triggered && s.status === 'idle') {
        s.triggered = true
        queueMicrotask(() => execute(0))
      }

      return {
        data: s.data,
        status: s.status,
        error: s.error,
        attempts: s.attempts,
        isIdle: s.status === 'idle',
        isLoading: s.status === 'loading',
        isLoaded: s.status === 'loaded',
        isError: s.status === 'error',
        load,
        reload,
        reset
      }
    }
  )
}

// ───────────────────────────────────────────────
// useLazyModule — dynamic import wrapper
// ───────────────────────────────────────────────

export function useLazyModule<T = any>(
  specifier: string | (() => Promise<{ default: T } | T>),
  options: any = {},
  __sauron_id__ = _sid()
) {
  const loader =
    typeof specifier === 'string'
      ? () =>
          import(/* @vite-ignore */ specifier).then(
            (m) => (m as any).default ?? m
          )
      : () =>
          Promise.resolve(specifier()).then(
            (m) => (m as any).default ?? m
          )

  return useLazy<T>(loader, { eager: true, dedupe: true, ...options }, __sauron_id__)
}

// ───────────────────────────────────────────────
// useLazyFetch — JSON fetch wrapper
// ───────────────────────────────────────────────

export function useLazyFetch<T = any>(
  url: string,
  options: { fetchOptions?: RequestInit } & any = {},
  __sauron_id__ = _sid()
) {
  const { fetchOptions, ...lazyOptions } = options

  const loader = () =>
    fetch(url, fetchOptions).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
      return r.json()
    })

  return useLazy<T>(loader, { eager: true, dedupe: true, ...lazyOptions }, __sauron_id__)
}
