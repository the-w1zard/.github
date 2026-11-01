import { signal, Signal } from '#the-cloud'

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
  name:                     string
  failureThreshold?:        number
  failureRateThreshold?:    number
  timeout?:                 number
  halfOpenSuccessThreshold?: number
  minimumCalls?:            number
  permittedCalls?:          number
  slidingWindowSize?:       number
  slidingWindowBuckets?:    number
}

export interface RetryConfig {
  maxAttempts?:   number
  backoff?:       number
  maxBackoff?:    number
  multiplier?:    number
  jitter?:        number
  retryOn?:       (error: Error) => boolean
  retryOnStatus?: number[]
}

export interface BulkheadConfig {
  maxConcurrent?: number
  maxQueueSize?:  number
  queueTimeout?:  number
}

export interface RateLimiterConfig {
  limit?:  number
  period?: number
  burst?:  number
}

export interface TimeoutConfig {
  timeout?:    number
  cancelable?: boolean
}

export interface FallbackConfig<T> {
  fallback?:   T | ((error: Error) => T | Promise<T>)
  fallbackOn?: (error: Error) => boolean
}

export interface HealthCheckConfig {
  check:               () => Promise<boolean>
  interval?:           number
  unhealthyThreshold?: number
  healthyThreshold?:   number
}

export interface Metrics {
  name:                 string
  state:                CircuitState
  totalCalls:           number
  successfulCalls:      number
  failedCalls:          number
  rejectedCalls:        number
  timeoutCalls:         number
  failureRate:          number
  throughput:           number
  averageResponseTime:  number
  minResponseTime:      number
  maxResponseTime:      number
  circuitOpenedAt:      number | null
  circuitHalfOpenAt:    number | null
  circuitClosedAt:      number | null
  retryAttempts:        number
  retrySuccesses:       number
  concurrentCalls:      number
  queueSize:            number
  availablePermits:     number
  isHealthy:            boolean
  lastHealthCheck:      number
}

export interface BattleTestedOptions<T = any> {
  circuitBreaker?: CircuitBreakerConfig
  retry?:         RetryConfig
  bulkhead?:      BulkheadConfig
  rateLimiter?:   RateLimiterConfig
  timeout?:       TimeoutConfig
  healthCheck?:   HealthCheckConfig
  fallback?:      FallbackConfig<T>
  metrics?:       boolean
  chaos?: {
    enabled:      boolean
    failureRate?: number
    latency?:     { min: number; max: number }
  }
}

class SlidingWindow {
  private buckets:       Array<{ successes: number; failures: number }>
  private bucketSize:    number
  private currentBucket: number
  private lastUpdate:    number

  constructor(size: number, buckets: number) {
    this.buckets       = Array(buckets).fill(null).map(() => ({ successes: 0, failures: 0 }))
    this.bucketSize    = size / buckets
    this.currentBucket = 0
    this.lastUpdate    = Date.now()
  }

  private getBucketIndex(): number {
    const now              = Date.now()
    const elapsed          = now - this.lastUpdate
    const bucketsToAdvance = Math.floor(elapsed / this.bucketSize)
    if (bucketsToAdvance > 0) {
      this.currentBucket = (this.currentBucket + bucketsToAdvance) % this.buckets.length
      for (let i = 0; i < bucketsToAdvance && i < this.buckets.length; i++) {
        const idx = (this.currentBucket - i - 1 + this.buckets.length) % this.buckets.length
        this.buckets[idx] = { successes: 0, failures: 0 }
      }
      this.lastUpdate = now
    }
    return this.currentBucket
  }

  recordSuccess() { this.buckets[this.getBucketIndex()].successes++ }
  recordFailure() { this.buckets[this.getBucketIndex()].failures++ }

  getTotals(): { successes: number; failures: number; total: number } {
    const t = this.buckets.reduce(
      (acc, b) => ({ successes: acc.successes + b.successes, failures: acc.failures + b.failures }),
      { successes: 0, failures: 0 }
    )
    return { ...t, total: t.successes + t.failures }
  }

  reset(size: number, buckets: number) {
    this.buckets       = Array(buckets).fill(null).map(() => ({ successes: 0, failures: 0 }))
    this.bucketSize    = size / buckets
    this.currentBucket = 0
    this.lastUpdate    = Date.now()
  }
}

