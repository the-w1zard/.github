# `ignoreArg`

> Adapt a zero-argument callback to an API that passes an argument. Wraps your function, discards whatever the caller sends, and invokes your function with no arguments.

```tsx
<button onClick={ignoreArg(() => setOpen(true))}>Open</button>
```

The point: React, the DOM, and most event systems hand every handler an event object. When your callback doesn't take arguments — which is most of the time — `ignoreArg` bridges the two shapes so the handler slot accepts a function the API would otherwise reject or that would force you to write `() =>` inline.

---

## Usage

### 🟢 First-time users — start here

```tsx
import { ignoreArg } from "platform"

<button onClick={ignoreArg(toggle)}>
<button onClick={ignoreArg(handleReset)}>
```

That's it. You're done. You now know how to use `ignoreArg`.

The API passes an event, your function doesn't take one, `ignoreArg` drops the event and calls your function. That's the whole contract.

### 🔵 Everyone else

#### Signature

```ts
const ignoreArg = <T>(fn: () => T) => (_arg?: unknown) => fn()
```

Two functions. Outer takes your callback; the returned function is the adapter that accepts any argument and ignores it.

- `ignoreArg(fn)` returns `(_arg?) => fn()`.
- The adapter accepts an optional argument of any shape and discards it.
- Calling the adapter calls `fn()` with no arguments and returns whatever `fn` returns.

#### When to use it

The use case is narrow and specific: **the caller passes an argument, the callee doesn't accept one, and the type signatures are incompatible without a wrapper.**

Common situations:

- **React event handlers typed as `(e: Event) => void`.** Passing a `() => void` function directly is a type error in strict configs. `ignoreArg` bridges it.
- **`addEventListener` callbacks.** The DOM passes an event; your callback doesn't take one.
- **Pub/sub bus handlers.** The bus invokes with a payload; your handler ignores it.
- **Third-party UI libraries** whose prop types require an argument where you don't need one.

```ts
element.addEventListener("click", ignoreArg(handleClick))
```

#### `ignoreArg` vs an inline arrow

Both do the same thing:

```tsx
onClick={() => toggle()}          // inline arrow ignores the event
onClick={ignoreArg(toggle)}       // adapter ignores the event
```

Pick `ignoreArg` when:

- You want the call site to read as "the argument is intentionally dropped."
- You're passing a named function you'd rather not wrap inline.
- You're producing handlers that will be stored, passed, or reused (bus handlers, config objects).

Pick the inline arrow when:

- It's obvious from context that the argument doesn't matter.
- You're already in an expression and another function call adds noise.

Neither is more correct. `ignoreArg` names the intent; the arrow just performs it.

#### Behavior

- **The argument is discarded.** Not logged, not forwarded, not inspected. Whatever the caller sends is dropped on the floor.
- **`fn` is called with no arguments.** Even if `fn` is defined to accept parameters, they arrive as `undefined`. TypeScript accepts this because `fn` is typed `() => T`.
- **Return value passes through.** If `fn` returns a value, the adapter does too.
- **New adapter per call.** `ignoreArg(fn) !== ignoreArg(fn)`. See gotchas for the React identity implications.
- **Synchronous.** The adapter is not async; it doesn't await, wrap, or defer. Whatever `fn` returns is whatever the adapter returns.

#### Common patterns

**React handlers that don't need the event**

```tsx
<button onClick={ignoreArg(toggle)}>Toggle</button>
<button onClick={ignoreArg(reset)}>Reset</button>
```

**DOM listeners**

```ts
element.addEventListener("click", ignoreArg(handleClick))
element.addEventListener("focus", ignoreArg(handleFocus))
```

**Pub/sub**

```ts
bus.on("ready", ignoreArg(onReady))
bus.on("error", ignoreArg(onError))
```

**Third-party components with strict prop types**

```tsx
<CustomInput onChange={ignoreArg(onChange)} />
```

**A map of handlers**

```ts
const handlers = {
  open: ignoreArg(openModal),
  close: ignoreArg(closeModal),
  reset: ignoreArg(clearForm),
}
```

#### Gotchas

- **New function identity per call.** `ignoreArg(fn)` creates a new function every time. In React, writing `onClick={ignoreArg(fn)}` inline produces a new handler on every render. If the child is memoized, this defeats the memo. The fix is the same as for any inline arrow:

  ```tsx
  // stable identity via useCallback
  const onClick = useCallback(ignoreArg(handle), [handle])

  // or hoist to module scope
  const onClick = ignoreArg(handle)
  ```

  Not a bug in `ignoreArg` — the same cost as writing `() => handle()` inline — but worth knowing.

- **The argument is truly dropped.** If `fn` expects to receive an event someday, this is the wrong adapter. Use the function directly or forward the event explicitly.

- **`T` comes from `fn`'s return type.** If `fn` returns `void`, so does the adapter. If it returns a value, the adapter does too. Usually irrelevant for handlers, but available if you need it.

- **Parameter is optional and `unknown`.** This is what lets the adapter satisfy event prop types across libraries — the type accepts any argument. If a library requires a specific event shape on the callback, this still works, because the shape is ignored.

- **The wrapped function has no access to the argument.** There's no way to opt in to receiving it through `ignoreArg`. If you need the event sometimes, don't use this.

#### `ignoreArg` vs `invoke`

You'll notice the implementations are identical:

```ts
export const invoke =     <T>(fn: () => T) => (_event?: unknown) => fn()
export const ignoreArg =  <T>(fn: () => T) => (_arg?:   unknown) => fn()
```

Same code. Different names. The names encode different framings:

- **`invoke`** — "make a handler that invokes this function." Reads well at a React call site: `onClick={invoke(toggle)}`.
- **`ignoreArg`** — "adapt this callback to an API that passes an argument." Reads well when bridging type mismatches: `addEventListener("click", ignoreArg(handleClick))`.

Both exist because the *reason* you reach for the helper varies, and the name should match the reason. Pick whichever fits the call site. If you find yourself wanting both in the same file, they're the same function with two names — that's fine.

#### What this is *not*

- Not `useCallback`. It doesn't memoize. Wrap with `useCallback` if you need a stable identity across renders.
- Not a debounce or throttle. No timing behavior.
- Not an event transformer. It doesn't reshape, forward, or inspect the argument — it discards it.
- Not a partial application helper. It fixes the argument list to `[]`; it doesn't bind or reorder anything.
- Not a general-purpose adapter. It only works for the specific case where the callee takes no arguments.

---

## Philosophy

Event APIs pass arguments. Most handlers don't take any. `ignoreArg` is the name for that mismatch — a one-line adapter that says "the argument is not part of this callback's contract" and bridges the two signatures. Same code as `invoke`; different reason, different name.

---

## License

MIT
