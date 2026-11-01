import   { useEffect, useLayoutEffect, useState } from '#sauron'
import { cn } from 'utils'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect


 
export { useIsomorphicLayoutEffect }
