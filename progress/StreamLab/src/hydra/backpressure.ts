// bus/hydra/backpressure.ts — item #3: backpressure wiring.
//
// syncStream already owns the mechanics (bounded in-flight window, per-seq
// acks, retransmit). But its push() THROWS when the window is full — fine
// for the demo, wrong for a stream consumer, which should PAUSE.
//
// This file wires the pause-aware layer:
//
//   syncSink(stream, bus, rt, opts)
//     → Observable consumer that pushes into syncStream with a bounded
//       queue; when the in-flight window is full it stops pulling from the
//       stream and resumes on acks. Backpressure flows upstream.
//
//   streamOverSyncStream(bus, rt, opts)
//     → Observable over the RECEIVER half (openSyncStreamHandler), so a
//       remote stream becomes a local one, in order, loss-tolerating.
//
//   syncOverStream(stream, ...)
//     → inverse: local stream → remote handler (the sender side, acked).
//
//   gateStream(source, opts)
//     → wraps any Observable with an explicit pause/resume gate, exposing
//       window-limited pull semantics even without syncStream underneath.

import { Observable } from "./core.ts";
import type { Teardown } from "./core.ts";
import type { BusAdapter } from "../types.ts";
import type { SyncStreamSendHandle, SyncStreamOptions } from "../types.ts";
import { syncStream, openSyncStreamHandler } from "../syncStream.ts";

/** A pause/resume gate for live streams. */
export interface StreamGate {
  paused: boolean;
  pause(): void;
  resume(): void;
}

/**
 * syncSink — subscribe to a stream, push through syncStream with an
 * acked, bounded window. Never throws; the window fills the QUEUE, and
 * the queue drains as acks arrive. `pendingCount()` and `flush()` expose
 * the state; `close()` closes the handle and the subscription.
 */
export function syncSink<T>(
  source: Observable<T>,
  bus: BusAdapter,
  rt: string,
  opts: SyncStreamOptions & { /** max items held while window is full (default 64) */ queueLimit?: number } = {},
): { unsubscribe: () => void; pendingCount: () => number; queued: () => number; flush: () => void } {
  const windowSize = opts.windowSize ?? 8;
  const queueLimit = opts.queueLimit ?? 64;
  const handle: SyncStreamSendHandle = syncStream(bus, rt, opts);
  const queue: T[] = [];
  let paused = false;
  let down = false;

  const drain = (): void => {
    while (!down && handle.pendingCount() < windowSize && queue.length > 0) {
      handle.push(queue.shift()!);
    }
    paused = queue.length > 0 || handle.pendingCount() >= windowSize;
  };

  // Acks free window slots → drain. We subscribe directly to the ack
  // rt so we don't poll; syncStream deletes acked seqs from its
  // in-flight map, so pendingCount() reflects them immediately.
  const unsubAck = bus.multisub(`${rt}:syncAck`, undefined, drain);

  const unsubSrc = source.subscribe({
    next: (v) => {
      if (down) return;
      if (handle.pendingCount() < windowSize && queue.length === 0) {
        handle.push(v);
        paused = handle.pendingCount() >= windowSize;
      } else if (queue.length < queueLimit) {
        queue.push(v);
      } else {
        // Queue limit hit: drop with a warning. (Alternatives: error or
        // force-flush; drop is the least surprising for live streams.)
        console.warn(`[syncSink ${rt}]: queue limit ${queueLimit} hit — dropping value`);
      }
    },
    error: (e) => console.error(`[syncSink ${rt}]:`, e),
  });

  return {
    unsubscribe: () => { down = true; unsubSrc(); unsubAck(); handle.close(); },
    pendingCount: () => handle.pendingCount(),
    queued: () => queue.length,
    flush: drain,
  };
}

/**
 * streamOverSyncStream — the receiver half as an Observable.
 * Ordered, gap-buffered, completes on the sender's explicit close.
 */
export function streamOverSyncStream<T = any>(
  bus: BusAdapter,
  rt: string,
): Observable<T> {
  return new Observable<T>((sub) => {
    const handler = openSyncStreamHandler(bus, rt);
    handler.onOrdered((p) => sub.next(p as T));
    handler.onComplete(() => sub.complete());
    return () => handler.close();
  });
}

/**
 * syncOverStream — the sender half as a terminal. Pushes each stream value
 * through the acked window; backpressure pauses the SOURCE side when the
 * window is full (via the returned gate, or automatically for pull sources
 * that expose a gate).
 */
export function syncOverStream<T>(
  stream: Observable<T>,
  bus: BusAdapter,
  rt: string,
  opts: SyncStreamOptions & { queueLimit?: number } = {},
): { unsubscribe: () => void; pendingCount: () => number; queued: () => number } {
  const sink = syncSink(stream, bus, rt, opts);
  return { unsubscribe: sink.unsubscribe, pendingCount: sink.pendingCount, queued: sink.queued };
}

/**
 * gateStream — attach a manual gate to a live source. `pause()` stops
 * delivery (values buffered by the source's own semantics), `resume()`
 * releases them. In HYDRA the emitter is push-based, so pause/resume wraps
 * the listener, not the source.
 */
export function gateStream<T>(
  source: Observable<T>,
  onGate: (paused: boolean) => void,
): { gated: Observable<T>; gate: StreamGate } {
  let paused = false;
  const gate: StreamGate = {
    get paused() { return paused; },
    pause() { paused = true; onGate(true); },
    resume() { paused = false; onGate(false); },
  };
  const gated = new Observable<T>((sub) => {
    return source.subscribe({
      next: (v) => { if (!paused) sub.next(v); },
      error: (e) => sub.error(e),
      complete: () => sub.complete(),
    });
  });
  return { gated, gate };
}
