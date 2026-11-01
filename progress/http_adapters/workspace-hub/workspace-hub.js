import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dgram from 'dgram';
export class WorkspaceHub {
    wss = null;
    server = null;
    clients = new Set();
    udpBeacon = null;
    beaconInterval = null;
    UDP_PORT = 47999;
    APP_SECRET_ID = 'DEVSTACK_SYNC_BEACON';
    start(port = 8333, passwordHash) {
        // 1. Core HTTP wrapper
        this.server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('DevStack Hub Engine Active\n');
        });
        this.wss = new WebSocketServer({ server: this.server });
        this.wss.on('connection', (ws) => {
            let isAuthenticated = false;
            ws.on('message', (rawMessage) => {
                try {
                    const packet = JSON.parse(rawMessage);
                    // Enforce Auth Handshake step first
                    if (!isAuthenticated) {
                        if (packet.type === 'AUTH_HANDSHAKE' && packet.password === passwordHash) {
                            isAuthenticated = true;
                            this.clients.add(ws);
                            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
                            console.log('[WorkspaceHub] Client authenticated successfully.');
                        }
                        else {
                            ws.send(JSON.stringify({ type: 'AUTH_FAILURE', error: 'Invalid password' }));
                            ws.terminate();
                        }
                        return;
                    }
                    // If authenticated, broadcast data down the pipeline
                    this.broadcast(rawMessage, ws);
                }
                catch (e) {
                    // Guard clause for unparsed packets
                }
            });
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
        this.server.listen(port, () => {
            console.log(`[WorkspaceHub] WS Server armed on port ${port}`);
            this.startBroadcasting(port);
        });
    }
    startBroadcasting(wsPort) {
        this.udpBeacon = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        this.udpBeacon.bind(() => {
            if (!this.udpBeacon)
                return;
            this.udpBeacon.setBroadcast(true);
            const p = JSON.stringify({
                id: this.APP_SECRET_ID,
                port: wsPort
            });
            this.beaconInterval = setInterval(() => {
                if (!this.udpBeacon)
                    return;
                const message = Buffer.from(p);
                this.udpBeacon.send(message, 0, message.length, this.UDP_PORT, '255.255.255.255');
            }, 3000);
        });
    }
    broadcast(rawMessage, sender) {
        for (const client of this.clients) {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(rawMessage);
            }
        }
    }
    stop() {
        if (this.beaconInterval)
            clearInterval(this.beaconInterval);
        // Close the beacon
        if (this.udpBeacon) {
            this.udpBeacon.close();
            this.udpBeacon = null;
        }
        // Terminate all current connection streams safely
        this.clients.forEach(client => client.terminate());
        this.clients.clear();
        this.wss?.close();
        this.server?.close();
        console.log('[WorkspaceHub] Host engine completely shut down.');
    }
}
