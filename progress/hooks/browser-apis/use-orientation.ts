import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export type OrientationLockType =
  | "any"
  | "landscape"
  | "landscape-primary"
  | "landscape-secondary"
  | "natural"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"

export function useOrientation(__sauron_id__ = _sid()) {
  return createHook(
    "useOrientation",
   __sauron_id__,

    () => {
      const supported =
        typeof screen !== "undefined" &&
        screen.orientation &&
        typeof screen.orientation.addEventListener === "function"

      return {
        angle: supported ? screen.orientation.angle : 0,
        type: supported ? screen.orientation.type : "landscape-primary",
        supported
      }
    },

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Attach listeners once
      //
      if (!hookState.cleanup && s.supported) {
        const onOrientationChange = () => {
          s.angle = screen.orientation.angle
          s.type = screen.orientation.type
          notify(key)
        }

        screen.orientation.addEventListener("change", onOrientationChange)

        hookState.cleanup = () => {
          screen.orientation.removeEventListener("change", onOrientationChange)
        }
      }

      //
      // Orientation lock
      //
      const lock = async (orientation: OrientationLockType) => {
        if (!s.supported) return false
        try {
await (screen.orientation as any).lock(orientation)
          return true
        } catch (err) {
          console.error("Failed to lock orientation:", err)
          return false
        }
      }

      //
      // Unlock
      //
      const unlock = () => {
        if (!s.supported) return
        screen.orientation.unlock()
      }

      return [
        {
          angle: s.angle,
          type: s.type
        },
        lock,
        unlock
      ]
    }
  )
}
