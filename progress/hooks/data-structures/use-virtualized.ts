import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface VirtualizedState {
  containerRef: HTMLElement | null
  scrollTop: number
  containerHeight: number
  startIndex: number
  endIndex: number
  paddingTop: number
  paddingBottom: number
  boundTarget: HTMLElement | null
}

export function useVirtualized(options: {
    itemCount: number
    itemHeight: number
    overscan?: number
    scrollTarget?: HTMLElement | null
  } = {
    itemCount: 0,
    itemHeight: 0,
    overscan: 3,
    scrollTarget: null
  },
  __sauron_id__ = _sid()
) {
  const {
    itemCount,
    itemHeight,
    overscan = 3,
    scrollTarget = null
  } = options

  return createHook(
    "useVirtualized",
    __sauron_id__,

    () => ({
      value: {
        containerRef: null,
        scrollTop: 0,
        containerHeight: 0,
        startIndex: 0,
        endIndex: 0,
        paddingTop: 0,
        paddingBottom: 0,
        boundTarget: null
      } as VirtualizedState
    }),

    (state, key, notify) => {
      const s = state.value

      const update = () => {
        const target = scrollTarget || s.containerRef
        if (!target) return

        const scrollTop = target.scrollTop
        const containerHeight = target.clientHeight

        const startIndex = Math.max(
          0,
          Math.floor(scrollTop / itemHeight) - overscan
        )

        const endIndex = Math.min(
          itemCount - 1,
          Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        )

        s.scrollTop = scrollTop
        s.containerHeight = containerHeight
        s.startIndex = startIndex
        s.endIndex = endIndex
        s.paddingTop = startIndex * itemHeight
        s.paddingBottom = (itemCount - endIndex - 1) * itemHeight

        notify(key)
      }

      const bindListeners = () => {
        const target = scrollTarget || s.containerRef
        if (!target || s.boundTarget === target) return

        // cleanup old
        if (s.boundTarget) {
          s.boundTarget.removeEventListener("scroll", update)
          window.removeEventListener("resize", update)
        }

        // bind new
        target.addEventListener("scroll", update)
        window.addEventListener("resize", update)
        s.boundTarget = target

        update()
      }

      const setContainerRef = (node: HTMLElement | null) => {
        s.containerRef = node
        bindListeners()
        notify(key)
      }

      bindListeners()

      if (!state.cleanup) {
        state.cleanup = () => {
          if (s.boundTarget) {
            s.boundTarget.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
          }
        }
      }

      const scrollToIndex = (
        index: number,
        behavior: ScrollBehavior = "auto"
      ) => {
        const target = scrollTarget || s.containerRef
        if (!target) return

        target.scrollTo({
          top: index * itemHeight,
          behavior
        })
      }

      return [
        setContainerRef,
        {
          startIndex: s.startIndex,
          endIndex: s.endIndex,
          paddingTop: s.paddingTop,
          paddingBottom: s.paddingBottom
        },
        scrollToIndex
      ] as const
    }
  )
}
