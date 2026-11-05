# `Lazy`

> Deferred initialization. Wrap a factory, get a `.value` getter that runs the factory on first access and caches the result forever after. Between the first read and every read after, `.value` is a plain property access — no check, no branch, no function call.

```ts
const config = new Lazy(() => parseConfig(readFileSync("config.json")))

config.isValueCreated   // false
config.value            // runs the factory once
config.isValueCreated   // true
config.value            // returns the cached value
```

---

## Usage

### 🟢 First-time users — start here

```ts
import { Lazy } from "platform"

const db = new Lazy(() => connectToDatabase())

// nothing has happened yet — no connection, no cost

db.value   // connects now, once
db.value   // same connection, no reconnect
```

That's it. You're done. You now know how to use `Lazy`.

The point: expensive work that you *might* need but don't want to pay for unless you actually do. Pass the `Lazy` around instead of the connection. It sits inert until someone touches `.value`.

### 🔵 Everyone else

#### The interface

```ts
interface ILazy<T> {
  readonly isValueCreated: boolean
  readonly value: T
}
```

Two members. `.value` is the lazy slot. `.isValueCreated` tells you whether the factory has run yet, without triggering it.

#### The class

```ts
class Lazy<T> implements ILazy<T> {
  constructor(factory: () => T)
  get isValueCreated(): boolean
  get value(): T
}
```

The constructor takes a **factory** — a zero-argument function. Not a value. That's the whole contract: `Lazy` never runs the factory until `.value` is read, and never runs it more than once.

#### How it works

```ts
get value(): T {
  if (!this._isValueCreated) {
    this._value = this._factory()
    this._isValueCreated = true
  }
  return this._value!
}
```

- First `.value` read: flag is `false`, factory runs, result is cached, flag is set, result returned.
- Every subsequent read: flag is `true`, branch is skipped, cached value returned.
- `_isValueCreated` is set **after** the factory returns, so a factory that throws leaves the lazy uninitialized and the *next* read will try again. This is a design choice — see gotchas.
- `_value` is typed `T | null` internally and asserted `!` on the return path. The `!` is safe because the branch guarantees it was just set.

#### `isValueCreated` — the point of the interface

Reading `.value` always runs the factory if it hasn't run yet. Sometimes you want to *ask* whether the work has been done without doing it. That's what `.isValueCreated` is for:

```ts
if (lazy.isValueCreated) {
  // safe to read .value without triggering the factory
  const v = lazy.value
}
```

This is why `Lazy` exposes an interface at all — you can hand a consumer an `ILazy<T>` and let them decide whether to pay the cost. Same value either way, but the consumer can make the call.

#### Common patterns

**Dependency slots**

```ts
class Service {
  private _db = new Lazy(() => openDb(config.connectionString))
  get db() { return this._db.value }
}
```

The service can be constructed without a database. The first thing that touches `.db` pays the connection cost. Nothing else does.

**Module-level singletons**

```ts
const registry = new Lazy(() => buildRegistry())
export const getRegistry = () => registry.value
```

**Circular dependency breaks**

```ts
const a = new Lazy(() => new A(b.value))
const b = new Lazy(() => new B(a.value))
```

Neither constructor runs until `.value` is read, at which point both resolve.

**Conditional expensive work**

```ts
const preview = new Lazy(() => renderFullPreview(doc))

if (userWantsPreview) {
  return preview.value   // pays the cost
}
return null              // never pays
```

#### Behavioral guarantees

- **At most once.** The factory runs on the first `.value` read and never again, even across many readers.
- **Synchronous.** The factory is called synchronously on the read. If the factory does async work, `.value` will be a `Promise<T>`, not `T` — `Lazy` does not unwrap promises.
- **Not thread-safe in the traditional sense** — but JS is single-threaded, so concurrent readers can't race. Two readers in the same tick will both see the same result; whichever reads first pays the cost.
- **No reset.** Once initialized, there's no way to clear the cache. Create a new `Lazy` if you need a new value.

#### Gotchas

- **A throwing factory re-runs on the next read.** If `_factory()` throws, `_isValueCreated` is never set to `true`. The next `.value` access retries the factory. This is deliberate — a transient failure doesn't poison the lazy — but if your factory throws deterministically, you'll pay the cost every read.
- **`null` is not a valid cached value from the type system's perspective.** The internal field is `T | null`, and the return is asserted. If `T` itself includes `null`, it works, but the assertion becomes misleading. In practice, don't use `null` as a factory result.
- **Reentrancy will stack-overflow.** If the factory reads `.value` of the same lazy, you get infinite recursion. The flag is not set before the factory runs.
- **No async support.** `.value` is `T`, not `Promise<T>`. If your factory returns a promise, you get the promise once and share it — which is often what you want, but `Lazy` doesn't know or care.
- **`isValueCreated` is `false` during the first factory call.** If the factory inspects `this.isValueCreated`, it sees `false`. The flag flips only after the factory returns.

#### What this is *not*

- Not a memoization decorator. It caches one result for one factory, with no argument tracking.
- Not `Promise`-aware. It doesn't await, unwrap, or coordinate async initialization.
- Not resettable. No `.clear()`, no `.reset()`.

---

## Philosophy

The cost of a value and the moment you pay it should be independent decisions. `Lazy` separates them: construction is free, the factory runs on first read, and `isValueCreated` lets a caller ask whether the cost has already been paid without forcing it to be.

---

## License

MIT
