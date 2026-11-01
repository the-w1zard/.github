import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface WebSocketOptions {
  maxReconnect?: number
  reconnect?: boolean
  reconnectDelay?: number
  maxMessages?: number
  parse?: (data: any) => any
  stringify?: boolean
  onOpen?: () => void
  onMessage?: (data: any) => void
  onClose?: () => void
  onError?: (err: any) => void
}

interface WebSocketInternalState {
  ws: WebSocket | null
  connected: boolean
  messages: any[]
  lastMessage: any
  reconnectAttempts: number
  maxReconnect: number
  reconnectTimeoutId: any
  deps?: any[]
}

export function useWebSocket(url: string, options: WebSocketOptions = {},  __sauron_id__ = _sid()) {
  return createHook(
    "useWebSocket",
     __sauron_id__,

    () => ({
      value: {
        ws: null,
        connected: false,
        messages: [],
        lastMessage: null,
        reconnectAttempts: 0,
        maxReconnect: options.maxReconnect ?? 5,
        reconnectTimeoutId: null,
        deps: undefined
      } as WebSocketInternalState
    }),

    (hookState, key, notify) => {
      const s = hookState.value as WebSocketInternalState

      const connect = () => {
        if (typeof window === "undefined") return

        if (s.ws) {
          s.ws.onopen = null
          s.ws.onmessage = null
          s.ws.onclose = null
          s.ws.onerror = null
          s.ws.close()
        }

        const ws = new WebSocket(url)
        s.ws = ws

        ws.onopen = () => {
          s.connected = true
          s.reconnectAttempts = 0
          options.onOpen?.()
          notify(key)
        }

        ws.onmessage = (event) => {
          const data = options.parse ? options.parse(event.data) : event.data
          s.lastMessage = data
          s.messages.push(data)

          if (options.maxMessages && s.messages.length > options.maxMessages) {
            s.messages.shift()
          }

          options.onMessage?.(data)
          notify(key)
        }

        ws.onclose = () => {
          s.connected = false

          if (options.reconnect && s.reconnectAttempts < s.maxReconnect) {
            s.reconnectAttempts++
            const delay =
              options.reconnectDelay ??
              1000 * s.reconnectAttempts

            s.reconnectTimeoutId = setTimeout(connect, delay)
          }

          options.onClose?.()
          notify(key)
        }

        ws.onerror = (err) => {
          options.onError?.(err)
        }
      }

      const disconnect = () => {
        if (s.reconnectTimeoutId) {
          clearTimeout(s.reconnectTimeoutId)
          s.reconnectTimeoutId = null
        }

        if (s.ws) {
          s.ws.onopen = null
          s.ws.onmessage = null
          s.ws.onclose = null
          s.ws.onerror = null
          s.ws.close()
          s.ws = null
        }

        s.connected = false
        notify(key)
      }

      // dependency diffing
      const deps = [url, options]
      const changed =
        !s.deps ||
        s.deps.length !== deps.length ||
        s.deps.some((d, i) => d !== deps[i])

      if (changed && typeof window !== "undefined") {
        s.deps = deps
        connect()
      }

      if (!hookState.cleanup) {
        hookState.cleanup = () => disconnect()
      }

      const send = (data: any) => {
        if (s.ws && s.connected) {
          const p = options.stringify ? JSON.stringify(data) : data
          s.ws.send(p)
        }
      }

      const getConnected = () => s.connected
      const getMessages = () => s.messages
      const getLastMessage = () => s.lastMessage

      return [
        {
          connected: s.connected,
          messages: s.messages,
          lastMessage: s.lastMessage
        },
        send,
        disconnect,
        connect,
        getConnected,
        getMessages,
        getLastMessage
      ] as const
    }
  )
}
