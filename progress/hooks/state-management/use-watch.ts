export function useWatch() {
  return null
}

/**import { createHook } from "#the-cloud"
import { _sid } from "#sauron"
import { watch as coreWatch, type BuildConfig, type BuildResult } from "./core-bundler"

interface WatchOptions extends BuildConfig {
  debounce?: number
  ignore?: (string | RegExp)[]
  onChange?: (changed: string[]) => void
  onBuild?: (result: BuildResult) => void
  onError?: (error: Error) => void
}

export function useWatch(options: WatchOptions = {}) {
  return createHook(
    "useWatch",
    _sid(),

    () => ({
      isWatching: false,
      lastResult: null as BuildResult | null,
      changed: [] as string[],
      watcher: null as { close: () => void } | null,
      deps: undefined
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const start = () => {
        if (s.isWatching) return

        s.isWatching = true
        notify(key)

        const debounceMs = options.debounce ?? 100
        let timeout: any = null
        let changedFiles: string[] = []

        s.watcher = coreWatch(options, (result) => {
          if (timeout) clearTimeout(timeout)

          timeout = setTimeout(() => {
            s.lastResult = result

            if (changedFiles.length > 0) {
              s.changed = changedFiles
              options.onChange?.(changedFiles)
              changedFiles = []
            }

            if (result.errors.length === 0) {
              options.onBuild?.(result)
            } else {
              options.onError?.(result.errors[0])
            }

            notify(key)
          }, debounceMs)
        })
      }

      const stop = () => {
        if (s.watcher) {
          s.watcher.close()
          s.watcher = null
        }
        s.isWatching = false
        notify(key)
      }

      const restart = () => {
        stop()
        start()
      }

      if (!hookState.cleanup) {
        hookState.cleanup = () => stop()
      }

      return {
        start,
        stop,
        restart,
        isWatching: s.isWatching,
        lastResult: s.lastResult,
        changed: s.changed
      }
    }
  )
}


export function useWatch1(
  source: any,
  callback: (newVal: any, oldVal: any) => void,
  options: any = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    "useWatch1",
    __sauron_id__,

    () => ({
      value: {
        oldValue: typeof source === "function" ? source() : source,
        callback,
        options
      },
      deps: undefined
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const newValue = typeof source === "function" ? source() : source
      const deps = [newValue]

      const changed =
        !hookState.deps ||
        hookState.deps.length !== deps.length ||
        hookState.deps.some((d, i) => d !== deps[i])

      if (changed) {
        hookState.deps = deps

        if (newValue !== s.oldValue) {
          s.callback(newValue, s.oldValue)
          s.oldValue = newValue
          notify(key)
        }
      }

      const getValue = () => s.oldValue

      return [s.oldValue, getValue] as const
    }
  )
}
 */
