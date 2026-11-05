# `orDefault`

> Return the value if it's neither `null` nor `undefined`. Otherwise return the fallback. One line, one operator, no ceremony.

```ts
orDefault(user?.name, "Anonymous")    // "Anonymous" if name is nullish
orDefault(count, 0)                    // 0 if count is nullish
orDefault(config, defaults)            // defaults if config is nullish
```

The point: collapse the nullish check and the fallback into a single expression that names itself at the call site.

---

## Usage

### 🟢 First-time users — start here

```ts
import { orDefault } from "platform"

const name = orDefault(input.name, "Anonymous")
const count = orDefault(input.count, 0)
```

That's it. You're done. You now know how to use `orDefault`.

It's `??` with a name. Pass a value and a fallback; you get the value if it exists, the fallback if it doesn't. `null` and `undefined` are the only triggers.

### 🔵 Everyone else

#### Signature

```ts
const orDefault = <T>(value: T | null | undefined, fallback: T): T
```

- `value` — the value to check. May be `T`, `null`, or `undefined`.
- `fallback` — what to return if `value` is nullish. Must be a `T`.
- Returns `T`. Never `null`, never `undefined`.

The two `T`s are the same type. The fallback is not a different shape — it's the same shape, chosen to stand in when the value is missing.

#### How it works

```ts
value ?? fallback
```

`??` (nullish coalescing) returns the left side unless it's `null` or `undefined`, in which case it returns the right side. It's exactly the semantics of the function. The function exists to give the operator a name and a place in the codebase.

#### Why a name at all

`??` is a fine operator. The reasons to wrap it:

- **Readability at the call site.** `orDefault(x, fallback)` reads like what it does. `x ?? fallback` is fine, but the named version composes better with other helpers and reads as intent, not syntax.
- **One spelling.** If you want to change the fallback policy across the codebase — say, to also treat empty strings as missing — you change one function.
- **Composition.** `orDefault` slots into pipelines and higher-order utilities where `??` can't (it's an operator, not a value).
- **Type narrowing in complex cases.** Occasionally the compiler needs the explicit signature to infer `T` correctly, especially with union types.

None of these is a huge win. The function is convenience, not necessity. That's fine — the same is true of `isDefined` over `x != null`, and we ship that too.

#### Behavior

- **`null` → fallback.**
- **`undefined` → fallback.**
- **Everything else → the value itself.** Including `0`, `""`, `false`, `NaN`, `[]`, `{}`.
- **Fallback is returned by reference.** If the fallback is an object, callers get the same object every time. No cloning.

The last point matters. Unlike `||`, `??` (and therefore `orDefault`) does not treat falsy values as missing:

```ts
orDefault(0, 10)         // 0
orDefault("", "default") // ""
orDefault(false, true)   // false
orDefault(NaN, 42)       // NaN
```

If you wanted the `||` behavior — treat any falsy as missing — you want a different function. This one is nullish-only, on purpose.

#### Common patterns

**Optional config with defaults**

```ts
const timeout = orDefault(options.timeout, 5000)
const retries = orDefault(options.retries, 3)
```

**Display fallbacks**

```ts
const displayName = orDefault(user.nickname, user.email)
```

**Filling in arrays or objects**

```ts
const items = orDefault(response.items, [])
const meta = orDefault(response.meta, {})
```

**Chained defaults**

```ts
const port = orDefault(env.PORT, orDefault(config.port, 3000))
```

**Inside a `Chain` or `ReChain` pipeline**

```ts
new ReChain(input).set("name", orDefault(input.name, "Anonymous")).done()
```

**Converting possibly-nullish to definite**

```ts
function process(input: string | null | undefined) {
  const s = orDefault(input, "")
  return s.toUpperCase()   // s is string, no null check needed
}
```

#### Gotchas

- **Nullish-only, not falsy.** `orDefault(0, 5)` returns `0`. `orDefault("", "x")` returns `""`. `orDefault(false, true)` returns `false`. This is intentional and matches `??`, but it surprises people coming from `||`-based defaults.
- **Fallback is required, not optional.** You can't call `orDefault(x)` and get a default `""` or `0`. The compiler will complain. This is by design — the function doesn't guess what "missing" should become.
- **Same type on both sides.** `orDefault(x, fallback)` requires `fallback` to be the same type as `x` (minus nullish). If you want to return a different shape, that's a different function:

  ```ts
  // not what this does
  orDefault(user, { guest: true })
  ```

  If `user` is `User | null` and you want `{ guest: true }` as the fallback, the fallback has to be a `User` — or you need a union type.

- **No transformation of the fallback.** It's returned as-is. No function call, no lazy evaluation. `orDefault(x, expensiveCompute())` runs `expensiveCompute()` unconditionally, even when `x` is defined. If you want laziness, wrap the fallback in a thunk and call it yourself.
- **Returns the fallback reference.** If the fallback is a mutable object, every call that hits the fallback returns the same object. Mutating it mutates the shared fallback. Use a factory if you need a fresh instance per call:

  ```ts
  orDefault(config, getDefaultConfig())   // same reference every call
  ```

- **No support for "empty" as missing.** `[]` is not nullish. `{}` is not nullish. If you want empty-as-missing, you'd need a different predicate, and this function isn't it.

#### `orDefault` vs alternatives

**`??` directly**

Identical behavior. `orDefault(x, y)` is `x ?? y`. The function is a name for the operator.

**`||`**

Different. `||` treats every falsy value as missing, `??` only treats `null` and `undefined`. If your values can legitimately be `0`, `""`, or `false`, use `orDefault`. If not, either works, but `orDefault` is safer against future values.

**`isDefined` + ternary**

```ts
isDefined(x) ? x : fallback
```

Same behavior, more syntax. `orDefault` is the value-producing version; `isDefined` is the guard version.

**`MaybePromise`**

Different job. `MaybePromise` is about sync/async uniformity. `orDefault` is about nullish replacement. They compose well:

```ts
const x = await MaybePromise(orDefault(maybeValue, default))
```

**`Lazy`**

Different job. `Lazy` is about deferring computation. `orDefault` is about picking between two existing values.

#### What this is *not*

- Not a validator. It doesn't check whether the fallback is "valid" or "meaningful."
- Not a lazy default. The fallback expression is evaluated before the call.
- Not a shallow-copy. The fallback reference is returned directly.
- Not a deep-default. It doesn't fill in nested nullish fields, only the top-level value.

---

## Philosophy

`??` is correct but nameless. `orDefault` gives it a name, pins the semantics to nullish-only (not falsy), and gives the codebase one place to change the policy if the definition of "missing" ever evolves. Same one-line implementation, better call site.

---

## License

MIT
