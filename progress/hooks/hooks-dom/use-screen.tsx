import React, { useEffect, useState } from '#sauron'
import { cn } from 'utils'

type ScreenOrientation = {
  type: string
  angle: number
}

type Screen = {
  width: number
  height: number
  availWidth: number
  availHeight: number
  colorDepth: number
  pixelDepth: number
  orientation: ScreenOrientation | null
}

type UseScreenOptions<T extends boolean = true> = {
  initializeWithValue?: T
  debounceDelay?: number
}

export function useScreen<T extends boolean = true>(
  options: UseScreenOptions<T> = {}
): T extends false ? Screen | undefined : Screen {
  const { initializeWithValue = true as T, debounceDelay } = options

  const getScreenInfo = (): Screen | undefined => {
    if (typeof window === 'undefined' || !window.screen) {
      return undefined
    }

    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      orientation: window.screen.orientation
        ? {
            type: window.screen.orientation.type,
            angle: window.screen.orientation.angle,
          }
        : null,
    }
  }

  const [screen, setScreen] = useState<Screen | undefined>(() => {
    if (initializeWithValue) {
      return getScreenInfo()
    }
    return undefined
  })

  useEffect(() => {
    if (!initializeWithValue) {
      setScreen(getScreenInfo())
    }
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined

    const handleChange = () => {
      if (debounceDelay) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
          setScreen(getScreenInfo())
        }, debounceDelay)
      } else {
        setScreen(getScreenInfo())
      }
    }

    window.addEventListener('resize', handleChange)
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleChange)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('resize', handleChange)
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleChange)
      }
    }
  }, [debounceDelay])

  return screen as T extends false ? Screen | undefined : Screen
}


