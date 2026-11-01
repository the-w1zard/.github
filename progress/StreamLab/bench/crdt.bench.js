"use strict";
/**
 * // Item #7: CRDT layer — LWW / PN / OR / MV over the bus
import { EMITTERS } from "../src/hydra/emitter.ts";
import { HLC } from "../src/hydra/crdt/hlc.ts";
import { LWW_REGISTER } from "../src/hydra/crdt/lww-register.ts";
import { PN_COUNTER } from "../src/hydra/crdt/pn-counter.ts";
import { OR_SET } from "../src/hydra/crdt/or-set.ts";
import { MV_REGISTER } from "../src/hydra/crdt/mv-register.ts";
import { crdtChannel, mergeAtSink, broadcastOp, crdtStream } from "../src/hydra/crdt/crdt-stream.ts";

// 1. LWW: concurrent writes resolve deterministically across replicas
{
  const a = new HLC("a"), b = new HLC("b");
  const r1 = new LWW_REGISTER<number>("a", a), r2 = new LWW_REGISTER<number>("b", b);
  r1.set(1); r2.set(2);
  r1.merge(r2.getState()); r2.merge(r1.getState());
  const v1 = r1.get(), v2 = r2.get();
  console.log("LWW convergence:", v1 === v2 ? "PASS" : "FAIL", v1);
}

// 2. PN counter: concurrent increments never lost, delta merge
{
  const c1 = new PN_COUNTER("a"), c2 = new PN_COUNTER("b");
  c1.increment(3); c2.increment(5);
  c1.merge(c2.delta()); c2.merge(c1.delta());
  console.log("PN counter:", c1.value() === 8 && c2.value() === 8 ? "PASS" : "FAIL", c1.value(), c2.value());
}

// 3. OR-Set: add-wins over concurrent remove
{
  const s1 = new OR_SET<string>("a", new HLC("a")), s2 = new OR_SET<string>("b", new HLC("b"));
  s1.add("x");
  s2.merge(s1.getState());
  s1.remove("x"); s2.add("x"); // concurrent: s2's add happens after seeing x
  s1.merge(s2.getState()); s2.merge(s1.getState());
  console.log("OR-set add-wins:", s1.has("x") && s2.has("x") ? "PASS" : "FAIL", s1.values(), s2.values());
}

// 4. MV-Register: divergence observable, then collapse
{
  const a = new HLC("a"), b = new HLC("b");
  const r1 = new MV_REGISTER<string>("a", a);
  const r2 = new MV_REGISTER<string>("b", b);
  r1.set("base"); r2.merge(r1.getState()); // shared baseline: same stamp, no divergence
  r1.set("A2"); r2.set("B2");                       // concurrent divergence
  r1.merge(r2.getState()); r2.merge(r1.getState());
  console.log("MV divergence kept:", r1.concurrency() === 2 && r2.concurrency() === 2 ? "PASS" : "FAIL", r1.values());
  const w1 = r1.collapse(), w2 = r2.collapse();
  console.log("MV collapse converges:", w1 === w2 && w1 !== undefined ? "PASS" : "FAIL", w1);
}

// 5. CRDT over the bus: ops flow, both replicas converge
{
  const bus = new EMITTERS();
  const a = new HLC("a"), b = new HLC("b");
  const r1 = new LWW_REGISTER<number>("a", a), r2 = new LWW_REGISTER<number>("b", b);
  const s1 = crdtStream(r1, bus, "hp"), s2 = crdtStream(r2, bus, "hp");
  r1.set(42); s1.publish();
  // self-hearing: r1's own broadcast comes back to its sink — idempotent merge
  // r2 receives via the same rt
  r2.set(7); s2.publish();
  console.log("bus CRDT converged:", r1.get() === r2.get() ? "PASS" : "FAIL", r1.get(), r2.get());
  s1.unsubscribe(); s2.unsubscribe();
}

// 6. MV over the bus: divergence visible on both sides before collapse
{
  const bus = new EMITTERS();
  const a = new HLC("a"), b = new HLC("b");
  const m1 = new MV_REGISTER<string>("a", a);
  const m2 = new MV_REGISTER<string>("b", b);
  const t1 = crdtStream(m1, bus, "mv"), t2 = crdtStream(m2, bus, "mv");
  m1.set("base"); t1.publish(); // shared baseline arrives at m2
  m1.set("A2"); t1.publish();
  m2.set("B2"); t2.publish();
  console.log("MV bus divergence:", m1.concurrency() === 2 && m2.concurrency() === 2 ? "PASS" : "FAIL", m1.values());
  m1.collapse(); m2.collapse();
  console.log("MV bus collapse:", m1.get() === m2.get() ? "PASS" : "FAIL", m1.get());
  t1.unsubscribe(); t2.unsubscribe();
}

// 7. PN over the bus, delta only
{
  const bus = new EMITTERS();
  const c1 = new PN_COUNTER("a"), c2 = new PN_COUNTER("b");
  const u1 = mergeAtSink(c1, bus, "cnt");
  c2.increment(9);
  bus.emit(crdtChannel("cnt"), c2.delta());
  console.log("PN bus delta:", c1.value() === 9 ? "PASS" : "FAIL", c1.value());
  u1();
}

// 8. OR-set over the bus
{
  const bus = new EMITTERS();
  const s1 = new OR_SET<string>("a", new HLC("a"));
  mergeAtSink(s1, bus, "set");
  const s2 = new OR_SET<string>("b", new HLC("b"));
  s2.add("k");
  bus.emit(crdtChannel("set"), s2.getState());
  console.log("OR bus merge:", s1.has("k") ? "PASS" : "FAIL", s1.values());
}

 */
