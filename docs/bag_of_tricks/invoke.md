# `invoke`

> Wrap a function so it can be used as an event handler. The wrapped function ignores whatever argument it's called with and invokes the original.

```ts
<button onClick={invoke(() => setOpen(true))}>Open</button>
```

The point: React (and DOM, and most event systems) pass an event object to every handler. When you don't care about the event — which is most of the time — `invoke` gives you a wrapper that swallows the argument and calls your function with no arguments.

---

## Usage

### 🟢 First-time users — start here

```tsx
import { invoke } from "platform"

<button onClick={invoke(() => doThing())}>
<button onClick={invoke(handleClick)}>
```

That's it. You're done. You now know how to use `invoke`.

Instead of `onClick={() => doThing()}` — a thunk that ignores the event — you write `onClick={invoke(doThing)}`. Same behavior, but the intent is in the name: this handler ignores its argument.

### 🔵 Everyone else

#### Signature

```ts
const invoke = <T>(fn: () => T) => (_event?: unknown) => fn()
```

Two functions. The outer takes your function, the inner is the event handler.

- `invoke(fn)` returns `(_event?) => fn()`.
- The returned handler accepts an optional event and ignores it.
- Calling the handler calls `fn()` with no arguments and returns whatever `fn` returns.

#### Why you'd want this

In React (and most event-driven APIs), handlers receive an event as their first argument:

```tsx
<button onClick={(e) => ...}>
```

If you don't need the event, you have two options:

```tsx
// inline thunk — the event is right there, ignored
<button onClick={() => setOpen(true)}>

// invoke — the event is explicitly ignored by the helper
<button onClick={invoke(() => setOpen(true))}>
```

Both work. The second makes the intent explicit at the call site: "this handler does not use its event." It also composes when you want to pass a named function rather than an inline arrow:

```tsx
<button onClick={invoke(handleClick)}>

// vs.
<button onClick={() => handleClick()}>
```

With `invoke`, `handleClick` keeps its zero-argument signature. Without it, you write the wrapper inline every time.

#### Behavior

- **The event is discarded.** Not logged, not forwarded, not inspected. Whatever the caller passes is ignored.
- **The inner function takes an optional parameter.** Typed `_event?: unknown`, so it works with handlers that pass an event, handlers that pass nothing, and handlers that pass something else.
- **Returns whatever `fn()` returns.** If `fn` returns a value, the handler does too. If `fn` returns `void`, the handler returns `void`.
- **Creates a new handler on each call to `invoke`.** `invoke(fn) !== invoke(fn)`. This is the usual gotcha for React reconciliation — see below.

#### Common patterns

**React event handlers that ignore the event**

```tsx
<button onClick={invoke(toggle)}>Toggle</button>
<button onClick={invoke(reset)}>Reset</button>
<input onChange={invoke(handleChange)} />
```

**Passing a handler to an event prop that requires arguments**

Some libraries type their event props as `(e: Event) => void`. Passing a zero-arg function is a type error, but wrapping with `invoke` is fine because `invoke` accepts the event parameter and ignores it.

```tsx
<CustomButton onClick={invoke(handleClick)} />
```

**Event handlers in non-React contexts**

```ts
element.addEventListener("click", invoke(handleClick))
```

**Composing with a store or bus**

```ts
bus.on("ready", invoke(onReady))
bus.on("error", invoke(onError))
```

**Multiple named handlers with different arities**

```ts
const handlers = {
  open: invoke(openModal),
  close: invoke(closeModal),
  reset: invoke(clearForm),
}
```

#### Gotchas

- **New reference per call.** `invoke(fn)` returns a new function every time. In React, if you write `onClick={invoke(fn)}` inline, the handler identity changes every render, which can defeat memoization in child components. The usual fix is to either wrap in `useCallback` or define the wrapped handler outside the render:

  ```tsx
  // ❌ new handler every render — child's React.memo is defeated
  <Child onClick={invoke(handle)} />

  // ✅ stable identity via useCallback
  const onClick = useCallback(invoke(handle), [handle])
  <Child onClick={onClick} />

  // ✅ or hoist the wrapping
  const onClick = invoke(handle)   // module scope
  <Child onClick={onClick} />
  ```

  Same tradeoff as any inline arrow in JSX. `invoke` doesn't cause it — it just doesn't hide it either.

- **The event isn't passed through.** If `fn` expects an event, this is the wrong tool. Use `fn` directly or an inline arrow that forwards the event.

- **`T` is inferred from `fn`'s return type.** If `fn` returns `void`, the handler returns `void`. If it returns a value, the handler does too. Usually doesn't matter for event handlers, but worth knowing.

- **The event parameter is `optional` and `unknown`.** This means the handler is assignable to most event prop types, which is the intent. If a library's event prop type requires a specific event shape, this still works — `unknown` accepts any argument.

- **Not curried the other way.** `invoke(fn)(event)` ignores `event`, but there's no `invoke(fn, event)` single-call form. It's always two calls: create the handler, then call it.

- **The wrapped function receives no arguments.** Even if `fn` is defined to take parameters, `invoke` calls it with none. The parameters will be `undefined` at runtime and TypeScript will not complain (because `fn` is typed `() => T`). If `fn` requires arguments, this is the wrong tool.

#### When to reach for `invoke` vs an inline arrow

**Use `invoke(fn)` when:**

- The function has a natural zero-argument signature and you want to keep it that way.
- You want the call site to read as "this handler ignores the event."
- You're passing the handler around (to `addEventListener`, a bus, a config object).

**Use `() => fn()` when:**

- It's inline and obvious from context.
- The zero-arg-ness is incidental and not worth naming.

Both are correct. `invoke` is a name for the pattern, not a new pattern.

#### What this is *not*

- Not a debounce or throttle. No timing behavior.
- Not a `useCallback`. It doesn't memoize. Wrap it with `useCallback` if you need a stable identity.
- Not an event adapter. It doesn't reshape, forward, or inspect events — it discards them.
- Not a partial-application helper. `invoke` fixes the argument list to `[]`; it doesn't bind or reorder anything.

---

## Philosophy

Most event handlers ignore their event. React, the DOM, and every pub/sub library pass one anyway. `invoke` is the name for "I don't use the argument" — a one-line wrapper that makes the intent explicit and lets the wrapped function keep its natural shape.

---

## License

MIT
