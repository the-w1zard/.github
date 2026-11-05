# `setPrev` / `setPrevB`

> Functional state setters for React-style `useState`. Give them a setter, give them a value, and they update based on the previous state without you having to write `setX(prev => …)` inline every time.

```ts
setPrev(setUser, "Alice", "name")   // setUser(prev => ({ ...prev, name: "Alice" }))
setPrev(setUser, { age: 30 })       // setUser(prev => ({ ...prev, age: 30 }))
setPrevB(setOpen)                   // setOpen(prev => !prev)
```

Two shapes: `setPrev` for object state with a single key or a merge, `setPrevB` for boolean toggles.

---

## Usage

### 🟢 First-time users — start here

```ts
import { setPrev, setPrevB } from "platform"

// Toggle a boolean
setPrevB(setOpen)

// Set one key on an object
setPrev(setForm, "Alice", "name")

// Merge several keys
setPrev(setForm, { name: "Alice", age: 30 })
```

That's it. You're done. You now know how to use both.

They exist because `setState(prev => ({ ...prev, key: value }))` is the same boilerplate every time, and the form with the spread is where people accidentally write `setState({ ...state, ... })` and use a stale `state`. These helpers force the functional form, so you can't reference stale state by accident.

### 🔵 Everyone else

#### Signatures

```ts
function setPrev<T = any>(setter: any, v: any, k?: any): void
function setPrevB(setter: any): void
```

- `setter` — a React-style state setter (`Dispatch<SetStateAction<S>>`).
- `v` — the value to set. With `k` provided, this is the value for that key. Without `k`, this is an object to spread-merge into `prev`.
- `k` — optional key. If provided, only that key is updated.
- `setPrevB` toggles a boolean via `!prev`.

Both return `void`. They call the setter with a functional updater and don't return anything.

#### What `setPrev` does

```ts
setPrev(setter, v, k?)
```

Two modes, chosen by whether `k` is `undefined`:

**With `k` — single-key update:**

```ts
setter((prev) => ({ ...prev, [k]: v }))
```

Clone the previous object, replace one key, hand the clone to the setter. The `prev` is never mutated.

**Without `k` — object merge:**

```ts
setter((prev) => ({ ...prev, ...(v as Partial<any>) }))
```

Clone the previous object, spread the new object over it, hand the clone to the setter. Useful for multi-field updates:

```ts
setPrev(setForm, { name: "Alice", age: 30 })
```

Both modes rely on `prev` being an object. If `prev` is a primitive, the spread produces a weird result — see gotchas.

#### What `setPrevB` does

```ts
setter((prev) => !prev)
```

Toggles. `true` becomes `false`, everything truthy becomes `false`, everything falsy becomes `true`. Named `B` for boolean, but the implementation is a plain logical-not, so it works on any value with a boolean interpretation. The common case is a `useState<boolean>`.

#### Why the functional form matters

The bug `setPrev` prevents is subtle:

```ts
// ❌ uses `state` from the render closure — stale if the setter is called
//    twice in the same tick, or after an async boundary
setUser({ ...user, name: "Alice" })

// ✅ uses the latest state, always
setUser(prev => ({ ...prev, name: "Alice" }))
```

The functional form is correct. The direct-object form is a footgun that works in tests and breaks in production. `setPrev` and `setPrevB` make the correct form the only form. You can't accidentally reach for stale state because the helper never gives you a way to.

#### Common patterns

**Controlled form fields**

```tsx
<input onChange={e => setPrev(setForm, e.target.value, "name")} />
<input onChange={e => setPrev(setForm, e.target.value, "email")} />
```

**Multi-field updates**

```ts
setPrev(setForm, { name: "", email: "", submitted: true })
```

**Toggle UI state**

```tsx
<button onClick={() => setPrevB(setOpen)}>Toggle</button>
<button onClick={() => setPrevB(setLoading)}>Loading</button>
```

**Reset a field**

```ts
setPrev(setForm, undefined, "error")
```

**Clear a form**

```ts
setPrev(setForm, { name: "", email: "", error: undefined })
```

#### Behavioral notes

- **Never mutates `prev`.** Both modes spread into a new object. The setter receives a fresh reference.
- **Synchronous call to the setter.** The helper builds the functional updater and calls it. React schedules the actual state update.
- **Idempotent within a tick.** Calling `setPrev(setter, "a", "x")` twice in the same render queues two updaters, each applied to the result of the previous. Both are correct.
- **`prev` is captured by the closure.** The updater reads `prev` at the moment React invokes it, not at the moment the helper was called. That's the whole point.

#### Gotchas

- **`setPrev` requires `prev` to be an object.** If `prev` is a number, string, or `null`, `{ ...prev }` produces something surprising. `{ ...42 }` is `{}`, `{ ...null }` is `{}`. The helper does not check; it assumes object state.
- **Setting a key to `undefined` still sets it.** `setPrev(setForm, undefined, "error")` produces `{ ...prev, error: undefined }`. The key exists with value `undefined`. This matters for `Object.keys` and `JSON.stringify` (which drops `undefined` values — inconsistent).
- **The `k !== undefined` check means you can't set a key named `undefined`.** If you somehow have `k` as `undefined` because you actually wanted the merge branch, fine. But if you intended to set a property and accidentally passed `undefined`, you get a merge with `v` instead. Watch your call sites.
- **`setPrev` with `k` is a shallow merge.** Nested objects at `prev[k]` are replaced, not merged. If you need deep updates, do them inside the value or use a different helper.
- **`setPrevB` toggles everything truthy to `false`.** If `prev` is `"yes"`, `setPrevB` sets it to `false`. If `prev` is `1`, it sets it to `false`. If `prev` is `0`, it sets it to `true`. The behavior is logical-not, not a strict boolean toggle. Only use it when `prev` is genuinely `boolean`.
- **Types are loose on purpose.** `setter: any`, `v: any`, `k: any`, `T = any`. TypeScript won't catch a mismatch between the setter's state shape and what you're passing. It trusts the caller. If you want tighter types, wrap these in a typed helper for each store.
- **`v as T[XS]` references an `XS` type.** That's a project-level type alias. If you're vendoring this, either define `XS` in your own module or replace `T[XS]` with `T` (or just drop the cast — it's erased at runtime).
- **No return value.** You can't chain `setPrev` calls. Each call is a statement.

#### What this is *not*

- Not a reducer. It updates one field or merges an object. For complex state transitions, use `useReducer`.
- Not immer. No structural sharing beyond the top level. Every update creates a new object at the top.
- Not async-aware. It calls the setter synchronously; if you need to react to the new state, use `useEffect` on the state variable.
- Not a general-purpose `setState` wrapper. It's specifically for object state (or boolean, for `setPrevB`).

---

## Philosophy

`setState(prev => ({ ...prev, [k]: v }))` is the correct pattern and nobody wants to type it. `setPrev` and `setPrevB` are the two most common shapes of it — set a key, merge an object, toggle a boolean — with the functional form baked in so stale-closure bugs can't happen. Small helpers; outsized footgun removal.

---

## License

MIT
