import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useLocalStorage — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Deterministic localStorage wrapper with:
//   • read / write / remove
//   • cross‑tab sync via storage event
//   • serializer / deserializer
// ───────────────────────────────────────────────

export function useLocalStorage<T = any>(
  key: string,
  initialValue: T,
  options: {
    serializer?: (v: any) => string
    deserializer?: (v: string) => any
  } = {},
  __sauron_id__ = _sid()
) {
  const serializer = options.serializer ?? JSON.stringify
  const deserializer = options.deserializer ?? JSON.parse

  const readValue = (): T => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return typeof initialValue === 'function'
        ? (initialValue as any)()
        : initialValue
    }

    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) {
        return typeof initialValue === 'function'
          ? (initialValue as any)()
          : initialValue
      }
      return deserializer(raw)
    } catch {
      return typeof initialValue === 'function'
        ? (initialValue as any)()
        : initialValue
    }
  }

  return createHook(
    'useLocalStorage',
    __sauron_id__,

    (): HookState => ({
      value: {
        stored: readValue(),
        cleanup: null as null | (() => void),
        attached: false
      }
    }),

    (hook, keyId) => {
      const s = hook.value

      const setStoredValue = (value: T | ((prev: T) => T)) => {
        const next =
          typeof value === 'function'
            ? (value as any)(s.stored)
            : value

        s.stored = next
        notifyHook(keyId)

        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(key, serializer(next))

            window.dispatchEvent(
              new StorageEvent('storage', {
                key,
                newValue: serializer(next)
              })
            )
          } catch {}
        }
      }

      const removeValue = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.removeItem(key)
          } catch {}
        }
        s.stored = undefined
        notifyHook(keyId)
      }

      const getStoredValue = () => s.stored

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        const onStorage = (e: StorageEvent) => {
          if (e.key !== key) return
          try {
            s.stored = e.newValue
              ? deserializer(e.newValue)
              : undefined
            notifyHook(keyId)
          } catch {}
        }

        window.addEventListener('storage', onStorage)

        s.cleanup = () => {
          window.removeEventListener('storage', onStorage)
        }
      }

      return [s.stored, setStoredValue, removeValue, getStoredValue]
    }
  )
}
