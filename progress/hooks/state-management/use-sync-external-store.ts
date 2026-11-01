import { createHook, getCurrentComponent, notifyHook,  mountComponent, unmountComponent, setCurrentComponent } from '#the-cloud'


export function useSyncExternalStore<T>(
  subscribe:   (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  __sauron_id__ = _sid()
): T {
  return createHook(
    'useSyncExternalStore',
    __sauron_id__,
    (): HookState => {
      const component = getCurrentComponent()
      const key       = `${component.id}:useSyncExternalStore:${__sauron_id__}`
      const unsub     = subscribe(() => notifyHook(key))
      return { value: getSnapshot(), cleanup: unsub }
    },
    (state) => {
      state.value = getSnapshot()
      return state.value as T
    }
  )
}