interface BattleTestedHookState<T> extends HookState {
  circuitState:          Signal<CircuitState>
  circuitOpenedAt:       Signal<number | null>
  circuitHalfOpenAt:     Signal<number | null>
  circuitClosedAt:       Signal<number | null>
  halfOpenSuccessCount:  Signal<number>
  concurrentCalls:       Signal<number>
  queueSize:             Signal<number>
  availablePermits:      Signal<number>
  retryAttempts:         Signal<number>
  retrySuccesses:        Signal<number>
  isHealthy:             Signal<boolean>
  healthFailures:        Signal<number>
  healthSuccesses:       Signal<number>
  metrics:               Signal<Metrics>
  window:                SlidingWindow | null
 queue: Array<{
  resolve: (value: T) => void
  reject: (reason: any) => void
  args: any[]
}>

  lastRefill:            number
  timing:                { total: number; count: number; min: number; max: number }
  startedAt:             number
  healthInterval:        ReturnType<typeof setInterval> | null
  rateLimiterInterval:   ReturnType<typeof setInterval> | null
}

export function useBattleTested<T = any>(
  fn:      (...args: any[]) => Promise<T>,
  options: BattleTestedOptions<T> = {},
  __sauron_id__ = _sid()
): [
  (...args: any[]) => Promise<T>,
  {
    getMetrics:  () => Metrics
    getState:    () => CircuitState
    isHealthy:   () => boolean
    reset:       () => void
    forceOpen:   () => void
    forceClose:  () => void
  }
] {
  const { circuitBreaker, retry, bulkhead, rateLimiter, timeout, healthCheck, fallback, chaos } = options

  return createHook(
    'useBattleTested',
    __sauron_id__,
    (): BattleTestedHookState<T> => {
      const s: BattleTestedHookState<T> = {
        value:                undefined,
        circuitState:         signal<CircuitState>('CLOSED'),
        circuitOpenedAt:      signal<number | null>(null),
        circuitHalfOpenAt:    signal<number | null>(null),
        circuitClosedAt:      signal<number | null>(null),
        halfOpenSuccessCount: signal(0),
        concurrentCalls:      signal(0),
        queueSize:            signal(0),
        availablePermits:     signal(rateLimiter?.limit ?? 100),
        retryAttempts:        signal(0),
        retrySuccesses:       signal(0),
        isHealthy:            signal(true),
        healthFailures:       signal(0),
        healthSuccesses:      signal(0),
        metrics:              signal<Metrics>({
          name:                circuitBreaker?.name ?? 'unknown',
          state:               'CLOSED',
          totalCalls:          0,
          successfulCalls:     0,
          failedCalls:         0,
          rejectedCalls:       0,
          timeoutCalls:        0,
          failureRate:         0,
          throughput:          0,
          averageResponseTime: 0,
          minResponseTime:     0,
          maxResponseTime:     0,
          circuitOpenedAt:     null,
          circuitHalfOpenAt:   null,
          circuitClosedAt:     null,
          retryAttempts:       0,
          retrySuccesses:      0,
          concurrentCalls:     0,
          queueSize:           0,
          availablePermits:    rateLimiter?.limit ?? 100,
          isHealthy:           true,
          lastHealthCheck:     Date.now()
        }),
        window:              circuitBreaker
          ? new SlidingWindow(circuitBreaker.slidingWindowSize ?? 10000, circuitBreaker.slidingWindowBuckets ?? 10)
          : null,
        queue:               [],
        lastRefill:          Date.now(),
        timing:              { total: 0, count: 0, min: Infinity, max: 0 },
        startedAt:           Date.now(),
        healthInterval:      null,
        rateLimiterInterval: null
      }

      // rate limiter refill
      if (rateLimiter) {
        s.rateLimiterInterval = setInterval(() => {
          const now     = Date.now()
          const elapsed = now - s.lastRefill
          const periods = Math.floor(elapsed / (rateLimiter.period ?? 60000))
          if (periods > 0) {
            s.availablePermits.value = Math.min(
              s.availablePermits.value + periods * (rateLimiter.limit ?? 100),
              rateLimiter.burst ?? (rateLimiter.limit ?? 100)
            )
            s.lastRefill = now
          }
        }, 1000)
      }

      // health check
      if (healthCheck) {
        const runCheck = async () => {
          try {
            const healthy = await healthCheck.check()
            if (healthy) {
              s.healthSuccesses.value++
              s.healthFailures.value = 0
              if (s.healthSuccesses.value >= (healthCheck.healthyThreshold ?? 1)) s.isHealthy.value = true
            } else {
              s.healthFailures.value++
              s.healthSuccesses.value = 0
              if (s.healthFailures.value >= (healthCheck.unhealthyThreshold ?? 3)) s.isHealthy.value = false
            }
          } catch {
            s.healthFailures.value++
            s.healthSuccesses.value = 0
            if (s.healthFailures.value >= (healthCheck.unhealthyThreshold ?? 3)) s.isHealthy.value = false
          }
        }
        runCheck()
        s.healthInterval = setInterval(runCheck, healthCheck.interval ?? 30000)
      }

      s.cleanup = () => {
        if (s.healthInterval)      clearInterval(s.healthInterval)
        if (s.rateLimiterInterval) clearInterval(s.rateLimiterInterval)
      }

      return s
    },
    (s: BattleTestedHookState<T>) => {
      const checkCircuitBreaker = () => {
        if (!circuitBreaker || !s.window) return
        const totals = s.window.getTotals()
        if (s.circuitState.value === 'OPEN') {
          if (s.circuitOpenedAt.value && Date.now() - s.circuitOpenedAt.value > (circuitBreaker.timeout ?? 60000)) {
            s.circuitState.value        = 'HALF_OPEN'
            s.circuitHalfOpenAt.value   = Date.now()
            s.halfOpenSuccessCount.value = 0
          }
        } else if (s.circuitState.value === 'HALF_OPEN') {
          if (s.halfOpenSuccessCount.value >= (circuitBreaker.halfOpenSuccessThreshold ?? 3)) {
            s.circuitState.value      = 'CLOSED'
            s.circuitClosedAt.value   = Date.now()
          }
        } else {
          if (totals.total >= (circuitBreaker.minimumCalls ?? 10)) {
            const rate = (totals.failures / totals.total) * 100
            if (rate >= (circuitBreaker.failureRateThreshold ?? 50)) {
              s.circuitState.value         = 'OPEN'
              s.circuitOpenedAt.value      = Date.now()
              s.halfOpenSuccessCount.value = 0
            }
          }
        }
      }

      const acquirePermit = (): boolean => {
        if (!rateLimiter) return true
        if (s.availablePermits.value > 0) { s.availablePermits.value--; return true }
        return false
      }

      const injectChaos = async () => {
        if (!chaos?.enabled) return
        if (chaos.failureRate && Math.random() < chaos.failureRate) throw new Error('Chaos: injected failure')
        if (chaos.latency) {
          const lat = chaos.latency.min + Math.random() * (chaos.latency.max - chaos.latency.min)
          await new Promise(r => setTimeout(r, lat))
        }
      }

      const processQueue = () => {
        if (!bulkhead || s.queue.length === 0) return
        while (s.concurrentCalls.value < (bulkhead.maxConcurrent ?? 10) && s.queue.length > 0) {
          const next = s.queue.shift()!
          s.queueSize.value--
          s.concurrentCalls.value++
          executeWithResilience(next.args)
            .then(next.resolve)
            .catch(next.reject)
            .finally(() => { s.concurrentCalls.value--; processQueue() })
        }
      }

      const executeWithResilience = async (args: any[]): Promise<T> => {
        const startTime = Date.now()
        let timeoutId: ReturnType<typeof setTimeout> | undefined

        try {
          if (!s.isHealthy.value) throw new Error('Service unhealthy')

          if (s.circuitState.value === 'OPEN') {
            s.metrics.value = { ...s.metrics.peek(), rejectedCalls: s.metrics.peek().rejectedCalls + 1 }
            throw new Error(`Circuit breaker is OPEN for ${circuitBreaker?.name}`)
          }

          if (!acquirePermit()) {
            s.metrics.value = { ...s.metrics.peek(), rejectedCalls: s.metrics.peek().rejectedCalls + 1 }
            throw new Error('Rate limit exceeded')
          }

          if (bulkhead) {
            if (s.concurrentCalls.value >= (bulkhead.maxConcurrent ?? 10)) {
              if (s.queueSize.value >= (bulkhead.maxQueueSize ?? 10)) {
                s.metrics.value = { ...s.metrics.peek(), rejectedCalls: s.metrics.peek().rejectedCalls + 1 }
                throw new Error('Bulkhead queue full')
              }
              return new Promise((resolve, reject) => {
                s.queueSize.value++
                s.queue.push({ resolve, reject, args })
              })
            }
            s.concurrentCalls.value++
          }

          await injectChaos()

          const execute = async (): Promise<T> => {
            if (retry) {
              let lastError!: Error
              let attempt = 0
              while (attempt < (retry.maxAttempts ?? 3)) {
                try {
                  const result = await fn(...args)
                  s.retrySuccesses.value++
                  return result
                } catch (err) {
                  lastError = err as Error
                  attempt++
                  s.retryAttempts.value++
                  const shouldRetry = retry.retryOn ? retry.retryOn(lastError) : true
                  if (!shouldRetry || attempt >= (retry.maxAttempts ?? 3)) throw lastError
                  const backoff = Math.min(
                    (retry.backoff ?? 1000) * Math.pow(retry.multiplier ?? 2, attempt - 1),
                    retry.maxBackoff ?? 30000
                  )
                  const jitter = backoff * (retry.jitter ?? 0.2) * Math.random()
                  await new Promise(r => setTimeout(r, backoff + jitter))
                }
              }
              throw lastError!
            }
            return fn(...args)
          }

          const result = await (timeout
            ? Promise.race([
                execute(),
                new Promise<never>((_, reject) => {
                  timeoutId = setTimeout(() => {
                    s.metrics.value = { ...s.metrics.peek(), timeoutCalls: s.metrics.peek().timeoutCalls + 1 }
                    reject(new Error(`Timeout after ${timeout.timeout}ms`))
                  }, timeout.timeout)
                })
              ])
            : execute())

          const responseTime = Date.now() - startTime
          s.timing.total += responseTime
          s.timing.count++
          s.timing.min = Math.min(s.timing.min, responseTime)
          s.timing.max = Math.max(s.timing.max, responseTime)

          const prev = s.metrics.peek()
          s.metrics.value = {
            ...prev,
            successfulCalls:     prev.successfulCalls + 1,
            totalCalls:          prev.totalCalls + 1,
            averageResponseTime: s.timing.total / s.timing.count,
            minResponseTime:     s.timing.min,
            maxResponseTime:     s.timing.max,
            failureRate:         (prev.failedCalls / (prev.totalCalls + 1)) * 100,
            throughput:          prev.totalCalls / ((Date.now() - s.startedAt) / 1000),
            concurrentCalls:     s.concurrentCalls.value,
            queueSize:           s.queueSize.value,
            availablePermits:    s.availablePermits.value,
            isHealthy:           s.isHealthy.value,
            lastHealthCheck:     Date.now(),
            retryAttempts:       s.retryAttempts.value,
            retrySuccesses:      s.retrySuccesses.value,
            state:               s.circuitState.value
          }

          s.window?.recordSuccess()
          if (s.circuitState.value === 'HALF_OPEN') s.halfOpenSuccessCount.value++
          checkCircuitBreaker()

          return result
        } catch (error) {
          const prev = s.metrics.peek()
          s.metrics.value = {
            ...prev,
            failedCalls:      prev.failedCalls + 1,
            totalCalls:       prev.totalCalls + 1,
            failureRate:      ((prev.failedCalls + 1) / (prev.totalCalls + 1)) * 100,
            concurrentCalls:  s.concurrentCalls.value,
            queueSize:        s.queueSize.value,
            availablePermits: s.availablePermits.value,
            isHealthy:        s.isHealthy.value,
            lastHealthCheck:  Date.now(),
            state:            s.circuitState.value
          }

          s.window?.recordFailure()
          checkCircuitBreaker()

          if (fallback) {
            const { fallback: fb, fallbackOn } = fallback
            if (!fallbackOn || fallbackOn(error as Error)) {
              if (typeof fb === 'function') return await (fb as Function)(error)
              return fb as T
            }
          }

          throw error
        } finally {
          if (bulkhead) { s.concurrentCalls.value--; processQueue() }
          if (timeoutId !== undefined) clearTimeout(timeoutId)
        }
      }

      const resilientFn = (...args: any[]): Promise<T> => executeWithResilience(args)

      const reset = () => {
        s.circuitState.value         = 'CLOSED'
        s.circuitOpenedAt.value      = null
        s.circuitHalfOpenAt.value    = null
        s.circuitClosedAt.value      = null
        s.halfOpenSuccessCount.value = 0
        s.retryAttempts.value        = 0
        s.retrySuccesses.value       = 0
        s.concurrentCalls.value      = 0
        s.queueSize.value            = 0
        s.queue                      = []
        s.availablePermits.value     = rateLimiter?.limit ?? 100
        s.isHealthy.value            = true
        s.healthFailures.value       = 0
        s.healthSuccesses.value      = 0
        s.timing                     = { total: 0, count: 0, min: Infinity, max: 0 }
        s.window?.reset(
          circuitBreaker?.slidingWindowSize ?? 10000,
          circuitBreaker?.slidingWindowBuckets ?? 10
        )
      }

      return [
        resilientFn,
        {
          getMetrics:  () => s.metrics.peek(),
          getState:    () => s.circuitState.peek(),
          isHealthy:   () => s.isHealthy.peek(),
          reset,
          forceOpen:   () => { s.circuitState.value = 'OPEN';   s.circuitOpenedAt.value = Date.now() },
          forceClose:  () => { s.circuitState.value = 'CLOSED'; s.circuitOpenedAt.value = null }
        }
      ]
    }
  )
}
