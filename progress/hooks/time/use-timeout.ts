import { createHook } from '#the-cloud'

interface TimeoutState {
  callback: (...args: any[]) => void
  delay: number
  timeout: any
}

export function useTimeout(callback: (...args: any[]) => void, delay: number,  __sauron_id__ = _sid()) {
  return createHook(
    "useTimeout",
      __sauron_id__,
    () => ({
      value: {
        callback,
        delay,
        timeout: null
      } as TimeoutState
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const stop = () => {
        if (s.timeout) {
          clearTimeout(s.timeout)
          s.timeout = null
          notify(key)
        }
      }

      const start = (...args: any[]) => {
        if (s.timeout) clearTimeout(s.timeout)

        s.timeout = setTimeout(() => {
          s.callback(...args)
          s.timeout = null
          notify(key)
        }, s.delay)

        notify(key)
      }

      const restart = (...args: any[]) => {
        stop()
        start(...args)
      }

      const isActive = () => !!s.timeout

      if (!hookState.cleanup) {
        hookState.cleanup = stop
      }

      return [
        start,
        stop,
        restart,
        isActive
      ] as const
    }
  )
}
