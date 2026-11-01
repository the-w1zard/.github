// ─── WebTransport — client ────────────────────────────────────────────────
// Connects to an Http3Server (/bus path) exactly like your server adapter
// expects: one bidirectional stream, newline-delimited JSON, same lifecycle.
// Usage: const a = webTransportClientAdapter('https://host:4433/bus')
export function webTransportClientAdapter(url) {
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    const messageQueue = [];
    let writer = null;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const wt = new WebTransport(url);
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
    async function open() {
        await wt.ready;
        const stream = await wt.createBidirectionalStream();
        writer = stream.writable.getWriter();
        pump(stream.readable);
        while (messageQueue.length > 0) {
            writer.write(encoder.encode(JSON.stringify(messageQueue.shift()) + '\n')).catch(() => { });
        }
        connectHandler?.();
    }
    open().catch(() => { });
    wt.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.());
    return {
        send(msg) {
            if (writer)
                writer.write(encoder.encode(JSON.stringify(msg) + '\n')).catch(() => { });
            else
                messageQueue.push(msg);
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
