import { CSEAdapter, CSEMessage } from "../signals/types";

// ─── MessageChannel — direct pipe between two endpoints ───────────────────
// The rawest 1:1 rt: one port each side, no fan-out. Useful as the
// low-latency leg of a duplex, or handed across workers.

export function messageChannelAdapter(port: MessagePort): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    port.onmessage = (e) => {
        try { messageHandler?.(e.data as CSEMessage) } catch { }
    }

    port.start()
    queueMicrotask(() => connectHandler?.())

    return {
        send(msg) { port.postMessage(msg) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}
