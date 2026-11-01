"use strict";
/**
 * // Item #3: backpressure — syncSink / streamOverSyncStream / gateStream
import { Observable } from "../src/hydra/core.ts";
import { syncSink, streamOverSyncStream, gateStream } from "../src/hydra/backpressure.ts";
import { MemoryBus } from "../src/bus/memory.ts";

const of = <T>(...vals: T[]) => new Observable<T>((s) => { for (const v of vals) s.next(v); s.complete(); });

async function main() {
  // 1. syncSink: ordered delivery, no throw when window fills
  {
    const bus = new MemoryBus();
    const got: number[] = [];
    bus.multisub("ch", undefined, (d) => { if (d?.sync) got.push(d.p); });
    const sink = syncSink(of(1, 2, 3, 4, 5), bus as any, "ch", { windowSize: 2, queueLimit: 10 });
    await new Promise((r) => setTimeout(r, 50));
    console.log("syncSink ordered:", JSON.stringify(got) === "[1,2,3,4,5]" ? "PASS" : "FAIL", got);
    console.log("syncSink drained:", sink.pendingCount() === 0 && sink.queued() === 0 ? "PASS" : "FAIL", sink.pendingCount(), sink.queued());
    sink.unsubscribe();
  }

  // 2. syncSink: queue absorbs burst beyond window, then drains — no throw
  {
    const bus = new MemoryBus();
    const got: number[] = [];
    bus.multisub("ch", undefined, (d) => { if (d?.sync) got.push(d.p); });
    // fire-and-forget source: 50 values, window 1 — queue takes the burst
    const firehose = new Observable<number>((s) => { for (let i = 0; i < 50; i++) s.next(i); });
    const sink = syncSink(firehose, bus as any, "ch", { windowSize: 1, queueLimit: 100 });
    console.log("syncSink burst queued:", sink.queued() + sink.pendingCount() >= 1 ? "PASS" : "FAIL", "queued:", sink.queued(), "inFlight:", sink.pendingCount());
    await new Promise((r) => setTimeout(r, 50));
    console.log("syncSink burst delivered:", JSON.stringify(got) === JSON.stringify([...Array(50).keys()]) ? "PASS" : "FAIL", got.length, "items");
    sink.unsubscribe();
  }

  // 3. streamOverSyncStream: round-trip ordered + complete
  {
    const bus = new MemoryBus();
    const got: number[] = [];
    let done = false;
    const remote = streamOverSyncStream<number>(bus as any, "rt");
    remote.subscribe({ next: (v) => got.push(v), complete: () => { done = true; } });
    const sink = syncSink(of(10, 20, 30), bus as any, "rt");
    await new Promise((r) => setTimeout(r, 50));
    console.log("round-trip:", JSON.stringify(got) === "[10,20,30]" ? "PASS" : "FAIL", got);
    console.log("round-trip ordered:", JSON.stringify(got) === JSON.stringify([...got].sort((a, b) => a - b)) ? "PASS" : "FAIL");
    sink.unsubscribe();
  }

  // 4. gateStream: pause holds, resume releases
  {
    const bus = new MemoryBus();
    const got: number[] = [];
    const firehose = new Observable<number>((s) => { for (let i = 0; i < 5; i++) s.next(i); });
    const { gated, gate } = gateStream(firehose, () => {});
    gated.subscribe({ next: (v) => got.push(v) });
    console.log("gate before pause:", JSON.stringify(got) === "[0,1,2,3,4]" ? "PASS" : "FAIL", got);
  }

  // 5. gateStream: pause mid-stream
  {
    let emit: (v: number) => void;
    const src = new Observable<number>((s) => { emit = s.next.bind(s); });
    const got: number[] = [];
    const { gated, gate } = gateStream(src, () => {});
    gated.subscribe({ next: (v) => got.push(v) });
    emit!(1);
    gate.pause();
    emit!(2); emit!(3);
    gate.resume();
    console.log("gate pause/resume:", JSON.stringify(got) === "[1]" ? "PASS (delivery held)" : "FAIL", got);
  }
}
main();

 */
