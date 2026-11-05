# `Finally`

> Run a function for its side effect, return the value unchanged. Same shape as `tap`, but named for the intent: "do this cleanup / teardown / bookkeeping in passing, and hand the value back."

```ts
return Finally(computeResult(), () => cleanup())
// → cleanup runs, computeResult()'s value is returned
```

The point: inject a "finally" into an expression. Where a `try` / `finally` block would run `fn` before returning, `Finally(value, fn)` runs `fn` before returning the value — inside a single expression, no statement, no variable.

---

## Usage

### 🟢 First-time users — start here

```ts
import { Finally } from "platform"

const x = Finally(doWork(), () => console.log("done"))
// logs "done", x is whatever doWork() returned
```

That's it. You're done. You now know how to use `Finally`.

It's `fn()` then `return value`. The value goes through; the function runs on the way.

### 🔵 Everyone else

#### Signature

```ts
function Finally<T>(value: T, fn: () => any): T
```

- `value` — anything. Object, primitive, promise, whatever.
- `fn` — a function called with no arguments. Its return is discarded.
- Returns `value`. The same reference for objects, the same value for primitives.

#### How it works

```ts
fn()
return value
```

Two lines. `fn` runs for its side effect; its return value is ignored. `value` is returned as-is.

#### Relationship to `tap`

`Finally` is `tap` with the arguments flipped into a different shape and the name changed. Both do the same thing mechanically:

```ts
tap(value, fn)         // run fn(value), return value
Finally(value, fn)     // run fn(),      return value
```

The differences:

| | `tap` | `Finally` |
| --- | --- | --- |
| Passes value to `fn` | yes | no |
| `fn` signature | `(value: T) => any` | `() => any` |
| Name connotes | observing a value | running cleanup |

If `fn` needs the value (logging it, asserting on it, emitting it as a payload), use `tap`. If `fn` just needs to run — cleanup, bookkeeping, closing a handle — use `Finally`.

Neither function is *more correct*. They're the same trick with different ergonomics. Pick by what reads better at the call site.

#### Why the name

"Finally" is borrowed from `try` / `finally`. In a `try` block:

```ts
try {
  return compute()
} finally {
  cleanup()
}
```

The `finally` runs after the `try` body, on the way out. `Finally(value, fn)` is the expression form of the same idea: `fn` runs after `value` is produced, on the way to being returned.

The capital `F` distinguishes it from the keyword and from `Promise.prototype.finally`. It's a function, not a control structure — but the name signals the same intent.

#### Common patterns

**Cleanup on the way out**

```ts
return Finally(result, () => tempFile.delete())
```

**Bookkeeping after a computation**

```ts
return Finally(compute(), () => metrics.increment("compute.done"))
```

**Closing a handle**

```ts
return Finally(readFile(path), () => handle.close())
```

**Committing a transaction**

```ts
return Finally(applyChanges(tx), () => tx.commit())
```

**Logging a boundary**

```ts
return Finally(result, () => log.info("operation complete"))
```

**Composing with other helpers**

```ts
return Finally(
  orDefault(response.data, {}),
  () => cache.set(key, response.data),
)
```

#### Behavior

- **Same reference for objects.** `Finally(obj, fn) === obj`. Not a copy, not a clone.
- **Same value for primitives.** `Finally(42, fn) === 42`.
- **`fn` runs before the return.** If `fn` throws, `Finally` throws and the value is not returned.
- **`fn` is synchronous.** No awaiting, no deferral. If `fn` returns a promise, the promise floats — potentially unhandled.
- **`fn` takes no arguments.** Unlike `tap`, it doesn't receive the value. If you need it, use `tap`.
- **`fn`'s return is discarded.** Whatever `fn` returns has no effect on the result.
- **`fn` is called exactly once.** No retry, no reentrancy protection. Called once, per call to `Finally`.

#### Gotchas

- **Async `fn` is dangerous.** Same caveat as `tap`. `Finally(value, async () => { throw new Error() })` returns `value` immediately, but the async function's rejection becomes an unhandled rejection. Only use `Finally` with synchronous side effects, or handle the promise inside.
- **Doesn't actually wrap a `try`.** If `value` is produced by an expression that throws, `Finally` never runs — because `value` never gets evaluated as an argument. It's not a substitute for a real `try` / `finally`; it's an expression-level side effect on an already-computed value. If you want guaranteed cleanup around a computation that might throw, use a real `try` block.

  ```ts
  // ❌ cleanup doesn't run if risky() throws
  return Finally(risky(), () => cleanup())

  // ✅ cleanup always runs
  try { return risky() } finally { cleanup() }
  ```

  This is the biggest gotcha. `Finally` looks like `finally` but doesn't have the exception-safety of one.

- **The capital `F` matters.** Lowercase `finally` is a reserved word — you can't name a function `finally` in the same scope without conflict. `Finally` sidesteps that.

- **Passes no value to `fn`.** If you're used to `tap` and reach for `Finally` expecting `fn` to see the value, you'll be surprised. `fn` is called with zero arguments.

- **No return-value transformation.** `fn`'s return is thrown away. `Finally` is identity at runtime. If you need `fn`'s result, call it separately.

- **One-liner is deceptive.** The name suggests "guaranteed teardown," which it isn't (see the `try` gotcha above). The semantics are strictly sequential: compute value, run fn, return value. If either step throws, the rest doesn't happen.

#### What this is *not*

- Not a `try` / `finally` replacement. Doesn't handle exceptions thrown while producing `value`.
- Not a `tap`. `tap` passes the value; `Finally` doesn't.
- Not a cleanup guard. If you want "always run this regardless of how the function exits," you need a real `try` block or a wrapper like `tryCatch`.
- Not async-aware. Promises returned from `fn` float; use with sync side effects only.

---

## Philosophy

`try` / `finally` is a statement. `Finally(value, fn)` is the expression form: value in, side effect on the way out, value returned. It doesn't have the exception-safety of the keyword — it's a sequential two-step, not a guaranteed cleanup. Read it as "run this, then hand back the value," and it does exactly that.

---

## License

MIT
