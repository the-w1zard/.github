# StreamLab

**syncStream × streamRelay × pipeline × mesh × plinko × switchboard**

A programmable stream-processing lab — your **Kafka Streams × Temporal × RxJS hybrid**. Six primitives, one bus, one bench.

```
switchboard (deterministic) ──▶ syncStream (duplex/ordered) ──▶ pipeline ──▶ streamRelay ──▶ mesh ──▶ plinko (deep-match)
```

## What's inside

| Primitive | Role |
|---|---|
| `syncStream` | **Upgraded duplex stream.** Bidirectional, windowed backpressure (in-flight cap instead of fire-and-forget), per-seq acks, gap-buffered in-order delivery, retransmit-on-loss so the window never wedges. |
| `streamRelay` | Deterministic fan-out. Bounded buffering + real `pause`/`resume` backpressure (`drop`/`error` strategies too). Inject on a rt, fan out to N subscribers in order. |
| `pipeline` | Typed stage graph. Async stages, per-stage `errorHandler` recovery, insert-before, enter/exit/error observers. |
| `mesh` | Resilient peer mesh. Announce heartbeats, stale-peer pruning, peer cap, broadcast fan-out, and **CRDT-merged cluster state** via the bus's `useStateCRDT`. |
| `plinko` | **Deep-match routing.** A p falls through a tree; every node on the path is a matcher (not one shallow key). Sessions keep running state + path; optional auto-reset on terminal. |
| `switchboard` | **Deterministic routing by key selector.** Exact-match dispatch, `default` catch-all, unmatched reporting. |

## The bus

Everything hangs off a `BusAdapter` — the only integration surface:

- `sendsub(rt, ms?, data?)`
- `multisub(rt, ms?, handler?) → unsubscribe`
- `useStateCRDT(initial) → [state, setState]` *(optional — mesh falls back to a local LWW merge)*

`MemoryBus` ships as a local, single-process implementation so the lab runs and tests anywhere. On your bus, implement `BusAdapter` and every primitive lights up over the real thing.

## Run it

```bash
# verify (zero deps — Node ≥ 24 or Bun ≥ 1.0)
node --test test/streamlab.test.ts     # 14 tests, all passing
tsc --noEmit                           # strict typecheck

# demo: one trip around the bench (orders → switchboard → duplex → pipeline → relay → mesh → plinko)
node scripts/demo.ts
```

## Files

```
src/types.ts          contracts (BusAdapter, envelopes, options)
src/bus/memory.ts     MemoryBus + LWW CRDT hook
src/syncStream.ts     duplex stream: window, acks, retransmit, gap buffer
src/streamRelay.ts    fan-out with real pause/resume backpressure
src/pipeline.ts       typed stage graph
src/mesh.ts           peer mesh + CRDT cluster state
src/plinko.ts         deep-match tree with sessions
src/switchboard.ts    deterministic key routing
src/index.ts          StreamLab assembly factory + barrel
test/streamlab.test.ts
scripts/demo.ts
```

## Notes on fixes applied to the pasted prototypes

1. **`streamRelay.pause()` was dead code** — the buffer never drained on resume. Now `resume()` drains so "pause" is real backpressure.
2. **`switchboard` context had a wiring bug** — `makeSwitchboardContext` was called with the wrong arg order and referenced an out-of-scope `p`. Now context is built from the actual p being routed.
3. **`plinko.walk()` had a missing `return`** — after a matched branch it fell through to sibling matchers, so deep-match routed through *both* `mid` and `retail`. Now the first match wins.
4. **`syncStream` retransmit re-arms** — previously the timer didn't re-arm on persistent loss; now an unacked p keeps retrying until acked.

All four were surfaced by the demo + tests, not guessed at.
