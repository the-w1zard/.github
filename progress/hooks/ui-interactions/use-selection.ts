import { createHook } from '#the-cloud'

export function useSelection(options: any = {}, __sauron_id__ = _sid()) {
  const { onSelect, onClear } = options

  return createHook(
    "useSelection",
    __sauron_id__,

    () => ({
      value: {
        text: "",
        range: null as Range | null,
        rects: [] as DOMRect[],
        active: false,
        initialized: false
      }
    }),

    (state, key, notify) => {
      const s = state.value

      if (!s.initialized) {
        s.initialized = true

        const onSelectionChange = () => {
          if (typeof window === "undefined") return

          const sel = window.getSelection()

          if (sel && sel.toString()) {
            s.text = sel.toString()
            s.range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null
            s.active = true

            s.rects = []
            if (s.range) {
              const rects = s.range.getClientRects()
              for (let i = 0; i < rects.length; i++) {
                s.rects.push(rects[i])
              }
            }

            onSelect?.({
              text: s.text,
              range: s.range,
              rects: s.rects
            })
          } else {
            s.text = ""
            s.range = null
            s.rects = []
            s.active = false
            onClear?.()
          }

          notify(key)
        }

        document.addEventListener("selectionchange", onSelectionChange)

        state.cleanup = () => {
          document.removeEventListener("selectionchange", onSelectionChange)
        }
      }

      const clear = () => {
        if (typeof window === "undefined") return
        window.getSelection()?.removeAllRanges()
      }

      return [
        {
          text: s.text,
          active: s.active,
          rects: s.rects
        },
        clear
      ] as const
    }
  )
}
