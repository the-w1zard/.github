 
import { useEffect, useState } from "#sauron"

export function useBreakpoint(breakpoint: number) {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState<
    boolean | undefined
  >(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setIsBelowBreakpoint(window.innerWidth < breakpoint)
    }
    mql.addEventListener("change", onChange)
    setIsBelowBreakpoint(window.innerWidth < breakpoint)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isBelowBreakpoint
}

 