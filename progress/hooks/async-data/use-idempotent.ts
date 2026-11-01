import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// Global idempotency store (same semantics as original)
// ───────────────────────────────────────────────

const idempotencyStore = new Map<
  string,
  { result: any; timestamp: number; ttl: number }
>()

// ───────────────────────────────────────────────
// useIdempotent — Sauron‑native rewrite
// No React, no useSignal, no hookSystem
// Deterministic idempotency with TTL + duplicate detection
// ───────────────────────────────────────────────

export interface IdempotentOptions<T> {
  storage?: 'memory' | 'local' | 'session'
  prefix?: string
  ttl?: number
  onDuplicate?: (key: string, previousResult: T) => void
}

export function useIdempotent<T = any>(
  operation: (key?: string) => Promise<T>,
  options: IdempotentOptions<T> = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useIdempotent',
    __sauron_id__,

    // initializer
    (): HookState => ({
      value: {
        operation,
        options,
        results: new Map<string, T>()
      }
    }),

    // updater
    (hook, key) => {
      const s = hook.value

      const generateKey = (input?: string): string => {
        if (input) return `${s.options.prefix || 'idempotent'}:${input}`
        return `${s.options.prefix || 'idempotent'}:${Date.now()}-${Math.random().toString(36)}`
      }

      const execute = async (idempotencyKey?: string): Promise<T> => {
        const fullKey = generateKey(idempotencyKey)
        const ttl = s.options.ttl || 24 * 60 * 60 * 1000

        const existing = idempotencyStore.get(fullKey)
        if (existing) {
          if (Date.now() - existing.timestamp < existing.ttl) {
            s.options.onDuplicate?.(fullKey, existing.result)
            return existing.result as T
          } else {
            idempotencyStore.delete(fullKey)
          }
        }

        const result = await s.operation(idempotencyKey)

        idempotencyStore.set(fullKey, {
          result,
          timestamp: Date.now(),
          ttl
        })

        s.results.set(fullKey, result)
        notifyHook(key)

        return result
      }

      const getResult = (k: string): T | undefined => {
        const fullKey = generateKey(k)
        const stored = idempotencyStore.get(fullKey)
        return stored?.result
      }

      const clear = (k?: string) => {
        if (k) {
          const fullKey = generateKey(k)
          idempotencyStore.delete(fullKey)
          s.results.delete(fullKey)
          notifyHook(key)
        } else {
          const now = Date.now()
          for (const [k, v] of idempotencyStore) {
            if (now - v.timestamp >= v.ttl) {
              idempotencyStore.delete(k)
            }
          }
          s.results = new Map()
          notifyHook(key)
        }
      }

      const isDuplicate = (k: string): boolean => {
        const fullKey = generateKey(k)
        const existing = idempotencyStore.get(fullKey)
        if (!existing) return false

        if (Date.now() - existing.timestamp >= existing.ttl) {
          idempotencyStore.delete(fullKey)
          return false
        }

        return true
      }

      return {
        execute,
        getResult,
        clear,
        isDuplicate
      }
    }
  )
}

// ───────────────────────────────────────────────
// useIdempotentPayment — Sauron‑native rewrite
// ───────────────────────────────────────────────

export function useIdempotentPayment<T = any>(
  paymentOperation: (key: string) => Promise<T>,
  __sauron_id__ = _sid()
) {
  const idempotent = useIdempotent(paymentOperation, {
    prefix: 'payment',
    ttl: 24 * 60 * 60 * 1000,
    onDuplicate: (key, result) => {
      console.warn(`Duplicate payment prevented: ${key}`, result)
    }
  })

  return {
    charge: (amount: number, metadata?: any) => {
      const key = `charge:${amount}:${JSON.stringify(metadata)}:${Date.now()}`
      return idempotent.execute(key)
    },
    refund: (chargeId: string, key?: string) => {
      const refundKey = key || `refund:${chargeId}:${Date.now()}`
      return idempotent.execute(refundKey)
    }
  }
}
