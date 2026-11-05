# ReChain

> An immutable value pipeline for DRS. Every step returns a **new** `ReChain` — nothing is mutated in place. Safe to hold across renders, share between components, or re-run.

`Chain` is the mutating sibling. `ReChain` is the one you reach for when you want the pipeline itself to be a value: composable, shareable, and free of the "who changed this?" question. Same shape, same verbs, same `when` / `switch` / `guard` ergonomics — but each call hands you a fresh chain instead of mutating the one you had.

---

## Install

```bash
npm install rechain
```

Requires `root.DISRUPTOR` (a DRS cell store) and a `log` helper with `t.info` / `t.error` levels to be available in scope. If you're vendoring the file, point those at your own implementations.

---

## Usage

### 🟢 First-time users — start here

The absolute minimum to get this working in under 5 minutes:

```ts
import { ReChain } from "rechain"

const result = new ReChain({ count: 0 })
  .set("count", 5)
  .patch({ label: "ready" })
  .done()

// result → { count: 5, label: "ready" }
```

That's it. You're done. You now know how to use `ReChain`.

Now the branching version, which is the whole point:

```ts
const chain = new ReChain(score)

const next = chain
  .when(s => s > 90).then(s => "A")
  .when(s => s > 80).then(s => "B")
  .when(s => s > 70).then(s => "C")
  .done()
```

Each `.when()` returns a branch view. `.then()` fires only if the predicate passed and returns a new chain; otherwise it returns the current one unchanged. The original `chain` is never touched.

### 🔵 Everyone else — the full picture

#### The core idea

A `ReChain` is a **value**, not a builder. You don't "mutate a chain and pass it around." You hold a chain, call a method, and get a *different* chain back. The old one is still valid, still readable, still whatever it was. This is what makes it safe to hold across renders and share across components.

The single place a value changes hands is the private `step(next, write)`:

```ts
private step(next: A, write = false): ReChain<A> {
  if (write) {
    const [, setV] = this._use()
    setV(next)
  }
  return next instanceof ReChain ? next : new ReChain(next, this.id)
}
```

- If `write` is `true`, the new value is broadcast to the store and the bus.
- Either way, a **fresh** `ReChain` is returned. The `this` you called it on is unchanged.
- If `next` is already a `ReChain`, it's returned as-is — no needless wrapping.

#### The API

**Branching**

| Method | What it does |
| --- | --- |
| `.when(pred)` | Returns a branch view. `pred` receives the current value. |
| `.if(pred)` | Alias for `.when(pred)`. Same shape. |
| `.switch()` | Multi-way branch on strict equality (`===` or `Object.is`). |

A branch view exposes:

| Member | Behavior |
| --- | --- |
| `.then(fn)` | If the predicate passed, run `fn` and return a new chain. Otherwise return `this`. |
| `.otherwise(fn)` | If the predicate failed, run `fn` and return a new chain. Otherwise return `this`. |
| `.else(fn)` | Alias for `.otherwise`. |
| `.done()` | Return the current value of the chain. |

Both `.then` and `.otherwise` may be written on the same branch view. Only one fires. Order doesn't matter — the branch decision is frozen when `.when`/`.if` is called.

**Mutation-style steps (each returns a new chain)**

| Method | Notes |
| --- | --- |
| `.set(k, val)` | Shallow-clones the current value and sets one key. Write-through. |
| `.patch(obj)` | Shallow-merges `obj` over the current value. Write-through. |
| `.merge(other)` | Merges another value or `ReChain` (uses `other.initial_value` if present). Write-through. |
| `.get(k)` | Returns a new chain wrapping the value at key `k`. |
| `.tap(fn)` | Runs `fn(value)` for side effects; returns `this`. Not write-through. |

**Guards and gates**

| Method | Behavior |
| --- | --- |
| `.gate(pred)` | Throws if `pred` fails. Returns `this` on success. |
| `.guard(pred, onFail?)` | If `pred` fails, writes the fallback and returns a new chain. Never throws. |

`.gate` is for "this must be true or the program is wrong." `.guard` is for "recover to a safe value and continue." Pick deliberately — the difference matters at the call site.

**Async / Promise interop**

