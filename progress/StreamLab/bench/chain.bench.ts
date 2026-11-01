/**
 * // EmitterChain bench — the stream that was inside the emitter all along.
// Same protocol as fusion.bench.ts: 4-op sync chain, 100k values x 20 iters.
import { EMITTERS } from "../src/hydra/emitter.ts";
import { streamFromEmitter } from "../src/hydra/streamify.ts";
import { fmap, ffilter, fscan, ftap } from "../src/hydra/fused-operators.ts";

const N = 100_000, ITERS = 20;
const PAYLOADS = Array.from({ length: N }, (_, i) => ({ x: i })); // preallocated, matches fusion bench protocol
const ops4 = [ // identical work to the fusion bench's 4-op chain
  (d: any) => d.x,            // pluck
  (x: any) => x > 0 ? x : null, // filter (null = filtered out, chain idiom)
  (x: any) => x * 2,          // map
  (acc_box: any, x: any) => (acc_box.n += x, acc_box), // scan-ish
];

function nowNs(): number { return Number(process.hrtime.bigint()); }

declare const SINK: { v: number };
const SINK = { v: 0 }; // forces the JIT to keep the work

function bench(label: string, fn: () => void): number {
  fn(); fn();
  const t0 = nowNs();
  for (let i = 0; i < ITERS; i++) fn();
  const t1 = nowNs();
  const ns = (t1 - t0) / (N * ITERS);
  console.log(`${label}: ${ns.toFixed(0)} ns/value  (sink=${SINK.v})`);
  return ns;
}

// --- 1. Reused chain (best case: allocate once, sendSync N times) ---
{
  const bus = new EMITTERS();
  const acc = { n: 0 };
  const chain = bus.send({ x: 0 }, "data", "trip", "sub", "ch");
  chain.map((d: any) => d.x)
       .filter((x: any) => x > 0)
       .map((x: any) => x * 2)
       .subscribe((x: number) => { acc.n += x; });
  bench("EmitterChain reused (4 ops)", () => {
    acc.n = 0;
    for (let v = 0; v < N; v++) { chain.data = PAYLOADS[v]; chain.sendSync(); }
    SINK.v = acc.n;
  });
}

// --- 2. Fresh chain per send (realistic bus.send() usage) ---
{
  const bus = new EMITTERS();
  const acc = { n: 0 };
  bench("EmitterChain fresh per send (4 ops)", () => {
    acc.n = 0;
    for (let v = 0; v < N; v++) {
      bus.send({ x: v }, "data2", "trip", "sub", "ch")
         .map((d: any) => d.x)
         .filter((x: any) => x > 0)
         .map((x: any) => x * 2)
         .subscribe((x: number) => { acc.n += x; })
         .sendSync();
    }
    SINK.v = acc.n;
  });
}

// --- 3. Zero-op chain: just sendSync passthrough ---
{
  const bus = new EMITTERS();
  const chain = bus.send({ x: 0 }, "data3", "trip", "sub", "ch");
  chain.subscribe((x: any) => { SINK.v += x.x; });
  bench("EmitterChain reused (0 ops)", (vals) => {
    SINK.v = 0;
    for (let v = 0; v < N; v++) { chain.data = PAYLOADS[v]; chain.sendSync(); }
  });
}

// --- 4. dispatch() for reference (zero-alloc path) ---
{
  const bus = new EMITTERS();
  const acc = { n: 0 };
  bus.sub("data4", (d: any) => { acc.n += d.x; });
  bench("bus.dispatch() reference", () => {
    SINK.v = acc.n = 0;
    for (let v = 0; v < N; v++) bus.dispatch("data4", PAYLOADS[v]);
    SINK.v = acc.n;
  });
}

// --- 5. Fused stream for reference (item #5 result: ~54ns) ---
{
  const bus = new EMITTERS();
  let sink = 0;
  streamFromEmitter<number>(bus, { k: "fused" })
    .pipe(fmap((d: any) => d.x), ffilter((x: number) => x > 0), fscan((a: number, x: number) => a + x, 0))
    .subscribe({ next: (x) => { sink = x; } });
  bench("HYDRA fused (reference)", () => {
    SINK.v = 0;
    for (let v = 0; v < N; v++) bus.dispatch("fused", PAYLOADS[v]);
    SINK.v = sink;
  });
}
 */
