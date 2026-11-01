import { getCurrentComponent, notifyHook } from '#the-cloud'

const adapters = {
  memory: (() => {
    const store = new Map<string, any>()
    return {
      get: (key: string) => store.get(key) ?? null,
      set: (key: string, value: any) => store.set(key, value)
    }
  })(),

  localStorage: {
    get: (key: string) => {
      if (typeof localStorage === 'undefined') return null
      try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
    },
    set: (key: string, value: any) => {
      if (typeof localStorage === 'undefined') return
      try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
    }
  },

  fileSystem: {
    get: async (key: string) => {
      if (typeof process === 'undefined') return null
      try {
        const fs   = await import('fs/promises')
        const path = await import('path')
        const data = await fs.readFile(path.join(process.cwd(), '.durable', `${key}.json`), 'utf-8')
        return JSON.parse(data)
      } catch { return null }
    },
    set: async (key: string, value: any) => {
      if (typeof process === 'undefined') return
      try {
        const fs   = await import('fs/promises')
        const path = await import('path')
        const dir  = path.join(process.cwd(), '.durable')
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(value, null, 2))
      } catch {}
    }
  }
}

export const usePersistent     = <T>(key: string, initial: T | (() => T)) => useDurable(key, initial, { storage: 'localStorage' })
export const useFilePersistent = <T>(key: string, initial: T | (() => T)) => useDurable(key, initial, { storage: 'fileSystem' })

export function useDurable<T>(
  durableKey:    string,
  initialValue:  T | (() => T),
  options:       { storage?: 'memory' | 'localStorage' | 'fileSystem' } = {},
  __sauron_id__ = _sid()
): [T, (value: T | ((prev: T) => T)) => void] {
  const component   = getCurrentComponent()
  const key         = `${component.id}:useDurable:${__sauron_id__}`
  const storageType = options.storage ?? (typeof localStorage !== 'undefined' ? 'localStorage' : 'memory')
  const storage     = adapters[storageType]
  const isAsync     = storageType === 'fileSystem'

  if (!component.hooks.has(key)) {
    let initial: T

    if (!isAsync) {
      const stored = (storage as typeof adapters.memory).get(durableKey)
      if (stored !== null) {
        initial = stored
      } else {
        initial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
        ;(storage as typeof adapters.memory).set(durableKey, initial)
      }
    } else {
      initial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    }

    component.hooks.set(key, { value: initial, loaded: !isAsync } as { value: T; loaded: boolean })
  }

  const hook = component.hooks.get(key)! as { value: T; loaded: boolean }

  if (isAsync && !hook.loaded) {
    queueMicrotask(async () => {
      const stored = await (storage as typeof adapters.fileSystem).get(durableKey)
      if (stored !== null) {
        hook.value  = stored
        hook.loaded = true
      } else {
        await (storage as typeof adapters.fileSystem).set(durableKey, hook.value)
        hook.loaded = true
      }
      notifyHook(key)
    })
  }

  const setValue = (newValue: T | ((prev: T) => T)) => {
    const next = typeof newValue === 'function' ? (newValue as (prev: T) => T)(hook.value) : newValue
    if (JSON.stringify(next) === JSON.stringify(hook.value)) return
    hook.value = next
    if (!isAsync) {
      ;(storage as typeof adapters.memory).set(durableKey, next)
    } else {
      queueMicrotask(() => (storage as typeof adapters.fileSystem).set(durableKey, next))
    }
    notifyHook(key)
  }

  return [hook.value, setValue]
}
