# `setKey`

> Set a single key on object state via a React-style setter. Always uses the functional updater, so the previous state is never read from a stale closure.

```ts
setKey(setUser, "name", "Alice")
// → setUser(prev => ({ ...prev, name: "Alice" }))
```

One key, one value, one call. It's the typed, single-purpose version of `setPrev`'s key-branch.

---

## Usage

### 🟢 First-time users — start here

```ts
import { setKey } from "platform"

setKey(setForm, "name", "Alice")
setKey(setForm, "age", 30)
setKey(setForm, "submitted", true)
```

That's it. You're done. You now know how to use `setKey`.

It's the same as writing `setForm(prev => ({ ...prev, name: "Alice" }))`, but the key and value are typed against the state shape — so TypeScript catches typos in the key and wrong-typed values before you run the code.

### 🔵 Everyone else

#### Signature

```ts
function setKey<T extends object, K extends keyof T>(
  setState: any,
  key: K,
  value: T[K],
): void
```

- `setState` — a React-style setter. Typed `any` here because React's `Dispatch<SetStateAction<T>>` doesn't compose nicely with the generic constraints, and the runtime doesn't need it.
- `key` — must be a key of `T`.
- `value` — must match the type of `T[K]`, i.e. the type of that specific key.
- Returns `void`.

The `T` is inferred from the setter at the call site — but since `setState` is `any`, inference falls back to `T` being inferred from `key` and `value` in practice. In tightly-typed codebases, you may need to annotate:

```ts
setKey<User, "name">(setUser, "name", "Alice")
```

or supply a typed wrapper. See gotchas.

#### How it works

```ts
setState((prev: any) => ({ ...prev, [key]: value }))
```

One line. It builds the functional updater and hands it to the setter. `prev` is whatever the latest state is when React applies the update — never a captured value from the render closure.

The result is a shallow clone of `prev` with one key replaced. Nested objects are shared by reference, which is exactly what you want for a state update.

#### The point of the types

The value of `setKey` over just writing `setState(prev => ({ ...prev, [key]: value }))` inline is the type signature:

- `key: K extends keyof T` — the key must exist on the state type. Typo a key and the compiler complains.
- `value: T[K]` — the value must match the type at that key. Assign a string to a numeric field and the compiler complains.

Neither check is enforced at runtime — the helper does the same thing regardless. But the editor catches errors before you hit save.

#### Common patterns

**Controlled inputs**

```tsx
<input
  value={form.name}
  onChange={e => setKey(setForm, "name", e.target.value)}
/>
```

**Clearing a single field**

```ts
setKey(setForm, "error", undefined)
```

**Setting a boolean flag**

```ts
setKey(setUi, "loading", true)
```

**Factory for field handlers**

```ts
const bind = <K extends keyof Form>(key: K) =>
  (value: Form[K]) => setKey(setForm, key, value)

const setName = bind("name")
const setAge = bind("age")
```

#### Behavior

- **Shallow clone.** `{ ...prev, [key]: value }` creates a new object at the top level. Nested objects are the same references as before.
- **Functional updater.** Always reads the latest `prev`. Safe to call multiple times in the same tick, safe after an `await`.
- **Never mutates `prev`.** A fresh object is handed to the setter.
- **Key stays present even when value is `undefined`.** `setKey(setForm, "error", undefined)` produces `{ ...prev, error: undefined }` — the key exists with an `undefined` value. This matters for `Object.keys` and iterating over the object.

#### Differences from `setPrev`

`setPrev` does two things:

1. Single-key update with `k` provided.
2. Object merge when `k` is omitted.

`setKey` does only the first, with the key and value properly typed against the state shape. If you're reaching for `setPrev` with a key every time, use `setKey` instead — you get the same behavior with better types and a clearer name.

Use `setPrev` when you're doing a merge (no key). Use `setKey` when you're setting exactly one field.

#### Gotchas

- **`setState` is typed `any`.** The generic `T` isn't inferred from the setter's own type — it's inferred from `key` and `value`. In many cases TypeScript will infer `T` as the object that would make `key` valid but give it `any`-ish shape, which weakens the `value: T[K]` check. If the type errors aren't firing, annotate `T` explicitly:

  ```ts
  setKey<Form, "name">(setForm, "name", "Alice")
  ```

  Or wrap it per-store:

  ```ts
  const setFormKey = <K extends keyof Form>(k: K, v: Form[K]) =>
    setKey<Form, K>(setForm, k, v)
  ```

- **Setting a key to `undefined` keeps the key.** If you want to *delete* a key, this won't do it. Spread-merge can't remove keys.
- **Shallow only.** Nested updates require either building the full nested object or a dedicated helper. `setKey(setState, "a", { ...prev.a, b: 2 })` reads `prev.a` from the closure — which is the stale-closure bug this helper is supposed to prevent, sneaking back in through the value. For nested updates, use a reducer or immer.
- **Key must be a string or number literal type.** `keyof T` is fine, but computed keys (`getKey()`) will lose the literal type and break inference. Pass a literal or a `const`-typed variable.
- **No return.** You can't chain. Each `setKey` is a statement.

#### What this is *not*

- Not a reducer. Use `useReducer` for multi-step state transitions.
- Not immer. No structural sharing beyond the top level.
- Not a delete helper. It sets, it doesn't remove.
- Not async-aware. It calls the setter synchronously; observe the new state via `useEffect` or the next render.

---

## Philosophy

`setState(prev => ({ ...prev, [k]: v }))` is the correct pattern. `setKey` gives it a name and a type signature, so the key is checked against the state type and the value is checked against the key's type — and the functional form is baked in, so stale-closure bugs can't happen. One field, one call.

---

## License

MIT
