import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useNetwork(__sauron_id__ = _sid()) {
  return createHook(
    "useNetwork",
    __sauron_id__,
    () => ({
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      type: null,
      downlink: null,
      rtt: null,
      saveData: false
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      // Attach listeners once
      if (!hookState.cleanup && typeof window !== "undefined") {
        const cleanups: Array<() => void> = []

        //
        // Network Information API
        //
        const connection = (navigator as any).connection
        if (connection) {
          const updateNetworkInfo = () => {
            s.type     = connection.effectiveType
            s.downlink = connection.downlink
            s.rtt      = connection.rtt
            s.saveData = connection.saveData
            notify(key)
          }

          connection.addEventListener("change", updateNetworkInfo)
          cleanups.push(() => connection.removeEventListener("change", updateNetworkInfo))

          // initial sync
          updateNetworkInfo()
        }

        //
        // Online/offline events
        //
        const updateOnline = () => {
          s.online = navigator.onLine
          notify(key)
        }

        window.addEventListener("online", updateOnline)
        window.addEventListener("offline", updateOnline)

        cleanups.push(() => window.removeEventListener("online", updateOnline))
        cleanups.push(() => window.removeEventListener("offline", updateOnline))

        // register cleanup
        hookState.cleanup = () => {
          for (const fn of cleanups) fn()
        }
      }

      const getStatus = () => ({
        online: s.online,
        type: s.type,
        downlink: s.downlink,
        rtt: s.rtt,
        saveData: s.saveData
      })

      return [s, getStatus]
    }
  )
}
