# `callIf`

> Call a function only if a condition is truthy. Return the result, or `undefined`. That's the whole thing.

A tiny utility for the extremely common pattern of "evaluate this expression only if this other thing is true." Instead of writing `cond ? fn() : undefined` inline — which is fine but noisy, gets nested badly, and evaluates the condition twice if you're not careful — you write `callIf(cond, fn)`. It's the smallest possible ternary helper, and it composes.

---

## Install

```bash
npm install call-if
```

Or copy the function into your codebase. It's one line and has zero dependencies. This is a legitimate way to use it.

---

## Usage

### 🟢 First-time users — start here

The absolute minimum to get this working in under 5 minutes:

```ts
import { callIf } from "call-if"

callIf(true,  () => "yes")   // "yes"
callIf(false, () => "yes")   // undefined
callIf(0,     () => "yes")   // undefined (falsy)
callIf("x",   () => "yes")   // "yes"   (truthy)
```

That's it. You're done. You now know how to use `callIf`.

If you want the real-world version, here it is:

```ts
import { callIf } from "call-if"

const user = getUser()
const greeting = callIf(user?.isActive, () => `Welcome back, ${user.name}!`)
```

When the user is active, you get the greeting. When they're not, you get `undefined` and never touch `user.name` — which matters if `user` is `null`.

### 🔵 Everyone else — the full picture

#### The API

```ts
function callIf<T>(condition: any, fn: () => T): T | undefined
```

- **`condition`** — any value. Evaluated for truthiness with standard JS semantics (`false`, `0`, `""`, `null`, `undefined`, `NaN` are falsy; everything else is truthy). Typed as `any` on purpose so you can pass optional chains, boolean expressions, nullable values, whatever — without fighting the compiler.
- **`fn`** — a thunk. A zero-argument function that computes the value. It is only invoked if `condition` is truthy.
- **Returns** — the result of `fn()` if `condition` is truthy, otherwise `undefined`. The return type is `T | undefined`.

#### Why a thunk, not a value

You pass `() => computeTheThing()`, not `computeTheThing()`. This is the entire point. The function body is never evaluated unless the condition passes. If you pass a value, you've already paid the cost — including any side effects, null derefs, or expensive computation — before `callIf` even runs.

```ts
// ✅ lazy — fn() only runs when user is non-null
callIf(user, () => user.name)

// ❌ eager — this throws before callIf sees it
callIf(user, user.name)  // not even valid; user.name evaluated up front
```

#### Narrowing doesn't happen — plan for it

TypeScript cannot narrow types through `callIf`. The signature takes `condition: any` and returns `T | undefined`, so the compiler does not know that inside `fn`, the condition was true. If you need narrowing, do it yourself:

```ts
callIf(user, () => {
  // user is still `User | null` here as far as TS is concerned
  return user!.name
})
```

For cases where narrowing matters more than terseness, a plain `if` is still the right tool. `callIf` is for when the result *is* the point, not the narrowing.

#### Comparisons

```ts
// Ternary
cond ? fn() : undefined

// Boolean AND
cond && fn()   // ← returns `false` / `0` / `""` when cond is falsy, not `undefined`

// callIf
callIf(cond, fn)
```

The difference between `callIf` and `&&` is the falsy return value. `false && x()` gives you `false`; `callIf(false, x)` gives you `undefined`. When you're building an object or JSON payload, `undefined` disappears during serialization while `false` does not. That difference bites people in real code.

```ts
const payload = {
  name: user.name,
  nickname: callIf(user.hasNickname, () => user.nickname),
}
// JSON.stringify drops `nickname` entirely when the condition is false.
// With `&&` you'd get `"nickname": false` in your payload. Oops.
```

#### Common patterns

**Optional fields in an object literal**

```ts
const options = {
  retries: callIf(config.retries, () => config.retries),
  timeout: callIf(config.timeout, () => config.timeout),
}
```

**Conditional rendering in a React-ish render function**

```tsx
{callIf(user.isAdmin, () => <AdminPanel />)}
```

**Guard against null deref without an early return**

```ts
const name = callIf(session?.user, () => session.user.profile.displayName)
```

**Chain of optional values**

```ts
const label = callIf(row, () =>
  callIf(row.cell, () =>
    row.cell.text
  )
)
```

(The nesting is ugly here, but the point is each level only evaluates if the previous one passed.)

#### Gotchas

- **`fn` is not async-aware.** If `fn` returns a Promise, you get `Promise<T> | undefined`, which is awkward to await. Wrap it: `await callIf(cond, async () => ...)` gives you `T | undefined` but the top-level `await` on a possibly-`undefined` value still needs a guard. There's no `callIfAsync` here by design — compose it yourself.
- **Truthiness is JS truthiness.** `callIf([], fn)` runs `fn`, because `[]` is truthy. `callIf("0", fn)` runs `fn`. If you want a strict boolean, pass one: `callIf(Boolean(cond), fn)`.
- **`condition: any` will let you write things TypeScript wouldn't normally allow.** That's the tradeoff. It's on you to make sure the condition is actually meaningful.
- **Zero is falsy.** `callIf(0, () => "zero")` returns `undefined`. If `0` is a valid trigger value, this is the wrong tool.

#### What this is *not*

- Not `lodash.get`. It doesn't walk paths; it just gates a thunk.
- Not `optional-chaining`. `user?.name` is a language feature and handles a narrow case. `callIf` handles arbitrary conditions and lazy computation.
- Not a control-flow tool. If you have side effects you care about, use `if`. `callIf` is for producing a value, not for orchestrating behavior.

---

## Philosophy

`cond ? fn() : undefined` is a perfectly good expression. `callIf` just gives it a name, so the intent is visible at the call site and the condition is evaluated exactly once. Use it wherever you'd otherwise reach for `&&` and then have to explain why the falsy branch isn't what you expected.

---

## License

MIT
