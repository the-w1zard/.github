import { createHook } from '#the-cloud'

export function useScrollLock(options: any = {}, __sauron_id__ = _sid()) {
  const { reserveScrollBarGap = true } = options

  return createHook(
    "useScrollLock",
    __sauron_id__,

    () => ({
      value: {
        locked: false,
        originalStyles: {
          overflow: "",
          paddingRight: ""
        },
        initialized: false
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const lock = () => {
        if (typeof document === "undefined") return
        if (s.locked) return

        const body = document.body

        s.originalStyles = {
          overflow: body.style.overflow,
          paddingRight: body.style.paddingRight
        }

        body.style.overflow = "hidden"

        if (reserveScrollBarGap) {
          const scrollBarWidth =
            window.innerWidth - document.documentElement.clientWidth
          if (scrollBarWidth > 0) {
            body.style.paddingRight = `${scrollBarWidth}px`
          }
        }

        s.locked = true
        notify(key)
      }

      const unlock = () => {
        if (typeof document === "undefined") return
        if (!s.locked) return

        const body = document.body

        body.style.overflow = s.originalStyles.overflow || ""
        body.style.paddingRight = s.originalStyles.paddingRight || ""

        s.locked = false
        notify(key)
      }

      if (!s.initialized) {
        s.initialized = true
        state.cleanup = unlock
      }

      return [s.locked, lock, unlock] as const
    }
  )
}
