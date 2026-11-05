# `sleep`

> Wait for a number of milliseconds. Returns a promise that resolves after the delay. That's the whole thing.

```ts
await sleep(1000)   // waits one second
```

The point: an awaitable delay. `setTimeout` is a callback API; `sleep` is the promise version. Pause an async function without wrapping `setTimeout` in a promise every time.

---

## Usage

### 🟢 First-time users — start here

```ts
import { sleep } from "platform"

await sleep(1000)
```

That's it. You're done. You now know how to use `sleep`.

Pause, then continue. `sleep(0)` yields to the next macrotask — useful for "let the event loop breathe" moments.

### 🔵 Everyone else

#### Signature

```ts
const sleep = (ms: number): Promise<void>
```

- `ms` — milliseconds to wait. Standard `setTimeout` semantics apply.
- Returns `Promise<void>` — resolves with `undefined` after the delay.
- Never rejects. No cancellation. No signal.

#### How it works

```ts
new Promise(resolve => setTimeout(resolve, ms))
```

One line. `setTimeout` is called with `resolve` as the callback, so the promise settles when the timer fires. The value passed to `resolve` is `undefined` (the return value of `setTimeout`'s callback is discarded).

#### Timing semantics

`sleep(ms)` does **not** guarantee "resume after exactly `ms` milliseconds." It guarantees "resume no earlier than `ms` milliseconds from now, whenever the event loop gets around to it." Three things can push the actual resume later:

1. **The event loop is busy.** If a long synchronous task is running when the timer fires, `sleep` resumes after that task finishes.
2. **Other timers are queued ahead.** `setTimeout` callbacks fire in order of scheduled time, but if the loop is behind, they all run together.
3. **Browsers clamp timers.** Nested timers beyond 5 levels are clamped to a minimum of 4ms. Background tabs clamp to 1000ms or more. This is the platform, not `sleep`.

For most code, none of this matters. If you're building a precise timer, use `performance.now()` and re-schedule.

#### `sleep(0)` — yielding

`sleep(0)` doesn't "sleep." It schedules a macrotask via `setTimeout(_, 0)`. This yields control back to the event loop, allowing pending microtasks and I/O callbacks to run before resuming. Useful when you want to break up a synchronous loop:

```ts
for (const item of hugeList) {
  process(item)
  await sleep(0)   // let the event loop breathe
}
```

This is the macrotask equivalent of `await Promise.resolve()`. It's slower than a microtask yield but allows I/O to run in between.

#### Common patterns

**Basic pause**

```ts
await sleep(500)
```

**Rate limiting in a loop**

```ts
for (const item of items) {
  await process(item)
  await sleep(100)   // 100ms between items
}
```

**Backoff between retries**

```ts
for (let i = 0; i < 5; i++) {
  try { return await attempt() }
  catch { await sleep(1000 * 2 ** i) }
}
```

Same pattern as `runWithRetry` and `retryWithBackoff`, written out inline.

**Yield to the event loop**

```ts
await sleep(0)
```

**Minimal debounce**

```ts
let pending: Promise<void> | undefined
function debounced() {
  pending = sleep(100).then(run)
}
```

Not the real debounce pattern, but `sleep` is the delay primitive underneath.

**Composing with a timeout**

```ts
await Promise.race([operation(), sleep(5000).then(() => { throw new Error("timeout") })])
```

`sleep` is the timeout arm of a race. The same trick appears inside `timedPromise`.

#### Behavior

- **Always resolves with `undefined`.** Never with a value, never rejects.
- **Timers aren't cancelled by anything.** Once `sleep` is called, the timer runs even if the caller's outer context has given up. The promise will resolve; whether anyone is still awaiting it is another matter.
- **No `AbortSignal` support.** No way to cancel from outside. If you need cancellable sleep, wrap it:

  ```ts
  function cancellableSleep(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms)
      signal.addEventListener("abort", () => {
        clearTimeout(timer)
        reject(new Error("aborted"))
      }, { once: true })
    })
  }
  ```

  `sleep` deliberately doesn't do this. It's the smallest possible delay primitive.

- **`ms` can be negative or `NaN`.** `setTimeout` coerces to `0`. `sleep(-100)` is effectively `sleep(0)`.
- **`ms` can be `Infinity`.** `setTimeout(_, Infinity)` is treated as `setTimeout(_, 0)` in most engines — it doesn't wait forever. If you need "never resolve," use `new Promise(() => {})`.

#### Gotchas

- **Not a real sleep.** `sleep` doesn't block the thread; it yields to the event loop. Other code runs during the pause. This is what you want most of the time, but it's not the same as a synchronous pause (which doesn't exist in JS anyway).
- **Not precise.** See timing semantics above. Don't use `sleep` for scheduling; use it for delaying.
- **Timer leaks in hot loops.** A `sleep(Infinity)` (which becomes `sleep(0)`) in a tight loop still schedules a timer per iteration. Cheap, but not free.
- **`await sleep(0)` is a macrotask yield, not a microtask.** If you want a microtask yield (i.e., wait for the current microtask queue to drain), use `await Promise.resolve()` or `await null`. `sleep(0)` is slower — it waits for the next macrotask cycle.
- **No cleanup on abandonment.** If a caller `await`s a sleep and the surrounding promise is abandoned (e.g., a component unmounts), the timer still fires. The `.then` handlers on the outer promise simply don't do anything if no one's listening.
- **Test timing.** `sleep` in tests means real wall-clock waits, which adds up. Use fake timers (`jest.useFakeTimers()`, `vi.useFakeTimers()`) to control `setTimeout` and skip the actual wait. `sleep` composes with fake timers because it's just `setTimeout` underneath.
- **Node process lifetime.** A pending `sleep` keeps the Node process alive until the timer fires. If your script ends with an outstanding `sleep`, the process waits. `clearTimeout` can't reach it from the outside — the timer handle isn't exposed.

#### What this is *not*

- Not a scheduler. It doesn't fire at a specific wall-clock time; it delays by a relative amount.
- Not cancellable. No signal, no handle, no abort.
- Not `setTimeout` with a promise wrapper for cleanup. It returns the promise only; the timer handle is internal.
- Not a blocking sleep. Nothing in JS blocks the thread like a true sleep syscall.

---

## Philosophy

`setTimeout` is a callback API. `sleep` is the promise version of it, one line, no ceremony. Every async delay in a codebase is either a `setTimeout` wrapped in a promise or an `await sleep(ms)`. The second is what everyone means; the first is what they write when there's no primitive. There's a primitive now.

---

## License

MIT
