import { MemoryTransportProvider, GatesRouter, defaultGateMap } from "../../stream_lab_ss.js";
const provider = new MemoryTransportProvider();
provider.latency = 0;
const opened = [];
const router = new GatesRouter(provider, {
    probeAvailability: false,
    windowMs: 200,
    floodRatio: 1.0,
    map: defaultGateMap({ sendsubs: [100, 50] }),
    onGateOpen: (_c, g) => { opened.push(g.name); },
});
await router.ensureReady("sendsubs");
for (let i = 0; i < 40; i++) {
    router.route({ category: "sendsubs", p: new Uint8Array(12), seq: i });
}
console.log("opened:", opened);
console.log("stats:", JSON.stringify(router.stats()["sendsubs"], null, 1));
