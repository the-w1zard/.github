export function webTransportDatagramsAdapter(session) {
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    let writer = null;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    async function pump() {
        const reader = session.datagrams.readable.getReader();
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
    session.ready.then(async () => {
        connectHandler?.();
        writer = session.datagrams.writable.getWriter();
        pump();
    }).catch(() => { });
    session.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.());
    return {
        send(msg) {
            if (!writer)
                return;
            // Datagrams are unreliable — write and forget. Size cap applies
            // (WebTransport datagram MTU), caller splits large frames upstream.
            writer.write(encoder.encode(JSON.stringify(msg) + '\n')).catch(() => { });
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
