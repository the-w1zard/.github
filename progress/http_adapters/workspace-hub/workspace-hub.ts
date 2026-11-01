import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dgram from 'dgram';

export class WorkspaceHub {
  private wss: WebSocketServer | null = null;
  private server: http.Server | null = null;
  private clients: Set<WebSocket> = new Set();
  private udpBeacon: dgram.Socket | null = null;
  private beaconInterval: NodeJS.Timeout | null = null;
  
  private readonly UDP_PORT = 47999;
  private readonly APP_SECRET_ID = 'DEVSTACK_SYNC_BEACON';

  public start(port: number = 8333, passwordHash: string) {
    // 1. Core HTTP wrapper
    this.server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('DevStack Hub Engine Active\n');
    });

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket) => {
      let isAuthenticated = false;

      ws.on('message', (rawMessage: string) => {
        try {
          const packet = JSON.parse(rawMessage);

          // Enforce Auth Handshake step first
          if (!isAuthenticated) {
            if (packet.type === 'AUTH_HANDSHAKE' && packet.password === passwordHash) {
              isAuthenticated = true;
              this.clients.add(ws);
              ws.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
              console.log('[WorkspaceHub] Client authenticated successfully.');
            } else {
              ws.send(JSON.stringify({ type: 'AUTH_FAILURE', error: 'Invalid password' }));
              ws.terminate();
            }
            return;
          }

          // If authenticated, broadcast data down the pipeline
          this.broadcast(rawMessage, ws);
        } catch (e) {
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

  private startBroadcasting(wsPort: number) {
    this.udpBeacon = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.udpBeacon.bind(() => {
      if (!this.udpBeacon) return;
      this.udpBeacon.setBroadcast(true);
      
      const p = JSON.stringify({
        id: this.APP_SECRET_ID,
        port: wsPort
      });

      this.beaconInterval = setInterval(() => {
        if (!this.udpBeacon) return;
        const message = Buffer.from(p);
        this.udpBeacon.send(message, 0, message.length, this.UDP_PORT, '255.255.255.255');
      }, 3000);
    });
  }

  private broadcast(rawMessage: string, sender: WebSocket) {
    for (const client of this.clients) {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(rawMessage);
      }
    }
  }

  public stop() {
    if (this.beaconInterval) clearInterval(this.beaconInterval);
    
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
