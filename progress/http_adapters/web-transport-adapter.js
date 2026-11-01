import { CONJURE_LIB_INIT } from "../../../the-cloud/the-cloud/solutions/libraries_init";
const { Http3Server } = CONJURE_LIB_INIT('@fails-components/webtransport');
// ─── WebTransport (reliable stream) ─────────────────────────────────────────
export function webTransportAdapter(session) {
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    let writer = null;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    async function pump(readable) {
        const reader = readable.getReader();
        let buffer = '';
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                let idx;
                while ((idx = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 1);
                    if (!line)
                        continue;
                    try {
                        messageHandler?.(JSON.parse(line));
                    }
                    catch { }
                }
            }
        }
        catch { }
    }
    async function acceptIncoming() {
        const reader = session.incomingBidirectionalStreams.getReader();
        try {
            while (true) {
                const { value: stream, done } = await reader.read();
                if (done)
                    break;
                pump(stream.readable);
            }
        }
        catch { }
    }
    session.ready.then(async () => {
        connectHandler?.();
        const outgoing = await session.createBidirectionalStream();
        writer = outgoing.writable.getWriter();
        pump(outgoing.readable);
        acceptIncoming();
    }).catch(() => { });
    session.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.());
    return {
        send(msg) {
            if (!writer)
                return;
            writer.write(encoder.encode(JSON.stringify(msg) + '\n')).catch(() => { });
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
// ─── WebTransport server bootstrap ──────────────────────────────────────────
// Path-scoped, unlike aedes/MQTT's flat broker — Http3Server hands you sessions
// per-path via sessionStream(path), so the caller registers per-path handlers
// rather than one global "a session connected" callback.
export function startWebTransportServer(options) {
    const server = new Http3Server({
        port: options.port ?? 4433,
        host: options.host ?? '0.0.0.0',
        secret: options.secret,
        cert: options.cert,
        privKey: options.privKey,
    });
    server.startServer();
    return {
        // Registers a handler for sessions arriving at a specific path.
        // Call once per path you want to accept connections on.
        onPath(path, handler) {
            ;
            (async () => {
                const stream = await server.sessionStream(path);
                const reader = stream.getReader();
                while (true) {
                    const { value: session, done } = await reader.read();
                    if (done)
                        break;
                    await session.ready;
                    handler(session);
                }
            })();
        },
        close() { server.closeServer?.(); }
    };
}
