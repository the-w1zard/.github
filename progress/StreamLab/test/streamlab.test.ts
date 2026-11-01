/**
 * import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createStreamLab, MemoryBus, Mesh, Pipeline, Plinko, StreamRelay, Switchboard,
  openSyncStreamHandler, syncStream,
} from "../../stream_lab_ss.js";

async function flush(): Promise<void> { await new Promise((r) => setTimeout(r, 5)); }

describe("syncStream — duplex ordered stream", () => {
  it("delivers in order with gap buffering", async () => {
    const bus = new MemoryBus();
    const sender = syncStream(bus, "duplex", { windowSize: 16, retransmitMs: 50 });
    const receiver = openSyncStreamHandler(bus, "duplex");
    const got: number[] = [];
    receiver.onOrdered((p) => {
      if (typeof p === "number") got.push(p);
    });
    sender.push(1);
    sender.push(2);
    sender.push(3);
    await flush();
    assert.deepEqual(got, [1, 2, 3]);
    sender.close();
    receiver.close();
  });

  it("acks clear the in-flight window", async () => {
    const bus = new MemoryBus();
    const sender = syncStream(bus, "duplex", { windowSize: 2, retransmitMs: 30 });
    const receiver = openSyncStreamHandler(bus, "duplex");
    receiver.onOrdered(() => {});
    sender.push("a");
    sender.push("b");
    await flush();
    assert.equal(sender.pendingCount(), 0);
    sender.close();
    receiver.close();
  });

  it("does not flood past the window", async () => {
    const bus = new MemoryBus();
    const sender = syncStream(bus, "duplex", { windowSize: 1, retransmitMs: 1000000 });
    const receiver = openSyncStreamHandler(bus, "duplex");
    receiver.onOrdered(() => {});
    sender.push("a");
    // With a 1-slot window, a second push while the first is unacked must throw.
    assert.throws(() => sender.push("b"), /window full/);
    sender.close();
    receiver.close();
  });

  it("handles a dropped p via retransmit", async () => {
    const bus = new MemoryBus();
    // Keep ACKs flowing for everything EXCEPT seq 1 — the ack for 1 is
    // swallowed, so the window stays occupied and retransmit must re-send.
    const original = bus.sendsub.bind(bus);
    bus.sendsub = (rt, sub, data) => {
      const d = data as { seq?: number; sync?: boolean };
      if (rt.endsWith(":syncAck") && d && d.seq === 1) return Promise.resolve();
      return original(rt, sub, data);
    };
    const sender = syncStream(bus, "duplex", { windowSize: 2, retransmitMs: 15 });
    const receiver = openSyncStreamHandler(bus, "duplex");
    const got: number[] = [];
    receiver.onOrdered((p) => { if (typeof p === "number") got.push(p); });
    sender.push(0);
    sender.push(1);
    await new Promise((r) => setTimeout(r, 60)); // allow > retransmitMs to fire twice
    assert.deepEqual(got, [0, 1]);
    sender.close();
    receiver.close();
  });
});

describe("streamRelay — fan-out with real pause backpressure", () => {
  it("fans one p out to all subscribers in order", async () => {
    const bus = new MemoryBus();
    const relay = new StreamRelay<number>(bus, "relay-1", { bufferSize: 4 });
    const seen: number[][] = [[], []];
    relay.subscribe((d: number) => { seen[0]!.push(d); });
    relay.subscribe((d: number) => { seen[1]!.push(d); });
    bus.sendsub("relay-1", undefined, 1);
    bus.sendsub("relay-1", undefined, 2);
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(seen[0], [1, 2]);
    assert.deepEqual(seen[1], [1, 2]);
  });

  it("pause stops ingestion, resume drains the queue", async () => {
    const bus = new MemoryBus();
    const relay = new StreamRelay<number>(bus, "relay-2", { bufferSize: 10 });
    const seen: number[] = [];
    relay.subscribe((d: number) => { seen.push(d); });
    relay.pause();
    bus.sendsub("relay-2", undefined, 1);
    bus.sendsub("relay-2", undefined, 2);
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(seen.length, 0, "paused relay delivered nothing");
    assert.equal(relay.bufferedCount(), 2);
    relay.resume();
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(seen, [1, 2], "resume drained buffered payloads in order");
    assert.equal(relay.bufferedCount(), 0);
  });
});

describe("pipeline — typed stage graph", () => {
  it("runs stages in order with async handlers", async () => {
    const p = new Pipeline<number>();
    p.add({ name: "double", handler: (n) => n * 2 });
    p.add({ name: "add", handler: async (n) => n + 1 });
    assert.equal(await p.run(3), 7);
    assert.deepEqual(p.stagesNames(), ["double", "add"]);
  });

  it("recovers through stage errorHandler", async () => {
    const p = new Pipeline<number>();
    p.add({
      name: "boom",
      handler: () => { throw new Error("kaboom"); },
      errorHandler: (err, data) => { assert.match(err.message, /kaboom/); return data * 10; },
    });
    assert.equal(await p.run(2), 20);
  });
});

describe("mesh — resilient peer mesh with CRDT state", () => {
  it("discovers peers via announce; merges cluster state", async () => {
    const bus = new MemoryBus();
    const a = new Mesh<unknown, Record<string, unknown>>(bus, "mesh-1", { peerId: "peer-a", announceInterval: 1000000, peerTimeout: 2000000 });
    const b = new Mesh<unknown, Record<string, unknown>>(bus, "mesh-1", { peerId: "peer-b", announceInterval: 1000000, peerTimeout: 2000000 });
    a.start();
    b.start();

    await flush();
    // Each should see the other after the first announce round.
    assert.equal(a.state().meshSize, 2);
    assert.equal(b.state().meshSize, 2);
    const pa = a.state().peers.find((p: { id: string }) => p.id === "peer-b");
    assert.ok(pa, "a sees b");
    assert.equal(pa!.metadata.role, "streamlab");

    a.stop(); b.stop();
  });

  it("broadcasts a message to all peers", async () => {
    const bus = new MemoryBus();
    const a = new Mesh<string, Record<string, unknown>>(bus, "mesh-2", { peerId: "peer-a", announceInterval: 1000000, peerTimeout: 2000000 });
    const b = new Mesh<string, Record<string, unknown>>(bus, "mesh-2", { peerId: "peer-b", announceInterval: 1000000, peerTimeout: 2000000 });
    const got: string[] = [];
    b.onMessage((m: { p: string }) => got.push(m.p));
    a.start(); b.start();
    await flush();
    a.broadcast("hello");
    await flush();
    assert.deepEqual(got, ["hello"]);
    a.stop(); b.stop();
  });
});

describe("plinko — deep-match routing", () => {
  it("walks a tree and evaluates branches deep", async () => {
    const plinko = new Plinko(
      {
        intake: {
          matcher: (p: any) => p.kind === "order",
          branches: {
            vip: { matcher: (p: any) => p.total >= 100, execute: () => "vip-route" },
            normal: { matcher: (p: any) => p.total < 100, execute: () => "normal-route" },
          },
        },
        noise: { matcher: (p: any) => p.kind !== "order", execute: () => "noise-route" },
      },
      {},
    );
    const r = await plinko.evaluate({ kind: "order", total: 250 });
    assert.equal(r.success, true);
    assert.deepEqual(r.path, ["intake", "vip"]);
    assert.equal(r.result, "vip-route");
    assert.equal(r.terminal, true);
  });

  it("no match returns unmatched", async () => {
    const plinko = new Plinko({ only: { matcher: (p: any) => p.x === 1 } }, {});
    const r = await plinko.evaluate({ x: 9 });
    assert.equal(r.success, false);
  });
});

describe("switchboard — deterministic routing", () => {
  it("selects by key and routes to handler", async () => {
    const sb = new Switchboard(
      {
        user: (p: any) => ({ hit: "user", id: p.id }),
        admin: (p: any) => ({ hit: "admin" }),
        default: () => ({ hit: "default" }),
      },
      { selectKey: (p: any) => p.role },
    );
    assert.deepEqual((await sb.route({ role: "user", id: 3 })).result, { hit: "user", id: 3 });
    assert.deepEqual((await sb.route({ role: "unknown" })).result, { hit: "default" });
  });
});

describe("StreamLab — assembly", () => {
  it("wires six primitives on one bus", async () => {
    const lab = createStreamLab(new MemoryBus());

    // syncStream duplex
    const sender = lab.syncStream("ch-lab", { windowSize: 4 });
    const receiver = lab.openSyncStreamHandler("ch-lab");
    const got: string[] = [];
    receiver.onOrdered((p) => got.push(p as string));
    sender.push("a"); sender.push("b"); sender.push("c");
    await flush();
    assert.deepEqual(got, ["a", "b", "c"]);

    // switchboard
    const sw = lab.switchboard(
      { buy: (p: any) => `buy:${p.ticker}`, default: () => "nope" },
      { selectKey: (p: any) => p.action },
    );
    assert.deepEqual((await sw.route({ action: "buy", ticker: "TSLA" })).result, "buy:TSLA");

    // pipeline
    const pl = lab.pipeline<number>().add({ name: "x2", handler: (n) => n * 2 });
    assert.equal(await pl.run(21), 42);

    // streamRelay
    const relay = lab.streamRelay<number>("ch-relay", { bufferSize: 3 });
    const seen: number[] = [];
    relay.subscribe((d) => seen.push(d));
    (lab.bus as MemoryBus).sendsub("ch-relay", undefined, 7);
    await flush();
    assert.deepEqual(seen, [7]);

    // mesh
    const m1 = lab.mesh("ch-mesh", { peerId: "m1", announceInterval: 1000000, peerTimeout: 2000000 });
    const m2 = lab.mesh("ch-mesh", { peerId: "m2", announceInterval: 1000000, peerTimeout: 2000000 });
    m1.start(); m2.start();
    await flush();
    assert.equal(m1.state().meshSize, 2);
    m1.stop(); m2.stop();

    // plinko
    const plinko = lab.plinko({ go: { matcher: (p: any) => p.yes, execute: () => "ok" } }, {});
    assert.equal((await plinko.evaluate({ yes: true })).result, "ok");

    sender.close(); receiver.close();
  });
});

 */
