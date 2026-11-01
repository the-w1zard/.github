import { routerStore, createHook,  } from '#the-cloud'

export type Locales = string[] | undefined

export function useLocales(__sauron_id__ = _sid()): Locales {
  return createHook(
    'useLocales',
    __sauron_id__,
    (): HookState => ({ value: undefined }),
    () => {
      const root = routerStore.matches[0]
      if (!root?.data || typeof root.data !== 'object' || Array.isArray(root.data)) return undefined

      const locales = (root.data as any).locales
      if (!locales) return undefined
      if (Array.isArray(locales) && locales.every(v => typeof v === 'string')) return locales
      if (typeof locales === 'string') return [locales]
      return undefined
    }
  )
}
