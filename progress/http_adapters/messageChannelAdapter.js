// ─── MessageChannel — direct pipe between two endpoints ───────────────────
// The rawest 1:1 rt: one port each side, no fan-out. Useful as the
// low-latency leg of a duplex, or handed across workers.
export function messageChannelAdapter(port) {
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    port.onmessage = (e) => {
        try {
            messageHandler?.(e.data);
        }
        catch { }
    };
    port.start();
    queueMicrotask(() => connectHandler?.());
    return {
        send(msg) { port.postMessage(msg); },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
