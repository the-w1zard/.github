import { createHook, getCurrentComponent, notifyHook,  mountComponent, unmountComponent, setCurrentComponent } from '#the-cloud'

export function useOptimistic<T, A>(
  state:   T,
  reducer: (current: T, action: A) => T,
  __sauron_id__ = _sid()
): [T, (action: A) => void] {
  return createHook(
    'useOptimistic',
    __sauron_id__,
    (): HookState => ({ value: state }),
    (hookState, key, notify) => {
      if (!Object.is(hookState.value, state)) {
        hookState.value = state
      }
      const addOptimistic = (action: A) => {
        hookState.value = reducer(hookState.value as T, action)
        notify(key)
      }
      return [hookState.value as T, addOptimistic]
    }
  )
}
