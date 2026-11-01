import { createHook } from '#the-cloud'

interface VirtualListState {
  containerRef: HTMLElement | null
  visibleRange: { start: number; end: number }
  deps?: any[]
}

export function useVirtualList(list: any[], options: { itemHeight?: number; overscan?: number } = {},  __sauron_id__ = _sid()) {
  const { itemHeight = 40, overscan = 5 } = options

  return createHook(
    "useVirtualList",
    __sauron_id__,

    () => ({
      value: {
        containerRef: null,
        visibleRange: { start: 0, end: 10 },
        deps: undefined
      } as VirtualListState
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const setContainerRef = (node: HTMLElement | null) => {
        s.containerRef = node
        notify(key)
      }

      const updateRange = () => {
        const target = s.containerRef
        if (!target) return

        const scrollTop = target.scrollTop
        const containerHeight = target.clientHeight

        const start = Math.floor(scrollTop / itemHeight) - overscan
        const end = Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan

        s.visibleRange = {
          start: Math.max(0, start),
          end: Math.min(list.length, end)
        }

        notify(key)
      }

      const deps = [s.containerRef, list.length]
      const changed =
        !s.deps ||
        s.deps.length !== deps.length ||
        s.deps.some((d, i) => d !== deps[i])

      if (changed) {
        s.deps = deps

        const target = s.containerRef

        if (typeof window !== "undefined" && target) {
          target.addEventListener("scroll", updateRange)
          updateRange()

          if (!hookState.cleanup) {
            hookState.cleanup = () => {
              target.removeEventListener("scroll", updateRange)
            }
          }
        }
      }

      const visibleItems = list
        .slice(s.visibleRange.start, s.visibleRange.end)
        .map((item, index) => ({
          item,
          index: s.visibleRange.start + index
        }))

      return [
        setContainerRef,
        visibleItems,
        () => s.visibleRange
      ] as const
    }
  )
}
