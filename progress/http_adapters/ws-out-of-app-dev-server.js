// src/websocket-staff-only.ts
import { WebSocketServer, WebSocket } from 'ws';
let wssSingleton = null;
export function startCseWebSocket(staff, port = 8080) {
    if (wssSingleton)
        return wssSingleton;
    const wss = new WebSocketServer({ port });
    wssSingleton = wss;
    setupServer(wss, staff);
    console.log(`[CSE WebSocket] Server running on port ${port}`);
    return wssSingleton;
}
function setupServer(wss, staff) {
    const clientSockets = new Map();
    const subs = new Map();
    wss.on("connection", (socket) => {
        let subIdSeq = 1;
        let socketClientId = null;
        const send = (msg) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(msg));
            }
        };
        const rpcMethods = {
            // Client registration
            register: (clientId) => {
                socketClientId = clientId;
                clientSockets.set(clientId, socket);
                return { ok: true };
            },
            // Send to specific client
            sendToClient: (clientId, rt, p) => {
                const target = clientSockets.get(clientId);
                if (!target || target.readyState !== WebSocket.OPEN) {
                    return { ok: false, error: "Client not connected" };
                }
                target.send(JSON.stringify({
                    type: "staff:routed",
                    clientId,
                    rt,
                    p
                }));
                return { ok: true };
            },
            // CSE methods
            send: (rt, p, ttl) => {
                console.log('[CSE:send]', rt, p);
                return staff.send(rt, p, ttl);
            },
            gar: (rt, p, ttl) => {
                return staff.gar(rt, p, ttl);
            },
            reply: (replyChannel, p) => {
                return staff.reply(replyChannel, p);
            },
            request: (rt, p) => {
                return staff.request(rt, p);
            },
            broadcast: (rt, p, ttl) => {
                return staff.broadcast(rt, p, ttl);
            },
            batch: (messages) => {
                return staff.batch(messages);
            },
            sub: (rt) => {
                const subId = subIdSeq++;
                const off = staff.sub(rt, (msg) => {
                    send({ type: "staff:event", subId, p: msg });
                });
                subs.set(subId, off);
                return subId;
            },
            subWithHistory: (rt, limit) => {
                const subId = subIdSeq++;
                const off = staff.subWithHistory(rt, (msg) => {
                    send({ type: "staff:event", subId, p: msg });
                }, { limit });
                subs.set(subId, off);
                return subId;
            },
            unsub: (subId) => {
                const off = subs.get(subId);
                if (off) {
                    off();
                    subs.delete(subId);
                }
                return true;
            },
            stream: async (rt, p) => {
                const streamId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                staff.stream(rt, p, (chunk, done) => {
                    if (socket.readyState !== WebSocket.OPEN)
                        return;
                    if (done) {
                        send({ type: "rpc:chunk", id: streamId, done: true });
                    }
                    else {
                        send({ type: "rpc:chunk", id: streamId, chunk });
                    }
                });
                return { streamId };
            },
            cancelStream: (rt, streamId) => {
                return staff.cancelStream(rt, streamId);
            }
        };
        socket.on("message", async (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            }
            catch {
                return;
            }
            if (msg.type !== "rpc")
                return;
            const fn = rpcMethods[msg.method];
            if (!fn) {
                send({
                    type: "rpc:res",
                    id: msg.id,
                    ok: false,
                    error: `Unknown method: ${msg.method}`
                });
                return;
            }
            try {
                const result = await fn(...(msg.args || []));
                send({ type: "rpc:res", id: msg.id, ok: true, result });
            }
            catch (err) {
                send({
                    type: "rpc:res",
                    id: msg.id,
                    ok: false,
                    error: String(err?.message ?? err)
                });
            }
        });
        socket.on("close", () => {
            if (socketClientId) {
                clientSockets.delete(socketClientId);
            }
            subs.forEach((off) => off());
            subs.clear();
        });
    });
}
// For graceful shutdown
export function stopCseWebSocket() {
    if (wssSingleton) {
        wssSingleton.close();
        wssSingleton = null;
        console.log('[CSE WebSocket] Server stopped');
    }
}
