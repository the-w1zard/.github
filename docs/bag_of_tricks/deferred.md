# `deferred`

> A promise you settle from the outside. Create one, hand the `promise` to whoever is waiting, and call `resolve` or `reject` whenever you're ready.

```ts
const d = deferred<string>()

d.promise.then(v => console.log(v))   // not yet

d.resolve("hello")                     // logs "hello"
```

The point: separate *creation* of the promise from *completion* of it. The code that resolves and the code that awaits don't have to know about each other.

---

## Usage

### 🟢 First-time users — start here

```ts
import { deferred } from "platform"

const d = deferred<User>()

// somewhere else — different function, different tick, different module
d.resolve(user)
// or
d.reject(new Error("failed"))

// wherever you need to wait
const user = await d.promise
```

That's it. You're done. You now know how to use `deferred`.

The `promise` is a normal promise. The `resolve` and `reject` are the normal settle functions. The only thing `deferred` does is let you keep them in separate scopes.

### 🔵 Everyone else

#### Signature

```ts
function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: any) => void
}
```

- **`promise`** — the pending promise. Hand it to anyone who needs to wait.
- **`resolve(value)`** — settle the promise successfully with `value`.
- **`reject(reason)`** — settle the promise with a rejection. `reason` can be anything; convention is an `Error`.

Both `resolve` and `reject` are the raw `Promise` executor callbacks. Only the first call to either has any effect; subsequent calls are no-ops. That's standard promise semantics, not a special guard in `deferred`.

#### How it works

```ts
let resolve!: (value: T) => void
let reject!: (reason?: any) => void
const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
return { promise, resolve, reject }
```

Three lines of logic:

1. Declare `resolve` and `reject` with definite-assignment assertions (`!`) — they'll be set synchronously inside the executor.
2. Create the promise. The executor runs synchronously, so `res` and `rej` are captured into the outer variables before the constructor returns.
3. Return the promise and the two callbacks as a single object.

There's no other state. No `settled` flag, no value cache, no guard. The promise machinery is the state.

#### Why you'd want this

The normal way to create a promise is to write the executor at the same place the promise is used:

```ts
const p = new Promise<Value>((resolve, reject) => {
  // resolve/reject are only reachable inside this callback
})
```

The executor is a "resolver scope." Any code that needs to call `resolve` has to live inside it, or be wired up through a callback that is. That's fine when the resolution happens in the same logical place — a `fetch` callback, a `setTimeout`, an event handler.

It's awkward when the code that will resolve the promise lives *elsewhere* — a different module, a different function, a registry of pending operations. `deferred` extracts `resolve` and `reject` into a return value so you can hand them around.

Common situations where this matters:

- **A queue of pending requests** that resolves each one when a response arrives.
- **A registry of waiters** keyed by id — someone calls `register(id)`, the deferred goes into a map, a response comes in, the deferred for that id is resolved.
- **Bridging callback APIs to promise APIs** — pass `resolve` and `reject` where the callback API expects them.
- **Manually controlled test promises** — resolve at a specific moment.
- **Promise-based handoffs** where the resolver is determined after the promise is created.

#### Common patterns

**Bridging a callback API**

```ts
function readAsync(path: string) {
  const d = deferred<Buffer>()
  fs.readFile(path, (err, data) => {
    if (err) d.reject(err)
    else d.resolve(data)
  })
  return d.promise
}
```

This is what `new Promise` does internally. `deferred` just makes the intermediate explicit.

**Waiter registry**

```ts
const waiters = new Map<string, ReturnType<typeof deferred<Response>>>()

function expect(id: string) {
  const d = deferred<Response>()
  waiters.set(id, d)
  return d.promise
}

function deliver(id: string, res: Response) {
  const d = waiters.get(id)
  waiters.delete(id)
  d?.resolve(res)
}
```

`expect(id)` returns a promise. `deliver(id, res)` resolves it. Neither one has to know about the other's call site.

**Manually controlled promise in tests**

```ts
const gate = deferred<void>()
fetchMock.mockImplementationOnce(() => gate.promise)

const call = fetchUser(id)
// ... assert on intermediate state ...
gate.resolve()

await call
```

