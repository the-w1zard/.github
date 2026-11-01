import { useState } from '#sauron'
import { useRef } from '#sauron'
import { useEffect } from '#sauron'
import { useCallback } from '#sauron'

declare const __DEV__: boolean


type ChangeHandler<T> = (state: T) => void
type SetStateFn<T> = (value: T | ((prevState: T) => T)) => void

interface UseControllableStateParams<T> {
  prop?: T | undefined
  defaultProp: T
  onChange?: ChangeHandler<T>
  caller?: string
}

export function useControllableStateold<T>({
  prop,
  defaultProp,
  onChange = () => {},
  caller,
}: UseControllableStateParams<T>): [T, SetStateFn<T>] {
  const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({ defaultProp, onChange })
  const isControlled = prop !== undefined
  const value = isControlled ? prop : uncontrolledProp

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    useControlledUncontrolledWarning(isControlled, caller)
  }

  const setValue = useCallback((nextValue: T | ((prev: T) => T)) => {
    if (isControlled) {
      const next = typeof nextValue === 'function' ? (nextValue as (prev: T) => T)(prop as T) : nextValue
      if (next !== prop) onChangeRef.current?.(next)
    } else {
      setUncontrolledProp(nextValue)
    }
  }, [isControlled, prop, setUncontrolledProp, onChangeRef])

  return [value, setValue]
}

function useUncontrolledState<T>({
  defaultProp,
  onChange,
}: Omit<UseControllableStateParams<T>, 'prop'>): [T, SetStateFn<T>, { current: ChangeHandler<T> | undefined }] {
  const [value, setValue] = useState<T>(defaultProp)
  const prevValueRef = useRef<T>(value)
  const onChangeRef = useRef<ChangeHandler<T> | undefined>(onChange)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    if (prevValueRef.current !== value) {
      onChangeRef.current?.(value)
      prevValueRef.current = value
    }
  }, [value])

  return [value, setValue, onChangeRef]
}

export function useControlledUncontrolledWarning(isControlled: boolean, caller?: string) {
  const isControlledRef = useRef(isControlled)

  useEffect(() => {
    const wasControlled = isControlledRef.current
    if (wasControlled !== isControlled) {
      const from = wasControlled ? 'controlled' : 'uncontrolled'
      const to = isControlled ? 'controlled' : 'uncontrolled'
      console.warn(`${caller || 'A component'} is changing from ${from} to ${to}. Decide between using a controlled or uncontrolled value for the lifetime of the component.`)
    }
    isControlledRef.current = isControlled
  }, [isControlled, caller])
} 


import { _sid } from '#sauron'

export interface UseControllableStateProps<T> {
  value?: T
  defaultValue?: T | (() => T)
  onChange?: (value: T) => void
}

// 1. Declare a type helper if your custom useState requires option wrapper contexts
interface SauronStateOptions {
  sauronId?: string
}

export function useControllableState<T>(
  { value, onChange, defaultValue }: UseControllableStateProps<T>,
  __sauron_id__ = _sid()
): [T, (v: T | ((prev: T) => T)) => void] {
  
  // Determine if the parent component is actively driving this state
  const isControlled = value !== undefined

  // 2. Safely resolve initial fallback value if it was passed as an optional initializer function
  const initialValue = typeof defaultValue === 'function'
    ? (defaultValue as () => T)()
    : (defaultValue as T)

  // 3. Clean up the native hook signature instantiation. 
  // If your internal engine expects an options object, wrap it here:
  const [internalState, setInternalState] = useState<T>(initialValue, { 
    sauronId: __sauron_id__ 
  } as any)

  // 4. Pin down the current active truth value cleanly
  const activeValue = (isControlled ? value : internalState) as T

  // 5. Build a unified state updater that triggers both pipelines conditionally
  const setActiveValue = (next: T | ((prev: T) => T)) => {
    // Resolve functional state updates manually against the active truth
    const resolvedNext: T = typeof next === 'function' 
      ? (next as (prev: T) => T)(activeValue) 
      : next

    if (Object.is(activeValue, resolvedNext)) return

    // If uncontrolled, update our internal storage tracking to trigger a local render notify
    if (!isControlled) {
      setInternalState(resolvedNext)
    }

    // Always bubble the updated choice back up to the parent observer if present
    if (onChange) {
      onChange(resolvedNext)
    }
  }

  return [activeValue, setActiveValue]
}
