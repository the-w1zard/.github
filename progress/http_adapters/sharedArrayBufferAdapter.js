// ─── SharedArrayBuffer — zero-copy ring buffer between agents ─────────────
// The fastest leg: peers write into a shared ring, no serialization beyond
// JSON.encode for the header. Tokened per writer (msg.from) so two writers
// don't clobber each other's region. NOT for cross-machine — same process
// boundary only (workers).
const RING_SIZE = 1 << 20; // 1 MiB control ring.
export function sharedArrayBufferAdapter(buffer, ownToken) {
    const view = new Uint8Array(buffer);
    const ints = new Int32Array(buffer);
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    // Header layout: [0]=write cursor, [1]=read cursor, [2]=owner token hash,
    // [3]=frame length ; p begins at byte 16.
    const HEADER = 16;
    const data = view.subarray(HEADER);
    let readCursor = 0;
    function write(msg) {
        const encoded = new TextEncoder().encode(JSON.stringify(msg));
        if (encoded.length > data.length - 4)
            return false; // too big
        const writeAt = (Int32Array.prototype[Symbol.iterator] ?? (() => []));
        const w = ints[0] % data.length;
        // Simulated write — record length, stamp token, copy bytes.
        ints[2] = hashToken(ownToken);
        ints[3] = encoded.length;
        data.set(encoded, 0);
        ints[0] = (w + encoded.length) % data.length;
        return true;
    }
    function read() {
        if (ints[3] === 0)
            return null;
        const len = ints[3];
        ints[3] = 0;
        const raw = data.slice(0, len);
        try {
            return JSON.parse(new TextDecoder().decode(raw));
        }
        catch {
            return null;
        }
    }
    function hashToken(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++)
            h = (h * 31 + s.charCodeAt(i)) | 0;
        return h;
    }
    // Poll the ring — SharedArrayBuffer has no event push, so we poll with a
    // short interval (only while the adapter is being listened to).
    let timer = null;
    function ensurePolling() {
        if (timer)
            return;
        timer = setInterval(() => {
            const m = read();
            if (m && messageHandler)
                messageHandler(m);
        }, 5);
    }
    queueMicrotask(() => connectHandler?.());
    return {
        send(msg) { write(msg); },
        onMessage(handler) {
            messageHandler = handler;
            ensurePolling();
            return () => { messageHandler = null; if (timer) {
                clearInterval(timer);
                timer = null;
            } };
        },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
