import { CSEAdapter, CSEMessage } from "../types";

// SSE plugin — downstream only (server → client).
// Upstream must come from another transport (WebSocket / WebTransport / WebRTC / a separate POST plugin).
export function sseAdapter(source: { req: import('http').IncomingMessage; res: import('http').ServerResponse } | { url: string }): CSEAdapter {
    // ── server side ──────────────────────────────────────────────
    if ('res' in source) {
        const { req, res } = source
        let connectHandler: (() => void) | null = null
        let disconnectHandler: (() => void) | null = null

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        })

        req.on('close', () => disconnectHandler?.())
        setTimeout(() => connectHandler?.(), 0)

        return {
            send(msg) { res.write(`data: ${JSON.stringify(msg)}\n\n`) },
            // no upstream over SSE — never fires
            onMessage() { return () => { } },
            onConnect(h) { connectHandler = h },
            onDisconnect(h) { disconnectHandler = h },
        }
    }

    // ── client side ──────────────────────────────────────────────
    const { url } = source
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    const es = new EventSource(url)
    es.onopen = () => connectHandler?.()
    es.onmessage = (e) => {
        try { messageHandler?.(JSON.parse(e.data) as CSEMessage) } catch { }
    }
    es.onerror = () => disconnectHandler?.()

    return {
        // no send over SSE — caller must use an upstream transport
        send() { throw new Error('sse: downstream-only transport, cannot send') },
        onMessage(h) { messageHandler = h; return () => { messageHandler = null } },
        onConnect(h) { connectHandler = h },
        onDisconnect(h) { disconnectHandler = h },
    }
}
