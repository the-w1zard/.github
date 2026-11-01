// the-cloud/adapters/reliable-socket.ts
import { getSauron, setSauron } from '#the-cloud';
export function reliableSocket(url, options = {}) {
    const opts = {
        reconnect: true,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 1.5,
        jitter: true,
        maxAttempts: Infinity,
        queueEnabled: true,
        maxQueueSize: 100,
        maxQueueAge: 300000,
        queueKey: `reliable-socket:queue:${url}`,
        ...options,
    };
    let socket = null;
    let status = 'closed';
    let reconnectAttempts = 0;
    let reconnectTimer = null;
    let allowReconnect = opts.reconnect;
    const statusListeners = new Set();
    const messageListeners = new Set();
    const openListeners = new Set();
    const closeListeners = new Set();
    function setStatus(s) {
        status = s;
        statusListeners.forEach(l => l(s));
    }
    function scheduleReconnect() {
        if (reconnectAttempts >= opts.maxAttempts)
            return;
        let delay = Math.min(opts.initialDelay * opts.backoffMultiplier ** reconnectAttempts, opts.maxDelay);
        if (opts.jitter)
            delay *= 0.5 + Math.random() * 0.5;
        reconnectTimer = setTimeout(() => { reconnectAttempts++; open(); }, delay);
    }
    function open() {
        setStatus(reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
        const ws = new WebSocket(url);
        socket = ws;
        ws.onopen = () => {
            reconnectAttempts = 0;
            setStatus('open');
            openListeners.forEach(l => l());
            flushQueue();
        };
        ws.onmessage = (e) => {
            let msg;
            try {
                msg = JSON.parse(String(e.data));
            }
            catch {
                return;
            }
            messageListeners.forEach(l => l(msg));
        };
        ws.onclose = () => {
            setStatus('closed');
            closeListeners.forEach(l => l());
            if (allowReconnect)
                scheduleReconnect();
        };
        ws.onerror = () => ws.close();
    }
    function flushQueue() {
        if (status !== 'open' || !socket)
            return;
        const now = Date.now();
        const queue = (getSauron(opts.queueKey) ?? [])
            .filter(q => now - q.queuedAt <= opts.maxQueueAge);
        queue.forEach(q => socket?.send(q.raw));
        setSauron(opts.queueKey, []);
    }
    open();
    return {
        send(msg) {
            const raw = JSON.stringify(msg);
            if (status === 'open' && socket) {
                socket.send(raw);
                return;
            }
            if (!opts.queueEnabled)
                return;
            const queue = getSauron(opts.queueKey) ?? [];
            queue.push({ raw, queuedAt: Date.now() });
            if (queue.length > opts.maxQueueSize)
                queue.shift();
            setSauron(opts.queueKey, queue);
        },
        onMessage(handler) {
            messageListeners.add(handler);
            return () => { messageListeners.delete(handler); };
        },
        onConnect(handler) {
            openListeners.add(handler);
            return () => { openListeners.delete(handler); };
        },
        onDisconnect(handler) {
            closeListeners.add(handler);
            return () => { closeListeners.delete(handler); };
        },
        onStatusChange(handler) {
            statusListeners.add(handler);
            return () => { statusListeners.delete(handler); };
        },
        status() { return status; },
        queueSize() { return (getSauron(opts.queueKey) ?? []).length; },
        close() {
            allowReconnect = false;
            if (reconnectTimer)
                clearTimeout(reconnectTimer);
            socket?.close();
        },
    };
}
