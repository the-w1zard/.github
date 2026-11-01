import React, { useEffect, useRef, useState } from '#sauron'
import { cn } from 'utils'

type BoxModel = 'content-box' | 'border-box' | 'device-pixel-content-box'

type Size = {
  width: number
  height: number
}

type UseResizeObserverOptions<T extends HTMLElement> = {
  ref: React.RefObject<T>
  onResize?: (size: Size) => void
  box?: BoxModel
}

type UseResizeObserverReturn = {
  width: number | undefined
  height: number | undefined
}

function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: UseResizeObserverOptions<T>
): UseResizeObserverReturn {
  const { ref, onResize, box = 'content-box' } = options
  const [size, setSize] = useState<Size | undefined>(undefined)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof window === 'undefined' || !window.ResizeObserver) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) {
        return
      }

      const entry = entries[0]
      let width: number
      let height: number

      if (box === 'border-box') {
        width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
        height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      } else if (box === 'device-pixel-content-box') {
        width = entry.devicePixelContentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
        height = entry.devicePixelContentBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      } else {
        width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
        height = entry.contentBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      }

      const newSize = { width, height }

      if (onResize) {
        onResize(newSize)
      } else {
        setSize(newSize)
      }
    })

    resizeObserver.observe(element, { box })

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref, box, onResize])

  return {
    width: size?.width,
    height: size?.height,
  }
}


 

export { useResizeObserver, }
