import { createHook } from '#the-cloud'

export function useRAF(callback: (ts: number) => void, autoStart = true, __sauron_id__ = _sid()) {
  return createHook(
    "useRAF",
    __sauron_id__,
    () => ({
      callback,
      running: autoStart,
      rafId: null as number | null,
      timestamp: 0,
      initialized: false
    }),
    (hookState, key, notify) => {
      const s = hookState.value

      const tick = (timestamp: number) => {
        if (!s.running) return
        s.timestamp = timestamp
        s.callback(timestamp)
        s.rafId = requestAnimationFrame(tick)
        notify(key)
      }

      const start = () => {
        if (typeof window === "undefined") return
        if (s.running) return
        s.running = true
        s.rafId = requestAnimationFrame(tick)
        notify(key)
      }

      const stop = () => {
        if (typeof window === "undefined") return
        if (s.rafId != null) {
          cancelAnimationFrame(s.rafId)
          s.rafId = null
        }
        if (!s.running) return
        s.running = false
        notify(key)
      }

      if (!s.initialized) {
        s.initialized = true
        if (autoStart && typeof window !== "undefined") {
          s.running = true
          s.rafId = requestAnimationFrame(tick)
        }
      }

      const isRunning = () => s.running

      return [s.timestamp, start, stop, isRunning] as const
    }
  )
}
