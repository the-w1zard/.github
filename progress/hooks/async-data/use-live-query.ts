import { _sid, createHook, HookState, notifyHook } from '#the-cloud'
import { sseSubscribe } from './use-sse.js';
    // @ts-ignore

// ───────────────────────────────────────────────
// useLiveQuery — Sauron‑native rewrite
// No React, no useSignal, no useEffect, no hookSystem
// Real‑time + polling + diffing + transform
// Deterministic + platform‑agnostic
// ───────────────────────────────────────────────

export interface LiveQueryOptions<T> {
  pollInterval?: number
  sse?: { url: string; rt: string }
  diff?: 'replace' | 'merge' | 'patch'
  transform?: (data: any) => T
}

export function useLiveQuery<T>(
  fetcher: () => Promise<T>,
  options: LiveQueryOptions<T> = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useLiveQuery',
    __sauron_id__,

    (): HookState => ({
      value: {
        data: undefined as T | undefined,
        error: undefined as Error | undefined,
        isLoading: true,
        lastUpdated: 0,
        fetcher,
        options,
        pollTimer: null as any,
        sseCleanup: null as null | (() => void),
        attached: false
      }
    }),

    (hook, key) => {
      const s = hook.value

      const applyDiff = (incoming: any) => {
        const transformed = s.options.transform
          ? s.options.transform(incoming)
          : incoming

        if (s.options.diff === 'merge' && s.data) {
          s.data = { ...s.data, ...transformed }
        } else if (s.options.diff === 'patch' && s.data) {
          s.data = { ...s.data, ...transformed }
        } else {
          s.data = transformed
        }

        s.lastUpdated = Date.now()
        notifyHook(key)
      }

      const fetchData = async () => {
        try {
          const result = await s.fetcher()
          applyDiff(result)
          s.error = undefined
        } catch (err: any) {
          s.error = err instanceof Error ? err : new Error(String(err))
        } finally {
          s.isLoading = false
          notifyHook(key)
        }
      }

      if (!s.attached) {
        s.attached = true

        fetchData()

        if (s.options.pollInterval && typeof window !== 'undefined') {
          s.pollTimer = setInterval(fetchData, s.options.pollInterval)
        }

        if (s.options.sse && typeof window !== 'undefined') {
          s.sseCleanup = sseSubscribe(
            s.options.sse.url,
            s.options.sse.rt,
            (incoming) => applyDiff(incoming)
          )
        }

        hook.cleanup = () => {
          if (s.pollTimer) clearInterval(s.pollTimer)
          if (s.sseCleanup) s.sseCleanup()
        }
      }

      return {
        data: s.data,
        error: s.error,
        isLoading: s.isLoading,
        lastUpdated: s.lastUpdated
      }
    }
  )
}
