import {  createHook,  } from '#the-cloud'

// ───────────────────────────────────────────────
// useFavicon — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic DOM update, stable identity
// ───────────────────────────────────────────────

export function useFavicon(
  url: string | null | undefined,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useFavicon',
    __sauron_id__,

    (): HookState => ({
      value: { applied: false, lastUrl: null as string | null }
    }),

    (hook) => {
      if (typeof document === 'undefined') return
      if (!url) return

      if (hook.value.lastUrl === url) return
      hook.value.lastUrl = url

      let link =
        document.querySelector("link[rel*='icon']") as HTMLLinkElement | null

      if (!link) {
        link = document.createElement('link') as HTMLLinkElement
        document.head.appendChild(link)
      }

      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = url
    }
  )
}
