"use strict";
/**
 * // Item #6: HYDRA-native transport — relay / pipeline / route / bridge over the bus
import { EMITTERS } from "../src/hydra/emitter.ts";
import { relayStream, fromRelay, pipelineStream, route, fromBusChannel, toBusChannel, bridge } from "../src/hydra/transport.ts";

const bus = new EMITTERS();

// 1. relayStream: ordered fan-out to 2 channels
{
  const a: number[] = [], b: number[] = [];
  fromRelay<number>(bus, "out:a").subscribe((v) => a.push(v));
  fromRelay<number>(bus, "out:b").subscribe((v) => b.push(v));
  const r = relayStream(bus, "ingest", ["out:a", "out:b"]);
  bus.dispatch("ingest", 1);
  bus.dispatch("ingest", 2);
  console.log("relay fan-out:", JSON.stringify(a) === "[1,2]" && JSON.stringify(b) === "[1,2]" ? "PASS" : "FAIL", a, b);
  r.unsubscribe();
}

// 2. pipelineStream: stages run in order, result on :result
{
  const got: number[] = [];
  fromBusChannel<number>(bus, "pl:in:result").subscribe((v) => got.push(v));
  const p = pipelineStream<number>(bus, "pl:in", [
    { name: "double", handler: (v) => v * 2 },
    { name: "plusOne", handler: (v) => v + 1 },
  ]);
  bus.dispatch("pl:in", 5);
  console.log("pipeline stages:", JSON.stringify(got) === "[11]" ? "PASS" : "FAIL", got);
  p.unsubscribe();
}

// 3. route: key-based switchboard
{
  const evens: any[] = [], odds: any[] = [];
  fromBusChannel<any>(bus, "sb:even").subscribe((v) => evens.push(v));
  fromBusChannel<any>(bus, "sb:odd").subscribe((v) => odds.push(v));
  const r = route<number>(bus, "sb:in", (v) => (v % 2 === 0 ? "even" : "odd"), "sb:");
  bus.dispatch("sb:in", 1);
  bus.dispatch("sb:in", 2);
  bus.dispatch("sb:in", 3);
  console.log("route switchboard:", JSON.stringify(evens) === "[2]" && JSON.stringify(odds) === "[1,3]" ? "PASS" : "FAIL", "even:", evens, "odd:", odds);
  const stats = r.stats();
  console.log("route stats:", stats.even === 1 && stats.odd === 2 ? "PASS" : "FAIL", stats);
  r.unsubscribe();
}

// 4. bridge: two buses, values cross the seam both ways
{
  const busA = new EMITTERS(), busB = new EMITTERS();
  const onB: number[] = [], local: number[] = [];
  fromBusChannel<number>(busB, "data").subscribe((v) => onB.push(v));
  fromBusChannel<number>(busA, "local").subscribe((v) => local.push(v));
  const br = bridge(busA, "data", busB, "data");
  busA.dispatch("data", 99);
  console.log("bridge fwd:", JSON.stringify(onB) === "[99]" && local.length === 0 ? "PASS" : "FAIL", "B saw:", onB);
  br.unsubscribe();
  busA.dispatch("data", 100);
  console.log("bridge teardown:", onB.length === 1 ? "PASS" : "FAIL", onB);
}

// 5. toBusChannel: stream operator writes to the bus
{
  const got: number[] = [];
  fromBusChannel<number>(bus, "tap:out").subscribe((v) => got.push(v));
  fromBusChannel<number>(bus, "tap:in").pipe(toBusChannel(bus, "tap:out")).subscribe({ next: () => {} });
  bus.dispatch("tap:in", 42);
  console.log("toBusChannel tap:", JSON.stringify(got) === "[42]" ? "PASS" : "FAIL", got);
}

// 6. bridge bidirectional with distinct channels (no echo possible)
{
  const busA = new EMITTERS(), busB = new EMITTERS();
  const onB: number[] = [], onA: number[] = [];
  fromBusChannel<number>(busB, "chB").subscribe((v) => onB.push(v));
  fromBusChannel<number>(busA, "chA").subscribe((v) => onA.push(v));
  const br = bridge(busA, "chA", busB, "chB", { bidirectional: true });
  busA.dispatch("chA", 1);
  busB.dispatch("chB", 2);
  // self-hearing: each bus's own listener sees its own dispatch too, so
  // onB=[1] (fwd) and onA=[2] (rev) — the echo from the OTHER side is what
  // the loop guard blocks. onB must NOT contain 2, onA must NOT contain 1.
  // Correct semantics for bidirectional bridge: each bus sees BOTH values —
  // its own (self-hearing dispatch) and the remote one (via the bridge).
  // The loop guard guarantees no value is duplicated by reflection.
  console.log("bridge bidirectional:", JSON.stringify(onB) === "[1,2]" && JSON.stringify(onA) === "[1,2]" ? "PASS" : "FAIL", "B:", onB, "A:", onA);
  br.unsubscribe();
}

// 7. bridge with transform
{
  const busA = new EMITTERS(), busB = new EMITTERS();
  const got: number[] = [];
  fromBusChannel<number>(busB, "n").subscribe((v) => got.push(v));
  const br = bridge(busA, "n", busB, "n", { transform: (v: number) => v * 10 });
  busA.dispatch("n", 7);
  console.log("bridge transform:", JSON.stringify(got) === "[70]" ? "PASS" : "FAIL", got);
  br.unsubscribe();
}

 */
