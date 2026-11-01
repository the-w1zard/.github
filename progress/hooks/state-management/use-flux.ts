import {   createHook,  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useFlux — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Pure deterministic reducer store with subscriptions
// ───────────────────────────────────────────────

export function useFlux(
  initialState: any = {},
  reducers: Record<string, (state: any, p: any) => any> = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useFlux',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        state: initialState,
        reducers,
        listeners: new Set<(s: any) => void>(),
        history: [initialState]
      }
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const s = hook.value

      const dispatch = (action: { type: string; p?: any }) => {
        const reducer = s.reducers[action.type]
        if (!reducer) return

        const next = reducer(s.state, action.p)
        s.state = next
        s.history.push(next)

        for (const fn of s.listeners) fn(s.state)

        notifyHook(key)
      }

      const subscribe = (listener: (s: any) => void) => {
        s.listeners.add(listener)
        return () => s.listeners.delete(listener)
      }

      const getState = () => s.state
      const getHistory = () => [...s.history]

      return [s.state, { dispatch, subscribe }, getState, getHistory]
    }
  )
}
