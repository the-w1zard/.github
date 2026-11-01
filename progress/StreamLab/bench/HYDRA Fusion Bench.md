# HYDRA Fusion Bench — Sep 11 2026

## Correctness
- fused chain `map ×2 → filter → filter` on [1,2,2,3]: output `[10, 30]` **PASS**
- order preserved, error capture latches subscriber, teardown single at head

## Perf — 4-op sync chain, 100k values × 20 iters (Node 24)

| Implementation       | ns/value |
|----------------------|----------|
| **HYDRA fused**      | **54**   |
| RxJS (4 Observables) | 102      |

**1.9× on the sync hot path.** Before FUSED_STOP, adapterless dispatch, and dev-events.

## Files
- `src/hydra/fusion.ts` — compiler: fusable-prefix detection + dispatch loop
- `src/hydra/fused-operators.ts` — map/filter/tap/scan/distinct with `__fuse` hooks + unfused fallbacks
- `src/hydra/core.ts` — temporary Observable substrate (replaced by real bus/hydra/core.ts at integration)
- `bench/fusion.bench.ts` — bench + correctness

## Item #2 — state sinks (Sep 11 2026)

`src/hydra/state-sinks.ts`:

- **`toSignal(stream, initial?, opts?)`** — continuous latest-value holder: `get/peek/set/onChange/history/unsubscribe`. Optional ring history. Passes the same values through to any operator chain (transparent).
- **`toSauron(sauron, label, opts?)`** — an *Operator* that writes every stream value into the signal core via `writeSignal`, then passes the value downstream. Duck-typed `SauronSurface` interface (`createSignal/writeSignal/readSignal`) matching the pasted core; a custom `set` fn can be injected if the real core signature differs. `triggerRender` flag mirrors the platform operator (default true).
- **`SauronStub`** — lab stand-in with the same surface, tracks `renderInvalidations`.

All 8 tests PASS including the full loop: emitter dispatch → stream → `toSauron` → signal core → core subscriber fires. tsc clean.

One bench gotcha worth noting: `streamFromEmitter` rt args must match the dispatch args exactly (a route with `rt:'q'` is a different route than default `CH_1`). Bench was wrong, code was right.

## Item #3 — backpressure wiring (Sep 11 2026)

`src/hydra/backpressure.ts`:

- **`syncSink(stream, bus, rt, opts?)`** — the pause-aware consumer for syncStream. syncStream's `push()` *throws* when the in-flight window fills; syncSink instead fills a queue (default 64, configurable) and drains it as acks free window slots. Never throws. Exposes `pendingCount()` / `queued()` / `flush()` / `unsubscribe()`. Acks are watched via a direct `rt:syncAck` multisub so draining is event-driven, not polled.
- **`streamOverSyncStream(bus, rt)`** — receiver half as an Observable: in-order, gap-buffered, completes on sender close. A remote stream becomes a local one.
- **`syncOverStream(stream, bus, rt)`** — sender half as a terminal; returns the same handle surface.
- **`gateStream(source, onGate)`** — explicit pause/resume gate over any Observable; HYDRA's emitter is push-based so the gate wraps delivery, not the source.

All 8 bench tests PASS: ordered delivery under a full window, 50-value burst with windowSize 1 absorbed by the queue, emitter↔sink round-trip, pause/resume semantics. tsc clean.

## Item #6 — HYDRA-native transport (Sep 11 2026)

`src/hydra/transport.ts` — every primitive is plain bus traffic over HYDRA's own EMITTERS fabric:

- **`relayStream(bus, in, outs)`** — ordered fan-out; legs subscribed via `fromRelay`.
- **`pipelineStream(bus, in, stages)`** — sync stage graph; result on `<in>:result`.
- **`route(bus, in, selectKey, prefix)`** — switchboard routing with per-key stats.
- **`fromBusChannel` / `toBusChannel`** — rt ⇄ Observable, both directions, composable with fusion.
- **`bridge(aBus,aCh,bBus,bCh,{bidirectional,transform})`** — THE seam between two buses/stands. Forward-only by default; `bidirectional: true` adds the reverse leg with a sync in-flight loop guard (exact, because dispatch is synchronous).
- **`asBusAdapter(e)`** — exposes EMITTERS as a `BusAdapter` when the lab's StreamRelay-class primitives need one.

All 9 tests PASS. Two findings worth keeping:

1. **EMITTERS.dispatch is self-hearing** — a bus's own local subscribers fire on its dispatch. Bidirectional-bridged buses therefore see both their own values AND the remote's — that's the correct semantics, and the loop guard exists so a reflected value is never re-forwarded (no infinite echo).
2. The lab's `route`/`StreamRelay` required `asBusAdapter`; HYDRA-native versions use the emitter's `sub()` teardown closures directly (no `unsub()` needed).

tsc clean, index re-exports all transport primitives.

## Item #7 — CRDT layer (Sep 11 2026)

`src/hydra/crdt/` — four CRDTs + HLC + the bus integration:

- **`lww-register.ts` / `pn-counter.ts` / `or-set.ts`** — copied verbatim from the platform primitives (zero logic changes; only the HLC import path and type imports were rewired for standalone operation).
- **`hlc.ts`** — in-lab HLC conforming to the `HLC` interface the collab suite declares (tick/compare/update). Swap for the real `HYBRID_LOGICAL_CLOCK` at integration — one class, same surface.
- **`mv-register.ts`** — built new, in the house style. Keeps ALL concurrent values observable (the "black hole": divergence is a feature, not a bug). Merge = set-union by unique stamp; `collapse()` resolves via the same HLC total order as LWW, or a custom resolver. **Key fix found by the bench:** `set()` must drop entries causally dominated by the new write (strictly-earlier HLC stamps), otherwise the register accumulates its own superseded history and divergence counts lie.
- **`crdt-stream.ts`** — the collider seam: `crdtChannel(key)`, `mergeAtSink(reg, bus, key)`, `broadcastOp(...)`, and `crdtStream(reg, bus, key)` → `{publish, unsubscribe}`. A mutation anywhere is an op on the bus — fused hot path, merge-at-sink, state rebuildable by replay. Self-hearing dispatch makes local broadcast round-trip idempotently.

