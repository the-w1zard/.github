// Sauron‑native rewrite — no React, no useState, no useEffect, no useCSE
// Pure deterministic location tracking with:
//   • pathname / search / hash
//   • state / key from history.state
//   • pushState / replaceState interception
//   • popstate listener
//   • cleanup on unmount

import {   notifyHook } from '#the-cloud'

export interface Location {
  pathname: string
  search: string
  hash: string
  state: unknown
  key: string
}

export function useLocation(__sauron_id__ = _sid()): Location {
  return createHook(
    'useLocation',
    __sauron_id__,

    (): HookState => ({
      value: {
        loc: buildLocation(),
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        const update = () => {
          s.loc = buildLocation()
          notifyHook(key)
        }

        const origPush = window.history.pushState.bind(window.history)
        const origReplace = window.history.replaceState.bind(window.history)

        window.history.pushState = (...args) => {
          origPush(...args)
          update()
        }

        window.history.replaceState = (...args) => {
          origReplace(...args)
          update()
        }

        const onPop = () => update()
        window.addEventListener('popstate', onPop)

        s.cleanup = () => {
          window.removeEventListener('popstate', onPop)
          window.history.pushState = origPush
          window.history.replaceState = origReplace
        }
      }

      return s.loc
    }
  )
}

function buildLocation(): Location {
  if (typeof window === 'undefined') {
    return {
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    }
  }

  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: window.history.state?.usr ?? null,
    key: window.history.state?.key ?? 'default'
  }
}
