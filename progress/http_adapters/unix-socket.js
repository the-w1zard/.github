import * as net from 'net';
import * as fs from 'fs';
// ─── Unix Socket ──────────────────────────────────────────────────────────
export function unixSocketAdapter(socketPath) {
    let client = null;
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    let reconnectDelay = 1000;
    const maxReconnectDelay = 30000;
    const messageQueue = [];
    const connect = () => {
        client = net.createConnection(socketPath);
        let buffer = '';
        client.on('connect', () => {
            reconnectDelay = 1000;
            while (messageQueue.length > 0)
                client.write(JSON.stringify(messageQueue.shift()) + '\n');
            connectHandler?.();
        });
        client.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                try {
                    messageHandler?.(JSON.parse(line));
                }
                catch { }
            }
        });
        client.on('close', () => {
            disconnectHandler?.();
            setTimeout(() => {
                reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
                connect();
            }, reconnectDelay);
        });
        client.on('error', () => client?.destroy());
    };
    connect();
    return {
        send(msg) {
            if (client && !client.destroyed) {
                client.write(JSON.stringify(msg) + '\n');
            }
            else {
                messageQueue.push(msg);
            }
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
export function startUnixSocketBroker(socketPath) {
    if (fs.existsSync(socketPath))
        fs.unlinkSync(socketPath);
    const clients = new Set();
    const server = net.createServer((socket) => {
        let buffer = '';
        clients.add(socket);
        socket.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                let msg;
                try {
                    msg = JSON.parse(line);
                }
                catch {
                    continue;
                }
                for (const c of clients) {
                    if (c !== socket && !c.destroyed)
                        c.write(JSON.stringify(msg) + '\n');
                }
            }
        });
        socket.on('close', () => clients.delete(socket));
        socket.on('error', () => { socket.destroy(); clients.delete(socket); });
    });
    server.listen(socketPath);
    return () => server.close();
}
