import { createHook } from '#the-cloud'

// --- Option Types ---

export type Some<T> = { readonly _tag: "Some"; readonly value: T }
export type None = { readonly _tag: "None" }
export type Option<T> = Some<T> | None

export const none: None = { _tag: "None" }
export const some = <T>(value: T): Some<T> => ({ _tag: "Some", value })

export const isSome = <T>(o: Option<T>): o is Some<T> => o._tag === "Some"
export const isNone = <T>(o: Option<T>): o is None => o._tag === "None"

export const fromNullable = <T>(v: T | null | undefined): Option<T> =>
  v == null ? none : some(v)

// --- Hook ---

export function useOption<T>(initial?: T | null | undefined) {
  return createHook(
    "useOption",
    _sid(),

    () => ({
      option: fromNullable(initial ?? null) as Option<T>,
      isLoading: false
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const actions = {
        setSome(value: T) {
          s.option = some(value)
          s.isLoading = false
          notify(key)
        },

        setNone() {
          s.option = none
          s.isLoading = false
          notify(key)
        },

        map<B>(fn: (value: T) => B): Option<B> {
          return isSome(s.option) ? some(fn(s.option.value)) : none
        },

        flatMap<B>(fn: (value: T) => Option<B>): Option<B> {
          return isSome(s.option) ? fn(s.option.value) : none
        },

        filter(predicate: (value: T) => boolean): Option<T> {
          return isSome(s.option) && predicate(s.option.value)
            ? s.option
            : none
        },

        fold<B>(onNone: () => B, onSome: (value: T) => B): B {
          return isSome(s.option)
            ? onSome(s.option.value)
            : onNone()
        },

        isSome: () => isSome(s.option),
        isNone: () => isNone(s.option),

        getOrElse(fallback: T): T {
          return isSome(s.option) ? s.option.value : fallback
        },

        get(): T | null {
          return isSome(s.option) ? s.option.value : null
        },

        async fromAsync(promise: Promise<T | null | undefined>) {
          s.isLoading = true
          notify(key)

          try {
            const value = await promise
            s.option = fromNullable(value) as Option<T>
          } catch {
            s.option = none
          } finally {
            s.isLoading = false
            notify(key)
          }
        },

        reset() {
          s.option = none
          s.isLoading = false
          notify(key)
        }
      }

      return [
        { option: s.option, isLoading: s.isLoading },
        actions
      ]
    }
  )
}
