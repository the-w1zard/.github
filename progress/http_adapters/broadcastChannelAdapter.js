// ─── BroadcastChannel — same-origin, same-browser tabs ─────────────────────
// Zero setup, no server. Every same-origin tab on the rt hears the
// POST. Best for SIGNALS + local fan-out, not cross-machine transport.
export function broadcastChannelAdapter2(channelName) {
    const rt = new BroadcastChannel(channelName);
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    rt.onmessage = (e) => {
        try {
            messageHandler?.(e.data);
        }
        catch { }
    };
    // BroadcastChannel is synchronous-ish: it's usable immediately after
    // construction. Fire connect on next tick so handlers can attach.
    queueMicrotask(() => connectHandler?.());
    return {
        send(msg) { rt.postMessage(msg); },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
