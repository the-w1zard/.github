import { createHook } from '#the-cloud'

export function useProperty(name: string, initialValue: any) {
  return createHook(
    "useProperty",
    _sid(),

    () => ({
      value: initialValue,
      attribute: name.toLowerCase()
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const setValue = (newValue: any) => {
        s.value = newValue

        // If the component has a DOM element, reflect the attribute
        const el = hookState.component?.element
        if (el) {
          el.setAttribute(s.attribute, String(newValue))
        }

        notify(key)
      }

      const getValue = () => s.value

      return [s.value, setValue, getValue]
    }
  )
}
