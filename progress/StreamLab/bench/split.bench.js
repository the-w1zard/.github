"use strict";
/**
 * // split-path bench: sendSync vs sendAsync ordering + fusion through sync path.
import { Observable, streamFromEmitter, streamToEmitter, EMITTERS, pipeFused, fmap, ffilter } from "../src/hydra/index.ts";

// 1. sync: inline ordering — subscriber sees value before sendSync returns
{
  const bus = new EMITTERS();
  const got: number[] = [];
  bus.sub("n", (v) => got.push(v), "T", "S", "C");
  bus.send(1, "n", "T", "S", "C").sendSync();
  console.log("sendSync inline:", got.length === 1 && got[0] === 1 ? "PASS" : "FAIL", got);
}

// 2. async: deferred to microtask
{
  const bus = new EMITTERS();
  const got: number[] = [];
  bus.sub("n", (v) => got.push(v), "T", "S", "C");
  bus.send(1, "n", "T", "S", "C").sendAsync();
  console.log("sendAsync deferred (empty now):", got.length === 0 ? "PASS" : "FAIL", got);
  setTimeout(() => console.log("sendAsync deferred (after tick):", got[0] === 1 ? "PASS" : "FAIL", got), 2);
}

// 3. fusion through sync path — measure
{
  const bus = new EMITTERS();
  let n = 0;
  bus.sub("hot", () => n++, "T", "S", "C");
  const N = 100_000, ITERS = 20;
  const t0 = performance.now() * 1e6;
  for (let i = 0; i < ITERS; i++)
    for (let j = 0; j < N; j++)
      bus.send(j, "hot", "T", "S", "C").sendSync();
  const t1 = (performance.now() * 1e6);
  console.log(`emitter sendSync: ${((t1 - t0) / (N * ITERS)).toFixed(0)} ns/value`);
}

// 4. streamToEmitter now sync — round trip without awaiting microtask
{
  const bus = new EMITTERS();
  const out: any[] = [];
  streamFromEmitter(bus, { k: "m", sl: "T" }).subscribe({ next: (v) => out.push(v) });
  const src = new Observable<number>((sub) => { sub.next("x"); sub.next("y"); sub.complete(); });
  streamToEmitter(src, bus, { k: "m", sl: "T" });
  console.log("sync round-trip:", JSON.stringify(out) === '["x","y"]' ? "PASS" : "FAIL", out);
}

// 5. async operators still work via sendAsync
{
  const bus = new EMITTERS();
  let val: any;
  bus.sub("a", (v) => { val = v; }, "T", "S", "C");
  bus.send(1, "a", "T", "S", "C")
    .map(async (v) => v * 2)
    .sendAsync();
  setTimeout(() => console.log("sendAsync async-op:", val === 2 ? "PASS" : "FAIL", val), 5);
}

 */