| Method | Behavior |
| --- | --- |
| `.then(onFulfilled?, onRejected?)` | Promise-compatible. Unwraps thunks, resolves, then chains. |
| `.catch(onRejected)` | Sugar for `.then(null, onRejected)`. |
| `.finally(fn)` | Runs `fn()` synchronously, returns `this`. (Note: synchronous — not a Promise-style finally.) |
| `.delay(ms)` | Returns a `Promise<ReChain<T>>` that resolves after `ms`. |
| `.retry(attempts, delayMs?)` | Retries while the unwrapped value is `null` / `undefined`. Rejects after `attempts`. |
| `.throw(err)` | Throws `err`. |
| `.done()` | Unwraps the value. If it's a function, calls it. Returns `T`. |

#### Why "immutable" here is load-bearing

The class is designed so that any chain you hold is a snapshot. Two consequences fall out immediately:

1. **Render-safe.** A `ReChain` in React state or a memo can't change out from under you. Re-running the pipeline produces the same result if the inputs are the same.
2. **Order-independent.** Because branching returns fresh chains, you can compose steps in either order without one step's side effects leaking into the next branch's evaluation. This is the difference that shows up when two branches both call `.then`.

The name `ReChain` is literally "re-chain" — re-run the chain, get a new chain.

#### Common patterns

**Multi-way dispatch**

```ts
const label = new ReChain(status)
  .switch()
  .case("ok",      () => "All systems normal")
  .case("warn",    () => "Degraded")
  .case("error",   () => "Outage")
  .default(()      => "Unknown")
  .done()
```

**Guard then continue**

```ts
const safe = new ReChain(payload)
  .gate(p => p != null)
  .guard(p => p?.id, () => ({ id: "anonymous" }))
  .done()
```

**Retry with backoff**

```ts
const value = await new ReChain(() => fetchRemote())
  .retry(5, 250)
```

Note the thunk: `.retry` unwraps function-valued chains on each attempt, so pass `() => …` rather than an already-settled value.

**Chaining a ReChain into another ReChain**

```ts
const merged = new ReChain(a).merge(b).done()
```

`.merge` looks for `other.initial_value` first, so passing a `ReChain` merges the *value inside it*, not the wrapper. This is intentional.

#### Differences from `Chain`

`Chain` is the mutating sibling. Both exist because both patterns are valid:

- **`Chain`** mutates in place and returns `this`. Cheap, imperative, useful inside a hot loop or a one-shot pipeline where you own the lifetime.
- **`ReChain`** returns a new chain every step. Slightly more allocation, dramatically more composable. Use it when the chain crosses a boundary — a render, a request handler, a shared utility.

If you find yourself writing `chain = chain.set(...)`, you're using the wrong one. Reach for `Chain`. If you find yourself worried about *when* a chain changed, you're using the right one.

#### Gotchas

- **`.get(k)` uses `v?.[k]`**, so it works on objects but silently yields `undefined` for primitives. If your chain value is a number and you call `.get("foo")`, you get `undefined` back, not an error.
- **`.set` and `.patch` shallow-clone.** Nested objects are shared by reference. This is the same tradeoff as React's `setState` — expected, but worth knowing.
- **`.switch().case()` returns `self`, not the branch view.** You can't chain a second `.case()` off the result of `.then()` inside a `.when()` — you're already back at the chain level. Read the return type carefully if you're composing.
- **`.switch()` matches by `===` or `Object.is`.** No structural comparison. Objects and arrays won't match unless they're the same reference.
- **`.retry` retries on `null` / `undefined`, not on thrown errors.** It's a "keep polling until there's a value" primitive, not a "recover from exceptions" one. Use `.catch` for thrown errors.
- **`.finally(fn)` is synchronous** and returns `this`, not a Promise. Don't confuse it with `Promise.prototype.finally`.
- **`.throw(err)` throws immediately.** If you want the throw to be deferred until `.done()` or `await`, wrap it in a thunk.

#### What this is *not*

- Not a Redux replacement. It's a value pipeline with DRS write-through. State lives in the store; the chain is a lens on it.
- Not RxJS. No streams, no subscriptions. Each chain is a one-shot value.
- Not a `Lens`. Lenses compose arbitrarily; `ReChain` composes linearly with a single "current" value.

---

## Philosophy

Mutating builders are fine until they aren't. The moment a chain crosses a render boundary, gets stashed in a cache, or is shared between two callers who each think they own it, mutation becomes a liability. `ReChain` pays a small allocation cost on every step to make that liability structurally impossible. The pipeline is the value; the value is the pipeline.

---

## License

MIT
