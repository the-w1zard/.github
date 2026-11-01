import { createHook } from '#the-cloud'

export function useReactive(initialObj: any) {
  return createHook(
    "useReactive",
    _sid(),

    () => {
      const clone = (o: any) => JSON.parse(JSON.stringify(o))

      const createProxy = (obj: any, path: (string | symbol)[] = []): any => {
        return new Proxy(obj, {
          get(target, prop) {
            const value = target[prop]
            return value && typeof value === "object"
              ? createProxy(value, path.concat(prop))
              : value
          },

          set(target, prop, value) {
            if (target[prop] !== value) {
              target[prop] = value
            }
            return true
          }
        })
      }

      return {
        raw: clone(initialObj),
        data: createProxy(clone(initialObj))
      }
    },

    (hookState, key, notify) => {
      const s = hookState.value

      const clone = (o: any) => JSON.parse(JSON.stringify(o))

      const createProxy = (obj: any, path: (string | symbol)[] = []): any => {
        return new Proxy(obj, {
          get(target, prop) {
            const value = target[prop]
            return value && typeof value === "object"
              ? createProxy(value, path.concat(prop))
              : value
          },

          set(target, prop, value) {
            if (target[prop] !== value) {
              target[prop] = value
              notify(key)
            }
            return true
          }
        })
      }

      const getData = () => s.data

      const setData = (newData: any) => {
        s.raw = clone(newData)
        s.data = createProxy(clone(newData))
        notify(key)
      }

      return [s.data, setData, getData] as const
    }
  )
}
