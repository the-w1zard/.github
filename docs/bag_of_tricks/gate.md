# `gate` / `reGate`

> A promise you open manually. `gate` is one-shot — you hold the `promise`, you call `open(value)` when the thing is ready. `reGate` is the resettable version — you can close it back up and reuse it for the next round.

There is no rejection. There is no failure. A gate opens or it doesn't, and the waiter decides how long they're willing to wait.

```ts
const g = gate()
ready.once("load", () => g.open())
await g.promise   // resolves when ready fires "load"
```

The point: separate *when the thing is ready* from *how long the waiter is willing to wait.* The gate has no opinion about time. `wait(ms)` on the caller's side does. `gate` is timeless; the wait has a time.

---

## Usage

### 🟢 First-time users — start here

```ts
import { gate, reGate } from "platform"

const g = gate()

// somewhere else — maybe another file, another tick, another module
g.open()

// wherever you need to wait
await g.promise
```

That's it. You're done. You now know how to use `gate`.

The `promise` resolves when someone calls `open()`. If nobody ever does, it never resolves — no rejection, no error, just a pending promise. If you want a timeout, race it with your own:

```ts
await Promise.race([g.promise, timedPromise(new Promise(() => {}), 5000)])
```

Or use the platform's `wait(ms)` if it ships one. The gate doesn't know about the timeout. The waiter does. That asymmetry is the design.

For the reusable version:

```ts
import { reGate } from "platform"

const g = reGate<number>()

const first = g.promise
g.open(1)
console.log(await first)   // 1

g.reset()                  // ready for the next round

const second = g.promise
g.open(2)
console.log(await second)  // 2
```

### 🔵 Everyone else

#### Signatures

```ts
function gate<T = void>(): {
  promise: Promise<T>
  open: (v: T) => void
}

function reGate<T = void>(): {
  readonly promise: Promise<T>
  readonly opened: boolean
  open: (v: T | PromiseLike<T>) => void
  reset: () => void
}
```

#### `gate` — the one-shot

```ts
function gate<T = void>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, open: resolve }
}
```

Three lines of logic:

1. Create a promise whose `resolve` function is captured in a local.
2. Return `{ promise, open }` where `open` is the captured `resolve`.
3. Call `open(value)` to resolve `promise` with `value`.

`gate` is `Promise.withResolvers` with a smaller name and a default of `void`. That's the entire implementation.

#### Why no reject

The doc comment says it: **"It's deferred minus the failure case."** A `Deferred` has both `resolve` and `reject`. `gate` deliberately drops `reject`. The justification:

> *"Wait for this thing to be ready" is not a thing that fails. It just takes longer than you're willing to wait.*

Readiness is not a failure mode. There's no "the thing became un-ready." There's no "the ready event threw." The gate opens, or it stays closed. If a caller decides they've waited too long, that's the *caller's* decision, and it's a decision about the *wait*, not about the gate.

#### Why the timeout is the caller's job

`gate` has no `wait(ms)` method. No timeout, no cancellation, no abort. The gate is timeless. The caller brings the bound:

```ts
const g = gate()
// ... later ...
await Promise.race([g.promise, sleep(5000).then(() => { throw new Error("timeout") })])
```

Or, if the platform ships a `wait(ms)` that wraps a gate with a timeout, use that. `wait(0)` means "wait forever" (no timeout); `wait(5000)` means "give up at 5s." Both are correct because the *wait* has a time, and the *gate* doesn't.

This is the asymmetry the design is built on. A gate that had a built-in timeout would be making a policy decision on behalf of every waiter. Two waiters with different tolerances would fight over the same timeout. By pushing the timeout to the caller, each waiter chooses their own.

#### `reGate` — the resettable version

```ts
function reGate<T = void>() {
  let open!: (v: T | PromiseLike<T>) => void
  let promise: Promise<T>
  let opened = false

  const reset = () => {
    opened = false
    promise = new Promise<T>(resolve => open = resolve)
  }

  const release = (v: T | PromiseLike<T>) => {
    if (opened) return
    opened = true
    open(v)
  }

  reset()

  return {
    get promise() { return promise },
    get opened() { return opened },
    open: release,
    reset,
  }
}
```

Same shape as `gate`, plus two things:

