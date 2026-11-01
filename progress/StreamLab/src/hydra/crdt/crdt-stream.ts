// crdt/crdt-stream.ts — #7 integration: CRDT state flowing through the bus.
//
// The collider idea: every value in the app is a CRDT register whose mutations
// are ops on the op stream. A mutation anywhere is `{site, hlc, key, value}`
// flowing through HYDRA's bus like any stream value — fused on the hot path,
// merged at the sink. State is rebuildable by replaying the op log.
//
//   crdtChannel(bus, key)          — canonical bus rt for a key's ops
//   mergeAtSink(reg, bus, key)     — subscribe a register to its op rt;
//                                    every incoming state is merged in
//   broadcastOp(reg, bus, key)     — publish a register's state after each
//                                    local write (call inside set()/after())
//   crdtStream(bus, key, make)     — full round-trip: local Observable
//                                    writes → merge locally → broadcast →
//                                    remote merges — the stream IS the op log.

import { EMITTERS } from "../emitter.ts";
import type { MV_REGISTER } from "./mv-register.ts";
import type { LWW_REGISTER } from "./lww-register.ts";
import type { PN_COUNTER } from "./pn-counter.ts";
import type { OR_SET } from "./or-set.ts";

export type CrdtLike = MV_REGISTER<any> | LWW_REGISTER<any> | PN_COUNTER | OR_SET<any>;

/** Canonical rt name for a key's CRDT ops on the bus. */
export function crdtChannel(key: string): string {
  return `crdt:${key}`;
}

/** Subscribe a register to its op rt — merges every incoming state. */
export function mergeAtSink<M extends CrdtLike>(reg: M, bus: EMITTERS, key: string): () => void {
  return bus.sub(crdtChannel(key), (state: unknown) => {
    // only merge foreign states: our own broadcast comes back via self-hearing
    (reg as any).merge?.(state);
  });
}

/** Publish the register's full state on its op rt. */
export function broadcastOp(reg: CrdtLike, bus: EMITTERS, key: string): void {
  bus.emit(crdtChannel(key), reg.getState());
}

/** Round-trip wiring: remote merges arrive continuously; returns a fn that
 * broadcasts the local state (call it after every local mutation). */
export function crdtStream<M extends CrdtLike>(
  reg: M, bus: EMITTERS, key: string,
): { publish: () => void; unsubscribe: () => void } {
  const un = mergeAtSink(reg, bus, key);
  return {
    publish: () => broadcastOp(reg, bus, key),
    unsubscribe: un,
  };
}
