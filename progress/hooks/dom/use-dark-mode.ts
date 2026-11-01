import { _sid, createHook, HookState, notifyHook } from '#the-cloud'
import {useLocalStorage, useMediaQuery } from '#sauron'

export function useDarkMode(initialValue = false, __sauron_id__ = _sid()) {
  return createHook(
    'useDarkMode',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
      const [stored, setStored, getStored] = useLocalStorage(
        'dark-mode',
        initialValue ?? prefersDark
      )

      return {
        value: {
          isDark: stored,
          setStored,
          getStored
        }
      }
    },

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const { isDark, setStored, getStored } = hook.value

      if (typeof document !== 'undefined') {
        const root = document.documentElement
        if (isDark) root.classList.add('dark')
        else root.classList.remove('dark')
      }

      const toggle = () => {
        hook.value.isDark = !hook.value.isDark
        setStored(hook.value.isDark)
        notifyHook(key)
      }

      const enable = () => {
        hook.value.isDark = true
        setStored(true)
        notifyHook(key)
      }

      const disable = () => {
        hook.value.isDark = false
        setStored(false)
        notifyHook(key)
      }

      return [hook.value.isDark, toggle, enable, disable, getStored]
    }
  )
}
