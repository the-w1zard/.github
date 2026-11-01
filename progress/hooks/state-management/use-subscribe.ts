import { createHook } from '#the-cloud'

type Unsubscribe = () => void
type Subscribe<T> = (callback: (value: T) => void) => Unsubscribe

export function useSubscribe<T>(
  subscribe: Subscribe<T>,
  getSnapshot: () => T,
  __sauron_id__ = _sid()
): T {
  return createHook(
    "useSubscribe",
    __sauron_id__,

    () => ({
      value: {
        subscribe,
        getSnapshot,
        current: getSnapshot()
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const unsubscribe = s.subscribe((value) => {
        s.current = value
        notify(key)
      })

      const snap = s.getSnapshot()
      if (snap !== s.current) {
        s.current = snap
        notify(key)
      }

      if (!state.cleanup) {
        state.cleanup = unsubscribe
      }

      return s.current
    }
  )
}

export function useSubscribeSelector<T, R>(
  subscribe: Subscribe<T>,
  getSnapshot: () => T,
  selector: (value: T) => R,
  __sauron_id__ = _sid()
): R {
  return createHook(
    "useSubscribeSelector",
    __sauron_id__,

    () => ({
      value: {
        subscribe,
        getSnapshot,
        selector,
        current: selector(getSnapshot())
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const unsubscribe = s.subscribe((value) => {
        const next = s.selector(value)
        if (next !== s.current) {
          s.current = next
          notify(key)
        }
      })

      const snap = s.selector(s.getSnapshot())
      if (snap !== s.current) {
        s.current = snap
        notify(key)
      }

      if (!state.cleanup) {
        state.cleanup = unsubscribe
      }

      return s.current
    }
  )
}
