import { createHook } from '#the-cloud'

export function useProviderTree(initialProviders: Array<{ provider: any; value: any }> = []) {
  return createHook(
    "useProviderTree",
    _sid(),

    () => ({
      providers: [...initialProviders]
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Compose providers into a nested functional tree
      //
      const compose = (children: any) => {
        return s.providers.reduceRight((acc, entry) => {
          const P = entry.provider
          const v = entry.value
          return P(acc, v)
        }, children)
      }

      //
      // Add provider
      //
      const addProvider = (provider: any, value: any) => {
        s.providers.push({ provider, value })
        notify(key)
      }

      //
      // Remove provider
      //
      const removeProvider = (provider: any) => {
        s.providers = s.providers.filter(p => p.provider !== provider)
        notify(key)
      }

      return [compose, { addProvider, removeProvider }]
    }
  )
}
