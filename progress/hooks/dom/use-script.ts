import { createHook } from '#the-cloud' 

export function useScript(src: string, options: any = {}, __sauron_id__ = _sid()) {
  return createHook(
    "useScript",
    __sauron_id__,

    () => ({
      value: {
        loaded: false,
        error: null as any,
        script: null as HTMLScriptElement | null,
        initialized: false
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const loadScript = () => {
        if (!src || typeof document === "undefined") return

        const script = document.createElement("script")
        script.src = src
        script.async = options.async ?? true
        script.defer = options.defer ?? false

        if (options.id) script.id = options.id
        if (options.crossorigin) script.crossOrigin = options.crossorigin

        script.onload = () => {
          s.loaded = true
          s.error = null
          notify(key)
          if (options.onLoad) options.onLoad()
        }

        script.onerror = (err) => {
          s.error = err
          s.loaded = false
          notify(key)
          if (options.onError) options.onError(err)
        }

        document.body.appendChild(script)
        s.script = script
      }

      if (!s.initialized) {
        s.initialized = true
        loadScript()

        state.cleanup = () => {
          if (options.removeOnUnmount && s.script?.parentNode) {
            document.body.removeChild(s.script)
          }
        }
      }

      const reload = () => {
        if (typeof document === "undefined") return

        if (s.script?.parentNode) {
          document.body.removeChild(s.script)
        }

        s.loaded = false
        s.error = null
        s.script = null

        notify(key)
        loadScript()
      }

      const getLoaded = () => s.loaded
      const getError = () => s.error

      return [s.loaded, s.error, reload, getLoaded, getError] as const
    }
  )
}
