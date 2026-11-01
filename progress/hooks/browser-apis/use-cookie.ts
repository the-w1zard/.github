import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

export function useCookie(key: string, initialValue: any, __sauron_id__ = _sid()) {
  return createHook(
    'useCookie',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const getCookie = () => {
        if (typeof document === 'undefined') return undefined

        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [k, v] = cookie.trim().split('=')
          acc[k] = decodeURIComponent(v)
          return acc
        }, {} as Record<string, string>)

        return cookies[key]
      }

      return {
        value: getCookie() ?? initialValue
      }
    },

    // ───────────────────────────────────────── updater
    (hook, hookKey) => {
      const getValue = () => hook.value

      const updateCookie = (newValue: any, options: any = {}) => {
        if (typeof document === 'undefined') return

        hook.value = newValue
        notifyHook(hookKey)

        let cookie = `${key}=${encodeURIComponent(newValue)}`

        if (options.maxAge) cookie += `; max-age=${options.maxAge}`
        if (options.expires) cookie += `; expires=${options.expires.toUTCString()}`
        if (options.path) cookie += `; path=${options.path}`
        if (options.domain) cookie += `; domain=${options.domain}`
        if (options.secure) cookie += `; secure`
        if (options.sameSite) cookie += `; samesite=${options.sameSite}`

        document.cookie = cookie
      }

      const deleteCookie = () => {
        if (typeof document === 'undefined') return

        document.cookie = `${key}=; max-age=0`
        hook.value = undefined
        notifyHook(hookKey)
      }

      return [hook.value, updateCookie, deleteCookie, getValue]
    }
  )
}
