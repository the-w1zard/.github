# `barrier`

> Wait for N things to happen. No counters. No mutexes. No race conditions.

A minimal, single-file barrier primitive for TypeScript and JavaScript. Create a barrier with a count, call `.arrive()` from anywhere that needs to check in, and `await .wait()` to unblock once every arrival has happened. That's the whole API.

This is the correct way to express *"wait until N things have happened"* — a pattern that shows up in distributed systems, parallel test runners, rasterizers finishing tile batches, peer coordination, and every `Promise.all`-adjacent problem you've ever hand-rolled. Most implementations invent a shared counter, a mutex, and a condition variable and still get the race condition wrong. This one doesn't, because it has none of those things.

---

## Install

```bash
npm install barrier
```

Or just copy the function into your codebase. It's a few lines and has zero dependencies. This is a legitimate way to use it.

---

## Usage

### 🟢 First-time users — start here

The absolute minimum to get this working in under 5 minutes:

```ts
import { barrier } from "barrier"

const b = barrier(3)

b.arrive()  // 1st
b.arrive()  // 2nd
b.arrive()  // 3rd — this one resolves the wait

await b.wait()  // resolves after the 3rd arrive()
```

That's it. You're done. You now know how to use `barrier`.

If you want it to actually be useful, here's the same thing with real async work:

```ts
import { barrier } from "barrier"

const ready = barrier(3)

async function worker(id: number) {
  await doSomeSetup()
  ready.arrive()
  await ready.wait()
  console.log(`worker ${id} proceeding`)
}

await Promise.all([worker(1), worker(2), worker(3)])
```

Every worker blocks until all three have checked in. No counter. No mutex.

### 🔵 Everyone else — the full picture

#### The API

```ts
function barrier(n: number): {
  arrive(): void
  wait(): Promise<void>
}
```

- **`barrier(n)`** — creates a barrier that resolves once `n` callers have called `.arrive()`.
- **`.arrive()`** — records one arrival. When the `n`-th arrival happens, the internal promise resolves. Idempotent in the sense that extra arrivals past `n` are harmless no-ops.
- **`.wait()`** — returns the same promise every time. Safe to call before, during, or after all arrivals. Safe to call from many places. Returns immediately (on the next microtask) if the barrier is already resolved.

#### Why `wait()` returns the same promise

`wait()` is not a one-shot. It's not a consumable. It can be awaited by every participant independently, and by anyone else who happens to hold a reference. This is what makes the primitive composable — you can hand the barrier object to N workers, or to a coordinator, or to both.

#### `n` is captured at construction

The count is fixed when you call `barrier(n)`. This is deliberate. A barrier whose target can change underneath waiting callers is a barrier that has to be locked, and the moment you lock it you've reinvented the thing this exists to avoid.

#### Arrivals are counted synchronously

`arrive()` is not async and does not yield. It increments and, if the threshold is met, resolves. This means:

- Two `.arrive()` calls in the same synchronous tick are counted correctly.
- You cannot lose an arrival between the increment and the check.
- There is no window for a race.

#### The `gate` dependency

Internally this uses a `gate<void>()` helper that returns `{ promise, resolve }`. If you're vendoring the code, `gate` is a two-liner:

```ts
function gate<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}
```

#### Common patterns

**Wait for N peers to check in**

```ts
const allHere = barrier(peerCount)
peers.forEach(p => p.on("ready", () => allHere.arrive()))
await allHere.wait()
```

**Parallel test runner — wait for N suites to finish setup**

```ts
const setupDone = barrier(suites.length)
await Promise.all(suites.map(s => s.setup().then(() => setupDone.arrive())))
await setupDone.wait()
```

**Rasterizer — wait for N tiles**

```ts
const done = barrier(tiles.length)
for (const tile of tiles) {
  renderTile(tile, () => done.arrive())
}
await done.wait()
```

#### What this is *not*

- Not reusable. Once resolved, it stays resolved. If you need a cyclic barrier (reusable across rounds), that's a different primitive and you should build it on top of this one, not inside it.
- Not a `Semaphore`. It doesn't track available permits or block on acquisition. It only counts arrivals toward a single threshold.
- Not a `Latch` in the Java sense, although it's close. A latch typically supports count-down semantics; a barrier is symmetric — all parties arrive and then all parties proceed.

#### Gotchas

- Calling `.arrive()` more than `n` times is fine but the extra calls do nothing. If you find yourself arriving more than you expected, you have a bug elsewhere and this primitive will not hide it from you.
- `.wait()` never rejects. It has no timeout, no abort signal, no cancellation. If you need those, wrap it: `await Promise.race([b.wait(), timeout(5000)])`.
- Zero is a valid `n` — `barrier(0).wait()` resolves immediately. This is useful as a fallback in code where the participant count is dynamic.

---

## Philosophy

Every "wait until N things happen" you've ever written by hand has had a shared counter and a resolve call and a check, and every one of them had a subtle bug the first time. This is the smallest correct expression of that pattern. Use it instead of the counter.

---

## License

MIT
