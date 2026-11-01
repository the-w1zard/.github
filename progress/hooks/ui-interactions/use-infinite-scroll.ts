import {  createHook,  notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useInfiniteScroll — Sauron‑native rewrite
// No React, no useEffect, no useState, no hookSystem
// Deterministic IntersectionObserver + async loader
// ───────────────────────────────────────────────

export function useInfiniteScroll(
  loadMore: (page: number) => Promise<{ hasMore?: boolean }>,
  options: {
    threshold?: number
    initialLoad?: boolean
    distance?: number
    enabled?: boolean
  } = {},
  __sauron_id__ = _sid()
) {
  const {
    threshold = 100,
    initialLoad = true,
    distance = 100,
    enabled = true
  } = options

  return createHook(
    'useInfiniteScroll',
    __sauron_id__,

    (): HookState => ({
      value: {
        loading: false,
        hasMore: true,
        page: 0,
        error: null as any,
        ref: null as HTMLElement | null,
        observer: null as IntersectionObserver | null,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      const setRef = (el: HTMLElement | null) => {
        s.ref = el
        notifyHook(key)
      }

      const load = async () => {
        if (s.loading || !s.hasMore || !enabled) return

        s.loading = true
        notifyHook(key)

        try {
          const result = await loadMore(s.page + 1)
          s.hasMore = result.hasMore !== false
          s.page++
          s.error = null
        } catch (err) {
          s.error = err
        } finally {
          s.loading = false
          notifyHook(key)
        }
      }

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        if (initialLoad && enabled) load()

        if (s.ref) {
          s.observer = new IntersectionObserver(
            (entries) => {
              const entry = entries[0]
              if (entry.isIntersecting && !s.loading && s.hasMore && enabled) {
                load()
              }
            },
            {
              root: null,
              rootMargin: `${distance}px`,
              threshold
            }
          )

          s.observer.observe(s.ref)
        }

        s.cleanup = () => {
          if (s.observer) s.observer.disconnect()
        }
      }

      return [
        setRef,
        {
          loading: s.loading,
          hasMore: s.hasMore,
          error: s.error,
          page: s.page
        },
        load
      ]
    }
  )
}
