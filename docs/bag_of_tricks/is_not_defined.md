# `isNotDefined`

> Type guard for the nullish check. `false` when the value is neither `null` nor `undefined`; `true` when it's one of them. Pairs with `isDefined` as the inverted predicate.

```ts
const xs: (number | null | undefined)[] = [1, null, 2, undefined, 3]
const missing = xs.filter(isNotDefined)   // (null | undefined)[]
```

---

## Usage

### 🟢 First-time users — start here

```ts
import { isNotDefined } from "platform"

isNotDefined(0)          // false
isNotDefined("")         // false
isNotDefined(false)      // false
isNotDefined(null)       // true
isNotDefined(undefined)  // true
```

That's it. You're done.

The reason to use it instead of `x == null` inline is the filter case:

```ts
const missing = [1, null, 2, undefined, 3].filter(isNotDefined)
// missing: (null | undefined)[]
```

TypeScript keeps the narrowed element type instead of collapsing it, which is what you want when the nulls *are* the thing you're collecting.

### 🔵 Everyone else

#### Signature

```ts
const isNotDefined = <T>(v: T | null | undefined): v is T
```

A type predicate. Truthy return narrows the *positive* branch — but note the semantics are inverted from `isDefined`: this returns `true` when the value **is** nullish. The `v is T` predicate is what TypeScript attaches to the truthy case, which for this function is the "value is nullish" case. In practice you use it in `.filter` and in `if (!isNotDefined(x))` guards, where the narrowing lands where you want it.

#### Why `v != undefined` and not `v !== undefined && v !== null`

Same reason as `isDefined`: loose `!=` against either nullish sentinel matches both. `v != undefined` is `false` for every non-nullish value and `true` for `null` and `undefined`. One comparison, both cases.

```ts
null      != undefined   // false  → isNotDefined(null) === true
undefined != undefined   // false  → isNotDefined(undefined) === true
0         != undefined   // true   → isNotDefined(0) === false
""        != undefined   // true   → isNotDefined("") === false
false     != undefined   // true   → isNotDefined(false) === false
NaN       != undefined   // true   → isNotDefined(NaN) === false
```

Falsy-but-real values (`0`, `""`, `false`, `NaN`) are **defined**. Only the two sentinels are "not defined."

#### `isDefined` vs `isNotDefined`

They're exact inverses. Both do the same nullish check; they differ only in which side of the branch they return `true` on.

| Value | `isDefined` | `isNotDefined` |
| --- | --- | --- |
| `null` | `false` | `true` |
| `undefined` | `false` | `true` |
| `0` | `true` | `false` |
| `""` | `true` | `false` |
| `false` | `true` | `false` |
| `NaN` | `true` | `false` |
| `{}` | `true` | `false` |

Pick by what you're collecting or guarding against. `filter(isDefined)` keeps the real values. `filter(isNotDefined)` keeps the holes.

#### Common patterns

**Collect the missing entries**

```ts
const missingKeys = Object.entries(map)
  .filter(([, v]) => isNotDefined(v))
  .map(([k]) => k)
```

**Guard against absence with an early return**

```ts
function handle(x: string | null | undefined) {
  if (isNotDefined(x)) return
  // x: string
}
```

**Inverse filter for validation**

```ts
const invalid = rows.filter(r => isNotDefined(r.id))
```

#### Gotchas

- **The name reads backwards from the return value** if you're not used to it. `isNotDefined(x) === true` means `x` *is* nullish. It's "is not-defined," not "is not undefined." Read it as a single phrase.
- **Only top-level.** `isNotDefined({ a: null })` is `false`. The object is defined; a property isn't.
- **Only useful with `strictNullChecks` on.** Otherwise the narrowing is a no-op and this is just `v != undefined`.
- **Not a truthiness check.** `isNotDefined(0)` is `false`. If you meant "is falsy," that's a different predicate.

---

## Philosophy

Presence, not truthiness. `isNotDefined` and `isDefined` are the two directions of the same one-line nullish test, and between them they cover every place you'd otherwise write `x == null` and lose the type narrowing.

---

## License

MIT
