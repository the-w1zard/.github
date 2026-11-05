# `unreachable`

> A never-returning function for exhaustiveness checks. Call it in the `default` branch of a discriminated union switch, and TypeScript will fail compilation if a case is ever added without being handled.

```ts
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; s: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.r ** 2
    case "square": return shape.s ** 2
    default: return unreachable(shape)
  }
}
```

Add a `triangle` variant and the `default` branch stops compiling — because `shape` is no longer `never` there.

---

## Usage

### 🟢 First-time users — start here

```ts
import { unreachable } from "platform"

function label(status: "ok" | "warn" | "error"): string {
  switch (status) {
    case "ok": return "fine"
    case "warn": return "check"
    case "error": return "broken"
    default: return unreachable(status)
  }
}
```

That's it. You're done. You now know how to use `unreachable`.

Put it in the `default:` of every `switch` over a union. It compiles today. When someone adds a new variant to the union, the compiler tells them they missed a case. If somehow the code runs anyway (dynamic input, bad types, `any` leaking in), it throws with the offending value in the message.

### 🔵 Everyone else

#### Signature

```ts
const unreachable = (value: never): never
```

- Parameter is typed `never` — the type system's bottom type. Only values the compiler considers impossible can be passed.
- Return type is `never` — the function never returns normally. It throws.

The two `never`s do different jobs. The parameter `never` is what makes this an exhaustiveness check: it can only be satisfied when the compiler has nothing left. The return `never` is what makes the `default:` branch typecheck against a function that's declared to return `number` — a function that never returns is assignable anywhere.

#### Why it's a compile-time tool first

The runtime behavior is trivial — throw with a helpful message. The value is in the *type*:

```ts
type E = "a" | "b"

function f(e: E) {
  if (e === "a") return 1
  if (e === "b") return 2
  return unreachable(e)   // e: never — OK
}
```

Now add `"c"` to `E`:

```ts
type E = "a" | "b" | "c"
```

The `unreachable(e)` call fails to compile:

```
Argument of type 'string' is not assignable to parameter of type 'never'.
```

The compiler catches the missing case **before** the code runs. That's the whole reason this function exists.

#### Why it also throws at runtime

Types don't enforce reality at runtime. Data comes from JSON, from the network, from `any`-typed boundaries, from old versions of the app talking to new versions of the server. If a value that the types *said* couldn't happen shows up anyway, the function throws with the actual value in the message:

```
Unreachable value: "triangle"
```

That's a test failure, a crash, a logged incident — something that surfaces immediately instead of silently returning `undefined` or falling through to a wrong branch. Fast, loud failure over quiet corruption.

#### Common patterns

**Switch exhaustiveness**

```ts
switch (event.type) {
  case "click": return handleClick(event)
  case "keydown": return handleKeydown(event)
  default: return unreachable(event)
}
```

**If/else exhaustiveness**

```ts
if (x.kind === "a") { ... }
else if (x.kind === "b") { ... }
else { unreachable(x) }
```

**Nested unions**

```ts
function render(node: ASTNode): JSX.Element {
  switch (node.type) {
    case "text": return <span>{node.value}</span>
    case "element": return <div>{node.children.map(render)}</div>
    default: return unreachable(node)
  }
}
```

**As a return in a never-typed helper**

```ts
function assertNever(x: never): never { return unreachable(x) }
```

**Narrowing validation in parsers**

```ts
function parseKind(raw: string): Kind {
  if (isValidKind(raw)) return raw
  return unreachable(raw as never)  // deliberate — if we got here, our guard was wrong
}
```

(The cast to `never` is a way of saying "I know the compiler thinks this is impossible, but I don't trust it." Use it sparingly.)

#### Behavior

- **Always throws.** Always. No return path.
- **Message includes the value.** `Unreachable value: ${String(value)}`. For objects, `String({})` is `"[object Object]"`, so you won't see the shape — serialize explicitly if you need that.
- **Throws a plain `Error`.** Not a custom class. If you want a typed `UnreachableError`, wrap it.
- **Return type is `never`.** Assignable to any function's return type. Safe in expressions.

#### Gotchas

- **`String(value)` is weak on objects.** If the unexpected value is an object, you get `[object Object]` with no detail. For objects, `JSON.stringify` or a structured log is better. The default is fine for strings and primitives; for the richer case, consider a variant that `JSON.stringify`s.
- **Only catches when the type system is intact.** If the union is `any`, `unknown`, or leaked through a cast, `unreachable` accepts anything and throws only at runtime. The compile-time check is only as strong as the types around it.
- **`never` propagates.** A function that ends with `unreachable(x)` has return type `never`, which is assignable everywhere but also means TypeScript might treat code after it as unreachable. That's the point, but it can produce "unreachable code detected" warnings if you place something after it.
- **The value is captured by `String`.** If you threw a symbol or an object with a throwing `toString`, `String(value)` can throw a different error. Rare, but it means the error you see isn't always the one from `unreachable`.
- **Not a runtime validator.** This doesn't check that a value is a member of a union. It just fails when reached. If you need validation, that's a different function.

#### `assertNever` vs `unreachable`

The common name in the wild is `assertNever`. Functionally identical:

```ts
const assertNever = (x: never): never => { throw new Error(...) }
```

The name `unreachable` emphasizes "this code should not be reached." The name `assertNever` emphasizes "assert that this value is impossible." Same function, same behavior. `unreachable` reads better at the call site:

```ts
default: return unreachable(x)   // "we should never get here"
default: return assertNever(x)   // "assert this is never"
```

Either works. Pick one and use it consistently in a codebase.

---

## Philosophy

The compiler knows more about your union types than you do. `unreachable` is a way to hand that knowledge back to the compiler: put it in the last branch, and the compiler will fail the build the moment that branch stops being impossible. If the runtime ever disagrees with the compiler, it throws with the evidence. Exhaustiveness checked at compile time, defended at runtime.

---

## License

MIT
