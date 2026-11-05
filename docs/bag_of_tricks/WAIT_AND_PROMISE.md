# `wait_and_promise`

> Subscribe to a key, then check whether the condition is already true. If it is, resolve immediately with the current value. If not, wait for the subscription to fire. If neither happens before `timeoutMs`, reject.

The ordering — **subscribe first, then re-check** — is the entire point. It closes the race window where the thing you're waiting for fires between your early-return check and your subscription.

```ts
const value = await wait_and_promise(5000, key, isOpen(), currentValue)
// → resolves with next.value when the subscription fires with opened: true
// → resolves immediately with currentValue if isOpen was already true
// → rejects after 5000ms if neither happened
```

---

## Usage

### 🟢 First-time users — start here

```ts
import { wait_and_promise } from "platform"

const value = await wait_and_promise(
  5000,           // timeout in ms (0 or falsy = no timeout)
  myKey,          // subscription key
  isOpen(),       // is the thing already open right now?
  currentValue,   // value to resolve with if it's already open
)
```

That's it. You're done. You now know how to use `wait_and_promise`.

Three possible outcomes:

1. It's already open → resolves **immediately** with `currentValue`.
2. It opens while you're waiting → resolves with the new value.
3. It never opens → rejects after `timeoutMs` with a timeout error.

Pass `0` (or any falsy value) as `timeoutMs` to wait forever with no timeout.

### 🔵 Everyone else

#### Signature

```ts
function wait_and_promise<T = A>(
  timeoutMs: number,
  key: A,
  isOpen: A,
  current: A,
): Promise<T>
```

- `timeoutMs` — milliseconds before rejection. `0` or falsy disables the timeout entirely.
- `key` — the subscription key passed to `sub`.
- `isOpen` — a truthy value if the condition is already satisfied. Checked *after* subscribing.
- `current` — the value to resolve with if `isOpen` is truthy.
- Returns `Promise<T>`.

#### Why subscribe before checking

The naive version is:

```ts
if (isOpen) return current          // check
const unsub = sub(key, handler)     // then subscribe
```

The gap between those two lines is a race. If the condition flips to open *between* the check and the subscribe, the subscription never sees the transition (because it happened before the subscription existed), and the check already returned false. The caller hangs until timeout even though the condition was true.

The correct order is the opposite:

```ts
const unsub = sub(key, handler)     // subscribe first
if (isOpen) { unsub(); resolve(current); return }   // then check
```

Now the two cases are:

1. **Condition was already open before subscribe** → the check catches it. Resolve with `current`.
2. **Condition opens after subscribe** → the handler catches it. Resolve with `next.value`.

There is no third case where the transition happens between the check and the subscribe, because the subscribe already happened. The handler fires, the check is redundant but harmless, and the promise settles.

The cost of this correctness is one line: the `if (timer) clearTimeout(timer)` and `unsub()` must run on both paths, so the subscription is never leaked.

#### How it works, line by line

```ts
return new Promise<T>((resolve, reject) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsub = sub(key, (next) => {
    if (next?.opened) {
      if (timer) clearTimeout(timer);
      unsub();
      resolve(next.value as T);
    }
  });

  if (isOpen) {
    if (timer) clearTimeout(timer);
    unsub();
    resolve(current as T);
    return;
  }

  if (timeoutMs) {
    timer = setTimeout(() => {
      unsub();
      reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  }
});
```

1. **`sub(key, handler)`** registers the subscription. The handler is called whenever the value at `key` changes.
2. **Handler** checks `next?.opened`. If truthy, it clears the timer (if one exists), unsubscribes, and resolves with `next.value`. The `next?.` optional chain guards against a `null` / `undefined` payload.
3. **`if (isOpen)`** — after subscribing, check whether the condition is *already* satisfied. If so, clear timer, unsubscribe, resolve with `current`. The `return` prevents falling through to the timer setup.
4. **`if (timeoutMs)`** — only arm a timer if a timeout was requested. `0` (or any falsy value) means "wait forever." The timer callback unsubscribes and rejects.

**Order of cleanup** on every exit path: clear the timer first (if set), then unsubscribe, then resolve or reject. Clearing the timer before unsubscribing is not strictly required, but it prevents the timer callback from running `unsub()` a second time if there's any interleaving.

#### Two ways to resolve, one way to reject

The promise resolves through exactly two channels:

