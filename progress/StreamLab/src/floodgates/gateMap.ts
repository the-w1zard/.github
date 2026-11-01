import type { GateMap, GateCategory, TransportDescriptor } from "./types.ts";

/**
 * The default gate map — the STAFF transport fabric, verbatim.
 *
 * Every category is an ordered gate ladder. Gate 0 is the primary; each
 * subsequent gate opens only when traffic floods past the previous gate's
 * threshold. Availability marks whether the transport is reachable *in the
 * current environment* (online vs offline, browser vs node, etc).
 */
export const DEFAULT_GATE_MAP: GateMap = {
  sendsubs: [
    { name: "webtransport", category: "sendsubs", availability: "lazy", threshold: 1_000_000 },      // 1 MB/s before we flood
    { name: "webrtc-datachannel", category: "sendsubs", availability: "lazy", threshold: 500_000 },
    { name: "http2", category: "sendsubs", availability: "eager" },
  ],
  state: [
    { name: "webtransport-datagrams", category: "state", availability: "lazy", threshold: 500_000 },
    { name: "webrtc-datachannel", category: "state", availability: "lazy", threshold: 250_000 },
    { name: "sse", category: "state", availability: "eager" },
  ],
  duplex: [
    { name: "webtransport", category: "duplex", availability: "lazy", threshold: 1_000_000 },
    { name: "webrtc-datachannel", category: "duplex", availability: "lazy", threshold: 500_000 },
  ],
  streams: [
    { name: "webtransport", category: "streams", availability: "lazy", threshold: 2_000_000 },
    { name: "websocket", category: "streams", availability: "eager", threshold: 1_000_000 },
    { name: "webrtc-datachannel", category: "streams", availability: "lazy" },
  ],
  signals: [
    { name: "broadcastchannel", category: "signals", availability: "lazy", threshold: 100_000 },
    { name: "messageport", category: "signals", availability: "lazy" },
    { name: "webtransport-datagrams", category: "signals", availability: "lazy" },
  ],
  binary: [
    { name: "webtransport", category: "binary", availability: "lazy", threshold: 5_000_000 },
    { name: "webrtc-datachannel", category: "binary", availability: "lazy", threshold: 2_000_000 },
    { name: "websocket", category: "binary", availability: "eager" },
  ],
  sharedmemory: [
    { name: "sharedarraybuffer", category: "sharedmemory", availability: "lazy", threshold: 10_000_000 },
    { name: "messageport", category: "sharedmemory", availability: "lazy" },
    { name: "sharedworker", category: "sharedmemory", availability: "lazy" },
  ],
};

/** Human-readable name of a gate's wire protocol for logs. */
export const GATE_LABELS: Record<GateCategory, string> = {
  sendsubs: "SENDS / SUBS",
  state: "STATE",
  duplex: "DUPLEX",
  streams: "STREAMS",
  signals: "SIGNALS",
  binary: "BINARY",
  sharedmemory: "SHARED MEMORY",
};

/** Build the default map with a threshold override (bytes/sec per gate index). */
export function defaultGateMap(thresholds?: Partial<Record<GateCategory, number[]>>): GateMap {
  const map = structuredClone(DEFAULT_GATE_MAP);
  if (thresholds) {
    for (const [cat, vals] of Object.entries(thresholds)) {
      const c = cat as GateCategory;
      const list = map[c];
      if (!list) continue;
      vals.forEach((t, i) => {
        const gate = list[i];
        if (gate) gate.threshold = t;
      });
    }
  }
  return map;
}
