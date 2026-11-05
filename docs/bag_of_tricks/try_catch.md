# `tryCatch`

> Run a function, get back a tuple. Either `[undefined, value]` on success or `[error, undefined]` on failure. No thrown exceptions escape. Ever.

```ts
const [err, user] = await tryCatch(() => fetchUser(id))

if (err) {
  // handle the error
} else {
  // user is T
}
```

The point: turn the `try` / `catch` statement into a value you can pass around, store, branch on, or return. Errors become data instead of control flow.

---

## Usage

### 🟢 First-time users — start here

```ts
import { tryCatch } from "platform"

const [err, data] = await tryCatch(() => riskyOperation())

if (err) {
  console.error(err)
} else {
  console.log(data)
}
```

That's it. You're done. You now know how to use `tryCatch`.

The rule is one sentence: **one side of the tuple is always `undefined`.** If the call succeeded, `err` is `undefined` and `data` holds the value. If it failed, `data` is `undefined` and `err` holds the `Error`. You check one, you know the other.

It always returns a `Promise` — even if `fn` is synchronous — so the call site is `await` in both cases.

### 🔵 Everyone else

#### Signature

```ts
async function tryCatch<T>(
  fn: () => T | Promise<T>
): Promise<[Error, undefined] | [undefined, T]>
```

- `fn` — a zero-argument function. May be sync or async. May throw or reject.
- Returns a `Promise` that always resolves. Never rejects.
- The tuple is discriminated by which slot is `undefined`: `[Error, undefined]` on failure, `[undefined, T]` on success.

TypeScript narrows automatically on the `if (err)` check, so inside the `else` branch `data` is typed `T` — no cast needed.

#### How it works

```ts
try { return [undefined, await fn()] }
catch (e) { return [e instanceof Error ? e : new Error(String(e)), undefined] }
```

- `fn()` is invoked inside a `try`. The result is awaited.
- On success, `[undefined, value]` is returned.
- On throw (sync or async), the error is caught, coerced to an `Error` if necessary, and returned as `[error, undefined]`.

Because the function is `async`, both return paths produce a resolved promise. The caller can't get an unhandled rejection out of this — the only ways to get a rejection would be for the tuple construction itself to throw, which it doesn't.

#### The two-tuple shape

The `[error, value]` order follows the Go and Node convention (and the original `await-to-js` style). Error first, value second. The asymmetry — one slot is `undefined` when the other is populated — is what makes narrowing work in TypeScript:

```ts
const [err, v] = await tryCatch(fn)
if (err) {
  // v is undefined
} else {
  // v is T
}
```

If both were always `T | undefined`, you'd have to assert. The tuple union gives you discrimination for free.

#### Error coercion

```ts
e instanceof Error ? e : new Error(String(e))
```

If `fn` throws an `Error`, you get it back untouched. If `fn` throws a string, a number, `null`, or anything else, it's wrapped in a fresh `Error` with `String(e)` as the message. The contract is: **the first slot is always an `Error`**, never a raw throw value.

This matters because `throw "oops"` and `throw { code: 42 }` are legal in JS. Callers shouldn't have to defensively check. `tryCatch` normalizes.

#### Common patterns

**Error-first call sites without a `try` block**

```ts
const [err, config] = await tryCatch(() => loadConfig(path))
if (err) return defaultConfig
return config
```

**Collecting results from a batch**

```ts
const results = await Promise.all(
  items.map(i => tryCatch(() => process(i)))
)

const errors = results.filter(([e]) => e).map(([e]) => e)
const values = results.filter(([, v]) => v !== undefined).map(([, v]) => v)
```

**Pipeline composition**

```ts
const [e1, parsed] = await tryCatch(() => JSON.parse(raw))
if (e1) return e1

const [e2, validated] = await tryCatch(() => schema.parse(parsed))
if (e2) return e2

return validated
```

**Passing an error upward as a value**

```ts
function handle(): Result<User> {
  const [err, user] = await tryCatch(() => fetchUser(id))
  if (err) return { ok: false, error: err }
  return { ok: true, value: user }
}
```

**Retry loops that don't need `try` syntax**

```ts
for (let i = 0; i < 3; i++) {
  const [err, v] = await tryCatch(() => attempt())
  if (!err) return v
}
throw new Error("all attempts failed")
```

#### Sync and async, same call site

Because `fn` can be `() => T` or `() => Promise<T>`, and the wrapper always returns a promise, the caller writes `await` unconditionally:

```ts
const [e1, a] = await tryCatch(() => 42)              // sync fn
const [e2, b] = await tryCatch(() => fetch("/x"))     // async fn
```

No branching on which kind `fn` is. This is the same uniformity `MaybePromise` gives on the value side, applied to error capture.

#### Gotchas

- **Every call allocates a tuple and a promise.** For hot loops, this is measurable. If the inner work is already a promise and you don't need error-as-value, `await fn()` inside a normal `try` is cheaper.
- **`fn` must be a thunk.** Pass `() => risky()`, not `risky()`. If you pass a value, `tryCatch` will try to call it and throw `TypeError: fn is not a function` — which then becomes the caught error. Technically still works, but not what you wanted.
- **Only catches what `fn` throws synchronously or rejects with.** If `fn` spawns a background task that rejects later, that rejection is not captured. `tryCatch` waits for `fn`'s returned promise; anything after that is outside its scope.
- **The `data` slot is `undefined` on failure, not `null`.** Code that distinguishes "no value" from "error" by checking for `null` will misread the tuple. Always check `err` first.
- **Non-`Error` throws are wrapped.** If you threw an object with fields you cared about (`throw { code: 'ENOENT' }`), those fields are lost — the wrapper keeps only `String(e)`. If you need the original throw, catch manually.
- **Errors thrown inside the `catch` block are not caught.** The coercion `new Error(String(e))` can theoretically throw if `String(e)` throws (rare, but possible with adversarial `toString` implementations). This is not defended against.
- **One tuple, one error.** If `fn` throws, you get exactly one `Error`. If you need an array of errors from a multi-step process, collect them yourself.

#### What this is *not*

- Not a `Result` type with methods. It's a plain tuple. `[err, value]`, discriminated by `undefined`.
- Not a retry or timeout. Wrap with your own loop or `timedPromise`.
- Not a replacement for `try`/`catch` when you need `finally`. There's no cleanup hook here. Run cleanup after the `await` if you need it.
- Not async-aware of cancellation. If `fn`'s promise never settles, `tryCatch` never resolves. Pair with `timedPromise` if you need a bound.

---

## Philosophy

`try`/`catch` is control flow. Errors are data. `tryCatch` converts one into the other: what would have been a jump becomes a value, what would have been a stack unwind becomes a tuple. You get error-first handling without the syntax, error composition without the ceremony, and a type system that knows which branch is which.

---

## License

MIT
