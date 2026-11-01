import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useShare(__sauron_id__ = _sid()) {
  return createHook(
    "useShare",
    __sauron_id__,

    () => ({
      value: {
        supported:
          typeof navigator !== "undefined" &&
          typeof navigator.share === "function",
        canShare:
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function"
      }
    }),

    (state) => {
      const s = state.value

      const share = async (data: any) => {
        if (!s.supported) {
          throw new Error("Web Share API not supported")
        }

        try {
          await navigator.share(data)
          return true
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            console.error("Share failed:", err)
          }
          return false
        }
      }

      const canShare = (data: any) => {
        if (!s.canShare) return false
        return navigator.canShare(data)
      }

      return [
        { supported: s.supported },
        share,
        canShare
      ] as const
    }
  )
}
