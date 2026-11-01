import { CSEAdapter, CSEMessage } from "../types";

// ─── HTTP/2 — long-lived streams over an existing connection ──────────────
// Server side: pushes a long-lived stream per request (SSE-style framing),
// messages POSTed back on the same request body. Client side: one fetch+
// reader for inbound, POST for outbound. Reuses your existing connection —
// no new transport, just head-of-line-safe streams.

export function http2ServerAdapter(req: import('http').IncomingMessage, res: import('http').ServerResponse): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null

    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
    req.on('data', (chunk) => {
        try { messageHandler?.(JSON.parse(chunk.toString()) as CSEMessage) } catch { }
    })
    req.on('close', () => { /* client gone */ })

    return {
        send(msg) { res.write(`data: ${JSON.stringify(msg)}\n\n`) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { setTimeout(() => handler(), 0) },
        onDisconnect(handler) { req.on('close', handler) }
    }
}

export function http2ClientAdapter(url: string): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    const ctl = new AbortController()

    async function listen() {
        try {
            const res = await fetch(url, { signal: ctl.signal })
            const reader = res.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                let idx: number
                while ((idx = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, idx)
                    buffer = buffer.slice(idx + 1)
                    if (!line) continue
                    if (line.startsWith('data: ')) {
                        try { messageHandler?.(JSON.parse(line.slice(6)) as CSEMessage) } catch { }
                    }
                }
            }
        } catch { }
    }
    listen()

    return {
        send(msg) { void fetch(url, { method: 'POST', body: JSON.stringify(msg), signal: ctl.signal }) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { setTimeout(() => handler(), 0) },
        onDisconnect(handler) { ctl.abort(); handler() }
    }
}
