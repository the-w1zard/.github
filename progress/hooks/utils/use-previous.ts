import { createHook, getCurrentComponent, notifyHook,  mountComponent, unmountComponent, setCurrentComponent } from '#the-cloud'


export function usePrevious<T>(value: T, __sauron_id__ = _sid()): T | undefined {
  return createHook(
    'usePrevious',
    __sauron_id__,
    (): HookState => ({ value: { current: undefined, prev: undefined } }),
    (state) => {
      const s = state.value as { current: T | undefined; prev: T | undefined }
      if (!Object.is(s.current, value)) {
        s.prev    = s.current
        s.current = value
      }
      return s.prev
    }
  )
}
