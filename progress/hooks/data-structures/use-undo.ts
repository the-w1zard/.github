import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface UndoState<T> {
  present: T
  past: T[]
  future: T[]
  maxHistory: number
}

export function useUndo<T>(initialValue: T, maxHistory = 100,  __sauron_id__ = _sid()) {
  return createHook(
    "useUndo",
    __sauron_id__,

    () => ({
      value: {
        present: initialValue,
        past: [],
        future: [],
        maxHistory
      } as UndoState<T>
    }),

    (hookState, key, notify) => {
      const s = hookState.value as UndoState<T>

      const set = (newValue: T) => {
        s.past.push(s.present)
        if (s.past.length > s.maxHistory) s.past.shift()

        s.present = newValue
        s.future = []

        notify(key)
      }

      const undo = () => {
        if (s.past.length === 0) return

        s.future.unshift(s.present)
        s.present = s.past.pop() as T

        notify(key)
      }

      const redo = () => {
        if (s.future.length === 0) return

        s.past.push(s.present)
        s.present = s.future.shift() as T

        notify(key)
      }

      const getValue = () => s.present
      const canUndo = () => s.past.length > 0
      const canRedo = () => s.future.length > 0

      return [
        s.present,
        set,
        undo,
        redo,
        getValue,
        canUndo,
        canRedo
      ] as const
    }
  )
}
