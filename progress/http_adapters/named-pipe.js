import * as net from 'net';
import { unixSocketAdapter } from './unix-socket';
// ─── Named Pipe ───────────────────────────────────────────────────────────
export function namedPipeAdapter(pipeName) {
    const pipePath = `\\\\.\\pipe\\${pipeName}`;
    return unixSocketAdapter(pipePath);
}
export function startNamedPipeBroker(pipeName) {
    const pipePath = `\\\\.\\pipe\\${pipeName}`;
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
    server.listen(pipePath);
    return () => server.close();
}
