import { _sid, createHook, HookState } from '#the-cloud'

interface CacheOptions {
  strategy?: 'lru' | 'lfu' | 'fifo' | 'ttl'
  maxSize?: number
  ttl?: number
  swr?: boolean
  persistent?: boolean
  compress?: boolean
}

interface CacheEntry<T> {
  value: T
  timestamp: number
  hits: number
  size?: number
}

class CacheStrategy {
  private store = new Map<string, CacheEntry<any>>()
  private keys: string[] = []
  private frequencies = new Map<string, number>()

  constructor(private options: CacheOptions) {}

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (this.options.ttl && Date.now() - entry.timestamp > this.options.ttl) {
      if (this.options.swr) {
        setTimeout(() => this.delete(key), 0)
        return entry.value
      }
      this.delete(key)
      return undefined
    }

    entry.hits++
    this.frequencies.set(key, (this.frequencies.get(key) || 0) + 1)

    this.keys = this.keys.filter(k => k !== key)
    this.keys.push(key)

    return entry.value
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this.options.maxSize && this.store.size >= this.options.maxSize) {
      this.evict()
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      hits: 0
    }

    if (this.options.compress) {
      try {
        const serialized = JSON.stringify(value)
        entry.size = new Blob([serialized]).size
      } catch {}
    }

    this.store.set(key, entry)
    this.keys.push(key)
    this.frequencies.set(key, 0)

    if (this.options.persistent) {
      try {
        localStorage.setItem(`cache:${key}`, JSON.stringify(entry))
      } catch {}
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
    this.keys = this.keys.filter(k => k !== key)
    this.frequencies.delete(key)

    if (this.options.persistent) {
      localStorage.removeItem(`cache:${key}`)
    }
  }

  async clear(): Promise<void> {
    this.store.clear()
    this.keys = []
    this.frequencies.clear()

    if (this.options.persistent) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'))
      keys.forEach(k => localStorage.removeItem(k))
    }
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key)
  }

  async size(): Promise<number> {
    return this.store.size
  }

  private evict(): void {
    switch (this.options.strategy) {
      case 'lru': {
        const k = this.keys[0]
        if (k) this.delete(k)
        break
      }
      case 'lfu': {
        let minKey: string | undefined
        let minHits = Infinity
        for (const [k, hits] of this.frequencies) {
          if (hits < minHits) {
            minHits = hits
            minKey = k
          }
        }
        if (minKey) this.delete(minKey)
        break
      }
      case 'fifo': {
        const k = this.keys[0]
        if (k) this.delete(k)
        break
      }
      default: {
        const k = this.keys[0]
        if (k) this.delete(k)
      }
    }
  }

  async loadPersistent(): Promise<void> {
    if (!this.options.persistent) return

    const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'))
    for (const key of keys) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const entry = JSON.parse(data)
          const cacheKey = key.replace('cache:', '')
          this.store.set(cacheKey, entry)
        }
      } catch {}
    }
  }
}

export function useCache<T = any>(options: CacheOptions = {}, __sauron_id__ = _sid()) {
  return createHook(
    'useCache',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        strategy: new CacheStrategy(options),
        options
      }
    }),

    // ───────────────────────────────────────── updater
    async (hook) => {
      const { strategy, options } = hook.value

      if (options.persistent) {
        await strategy.loadPersistent()
      }

      const cache = {
        async get(key: string): Promise<T | undefined> {
          const start = performance.now()
         const value = await strategy.get(key)

          const duration = performance.now() - start

          if (value !== undefined) {
            cache.metrics.hits++
            cache.metrics.hitTime += duration
          } else {
            cache.metrics.misses++
          }

          return value
        },

        async set(key: string, value: T): Promise<void> {
          const start = performance.now()
          await strategy.set(key, value)
          const duration = performance.now() - start

          cache.metrics.sets++
          cache.metrics.setTime += duration
        },

        async delete(key: string): Promise<void> {
          await strategy.delete(key)
          cache.metrics.deletes++
        },

        async clear(): Promise<void> {
          await strategy.clear()
          cache.metrics = { hits: 0, misses: 0, sets: 0, deletes: 0, hitTime: 0, setTime: 0 }
        },

        async has(key: string): Promise<boolean> {
          return strategy.has(key)
        },

        async size(): Promise<number> {
          return strategy.size()
        },

        metrics: {
          hits: 0,
          misses: 0,
          sets: 0,
          deletes: 0,
          hitTime: 0,
          setTime: 0
        },

        stats() {
          const total = cache.metrics.hits + cache.metrics.misses
          return {
            ...cache.metrics,
            hitRate: total > 0 ? (cache.metrics.hits / total) * 100 : 0,
            avgHitTime: cache.metrics.hits > 0 ? cache.metrics.hitTime / cache.metrics.hits : 0,
            avgSetTime: cache.metrics.sets > 0 ? cache.metrics.setTime / cache.metrics.sets : 0,
            size: strategy.size()
          }
        },

        async keys(): Promise<string[]> {
          return Array.from((strategy as any).store.keys())
        },

        async getMany(keys: string[]): Promise<(T | undefined)[]> {
          return Promise.all(keys.map(k => cache.get(k)))
        },

        async setMany(entries: [string, T][]): Promise<void> {
          await Promise.all(entries.map(([k, v]) => cache.set(k, v)))
        },

        async getOrCompute(key: string, compute: () => Promise<T>): Promise<T> {
          const cached = await cache.get(key)
          if (cached !== undefined) return cached

          const value = await compute()
          await cache.set(key, value)
          return value
        }
      }

      return cache
    },

    // ───────────────────────────────────────── cleanup
   
  )
}
