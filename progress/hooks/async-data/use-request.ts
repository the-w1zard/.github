import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useRequest(service: (...args: any[]) => Promise<any>, options: any = {},
  __sauron_id__ = _sid()) {
  return createHook(
    "useRequest",
    __sauron_id__,

    () => ({
      data: null,
      error: null,
      loading: false,
      params: [] as any[],
      cancelToken: null as null | { cancelled: boolean },
      pollingTimer: null as any,
      retryCount: 0,
      initialized: false
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const run = async (...params: any[]) => {
        s.loading = true
        s.params = params
        notify(key)

        if (options.cancelPrevious && s.cancelToken) {
          s.cancelToken.cancelled = true
        }

        const token = { cancelled: false }
        s.cancelToken = token

        try {
          const result = await service(...params)
          if (!token.cancelled) {
            s.data = result
            s.error = null
            if (options.onSuccess) options.onSuccess(result, params)
            notify(key)
          }
        } catch (err) {
          if (!token.cancelled) {
            s.error = err
            if (options.onError) options.onError(err, params)

            if (options.retryCount && s.retryCount < options.retryCount) {
              s.retryCount++
              setTimeout(() => run(...params), options.retryInterval || 1000)
            }

            notify(key)
          }
        } finally {
          if (!token.cancelled) {
            s.loading = false
            s.retryCount = 0
            notify(key)
          }
        }
      }

      const cancel = () => {
        if (s.cancelToken) s.cancelToken.cancelled = true
        s.loading = false
        notify(key)
      }

      const refresh = () => run(...s.params)

      if (!s.initialized) {
        s.initialized = true

        if (options.pollingInterval && typeof window !== "undefined") {
          s.pollingTimer = setInterval(() => {
            if (!s.loading) refresh()
          }, options.pollingInterval)

          hookState.cleanup = () => {
            clearInterval(s.pollingTimer)
          }
        }
      }

      const getData = () => s.data
      const getError = () => s.error
      const isLoading = () => s.loading
      const getParams = () => s.params

      return [
        {
          data: s.data,
          error: s.error,
          loading: s.loading,
          params: s.params
        },
        run,
        cancel,
        refresh,
        getData,
        getError,
        isLoading,
        getParams
      ] as const
    }
  )
}
