import {  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useHistory — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic navigation state, browser‑sync via popstate
// ───────────────────────────────────────────────

export function useHistory(initialPath = '/', __sauron_id__ = _sid()) {
  return createHook(
    'useHistory',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const path =
        typeof window !== 'undefined'
          ? window.location.pathname || initialPath
          : initialPath

      const state = {
        location: path,
        history: [path],
        currentIndex: 0,
        canGoBack: false,
        canGoForward: false,
        attached: false,
        cleanup: null as null | (() => void)
      }

      if (typeof window !== 'undefined') {
        const onPop = () => {
          const p = window.location.pathname
          const idx = state.history.indexOf(p)

          if (idx !== -1) {
            state.currentIndex = idx
            state.location = p
          } else {
            state.history.push(p)
            state.currentIndex = state.history.length - 1
            state.location = p
          }

          state.canGoBack = state.currentIndex > 0
          state.canGoForward = state.currentIndex < state.history.length - 1

          notifyHook(__sauron_id__)
        }

        window.addEventListener('popstate', onPop)
        state.cleanup = () => window.removeEventListener('popstate', onPop)
      }

      return { value: state }
    },

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const s = hook.value

      const push = (path: string, stateObj: any = {}) => {
        if (s.currentIndex < s.history.length - 1) {
          s.history = s.history.slice(0, s.currentIndex + 1)
        }

        s.history.push(path)
        s.currentIndex = s.history.length - 1
        s.location = path
        s.canGoBack = s.currentIndex > 0
        s.canGoForward = false

        if (typeof window !== 'undefined') {
          window.history.pushState(stateObj, '', path)
        }

        notifyHook(key)
      }

      const replace = (path: string, stateObj: any = {}) => {
        s.history[s.currentIndex] = path
        s.location = path

        if (typeof window !== 'undefined') {
          window.history.replaceState(stateObj, '', path)
        }

        notifyHook(key)
      }

      const go = (delta: number) => {
        const newIndex = s.currentIndex + delta
        if (newIndex < 0 || newIndex >= s.history.length) return

        s.currentIndex = newIndex
        s.location = s.history[newIndex]
        s.canGoBack = s.currentIndex > 0
        s.canGoForward = s.currentIndex < s.history.length - 1

        if (typeof window !== 'undefined') {
          window.history.go(delta)
        }

        notifyHook(key)
      }

      const back = () => go(-1)
      const forward = () => go(1)

      return [
        {
          location: s.location,
          canGoBack: s.canGoBack,
          canGoForward: s.canGoForward
        },
        { push, replace, go, back, forward }
      ]
    }
  )
}