- The **subscription handler** — `next.value` when the subscription fires with `opened: true`.
- The **immediate check** — `current` when `isOpen` is truthy at subscribe time.

It rejects through exactly one:

- The **timer** — when `timeoutMs` elapses without either resolve path firing.

`resolve` and `reject` are idempotent in JavaScript — the first call wins, subsequent calls are no-ops. So even if the handler fires *and* the timer would have fired *and* the check runs, only the first `resolve` or `reject` has any effect. The explicit cleanup exists to prevent leaks, not to prevent double-settling.

#### The race this closes

Imagine the state flips from closed to open exactly once, in this timeline:

```
t0: caller checks isOpen → false
t1: state flips to open (fires subscription handlers)
t2: caller subscribes
```

Naive version: `isOpen` check at t0 was false, subscribe at t2 missed the transition. Caller waits forever (or until timeout).

This version:

```
t0: caller subscribes
t1: state flips to open → handler fires → resolve
t2: (unreachable — promise is settled)
```

Or:

```
t0: caller subscribes
t1: caller checks isOpen → true (state already flipped before t0)
t2: resolve immediately
```

Both cases resolve. Neither hangs.

The tradeoff is that `isOpen` and `current` must be captured *before* the call — they're arguments, not re-read inside the promise. If the state changes between the caller's `isOpen()` and the `sub()` inside `wait_and_promise`, the immediate check might be stale. But the subscription will still fire if the state changes *again*, and if the state is already open at check time, `current` is what the caller passed. The contract is: `isOpen` and `current` should be read from the same source at the same moment.

#### Common patterns

**Wait for a specific state to open**

```ts
const conn = await wait_and_promise(
  10_000,
  `conn:${id}`,
  pool.isOpen(id),
  pool.get(id),
)
```

**Wait forever, no timeout**

```ts
await wait_and_promise(0, key, isOpen, current)
```

**Wait with a short bound, on a hot path**

```ts
const value = await wait_and_promise(250, key, isOpen, current)
```

#### Gotchas

- **`next?.opened` requires the payload to have an `opened` field.** If the subscription fires with a payload that doesn't have `opened` truthy, the handler does nothing — the subscription stays alive, and the promise stays pending. Whatever `sub` emits for non-open transitions is silently ignored.
- **`next.value` is cast to `T`.** If the payload doesn't have a `value` field or it's the wrong type, you get it anyway. The cast is a promise to the type system, not a runtime check.
- **`current` is cast to `T`.** Same contract. The caller is trusted to pass a `current` that matches `T`.
- **Falsy `timeoutMs` means no timeout, not a zero timeout.** `0`, `null`, `undefined`, `NaN`, `""` all disable the timer. If you meant "time out immediately," pass a small positive number like `1`.
- **`sub` must return an unsubscribe function.** If it returns anything else, calling `unsub()` will throw. The contract is assumed, not checked.
- **No `AbortSignal` support.** There's no way to cancel from outside. The only ways to settle are the subscription, the immediate check, or the timeout. If you need external cancellation, wrap this in another promise and race.
- **The `[rift]` prefix is hardcoded.** Same as `timedPromise`. Vendor and rename if the prefix doesn't match your subsystem.
- **No `finally`.** If the promise rejects on timeout, the subscription is cleaned up inside the timer callback. If the promise resolves, it's cleaned up in the resolve path. There's no path where the subscription leaks — but there's also no external hook if you need to observe the cleanup.
- **The `A` type parameter in `T = A` refers to a module-scoped `A`.** This is a project convention, not a standard generic. If you copy the function into a codebase without `A`, replace the default or remove it.

#### What this is *not*

- Not a general-purpose pub/sub subscription. It resolves once and unsubscribes. If you need ongoing subscription, use `sub` directly.
- Not a state observer. It watches for one specific transition (`opened` becoming truthy) and then stops.
- Not a polling mechanism. It relies on `sub` pushing updates. If `sub` never fires and the timeout is disabled, the promise never settles.
- Not a `Promise.race` — there's no second promise running in parallel. The subscription and the timer are managed explicitly with cleanup on every path.

---

## Philosophy

Subscribe first, then check. Any code that does it the other way has a race window where the event you're waiting for fires in the gap, and the caller hangs forever. The fix costs one extra line of cleanup and closes the window entirely. Wait on the subscription; verify the state after. Resolve on whichever fires first.

---

## License

MIT
