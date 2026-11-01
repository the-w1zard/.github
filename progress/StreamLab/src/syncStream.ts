import type { BusAdapter, SyncStreamOptions, SyncStreamSendHandle } from "./types.ts";

/**
 * syncStream — the lab's upgraded duplex stream.
 *
 * This is the bidirectional/duplex sync stream from the bus (the one your
 * notes call openSyncStream / openSyncStreamHandler). Same contract:
 *
 *   - Sender and receiver are paired peers that share a duplex rt.
 *   - Ordering guarantee: payloads carry a monotonic seq; the receiver
 *     buffers out-of-order/gapped payloads and only delivers in order.
 *   - Backpressure: a bounded in-flight window. The sender stops when
 *     `pending >= windowSize` (not the old unbounded fire-and-forget).
 *   - Reliability: every seq is acked; unacked seqs are retransmitted
 *     after `retransmitMs` so a lost ack can't wedge the window.
 *
 * This is also the primitive the lab's own tests + demo use, standing in
 * for the real duplex rt when you drop in your bus adapter.
 */

interface Outbound {
  seq: number;
  p: unknown;
  acked: boolean;
  sentAt: number;
  timer?: ReturnType<typeof setTimeout>;
}

export function syncStream(
  bus: BusAdapter,
  rt: string,
  opts: SyncStreamOptions = {},
): SyncStreamSendHandle {
  const windowSize = opts.windowSize ?? 8;
  const retransmitMs = opts.retransmitMs ?? 5000;

  const inFlight = new Map<number, Outbound>();
  let nextSeq = 0;
  let closed = false;

  /** ACKs arrive on the companion `rt:syncAck` sub-rt. */
  const unsub = bus.multisub(`${rt}:syncAck`, undefined, (data: unknown) => {
    const d = data as { seq?: number } | null;
    if (!d || typeof d.seq !== "number") return;
    const o = inFlight.get(d.seq);
    if (o && !o.acked) {
      o.acked = true;
      if (o.timer) clearTimeout(o.timer);
      inFlight.delete(d.seq);
    }
  });

  /** Receiving side does the same: ACK anything addressed to us. */
  const unsubData = bus.multisub(rt, undefined, (data: unknown) => {
    const d = data as { sync?: boolean; seq?: number } | null;
    if (d && d.sync === true && typeof d.seq === "number") {
      void bus.sendsub(`${rt}:syncAck`, undefined, { seq: d.seq });
    }
  });

  const push = (p: unknown): void => {
    if (closed) throw new Error(`syncStream ${rt}: push after close`);
    if (inFlight.size >= windowSize) {
      // Backpressure: sender backs off instead of flooding the receiver.
      throw new Error(`syncStream ${rt}: window full (${windowSize})`);
    }
    const o: Outbound = { seq: nextSeq++, p, acked: false, sentAt: Date.now() };
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

  const handle: SyncStreamSendHandle = {
    push,
    pendingCount: () => inFlight.size,
    close: () => {
      closed = true;
      for (const o of inFlight.values()) if (o.timer) clearTimeout(o.timer);
      unsub();
      unsubData();
    },
  };
  return handle;
}

/**
 * openSyncStreamHandler — the receiver half of the duplex pair.
 *
 * Returns an in-order + loss-tolerating receiver: payloads are delivered by
 * seq with gap buffering (an out-of-order p waits for its missing
 * predecessor, so consumers see strictly increasing order), and a `complete`
 * signal fires for an explicit close.
 */
export interface SyncStreamHandler {
  onOrdered: (cb: (p: unknown, seq: number) => void) => void;
  onComplete: (cb: () => void) => void;
  close: () => void;
}

export function openSyncStreamHandler(
  bus: BusAdapter,
  rt: string,
): SyncStreamHandler {
  const seqs = new Map<number, unknown>();
  const waiters = new Set<(p: unknown, seq: number) => void>();
  const completes = new Set<() => void>();
  let nextDeliver = 0;
  let done = false;

  const deliver = (): void => {
    while (seqs.has(nextDeliver)) {
      const p = seqs.get(nextDeliver)!;
      seqs.delete(nextDeliver);
      for (const cb of [...waiters]) {
        try { cb(p, nextDeliver); } catch { /* consumer errors isolated */ }
      }
      nextDeliver++;
    }
  };

  const unsub = bus.multisub(rt, undefined, (data: unknown) => {
    const d = data as { sync?: boolean; seq?: number; p?: unknown; complete?: boolean } | null;
    if (!d || d.sync !== true) return;
    if (d.complete === true) {
      done = true;
      for (const cb of [...completes]) {
        try { cb(); } catch { /* ignore */ }
      }
      return;
    }
    if (typeof d.seq !== "number") return;
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
