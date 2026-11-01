// ─── Child Process ────────────────────────────────────────────────────────
export function childProcessAdapter(proc = process) {
    let messageHandler = null;
    let connectHandler = null;
    process.nextTick(() => connectHandler?.());
    proc.on('message', (raw) => {
        try {
            messageHandler?.(JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)));
        }
        catch { }
    });
    return {
        send(msg) {
            if (proc.send)
                proc.send(JSON.stringify(msg));
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { }
    };
}
