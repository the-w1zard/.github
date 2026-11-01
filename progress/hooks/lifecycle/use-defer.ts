import {   createHook,   notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useDefer — Sauron‑native rewrite
// No useEffect, no React, no async updater side‑effects
// Loader runs once in initializer, streams updates via signals
// ───────────────────────────────────────────────

export interface DeferredResource<T> {
  critical: T
  deferred: Record<string, Promise<any>>
}

export function useDefer<T extends Record<string, any>>(
  loader: () => Promise<DeferredResource<T>>,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useDefer',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const state = {
        data: {} as Partial<T>,
        isPending: {} as Record<string, boolean>,
        error: {} as Record<string, Error | undefined>,
        progress: 0,
        allLoaded: false,
        started: false
      }

      const run = async () => {
        if (state.started) return
        state.started = true

        const result = await loader()

        state.data = { critical: result.critical } as any

        const keys = Object.keys(result.deferred)
        const total = keys.length
        let loaded = 0

        state.isPending = {}
        keys.forEach(k => (state.isPending[k] = true))

        notifyHook(__sauron_id__)

        await Promise.all(
          keys.map(async key => {
            try {
              const value = await result.deferred[key]
              state.data = { ...state.data, [key]: value }
              state.isPending[key] = false
            } catch (err: any) {
              state.error[key] = err instanceof Error ? err : new Error(String(err))
              state.isPending[key] = false
            }

            loaded++
            state.progress = (loaded / total) * 100
            notifyHook(__sauron_id__)
          })
        )

        state.allLoaded = true
        notifyHook(__sauron_id__)
      }

      run()

      return { value: state }
    },

    // ───────────────────────────────────────── updater
    (hook) => {
      const v = hook.value
      return {
        data: v.data,
        isPending: v.isPending,
        error: v.error,
        progress: v.progress,
        allLoaded: v.allLoaded
      }
    }
  )
}
