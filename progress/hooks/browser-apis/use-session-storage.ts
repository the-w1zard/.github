 

export function useSessionStorage(
  key: string,
  initialValue: any,
  __sauron_id__ = _sid()
) {
  return createHook(
    "useSessionStorage",
    __sauron_id__,

    () => ({
      value: {
        key,
        initialValue,
        supported:
          typeof window !== "undefined" &&
          typeof sessionStorage !== "undefined"
      }
    }),

    (state, keyId, notify) => {
      const s = state.value

      const read = () => {
        if (!s.supported) return s.initialValue
        const raw = sessionStorage.getItem(s.key)
        if (raw === null) return s.initialValue
        try {
          return JSON.parse(raw)
        } catch {
          return raw
        }
      }

      const write = (value: any) => {
        if (!s.supported) return
        const next =
          typeof value === "function" ? value(read()) : value
        sessionStorage.setItem(s.key, JSON.stringify(next))
        notify(keyId)
        return next
      }

      const remove = () => {
        if (!s.supported) return
        sessionStorage.removeItem(s.key)
        notify(keyId)
      }

      return [read(), write, remove] as const
    }
  )
}
