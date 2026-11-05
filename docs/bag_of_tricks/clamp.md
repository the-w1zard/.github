# `clamp`

> Constrain a number to a range. One line. Returns `value` if it's already inside `[min, max]`, otherwise returns the nearest bound.

```ts
clamp(5, 0, 10)     // 5
clamp(-3, 0, 10)    // 0
clamp(42, 0, 10)    // 10
```

That's the entire thing. Nothing else to know.

---

## Install

```bash
npm install clamp
```

Or copy the one line. Zero dependencies.

---

## Usage

### 🟢 First-time users — start here

```ts
import { clamp } from "clamp"

clamp(5, 0, 10)      // 5
clamp(-100, 0, 10)   // 0
clamp(100, 0, 10)    // 10
```

That's it. You're done. You now know how to use `clamp`.

Real use:

```ts
const volume = clamp(userInput, 0, 1)          // normalize to 0–1
const age = clamp(parseInt(input), 18, 120)    // enforce bounds
const opacity = clamp(alpha, 0, 255)           // byte range
```

### 🔵 Everyone else

#### Signature

```ts
const clamp = (value: number, min: number, max: number): number
```

- `value` — the number to constrain.
- `min` — lower bound (inclusive).
- `max` — upper bound (inclusive).
- Returns `value` if `min <= value <= max`, otherwise `min` or `max`, whichever is nearer.

#### How it works

```ts
Math.min(max, Math.max(min, value))
```

`Math.max(min, value)` floors the value at `min`. `Math.min(max, …)` caps it at `max`. Composed, they produce the constrained result in a single expression with no branches.

#### Behavior notes

- **Bounds are inclusive.** `clamp(0, 0, 10)` is `0`. `clamp(10, 0, 10)` is `10`. Nothing is off-by-one.
- **`min > max` is not guarded.** If you pass `clamp(5, 10, 0)`, you get `0` — `Math.max(10, 5)` is `10`, then `Math.min(0, 10)` is `0`. The function assumes `min <= max`. It doesn't validate, doesn't throw, doesn't swap. Garbage in, garbage out, fast.
- **`NaN` propagates.** `clamp(NaN, 0, 10)` is `NaN`. `Math.max` and `Math.min` both return `NaN` if any argument is `NaN`.
- **`Infinity` works as a bound.** `clamp(x, -Infinity, Infinity)` returns `x`. Useful for optional bounds.
- **Integers aren't enforced.** `clamp(3.7, 0, 10)` is `3.7`. This clamps, it doesn't round.

#### Common patterns

**Normalizing user input**

```ts
const level = clamp(parseInt(raw), 1, 100)
```

**Clamping RGB / alpha channels**

```ts
const r = clamp(channel, 0, 255)
```

**Animation progress**

```ts
const t = clamp((now - start) / duration, 0, 1)
```

**Camera / scroll limits**

```ts
scrollY = clamp(scrollY, 0, maxScroll)
```

**Enforcing a range after arithmetic**

```ts
const health = clamp(health - damage + heal, 0, maxHealth)
```

#### Gotchas

- No argument validation. `min > max` gives a surprising result rather than an error.
- Does not coerce. Pass numbers. `clamp("5", 0, 10)` will produce `"5"` via `Math.max`'s implicit coercion — don't rely on it.
- Not variadic. Exactly three arguments.

---

## License

MIT
