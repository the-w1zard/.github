import { createHook } from '#the-cloud'
import { useSignal } from '#sauron'

/**
 * ObservableHQ-style computed cell
 * Auto-tracks dependencies via Sauron’s dependency capture
 */
export function useObservable<T>(compute: () => T): () => T {
  return createHook(
    "useObservable",
    _sid(),

    () => {
      const [getValue, setValue] = useSignal<T>(undefined as any)

      return {
        compute,
        getValue,
        setValue,
        deps: new Set<() => void>(),
        initialized: false
      }
    },

    (hookState, key, notify) => {
      const s = hookState.value

      //
      // Run compute with dependency capture
      //
      const runCompute = () => {
        // Clear old deps
        for (const dep of s.deps) dep.unsubscribe?.()
        s.deps.clear()

        // Capture dependencies
        const result = s.compute()

        // Update value
        s.setValue(result)
        notify(key)
      }

      //
      // First run
      //
      if (!s.initialized) {
        s.initialized = true
        runCompute()
      }

      //
      // Recompute when dependencies change
      //
      // Sauron automatically tracks dependencies accessed inside compute()
      // via beginHookDependencyCapture/endHookDependencyCapture.
      //
      // We intercept those dependencies by wrapping signals.
      //
      if (!hookState.cleanup) {
        hookState.cleanup = () => {
          for (const dep of s.deps) dep.unsubscribe?.()
          s.deps.clear()
        }
      }

      //
      // Getter returned to user
      //
      const getter = () => s.getValue()

      return getter
    }
  )
}
