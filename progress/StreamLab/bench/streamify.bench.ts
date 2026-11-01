/**
 * // streamify tests: emitter zero-cost path, universal front door, signal replay.
import { Observable, streamFrom, streamFromEmitter, streamFromSignal, streamToEmitter, EMITTERS, pipeFused, fmap, ffilter } from "../src/hydra/index.ts";

// ─── 1. emitter → stream, fused on top, values flow ───
{
  const bus = new EMITTERS();
  const got: number[] = [];
  const obs = streamFromEmitter(bus, { k: "ticks", sl: "T1" });
  pipeFused(obs, fmap((v: number) => v * 10), ffilter((v: number) => v > 20))
    .subscribe({ next: (v) => got.push(v) });
  bus.emit("ticks", 1, "T1");
  bus.emit("ticks", 2, "T1");
  bus.emit("ticks", 3, "T1");
  
  
  console.log("emitter→fused:", JSON.stringify(got) === "[30]" ? "PASS" : "FAIL", got); // 1*10=10 filtered, 2*10=20 filtered, 3*10=30
}

// ─── 2. round-trip: stream → emitter → stream ───
{ (async () => {
  const bus = new EMITTERS();
  const out: any[] = [];
  const src = new Observable<number>((sub) => { sub.next("a"); sub.next("b"); sub.complete(); });
  streamFromEmitter(bus, { k: "mirror", sl: "T2" }).subscribe({ next: (v) => out.push(v) });
  const stop = streamToEmitter(src, bus, { k: "mirror", sl: "T2" });
  await new Promise(r => setTimeout(r, 5)); // EmitterChain.send() is async
  console.log("round-trip:", JSON.stringify(out) === '["a","b"]' ? "PASS" : "FAIL", out);
  stop();
})().catch((e) => console.error("round-trip async error:", e));
}

// ─── 3. universal front door: array, promise, asyncIterable, ReadableStream ───
{
  const results: string[] = [];
  streamFrom([1, 2, 3]).subscribe({ next: (v) => results.push(`arr:${v}`), complete: () => results.push("arr:done") });

  streamFrom(Promise.resolve(99)).subscribe({ next: (v) => results.push(`p:${v}`), complete: () => results.push("p:done") });

  async function* gen() { yield "g1"; yield "g2"; }
  streamFrom(gen()).subscribe({ next: (v) => results.push(`ai:${v}`), complete: () => results.push("ai:done") });

  const rs = new ReadableStream({ start(c) { c.enqueue("r1"); c.enqueue("r2"); c.close(); } });
  streamFrom(rs).subscribe({ next: (v) => results.push(`rs:${v}`), complete: () => results.push("rs:done") });

  setTimeout(() => {
    console.log("streamFrom:", results.join(" | "));
    const pass = results.length === 12 && results[0] === "arr:1" && results[3] === "arr:done" && results.includes("p:99") && results.includes("rs:done") && results.includes("ai:done");
    console.log("streamFrom:", pass ? "PASS" : "FAIL");
  }, 10);
}

// ─── 4. signal surface: replay + live updates ───
{
  const listeners = new Map<string, Set<Function>>();
  const state = new Map<string, any>([["count", 5]]);
  const sauron = {
    readSignal: (k: string) => state.get(k),
    subscribeSignal: (k: string, fn: Function) => {
      if (!listeners.has(k)) listeners.set(k, new Set());
      listeners.get(k)!.add(fn);
      return () => listeners.get(k)!.delete(fn);
    },
  };
  const got: any[] = [];
  streamFromSignal(sauron, "count").subscribe({ next: (v) => got.push(v) });
  state.set("count", 6);
  listeners.get("count")!.forEach((fn) => fn(6));
  console.log("signal replay+live:", got.length === 2 && got[0] === 5 && got[1] === 6 ? "PASS" : "FAIL", got);
}

 */
