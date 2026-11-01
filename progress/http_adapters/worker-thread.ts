import { CSEAdapter, CSEMessage } from "../types";



// ─── Worker Thread ────────────────────────────────────────────────────────
export function workerThreadAdapter(worker: import('worker_threads').Worker): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    worker.on('message', (raw: any) => {
        try { messageHandler?.(typeof raw === 'string' ? JSON.parse(raw) : raw as CSEMessage) } catch { }
    })
    worker.on('exit', () => disconnectHandler?.())
    process.nextTick(() => connectHandler?.())

    return {
        send(msg) { worker.postMessage(msg) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}


