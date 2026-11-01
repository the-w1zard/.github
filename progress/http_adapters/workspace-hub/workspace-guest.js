// workspace-guest.ts
import WebSocket from 'ws';
import * as dgram from 'dgram';
export class WorkspaceGuest {
    onMessageReceived;
    ws = null;
    udpListener = null;
    isConnected = false;
    UDP_PORT = 47999;
    APP_SECRET_ID = 'DEVSTACK_SYNC_BEACON';
    // Constructor accepts the async dispatch mapping function from the handler
    constructor(onMessageReceived) {
        this.onMessageReceived = onMessageReceived;
    }
    scanLocalNetwork() {
        if (this.udpListener)
            return;
        const discoveredHostsMap = new Map();
        this.udpListener = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        this.udpListener.on('message', async (msg, rinfo) => {
            try {
                const packet = JSON.parse(msg.toString());
                if (packet.id === this.APP_SECRET_ID) {
                    discoveredHostsMap.set(rinfo.address, {
                        ip: rinfo.address,
                        port: packet.port
                    });
                    await this.onMessageReceived('SHARED_CLIPBOARD:SCAN_PROGRESS', Array.from(discoveredHostsMap.values()));
                }
            }
            catch (e) { }
        });
        this.udpListener.bind(this.UDP_PORT, () => {
            console.log('[WorkspaceGuest] Manual network scan active...');
            setTimeout(async () => {
                this.stopScan();
                await this.onMessageReceived('SHARED_CLIPBOARD:SCAN_COMPLETE', Array.from(discoveredHostsMap.values()));
            }, 10000);
        });
    }
    connect(hostIp, port, passwordHash) {
        this.disconnect();
        this.ws = new WebSocket(`ws://${hostIp}:${port}`);
        this.isConnected = true;
        this.ws.on('open', () => {
            this.ws?.send(JSON.stringify({
                type: 'AUTH_HANDSHAKE',
                password: passwordHash
            }));
        });
        this.ws.on('message', async (rawData) => {
            try {
                const packet = JSON.parse(rawData);
                if (packet.type === 'AUTH_SUCCESS') {
                    await this.onMessageReceived('SHARED_CLIPBOARD:CONNECTED_STATUS', true);
                    return;
                }
                if (packet.type === 'AUTH_FAILURE') {
                    await this.onMessageReceived('SHARED_CLIPBOARD:AUTH_ERR', packet.error);
                    this.disconnect();
                    return;
                }
                await this.onMessageReceived('SHARED_CLIPBOARD:RECEIVE_REMOTE_ITEM', {
                    id: packet.id || Math.random().toString(36).substring(2, 9),
                    type: packet.type,
                    sender: packet.sender,
                    fileName: packet.fileName || null,
                    mimeType: packet.mimeType || null,
                    data: packet.data
                });
            }
            catch (err) { }
        });
        this.ws.on('close', async () => {
            await this.onMessageReceived('SHARED_CLIPBOARD:CONNECTED_STATUS', false);
            this.isConnected = false;
        });
    }
    sendToHub(type, sender, meta) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
            return;
        this.ws.send(JSON.stringify({
            id: Math.random().toString(36).substring(2, 9),
            type,
            sender,
            fileName: meta.name,
            mimeType: meta.mime,
            data: meta.content
        }));
    }
    stopScan() {
        if (this.udpListener) {
            this.udpListener.close();
            this.udpListener = null;
        }
    }
    disconnect() {
        this.stopScan();
        if (this.ws) {
            this.ws.terminate();
            this.ws = null;
        }
        this.isConnected = false;
    }
}
