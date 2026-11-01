import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface WakeLockInternalState {
  wakeLock: any
  active: boolean
  supported: boolean
  deps?: any[]
}

export function useWakeLock(   __sauron_id__ = _sid()) {
  return createHook(
    "useWakeLock",
      __sauron_id__,

    () => ({
      value: {
        wakeLock: null,
        active: false,
        supported: typeof navigator !== "undefined" && "wakeLock" in navigator,
        deps: undefined
      } as WakeLockInternalState
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const acquire = async () => {
        if (!s.supported || s.active) return

        try {
          s.wakeLock = await navigator.wakeLock.request("screen")
          s.active = true
          notify(key)

          s.wakeLock.addEventListener("release", () => {
            s.active = false
            s.wakeLock = null
            notify(key)
          })
        } catch {}
      }

      const release = async () => {
        if (!s.wakeLock) return
        try {
          await s.wakeLock.release()
        } catch {}
      }

      const deps = [s.active]
      const changed =
        !s.deps ||
        s.deps.length !== deps.length ||
        s.deps.some((d, i) => d !== deps[i])

      if (changed) {
        s.deps = deps

        if (typeof document !== "undefined") {
          const onVisibilityChange = () => {
            if (document.visibilityState === "visible" && s.active) {
              acquire()
            }
          }

          document.addEventListener("visibilitychange", onVisibilityChange)

          if (!hookState.cleanup) {
            hookState.cleanup = () => {
              document.removeEventListener("visibilitychange", onVisibilityChange)
              release()
            }
          }
        }
      }

      return [
        s.active,
        acquire,
        release,
        () => s.supported
      ] as const
    }
  )
}
