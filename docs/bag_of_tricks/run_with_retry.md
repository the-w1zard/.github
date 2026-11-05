# `runWithRetry`

> Run an async function, retry on failure with exponential backoff. Returns the function's value on success, `undefined` if every attempt failed. Logs each failed attempt with a label.

```ts
const result = await runWithRetry(() => fetchRemote(), "sync")
// → the value, or undefined if all 3 attempts failed
```

The point: wrap a flaky operation so a transient failure doesn't propagate. Retry, back off, give up quietly.

---

## Usage

### 🟢 First-time users — start here

```ts
import { runWithRetry } from "platform"

const data = await runWithRetry(() => flakyFetch(url), "fetch")
if (!data) {
  // all attempts failed
}
```

That's it. You're done. You now know how to use `runWithRetry`.

Pass a thunk and a label. If it succeeds, you get the value. If it fails, it retries up to `maxAttempts` times with a delay that doubles each attempt. If all attempts fail, it logs and returns `undefined` — it does not throw.

Defaults: 3 attempts, 1000ms base delay.

```ts
await runWithRetry(fn, "label")                         // 3 attempts, 1s, 2s backoff
await runWithRetry(fn, "label", 5)                       // 5 attempts, 1s, 2s, 4s, 8s
await runWithRetry(fn, "label", 3, 500)                  // 3 attempts, 500ms, 1s
```

### 🔵 Everyone else

#### Signature

```ts
async function runWithRetry(
  fn: () => any,
  label: string,
  maxAttempts = 3,
  baseDelay = 1000,
): Promise<A | undefined>
```

- `fn` — a thunk. Called on each attempt. May be sync or async.
- `label` — a string used in log messages. `[TimeMachine:${label}]`.
- `maxAttempts` — total number of attempts, including the first. Default `3`.
- `baseDelay` — the initial backoff delay in milliseconds. Doubles each retry. Default `1000`.
- Returns the value of `fn()` on success, `undefined` if all attempts fail.

#### How it works

```ts
let attempt = 0
let delay = baseDelay
while (attempt < maxAttempts) {
  try {
    return await fn()
  } catch (err) {
    attempt++
    console.log(`[TimeMachine:${label}] attempt ${attempt} failed`, err)
    if (attempt >= maxAttempts) { console.log(`[TimeMachine:${label}] all retries failed`); return }
    await new Promise(res => setTimeout(res, delay))
    delay *= 2
  }
}
```

1. Loop up to `maxAttempts` times.
2. Try `fn()`. If it returns, return the value immediately — no further attempts.
3. On throw or rejection, increment `attempt`, log the failure.
4. If we've exhausted attempts, log once more and return `undefined`.
5. Otherwise sleep for `delay` ms and double `delay` for next time.

The backoff is `baseDelay * 2^(attempt - 1)`: 1s, 2s, 4s, 8s... starting from `baseDelay`. A `baseDelay` of `500` gives `500, 1000, 2000, ...`.

#### Why exponential backoff

