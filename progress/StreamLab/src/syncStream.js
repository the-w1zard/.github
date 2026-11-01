export function syncStream(bus, rt, opts = {}) {
    const windowSize = opts.windowSize ?? 8;
    const retransmitMs = opts.retransmitMs ?? 5000;
    const inFlight = new Map();
    let nextSeq = 0;
    let closed = false;
    /** ACKs arrive on the companion `rt:syncAck` sub-rt. */
    const unsub = bus.multisub(`${rt}:syncAck`, undefined, (data) => {
        const d = data;
        if (!d || typeof d.seq !== "number")
            return;
        const o = inFlight.get(d.seq);
        if (o && !o.acked) {
            o.acked = true;
            if (o.timer)
                clearTimeout(o.timer);
            inFlight.delete(d.seq);
        }
    });
    /** Receiving side does the same: ACK anything addressed to us. */
    const unsubData = bus.multisub(rt, undefined, (data) => {
        const d = data;
        if (d && d.sync === true && typeof d.seq === "number") {
            void bus.sendsub(`${rt}:syncAck`, undefined, { seq: d.seq });
        }
    });
    const push = (p) => {
        if (closed)
            throw new Error(`syncStream ${rt}: push after close`);
        if (inFlight.size >= windowSize) {
            // Backpressure: sender backs off instead of flooding the receiver.
            throw new Error(`syncStream ${rt}: window full (${windowSize})`);
        }
        const o = { seq: nextSeq++, p, acked: false, sentAt: Date.now() };
        inFlight.set(o.seq, o);
        const send = () => void bus.sendsub(rt, undefined, { sync: true, seq: o.seq, p: o.p });
        send();
        const arm = () => {
            o.timer = setTimeout(() => {
                if (!o.acked) {
                    // Retransmit — the receiver's gap buffer tolerates the duplicate.
                    // Re-arm until acked so persistent loss doesn't kill the stream.
                    send();
                    arm();
                }
            }, retransmitMs);
        };
        arm();
    };
    const handle = {
        push,
        pendingCount: () => inFlight.size,
        close: () => {
            closed = true;
            for (const o of inFlight.values())
                if (o.timer)
                    clearTimeout(o.timer);
            unsub();
            unsubData();
        },
    };
    return handle;
}
export function openSyncStreamHandler(bus, rt) {
    const seqs = new Map();
    const waiters = new Set();
    const completes = new Set();
    let nextDeliver = 0;
    let done = false;
    const deliver = () => {
        while (seqs.has(nextDeliver)) {
            const p = seqs.get(nextDeliver);
            seqs.delete(nextDeliver);
            for (const cb of [...waiters]) {
                try {
                    cb(p, nextDeliver);
                }
                catch { /* consumer errors isolated */ }
            }
            nextDeliver++;
        }
    };
    const unsub = bus.multisub(rt, undefined, (data) => {
        const d = data;
        if (!d || d.sync !== true)
            return;
        if (d.complete === true) {
            done = true;
            for (const cb of [...completes]) {
                try {
                    cb();
                }
                catch { /* ignore */ }
            }
            return;
        }
        if (typeof d.seq !== "number")
            return;
        if (d.seq >= nextDeliver && !seqs.has(d.seq)) {
            seqs.set(d.seq, d.p);
            deliver();
        }
    });
    return {
        onOrdered(cb) { waiters.add(cb); },
        onComplete(cb) { completes.add(cb); },
        close() { unsub(); waiters.clear(); completes.clear(); },
    };
}
