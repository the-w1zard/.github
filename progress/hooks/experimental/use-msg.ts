import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export type Message<T extends { type: string }> = T

export function useMsg<T extends { type: string }>(): [
  (msg: T) => void,
  {
    on:   <M extends T["type"]>(type: M, handler: (msg: Extract<T, { type: M }>) => void) => void
    once: <M extends T["type"]>(type: M, handler: (msg: Extract<T, { type: M }>) => void) => void
    off:  <M extends T["type"]>(type: M, handler?: (msg: Extract<T, { type: M }>) => void) => void
  }
] {
  return createHook(
    "useMsg",
    _sid(),
    () => {
      const handlers     = new Map<string, Set<(msg: any) => void>>()
      const onceHandlers = new Map<string, Set<(msg: any) => void>>()

      const emit = (msg: T) => {
        const h = handlers.get(msg.type)
        if (h) for (const fn of h) fn(msg)

        const o = onceHandlers.get(msg.type)
        if (o) {
          for (const fn of o) fn(msg)
          onceHandlers.delete(msg.type)
        }
      }

      return { handlers, onceHandlers, emit }
    },

    (hookState) => {
      const s = hookState.value

      const on = <M extends T["type"]>(
        type: M,
        handler: (msg: Extract<T, { type: M }>) => void
      ) => {
        if (!s.handlers.has(type)) s.handlers.set(type, new Set())
        s.handlers.get(type)!.add(handler)

        // cleanup on unmount
        if (!hookState.cleanup) {
          hookState.cleanup = () => {
            s.handlers.clear()
            s.onceHandlers.clear()
          }
        }
      }

      const once = <M extends T["type"]>(
        type: M,
        handler: (msg: Extract<T, { type: M }>) => void
      ) => {
        if (!s.onceHandlers.has(type)) s.onceHandlers.set(type, new Set())
        s.onceHandlers.get(type)!.add(handler)
      }

      const off = <M extends T["type"]>(
        type: M,
        handler?: (msg: Extract<T, { type: M }>) => void
      ) => {
        if (handler) {
          const set = s.handlers.get(type)
          if (set) {
            set.delete(handler)
            if (set.size === 0) s.handlers.delete(type)
          }
        } else {
          s.handlers.delete(type)
          s.onceHandlers.delete(type)
        }
      }

      return [s.emit, { on, once, off }]
    }
  )
}
