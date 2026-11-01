import { createHook } from '#the-cloud'

export function useScratch(__sauron_id__ = _sid()) {
  return createHook(
    "useScratch",
    __sauron_id__,

    () => ({
      value: {
        isScratching: false,
        startPosition: { x: 0, y: 0 },
        position: { x: 0, y: 0 },
        dx: 0,
        dy: 0,
        distance: 0,
        angle: 0,
        ref: null as HTMLElement | null,
        onStart: null as any,
        onMove: null as any,
        onEnd: null as any
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const setRef = (el: HTMLElement | null) => {
        if (s.ref === el) return
        s.ref = el
        notify(key)
      }

      if (!state.cleanup && typeof window !== "undefined") {
        const onStart = (e: any) => {
          e.preventDefault()
          const clientX = e.clientX ?? e.touches?.[0]?.clientX
          const clientY = e.clientY ?? e.touches?.[0]?.clientY

          s.isScratching = true
          s.startPosition = { x: clientX, y: clientY }
          s.position = { x: clientX, y: clientY }
          s.dx = 0
          s.dy = 0
          s.distance = 0
          s.angle = 0

          notify(key)
        }

        const onMove = (e: any) => {
          if (!s.isScratching) return

          const clientX = e.clientX ?? e.touches?.[0]?.clientX
          const clientY = e.clientY ?? e.touches?.[0]?.clientY

          const dx = clientX - s.startPosition.x
          const dy = clientY - s.startPosition.y

          s.position = { x: clientX, y: clientY }
          s.dx = dx
          s.dy = dy
          s.distance = Math.sqrt(dx * dx + dy * dy)
          s.angle = (Math.atan2(dy, dx) * 180) / Math.PI

          notify(key)
        }

        const onEnd = () => {
          if (!s.isScratching) return
          s.isScratching = false
          notify(key)
        }

        s.onStart = onStart
        s.onMove = onMove
        s.onEnd = onEnd

        state.cleanup = () => {
          if (s.ref) {
            s.ref.removeEventListener("mousedown", onStart)
            s.ref.removeEventListener("touchstart", onStart)
          }
          window.removeEventListener("mousemove", onMove)
          window.removeEventListener("touchmove", onMove)
          window.removeEventListener("mouseup", onEnd)
          window.removeEventListener("touchend", onEnd)
        }
      }

      if (s.ref) {
        s.ref.addEventListener("mousedown", s.onStart)
        s.ref.addEventListener("touchstart", s.onStart)
      }

      if (typeof window !== "undefined") {
        window.addEventListener("mousemove", s.onMove)
        window.addEventListener("touchmove", s.onMove)
        window.addEventListener("mouseup", s.onEnd)
        window.addEventListener("touchend", s.onEnd)
      }

      const getState = () => ({
        isScratching: s.isScratching,
        startPosition: s.startPosition,
        position: s.position,
        dx: s.dx,
        dy: s.dy,
        distance: s.distance,
        angle: s.angle
      })

      return [setRef, getState(), getState] as const
    }
  )
}
