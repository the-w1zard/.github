# `tap`

> Run a side effect on a value, return the value unchanged. The value goes in, the effect runs, the same value comes out. Nothing is transformed, nothing is copied, nothing is wrapped.

```ts
const user = tap(fetchUser(id), u => console.log("loaded", u.id))
// → logs "loaded 42", returns the user
```

The point: inject a side effect into an expression without breaking the chain. Logging, asserting, emitting events, mutating a cache — anything that needs to happen *to* a value without changing it.

---

## Usage

### 🟢 First-time users — start here

```ts
import { tap } from "platform"

const x = tap(compute(), v => console.log(v))
// x is exactly what compute() returned
```

That's it. You're done. You now know how to use `tap`.

It's `console.log` for people who don't want to break the expression. Pass a value and a function; the function sees the value, the value comes back unchanged.

### 🔵 Everyone else

#### Signature

```ts
function tap<T>(value: T, fn: (value: T) => any): T
```

- `value` — anything. Object, primitive, promise, whatever.
- `fn` — a function called with `value`. Its return is discarded.
- Returns `value`. The identical reference (for objects) or identical value (for primitives).

#### How it works

```ts
fn(value)
return value
```

Two lines. `fn` runs for its side effect; its return value is ignored. `value` is returned as-is.

The `any` return type on `fn` is deliberate — it says "you can return whatever, I don't care." This lets you pass `console.log` (returns `void`), an arrow that returns a boolean (assertions), or anything else, without the compiler complaining.

#### Why it's useful

The pattern it solves is: **you have a value, you want to do something with it, and you don't want to introduce a variable or a statement.**

Without `tap`:

```ts
const user = fetchUser(id)
console.log("loaded", user.id)
return user
```

With `tap`:

```ts
return tap(fetchUser(id), u => console.log("loaded", u.id))
```

Same behavior, one expression, no intermediate variable. This matters most in pipelines:

```ts
return tap(
  tap(
    fetchUser(id),
    u => log.info("fetched", u.id),
  ),
  u => metrics.increment("user.loaded"),
)
```

Ugly when nested like that — but in a fluent chain or a call to a higher-order function, `tap` is the clean way to slip a side effect in.

#### Common patterns

**Logging without a statement**

```ts
const result = tap(compute(), v => console.log("compute →", v))
```

**Asserting mid-pipeline**

```ts
const parsed = tap(JSON.parse(raw), v => {
  if (!v.id) throw new Error("missing id")
})
```

**Emitting events**

```ts
const user = tap(createUser(data), u => bus.emit("user.created", u))
```

**Cache writes**

```ts
const value = tap(expensiveCompute(), v => cache.set(key, v))
```

**Debug breaks**

```ts
const x = tap(intermediate, v => { debugger })
```

**Chained in a pipeline**

```ts
return pipe(
  fetchUser(id),
  u => tap(u, log),
  u => tap(u, validate),
  u => transform(u),
)
```

#### Behavior

- **Same reference for objects.** `tap(obj, fn) === obj`. Not a copy, not a clone, not a proxy.
- **Same value for primitives.** `tap(42, fn) === 42`.
- **`fn` runs synchronously.** `tap` is not async. If `fn` returns a promise, it's discarded and the promise floats — potentially unhandled.
- **`fn`'s return is discarded.** If you need to transform, use `map`-style code, not `tap`.
- **`fn` receives the exact value passed in.** No wrapping, no unwrapping. If `value` is a promise, `fn` sees the promise.
- **If `fn` throws, `tap` throws.** No swallowing. The value never gets returned. This is often desirable — assertions in `tap` are a legitimate pattern.

#### Gotchas

- **Async `fn` is dangerous.** `tap(x, async v => { throw new Error() })` returns `x` immediately, but the async function's rejection becomes an unhandled rejection. Use `tap` only with synchronous side effects, or explicitly handle the promise inside.
- **Order of arguments.** Value first, function second. This is different from lodash's `_.tap(value, interceptor)` — which happens to be the same order, so no gotcha there. But it's different from `pipe`-style utilities where the function comes first. Read the signature.
- **Return type is `T`, not `any`.** The compiler will treat the result as the original type, which is correct — `tap` truly is identity at runtime. But if you were hoping to fool the type system into thinking `fn` transformed the value, it doesn't.
- **`fn` is `(value: T) => any`, not `(value: T) => void`.** `void` would be stricter and more accurate, but `any` is more permissive — it lets you pass functions that return values without TypeScript complaining. The tradeoff is a slightly weaker contract.
- **Not lazy.** `tap` runs the side effect immediately. It's not a deferred hook.
- **Not a debugger.** It doesn't know when to skip the side effect based on environment. Wrap your `fn` in a check if you only want logging in dev.

#### Relationship to other utilities

**`tap` in a `Chain`**

Both `Chain` and `ReChain` have a `.tap(fn)` method that works the same way — side effect in, same chain out. The standalone `tap` function is the point-free version. Use the method when you're already in a chain; use the function when you're not.

**`tap` vs `map`**

`map` transforms. `tap` observes. If `fn` returns a value you care about, you wanted `map`. If `fn` returns something you don't care about, you wanted `tap`. The names are the difference.

**`tap` vs `if`**

`tap` is not conditional. If you need the side effect only when a condition holds, either wrap the `fn`:

```ts
tap(x, v => { if (cond) log(v) })
```

Or use a conditional.

#### What this is *not*

- Not a debug logger. It's a mechanism, not a logger.
- Not a transformation. It never changes the value.
- Not async-aware. Promises and async side effects need explicit handling.
- Not error-catching. `fn` throwing propagates.

---

## Philosophy

A side effect is a statement in a world of expressions. `tap` is how you smuggle one into a pipeline without breaking the shape: value in, effect runs, value out. Identity with a witness.

---

## License

MIT
