import { createHook } from '#the-cloud'
import { _sid } from '#sauron'
import { useSignal } from '#sauron'

export interface PaginationOptions<T> {
  initialPage?: number
  pageSize?: number
  total?: number
  fetchPage: (page: number, pageSize: number) => Promise<T[]>
  cache?: boolean
}

export function usePagination<T>(options: PaginationOptions<T>) {
  return createHook(
    "usePagination",
    _sid(),

    () => {
      const [getPage, setPage] = useSignal(options.initialPage || 1)
      const [getPageSize, setPageSize] = useSignal(options.pageSize || 20)
      const [getData, setData] = useSignal<T[]>([])
      const [getPages, setPages] = useSignal<Map<number, T[]>>(new Map())
      const [getError, setError] = useSignal<Error | undefined>(undefined)
      const [getIsLoading, setIsLoading] = useSignal(false)
      const [getTotal, setTotal] = useSignal(options.total)

      return {
        options,
        getPage,
        setPage,
        getPageSize,
        setPageSize,
        getData,
        setData,
        getPages,
        setPages,
        getError,
        setError,
        getIsLoading,
        setIsLoading,
        getTotal,
        setTotal,
        initialized: false
      }
    },

    (hookState, key, notify) => {
      const s = hookState.value

      const loadPage = async (page: number) => {
        // Cache hit
        if (s.options.cache && s.getPages().has(page)) {
          s.setData(s.getPages().get(page)!)
          notify(key)
          return
        }

        s.setIsLoading(true)
        notify(key)

        try {
          const data = await s.options.fetchPage(page, s.getPageSize())
          s.setData(data)

          if (s.options.cache) {
            const pages = new Map(s.getPages())
            pages.set(page, data)
            s.setPages(pages)
          }

          // Placeholder for total detection
          if (page === 1 && !s.getTotal()) {
            // Could set total from headers or metadata
          }
        } catch (err) {
          s.setError(err instanceof Error ? err : new Error(String(err)))
        } finally {
          s.setIsLoading(false)
          notify(key)
        }
      }

      //
      // Initial load (only once)
      //
      if (!s.initialized) {
        s.initialized = true
        loadPage(s.getPage())
      }

      const goTo = async (page: number) => {
        s.setPage(page)
        notify(key)
        await loadPage(page)
      }

      const next = async () => {
        const totalPages = s.getTotal()
          ? Math.ceil(s.getTotal()! / s.getPageSize())
          : Infinity

        if (s.getPage() >= totalPages) return
        await goTo(s.getPage() + 1)
      }

      const prev = async () => {
        if (s.getPage() <= 1) return
        await goTo(s.getPage() - 1)
      }

      const updatePageSize = (size: number) => {
        s.setPageSize(size)
        s.setPage(1)
        s.setPages(new Map())
        notify(key)
        loadPage(1)
      }

      const totalPages = s.getTotal()
        ? Math.ceil(s.getTotal()! / s.getPageSize())
        : Infinity

      return {
        data: s.getData(),
        page: s.getPage(),
        pageSize: s.getPageSize(),
        totalPages,
        hasNext: s.getPage() < totalPages,
        hasPrev: s.getPage() > 1,
        isLoading: s.getIsLoading(),
        error: s.getError(),
        goTo,
        next,
        prev,
        setPageSize: updatePageSize
      }
    }
  )
}
