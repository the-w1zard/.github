import {   createHook,   notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useEventBus — Sauron‑native rewrite
// No hookSystem, no scheduleRender, no globalSignals
// Each namespace gets a stable global bus stored on globalThis
// Deterministic cleanup, stable listeners, no React
// ───────────────────────────────────────────────

type BusListener = {
  fn: (data: any) => void
  key: string | number
}

type Bus = {
  listeners: Map<string, BusListener[]>
  history: Map<string, { data: any; timestamp: number }[]>
}

function getBus(namespace: string): Bus {
  const key = `__sauron_eventbus_${namespace}`
  const g = globalThis as any
  if (!g[key]) {
    g[key] = {
      listeners: new Map(),
      history: new Map()
    } as Bus
  }
  return g[key]
}

export function useEventBus(namespace = 'default', __sauron_id__ = _sid()) {
  return createHook(
    'useEventBus',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        bus: getBus(namespace),
        namespace
      }
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const bus = hook.value.bus

      const emit = (event: string, data: any) => {
        // history
        if (!bus.history.has(event)) bus.history.set(event, [])
        const h = bus.history.get(event)!
        h.push({ data, timestamp: Date.now() })
        if (h.length > 100) h.shift()

        // listeners
        const listeners = bus.listeners.get(event) || []
        for (const l of listeners) {
          l.fn(data)
          notifyHook(l.key)
        }
      }

      const on = (event: string, callback: (data: any) => void) => {
        if (!bus.listeners.has(event)) bus.listeners.set(event, [])

        const listener: BusListener = {
          fn: callback,
          key
        }

        bus.listeners.get(event)!.push(listener)

        return () => {
          const arr = bus.listeners.get(event)
          if (!arr) return
          const idx = arr.indexOf(listener)
          if (idx !== -1) arr.splice(idx, 1)
        }
      }

      const once = (event: string, callback: (data: any) => void) => {
        let unsub: () => void
        const wrapper = (data: any) => {
          callback(data)
          unsub()
        }
        unsub = on(event, wrapper)
        return unsub
      }

      const getHistory = (event: string) => {
        return bus.history.get(event) || []
      }

      return [{ emit, on, once, getHistory }]
    }
  )
}
