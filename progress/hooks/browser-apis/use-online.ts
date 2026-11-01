import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useOnline(__sauron_id__ = _sid()) {
  return createHook(
    "useOnline",
    __sauron_id__,

    () => ({
      online:
        typeof navigator !== "undefined"
          ? navigator.onLine
          : true
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Attach listeners once
      //
      if (!hookState.cleanup && typeof window !== "undefined") {
        const updateOnline = () => {
          s.online = navigator.onLine
          notify(key)
        }

        window.addEventListener("online", updateOnline)
        window.addEventListener("offline", updateOnline)

        hookState.cleanup = () => {
          window.removeEventListener("online", updateOnline)
          window.removeEventListener("offline", updateOnline)
        }
      }

      const isOnline = () => s.online

      return [s.online, isOnline]
    }
  )
}