**Coordinating between async branches**

```ts
const connected = deferred<void>()

client.on("connect", () => connected.resolve())
client.on("error", e => connected.reject(e))

await connected.promise
```

#### Behavior

- **`resolve(value)` settles the promise with `value`.** If `value` is a promise or thenable, the outer promise adopts it — same as `Promise.resolve`.
- **`reject(reason)` settles the promise with a rejection.** `reason` can be anything; it's not coerced.
- **First call wins.** Calling `resolve` twice is a no-op the second time. Calling `resolve` after `reject` is a no-op. Standard promise semantics.
- **No `settled` flag.** The type doesn't expose whether the deferred has been settled. If you need that, track it separately or check `await Promise.race([d.promise.then(() => "resolved", () => "rejected"), Promise.resolve("pending")])`.
- **The promise starts pending.** If you never call `resolve` or `reject`, it stays pending forever. No timeout, no auto-settle.
- **`resolve` and `reject` are the raw executor callbacks.** They don't return anything, don't throw if called late, and don't validate their argument.

#### `deferred` vs `gate`

Sibling primitives with different failure models:

- **`deferred<T>`** — both `resolve` and `reject`. The failure case exists.
- **`gate<T>`** — only `open`. No rejection. Readiness has no failure mode.

Pick by the domain. "Did the request succeed?" → `deferred`. "Is the subsystem ready?" → `gate`.

The other difference: `gate` names its resolve `open`, which reads as a signal rather than a completion. `deferred` uses the standard `resolve` / `reject` names, matching the promise executor.

#### `deferred` vs `Promise.withResolvers`

`Promise.withResolvers<T>()` is the native version of the same thing. Same shape, same semantics:

```ts
const { promise, resolve, reject } = Promise.withResolvers<T>()
```

`deferred` predates it or backfills it for environments where `Promise.withResolvers` isn't available. If your runtime has `Promise.withResolvers`, either one works — `deferred` has the advantage of being a single import that works everywhere.

#### Gotchas

- **Handing out `resolve` / `reject` is handing out control.** Anyone with a reference can settle the promise. If that's not what you want, keep the deferred in the enclosing scope and expose only `.promise`.
- **No protection against double-settle.** First call wins silently. If two producers race to resolve, whichever runs first is what the waiter sees; the second's value is dropped without a warning.
- **No protection against late settle.** Calling `resolve` after the promise was already rejected is a no-op. There's no way to detect that from inside `deferred`.
- **Rejection with a non-Error is allowed.** `d.reject("oops")` is valid; the promise rejects with the string. Consumers expecting `Error` will need to handle it. Convention is to always reject with `Error` instances.
- **Memory: the promise holds a reference.** A deferred that is never settled and never awaited still holds the promise object, and if consumers added `.then` callbacks, those callbacks are never invoked and their closures stay alive. Watch for leaked deferreds in registries.
- **No cancellation.** Once created, the deferred exists until settled or garbage collected. There's no `cancel()` method. If you need cancellation, wrap the promise with `AbortSignal` on the consumer side, or design your registry to remove entries.
- **The `!` on `resolve` and `reject`** is a TypeScript definite-assignment assertion. It tells the compiler "these will be set before use." The promise executor runs synchronously, so they are. Don't move the promise construction after the return and expect this to still hold.

#### What this is *not*

- Not a `Deferred` with a `.resolve()` method. It's a plain object with three fields. Call `d.resolve(x)`, not `d.resolve()(x)`.
- Not cancellable, resettable, or observable. It's a one-shot.
- Not a queue. It resolves one thing.
- Not a thenable itself. The `deferred` object isn't a promise; its `.promise` field is. Don't `await d`, `await d.promise`.

---

## Philosophy

`new Promise` ties the resolver to the executor scope. That's usually fine and occasionally awkward. `deferred` pulls the resolver out into a value so it can be handed to whoever needs it — a registry, a callback adapter, another module. Three lines, no state beyond what the promise machinery provides, the same failure model as the promise executor itself.

---

## License

MIT
