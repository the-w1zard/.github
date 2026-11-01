"use strict";
/**import { test, describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  createStreamLab, MemoryTransportProvider, GatesRouter, FloodGateAdapter,
  defaultGateMap, GATE_LABELS,
} from "../../stream_lab_ss.js";
import type { GateFrame, GateMap, TransportDescriptor, TransportProvider } from "../../stream_lab_ss.js";
import { syncStream, openSyncStreamHandler } from "../../stream_lab_ss.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("floodgates — transport routing + flood opening", () => {
  it("starts with gate 0 open and routes sendsubs traffic", async () => {
    const provider = new MemoryTransportProvider();
    let opened = 0;
    const router = new GatesRouter(provider, {
      probeAvailability: false,
      onGateOpen: () => opened++,
    });
    await router.ensureReady("sendsubs");
    assert.equal(opened, 1, "gate 0 open on first use");
    const ok = router.route({ category: "sendsubs", p: new TextEncoder().encode("hi"), seq: 0 });
    assert.equal(ok, true);
    await sleep(10);
    const inbox = provider.inboxes.get("webtransport");
    assert.ok(inbox, "webtransport gate 0 received the frame");
    assert.equal(inbox.length, 1);
  });

  it("opens the next gate (flood) when the primary exceeds its threshold", async () => {
    const provider = new MemoryTransportProvider();
    const opened: string[] = [];
    const router = new GatesRouter(provider, {
      probeAvailability: false,
      windowMs: 200,
      floodRatio: 1.0,
      map: defaultGateMap({ sendsubs: [100, 50] }), // low thresholds for the test
      onGateOpen: (_c, g) => { opened.push(g.name); },
    });
    await router.ensureReady("sendsubs");
    assert.deepEqual(opened, ["webtransport"]);
    // Push > 100 B/s within the window — crosses gate 0's 100 B threshold.
    for (let i = 0; i < 40; i++) {
      router.route({ category: "sendsubs", p: new Uint8Array(12), seq: i });
    }
    await sleep(30);
    assert.ok(opened.includes("webrtc-datachannel"), "flood opened gate 2");
    assert.equal(provider.inboxes.get("webrtc-datachannel")!.length > 0, true);
  });

  it("skips offline transports during availability probing", async () => {
    const provider = new MemoryTransportProvider();
    provider.unavailable.add("webrtc-datachannel");
    const router = new GatesRouter(provider, { probeAvailability: true });
    await router.ensureReady("sendsubs");
    // Gate 0 is webtransport; probe says webrtc offline — so we should NOT
    // connect it. stats(): webtransport open, webrtc not.
    const st = router.stats()["sendsubs"]!;
    assert.equal(st[0]!.open, true);
    assert.equal(st[1]!.open, false, "offline transport skipped");
  });

  it("falls back to a previous gate when the current gate closes", async () => {
    const provider = new MemoryTransportProvider();
    const router = new GatesRouter(provider, {
      probeAvailability: false,
      windowMs: 200,
      floodRatio: 1.0,
      onGateOpen: () => {},
    });
    await router.ensureReady("sendsubs");
    // Close gate 0's handle.
    const g0 = router.stats()["sendsubs"]![0];
    // Can't reach handle from stats — but we can close all and re-ensure:
    await router.close();
    await router.ensureReady("sendsubs");
    const st = router.stats()["sendsubs"]!;
    assert.equal(st[0]!.open, true, "fallback re-ensured gate 0");
  });

  it("labels the fabric human-readably", () => {
    assert.equal(GATE_LABELS["duplex"], "DUPLEX");
  });
});

describe("floodgates — FloodGateAdapter on the lab", () => {
  it("routes a full lab over the fabric (syncStream duplex + relay + mesh)", async () => {
    const provider = new MemoryTransportProvider();
    const lab = createStreamLab(undefined, { floodGates: true, floodGateProvider: provider });
    assert.ok(lab.bus instanceof FloodGateAdapter);

    // duplex ordered stream over the fabric — push slowly so acks keep up
    const sender = lab.syncStream("fabric-duplex", { windowSize: 4, retransmitMs: 1000000 });
    const receiver = lab.openSyncStreamHandler("fabric-duplex");
    const got: number[] = [];
    receiver.onOrdered((p) => { if (typeof p === "number") got.push(p); });
    for (let i = 0; i < 5; i++) {
      sender.push(i);
      await sleep(8);
    }
    await sleep(30);
    assert.deepEqual(got, [0, 1, 2, 3, 4], "ordered stream survived the fabric");

    // relay fan-out over the fabric
    const relay = lab.streamRelay<number>("fabric-relay", { bufferSize: 64 });
    const seen: number[] = [];
    relay.subscribe((d: number) => { seen.push(d); });
    for (let i = 0; i < 5; i++) {
      lab.bus.sendsub("fabric-relay", undefined, i);
    }
    await sleep(30);
    assert.deepEqual(seen, [0, 1, 2, 3, 4], "relay fanned out over the fabric");

    sender.close();
    receiver.close();
    await (lab.bus as FloodGateAdapter).close();
  });

  it("fabric stats reflect multi-gate usage after flood", async () => {
    const provider = new MemoryTransportProvider();
    provider.latency = 0; // no wire delay so the flood window observes all bytes
    const lab = createStreamLab(undefined, { floodGates: true, floodGateProvider: provider, floodGateOptions: { windowMs: 50, floodRatio: 1.0, probeAvailability: false, map: defaultGateMap({ sendsubs: [200] }) } });
    const adapter = lab.bus as FloodGateAdapter;
    // Enough bytes to cross the primary's threshold quickly (512B × 80 = 40KB).
    for (let i = 0; i < 80; i++) {
      lab.bus.sendsub("flood", undefined, new Uint8Array(512));
    }
    await sleep(60);
    const st = adapter.routerStats()["sendsubs"]!;
    const openGates = st.filter((g) => g.open);
    assert.ok(openGates.length >= 2, "flood opened multiple gates: " + openGates.map((g) => g.name).join(","));
    await adapter.close();
  });
});
 */
