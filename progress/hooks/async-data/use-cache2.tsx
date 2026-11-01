import { createHook, HookState } from '#the-cloud'
import { staff } from '../../../conduits/staff/staff'
import { _sid } from '../_sid'

export interface CacheHook<T> {
  data: T | null
  loading: boolean
  error: Error | null
  get: (key: string) => Promise<T | null>
  set: (key: string, value: T, ttl?: number) => Promise<void>
  del: (key: string) => Promise<void>
  clear: () => Promise<void>
}

interface CacheHookState extends HookState {
  data: any
  loading: boolean
  error: Error | null
  cacheName: string
  unsubs: (() => void)[]
}

export function useCache2<T = unknown>(cacheName = 'default', __sauron_id__ = _sid()): CacheHook<T> {
  return createHook(
    'useCache',
    __sauron_id__,
    (): CacheHookState => {
      const s: CacheHookState = {
        value: undefined,
        data: null,
        loading: false,
        error: null,
        cacheName,
        unsubs: []
      }
      s.cleanup = () => { s.unsubs.forEach(u => u()); s.unsubs = [] }
      return s
    },
    (s: CacheHookState, key, notify) => {
      const store = staff.kvdb.scope(s.cacheName)

      const get = async (k: string): Promise<T | null> => {
        s.loading = true; s.error = null; notify(key)
        try {
          const result = await store.get(k) as T | null
          s.data = result
          s.loading = false
          notify(key)
          return result
        } catch (e) {
          s.error = e as Error
          s.loading = false
          notify(key)
          return null
        }
      }

      const set = async (k: string, value: T, ttl?: number): Promise<void> => {
        s.loading = true; s.error = null; notify(key)
        try {
          await store.set(k, ttl !== undefined ? { value, expires: Date.now() + ttl } : value as any)
          s.data = value
          s.loading = false
          notify(key)
        } catch (e) {
          s.error = e as Error
          s.loading = false
          notify(key)
        }
      }

      const del = async (k: string): Promise<void> => {
        s.loading = true; s.error = null; notify(key)
        try {
          await store.delete(k)
          s.data = null
          s.loading = false
          notify(key)
        } catch (e) {
          s.error = e as Error
          s.loading = false
          notify(key)
        }
      }

      const clear = async (): Promise<void> => {
        s.loading = true; s.error = null; notify(key)
        try {
          await store.deleteMany(await store.getMany([]).then(Object.keys))
          s.data = null
          s.loading = false
          notify(key)
        } catch (e) {
          s.error = e as Error
          s.loading = false
          notify(key)
        }
      }

      // subscribe to any ngin watch events for this cache scope so external
      // writes (from other components or server) flow in reactively
      if (s.unsubs.length === 0) {
        const unsub = staff.sub((incoming: any) => {
          s.data = incoming
          notify(key)
        }, `ngin:watch:${s.cacheName}:*`,)
        s.unsubs.push(unsub)
      }

      return {
        data: s.data as T | null,
        loading: s.loading,
        error: s.error,
        get,
        set,
        del,
        clear
      }
    }
  )
}
