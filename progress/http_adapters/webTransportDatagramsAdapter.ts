import { CSEAdapter, CSEMessage } from "../types";

// ─── WebTransport (unreliable datagrams) ────────────────────────────────────
// Same session shape as webTransportAdapter, but uses session.datagrams
// instead of bidirectional streams. Fire-and-forget: no acks, no ordering.
// For the STATE category where losing a frame is cheaper than waiting.

interface WebTransportDatagramsLike {
    datagrams: {
        readable: ReadableStream<Uint8Array>
        writable: WritableStream<Uint8Array>
    }
    ready: Promise<void>
    closed: Promise<unknown>
}

export function webTransportDatagramsAdapter(session: WebTransportDatagramsLike): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    async function pump() {
        const reader = session.datagrams.readable.getReader()
        let buffer = ''
        try {
            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                let idx: number
                while ((idx = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, idx)
                    buffer = buffer.slice(idx + 1)
                    if (!line) continue
                    try { messageHandler?.(JSON.parse(line) as CSEMessage) } catch { }
                }
            }
        } catch { }
    }

    session.ready.then(async () => {
        connectHandler?.()
        writer = session.datagrams.writable.getWriter()
        pump()
    }).catch(() => { })

    session.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.())

    return {
        send(msg) {
            if (!writer) return
            // Datagrams are unreliable — write and forget. Size cap applies
            // (WebTransport datagram MTU), caller splits large frames upstream.
            writer.write(encoder.encode(JSON.stringify(msg) + '\n')).catch(() => { })
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}
