import {  getCurrentComponent } from '#the-cloud'

declare const __DEV__: boolean

export function useDebugValue<T>(value: T, formatter?: (value: T) => any, __sauron_id__ = _sid()): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    createHook(
      'useDebugValue',
      __sauron_id__,
      () => ({ value: formatter ? formatter(value) : value } as HookState),
      (state) => {
        if ((globalThis as any).__HOOK_DEVTOOLS__) {
          (globalThis as any).__HOOK_DEVTOOLS__.debugValues.set(getCurrentComponent().id, state.value)
        }
      }
    )
  }
}
