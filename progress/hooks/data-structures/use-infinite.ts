import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useInfinite — Sauron‑native rewrite
// No React, no useSignal, no hookSystem
// Deterministic cursor‑based infinite pagination
// ───────────────────────────────────────────────

export interface InfiniteOptions<T, C = any> {
  initialSize?: number
  getCursor: (lastPage: T[]) => C | null
  fetchPage: (cursor: C | null, index: number) => Promise<T[]>
  combine?: (pages: T[][]) => T[]
  revalidateFirst?: boolean
  maxPages?: number
}

export function useInfinite<T, C = any>(
  options: InfiniteOptions<T, C>,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useInfinite',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        options,
        pages: [] as T[][],
        cursors: [null] as (C | null)[],
        error: undefined as Error | undefined,
        isLoading: false,
        isValidating: false,
        hasMore: true
      }
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const s = hook.value
      const initialSize = s.options.initialSize || 1

      const loadPage = async (index: number, cursor: C | null) => {
        return s.options.fetchPage(cursor, index)
      }

      const loadMore = async () => {
        if (!s.hasMore || s.isLoading) return

        s.isLoading = true
        notifyHook(key)

        try {
          const nextIndex = s.pages.length
          const cursor = s.cursors[s.cursors.length - 1]
          const page = await loadPage(nextIndex, cursor)

          if (page.length === 0) {
            s.hasMore = false
            return
          }

          const nextCursor = s.options.getCursor(page)

          s.pages = [...s.pages, page]
          s.cursors = [...s.cursors, nextCursor]

          if (s.options.maxPages && s.pages.length > s.options.maxPages) {
            s.pages = s.pages.slice(-s.options.maxPages)
            s.cursors = s.cursors.slice(-s.options.maxPages - 1)
          }
        } catch (err: any) {
          s.error = err instanceof Error ? err : new Error(String(err))
        } finally {
          s.isLoading = false
          notifyHook(key)
        }
      }

      const initialize = async () => {
        s.isLoading = true
        notifyHook(key)

        try {
          const pages: T[][] = []
          const cursors: (C | null)[] = [null]

          for (let i = 0; i < initialSize; i++) {
            const page = await loadPage(i, cursors[cursors.length - 1])

            if (page.length === 0) {
              s.hasMore = false
              break
            }

            pages.push(page)
            cursors.push(s.options.getCursor(page))
          }

          s.pages = pages
          s.cursors = cursors
        } catch (err: any) {
          s.error = err instanceof Error ? err : new Error(String(err))
        } finally {
          s.isLoading = false
          notifyHook(key)
        }
      }

      initialize()

      const refresh = async () => {
        s.isValidating = true
        s.pages = []
        s.cursors = [null]
        s.hasMore = true
        notifyHook(key)

        await initialize()

        s.isValidating = false
        notifyHook(key)
      }

      const combine = s.options.combine || ((pages: T[][]) => pages.flat())
      const data = combine(s.pages)

      return {
        data,
        error: s.error,
        isLoading: s.isLoading,
        isValidating: s.isValidating,
        hasMore: s.hasMore,
        loadMore,
        refresh,
        pages: s.pages.length
      }
    }
  )
}
