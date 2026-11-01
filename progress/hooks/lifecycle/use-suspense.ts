import { createHook } from '#the-cloud'

interface SuspenseState {
  suspended: boolean
  promise: Promise<any> | null
  resolve: ((v: any) => void) | null
  reject: ((e: any) => void) | null
}

export function useSuspense(__sauron_id__ = _sid()) {
  return createHook(
    "useSuspense",
    __sauron_id__,

    () => ({
      value: {
        suspended: false,
        promise: null,
        resolve: null,
        reject: null
      } as SuspenseState
    }),

    (state, key, notify) => {
      const s = state.value

      const reset = () => {
        s.suspended = false
        s.promise = null
        s.resolve = null
        s.reject = null
        notify(key)
      }

      const suspend = () => {
        if (!s.suspended) {
          s.suspended = true
          s.promise = new Promise((resolve, reject) => {
            s.resolve = resolve
            s.reject = reject
          })
          notify(key)
          throw s.promise
        }
      }

      const resume = (value: any) => {
        if (s.suspended && s.resolve) {
          s.resolve(value)
          reset()
        }
      }

      const fail = (error: any) => {
        if (s.suspended && s.reject) {
          s.reject(error)
          reset()
        }
      }

      return [
        suspend,
        resume,
        fail,
        () => s.suspended
      ] as const
    }
  )
}
