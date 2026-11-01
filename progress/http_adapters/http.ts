import { CSEAdapter, CSEMessage } from "../types";



export function httpAdapter(baseUrl: string, intervalMs = 3000): CSEAdapter {
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null
    let lastTs = Date.now()
    let online = true

    const poll = async () => {
        try {
            const res = await fetch(`${baseUrl}/staff/poll?since=${lastTs}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            if (!res.ok) throw new Error(`Poll failed: ${res.status}`)
            const messages: CSEMessage[] = await res.json()
            if (!online) {
                online = true
                connectHandler?.()
            }
            for (const msg of messages) {
                lastTs = Math.max(lastTs, msg.ts + 1)
                messageHandler?.(msg)
            }
        } catch {
            if (online) {
                online = false
                disconnectHandler?.()
            }
        }
    }

    pollTimer = setInterval(poll, intervalMs)
    poll()

    return {
        send(msg) {
            fetch(`${baseUrl}/staff/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            }).catch(() => { })
        },
        onMessage(handler) {
            messageHandler = handler
            return () => { messageHandler = null }
        },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}
