// the-cloud/adapters/reliable-socket.ts
import { getSauron, setSauron } from '#the-cloud'
import { CSEAdapter, CSEMessage } from "../types";

export type ReliableSocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

export type ReliableSocketOptions = {
    reconnect?: boolean
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
    jitter?: boolean
    maxAttempts?: number
    queueEnabled?: boolean
    maxQueueSize?: number
    maxQueueAge?: number
    queueKey?: string
}

export function reliableSocket(url: string, options: ReliableSocketOptions = {}): CSEAdapter & {
    onStatusChange(handler: (s: ReliableSocketStatus) => void): () => void
    status(): ReliableSocketStatus
    queueSize(): number
    close(): void
} {
    const opts: Required<ReliableSocketOptions> = {
        reconnect: true,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 1.5,
        jitter: true,
        maxAttempts: Infinity,
        queueEnabled: true,
        maxQueueSize: 100,
        maxQueueAge: 300000,
        queueKey: `reliable-socket:queue:${url}`,
        ...options,
    }

    let socket: WebSocket | null = null
    let status: ReliableSocketStatus = 'closed'
    let reconnectAttempts = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let allowReconnect = opts.reconnect

    const statusListeners = new Set<(s: ReliableSocketStatus) => void>()
    const messageListeners = new Set<(msg: CSEMessage) => void>()
    const openListeners = new Set<() => void>()
    const closeListeners = new Set<() => void>()

    function setStatus(s: ReliableSocketStatus) {
        status = s
        statusListeners.forEach(l => l(s))
    }

    function scheduleReconnect() {
        if (reconnectAttempts >= opts.maxAttempts) return
        let delay = Math.min(opts.initialDelay * opts.backoffMultiplier ** reconnectAttempts, opts.maxDelay)
        if (opts.jitter) delay *= 0.5 + Math.random() * 0.5
        reconnectTimer = setTimeout(() => { reconnectAttempts++; open(); }, delay)
    }

    function open() {
        setStatus(reconnectAttempts > 0 ? 'reconnecting' : 'connecting')
        const ws = new WebSocket(url)
        socket = ws

        ws.onopen = () => {
            reconnectAttempts = 0
            setStatus('open')
            openListeners.forEach(l => l())
            flushQueue()
        }

        ws.onmessage = (e) => {
            let msg: CSEMessage
            try { msg = JSON.parse(String(e.data)) as CSEMessage } catch { return }
            messageListeners.forEach(l => l(msg))
        }
        ws.onclose = () => {
            setStatus('closed')
            closeListeners.forEach(l => l())
            if (allowReconnect) scheduleReconnect()
        }
        ws.onerror = () => ws.close()
    }

    function flushQueue() {
        if (status !== 'open' || !socket) return
        const now = Date.now()
        const queue = (getSauron<{ raw: string; queuedAt: number }[]>(opts.queueKey) ?? [])
            .filter(q => now - q.queuedAt <= opts.maxQueueAge)
        queue.forEach(q => socket?.send(q.raw))
        setSauron(opts.queueKey, [])
    }

    open()

    return {
        send(msg: CSEMessage): void {
            const raw = JSON.stringify(msg)
            if (status === 'open' && socket) { socket.send(raw); return }
            if (!opts.queueEnabled) return
            const queue = getSauron<{ raw: string; queuedAt: number }[]>(opts.queueKey) ?? []
            queue.push({ raw, queuedAt: Date.now() })
            if (queue.length > opts.maxQueueSize) queue.shift()
            setSauron(opts.queueKey, queue)
        },
        onMessage(handler: (msg: CSEMessage) => void): () => void {
            messageListeners.add(handler)
            return () => { messageListeners.delete(handler) }
        },
        onConnect(handler: () => void): () => void {
            openListeners.add(handler)
            return () => { openListeners.delete(handler) }
        },
        onDisconnect(handler: () => void): () => void {
            closeListeners.add(handler)
            return () => { closeListeners.delete(handler) }
        },
        onStatusChange(handler: (s: ReliableSocketStatus) => void): () => void {
            statusListeners.add(handler)
            return () => { statusListeners.delete(handler) }
        },
        status(): ReliableSocketStatus { return status },
        queueSize(): number { return (getSauron<unknown[]>(opts.queueKey) ?? []).length },
        close(): void {
            allowReconnect = false
            if (reconnectTimer) clearTimeout(reconnectTimer)
            socket?.close()
        },
    }
}
