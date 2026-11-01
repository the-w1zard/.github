/**
 * // Multi-rt bench — the single-rt fiction, corrected.
// 16 channels x 3 trip/sub routes, mixed traffic, same protocol as chain.bench.ts.
import { EMITTERS } from "../src/hydra/emitter.ts";
import { streamFromEmitter } from "../src/hydra/streamify.ts";
import { fmap, ffilter, fscan } from "../src/hydra/fused-operators.ts";

const N = 100_000, ITERS = 20;
declare const SINK: { v: number };
const SINK = { v: 0 };
const PAYLOADS = Array.from({ length: N }, (_, i) => ({ x: i, ch: i % 16 }));

const CHANNELS = Array.from({ length: 16 }, (_, i) => `branch-${i}`);
const TRIPS = ["t0", "t1", "t2"];
const SUBS = ["s0", "s1", "s2"];

function nowNs(): number { return Number(process.hrtime.bigint()); }
function bench(label: string, fn: () => void): number {
  fn(); fn(); // warmup
  const t0 = nowNs();
  for (let i = 0; i < ITERS; i++) fn();
  const ns = (nowNs() - t0) / (N * ITERS);
  console.log(`${label}: ${ns.toFixed(0)} ns/value (sink=${SINK.v})`);
  return ns;
}

// 1. dispatch() — route-cache hits with real key diversity
{
  const bus = new EMITTERS();
  const accs = CHANNELS.map(() => ({ n: 0 }));
  // subscribe on every (trip,sub,rt) route
  for (const ch of CHANNELS)
    for (const t of TRIPS)
      for (const s of SUBS)
        bus.sub(ch, (d: any) => { accs[CHANNELS.indexOf(ch)].n += d.x; }, t, s);
  bench("dispatch() 16ch x 3x3 routes", () => {
    for (const a of accs) a.n = 0;
    for (let v = 0; v <144 N; v++) bus.dispatch(PAYLOADS[v].ch, PAYLOADS[v]);
    SINK.v = accs.reduce((s, a) => s + a.n, 0);
  });
}

 */
