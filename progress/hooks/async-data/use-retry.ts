import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useRetry(fn: (...args: any[]) => any, options: any = {},
  __sauron_id__ = _sid()) {
  const {
    maxAttempts    = 3,
    baseDelay      = 1000,
    maxDelay       = 30000,
    backoffFactor  = 2,
    jitter         = true,
    retryCondition = () => true
  } = options

  return createHook(
    "useRetry",
    __sauron_id__,

    () => ({
      fn,
      attempts: 0,
      lastError: null,
      isRetrying: false,
      maxAttempts,
      baseDelay,
      maxDelay,
      backoffFactor,
      jitter,
      retryCondition
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const execute = async (...args: any[]) => {
        s.attempts   = 0
        s.lastError  = null
        s.isRetrying = true
        notify(key)

        while (s.attempts < s.maxAttempts) {
          try {
            const result = await s.fn(...args)
            s.isRetrying = false
            s.attempts   = 0
            notify(key)
            return result
          } catch (err) {
            s.lastError = err
            s.attempts++
            notify(key)

            if (s.attempts >= s.maxAttempts || !s.retryCondition(err)) {
              s.isRetrying = false
              notify(key)
              throw err
            }

            let delay = Math.min(
              s.baseDelay * Math.pow(s.backoffFactor, s.attempts - 1),
              s.maxDelay
            )

            if (s.jitter) {
              delay = delay * (0.5 + Math.random())
            }

            await new Promise(res => setTimeout(res, delay))
          }
        }
      }

      const cancel = () => {
        s.attempts   = s.maxAttempts
        s.isRetrying = false
        notify(key)
      }

      return [
        execute,
        {
          attempts:   s.attempts,
          lastError:  s.lastError,
          isRetrying: s.isRetrying
        },
        cancel
      ] as const
    }
  )
}
