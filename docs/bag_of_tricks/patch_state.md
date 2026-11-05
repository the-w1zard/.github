# `patchState`

> Merge a partial object into React-style state via the functional updater. Never reads state from the render closure, so no stale-closure bugs. Just `{ ...prev, ...patch }`, wrapped, named, and ready to call.

```ts
patchState(setUser, { name: "Alice", age: 30 })
// → setUser(prev => ({ ...prev, name: "Alice", age: 30 }))
```

The multi-field version of `setKey`. One call, one spread, one state update.

---

## Usage

### 🟢 First-time users — start here

```ts
import { patchState } from "platform"

patchState(setForm, { name: "Alice", age: 30 })
patchState(setUser, { lastSeen: Date.now() })
```

That's it. You're done. You now know how to use `patchState`.

It's the same as writing `setForm(prev => ({ ...prev, name: "Alice", age: 30 }))` — but the correct pattern is baked in, so you can't accidentally reach for stale state.

### 🔵 Everyone else

#### Signature

```ts
function patchState<T = any>(setState: any, patch: Partial<T>): void
```

- `setState` — a React-style setter. Typed `any` (see gotchas).
- `patch` — a partial object whose keys are merged over the current state.
- Returns `void`.

`Partial<T>` on the patch is the type-level contract: every field is optional, so you can update a subset. The `T` default is `any`, but inference from `patch` usually narrows it if the patch is typed.

#### How it works

```ts
setState((prev: any) => ({ ...prev, ...patch }))
```

One line. It builds the functional updater and hands it to the setter. `prev` is whatever the latest state is when React applies the update — never the state captured in the render closure that called `patchState`.

The result is a shallow clone of `prev` with the patch's keys replaced. Fields not mentioned in the patch are unchanged.

#### The point of the functional form

```ts
// ❌ reads stale state if called twice in the same tick, or after an await
setState({ ...state, name: "Alice" })

// ✅ always reads the latest state
setState(prev => ({ ...prev, name: "Alice" }))
```

The direct-object form works in tests and breaks in production. `patchState` makes the functional form the only form — you can't reach for stale state because the helper never gives you a way to.

This matters most when:

- The same setter is called twice in one event handler.
- The setter is called after an `await`.
- A parent re-renders between the call and the state application.

In all three cases, the direct-object form silently loses the earlier update. `patchState` never does.

#### Common patterns

**Multi-field form updates**

```tsx
<button onClick={() => patchState(setForm, { submitted: true, error: undefined })}>
  Submit
</button>
```

**Merging a partial response**

```ts
patchState(setUser, { lastSeen: Date.now(), online: true })
```

**Resetting a subset of fields**

```ts
patchState(setForm, { name: "", email: "", error: undefined })
```

**Composing two patches**

```ts
patchState(setState, { a: 1 })
patchState(setState, { b: 2 })
// both land — the second updater runs against the first's result
```

**From inside an async handler**

```ts
async function save() {
  const res = await api.put(data)
  patchState(setUser, { lastSaved: res.timestamp })
  // still correct even if other updates happened during the await
}
```

#### Behavior

- **Shallow clone.** `{ ...prev, ...patch }` creates a new object at the top level. Nested objects from `prev` are shared by reference unless the patch replaces them.
- **Functional updater.** Always reads the latest `prev`.
- **Never mutates `prev`.**
- **Fields not in the patch are untouched.** `patchState(setState, {})` produces `{ ...prev }` — a shallow clone with no changes. Harmless but wasteful; avoid empty patches.
- **`undefined` values in the patch overwrite.** `patchState(setState, { error: undefined })` sets `error` to `undefined`. The key still exists on the object; JSON serialization drops it, but `Object.keys` and iteration still see it.
- **Last writer wins on shared keys.** If two calls in the same tick both touch `name`, the second one's value is what ends up on the object.
- **Synchronous call to the setter.** The updater is built and handed off; React schedules the actual render.

#### Differences from `setKey`

Both update state via the functional form. The differences:

| | `setKey` | `patchState` |
| --- | --- | --- |
| Fields | one | many |
| Types | `key: K`, `value: T[K]` | `patch: Partial<T>` |
| Argument shape | two scalars | one object |
| Type inference | from `key`/`value` | from `patch` |
| Use when | one field | several fields |

Use `setKey` when you're setting exactly one field — you get per-key type checking on the value. Use `patchState` when you're updating a group of fields at once and the patch object is natural to write.

#### Differences from `setPrev`

`setPrev` has two modes: single-key when `k` is provided, merge when it's not. `patchState` is only the merge mode. If you're using `setPrev` without a `k` every time, `patchState` is the clearer name for the same behavior.

#### Gotchas

- **`setState` is typed `any`.** The generic `T` isn't inferred from the setter's own type, so `Partial<T>` is often just `Partial<any>`, which accepts anything. In practice, this means typos in field names may not be caught unless you annotate `T` explicitly or wrap the helper per store:

  ```ts
  const patchForm = (patch: Partial<Form>) => patchState<Form>(setForm, patch)
  ```

  Without that, `patchState(setForm, { naem: "x" })` compiles and silently adds a `naem` field to your state.

- **Shallow merge only.** Nested objects at a patched key are replaced wholesale. `patchState(setState, { user: { name: "x" } })` wipes out any other fields on `prev.user`. For nested updates, read `prev.user` inside a functional updater, or use immer.

- **Setting a key to `undefined` keeps the key.** Patch can't delete keys. If you want to remove a field, produce a new object without it:

  ```ts
  setState(prev => { const { error, ...rest } = prev; return rest })
  ```

  `patchState` doesn't have a delete mode.

- **Empty patch is a wasteful clone.** `patchState(setState, {})` creates a new object reference for no reason, which can trigger unnecessary re-renders if state is compared by identity. Guard against empty patches if this is a concern.

- **No return value.** You can't chain `patchState` calls. Each call is a statement.

- **Requires `prev` to be an object.** If `prev` is a primitive, `{ ...prev }` produces something unexpected. `{ ...42 }` is `{}`, `{ ...null }` is `{}`. The helper assumes object state.

- **No async awareness.** The helper calls the setter synchronously. If you need to react to the new state, observe the state variable after the next render.

#### What this is *not*

- Not a reducer. Use `useReducer` for multi-step state transitions with actions.
- Not immer. No structural sharing beyond the top level. Nested updates replace the branch.
- Not a store. It doesn't hold state; it wraps a React setter.
- Not a key-delete helper. It merges, it doesn't remove.

---

## Philosophy

`setState(prev => ({ ...prev, ...patch }))` is the correct way to update several fields at once, and it's the shape nobody wants to type. `patchState` gives it a name, bakes in the functional form so stale-closure bugs can't happen, and stays out of the way. One call, one patch object, one state update.

---

## License

MIT
