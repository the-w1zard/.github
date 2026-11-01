/**
 * Flood Gates — transport routing and flood-opening.
 *
 * The bus's transport fabric: every traffic category (SENDS/SUBS, STATE,
 * DUPLEX, STREAMS, SIGNALS, BINARY, SHARED MEMORY) has an ordered stack
 * of gates. Traffic begins on Gate 0; as the sustained rate crosses a
 * gate's threshold, the next gate OPENS — a dam with flood gates, not a
 * throttle. More water → more pipe, never less speed.
 */

/** What a transport gate is good for. Mirrors the STAFF fabric map. */
export type GateCategory =
  | "sendsubs"          // SENDS / SUBS [Bun WebSocket]
  | "state"             // STATE [Bun WebSocket]
  | "duplex"            // DUPLEX [WebTransport]
  | "streams"           // STREAMS [WebTransport]
  | "signals"           // SIGNALS [Signals]
  | "binary"            // BINARY [Binary]
  | "sharedmemory";     // SHARED MEMORY [Shared Memory]

/** A single transport. Named after the wire protocol it speaks. */
export interface TransportDescriptor {
  name: string;
  category: GateCategory;
  online?: boolean;         // default true — reachable right now
  threshold?: number;       // bytes/sec — when current rate exceeds this, open the NEXT gate
  availability?: "lazy" | "eager";
}

/** The full default gate map — exactly the STAFF fabric from the spec. */
export type GateMap = Record<GateCategory, TransportDescriptor[]>;

/**
 * The wire protocol a transport speaks. Abstraction over WebTransport /
 * WebRTC DataChannel / WebSocket / UDP / BroadcastChannel / MessagePort /
 * SharedArrayBuffer — whatever the real bus binds underneath.
 */
export interface TransportProvider {
  connect(descriptor: TransportDescriptor): Promise<TransportHandle>;
  /** Probe availability of a provider for a descriptor (e.g. try a ping). */
  probe?(descriptor: TransportDescriptor): Promise<boolean>;
}

export interface TransportHandle {
  readonly name: string;
  readonly category: GateCategory;
  send(frame: Uint8Array): void | Promise<void>;
  close(): void | Promise<void>;
  onOpen?(cb: () => void): void;
  onClose?(cb: () => void): void;
}

/** A frame queued for a category. */
export interface GateFrame {
  category: GateCategory;
  p: Uint8Array;
  seq: number;
}

/** Per-gate counters the router uses to decide flood-opening. */
export interface GateStats {
  bytesSent: number;
  framesSent: number;
  bytesDropped: number;
  openedAt: number;
}

export interface FloodGatesOptions {
  /** The default gate map (STAFF fabric) unless overridden. */
  map?: GateMap;
  /** Sampling window for the sustained-rate calculation. */
  windowMs?: number;
  /** Open next gate only when current window sustained rate > threshold. */
  floodRatio?: number;
  /** When true, availability probing runs and offline gates are skipped. */
  probeAvailability?: boolean;
  /** Message hook — observe every routed frame. */
  onFrame?: (frame: GateFrame, gate: TransportDescriptor) => void;
  /** Fired when a gate opens (flood). */
  onGateOpen?: (category: GateCategory, gate: TransportDescriptor, index: number) => void;
}

export interface GateRuntime {
  descriptor: TransportDescriptor;
  handle: TransportHandle | null;
  stats: GateStats;
  open: boolean;
  ready: boolean;
}
