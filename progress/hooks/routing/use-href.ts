import { useLocation } from '#sauron'

// ───────────────────────────────────────────────
// useHref — Sauron‑native (unchanged logic)
// Pure function, no hookSystem, no React
// ───────────────────────────────────────────────

export interface HrefOptions {
  relative?: 'route' | 'path'
}

export function useHref(
  to: string,
  options?: HrefOptions,
  __sauron_id__ = _sid()
): string {
  const loc = useLocation()

  if (
    to.startsWith('/') ||
    to.startsWith('http://') ||
    to.startsWith('https://')
  ) {
    return to
  }

  const base = loc.pathname.endsWith('/')
    ? loc.pathname
    : loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1)

  return new URL(to, `http://x${base}`).pathname
}