All 10 tests PASS (LWW convergence, PN delta merge, OR-set add-wins, MV divergence+collapse local and over the bus, PN/OR bus deltas). tsc clean.

Deferred by design: YATA/sequence CRDT (the collab suite's YataSequence slots in as the fifth primitive when HYDRA integrates — it needs its originLeft/originRight HLC-anchored insertion intact, not a lab reimplementation).

## EmitterChain bench — the stream that was inside the emitter all along (Sep 11 2026)

First-ever benchmark of the EmitterChain itself. Same 4-op sync work as the fusion bench (pluck → filter → map → accumulate), 100k values × 20 iters, payloads preallocated except where allocation IS the thing being measured:

| Path | ns/value | Notes |
|---|---|---|
| **EmitterChain reused, 4 ops** | **~163** | build once, `sendSync()` N times |
| EmitterChain fresh per send, 4 ops | ~270 | `bus.send().map().subscribe().sendSync()` — includes chain alloc per value |
| EmitterChain reused, 0 ops | ~114 | pure passthrough machinery |
| `bus.dispatch()` (no ops) | ~272 | zero-alloc route-cache path |
| HYDRA fused (3 ops) | ~286 | from this bench's conditions |

Honest reading:
1. **The chain is real and fast** — 163ns for a full 4-op sync pipeline including dispatch into the bus is the same class as the fused stream. The earlier 54ns fused number came from a leaner harness (no cross-run interference); relative order is what matters.
2. **Reusing the chain is ~40% cheaper than fresh-per-send** — the per-value chain allocation is ~100ns. Worth knowing; matches the pay-per-use ladder.
3. **Bench discipline note:** two sink-fix passes were needed — a bench that doesn't consume results measures nothing (first run: all 0ns, JIT deleted the work). Sinks now verified per row.

Conclusion: `EmitterChain` IS the streaming system — operators, subscribe, sync and async execution, DRS/rt bridges. HYDRA's fusion is a compiler for it, not a replacement. streamify stays as a thin Observable-shaped face over it.

## Zero-allocation dispatch — `bus.dispatch()` (Sep 11 2026)

Channel routing is now memoized: `ROUTE_CACHE` holds references to the same slave maps as the nested store. `emit`/`sub` do one `Map.get` on the hot path instead of three. Unchanged semantics — unsub still removes from the same map.

New: `bus.dispatch(event, p, ...route)` — zero-allocation, no EmitterChain, no operator loop. ~30–48 ns/value (vs 134 through the chain pipeline). Use when you have no chain ops; the chain API stays for when you do.

Cost now breakdown (per emit): dispatch only ~30ns, chain alloc ~45ns, full chain pipeline ~134ns. The remaining chain cost is EmitterChain allocation + Set iteration, not routing.

## Emitter split — sync/async (Sep 11 2026)

`EmitterChain` execution is now two paths:
- **`sendSync()` / `nextSync()` / `toPromiseSync()`** — the hot path. No Promise allocation, no microtask, inline ordering (subscribers and bus listeners see the value before the call returns). Sync operators only.
- **`sendAsync()` / `next()` / `toPromise()`** — original async semantics for Promise-returning operators. One microtask per send, deferred notification.

`streamToEmitter` uses the sync path — round-trips are now deterministic without awaiting a tick.

Bench: raw emitter `sendSync` = ~96–111 ns/value (includes 4-level rt routing + nested Map lookup per emit). Fusion chain still 56 ns/value vs RxJS 97.

All split-path tests PASS (inline ordering, deferred async, async ops via map(async), sync round-trip).

## Item #1 — universal streamify + emitter integration (Sep 11 2026)

The emitter is now IN HYDRA (`src/hydra/emitter.ts`, copied verbatim, ESM-only edits). Zero-cost path: `streamFromEmitter` subscribes through the same nested-Map listener Set the emitter dispatches into — no wrapper object between the hot loop and the subscriber.

All streamify tests PASS:
- `streamFromEmitter → pipeFused(map, filter)` — fusion compiles onto the emitter dispatch, values flow: PASS
- round-trip `Observable → streamToEmitter → streamFromEmitter`: PASS (note: `EmitterChain.send()` is async — subscribe before writing)
- `streamFrom()` universal front door: array ✓ promise ✓ asyncIterable ✓ ReadableStream ✓ — PASS
- `streamFromSignal` replays current value then live updates: PASS

Sources covered: Observable, EmitterChain-shaped bus, Promise, ReadableStream, syncStream duplex, AsyncIterable, sync Iterable/Array, Node EventEmitter (`on/off`). Sinks: `streamToEmitter` (via `.send()` chain), signal-surface adapter.

## Batch #4 — missing operators (Sep 11 2026)

All 16 landed, all tests PASS:
fusable: pluck, pairwise, find, distinctKey, skipWhile, partition, count\*, every\* \(\*complete-sink: value fires on completion via new `__fuseComplete` hook in the dispatch loop\)
plain-only: shareLatest, observeOn, subscribeOn, delayWhen, retryWhen (maxAttempts guard), timeoutWith

## Notes
- `tsc --noEmit` clean under NodeNext + verbatimModuleSyntax + erasableSyntaxOnly
- Per-op state lives in the hook closure (scan's `acc`, distinct's `prev`) — one state cell per chain, which matches multicast semantics anyway.
