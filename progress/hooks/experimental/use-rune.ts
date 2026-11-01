import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useRune(initialValue: any) {
  return createHook(
    "useRune",
    _sid(),

    () => ({
      value: initialValue,
      effects: new Set<string>()
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const get = () => {
        const comp = hookState.component
        if (comp) s.effects.add(comp.id)
        return s.value
      }

      const set = (newValue: any) => {
        s.value = newValue
        for (const id of s.effects) notify(`${id}:useRune:${key}`)
      }

      return [get, set] as const
    }
  )
}
