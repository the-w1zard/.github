export function httpAdapter(baseUrl, intervalMs = 3000) {
    let pollTimer = null;
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    let lastTs = Date.now();
    let online = true;
    const poll = async () => {
        try {
            const res = await fetch(`${baseUrl}/staff/poll?since=${lastTs}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok)
                throw new Error(`Poll failed: ${res.status}`);
            const messages = await res.json();
            if (!online) {
                online = true;
                connectHandler?.();
            }
            for (const msg of messages) {
                lastTs = Math.max(lastTs, msg.ts + 1);
                messageHandler?.(msg);
            }
        }
        catch {
            if (online) {
                online = false;
                disconnectHandler?.();
            }
        }
    };
    pollTimer = setInterval(poll, intervalMs);
    poll();
    return {
        send(msg) {
            fetch(`${baseUrl}/staff/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            }).catch(() => { });
        },
        onMessage(handler) {
            messageHandler = handler;
            return () => { messageHandler = null; };
        },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
