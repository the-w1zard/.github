# `toPromise`

> Lift any value into a Promise. Same behavior as `Promise.resolve`, but with a name that says what the call site means: "turn this into a promise."

```ts
toPromise(42)          // Promise<42>
toPromise(fetchUser()) // passes the promise through
toPromise(undefined)   // Promise<undefined>
```

---

## Usage

### 🟢 First-time users — start here

```ts
import { toPromise } from "platform"

const p = toPromise(maybeValueOrPromise)
const v = await p
```

That's it. You're done. You now know how to use `toPromise`.

Whatever you give it — a number, a string, an object, an existing promise — you get a promise back. `await` it and you get the original value. If you passed a promise, it isn't double-wrapped; it passes through.

### 🔵 Everyone else

#### Signature

```ts
const toPromise = <T>(value: T | PromiseLike<T>): Promise<T>
```

- Accepts a plain `T` or anything promise-like (`PromiseLike<T>` — anything with a `.then`).
- Returns `Promise<T>`.
- Delegates directly to `Promise.resolve(value)`.

That last line is the whole implementation. `toPromise` is `Promise.resolve` with a different name.

#### Why it exists

`Promise.resolve` has a name that's about *promises*. `toPromise` has a name that's about *conversion*. The two are the same operation, but they read differently at a call site:

```ts
// "resolve this promise"
Promise.resolve(x)

// "convert this value to a promise"
toPromise(x)
```

When you're writing a function that accepts `T | Promise<T>` and need to guarantee a `Promise<T>` out the other side, `toPromise(x)` documents *why* you're calling it. `Promise.resolve(x)` works identically but leaves the reader to guess the intent.

#### Behavior

- **Plain value** → wrapped in a resolved `Promise<T>`.
- **Promise** → passed through as-is (not re-wrapped).
- **Thenable** (non-Promise object with `.then`) → adopted; the result of `Promise.resolve` on a thenable is a real `Promise<T>` that follows the thenable's behavior.
- **Promise subclass** → returns a real `Promise`, not the subclass. (Standard `Promise.resolve` semantics.)
- **`undefined` and `null`** → both produce resolved promises. `toPromise(undefined)` is `Promise<undefined>`. Unlike `MaybePromise`, there's no special-casing.

#### Common patterns

**Function that returns either sync or async**

```ts
function get(id: string): Promise<User> {
  const cached = cache.get(id)
  if (cached) return toPromise(cached)   // sync hit, promoted to promise
  return fetchUser(id)                   // async miss
}
```

**Normalizing input**

```ts
function handle(input: T | Promise<T>) {
  return toPromise(input).then(process)
}
```

**Forcing a promise boundary**

```ts
const results = await Promise.all(items.map(toPromise))
```

**Adapting a thenable**

```ts
const p = toPromise(customThenable)
// p is a real Promise, not the thenable
```

#### `toPromise` vs `MaybePromise`

Different jobs, same neighborhood:

- **`toPromise(x)`** — always returns `Promise<T>`. Wrap unconditionally. Use when the caller needs a promise.
- **`MaybePromise(x)`** — returns `x` unless `x` is `undefined`, in which case it returns a resolved promise. Use when you want to *skip* the promise when the value is already there.

`toPromise` is the honest, always-async version. `MaybePromise` is the chameleon that preserves sync identity when it can.

#### Gotchas

- **Thenables are adopted, not wrapped.** `toPromise(someThenable)` returns a Promise that resolves to whatever the thenable's `.then` calls resolve with. If the thenable misbehaves, you inherit the misbehavior.
- **Promise subclasses lose their identity.** `toPromise(myPromiseSubclass)` returns a plain `Promise`. This is standard `Promise.resolve` behavior and usually desirable, but worth knowing if you rely on subclass methods.
- **Already-resolved promises are not re-wrapped, but the identity is still a new promise in some engines.** Per spec, `Promise.resolve(p)` returns `p` if `p` is a native `Promise` and the constructor matches. If you've subclassed or polyfilled, you may get a new promise. Don't rely on `===` identity across `toPromise` calls.
- **No timeout, no cancellation.** `toPromise` doesn't do anything beyond conversion. If you want a bound, wrap with `timedPromise`.

#### What this is *not*

- Not `await`. `await x` is not equivalent — it suspends, unpacks, and only works inside an async context. `toPromise(x)` is a pure value-to-promise lift.
- Not a lazy wrapper. `toPromise(() => x)` returns a promise of the *function*, not of `x`. It does not call the function.
- Not a replacement for `MaybePromise` in code that cares about sync identity.

---

## Philosophy

`Promise.resolve` is correct but reads as "resolve," which is about promises, not values. `toPromise` names the conversion at the call site: whatever you have, it becomes a promise. Same one-line implementation, clearer intent.

---

## License

MIT
