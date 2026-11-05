# `timedPromise`

> Race a promise against a timeout. If the promise settles first, you get its result. If the timeout fires first, you get a rejection with a clear message. The timer is always cleared, so a fast resolve doesn't leave a dangling `setTimeout` keeping the process alive.

```ts
await timedPromise(fetchUser(id), 5000)
// → resolves with the user, or rejects with "[rift] wait() timed out after 5000ms"
```

---

## Usage

### 🟢 First-time users — start here

```ts
import { timedPromise } from "platform"

const user = await timedPromise(fetchUser(id), 5000)
```

That's it. You're done. You now know how to use `timedPromise`.

It's `await` on the promise, except if it takes longer than `timeoutMs`, you get a rejection instead of waiting forever. The rejection is a regular `Error` — catch it like any other.

```ts
try {
  const user = await timedPromise(fetchUser(id), 5000)
} catch (e) {
  // either fetchUser rejected, or it took longer than 5s
}
```

### 🔵 Everyone else

#### Signature

```ts
function timedPromise<T>(gate: Promise<T>, timeoutMs: number): Promise<T>
```

- `gate` — the promise you actually care about.
- `timeoutMs` — how long to wait, in milliseconds.
- Returns a `Promise<T>` that resolves with `gate`'s value, rejects with `gate`'s rejection, or rejects with a timeout error if `timeoutMs` elapses first.

#### How it works

```ts
let timer!: ReturnType<typeof setTimeout>
const timeout = new Promise<T>((_, reject) => {
  timer = setTimeout(() => reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`)), timeoutMs)
})
return Promise.race([gate, timeout]).finally(() => clearTimeout(timer))
```

Three parts:

1. **A timeout promise** is created that rejects after `timeoutMs`. The timer handle is captured in `timer` so it can be cleared later.
2. **`Promise.race`** resolves or rejects with whichever of `gate` or `timeout` settles first.
3. **`.finally`** clears the timer regardless of which side won — so a fast `gate` resolve doesn't leave a stray `setTimeout` on the event loop.

The `!` on `timer` is a TypeScript assertion: the executor runs synchronously, so by the time the line `timer = setTimeout(...)` finishes, the assignment has happened. There is no window where `timer` is uninitialized when `.finally` runs.

#### Why the timer is cleared

A `setTimeout` that hasn't fired yet is a live event-loop handle. If you don't clear it, a process that calls `timedPromise` many times will accumulate pending timers, and a Node process with pending timers won't exit on its own. The `.finally` guarantees the cleanup fires on **both** branches:

- **Gate wins** → `.finally` runs → timer cleared → no pending handle.
- **Timeout wins** → `.finally` runs → timer cleared (already fired, so clearing is a no-op, but it's harmless and correct).

Clearing a fired timer is safe in Node and in browsers. So this works uniformly without a branch.

#### Behavior

- **Fast resolve** → `T`, timer cleared, no rejection.
- **Fast reject** → `gate`'s rejection, timer cleared.
- **Slow resolve** → `Error("[rift] wait() timed out after Nms")` after `timeoutMs`.
- **Slow reject** → the timeout error wins the race; `gate`'s eventual rejection is swallowed by `Promise.race`.
- **`timeoutMs: 0`** → the timeout fires on the next tick. Usually the gate loses. Rarely useful, occasionally useful for "must already be resolved."
- **Negative or `NaN` `timeoutMs`** → `setTimeout` coerces to `0`. Same as above.

#### Common patterns

**Bounding an unreliable call**

```ts
const response = await timedPromise(fetch(url), 10_000)
```

**Bounding an internal operation**

```ts
const result = await timedPromise(runJob(job), 30_000)
```

**Composing with retry**

```ts
for (let i = 0; i < 3; i++) {
  try {
    return await timedPromise(fetchUser(id), 2_000)
  } catch (e) {
    if (i === 2) throw e
  }
}
```

**Detecting a timeout specifically**

The rejection is a plain `Error` with a recognizable message prefix (`[rift]`). If you need to distinguish timeouts from real failures, check the message, or wrap the whole thing:

```ts
try {
  return await timedPromise(gate, ms)
} catch (e) {
  if (e instanceof Error && e.message.startsWith("[rift] wait()")) {
    // it timed out
  }
  throw e
}
```

#### Gotchas

- **The losing promise is not cancelled.** `timedPromise` rejects on timeout, but the original `gate` keeps running. If `gate` is a `fetch`, the request is still in flight. If `gate` is a long computation, it continues to burn CPU. JS has no way to abort a generic promise; use `AbortController` with APIs that support it if you need real cancellation.
- **The message says `[rift] wait()`.** It's hardcoded to the `rift` subsystem. If you're vendoring this, change the prefix so your logs don't lie.
- **The rejection is a plain `Error`, not a distinct class.** You can't `instanceof TimeoutError` against it. If you need that, wrap or replace the rejection.
- **`Promise.race` swallows the loser.** If `gate` rejects *after* the timeout fired, that rejection is unhandled — it goes nowhere. In Node, that can trigger an unhandled-rejection warning if the rejection wasn't attached to anything. The `.finally` chain doesn't catch it. If `gate` is a promise that can reject late, attach a `.catch(() => {})` to it before passing it in, or pass a thunk and create the promise inside.
- **No `AbortSignal` parameter.** This races; it doesn't cancel. If you want cooperative cancellation, thread a signal through `gate`'s own implementation.
- **Zero is a valid timeout.** It fires on the next tick and will almost always win. Intended only for "must already be settled" checks.

#### What this is *not*

- Not cancellation. The losing side keeps running.
- Not a retry. One shot, one race.
- Not a debounce or throttle. It doesn't touch how often `gate` runs.
- Not a replacement for `AbortSignal.timeout`. `AbortSignal.timeout` is the platform's built-in version of this and integrates with `fetch` and anything else that accepts a signal. Use that when you can; use `timedPromise` when you can't.

---

## Philosophy

A promise that never settles is a worse failure than a promise that fails. `timedPromise` makes the never-settles case into a rejection with a clear message, and clears its own timer on every path so it leaves no trace on the event loop. Race and clean up. That's the whole contract.

---

## License

MIT
