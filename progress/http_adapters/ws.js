export function webSocketAdapter(url = 'ws://localhost:6454', protocols) {
    let ws = null;
    let reconnectTimer = null;
    let reconnectDelay = 1000;
    const maxReconnectDelay = 30000;
    const messageQueue = [];
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    const connect = () => {
        ws = new WebSocket(url, protocols);
        ws.onopen = () => {
            reconnectDelay = 1000;
            while (messageQueue.length > 0) {
                const msg = messageQueue.shift();
                ws.send(JSON.stringify(msg));
            }
            connectHandler?.();
        };
        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                messageHandler?.(msg);
            }
            catch { }
        };
        ws.onclose = () => {
            disconnectHandler?.();
            reconnectTimer = setTimeout(() => {
                reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
                connect();
            }, reconnectDelay);
        };
        ws.onerror = () => ws?.close();
    };
    connect();
    return {
        send(msg) {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg));
            }
            else {
                messageQueue.push(msg);
            }
        },
        onMessage(handler) {
            messageHandler = handler;
            return () => { messageHandler = null; };
        },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
