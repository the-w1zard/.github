// src/staff/staff=cross=app.ts
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
let _brokerClose = null;
function startCSEBroker(port) {
    if (_brokerClose)
        return;
    const server = createServer();
    const wss = new WebSocketServer({ server });
    const clients = new Set();
    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.on('message', (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            }
            catch {
                return;
            }
            for (const client of clients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(msg));
                }
            }
        });
        ws.on('close', () => clients.delete(ws));
        ws.on('error', () => { ws.terminate(); clients.delete(ws); });
    });
    server.listen(port);
    _brokerClose = () => { wss.close(); server.close(); };
}
// ADAPTER 
function crossAppAdapter(port) {
    const url = `ws://localhost:${port}`;
    let ws = null;
    let reconnectTimer = null;
    let reconnectDelay = 1000;
    const maxReconnectDelay = 30000;
    const messageQueue = [];
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    const connect = () => {
        ws = new WebSocket(url);
        ws.onopen = () => {
            reconnectDelay = 1000;
            while (messageQueue.length > 0)
                ws.send(JSON.stringify(messageQueue.shift()));
            connectHandler?.();
        };
        ws.onmessage = (e) => {
            try {
                messageHandler?.(JSON.parse(e.data.toString()));
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
export function initCrossAppComs(staff, enabled, port) {
    if (!enabled)
        return;
    startCSEBroker(port);
    staff.registerAdapter(crossAppAdapter(port));
}
