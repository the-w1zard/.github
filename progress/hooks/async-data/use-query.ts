import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useQuery(selector: string,
  __sauron_id__ = _sid()) {
  return createHook(
    "useQuery",
    __sauron_id__,

    () => ({
      selector,
      root: null as HTMLElement | null,
      element: null as Element | null
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Setter for the root element
      //
      const setRef = (node: HTMLElement | null) => {
        s.root = node

        if (node) {
          s.element = node.querySelector(s.selector)
        } else {
          s.element = null
        }

        notify(key)
      }

      const getElement = () => s.element

      return [s.element, setRef, getElement]
    }
  )
}