Immediate retries hammer a failing service. If the service is down or overloaded, retrying at full speed makes it worse and burns your own quota. Doubling the delay gives the downstream time to recover, and spreads out retry pressure across clients (assuming the initial failures weren't synchronized).

This is the standard pattern from TCP retransmission, and it's the right default for anything crossing a network or a process boundary.

#### Return semantics — success, failure, `undefined`

The function **does not throw**. On total failure, it returns `undefined`. The caller checks for the value:

```ts
const result = await runWithRetry(fn, "sync")
if (result === undefined) {
  // all attempts failed
}
```

This is a real design choice, and it has consequences:

- **Pro:** retries are self-contained. The caller doesn't need a `try` block.
- **Con:** `undefined` is ambiguous. If `fn()` legitimately returns `undefined`, the caller can't distinguish "succeeded with `undefined`" from "all attempts failed." The log messages are the only signal.

If you need to distinguish, either ensure `fn` never returns `undefined`, or wrap the call site to check the logs, or copy the function and re-throw on exhaustion.

#### Logging

Three log lines, all `console.log`:

- **Per failure:** `[TimeMachine:${label}] attempt N failed` followed by the error.
- **On exhaustion:** `[TimeMachine:${label}] all retries failed`.

The `TimeMachine` prefix is hardcoded. If you're vendoring, rename it or route it through your own logger. `console.log` is not structured; if you need to pipe these to a log aggregator, replace the calls.

#### Common patterns

**Flaky network calls**

```ts
const res = await runWithRetry(
  () => fetch(url).then(r => r.json()),
  "api.getUser",
  5,
  250,
)
```

**Idempotent writes**

```ts
await runWithRetry(() => store.put(key, value), "store.put")
```

**Initialization that can race**

```ts
const conn = await runWithRetry(
  () => connectDb(),
  "db.connect",
  10,
  100,
)
```

**Retry with an inner timeout**

```ts
await runWithRetry(
  () => timedPromise(fetch(url), 3000),
  "api.withTimeout",
)
```

Each attempt gets its own 3-second bound; the retry loop bounds the total number of attempts.

**Wrapping a non-idempotent operation deliberately**

```ts
// POST that may have succeeded server-side but failed to reply
await runWithRetry(() => postWithIdempotencyKey(key, body), "post")
```

Retries on non-idempotent operations are dangerous. Use an idempotency key on the request so the server can dedupe.

#### Behavior

- **First attempt runs immediately.** No delay before the first try.
- **Delay between attempts, not after the last.** If the last attempt fails, no delay; the function returns `undefined` right away.
- **Backoff doubles per attempt.** `baseDelay`, `2 * baseDelay`, `4 * baseDelay`, ...
- **`fn` can be sync or async.** The `await fn()` handles both.
- **Synchronous throws are caught.** `try` wraps the call, so `throw` inside `fn` is treated the same as a rejection.
- **The loop is a `while` with an explicit `attempt` counter.** No `for` loop, no `forEach`, no recursion. Easy to follow and to instrument.

#### Gotchas

- **Returns `undefined` on failure, never throws.** If the caller doesn't check, a failure looks like a success with no value. If your code can't tell `undefined` from a legitimate return, this is a footgun.
- **`fn` must be a thunk.** Pass `() => doThing()`, not `doThing()`. If you pass a promise, the first `try` awaits it, and if it rejects, the retry calls `fn()` again — which returns the *same already-rejected promise*, and every retry sees the same rejection. Always pass a thunk.
- **`console.log` is hardcoded.** No log level, no structured logging, no way to silence. In production code, this is usually the first thing to replace.
- **`[TimeMachine]` prefix is hardcoded.** Rename if the subsystem isn't called that.
- **Backoff is unbounded.** With `baseDelay = 1000` and `maxAttempts = 30`, the last delay is ~8.9 *days*. Choose `maxAttempts` with the growth rate in mind, or add a cap.
- **No jitter.** Every caller retrying at the same time will retry at the same intervals. For a fleet of clients hitting a recovering service, this produces synchronized retry storms. Standard practice is to add random jitter: `delay * (0.5 + Math.random())`. This function doesn't.
- **No abort signal.** Once started, it runs to completion (success or exhaustion). No way to cancel from outside.
- **`maxAttempts <= 0`** — the `while` loop never runs, `attempt` stays 0, and the function returns `undefined` without ever calling `fn`. Same for `maxAttempts = 0`. Only `maxAttempts >= 1` actually attempts anything.
- **`maxAttempts = 1`** means one attempt, no retry. Correct, but worth noting.
- **`baseDelay = 0`** — the wait is a `setTimeout(..., 0)` on every retry. Effectively immediate, which defeats the purpose of backoff. If you want no delay, pass `0` knowingly.
- **The error is logged but not accumulated.** If you need the final error (to inspect it, to rethrow a wrapped version, or to report it), this function doesn't give it to you. Only the logs.
- **The `any` return type.** No generic `T`, so callers get `any` and lose type information. If you want the value typed, wrap it: `const x = (await runWithRetry(...)) as MyType`.

#### What this is *not*

- Not a circuit breaker. It retries; it doesn't stop retrying when the downstream is known-broken.
- Not a timeout. Each attempt is unbounded; use `timedPromise` inside `fn` if you need per-attempt bounds.
- Not a rate limiter. Between-attempt delays are backoff, not throttling.
- Not a task queue. It runs `fn` immediately, one attempt at a time, and finishes.

---

## Philosophy

Flaky operations fail transiently, and transient failures shouldn't be the caller's problem. `runWithRetry` handles them: try, back off, try again, give up quietly with a log. The caller gets a value or `undefined`, never an exception. The cost is that the caller has to *check* the value, and the function never tells them *why* it failed — only the logs know.

---

## License

MIT
