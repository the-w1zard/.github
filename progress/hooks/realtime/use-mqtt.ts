import { createHook } from '#the-cloud'

export function useMQTT(url: string, options: any = {}) {
  const {
    clientId        = `mqtt_${Math.random().toString(36).slice(2)}`,
    username,
    password,
    clean           = true,
    reconnectPeriod = 5000
  } = options

  return createHook(
    "useMQTT",
    _sid(),
    () => {
      let client: any = null

      if (typeof window !== "undefined" && (window as any).mqtt) {
        client = (window as any).mqtt.connect(url, {
          clientId,
          username,
          password,
          clean,
          reconnectPeriod
        })
      }

      return {
        client,
        connected: false,
        messages: new Map<string, string[]>(),
        subscriptions: new Set<string>()
      }
    },

    (hookState, key, notify) => {
      const s = hookState.value

      // Attach MQTT listeners once
      if (s.client && !hookState.cleanup) {
        const client = s.client

        const onConnect = () => {
          s.connected = true
          notify(key)
        }

        const onMessage = (topic: string, message: any) => {
          const arr = s.messages.get(topic) ?? []
          arr.push(message.toString())
          s.messages.set(topic, arr)
          notify(key)
        }

        const onClose = () => {
          s.connected = false
          notify(key)
        }

        client.on("connect", onConnect)
        client.on("message", onMessage)
        client.on("close", onClose)

        hookState.cleanup = () => {
          client.off("connect", onConnect)
          client.off("message", onMessage)
          client.off("close", onClose)
          client.end?.()
        }
      }

      const subscribe = (topic: string) => {
        if (!s.client || !s.connected) return
        s.client.subscribe(topic)
        s.subscriptions.add(topic)
        notify(key)
      }

      const publish = (topic: string, message: string) => {
        if (!s.client || !s.connected) return
        s.client.publish(topic, message)
      }

      const unsubscribe = (topic: string) => {
        if (!s.client) return
        s.client.unsubscribe(topic)
        s.subscriptions.delete(topic)
        notify(key)
      }

      return [
        {
          connected: s.connected,
          messages: s.messages,
          subscriptions: Array.from(s.subscriptions)
        },
        { subscribe, publish, unsubscribe }
      ]
    }
  )
}
