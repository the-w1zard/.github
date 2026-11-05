# `chain`

> Two ways to start a chain. One is a function that lifts a value into a Promise. The other is a class that lifts a value into a chain of synchronous transforms. Same word, same idea, two pipelines.

```ts
return chain(result)          // Promise pipeline
return new Chain(result)      // sync pipeline
```

Both are three lines. Both exist so you can say "start a chain here" and have the shape of the pipeline determined by which one you reach for.

---

## Usage

### 🟢 First-time users — start here

**The function — async chain:**

```ts
import { chain } from "platform"

return chain(result)
  .then(x => x + 1)
  .then(x => x * 2)
  .catch(err => 0)
```

`chain(value)` is just `Promise.resolve(value)`. It exists so the code reads as "start an async chain here" instead of "wrap this in a promise."

**The class — sync chain:**

```ts
import { Chain } from "platform"

return new Chain(result)
  .then(x => x + 1)
  .then(x => x * 2)
```

`new Chain(value)` starts a synchronous pipeline. Each `.then` runs immediately, wraps the result in a new `Chain`, and returns it. No promises involved.

That's it. You're done. Pick the function for async, the class for sync. The `.then` reads the same in both.

### 🔵 Everyone else

#### The function

```ts
export function chain<T>(value: T | Promise<T>) {
  return Promise.resolve(value)
}
```

`chain` is an alias for `Promise.resolve` with a name that reads as a pipeline opener. `chain(x)` accepts either a plain value or a promise and always returns a `Promise<T>`. From there, normal `.then` / `.catch` / `.finally` chaining applies.

The `T | Promise<T>` signature means callers don't have to know which they have. A value gets wrapped; a promise passes through. Either way the return is a promise.

#### The class

```ts
export class Chain<T> {
  constructor(private value: T) {}

  then<TResult>(resolve: (value: T) => TResult) {
    return new Chain(resolve(this.value))
  }
}
```

- Construct with a value.
- `.then(fn)` calls `fn` on the current value, wraps the result in a new `Chain`, and returns it.
- Calling `.then` again chains the next transform.
- Every `.then` returns a **new** `Chain`. The receiver is unchanged.

This is a synchronous pipeline. `.then` here is not `Promise.prototype.then` — it's a plain method that runs `fn` immediately, stores the result, and hands back a fresh wrapper.

#### The relationship

They're the same concept expressed twice, so that a call site can start a chain without committing to async or sync *up front* in a way that's awkward to change later:

```ts
// async — the return is a Promise
function loadUser(id: string) {
  return chain(fetchUser(id))
    .then(u => u.profile)
    .then(p => p.displayName)
}
// caller: await loadUser("abc")

// sync — the return is a Chain
function decorateName(user: User) {
  return new Chain(user.name)
    .then(n => n.trim())
    .then(n => n.toUpperCase())
}
// caller: decorateName(user).value  (or however Chain is unwrapped)
```

Both start with the word `chain`. The reader sees the same shape. The behavior differs only in *when* the transforms run.

#### Common patterns

**Async — one-liner to enter promise-land**

```ts
return chain(maybePromiseOrValue)
  .then(normalize)
  .then(validate)
```

**Sync — compose pure transforms**

```ts
const result = new Chain(input)
  .then(parse)
  .then(transform)
  .then(format)
```

**Returning from a function that might be either**

```ts
// sync path
if (cache.has(key)) return new Chain(cache.get(key))

// async path
return chain(fetch(key))
```

The caller treats the result the same way — it's chainable in both cases.

#### Behavioral notes

**Function:**
- `chain(x)` → `Promise<T>`.
- Accepts `T` or `Promise<T>`. Non-promises are wrapped.
- Supports `.then`, `.catch`, `.finally` — standard Promise API.
- Rejections propagate as normal promise rejections.

**Class:**
- `new Chain(x)` → `Chain<T>`.
- `.then(fn)` runs `fn` synchronously and returns a new `Chain<U>`.
- Thrown errors propagate as normal exceptions — no catch built in.
- No `.catch`, no `.finally`, no async support in the class as written. Just `.then`.
- Each `.then` is eager. Nothing is deferred.

#### Gotchas

- **`Chain.then` is not the Promise `.then`.** If you `await new Chain(x)`, you'll get the `Chain` instance, not the underlying value — because `Chain` is not a thenable (its `.then` has the wrong shape for the Promise machinery). Keep the two pipelines distinct in your head.
- **`Chain.then` runs immediately.** There's no deferral, no laziness. `new Chain(x).then(f).then(g)` is `g(f(x))` with extra allocation.
- **No `.value` accessor in the class as written.** You need a way to unwrap — either add a getter or a `.done()` method, or the class is only useful as an intermediate value.
- **`chain` will flatten thenables.** `chain(somePromise)` returns that promise (via `Promise.resolve`), so it's an identity for promises and a wrapper for plain values. That's the standard `Promise.resolve` behavior.
- **The names collide.** `chain` (lowercase, function) and `Chain` (uppercase, class) live in the same module. Call sites are unambiguous to the compiler, but the reader has to track which one they're looking at.

#### When to use which

- **`chain(x)`** — you want a Promise. The rest of the pipeline is `.then` / `.catch`. The result is awaitable.
- **`new Chain(x)`** — you want a synchronous, eager transform pipeline with a chainable API. The result is a `Chain` wrapper you'll unwrap at the end.

They're not interchangeable. They're the same verb for two different tenses.

---

## Philosophy

Starting a chain shouldn't require deciding whether it's async or sync before you know. `chain(x)` says "make this a Promise." `new Chain(x)` says "make this a value pipeline." Same word at the call site, two shapes underneath. The reader sees intent; the runtime sees whichever one you meant.

---

## License

MIT
