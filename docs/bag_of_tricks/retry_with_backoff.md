# `retryWithBackoff`

> Retry an async attempt up to N times with exponential backoff, a delay cap, and cooperative cancellation. Returns the first defined value the attempt produces, or `undefined` if every attempt fails, returns `undefined`, or the operation is cancelled.

```ts
const user = await retryWithBackoff({
  attempt: async (n) => fetchUser(id),
})
// → the user, or undefined if all 4 attempts failed
```

Built for the React/`useEffect` case: an `isCancelled` callback checked at every `await` boundary, so an unmounted component never resolves into stale state.

---

## Usage

### 🟢 First-time users — start here

```tsx
import { retryWithBackoff } from "platform"
import { useEffect, useState } from "react"

useEffect(() => {
  let cancelled = false
  retryWithBackoff({
    isCancelled: () => cancelled,
    attempt: async (n) => {
      return fetchData()   // whatever you're trying to get
    },
  }).then(setData)
  return () => { cancelled = true }
}, [])
```

That's it. You're done. You now know how to use `retryWithBackoff`.

The pattern is always the same:

1. Set a `cancelled` flag in the effect body.
2. Pass `isCancelled: () => cancelled` to the retry call.
3. Flip `cancelled` in the cleanup function.

The retry loop checks the flag before each attempt, between attempts, and after the sleep — so once the component unmounts, no further work happens and no stale value is resolved into state.

### 🔵 Everyone else

#### Signature

```ts
function retryWithBackoff<T>({
  attempts?: number,           // default 4
  baseDelayMs?: number,        // default 1000
  maxDelayMs?: number,         // default 12000
  isCancelled?: () => boolean, // default () => false
  attempt?: (n: number) => Promise<T | undefined>,
  onAttemptFailed?: (n: number, e: unknown) => void,
  onGiveUp?: () => void,
}): Promise<T | undefined>
```

Every option has a default, and the two callbacks have default `console.log` implementations. You can call it with just `{ attempt }` and it will retry up to 4 times with 1s / 2s / 4s / 8s delays, capping at 12s.

#### What `attempt` must return

`attempt(n)` receives the attempt number starting at **1** and must return the value you want, or `undefined` to signal "try again." This is different from "throw on failure." Both are supported:

- **Return `undefined`** → treated as "not ready, retry."
- **Throw or reject** → `onAttemptFailed(n, err)` is called, then retry.
- **Return anything else** → the value is returned from `retryWithBackoff` immediately.

This lets you distinguish "no value yet, keep trying" (return `undefined`) from "an error happened" (throw), and log them differently.

#### How it works

```ts
for (let n = 1; n <= attempts; n++) {
  if (isCancelled?.()) return undefined
  try {
    const v = await attempt(n)
    if (v !== undefined) return v
  } catch (err) {
    onAttemptFailed?.(n, err)
  }
  if (n === attempts) break
  if (isCancelled?.()) return undefined
  await sleep(delay)
  if (isCancelled?.()) return undefined
  delay = Math.min(delay * 2, maxDelay)
}
onGiveUp?.()
return undefined
```

Walk through the steps:

1. **Cancellation check before the attempt.** If the operation was cancelled since the last iteration, bail without doing work.
2. **Run the attempt.** If it returns a defined value, return it. If it returns `undefined`, fall through to retry. If it throws, log via `onAttemptFailed` and fall through to retry.
3. **If this was the last attempt, break.** No point checking cancellation or sleeping.
4. **Cancellation check after the attempt.** If the caller cancelled while we were awaiting, bail.
5. **Sleep for `delay` ms.** Then check cancellation again — the cancellation may have happened during the sleep.
6. **Double the delay**, capped at `maxDelay`.
7. **After the loop, call `onGiveUp` and return `undefined`.**

The three cancellation checks — before the attempt, before the sleep, and after the sleep — are the reason this is safe for React. An unmount during any part of the cycle stops the loop on the next check.

#### Why three cancellation checks

Each `await` is a potential pause. Between any two checks, the caller can set the cancelled flag. The boundaries that matter:

