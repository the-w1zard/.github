# `once`

> Wrap a function so it only ever runs the first time it's called. Every call after returns the first call's result. Same function, same arguments — but the body executes exactly once, ever.

```ts
const init = once(() => connectToDatabase())

init()   // runs connectToDatabase()
init()   // returns the same connection
init()   // returns the same connection
```

Two variants ship together: `once` for zero-argument factories, `onceB` for functions with arguments that need to preserve their signature. Both are cached-forever wrappers.

---

## Usage

### 🟢 First-time users — start here

```ts
import { once } from "platform"

const getConfig = once(() => ({
  env: process.env.NODE_ENV,
  started: Date.now(),
}))

getConfig()   // builds the object
getConfig()   // same object, same timestamp
```

That's it. You're done. You now know how to use `once`.

The short version: **wrap a function, call it as many times as you want, the body only runs on the first call.** Every call returns the same result.

With arguments, use `onceB`:

```ts
const parse = onceB((json: string) => JSON.parse(json))

parse('{"a":1}')   // parses, returns { a: 1 }
parse('{"b":2}')   // returns { a: 1 } — arguments ignored after the first call
```

### 🔵 Everyone else

#### The two variants

```ts
function once<T>(fn: () => T): () => T
function onceB<F extends (...args: any[]) => any>(fn: F): F
```

- **`once(fn)`** — takes a zero-argument factory, returns a zero-argument function. Cleanest signature, no `args` machinery.
- **`onceB(fn)`** — takes any function, returns the same signature. Arguments are accepted on every call but **only used on the first one.** After that, the arguments are discarded and the cached result is returned.

The `B` suffix is for "bound" or "blind" — it preserves the type signature of the wrapped function. Pick `once` when you have a factory with no parameters. Pick `onceB` when you want to wrap an existing function and keep its type.

#### How they work

Both use the same pattern: a `done`/`called` boolean and a cached value.

```ts
let cached: T
let done = false
return () => {
  if (!done) {
    cached = fn()
    done = true
  }
  return cached
}
```

- First call: flag is `false`, `fn` runs, result cached, flag set, result returned.
- Every subsequent call: flag is `true`, `fn` is skipped, cached result returned.
- The flag is set **after** `fn` returns. If `fn` throws, the flag stays `false` and the next call retries. Same semantics as `Lazy`.

`onceB` is identical except it spreads `...args` into the first `fn` call and ignores them after.

#### Why two functions instead of one

`once` has a tight, precise signature: `() => T`. No `any`, no generic function type, no `as F` cast.

`onceB` needs `F extends (...args: any[]) => any` to accept any function shape and `as F` on the return to hand the signature back. That's the cost of generality. If you have a zero-arg factory, `once` is strictly better — no casts, no spread, no `any`.

#### Common patterns

**Idempotent initialization**

```ts
const ensureInit = once(() => {
  registerHandlers()
  startTelemetry()
  return true
})

ensureInit()   // runs the setup
ensureInit()   // no-op
```

**Module-level singleton**

```ts
const getPool = once(() => new ConnectionPool(config))
```

**Expensive parse, called from many places**

```ts
const schema = onceB((raw: string) => compileSchema(raw))

// first caller's input wins — subsequent callers get the first schema
const s1 = schema(inputA)
const s2 = schema(inputB)   // returns s1
```

**Guarding against double-registration**

```ts
const register = onceB((name: string) => registry.add(name))
register("a")   // adds "a"
register("b")   // no-op, returns the result of the first call
```

**Deferred work that may never fire**

```ts
const flush = once(() => queue.drain())
// call flush() from every exit path; only the first one actually flushes
```

#### Behavioral guarantees

- **At most once.** The wrapped function runs on the first call and never again.
- **Same return value, always.** Every call returns the identical reference (or primitive) from the first call.
- **Arguments ignored after the first call** in `onceB`. No memoization per argument set — it's a single-shot cache, not a keyed cache.
- **Synchronous.** `once` doesn't await, doesn't unwrap promises. If `fn` returns a `Promise<T>`, the wrapper returns that same promise on every call — which is usually the right behavior for async singletons.
- **Throws propagate.** If `fn` throws on the first call, the error propagates and the wrapper is *not* marked done. The next call retries.

#### `once` vs `Lazy`

Both cache a single value forever. The difference is shape:

- **`Lazy<T>`** wraps a factory and exposes `.value` (a property) plus `.isValueCreated` (inspect without triggering).
- **`once(fn)`** wraps a function and returns a function. No `.isValueCreated`, no property access — you call it.

Use `Lazy` when you want to pass the *value slot* around. Use `once` when you want to pass a *callable* around.

#### Gotchas

- **`onceB` discards arguments silently after the first call.** If callers pass different arguments expecting different results, you're using the wrong tool. That's a memoization problem, not a `once` problem.
- **A throwing `fn` retries on the next call.** Deliberate — a transient failure doesn't poison the wrapper — but a deterministic throw means the body runs every call. Same tradeoff as `Lazy`.
- **`cached` is typed `T` but not initialized.** Before the first call, `cached` is `undefined` at runtime despite the type. The wrapper never returns it in that state, but `strict` mode users may want to silence the TS complaint with a `!` if their config is aggressive.
- **`onceB` returns `F`, so callers see the original signature.** That includes all argument types. The wrapper accepts them, ignores them after the first call, but the type system doesn't know that.
- **Not resettable.** No `.clear()`, no way to re-run the factory. Create a new wrapper if you need a new run.

#### What this is *not*

- Not memoization. Memoization caches per-input; `once` caches the first call only.
- Not a debounce or throttle. It doesn't care about timing.
- Not async-aware. It caches whatever `fn` returns, including promises, without awaiting.
- Not thread-safe in the traditional sense — but JS is single-threaded, so two callers in the same tick can't race. The first one wins; the second sees the cached value.

---

## Philosophy

Some work should happen exactly once and it shouldn't matter how many times you call the thing that does it. `once` makes that a property of the function instead of a property of every call site. Call it as often as you like; the body runs one time.

---

## License

MIT
