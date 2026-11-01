import { createHook, HookState } from '#the-cloud'

interface MediaQueryHookState extends HookState {
  matches: boolean
  mql:     MediaQueryList | null
}

export function useMediaQuery(query: string, __sauron_id__ = _sid()): [boolean, () => boolean] {
  return createHook(
    'useMediaQuery',
    __sauron_id__,
    (): MediaQueryHookState => {
      const supported = typeof window !== 'undefined' && 'matchMedia' in window
      const mql       = supported ? window.matchMedia(query) : null
      const s: MediaQueryHookState = {
        value:   undefined,
        matches: mql?.matches ?? false,
        mql
      }
      if (mql) {
        const handler = (e: MediaQueryListEvent) => { s.matches = e.matches }
        mql.addEventListener('change', handler)
        s.cleanup = () => mql.removeEventListener('change', handler)
      }
      return s
    },
    (s: HookState, key, notify) => {
      const state = s as MediaQueryHookState
      if (state.mql) {
        const existing = (state.mql as any).__handler__
        if (!existing) {
          const handler = (e: MediaQueryListEvent) => { state.matches = e.matches; notify(key) }
          ;(state.mql as any).__handler__ = handler
          state.mql.addEventListener('change', handler)
        }
      }
      return [state.matches, () => state.matches]
    }
  )
}
