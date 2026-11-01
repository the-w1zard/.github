import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useEventSource — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic cleanup, stable reconnect, streaming updates
// ───────────────────────────────────────────────

export function useEventSource(
  url: string,
  options: {
    maxMessages?: number
    onError?: (err: any) => void
  } = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useEventSource',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const state = {
        eventSource: null as EventSource | null,
        connected: false,
        lastEvent: null as MessageEvent | null,
        messages: [] as any[],
        url,
        options,
        cleanup: null as null | (() => void),
        started: false
      }

      const connect = () => {
        if (typeof window === 'undefined') return

        if (state.eventSource) {
          state.eventSource.close()
        }

        const es = new EventSource(state.url, state.options as any)
        state.eventSource = es
        state.connected = true
        notifyHook(__sauron_id__)

        es.onmessage = (event) => {
          state.lastEvent = event
          state.messages.push(event.data)

          if (state.options.maxMessages && state.messages.length > state.options.maxMessages) {
            state.messages.shift()
          }

          notifyHook(__sauron_id__)
        }

        es.onerror = (err) => {
          state.connected = false
          if (state.options.onError) state.options.onError(err)
          notifyHook(__sauron_id__)
        }
      }

      const disconnect = () => {
        if (state.eventSource) {
          state.eventSource.close()
          state.eventSource = null
          state.connected = false
          notifyHook(__sauron_id__)
        }
      }

      // auto‑connect once
      if (!state.started) {
        state.started = true
        connect()
        state.cleanup = disconnect
      }

      return { value: state }
    },

    // ───────────────────────────────────────── updater
    (hook) => {
      const s = hook.value

      const connect = () => {
        if (typeof window === 'undefined') return
        if (s.eventSource) s.eventSource.close()
        const es = new EventSource(s.url, s.options as any)
        s.eventSource = es
        s.connected = true
        notifyHook(__sauron_id__)

        es.onmessage = (event) => {
          s.lastEvent = event
          s.messages.push(event.data)
          if (s.options.maxMessages && s.messages.length > s.options.maxMessages) {
            s.messages.shift()
          }
          notifyHook(__sauron_id__)
        }

        es.onerror = (err) => {
          s.connected = false
          if (s.options.onError) s.options.onError(err)
          notifyHook(__sauron_id__)
        }
      }

      const disconnect = () => {
        if (s.eventSource) {
          s.eventSource.close()
          s.eventSource = null
          s.connected = false
          notifyHook(__sauron_id__)
        }
      }

      const getConnected = () => s.connected
      const getLastEvent = () => s.lastEvent
      const getMessages = () => s.messages

      return [
        {
          connected: s.connected,
          lastEvent: s.lastEvent,
          messages: s.messages
        },
        connect,
        disconnect,
        getConnected,
        getLastEvent,
        getMessages
      ]
    }
  )
}
