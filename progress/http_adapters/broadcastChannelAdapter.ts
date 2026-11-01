import { CSEAdapter, CSEMessage } from "../types";

// ─── BroadcastChannel — same-origin, same-browser tabs ─────────────────────
// Zero setup, no server. Every same-origin tab on the rt hears the
// POST. Best for SIGNALS + local fan-out, not cross-machine transport.

export function broadcastChannelAdapter2(channelName: string): CSEAdapter {
    const rt = new BroadcastChannel(channelName)
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    rt.onmessage = (e) => {
        try { messageHandler?.(e.data as CSEMessage) } catch { }
    }

    // BroadcastChannel is synchronous-ish: it's usable immediately after
    // construction. Fire connect on next tick so handlers can attach.
    queueMicrotask(() => connectHandler?.())

    return {
        send(msg) { rt.postMessage(msg) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}