- **`reset()`** — closes the gate and creates a fresh promise. The old promise is abandoned (it will never resolve if it hadn't already). Callers who captured the old `.promise` are stuck with it; callers who re-read `.promise` get the new one.
- **`opened`** — a getter that reports whether the gate has been opened since the last reset. Useful for "did anything already happen while I was setting up?"

Three details matter:

1. **`promise` is a getter, not a field.** Every access reads the current inner promise. After a `reset()`, `g.promise` is a *different* promise. Callers must re-read it if they want the latest.
2. **`release` is idempotent per cycle.** Once `open(v)` is called, `opened = true` and further `open` calls are no-ops. The `if (opened) return` guard ensures the same promise is never resolved twice with different values.
3. **`reset` sets `opened = false` before creating the new promise.** Order matters — the new promise's resolve function is assigned inside the constructor, which runs synchronously, so by the time `reset()` returns, `open` is bound to the fresh resolve.

#### The `open(v)` signature — `T | PromiseLike<T>`

In `reGate`, `open` accepts a value or a thenable. This means you can open with a promise and the gate's promise will adopt it:

```ts
const g = reGate<User>()
g.open(fetchUser())   // g.promise resolves with the user, once fetchUser settles
await g.promise
```

Same semantics as resolving a promise with another promise. `gate` is typed `(v: T) => void` but `T` could itself be a promise — the signature is stricter but functionally similar if you type `gate<Promise<User>>()`.

#### Common patterns

**Wait for a subsystem to become ready**

```ts
const ready = gate()
bus.once("subsystem:ready", () => ready.open())
await ready.promise
```

**One-shot handoff between async contexts**

```ts
let handoff = gate<string>()

async function producer() {
  const result = await compute()
  handoff.open(result)
}

async function consumer() {
  const value = await handoff.promise
}
```

**Ready-then-go barrier with a per-call timeout**

```ts
async function waitForReady(ms: number) {
  return Promise.race([
    ready.promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ])
}
```

**Reusable cycle in a game loop**

```ts
const frame = reGate<void>()

function tick() {
  frame.reset()
  render()
  frame.open()   // signals end of frame
}

async function waitForFrame() {
  return frame.promise
}
```

**Inspect whether a gate fired without blocking**

```ts
if (g.opened) {
  // already fired — reading g.promise will resolve
}
```

For `gate` (one-shot) there's no equivalent — you'd need to track readiness separately.

#### Behavior

**`gate`:**
- `open(v)` resolves the promise with `v`.
- Calling `open` more than once is harmless — the promise is already resolved.
- Calling `open` before anyone awaits is fine — the promise is resolved, and any future `await` sees the resolved value.
- The promise never rejects.

**`reGate`:**
- `open(v)` resolves the current promise with `v`, sets `opened = true`.
- Calling `open` again without `reset` is a no-op.
- `reset()` abandons the current promise and creates a new one. Any `await` on the old promise hangs forever.
- `opened` reflects the state of the *current* cycle.
- `promise` is a getter — re-read it after `reset` to get the new one.

#### Gotchas

**`gate`**
- **No timeout, no abort.** Callers who don't wrap with their own race will hang forever if the gate never opens. That's the design — but it means every call site needs a timeout policy if there's any chance the open will never happen.
- **No `reject`.** If the underlying process fails, the gate won't know. You'll need to resolve it with an error value or design the gate's consumer to handle the failure path elsewhere.
- **`open` is just `resolve`.** Not "resolve if not already resolved." Calling `open` twice with different values is a no-op the second time; the first value wins. `Promise.resolve` semantics.
- **`T = void` default.** `gate()` is `gate<void>()` — `open()` takes no arguments, and the promise resolves with `undefined`. Convenient for "just tell me when ready."

**`reGate`**
- **Old promises are abandoned on `reset`, not rejected.** If a caller captured `g.promise` before a reset and awaits it, they hang forever. This is the biggest footgun. Anyone using `reGate` must re-read `.promise` after each reset, or the abstraction leaks.
- **`open` guard checks `opened`.** Once set, additional `open` calls are dropped. If two producers race to open, only the first one's value wins. That's usually what you want — but if you wanted the second to be a no-op on the *promise* but still observable, `opened` is the only signal you get.
- **`opened` is a getter.** The object literal uses `get opened() { return opened }`, so reading it reflects the current state. If you destructure `const { opened } = reGate()`, you capture a snapshot and lose the reactivity. Don't destructure; call `g.opened` each time.
- **`promise` is a getter too.** Same advice: `g.promise`, not `const { promise } = reGate()`.
- **`reset()` in the middle of a cycle drops the current waiters.** No warning, no rejection. If you need to signal cancellation to old waiters, that's a different tool.
- **The first `reset()` happens in the constructor.** So `reGate()` returns an already-initialized gate. You don't need to call `reset` before the first use.

#### `gate` vs `reGate` vs `Deferred` vs `Lazy`

- **`gate`** — one-shot promise opener, no reject, no timeout. The value is whatever `open` is called with.
- **`reGate`** — same, but resettable for cyclic use. Old promises are abandoned on reset.
- **`Deferred`** — one-shot promise with both `resolve` and `reject`. The failure case exists.
- **`Lazy`** — deferred *computation*, not deferred *signal*. The value comes from a factory, not from an external opener.

Pick the one whose failure model matches the domain. Ready signals don't fail → `gate`. Computations fail → `Deferred` or `Lazy`. Cyclic ready signals → `reGate`.

#### What this is *not*

- Not a latch, semaphore, or barrier. It opens once (per cycle) and stays open.
- Not cancellable. If a caller gives up, the gate is unaffected.
- Not observable beyond `.promise` and `.opened`. No events, no callbacks.
- Not a queue. Multiple waiters on the same `.promise` all resolve together when opened.

---

## Philosophy

Wait-for-ready is not an operation that fails. It's an operation that takes as long as it takes, and the waiter decides when "long enough" becomes "too long." A gate that carried a timeout would make that decision for every waiter; a gate that carried a `reject` would pretend readiness has a failure mode. So the gate stays timeless and failureless. The caller brings the clock and the policy. The gate just opens.

`reGate` extends the same idea to cyclic use — with the caveat that resetting abandons the previous promise rather than resolving it, because a gate that's been reset is no longer the gate you were waiting on.

---

## License

MIT
