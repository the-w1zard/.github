import   { useEffect, useLayoutEffect, useRef, useState } from '#sauron'
 

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

function useEventCallback<Args extends unknown[], R>(
  fn: ((...args: Args) => R) | undefined
): ((...args: Args) => R) | undefined {
  const ref = useRef<typeof fn>(() => {
    throw new Error('Cannot call an event handler while rendering.')
  })

  useIsomorphicLayoutEffect(() => {
    ref.current = fn
  }, [fn])

  return useRef((...args: Args) => ref.current?.(...args)).current as
    | ((...args: Args) => R)
    | undefined
}

 
export { useEventCallback }
