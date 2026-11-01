import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useMutation(mutationFn: (...args: any[]) => Promise<any>, options: any = {},
  __sauron_id__ = _sid()) {
  return createHook(
    "useMutation",
    __sauron_id__,
    () => ({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      mutationFn,
      options
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const mutate = async (...args: any[]) => {
        s.isLoading = true
        s.isError   = false
        s.isSuccess = false
        notify(key)

        try {
          const result = await s.mutationFn(...args)

          s.data      = result
          s.isSuccess = true
          s.isError   = false
          s.error     = null

          s.options.onSuccess?.(result, args)
          notify(key)
          return result

        } catch (err) {
          s.error    = err
          s.isError  = true
          s.isSuccess = false

          s.options.onError?.(err, args)
          notify(key)
          throw err

        } finally {
          s.isLoading = false
          notify(key)
        }
      }

      const reset = () => {
        s.data      = null
        s.error     = null
        s.isLoading = false
        s.isSuccess = false
        s.isError   = false
        notify(key)
      }

      return [
        mutate,
        {
          data:      s.data,
          error:     s.error,
          isLoading: s.isLoading,
          isSuccess: s.isSuccess,
          isError:   s.isError
        },
        reset
      ]
    }
  )
}
