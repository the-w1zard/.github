import { _sid, createHook, HookState } from '#the-cloud'
import { useEffectEvent } from '#sauron' // your Sauron‑native stable-callback hook

// ───────────────────────────────────────────────
// useEscapeKeydown — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic cleanup, stable callback identity
// ───────────────────────────────────────────────

export function useEscapeKeydown(
  onEscapeKeyDownProp?: (event: KeyboardEvent) => void,
  ownerDocument: Document | null = typeof document !== 'undefined' ? document : null,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useEscapeKeydown',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        attached: false,
        cleanup: null as null | (() => void),
        handler: null as null | ((e: KeyboardEvent) => void),
        onEscape: onEscapeKeyDownProp
      }
    }),

    // ───────────────────────────────────────── updater
    (hook) => {
      const state = hook.value

      // Always update latest callback
      const stable = useEffectEvent(state.onEscape)

      if (!state.attached && ownerDocument) {
        state.attached = true

        const handler = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            stable(event)
          }
        }

        ownerDocument.addEventListener('keydown', handler, { capture: true })

        state.handler = handler
        state.cleanup = () => {
          ownerDocument.removeEventListener('keydown', handler, { capture: true })
        }
      }

      return undefined
    }
  )
}

// ───────────────────────────────────────────────
// useEscapeKeydownDefault — Sauron‑native
// ───────────────────────────────────────────────

export function useEscapeKeydownDefault(
  onEscapeKeyDownProp?: (event: KeyboardEvent) => void,
  __sauron_id__ = _sid()
) {
  const ownerDocument = typeof document !== 'undefined' ? document : null
  return useEscapeKeydown(onEscapeKeyDownProp, ownerDocument, __sauron_id__)
}

// ───────────────────────────────────────────────
// useEscapeKeydownWithElement — Sauron‑native
// ───────────────────────────────────────────────

export function useEscapeKeydownWithElement(
  onEscapeKeyDownProp?: (event: KeyboardEvent) => void,
  element?: HTMLElement | null,
  __sauron_id__ = _sid()
) {
  const ownerDocument =
    element?.ownerDocument ?? (typeof document !== 'undefined' ? document : null)

  return useEscapeKeydown(onEscapeKeyDownProp, ownerDocument, __sauron_id__)
}

// ───────────────────────────────────────────────
// useEscapeKeydownWithPriority — Sauron‑native
// Deterministic priority queue stored on ownerDocument
// ───────────────────────────────────────────────

export function useEscapeKeydownWithPriority(
  onEscapeKeyDownProp?: (event: KeyboardEvent) => void,
  priority = 0,
  ownerDocument: Document | null = typeof document !== 'undefined' ? document : null,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useEscapeKeydownWithPriority',
    __sauron_id__,

    (): HookState => ({
      value: {
        attached: false,
        cleanup: null as null | (() => void),
        onEscape: onEscapeKeyDownProp
      }
    }),

    (hook) => {
      const state = hook.value
      const stable = useEffectEvent(state.onEscape)

      if (!ownerDocument) return

      if (!state.attached) {
        state.attached = true

        const docAny = ownerDocument as any
        if (!docAny.__escapeHandlers) docAny.__escapeHandlers = []

        const handlerEntry = { priority, fn: stable }
        docAny.__escapeHandlers.push(handlerEntry)
        docAny.__escapeHandlers.sort((a: any, b: any) => b.priority - a.priority)

        const keyHandler = (event: KeyboardEvent) => {
          if (event.key !== 'Escape') return
          const list = docAny.__escapeHandlers || []
          for (const h of list) {
            if (event.defaultPrevented) break
            h.fn(event)
          }
        }

        ownerDocument.addEventListener('keydown', keyHandler, { capture: true })

        state.cleanup = () => {
          docAny.__escapeHandlers = (docAny.__escapeHandlers || []).filter(
            (h: any) => h.fn !== stable
          )
          ownerDocument.removeEventListener('keydown', keyHandler, { capture: true })
        }
      }

      return undefined
    }
  )
}

// ───────────────────────────────────────────────
// useEscapeKeydownConditional — Sauron‑native
// ───────────────────────────────────────────────

export function useEscapeKeydownConditional(
  onEscapeKeyDownProp?: (event: KeyboardEvent) => void,
  enabled = true,
  ownerDocument: Document | null = typeof document !== 'undefined' ? document : null,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useEscapeKeydownConditional',
    __sauron_id__,

    (): HookState => ({
      value: {
        attached: false,
        cleanup: null as null | (() => void),
        onEscape: onEscapeKeyDownProp
      }
    }),

    (hook) => {
      const state = hook.value
      const stable = useEffectEvent(state.onEscape)

      if (!ownerDocument || !enabled) {
        if (state.cleanup) {
          state.cleanup()
          state.cleanup = null
          state.attached = false
        }
        return
      }

      if (!state.attached) {
        state.attached = true

        const handler = (event: KeyboardEvent) => {
          if (event.key === 'Escape') stable(event)
        }

        ownerDocument.addEventListener('keydown', handler, { capture: true })

        state.cleanup = () => {
          ownerDocument.removeEventListener('keydown', handler, { capture: true })
        }
      }

      return undefined
    }
  )
}

export default useEscapeKeydown
