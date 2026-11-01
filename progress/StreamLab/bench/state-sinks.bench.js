"use strict";
/**
 * // Item #2: state sinks — toSignal holder + toSauron write-through
import { Observable, streamFrom, toSignal, toSauron, SauronStub } from "../src/hydra/index.ts";
import { EMITTERS, streamFromEmitter } from "../src/hydra/index.ts";
const of = <T>(...vals: T[]) => new Observable<T>((sub) => { for (const v of vals) sub.next(v); sub.complete(); });

// 1. toSignal: holds latest, fires onChange, ring history
{
  const s = toSignal(of(1, 2, 3), 0, { history: 3 });
  console.log("toSignal latest:", s.get() === 3 ? "PASS" : "FAIL", s.get());
  console.log("toSignal ring:", JSON.stringify(s.history()) === "[1,2,3]" ? "PASS" : "FAIL", s.history());
  let seen: any;
  const off = s.onChange((v) => (seen = v));
  s.set(99);
  console.log("toSignal onChange:", seen === 99 ? "PASS" : "FAIL", seen);
  off();
}

// 2. toSignal over a live emitter stream
{
  const bus = new EMITTERS();
  const s = toSignal(streamFromEmitter(bus, { k: "q", sl: "t", ms: "s" }));
  bus.dispatch("q", 5, "t", "s");
  bus.dispatch("q", 7, "t", "s");
  console.log("toSignal live:", s.get() === 7 ? "PASS" : "FAIL", s.get());
}

// 3. toSauron: stream writes through into signal core
{
  const sauron = new SauronStub();
  const piped = of(10, 20).pipe(toSauron(sauron, "counter"));
  const got: any[] = [];
  piped.subscribe({ next: (v) => got.push(v) });
  console.log("toSauron passthrough:", JSON.stringify(got) === "[10,20]" ? "PASS" : "FAIL", got);
  console.log("toSauron core value:", sauron.readSignal("counter") === 20 ? "PASS" : "FAIL", sauron.readSignal("counter"));
  console.log("toSauron render invalidations:", sauron.renderInvalidations === 2 ? "PASS" : "FAIL", sauron.renderInvalidations);
}

// 4. full loop: emitter → stream → toSauron → core → subscriber
{
  const sauron = new SauronStub();
  const bus = new EMITTERS();
  const seen: any[] = [];
  sauron.subscribe("hp", (v) => seen.push(v));
  streamFromEmitter(bus, { k: "q", sl: "t", ms: "s" })
    .pipe(toSauron(sauron, "hp"));
  // need subscription — toSauron is an operator, wire via pipe into consumer
  const src = streamFromEmitter(bus, { k: "q", sl: "t", ms: "s" });
  src.pipe(toSauron(sauron, "hp2")).subscribe({ next: () => {} });
  bus.dispatch("q", 50, "t", "s");
  console.log("loop:", sauron.readSignal("hp2") === 50 ? "PASS" : "FAIL", sauron.readSignal("hp2"));
}

 */
