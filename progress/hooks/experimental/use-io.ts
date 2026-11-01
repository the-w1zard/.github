import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// Minimal IO algebra — Sauron‑native rewrite
// No React, no useSignal, no hookSystem
// Deterministic async effect wrapper with:
//   • run()
//   • map()
//   • flatMap()
//   • catch()
//   • retry()
//   • timeout()
//   • cancel()
// ───────────────────────────────────────────────

 type IO<T, E = Error> = {
  run: () => Promise<T>
  map: <U>(fn: (value: T) => U) => IO<U, E>
  flatMap: <U>(fn: (value: T) => IO<U, E>) => IO<U, E>
  catch: <U>(fn: (error: E) => IO<U, E>) => IO<T | U, E>
  retry: (options: RetryOptions) => IO<T, E>
  timeout: (ms: number) => IO<T, E>
  cancel: () => void
}

 interface RetryOptions {
  attempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  predicate?: (error: Error) => boolean
}

export function useIO<T, E = Error>(
  effect: () => Promise<T>,
  __sauron_id__ = _sid()
): IO<T, E> {
  return createHook(
    'useIO',
    __sauron_id__,

    (): HookState => ({
      value: {
        effect,
        running: false,
        result: null as T | null,
        error: null as E | null,
        cancelToken: false
      }
    }),

    (hook, key) => {
      const s = hook.value

      const run = async (): Promise<T> => {
        if (s.cancelToken) throw new Error('Operation cancelled')

        s.running = true
        s.error = null
        notifyHook(key)

        try {
          const result = await s.effect()

          if (!s.cancelToken) {
            s.result = result
            s.running = false
            notifyHook(key)
            return result
          }

          throw new Error('Operation cancelled')
        } catch (err: any) {
          if (!s.cancelToken) {
            s.error = err
            s.running = false
            notifyHook(key)
          }
          throw err
        }
      }

      const map = <U>(fn: (value: T) => U): IO<U, E> => {
        return useIO(async () => {
          const v = await run()
          return fn(v)
        })
      }

      const flatMap = <U>(fn: (value: T) => IO<U, E>): IO<U, E> => {
        return useIO(async () => {
          const v = await run()
          return fn(v).run()
        })
      }

      const catch_ = <U>(fn: (error: E) => IO<U, E>): IO<T | U, E> => {
        return useIO(async () => {
          try {
            return await run()
          } catch (err: any) {
            return fn(err).run()
          }
        })
      }

      const retry = (opts: RetryOptions): IO<T, E> => {
        const attempts = opts.attempts ?? 3
        const delay = opts.delay ?? 1000
        const backoff = opts.backoff ?? 'exponential'

        return useIO(async () => {
          let last: any = null

          for (let i = 0; i < attempts; i++) {
            try {
              return await run()
            } catch (err: any) {
              last = err

              if (opts.predicate && !opts.predicate(err)) throw err

              if (i < attempts - 1) {
                const wait =
                  backoff === 'exponential'
                    ? delay * 2 ** i
                    : delay * (i + 1)

                await new Promise((r) => setTimeout(r, wait))
              }
            }
          }

          throw last
        })
      }

      const timeout = (ms: number): IO<T, E> => {
        return useIO(async () => {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), ms)
          )

          return Promise.race([run(), timeoutPromise])
        })
      }

      const cancel = () => {
        s.cancelToken = true
      }

      return {
        run,
        map,
        flatMap,
        catch: catch_,
        retry,
        timeout,
        cancel
      }
    }
  )
}
