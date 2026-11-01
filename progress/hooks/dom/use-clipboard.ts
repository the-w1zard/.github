
import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

export function useClipboard(__sauron_id__ = _sid()) {
  return createHook(
    'useClipboard',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        text: '',
        copied: false,
        timeout: null as any
      },
      cleanup() {
        const v = (this as any).value
        if (v.timeout) clearTimeout(v.timeout)
      },
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const v = hook.value

      const copy = async (text: string) => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
          return false
        }

        try {
          await navigator.clipboard.writeText(text)

          v.text = text
          v.copied = true
          notifyHook(key)

          if (v.timeout) clearTimeout(v.timeout)

          v.timeout = setTimeout(() => {
            v.copied = false
            v.timeout = null
            notifyHook(key)
          }, 2000)

          return true
        } catch {
          return false
        }
      }

      const getText = () => v.text
      const isCopied = () => v.copied

      return [copy, v.copied, v.text, getText, isCopied]
    }
  )
}
