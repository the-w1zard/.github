import {  createHook,  notifyHook } from '#the-cloud'

export const IntentType = {
  SELECT: 'select',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  NAVIGATE: 'navigate',
  CONTEXT: 'context',
  HELP: 'help'
}

// ───────────────────────────────────────────────
// useIntent — Sauron‑native rewrite
// No React, no useState, no useEffect, no hookSystem
// Deterministic event→intent mapping with stable ref setter
// ───────────────────────────────────────────────

export function useIntent(
  target: HTMLElement | null,
  options: { preventDefault?: boolean; stopPropagation?: boolean } = {},
  __sauron_id__ = _sid()
) {
  const { preventDefault = true, stopPropagation = false } = options

  return createHook(
    'useIntent',
    __sauron_id__,

    (): HookState => ({
      value: {
        ref: target || null,
        lastIntent: null as string | null,
        lastInput: null as any,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hook, key) => {
      const s = hook.value

      const setRef = (el: HTMLElement | null) => {
        s.ref = el
        notifyHook(key)
      }

      const determineIntent = (e: any): string | null => {
        if (e.type === 'keydown') {
          switch (e.key) {
            case 'Enter':
            case ' ':
              return IntentType.SELECT
            case 'Escape':
              return IntentType.CANCEL
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Tab':
              return IntentType.NAVIGATE
            case 'F1':
            case 'Help':
              return IntentType.HELP
            default:
              return null
          }
        }

        if (e.type === 'click') return IntentType.SELECT
        if (e.type === 'dblclick') return IntentType.SELECT
        if (e.type === 'contextmenu') return IntentType.CONTEXT
        if (e.type === 'touchstart') return IntentType.SELECT

        return null
      }

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        const handler = (e: any) => {
          const intent = determineIntent(e)
          if (!intent) return

          s.lastIntent = intent
          s.lastInput = {
            type: e.type,
            key: e.key,
            button: e.button,
            touches: e.touches?.length,
            timestamp: Date.now()
          }

          if (preventDefault) e.preventDefault()
          if (stopPropagation) e.stopPropagation()

          notifyHook(key)
        }

        const events = ['keydown', 'click', 'dblclick', 'contextmenu', 'touchstart']

        if (s.ref) {
          events.forEach((ev) => s.ref!.addEventListener(ev, handler))
        }

        s.cleanup = () => {
          if (s.ref) {
            events.forEach((ev) => s.ref!.removeEventListener(ev, handler))
          }
        }
      }

      const getIntent = () => s.lastIntent

      return [
        setRef,
        {
          lastIntent: s.lastIntent,
          lastInput: s.lastInput
        },
        getIntent
      ]
    }
  )
}
