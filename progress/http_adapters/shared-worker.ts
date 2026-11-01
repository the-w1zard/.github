import { CSEAdapter, CSEMessage } from "../types";



export function sharedWorkerAdapter(scriptUrl: string): CSEAdapter {
    const worker = new SharedWorker(scriptUrl)
    const port = worker.port
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null

    port.onmessage = (e) => {
        if (e.data?.__cse_connect__) {
            connectHandler?.()
            return
        }
        try {
            messageHandler?.(e.data as CSEMessage)
        } catch { }
    }

    port.start()
    port.postMessage({ __cse_connect__: true })

    return {
        send(msg) { port.postMessage(msg) },
        onMessage(handler) {
            messageHandler = handler
            return () => { messageHandler = null }
        },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(_handler) { }
    }
}
export const sharedWorkerScript = `
const ports = new Set();

self.onconnect = (e) => {
    const port = e.ports[0];
    ports.add(port);

    port.onmessage = (event) => {
        if (event.data?.__cse_connect__) {
            port.postMessage({ __cse_connect__: true });
            return;
        }
        for (const p of ports) {
            if (p !== port) p.postMessage(event.data);
        }
        port.postMessage(event.data);
    };

    port.addEventListener('close', () => ports.delete(port));
    port.start();
};
`
