import React, { useEffect, useRef, useState } from '#sauron'
import { cn } from 'utils'

type UseScrollLockOptions = {
  autoLock?: boolean
  lockTarget?: HTMLElement | string
  widthReflow?: boolean
}

type UseScrollLockReturn = {
  isLocked: boolean
  lock: () => void
  unlock: () => void
}

function useScrollLock(options: UseScrollLockOptions = {}): UseScrollLockReturn {
  const { autoLock = true, lockTarget, widthReflow = true } = options
  const [isLocked, setIsLocked] = useState(false)
  const originalStylesRef = useRef<{
    overflow: string
    paddingRight: string
  }>()

  const lock = () => {
    if (typeof window === 'undefined') return

    const target =
      lockTarget instanceof HTMLElement
        ? lockTarget
        : typeof lockTarget === 'string'
        ? document.querySelector<HTMLElement>(lockTarget)
        : document.body

    if (!target) return

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    originalStylesRef.current = {
      overflow: target.style.overflow,
      paddingRight: target.style.paddingRight,
    }

    target.style.overflow = 'hidden'

    if (widthReflow && scrollbarWidth > 0) {
      target.style.paddingRight = `${scrollbarWidth}px`
    }

    setIsLocked(true)
  }

  const unlock = () => {
    if (typeof window === 'undefined') return

    const target =
      lockTarget instanceof HTMLElement
        ? lockTarget
        : typeof lockTarget === 'string'
        ? document.querySelector<HTMLElement>(lockTarget)
        : document.body

    if (!target || !originalStylesRef.current) return

    target.style.overflow = originalStylesRef.current.overflow
    target.style.paddingRight = originalStylesRef.current.paddingRight

    originalStylesRef.current = undefined
    setIsLocked(false)
  }

  useEffect(() => {
    if (autoLock) {
      lock()
    }

    return () => {
      unlock()
    }
  }, [autoLock])

  return {
    isLocked,
    lock,
    unlock,
  }
}


 

export { useScrollLock,  }
