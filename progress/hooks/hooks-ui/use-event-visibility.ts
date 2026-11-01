import { useLayoutEffect, useMemo, useRef, useState } from "#sauron"

// @dev app/components/midgardr/hooks/use-event-visibility.tsx:use-event-visibility

interface EventVisibilityOptions {
  eventHeight: number
  eventGap: number
}

interface EventVisibilityResult {
  contentRef: React.RefObject<HTMLDivElement>
  contentHeight: number | null
  getVisibleEventCount: (totalEvents: number) => number
}

export function useEventVisibility({
  eventHeight,
  eventGap,
}: EventVisibilityOptions): EventVisibilityResult {
  const contentRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!contentRef.current) return

    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.clientHeight)
      }
    }

    updateHeight()

    if (!observerRef.current) {
      observerRef.current = new ResizeObserver(() => {
        updateHeight()
      })
    }

    observerRef.current.observe(contentRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const getVisibleEventCount = useMemo(() => {
    return (totalEvents: number): number => {
      if (!contentHeight) return totalEvents

      const maxEvents = Math.floor(contentHeight / (eventHeight + eventGap))

      if (totalEvents <= maxEvents) {
        return totalEvents
      }
      return maxEvents > 0 ? maxEvents - 1 : 0
    }
  }, [contentHeight, eventHeight, eventGap])

  return {
    contentHeight,
    contentRef,
    getVisibleEventCount,
  } as EventVisibilityResult
}



 