export function postMessageAdapter(target, targetOrigin) {
    const messageHandlers = new Set();
    const connectHandlers = new Set();
    const disconnectHandlers = new Set();
    const listener = (event) => {
        if (event.origin !== targetOrigin)
            return;
        const msg = event.data;
        if (!msg || typeof msg !== "object" || !("rt" in msg))
            return;
        messageHandlers.forEach(h => h(msg));
    };
    window.addEventListener("message", listener);
    return {
        send: (msg) => target.postMessage(msg, targetOrigin),
        onMessage: (handler) => {
            messageHandlers.add(handler);
            return () => messageHandlers.delete(handler);
        },
        onConnect: (handler) => {
            connectHandlers.add(handler);
            handler();
            return () => connectHandlers.delete(handler);
        },
        onDisconnect: (handler) => {
            disconnectHandlers.add(handler);
            return () => disconnectHandlers.delete(handler);
        },
    };
}
export function postMessageAdapterVSCode() {
    const vscodeApi = window.acquireVsCodeApi();
    const messageHandlers = new Set();
    const connectHandlers = new Set();
    const disconnectHandlers = new Set();
    const listener = (e) => {
        messageHandlers.forEach(h => h(e.data));
    };
    window.addEventListener('message', listener);
    return {
        send: (msg) => vscodeApi.postMessage(msg),
        onMessage: (handler) => {
            messageHandlers.add(handler);
            return () => messageHandlers.delete(handler);
        },
        onConnect: (handler) => {
            connectHandlers.add(handler);
            handler(); // webview is "connected" the moment the API is acquired — no separate handshake exists
            return () => connectHandlers.delete(handler);
        },
        onDisconnect: (handler) => {
            disconnectHandlers.add(handler);
            // fires when the webview itself is torn down (panel closed / VSCode reloads the webview)
            window.addEventListener('unload', handler);
            return () => {
                disconnectHandlers.delete(handler);
                window.removeEventListener('unload', handler);
            };
        },
    };
}
