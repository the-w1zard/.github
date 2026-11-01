import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface PipeOptions {
  handleError?: boolean
  log?: boolean
  measure?: boolean
  parallel?: boolean
}

export function usePipe(options: PipeOptions = {}) {
  const {
    handleError = false,
    log = false,
    measure = false,
    parallel = false
  } = options

  return createHook(
    "usePipe",
    _sid(),

    () => ({
      options: { handleError, log, measure, parallel }
    }),

    () => {
      //
      // Basic pipe (left → right)
      //
      const pipe = <T>(...fns: Array<(arg: any) => any>) => {
        return (initial: T): any => {
          return fns.reduce((value, fn, index) => {
            if (measure) {
              const start = performance.now()
              const result = fn(value)
              const duration = performance.now() - start
              console.log(`Step ${index + 1}: ${duration}ms`)
              return result
            }

            if (log) {
              console.log(`Step ${index + 1}:`, value)
            }

            if (handleError) {
              try {
                return fn(value)
              } catch (err) {
                console.error(`Error in step ${index + 1}:`, err)
                return value
              }
            }

            return fn(value)
          }, initial)
        }
      }

      //
      // Compose (right → left)
      //
      const compose = <T>(...fns: Array<(arg: any) => any>) => {
        return (initial: T): any =>
          fns.reduceRight((value, fn) => fn(value), initial)
      }

      //
      // Async pipe
      //
      const pipeAsync = <T>(...fns: Array<(arg: any) => Promise<any> | any>) => {
        return async (initial: T): Promise<any> => {
          let result = initial

          for (let i = 0; i < fns.length; i++) {
            try {
              result = await fns[i](result)

              if (log) {
                console.log(`Async step ${i + 1}:`, result)
              }
            } catch (err) {
              if (handleError) {
                console.error(`Error in async step ${i + 1}:`, err)
                return result
              }
              throw err
            }
          }

          return result
        }
      }

      //
      // Parallel execution
      //
      const runParallel = async <T, R>(
        ...fns: Array<(arg: T) => Promise<R> | R>
      ): Promise<R[]> => {
        return Promise.all(fns.map(fn => fn(undefined as any)))
      }

      //
      // Conditional pipe
      //
      const when = (condition: boolean | ((arg: any) => boolean)) => ({
        then: (...fns: Array<(arg: any) => any>) => ({
          else: (...elseFns: Array<(arg: any) => any>) => {
            return (arg: any) => {
              const shouldRun =
                typeof condition === "function" ? condition(arg) : condition

              const selected = shouldRun ? fns : elseFns
              return selected.reduce((value, fn) => fn(value), arg)
            }
          }
        })
      })

      //
      // Retry wrapper
      //
      const retry = (times: number) => ({
        execute: async (fn: () => Promise<any>): Promise<any> => {
          let lastError
          for (let i = 0; i < times; i++) {
            try {
              return await fn()
            } catch (err) {
              lastError = err
              if (log) console.log(`Retry ${i + 1}/${times}`)
            }
          }
          throw lastError
        }
      })

      //
      // Timeout wrapper
      //
      const timeout = (ms: number) => ({
        execute: async <T>(fn: () => Promise<T>): Promise<T> => {
          return Promise.race([
            fn(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), ms)
            )
          ]) as Promise<T>
        }
      })

      //
      // Tap (side effects)
      //
      const tap = (fn: (arg: any) => void) => {
        return (arg: any) => {
          fn(arg)
          return arg
        }
      }

      //
      // Filter
      //
      const filter = (predicate: (arg: any) => boolean) => {
        return (arg: any) => (predicate(arg) ? arg : undefined)
      }

      //
      // Map array
      //
      const map = <T, R>(fn: (arg: T) => R) => {
        return (arr: T[]) => arr.map(fn)
      }

      //
      // Reduce array
      //
      const reduce = <T, R>(fn: (acc: R, item: T) => R, initial: R) => {
        return (arr: T[]) => arr.reduce(fn, initial)
      }

      //
      // Pipeline object
      //
      return {
        pipe,
        compose,
        async: pipeAsync,
        parallel: runParallel,
        when,
        retry,
        timeout,
        tap,
        filter,
        map,
        reduce
      }
    }
  )
}
