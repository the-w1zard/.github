# `executor`

> Serial task queue. Enqueue async functions; they run one at a time, in order, each waiting for the previous to settle before starting. Returns a promise for each task's own result, so callers get their value back normally.

```ts
const ex = executor()

ex.enqueue(() => fetch("/a"))   // runs first
ex.enqueue(() => fetch("/b"))   // runs after /a settles
ex.enqueue(() => fetch("/c"))   // runs after /b settles
```

The point: every task sees a clean world where no other task is running. No interleaving. No shared-state races between tasks. Order is guaranteed.

---

## Usage

### 🟢 First-time users — start here

```ts
import { executor } from "platform"

const ex = executor()

const a = await ex.enqueue(() => doTaskA())
const b = await ex.enqueue(() => doTaskB())
```

That's it. You're done. You now know how to use `executor`.

The `.enqueue(fn)` call returns a promise for that task's result. `fn` is a thunk — pass `() => something()`, not `something()`. Tasks run one after another in the order they were enqueued. The first task starts immediately; every subsequent one waits for the previous to settle (resolve *or* reject).

Errors from one task do not stop the queue. The next task still runs.

### 🔵 Everyone else

#### API

```ts
function executor(): {
  enqueue<T>(fn: () => Promise<T>): Promise<T>
  readonly idle: Promise<void>
}
```

- **`enqueue(fn)`** — schedules `fn` to run after all previously enqueued tasks have settled. Returns a promise that resolves or rejects with `fn`'s own result.
- **`idle`** — a promise that resolves when the queue is empty. `await ex.idle` waits for everything currently enqueued to finish.

#### How it works

The whole class is three lines of logic:

```ts
private chain: Promise<void> = Promise.resolve()

enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = this.chain.then(fn)
  this.chain = run.then(() => undefined, () => undefined)
  return run
}

get idle(): Promise<void> { return this.chain }
```

1. **`this.chain`** is a promise that represents "everything enqueued so far." It starts resolved, so the first task runs immediately.
2. **`run = this.chain.then(fn)`** — schedule `fn` to run once `this.chain` settles. `run` is the task's own promise; the caller gets it back.
3. **`this.chain = run.then(() => undefined, () => undefined)`** — replace the chain with a version of `run` that swallows errors. This is the important line: whether `fn` resolves or rejects, the *chain* moves on. The next task doesn't care whether this one failed.
4. **`return run`** — the caller sees `fn`'s actual result or rejection. The chain saw only "settled."

The asymmetry between `run` and `this.chain` is the whole design. The queue is defined by *when* tasks settle, not by *whether* they succeed. Errors are the caller's problem; the queue's job is just ordering.

#### Why the error-swallowing matters

Without `run.then(() => undefined, () => undefined)`, this would happen:

```ts
// hypothetical wrong version
this.chain = run
```

If a task rejects, `this.chain` becomes a rejected promise. The next `this.chain.then(fn)` would skip `fn` and propagate the rejection — the queue would be permanently broken. Every task after the first failure would silently not run.

The real implementation catches both branches and returns `undefined`, so `this.chain` always resolves. The queue never breaks, no matter how many tasks fail.

#### Why "serial" matters

Concurrent async work interleaves at every `await`. If two tasks both read-modify-write shared state, they'll race even in a single-threaded runtime — because between one task's `await a()` and its `await b()`, another task can run. Serial execution removes the interleaving. Each task runs to completion (through all its awaits) before the next starts.

This is what you want when:

- Tasks share mutable state that isn't safe under interleaving.
- Tasks must observe each other's effects (task B needs to see task A's writes).
- Order of side effects matters (network calls, file writes, event emissions).
- You want the simplest possible concurrency model: one thing at a time.

#### Common patterns

**Serialized writes to a shared resource**

```ts
const writer = executor()

async function save(doc: Doc) {
  return writer.enqueue(async () => {
    await fs.writeFile(path, serialize(doc))
    await fs.fsync(fd)
  })
}
```

No two writes interleave. No torn files.

**Ordered network requests**

```ts
const net = executor()

for (const id of ids) {
  net.enqueue(() => fetchAndStore(id))
}
```

Requests go out one at a time, in the order of `ids`.

**Draining before shutdown**

```ts
await ex.idle
// all queued tasks have settled
```

**Rate-limited external calls**

```ts
const api = executor()

api.enqueue(async () => {
  await call()
  await sleep(1000)   // serialized, so this is the actual gap between calls
})
```

Because tasks are serial, the `sleep` inside one task creates a real gap before the next.

**Test harness — deterministic ordering**

```ts
const setup = executor()
setup.enqueue(() => migrateDb())
setup.enqueue(() => seedData())
setup.enqueue(() => startServer())
await setup.idle
```

#### Behavior

- **FIFO order.** Tasks run in enqueue order.
- **One at a time.** A task starts only after the previous one settles.
- **Errors don't break the queue.** A rejected task still lets the next one run.
- **Caller sees the real result.** `run` is the promise that resolves or rejects with `fn`'s value. The queue's internal bookkeeping never interferes with what the caller receives.
- **`idle` is a snapshot.** It resolves when the queue as-of-now is drained. Tasks enqueued after you access `idle` aren't included. If you want to keep draining, re-read `idle` after each round.
- **First task runs immediately.** `this.chain` starts as `Promise.resolve()`, so the first `.enqueue` schedules `fn` on the next microtask, not after any delay.
- **No concurrency limit** beyond `1`. This is a strictly serial queue, not a pool.

#### Gotchas

- **`fn` must return a promise.** If you pass a synchronous function, `this.chain.then(fn)` will still work — the result of a `.then` is always a promise — but you're using the wrong tool. Serialization is about async boundaries; sync functions don't need it.
- **`fn` must be a thunk.** Pass `() => doThing()`, not `doThing()`. Passing a value or a promise causes `this.chain.then(...)` to resolve immediately with that value, and your task doesn't run inside the queue where you intended.
- **No cancellation.** Once enqueued, a task will run when its turn comes. If you need to cancel, check a flag inside the task.
- **No priority.** Enqueue order is the only order. If you need priorities, build a different queue.
- **No backpressure.** You can enqueue a million tasks; they'll sit in the promise chain. The memory cost is one closure per task.
- **`idle` doesn't wait for future enqueues.** If you `await ex.idle` and then something else enqueues a task, the new task isn't included. Read `idle` again for the new state.
- **Unhandled rejections.** If a caller enqueues a task and never attaches a `.catch` to the returned promise, that rejection becomes an unhandled rejection. The queue itself is fine (it swallows errors on its own chain), but the caller's `run` promise is still live and rejects.
- **A long task blocks the queue.** There's no timeout, no preemption. If one task hangs, every task after it waits.
- **`enqueue` is not `async`.** It returns `run` synchronously. You can enqueue from non-async contexts.

#### What this is *not*

- Not a worker pool. It runs everything on the same thread, serially. No parallelism.
- Not a rate limiter. It doesn't insert delays. Serialization is a side effect — a fast task runs fast, a slow task makes everything after it slow.
- Not a retry queue. A failing task fails; the queue moves on.
- Not a scheduler. No priorities, no fairness, no cancellation.
- Not a replacement for `useEffect` cleanup or React's batching. Different problem, different tool.

---

## Philosophy

Concurrent async work interleaves at every `await`, and every shared-state bug in async code comes from that interleaving. A serial executor removes the interleaving: one task at a time, in order, each observing a world that no other task is touching. The promise chain *is* the queue — no data structure, no scheduler, no events. Enqueue, get your result, don't worry about what else is running, because nothing else is.

---

## License

MIT
