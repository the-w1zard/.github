import { createHook } from '#the-cloud'

export function usePointer() {
  return createHook(
    "usePointer",
    _sid(),

    () => ({
      x: 0,
      y: 0,
      pressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: null as string | null,
      isActive: false,
      history: [] as Array<{ x: number; y: number; timestamp: number }>
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Attach listeners once
      //
      if (!hookState.cleanup && typeof window !== "undefined") {
        const onPointerMove = (e: PointerEvent) => {
          s.x = e.clientX
          s.y = e.clientY
          s.pressure = e.pressure
          s.tiltX = e.tiltX
          s.tiltY = e.tiltY
          s.twist = e.twist
          s.pointerType = e.pointerType
          s.isActive = true

          s.history.push({ x: e.clientX, y: e.clientY, timestamp: Date.now() })
          if (s.history.length > 100) s.history.shift()

          notify(key)
        }

        const onPointerLeave = () => {
          s.isActive = false
          notify(key)
        }

        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerleave", onPointerLeave)

        hookState.cleanup = () => {
          window.removeEventListener("pointermove", onPointerMove)
          window.removeEventListener("pointerleave", onPointerLeave)
        }
      }

      //
      // Helpers
      //
      const getPosition = () => ({ x: s.x, y: s.y })

      const getVelocity = () => {
        if (s.history.length < 2) return 0

        const last = s.history[s.history.length - 1]
        const prev = s.history[s.history.length - 2]

        const dt = last.timestamp - prev.timestamp
        if (dt <= 0) return 0

        const dx = last.x - prev.x
        const dy = last.y - prev.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        return dist / dt
      }

      return [
        {
          x: s.x,
          y: s.y,
          pressure: s.pressure,
          tiltX: s.tiltX,
          tiltY: s.tiltY,
          twist: s.twist,
          pointerType: s.pointerType,
          isActive: s.isActive
        },
        getPosition,
        getVelocity
      ]
    }
  )
}