- **Before the attempt:** don't start work that's already been abandoned.
- **After the attempt, before the sleep:** the work finished but the caller may have cancelled during it. No point sleeping if we're not going to try again.
- **After the sleep:** the flag may have flipped during the sleep. Don't re-enter the loop and start another attempt.

Without all three, there's a window where the operation would do extra work after cancellation. With all three, cancellation is honored at every meaningful pause.

#### Delay schedule

With defaults `baseDelayMs = 1000`, `maxDelayMs = 12000`, `attempts = 4`:

| Attempt | Fails → sleep | Cumulative wait |
| --- | --- | --- |
| 1 | 1000ms | 1s |
| 2 | 2000ms | 3s |
| 3 | 4000ms | 7s |
| 4 | — (last attempt) | 7s total |

With `attempts = 10`, delays go 1s, 2s, 4s, 8s, 12s, 12s, 12s, 12s, 12s — capped at `maxDelayMs`.

The cap is what `Math.min(delay * 2, maxDelay)` does. Without it, `attempts = 20` would produce a final delay measured in days.

#### `undefined` vs thrown error

Two different failure signals, treated differently:

- **`attempt` returns `undefined`** → silent retry. No `onAttemptFailed` call. Useful for "not ready yet, keep polling."
- **`attempt` throws** → `onAttemptFailed(n, err)` is called, then retry. Useful for "something went wrong, log it and try again."

You can mix both in a single attempt:

```ts
attempt: async (n) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)   // logged
  const data = await res.json()
  return data.ready ? data : undefined                 // silent retry
}
```

Both paths lead to retry. The difference is only whether the failure is logged.

#### Common patterns

**Polling until a value is ready**

```ts
const job = await retryWithBackoff({
  attempts: 20,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  attempt: async () => {
    const status = await getJobStatus(id)
    return status.done ? status.result : undefined
  },
})
```

**Effect-scoped fetch with unmount safety**

```tsx
useEffect(() => {
  let cancelled = false
  retryWithBackoff({
    isCancelled: () => cancelled,
    attempt: async () => fetchProfile(userId),
  }).then(p => { if (!cancelled) setProfile(p) })
  return () => { cancelled = true }
}, [userId])
```

**Custom failure logging**

```ts
await retryWithBackoff({
  attempt: () => postWebhook(payload),
  onAttemptFailed: (n, e) => log.warn({ attempt: n, err: e }, "webhook failed"),
  onGiveUp: () => log.error("webhook gave up"),
})
```

**Silencing the default console logs**

```ts
await retryWithBackoff({
  attempt: () => work(),
  onAttemptFailed: () => {},   // silence
  onGiveUp: () => {},          // silence
})
```

**Subclass of retry logic that inspects the final error**

The function doesn't return the final error. If you need it, capture it in a closure:

```ts
let lastErr: unknown
await retryWithBackoff({
  attempt: () => work(),
  onAttemptFailed: (_, e) => { lastErr = e },
})
// lastErr holds the last error, if you need it
```

#### Behavior

- **First attempt runs immediately.** No delay before attempt 1.
- **`n` starts at 1.** `attempt(1)`, `attempt(2)`, ... through `attempt(attempts)`.
- **Delay is between attempts only.** After the last attempt, the function returns without sleeping.
- **`onGiveUp` runs exactly once** if the loop exhausts. It doesn't run if the function returns early on success or cancellation.
- **`undefined` return on: total exhaustion, or cancellation.** These two cases are indistinguishable from the caller's perspective — you can't tell "tried 4 times, all failed" from "cancelled on attempt 2" without extra logging.
- **`maxDelay = maxDelayMs ?? Infinity`.** If you pass `maxDelayMs = undefined`, the cap is Infinity and the delay grows unbounded (subject to `Number.MAX_SAFE_INTEGER` for the timer).
- **`isCancelled` is optional.** Default is `() => false`, so the loop never checks. Passing `undefined` explicitly also works — the `isCancelled?.()` calls are optional.
- **`attempt` is optional and has a default.** The default just logs. Useful only as a placeholder during development.
- **`onAttemptFailed` and `onGiveUp` are optional.** Defaults log to console. Pass a no-op to silence.

