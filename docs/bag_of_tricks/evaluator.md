# `evaluator`

> Classify any JavaScript value by shape. Returns a short string tag — `"thenable"`, `"async-iterable"`, `"map"`, `"plainObject"`, `"number"`, etc. — describing what the value *is*, not what it contains.

```ts
evaluator(Promise.resolve(1))    // "thenable"
evaluator(async function* () {}) // "async-iterable"
evaluator(new Map())             // "map"
evaluator({ a: 1 })              // "plainObject"
evaluator(42)                    // "number"
```

The point: one function that answers "what kind of thing is this?" without a chain of `typeof` checks at every call site. Useful for dispatch, logging, serialization, and validation.

---

## Usage

### 🟢 First-time users — start here

```ts
import { evaluator } from "platform"

evaluator(42)                 // "number"
evaluator("hi")               // "string"
evaluator(null)               // "null"
evaluator([])                 // "iterable"
evaluator({})                 // "object"        — wait, see below
evaluator(new Map())          // "map"
evaluator(Promise.resolve())  // "thenable"
```

That's it. You're done. You now know how to use `evaluator`.

The function is a *first-match* classifier. It walks a list of checks in order and returns the tag for whichever one hits first. The order matters, and that's most of the design.

### 🔵 Everyone else

#### Signature

```ts
function evaluator(v: unknown): string
```

No generic, no overloads. Takes anything and returns a tag string. The tag is not a closed union in the type — it's just `string` — but the set of possible values is fixed by the code below.

#### The full tag list

In the order the checks run:

