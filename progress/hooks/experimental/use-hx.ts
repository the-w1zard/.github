import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useHX — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Pure attribute generator for HTMX‑style enhancement
// ───────────────────────────────────────────────

export interface HXOptions {
  trigger?: 'click' | 'change' | 'submit' | 'focus' | 'blur' | 'load' | 'revealed' | 'intersect'
  target?: string
  swap?: 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend' | 'none'
  indicator?: string
  headers?: Record<string, string>
  confirm?: string
  prompt?: string
  replaceUrl?: boolean
  pushUrl?: boolean
  select?: string
  selectOob?: string
  swapOob?: boolean
  sync?: string
  encoding?: 'multipart' | 'form' | 'json'
}

export function useHX(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  options: HXOptions = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useHX',
    __sauron_id__,

    (): HookState => ({
      value: {
        url,
        method,
        options,
        trigger: options.trigger || 'click',
        swap: options.swap || 'innerHTML'
      }
    }),

    (hook) => {
      const { url, method, options, trigger, swap } = hook.value

      const attrs: Record<string, string> = {
        'hx-url': url,
        'hx-method': method,
        'hx-trigger': trigger,
        'hx-swap': swap
      }

      if (options.target) attrs['hx-target'] = options.target
      if (options.indicator) attrs['hx-indicator'] = options.indicator
      if (options.confirm) attrs['hx-confirm'] = options.confirm
      if (options.replaceUrl) attrs['hx-replace-url'] = 'true'
      if (options.pushUrl) attrs['hx-push-url'] = 'true'
      if (options.select) attrs['hx-select'] = options.select
      if (options.selectOob) attrs['hx-select-oob'] = options.selectOob
      if (options.swapOob) attrs['hx-swap-oob'] = 'true'
      if (options.sync) attrs['hx-sync'] = options.sync

      if (options.headers) {
        attrs['hx-headers'] = JSON.stringify(options.headers)
      }

      if (options.encoding === 'multipart') {
        attrs['hx-encoding'] = 'multipart/form-data'
      } else if (options.encoding === 'json') {
        attrs['hx-encoding'] = 'application/json'
      }

      return attrs
    }
  )
}

// ───────────────────────────────────────────────
// HX component — Sauron‑native rewrite
// No React, no useEffect
// Pure attribute injection + event wiring
// ───────────────────────────────────────────────

export function HX(props: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  children: any
  as?: string
trigger?: HXOptions['trigger']
  target?: string
   swap?: HXOptions['swap']
  onLoad?: (data: any) => void
  onError?: (error: Error) => void
}) {
  const {
    url,
    method = 'GET',
    children,
    as = 'div',
    onLoad,
    onError,
    ...options
  } = props

  const attrs = useHX(url, method, options)

  if (typeof window !== 'undefined') {
    const loadHandler = (e: CustomEvent) => {
      if (e.detail?.target === url) onLoad?.(e.detail.data)
    }

    const errorHandler = (e: CustomEvent) => {
      if (e.detail?.target === url) onError?.(new Error(e.detail.error))
    }

    window.addEventListener('hx:load', loadHandler as EventListener)
    window.addEventListener('hx:error', errorHandler as EventListener)

    // No React cleanup — Sauron components unmount via hook cleanup
    ;(attrs as any).__cleanup = () => {
      window.removeEventListener('hx:load', loadHandler as EventListener)
      window.removeEventListener('hx:error', errorHandler as EventListener)
    }
  }

  return {
    type: as,
    props: {
      ...attrs,
      children
    }
  }
}

// ───────────────────────────────────────────────
// enhanceWithHX — Sauron‑native rewrite
// Pure attribute merge
// ───────────────────────────────────────────────

export function enhanceWithHX(
  element: any,
  url: string,
  method: string = 'GET',
  options: HXOptions = {}
) {
  const attrs = useHX(url, method as any, options)

  return {
    ...element,
    props: {
      ...element.props,
      ...attrs
    }
  }
}
