# `isDefined`

> A type guard that answers one question: is this thing neither `null` nor `undefined`? If yes, TypeScript narrows the type to remove both.

```ts
const xs: (number | null | undefined)[] = [1, null, 2, undefined, 3]
const defined = xs.filter(isDefined)   // number[]
```

That's the whole thing. It's the predicate you reach for when you want `.filter(Boolean)` but with correct types.

---

## Install

```bash
npm install is-defined
```

Or copy the one line. Zero dependencies.

---

## Usage

### 🟢 First-time users — start here

```ts
import { isDefined } from "is-defined"

isDefined(0)          // true
isDefined("")         // true
isDefined(false)      // true
isDefined(null)       // false
isDefined(undefined)  // false
```

That's it. You're done. You now know how to use `isDefined`.

The reason you'd use it instead of writing `x != null` inline is the filter case:

```ts
const values = [1, null, 2, undefined, 3].filter(isDefined)
// values: number[]
```

Without the type guard, TypeScript would keep `null | undefined` in the element type and you'd be stuck asserting.

### 🔵 Everyone else

#### Signature

```ts
const isDefined = <T>(x: T | null | undefined): x is T
```

It's a **type predicate** — `x is T` — which tells the compiler that a truthy return narrows `x` from `T | null | undefined` to just `T`. That narrowing is what makes `.filter(isDefined)` produce `T[]` instead of `(T | null | undefined)[]`.

#### Why `x != null` and not `x !== null && x !== undefined`

`!=` with `null` matches **both** `null` and `undefined` in one comparison. It's the only place in JS where loose equality is the correct, idiomatic choice — and linters that flag it universally are wrong about this specific case.

```ts
null      != null   // false
undefined != null   // false
0         != null   // true
""        != null   // true
false     != null   // true
NaN       != null   // true
```

So the predicate is `true` for every value that isn't `null` or `undefined`, including all the falsy-but-real values.

#### Why not `.filter(Boolean)`

`Boolean` is a valid filter predicate at runtime but it has no narrowing type signature. TypeScript sees `.filter(Boolean)` and keeps the original element type — you still have `null | undefined` in the array as far as the compiler is concerned. `isDefined` exists precisely to fix that.

```ts
const xs = [1, null, 2, undefined, 3]

xs.filter(Boolean)     // (number | null | undefined)[]  ← compiler disagrees with reality
xs.filter(isDefined)   // number[]                        ← correct
```

#### Common patterns

**Cleaning up arrays**

```ts
const users = raw.map(parseUser).filter(isDefined)
```

**Guard before a deref**

```ts
if (isDefined(maybeConfig)) {
  return maybeConfig.timeout   // narrowed — no `?.`, no `!`
}
```

**Object entries where values may be missing**

```ts
const entries = Object.entries(map).filter(([, v]) => isDefined(v))
```

**Type guard in a union check**

```ts
function process(x: string | null | undefined) {
  if (!isDefined(x)) return
  // x: string
}
```

#### What it accepts

- `null` → `false`
- `undefined` → `false`
- `0`, `""`, `false`, `NaN` → `true` (these are values, not absences)
- anything else → `true`

The distinction that matters: `isDefined` is about *presence*, not *truthiness*. `0` is defined. `""` is defined. Empty arrays are defined. Only the two nullish sentinels are "not defined."

#### Gotchas

- **Doesn't check properties.** `isDefined({ a: null })` is `true`. It's a top-level null check only.
- **`NaN` counts as defined.** If you want "not NaN," that's a different predicate.
- **Only useful with strict null checks on.** With `strictNullChecks: false`, the narrowing is a no-op and this is just `x != null`.
- **Narrowing requires a fresh binding in some cases.** `if (isDefined(obj.prop))` narrows `obj.prop` correctly in modern TS, but if `obj` is reassignable or `prop` is a getter, the narrowing won't hold. Bind to a local if the compiler complains.

#### What this is *not*

- Not `isTruthy`. `isDefined(0)` is `true`; `isTruthy(0)` would be `false`.
- Not `isNotNull` — that name would be misleading, since `undefined` also returns `false`.
- Not a deep check. It's exactly `x != null` with a type predicate attached.

---

## Philosophy

`.filter(Boolean)` has lied to TypeScript since the day it was written. `isDefined` is the one-line fix: same runtime behavior for the nullish case, correct types at the filter site, and a name that says what it actually checks — presence, not truthiness.

---

## License

MIT