| Order | Tag | Matches |
| --- | --- | --- |
| 1 | `"thenable"` | anything with a `.then` function (Promise, thenable, some libraries' lazy values) |
| 2 | `"async-iterable"` | has `[Symbol.asyncIterator]` |
| 3 | `"null"` | `null` (typeof is `"object"`, so it's separate) |
| 4 | `"string"` / `"number"` / `"boolean"` / `"bigint"` / `"symbol"` / `"undefined"` | primitives (from `typeof v`) |
| 5 | `"function"` | functions |
| 6 | `"array"` | TypedArrays and DataViews (`ArrayBuffer.isView`) |
| 7 | `"map"` | `instanceof Map` |
| 8 | `"set"` | `instanceof Set` |
| 9 | `"date"` | `instanceof Date` |
| 10 | `"regexp"` | `instanceof RegExp` |
| 11 | `"error"` | `instanceof Error` |
| 12 | `"iterable"` | has `[Symbol.iterator]` |
| 13 | `"object"` | anything else with `typeof === "object"` (plain record, or fallback) |

That's the set. Some lines in the source run after a `return` that already fired for any reachable input — see the analysis below.

#### Why the order is what it is

Two axes matter: **async-ness** and **shape**.

1. **Async first.** `thenable` and `async-iterable` are checked before anything else. If a value is a promise or an async iterable, that's the most important thing about it — more than whether it's also an object. So those win.
2. **Null before object.** `typeof null === "object"` is a famous JS wart. Null is checked explicitly so it doesn't fall into the `"object"` bucket.
3. **Primitives before objects.** `typeof` returns a definitive string for primitives; no further checks needed.
4. **Specific classes before generic ones.** `Map`, `Set`, `Date`, `RegExp`, `Error` are checked before the generic `"object"` fallback, so a `Map` doesn't get classified as a plain object.
5. **Iterables last before `"object"`.** Arrays, Strings, Maps, Sets all have `Symbol.iterator`. But `Map`, `Set`, `String`, `Array` are all caught earlier — so `"iterable"` only fires for *custom* iterables that aren't one of the known types.

#### What's reachable

The `return` statements short-circuit. Some of the checks at the bottom of the function are dead code as written — they can only be reached if the earlier checks missed, and given the earlier checks, they never will. Let me be precise about which ones:

- **`"iterator"` (line 13 of the checks)** — unreachable. The earlier `"iterable"` check uses `[Symbol.iterator]`, and `"iterator"` uses the same symbol. If a value has `Symbol.iterator`, it already returned `"iterable"`. The `"iterator"` branch can never fire.
- **The primitive re-checks** (`string`, `number`, `boolean`, `bigint`, `symbol`, `undefined` after `"iterable"`) — unreachable. Primitives are already caught by `t !== "object" && t !== "function"` earlier.
- **`"Array"` via `instanceof Array`** — unreachable. Arrays have `Symbol.iterator`, so they hit `"iterable"` first.
- **`WeakMap`, `WeakSet`, `Promise`, `ArrayBuffer`** — reachable only if they don't hit an earlier check. `Promise` has `.then`, so it returns `"thenable"` first. `ArrayBuffer` is *not* iterable and has no `.then`, so it reaches this branch. `WeakMap` / `WeakSet` are not iterable and have no `.then`, so they also reach here.
- **`Buffer`, `URL`, `URLSearchParams`** — `Buffer` is a `Uint8Array`, so `ArrayBuffer.isView` catches it and returns `"array"`. `URL` has an iterator (it's iterable over search params in modern specs? actually no — URL is not iterable), and `URLSearchParams` *is* iterable. So `URL` reaches its branch; `URLSearchParams` returns `"iterable"` before getting there.
- **`"plainObject"`** — unreachable, because `"object"` fires earlier.

So the function returns these tags in practice:

`"thenable"`, `"async-iterable"`, `"null"`, `"string"`, `"number"`, `"boolean"`, `"bigint"`, `"symbol"`, `"undefined"`, `"function"`, `"array"`, `"map"`, `"set"`, `"date"`, `"regexp"`, `"error"`, `"iterable"`, `"object"`, `"WeakMap"`, `"WeakSet"`, `"ArrayBuffer"`, `"URL"`.

The unreturnable ones (`"iterator"`, `"Array"`, `"Promise"`, `"Buffer"`, `"URLSearchParams"`, `"plainObject"`) are the tags the author probably *wanted* to distinguish, but the earlier checks swallow them. If that distinction matters, the checks need to be reordered or narrowed.

#### `"iterable"` vs `"object"`

Both are catch-alls for "not one of the known types." The distinction:

- `"iterable"` — has `Symbol.iterator`. Arrays (in theory, but caught earlier), custom iterables, `URLSearchParams`, `arguments` objects, generators.
- `"object"` — has neither `Symbol.iterator` nor any other known marker. Plain records, class instances without iteration, `Object.create(null)`.

If you're dispatching on the tag, these two are the "unknown, but here's a hint" categories.

#### Common patterns

**Dispatch by kind**

```ts
switch (evaluator(v)) {
  case "thenable": return await v
  case "iterable": return [...v]
  case "map": return [...v.entries()]
  case "set": return [...v.values()]
  case "object": return Object.entries(v)
}
```

**Logging**

```ts
log.info("received", { kind: evaluator(payload), payload })
```

**Validation gate**

```ts
if (evaluator(input) !== "object") throw new Error("expected a plain object")
```

**Serialization decisions**

```ts
const kind = evaluator(v)
if (kind === "date") return v.toISOString()
if (kind === "map") return Object.fromEntries(v)
```

#### Behavior

- **First match wins.** Once a check hits, the function returns immediately. Later checks never run.
- **`typeof null === "object"`** is handled explicitly — `null` gets its own tag, not `"object"`.
- **`instanceof` checks are realm-sensitive.** In a multi-realm environment (iframes, workers, `vm` contexts), `Map`, `Set`, `Date`, etc. from a different realm will fail their `instanceof` check. `Array.isArray` is cross-realm-safe; the `instanceof` checks are not.
- **No `valueOf` / `toString` calls.** The classifier doesn't coerce, doesn't serialize. It only inspects shape.
- **Thenables win over everything.** A `Map` with a `.then` method would be `"thenable"`, not `"map"`. This is by design — async-ness takes precedence.

#### Gotchas

- **Many branches are unreachable.** See the analysis above. The function is longer than its runtime behavior. If you're relying on a tag that's listed in the source but never actually returned, you have a bug — test the actual output.
- **`"iterator"` is dead.** The `"iterable"` check above it uses the same `Symbol.iterator` symbol. `"iterator"` can never return.
- **`"plainObject"` is dead.** `"object"` fires before it. If you see `"object"`, that's your plain object.
- **`"Array"`, `"Buffer"`, `"Promise"`, `"URLSearchParams"` are dead.** They're all caught by earlier checks:
  - Arrays → `"iterable"` (has `Symbol.iterator`).
  - Buffers → `"array"` (`ArrayBuffer.isView`).
  - Promises → `"thenable"`.
  - `URLSearchParams` → `"iterable"`.
- **The primitive re-checks in the middle are dead.** The first `t !== "object" && t !== "function"` catch-all returns them all.
- **`instanceof` doesn't cross realms.** In Node worker threads, iframes, or `vm` contexts, an `Array` created in another realm is not `instanceof Array` here. `Array.isArray` is safe; the others aren't. The `Map`, `Set`, `Date`, `RegExp`, `Error` checks all share this caveat.
- **`DataView` gets `"array"`.** `ArrayBuffer.isView` returns `true` for `DataView` as well as TypedArrays. Both come back as `"array"`. If you need to distinguish, add a check.
- **A `Map` with a `.then` returns `"thenable"`.** Async-ness is checked before shape, always. If your Map accidentally has a `.then` property, you'll get the wrong tag.
- **`arguments` objects** return `"iterable"` (they have `Symbol.iterator` in modern engines). `null`-prototype objects return `"object"`.
- **The tag list is not typed.** `evaluator` returns `string`, not a union. If you want exhaustive switch checks, wrap it:

  ```ts
  type Kind = ReturnType<typeof evaluator>  // string — not helpful
  ```

  Either add a proper union return type to the function, or define one at the call site.

- **The tag names are inconsistent.** Some are lowercase (`"map"`, `"set"`, `"date"`), some are capitalized (`"WeakMap"`, `"ArrayBuffer"`, `"URL"`). The inconsistency reflects the fact that this function grew organically. If you're matching on tags, use exact strings.

- **Mixed case in the source.** Lines that can't fire are still in the source, which means readers see them and assume they're reachable. If you're maintaining this function, either delete the dead branches or fix the ordering so they fire.

#### What this is *not*

- Not `typeof`. `typeof` gives you primitives and `"object"`/`"function"` and nothing else. `evaluator` gives you the shape of the object.
- Not `instanceof`. `instanceof` is a single-class check. `evaluator` is a classifier.
- Not `Object.prototype.toString.call(v)` — although that's another common approach and it *does* cross realms. `evaluator` uses `instanceof`, which doesn't.
- Not a schema validator. It doesn't check fields, only top-level shape.
- Not a serializer. It tags; it doesn't convert.

---

## Philosophy

"What is this?" should have one answer, not a `typeof` chain at every call site. `evaluator` gives you that answer as a short tag. The design puts async-ness first and shape second, on the reasoning that a promise is *always* a promise before it's anything else. The cost is that some distinctions the source appears to make are swallowed by earlier checks — the function returns fewer tags than it names. Read it as a first-match classifier, not a list of every branch.

---

## License

MIT