#### Gotchas

- **`attempt` must be a thunk.** Pass `attempt: () => fetchUser(id)`, not `attempt: fetchUser(id)`. If you pass a promise, the first attempt awaits it, and every retry sees the same settled promise. Same rule as every retry helper.
- **`undefined` is the "retry" signal.** If your attempt legitimately returns `undefined` as a valid value, this function treats it as failure and retries. Design your `attempt` so `undefined` means "not ready."
- **`isCancelled` returning `undefined` is falsy.** It's fine — the checks are `if (isCancelled?.())`, and `undefined` is falsy. No bug, just worth noting: only truthy returns count as cancelled.
- **Cancellation returns `undefined`, not a distinct cancellation signal.** Callers using `isCancelled` often want to know *why* the promise resolved with `undefined` — cancelled vs. gave up. The function doesn't distinguish. Use `onGiveUp` as the signal that the loop ran to completion; a cancelled call won't invoke it.
- **`onGiveUp` does not fire on cancellation.** Only on exhaust. If you need to know a cancellation happened, log inside your `isCancelled` implementation, or check the flag after the await returns.
- **No jitter.** Every caller retries on the same schedule. For fleets, add jitter — see `runWithRetry` for the same caveat. This function doesn't.
- **`attempts` is not validated.** `attempts = 0` → the `for` loop never runs → `onGiveUp` fires immediately, returns `undefined`. `attempts = -1` → same. Not a crash, but the function does nothing useful.
- **`baseDelayMs = 0`** → every sleep is `setTimeout(0)`. Effectively immediate retries, which defeats the point of backoff. Intended for tests only.
- **The generic `T` is inferred from `attempt`.** `attempt: () => fetchUser()` gives `retryWithBackoff<User>`, so the resolved promise is `Promise<User | undefined>`. Good inference as long as `attempt` is typed properly. If `attempt` is `any`-typed, `T` collapses to `any`.
- **`Promise<T | undefined>` is honest.** The `undefined` in the return type is exactly the ambiguous case: it can mean "succeeded with `undefined`," "all attempts failed," or "cancelled." The type system can't help you here — you have to reason about it.
- **`console.log` inside the default callbacks is not structured.** Replace `onAttemptFailed` and `onGiveUp` with your logger in production code.

#### Comparison with `runWithRetry`

Both do exponential backoff with a delay cap. Differences:

| | `runWithRetry` | `retryWithBackoff` |
| --- | --- | --- |
| Cancellation | no | yes (`isCancelled`) |
| Delay cap | no (unbounded doubling) | yes (`maxDelayMs`) |
| Return on give-up | `undefined` | `undefined` |
| Error reporting | `console.log` only | `onAttemptFailed` callback |
| Give-up reporting | `console.log` only | `onGiveUp` callback |
| Retry signal | throw only | `undefined` **or** throw |
| Attempt number | implicit | passed to `attempt(n)` |
| Default attempts | 3 | 4 |

Use `runWithRetry` for a quick script. Use `retryWithBackoff` for React effects, long-running operations, or anything where you need cancellation and a delay cap.

#### What this is *not*

- Not a circuit breaker. It retries every time; it doesn't stop when the downstream is known-broken.
- Not a rate limiter. Backoff delays are between attempts, not a throttle on request rate.
- Not a timeout mechanism. Each attempt is unbounded in duration. Wrap the attempt with `timedPromise` if you need per-attempt bounds.
- Not a queue. It runs one attempt at a time and finishes.
- Not a cancellation primitive on its own. `isCancelled` is a convention — the caller provides the flag; this function only checks it at safe points.

---

## Philosophy

Retry is easy. Retry that doesn't outlive the thing that requested it is the whole game. `retryWithBackoff` checks a cancellation flag at every pause — before the attempt, before the sleep, after the sleep — so the loop can't outlive its owner. Everything else (backoff schedule, cap, callbacks) is the usual suspects. Cancellation is the reason the function exists.

---

## License

MIT
