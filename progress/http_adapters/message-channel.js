export function messageChannel() {
    const { port1, port2 } = new MessageChannel();
    let _handler = null;
    port1.onmessage = (e) => _handler?.(e.data);
    const adapter = {
        send: (msg) => port1.postMessage(msg),
        onMessage: (h) => { _handler = h; return () => { _handler = null; }; },
    };
    return { adapter, port: port2 };
}
