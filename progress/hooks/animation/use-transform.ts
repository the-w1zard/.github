import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

type TransformFn<TIn, TOut> = (input: TIn) => TOut | Promise<TOut>

interface TransformStep<TIn, TOut> {
  name: string
  fn: TransformFn<TIn, TOut>
}

interface TransformResult<T> {
  data: T | null
  error: string | null
  steps: { name: string; duration: number; input: any; output: any }[]
  pending: boolean
}

class Pipeline<TStart> {
  steps: TransformStep<any, any>[] = []

  pipe<TOut>(name: string, fn: TransformFn<any, TOut>): Pipeline<TOut> {
    this.steps.push({ name, fn })
    return this as unknown as Pipeline<TOut>
  }

  async run(input: TStart): Promise<{ output: any; trace: TransformResult<any>["steps"] }> {
    let current: any = input
    const trace: TransformResult<any>["steps"] = []

    for (const step of this.steps) {
      const start = Date.now()
      const prev = current
      current = await Promise.resolve(step.fn(current))
      trace.push({
        name: step.name,
        duration: Date.now() - start,
        input: prev,
        output: current
      })
    }

    return { output: current, trace }
  }

  clone(): Pipeline<TStart> {
    const p = new Pipeline<TStart>()
    p.steps = [...this.steps]
    return p
  }
}

export function useTransform<TIn, TOut = TIn>(
  input: TIn,
  options: { lazy?: boolean } = {}, 
   __sauron_id__ = _sid()
) {
  const { lazy = false } = options

  return createHook(
    "useTransform",
    __sauron_id__,

    () => ({
      value: {
        input,
        pipeline: new Pipeline<TIn>(),
        result: {
          data: null,
          error: null,
          steps: [],
          pending: false
        } as TransformResult<TOut>
      }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      if (JSON.stringify(input) !== JSON.stringify(s.input)) {
        s.input = input
      }

      const run = async () => {
        s.result = { ...s.result, pending: true, error: null }
        notify(key)

        try {
          const { output, trace } = await s.pipeline.run(s.input)
          s.result = {
            data: output as TOut,
            error: null,
            steps: trace,
            pending: false
          }
        } catch (e: any) {
          s.result = {
            ...s.result,
            error: e?.message ?? "Transform failed",
            pending: false
          }
        }

        notify(key)
      }

      const pipe = <TNext>(name: string, fn: TransformFn<any, TNext>) => {
        s.pipeline = s.pipeline.clone()
        s.pipeline.pipe(name, fn)
        if (!lazy) run()
        return api as any
      }

      const reset = () => {
        s.pipeline = new Pipeline<TIn>()
        s.result = { data: null, error: null, steps: [], pending: false }
        notify(key)
      }

      const api = {
        pipe,
        run,
        reset,
        result: s.result
      }

      return api
    }
  )
}

export const transforms = {
  pick:
    <T extends object>(keys: (keyof T)[]) =>
    (obj: T) =>
      keys.reduce(
        (acc, k) => ({ ...acc, [k]: obj[k] }),
        {} as Pick<T, (typeof keys)[number]>
      ),

  omit:
    <T extends object>(keys: (keyof T)[]) =>
    (obj: T) => {
      const result = { ...obj }
      keys.forEach((k) => delete result[k])
      return result as Omit<T, (typeof keys)[number]>
    },

  map:
    <T, R>(fn: (item: T) => R) =>
    (arr: T[]) =>
      arr.map(fn),

  filter:
    <T>(fn: (item: T) => boolean) =>
    (arr: T[]) =>
      arr.filter(fn),

  flatten: <T>(arr: T[][]) => arr.flat(),

rename:
  <T extends object>(map: Partial<Record<keyof T, string>>) =>
  (obj: T) => {
    const result: Record<string, any> = { ...obj }

    for (const key in map) {
      const to = map[key]
      if (to && key in result) {
        result[to] = result[key]
        delete result[key]
      }
    }

    return result
  },


  coerce:
    (schema: Record<string, "string" | "number" | "boolean">) =>
    (obj: Record<string, any>) => {
      const result = { ...obj }
      Object.entries(schema).forEach(([key, type]) => {
        if (key in result) {
          if (type === "string") result[key] = String(result[key])
          else if (type === "number") result[key] = Number(result[key])
          else if (type === "boolean") result[key] = Boolean(result[key])
        }
      })
      return result
    },

  defaults:
    <T extends object>(defaults: Partial<T>) =>
    (obj: T) =>
      ({ ...defaults, ...obj }),

  trim: (obj: Record<string, any>) => {
    const result = { ...obj }
    Object.keys(result).forEach((k) => {
      if (typeof result[k] === "string") result[k] = result[k].trim()
    })
    return result
  },

  timestamp:
    (field = "updatedAt") =>
    (obj: Record<string, any>) =>
      ({ ...obj, [field]: Date.now() })
}
