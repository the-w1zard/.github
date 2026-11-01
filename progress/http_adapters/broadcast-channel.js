export function broadcastChannelAdapter(name) {
    const bc = new BroadcastChannel(name);
    let _handler = null;
    bc.onmessage = (e) => _handler?.(e.data);
    return {
        send: (msg) => bc.postMessage(msg),
        onMessage: (h) => { _handler = h; return () => { _handler = null; }; },
        onConnect: (h) => h(),
        onDisconnect: () => { }
    };
}
