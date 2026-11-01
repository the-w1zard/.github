import { createHook } from '#the-cloud'

export function usePinchZoom() {
  return createHook(
    "usePinchZoom",
    _sid(),

    () => ({
      zooming: false,
      distance: 0,
      initialDistance: 0,
      scale: 1,
      ref: null as HTMLElement | null
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Attach listeners once when ref becomes available
      //
      if (!hookState.cleanup && typeof window !== "undefined") {
        let cleanupFns: Array<() => void> = []

        const attach = (el: HTMLElement) => {
          const getDistance = (touches: TouchList) => {
            const dx = touches[0].clientX - touches[1].clientX
            const dy = touches[0].clientY - touches[1].clientY
            return Math.sqrt(dx * dx + dy * dy)
          }

          const onStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
              e.preventDefault()
              const d = getDistance(e.touches)
              s.zooming = true
              s.distance = d
              s.initialDistance = d
              s.scale = 1
              notify(key)
            }
          }

          const onMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && s.zooming) {
              e.preventDefault()
              const d = getDistance(e.touches)
              s.distance = d
              s.scale = d / s.initialDistance
              notify(key)
            }
          }

          const onEnd = () => {
            if (s.zooming) {
              s.zooming = false
              notify(key)
            }
          }

          el.addEventListener("touchstart", onStart, { passive: false })
          el.addEventListener("touchmove", onMove, { passive: false })
          el.addEventListener("touchend", onEnd)

          cleanupFns.push(() => el.removeEventListener("touchstart", onStart))
          cleanupFns.push(() => el.removeEventListener("touchmove", onMove))
          cleanupFns.push(() => el.removeEventListener("touchend", onEnd))
        }

        hookState.cleanup = () => {
          for (const fn of cleanupFns) fn()
        }

        // If ref already exists at mount time, attach immediately
        if (s.ref) attach(s.ref)

        // Wrap setter to attach listeners when ref is set later
        const originalSetRef = (node: HTMLElement | null) => {
          s.ref = node
          if (node) attach(node)
          notify(key)
        }

        // Return setter + state
        return [
          originalSetRef,
          {
            zooming: s.zooming,
            distance: s.distance,
            initialDistance: s.initialDistance,
            scale: s.scale
          }
        ]
      }

      //
      // Setter for ref (before listeners are attached)
      //
      const setRef = (node: HTMLElement | null) => {
        s.ref = node
        notify(key)
      }

      return [
        setRef,
        {
          zooming: s.zooming,
          distance: s.distance,
          initialDistance: s.initialDistance,
          scale: s.scale
        }
      ]
    }
  )
}
