import { createHook } from '#the-cloud'

export function useOnClickOutside(handler: (ev: Event) => void) {
  return createHook(
    "useOnClickOutside",
    _sid(),

    () => ({
      ref: null as HTMLElement | null
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Attach listeners once
      //
      if (!hookState.cleanup && typeof window !== "undefined") {
        const onEvent = (event: Event) => {
          const el = s.ref
          if (el && !el.contains(event.target as Node)) {
            handler(event)
          }
        }

        window.addEventListener("mousedown", onEvent)
        window.addEventListener("touchstart", onEvent)

        hookState.cleanup = () => {
          window.removeEventListener("mousedown", onEvent)
          window.removeEventListener("touchstart", onEvent)
        }
      }

      //
      // Setter for the ref
      //
      const setRef = (node: HTMLElement | null) => {
        s.ref = node
        notify(key)
      }

      return setRef
    }
  )
}
