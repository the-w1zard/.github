import { createHook,  } from '#the-cloud'

 type MiddlewareContext<TCtx = Record<string, unknown>> = {
  ctx:  TCtx
  meta: { startedAt: number; name: string; attempt: number }
}

 type Next<TCtx> = (ctx?: Partial<TCtx>) => Promise<void>

 type Middleware<TCtx = Record<string, unknown>> = {
  name: string
  run:  (context: MiddlewareContext<TCtx>, next: Next<TCtx>) => Promise<void>
}

 type MiddlewareResult<TCtx> = {
  ctx:   TCtx
  ok:    boolean
  error: unknown | null
  chain: ChainTrace[]
}

 type ChainTrace = {
  name:       string
  status:     'ok' | 'error' | 'blocked'
  durationMs: number
  error?:     unknown
}

 type MiddlewareState<TCtx> = {
  result:    MiddlewareResult<TCtx> | null
  isRunning: boolean
}

 type MiddlewareActions<TCtx> = {
  run:   (initialCtx: TCtx, name?: string) => Promise<MiddlewareResult<TCtx>>
  reset: () => void
}

export function compose<TCtx>(
  middlewares: Middleware<TCtx>[]
): (initialCtx: TCtx, name?: string) => Promise<MiddlewareResult<TCtx>> {
  return async (initialCtx, name = 'anonymous') => {
    let ctx = { ...initialCtx }
    const traces: ChainTrace[] = []
    let error: unknown = null
    let ok = true

    const execute = async (index: number): Promise<void> => {
      if (index >= middlewares.length) return
      const mw    = middlewares[index]
      const start = Date.now()
      const next: Next<TCtx> = async (patch) => {
        if (patch) ctx = { ...ctx, ...patch }
        await execute(index + 1)
      }
      try {
        await mw.run({ ctx, meta: { startedAt: Date.now(), name, attempt: 1 } }, next)
        traces.push({ name: mw.name, status: 'ok', durationMs: Date.now() - start })
      } catch (e) {
        ok    = false
        error = e
        traces.push({ name: mw.name, status: 'error', durationMs: Date.now() - start, error: e })
        for (let i = index + 1; i < middlewares.length; i++) {
          traces.push({ name: middlewares[i].name, status: 'blocked', durationMs: 0 })
        }
        throw e
      }
    }

    try { await execute(0) } catch {}
    return { ctx, ok, error, chain: traces }
  }
}

interface MiddlewareHookState<TCtx> extends HookState {
  result:    MiddlewareResult<TCtx> | null
  isRunning: boolean
}

export function useMiddleware<TCtx = Record<string, unknown>>(
  middlewares:   Middleware<TCtx>[],
  __sauron_id__ = _sid()
): [MiddlewareState<TCtx>, MiddlewareActions<TCtx>] {
  return createHook(
    'useMiddleware',
    __sauron_id__,
    (): MiddlewareHookState<TCtx> => ({
      value:     undefined,
      result:    null,
      isRunning: false
    }),
    (s: HookState, key, notify) => {
      const state  = s as MiddlewareHookState<TCtx>
      const runner = compose(middlewares)

      const actions: MiddlewareActions<TCtx> = {
        async run(initialCtx, name) {
          state.isRunning = true
          state.result    = null
          notify(key)
          const result    = await runner(initialCtx, name)
          state.result    = result
          state.isRunning = false
          notify(key)
          return result
        },
        reset() {
          state.result    = null
          state.isRunning = false
          notify(key)
        }
      }

      return [{ result: state.result, isRunning: state.isRunning }, actions]
    }
  )
}

export function withAuth<TCtx extends { userId?: string }>(
  getUser: (ctx: TCtx) => Promise<string | null>
): Middleware<TCtx> {
  return {
    name: 'auth',
    async run({ ctx }, next) {
      const userId = await getUser(ctx)
      if (!userId) throw new Error('Unauthorized')
      await next({ userId } as Partial<TCtx>)
    }
  }
}

export function withLogging<TCtx>(
  logger: (entry: { name: string; ctx: TCtx; durationMs: number }) => void
): Middleware<TCtx> {
  return {
    name: 'logging',
    async run({ ctx, meta }, next) {
      const start = Date.now()
      await next()
      logger({ name: meta.name, ctx, durationMs: Date.now() - start })
    }
  }
}

export function withRateLimit<TCtx extends { userId?: string }>(
  limit:    number,
  windowMs: number
): Middleware<TCtx> {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return {
    name: 'rateLimit',
    async run({ ctx }, next) {
      const key   = ctx.userId ?? 'anonymous'
      const now   = Date.now()
      const entry = hits.get(key)
      if (!entry || now > entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs })
      } else {
        if (entry.count >= limit) throw new Error('Rate limit exceeded')
        entry.count++
      }
      await next()
    }
  }
}

export function withTimeout<TCtx>(ms: number): Middleware<TCtx> {
  return {
    name: 'timeout',
    async run(_, next) {
      await Promise.race([
        next(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`Timed out after ${ms}ms`)), ms))
      ])
    }
  }
}
