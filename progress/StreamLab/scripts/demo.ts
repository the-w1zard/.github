/**
 * StreamLab demo — one trip around the lab bench.
 *
 *   switchboard → syncStream (duplex) → pipeline → streamRelay → mesh → plinko
 *
 * Every primitive from the assembly shows up on a single MemoryBus: an
 * order comes in off the switchboard, streams duplexend over syncStream,
 * gets enriched through a pipeline, fanned out by the relay, gossiped
 * across a two-peer mesh, and deep-matched by plinko.
 */
import { createStreamLab, MemoryBus, type PlinkoTree } from "../../stream_lab_ss.js";

const bus = new MemoryBus();
const lab = createStreamLab(bus);

const log = (tag: string, x: unknown) => console.log(`  ${tag.padEnd(14)} ${JSON.stringify(x)}`);

console.log("StreamLab demo — one trip around the bench\n");

/* 1. switchboard: deterministic routing by order action */
const sw = lab.switchboard(
  {
    buy: (p: any) => ({ action: "buy", ticker: p.ticker, qty: p.qty, price: p.price }),
    sell: (p: any) => ({ action: "sell", ticker: p.ticker, qty: p.qty, price: p.price }),
    default: () => ({ action: "unknown" }),
  },
  { selectKey: (p: any) => p.action },
);

/* 2. syncStream: duplex, ordered, windowed, loss-tolerant */
const sender = lab.syncStream("orders", { windowSize: 8, retransmitMs: 30 });
const receiver = lab.openSyncStreamHandler("orders");
receiver.onOrdered((p, seq) => {
  log(`syncStream#${seq}`, p);
  bus.sendsub("trades", undefined, p); // hand off to relay
});

/* 3. pipeline: enrich each order */
const enrich = lab.pipeline<any>()
  .add({ name: "normalize", handler: (o) => ({ ...o, at: Date.now() }) })
  .add({ name: "enrich", handler: (o) => ({ ...o, notional: (o.qty ?? 0) * (o.price ?? 0) }) });

/* 4. streamRelay: fan out to subscribers */
const relay = lab.streamRelay<any>("trades", { bufferSize: 64 });
relay.subscribe(async (o) => {
  const enriched = await enrich.run(o);
  log("relayed", enriched);
  meshA.broadcast(enriched); // gossip via the mesh, not raw bus
});

/* 5. mesh: two peers gossip the enriched trade */
const meshA = lab.mesh("mesh-gossip", { peerId: "mX", announceInterval: 1000000, peerTimeout: 2000000 });
const meshB = lab.mesh("mesh-gossip", { peerId: "mY", announceInterval: 1000000, peerTimeout: 2000000 });
meshA.start();
meshB.start();
meshB.onMessage((m) => {
  log("mesh→mY", m.p);
  bus.sendsub("plinko", undefined, m.p);
});

/* 6. plinko: deep-match route by size bands */
const tree: PlinkoTree<any, any> = {
  trade: {
    matcher: (p: any) => p.notional > 0,
    branches: {
      whale: { matcher: (p: any) => p.notional >= 100_000, execute: (p: any) => `WHALE ${p.ticker} ${p.notional}` },
      mid: { matcher: (p: any) => p.notional >= 10_000, execute: (p: any) => `MID ${p.ticker} ${p.notional}` },
      retail: { matcher: (p: any) => p.notional < 10_000, execute: (p: any) => `RETAIL ${p.ticker} ${p.notional}` },
    },
  },
};
const plinko = lab.plinko(tree, {}, { autoResetOnTerminal: true });
bus.multisub("plinko", undefined, (p: any) => {
  const pathBefore = plinko.getPath();
  plinko.evaluate(p).then((r) => {
    const route = r.path.length ? r.path.join("/") : (pathBefore.length ? pathBefore.join("/") : "trade");
    log(`plinko→${route}`, r.result);
  });
});

/* Wire the switchboard straight into syncStream */
sw.route({ action: "buy", ticker: "TSLA", qty: 12, price: 250 }).then((r: any) => {
  log("switchboard", r.result);
  sender.push(r.result);
});

sw.route({ action: "sell", ticker: "NVDA", qty: 2, price: 6000 }).then((r: any) => {
  log("switchboard", r.result);
  sender.push(r.result);
});

/* Give every async hop time to land */
setTimeout(() => {
  console.log("\nmesh members:", meshA.state().peers.map((p) => p.id), "← discoverable via CRDT merge");
  sender.close(); receiver.close(); meshA.stop(); meshB.stop();
}, 60);
