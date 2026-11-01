import { CONJURE_LIB_INIT } from "../../../the-cloud/the-cloud/solutions/libraries_init"
import { CSEAdapter, CSEMessage } from "../types";

const { Http3Server } = CONJURE_LIB_INIT('@fails-components/webtransport')
// requires @fails-components/webtransport-transport-http3-quiche installed alongside —
// the QUIC binary binding; versions must match the main package exactly
/**const wt = startWebTransportServer({ secret: '...', cert, privKey })
wt.onPath('/bus', (session) => {
    const adapter = webTransportAdapter(session)
    // wire adapter into your bus like any other CSEAdapter
}) */
interface WebTransportSessionLike {
    ready: Promise<void>
    closed: Promise<unknown>
    createBidirectionalStream(): Promise<{
        readable: ReadableStream<Uint8Array>
        writable: WritableStream<Uint8Array>
    }>
    incomingBidirectionalStreams: ReadableStream<{
        readable: ReadableStream<Uint8Array>
        writable: WritableStream<Uint8Array>
    }>
}

// ─── WebTransport (reliable stream) ─────────────────────────────────────────
export function webTransportAdapter(session: WebTransportSessionLike): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    async function pump(readable: ReadableStream<Uint8Array>) {
        const reader = readable.getReader()
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

    async function acceptIncoming() {
        const reader = session.incomingBidirectionalStreams.getReader()
        try {
            while (true) {
                const { value: stream, done } = await reader.read()
                if (done) break
                pump(stream.readable)
            }
        } catch { }
    }

    session.ready.then(async () => {
        connectHandler?.()
        const outgoing = await session.createBidirectionalStream()
        writer = outgoing.writable.getWriter()
        pump(outgoing.readable)
        acceptIncoming()
    }).catch(() => { })

    session.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.())

    return {
        send(msg) {
            if (!writer) return
            writer.write(encoder.encode(JSON.stringify(msg) + '\n')).catch(() => { })
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}

// ─── WebTransport server bootstrap ──────────────────────────────────────────
// Path-scoped, unlike aedes/MQTT's flat broker — Http3Server hands you sessions
// per-path via sessionStream(path), so the caller registers per-path handlers
// rather than one global "a session connected" callback.
export function startWebTransportServer(options: {
    port?: number
    host?: string
    secret: string   // required by Http3Server — rotates/validates session tokens internally
    cert: string
    privKey: string
}) {
    const server = new Http3Server({
        port: options.port ?? 4433,
        host: options.host ?? '0.0.0.0',
        secret: options.secret,
        cert: options.cert,
        privKey: options.privKey,
    })

    server.startServer()

    return {
        // Registers a handler for sessions arriving at a specific path.
        // Call once per path you want to accept connections on.
        onPath(path: string, handler: (session: WebTransportSessionLike) => void): void {
            ; (async () => {
                const stream = await server.sessionStream(path)
                const reader = stream.getReader()
                while (true) {
                    const { value: session, done } = await reader.read()
                    if (done) break
                    await session.ready
                    handler(session as WebTransportSessionLike)
                }
            })()
        },
        close() { server.closeServer?.() }
    }
}
