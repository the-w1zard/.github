import {  createHook, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// Either helpers (unchanged)
// ───────────────────────────────────────────────

export type Left<L> = { readonly _tag: 'Left'; readonly left: L }
export type Right<R> = { readonly _tag: 'Right'; readonly right: R }
export type Either<L, R> = Left<L> | Right<R>

export const left = <L>(value: L): Left<L> => ({ _tag: 'Left', left: value })
export const right = <R>(value: R): Right<R> => ({ _tag: 'Right', right: value })

export const isLeft = <L, R>(e: Either<L, R>): e is Left<L> => e._tag === 'Left'
export const isRight = <L, R>(e: Either<L, R>): e is Right<R> => e._tag === 'Right'

export const tryCatch = <L, R>(fn: () => R, onError: (e: unknown) => L): Either<L, R> => {
  try {
    return right(fn())
  } catch (e) {
    return left(onError(e))
  }
}

export const tryCatchAsync = async <L, R>(
  fn: () => Promise<R>,
  onError: (e: unknown) => L
): Promise<Either<L, R>> => {
  try {
    return right(await fn())
  } catch (e) {
    return left(onError(e))
  }
}

export const sequence = <L, R>(eithers: Either<L, R>[]): Either<L, R[]> => {
  const results: R[] = []
  for (const e of eithers) {
    if (isLeft(e)) return e
    results.push(e.right)
  }
  return right(results)
}

// ───────────────────────────────────────────────
// useEither — Sauron‑native rewrite
// No hookSystem, no scheduleRender, no React
// Pure createHook + notifyHook
// ───────────────────────────────────────────────

export function useEither<L, R>(
  initial?: Either<L, R>,
  __sauron_id__ = _sid()
): [
  { either: Either<L, R> | null; isLoading: boolean },
  {
    setRight: (value: R) => void
    setLeft: (value: L) => void
    map: <R2>(fn: (r: R) => R2) => Either<L, R2> | null
    mapLeft: <L2>(fn: (l: L) => L2) => Either<L2, R> | null
    fold: <T>(onLeft: (l: L) => T, onRight: (r: R) => T) => T | null
    isLeft: () => boolean
    isRight: () => boolean
    getRight: () => R | null
    getLeft: () => L | null
    getOrElse: (fallback: R) => R
    fromAsync: (promise: Promise<R>) => Promise<void>
    reset: () => void
  }
] {
  return createHook(
    'useEither',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        either: initial ?? null,
        isLoading: false
      }
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const state = hook.value

      const notify = () => notifyHook(key)

      const actions = {
        setRight(value: R) {
          state.either = right(value)
          state.isLoading = false
          notify()
        },

        setLeft(value: L) {
          state.either = left(value)
          state.isLoading = false
          notify()
        },

        map<R2>(fn: (r: R) => R2): Either<L, R2> | null {
          if (!state.either) return null
          if (isLeft(state.either)) return state.either
          return right(fn(state.either.right))
        },

        mapLeft<L2>(fn: (l: L) => L2): Either<L2, R> | null {
          if (!state.either) return null
          if (isRight(state.either)) return state.either
          return left(fn(state.either.left))
        },

        fold<T>(onLeft: (l: L) => T, onRight: (r: R) => T): T | null {
          if (!state.either) return null
          return isLeft(state.either)
            ? onLeft(state.either.left)
            : onRight(state.either.right)
        },

        isLeft: () => state.either !== null && isLeft(state.either),
        isRight: () => state.either !== null && isRight(state.either),

        getRight: () =>
          state.either && isRight(state.either) ? state.either.right : null,

        getLeft: () =>
          state.either && isLeft(state.either) ? state.either.left : null,

        getOrElse: (fallback: R) =>
          state.either && isRight(state.either) ? state.either.right : fallback,

        async fromAsync(promise: Promise<R>) {
          state.isLoading = true
          notify()

          try {
            const value = await promise
            state.either = right(value)
          } catch (e) {
            state.either = left(e as L)
          } finally {
            state.isLoading = false
            notify()
          }
        },

        reset() {
          state.either = null
          state.isLoading = false
          notify()
        }
      }

      return [{ either: state.either, isLoading: state.isLoading }, actions]
    }
  )
}
