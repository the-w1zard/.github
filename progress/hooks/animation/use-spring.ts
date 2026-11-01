import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useSpring(
  targetValue: number,
  options: {
    stiffness?: number
    damping?: number
    precision?: number
  } = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    "useSpring",
    __sauron_id__,

    () => ({
      value: {
        current: targetValue,
        target: targetValue,
        velocity: 0,
        stiffness: options.stiffness ?? 170,
        damping: options.damping ?? 26,
        precision: options.precision ?? 0.01,
        raf: null as number | null
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const setTarget = (newTarget: number) => {
        s.target = newTarget

        if (!s.raf && typeof window !== "undefined") {
          const animate = () => {
            const dt = 16
            const spring = s.current - s.target
            const force = -s.stiffness * spring - s.damping * s.velocity

            s.velocity += (force * dt) / 1000
            s.current += (s.velocity * dt) / 1000

            if (
              Math.abs(spring) > s.precision ||
              Math.abs(s.velocity) > s.precision
            ) {
              s.raf = requestAnimationFrame(animate)
            } else {
              s.current = s.target
              s.velocity = 0
              s.raf = null
            }

            notify(key)
          }

          s.raf = requestAnimationFrame(animate)
        }
      }

      const getValue = () => s.current

      return [s.current, setTarget, getValue] as const
    }
  )
}
