import { createHook, HookState } from '#the-cloud'
import { _sid } from '../_sid'

export interface ParallelLoaderOptions<T extends Record<string, any>> {
  maxConcurrent?: number
  partial?:       boolean
  retry?:         { attempts?: number; delay?: number }
  onProgress?:    (loaded: number, total: number) => void
}

interface ParallelLoaderHookState<T extends Record<string, any>> extends HookState {
  data:      Partial<T>
  errors:    Record<keyof T, Error | undefined>
  isLoading: boolean
  progress:  number
  loaded:    (keyof T)[]
  failed:    (keyof T)[]
  keys:      (keyof T)[]
  loaders:   { [K in keyof T]: () => Promise<T[K]> }
  options:   ParallelLoaderOptions<T>
}

export function useParallelLoader<T extends Record<string, any>>(
  loaders:       { [K in keyof T]: () => Promise<T[K]> },
  options:       ParallelLoaderOptions<T> = {},
  __sauron_id__ = _sid()
): {
  data:     T | undefined
  error:    Record<keyof T, Error | undefined>
  isLoading: boolean
  progress:  number
  loaded:    (keyof T)[]
  failed:    (keyof T)[]
  reload:    () => Promise<void>
} {
  return createHook(
    'useParallelLoader',
    __sauron_id__,
    (): ParallelLoaderHookState<T> => ({
      value:     undefined,
      data:      {},
      errors:    {} as Record<keyof T, Error | undefined>,
      isLoading: true,
      progress:  0,
      loaded:    [],
      failed:    [],
      keys:      Object.keys(loaders) as (keyof T)[],
      loaders,
      options
    }),
    (s: HookState, key, notify) => {
      const state = s as ParallelLoaderHookState<T>

      const loadAll = async () => {
        state.isLoading = true
        state.progress  = 0
        state.loaded    = []
        state.failed    = []
        notify(key)

        const maxConcurrent = state.options.maxConcurrent ?? 4
        const results: Partial<T>                        = {}
        const errors: Record<keyof T, Error | undefined> = {} as any
        const loaded: (keyof T)[]                        = []
        const failed: (keyof T)[]                        = []

        for (let i = 0; i < state.keys.length; i += maxConcurrent) {
          const batch = state.keys.slice(i, i + maxConcurrent)

          await Promise.all(batch.map(async (k) => {
            try {
              results[k] = await state.loaders[k]()
              loaded.push(k)
            } catch (err) {
              errors[k] = err instanceof Error ? err : new Error(String(err))
              failed.push(k)

              if (state.options.retry) {
                for (let attempt = 1; attempt <= (state.options.retry.attempts ?? 2); attempt++) {
                  try {
                    await new Promise(r => setTimeout(r, state.options.retry!.delay ?? 1000))
                    results[k] = await state.loaders[k]()
                    loaded.push(k)
                    failed.splice(failed.indexOf(k), 1)
                    delete errors[k]
                    break
                  } catch {}
                }
              }
            }
          }))

          state.progress = ((i + batch.length) / state.keys.length) * 100
          state.options.onProgress?.(i + batch.length, state.keys.length)
          notify(key)
        }

        state.data      = results
        state.errors    = errors
        state.loaded    = loaded
        state.failed    = failed
        state.isLoading = false
        notify(key)
      }

      loadAll()

      return {
        data:      state.data as T,
        error:     state.errors,
        isLoading: state.isLoading,
        progress:  state.progress,
        loaded:    state.loaded,
        failed:    state.failed,
        reload:    loadAll
      }
    }
  )
}
