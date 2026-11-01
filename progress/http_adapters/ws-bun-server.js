export function bunWebSocketServerAdapter(port = 6452) {
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    let server = null;
    server = Bun.serve({
        port,
        fetch(req, server) {
            const success = server.upgrade(req, { data: { connectedAt: Date.now() } });
            if (success)
                return undefined;
            return new Response("WebSocket server", { status: 400 });
        },
        websocket: {
            open(ws) {
                connectHandler?.();
            },
            message(ws, message) {
                try {
                    const msg = JSON.parse(String(message));
                    messageHandler?.(msg);
                }
                catch { }
            },
            close(ws) {
                disconnectHandler?.();
            }
        }
    });
    return {
        send(msg) {
            if (server) {
                server.publish("all", JSON.stringify(msg));
            }
        },
        onMessage(handler) {
            messageHandler = handler;
            return () => { messageHandler = null; };
        },
        onConnect(handler) {
            connectHandler = handler;
        },
        onDisconnect(handler) {
            disconnectHandler = handler;
        }
    };
}
