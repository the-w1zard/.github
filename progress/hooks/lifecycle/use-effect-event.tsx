
type AnyFunction = (...args: any[]) => any

function createEffectEventHook<T extends AnyFunction>(
  name: string,
  callback?: T,
  __sauron_id__ = _sid()
): T {
  return createHook(
    name,
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const value = {
        current: callback,
        stable: null as unknown as T
      }

      // stable function must be assigned AFTER value exists
      value.stable = ((...args: any[]) => {
        return (value.current as AnyFunction)?.(...args)
      }) as T

      return { value }
    },

    // ───────────────────────────────────────── updater
    (hook) => {
      hook.value.current = callback
      return hook.value.stable
    }
  )
}

export function useEffectEvent<T extends AnyFunction>(
  callback?: T,
  __sauron_id__ = _sid()
): T {
  return createEffectEventHook('useEffectEvent', callback, __sauron_id__)
}

export function useEffectEventHook<T extends AnyFunction>(
  callback?: T,
  __sauron_id__ = _sid()
): T {
  return createEffectEventHook('useEffectEventHook', callback, __sauron_id__)
}

export function useEffectEventWithDeps<
  T extends AnyFunction,
  D extends any[]
>(callback: T | undefined, deps: D, __sauron_id__ = _sid()): T {
  return createEffectEventHook('useEffectEventWithDeps', callback, __sauron_id__)
}

export default useEffectEvent
