import { useEffect, useRef, useMemo,useReducer ,useEffectEvent ,useControlledUncontrolledWarning , } from '#sauron'

type ChangeHandler<T> = (state: T) => void

declare const __DEV__: boolean


interface UseControllableStateParams<T> {
  prop: T | undefined
  defaultProp: T
  onChange: ChangeHandler<T> | undefined
  caller: string
}

interface AnyAction { type: string }

const SYNC_STATE = Symbol('RADIX:SYNC_STATE')
interface SyncStateAction<T> { type: typeof SYNC_STATE; state: T }

export function useControllableStateReducer<T, S extends {}, A extends AnyAction>(
  reducer: (prevState: S & { state: T }, action: A) => S & { state: T },
  userArgs: UseControllableStateParams<T>,
  initialArg: any,
  init?: (i: any) => Omit<S, 'state'>
): [S & { state: T }, (action: A) => void] {
  const { prop: controlledState, defaultProp, onChange: onChangeProp, caller } = userArgs
  const isControlled = controlledState !== undefined
  const onChange = useEffectEvent(onChangeProp)

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    useControlledUncontrolledWarning(isControlled, caller)
  }

  type InternalState = S & { state: T }
  const initialState: InternalState = init
    ? { ...init({ ...initialArg, state: defaultProp }), state: defaultProp } as InternalState
    : { ...initialArg, state: defaultProp }

  const [getInternalState, dispatch] = useReducer(
    (state: InternalState, action: A | SyncStateAction<T>): InternalState => {
      if ((action as SyncStateAction<T>).type === SYNC_STATE) {
        return { ...state, state: (action as SyncStateAction<T>).state }
      }
      const next = reducer(state, action as A)
      if (isControlled && !Object.is(next.state, state.state)) onChange(next.state)
      return next
    },
    initialState
  )

  const prevValueRef = useRef(getInternalState.state)
  useEffect(() => {
    const internalState = getInternalState
    if (prevValueRef.current !== internalState.state) {
      prevValueRef.current = internalState.state
      if (!isControlled) onChange(internalState.state)
    }
  }, [getInternalState, isControlled])

  useEffect(() => {
    const internalState = getInternalState
    if (isControlled && !Object.is(controlledState, internalState.state)) {
      dispatch({ type: SYNC_STATE, state: controlledState } as SyncStateAction<T>)
    }
  }, [controlledState, getInternalState, isControlled])

  const state = useMemo(() => {
    const internalState = getInternalState
    if (controlledState !== undefined) return { ...internalState, state: controlledState }
    return internalState
  }, [getInternalState, controlledState])

  return [state, dispatch as (action: A) => void]
}
