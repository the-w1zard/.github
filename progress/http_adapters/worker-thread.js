// ─── Worker Thread ────────────────────────────────────────────────────────
export function workerThreadAdapter(worker) {
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    worker.on('message', (raw) => {
        try {
            messageHandler?.(typeof raw === 'string' ? JSON.parse(raw) : raw);
        }
        catch { }
    });
    worker.on('exit', () => disconnectHandler?.());
    process.nextTick(() => connectHandler?.());
    return {
        send(msg) { worker.postMessage(msg); },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
