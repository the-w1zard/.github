import { createHook } from '#the-cloud'

export function useWhyDidYouUpdate(name: string, props: Record<string, any>,  __sauron_id__ = _sid()) {
  return createHook(
    "useWhyDidYouUpdate",
      __sauron_id__,

    () => ({
      value: {
        prev: null as Record<string, any> | null
      }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      if (s.prev) {
        const allKeys = Object.keys({ ...s.prev, ...props })
        const changes: Record<string, { from: any; to: any }> = {}

        for (const k of allKeys) {
          if (s.prev[k] !== props[k]) {
            changes[k] = { from: s.prev[k], to: props[k] }
          }
        }

        if (Object.keys(changes).length > 0) {
          console.log(`[why-did-you-update] ${name}:`, changes)
        }
      }

      s.prev = props
      notify(key)

      return []
    }
  )
}
