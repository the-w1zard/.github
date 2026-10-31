# APP STORE

A lightweight, in-memory reactive store for Node.js with keyed subscriptions, global change listeners, async iteration, TTL expiration, promise-based waiting, and basic state management.

The store is implemented as a singleton instance, with the `Store` class also exported for creating independent instances.

## Features

- **Key-value storage** — Store and retrieve values using `set()`, `get()`, and `has()`.
- **Keyed subscriptions** — Listen for changes to a specific key.
- **Global subscriptions** — Listen for changes across all keys.
- **Async iteration** — Consume updates through `for await...of`.
- **Promise-based waiting** — Wait for a key to satisfy a predicate, change, or receive a value.
- **TTL expiration** — Automatically delete values after a specified duration.
- **AbortSignal support** — Cancel pending waits using an abort signal.
- **Timeout support** — Reject waits that exceed a specified duration.
- **Immediate subscriptions** — Receive the current value when subscribing, if one exists.
- **Freeze support** — Prevent further writes through `set()`.
- **Safe subscriber execution** — Subscriber exceptions are converted into process warnings rather than interrupting notification of other subscribers.
- **EventEmitter integration** — Emit a `change` event for store updates.

## Installation

Save the implementation as `store.js` and import it into your application.

```
const store = require('./store');
```

The default export is a shared store instance. The `Store` class is also available for creating independent stores.

```
const { Store } = require('./store');

const store = new Store();
```

## API

### `set(key, value, options?)`

Store a value under a key.

```
store.set('user', 'Alice');
store.set('count', 1);
```

An optional `ttl` specifies the number of milliseconds before the key is automatically deleted.

```
store.set('token', 'abc123', { ttl: 60_000 });
```

When the TTL expires, the key is deleted and subscribers are notified.

Returns the store instance, allowing chained writes.

```
store
  .set('user', 'Alice')
  .set('role', 'admin');
```

Throws an error if the store has been frozen.

### `get(key, fallback?)`

Retrieve a stored value.

```
store.get('user');
store.get('missing');
store.get('missing', 'Guest');
```

Returns `undefined` when the key does not exist and no fallback is provided. If a fallback is supplied, it is returned when the key is missing.

The fallback does not create or store the value.

### `has(key)`

Check whether a key exists.

```
store.has('user'); // true or false
```

This checks key existence rather than value truthiness, so a stored `undefined` value can still have an existing key.

### `delete(key)`

Delete a key and notify subscribers.

```
store.delete('user');
```

Returns `true` if the key existed and was deleted, or `false` if it did not exist.

Deleting a key also clears its associated TTL timer.

### `clear()`

Delete all stored values and notify subscribers for each existing key.

```
store.clear();
```

Clears associated TTL timers as well.

### `subscribe()`

Subscribe to changes using one of three supported forms.

#### Key-specific callback

```
const unsub = store.subscribe('user', (value, prev, key) => {
  console.log(`${key}:`, prev, '->', value);
});

store.set('user', 'Alice');
store.set('other', 1); // Does not trigger this subscription.

unsub();
```

The callback receives:

| Argument | Description                            |
| -------- | -------------------------------------- |
| `value`  | New value, or `undefined` when deleted |
| `prev`   | Previous value                         |
| `key`    | Changed key                            |

Returns an unsubscribe function.

#### Global callback

```
const unsub = store.subscribe((value, prev, key) => {
  console.log('Changed:', key, prev, '->', value);
});

store.set('user', 'Alice');
store.set('count', 1);

unsub();
```

A global subscription receives changes for every key.

#### Immediate callback subscription

```
const unsub = store.subscribe(
  'user',
  (value, prev, key) => {
    console.log(value);
  },
  { immediate: true }
);
```

When the key already exists, its current value is delivered asynchronously through `queueMicrotask()`. The previous value is `undefined`.

If the key does not exist when subscribing, no initial callback is scheduled.

### Async iterator subscription

Subscribe to a key and consume its updates using `for await...of`.

```
for await (const value of store.subscribe('token')) {
  await refreshWith(value);

  if (value === 'stop') break;
}
```

The iterator yields new values as the key changes. Breaking out of the loop triggers cleanup through the generator's `finally` block.

To receive the current value before subsequent updates, enable `immediate`:

```
for await (const value of store.subscribe('token', {
  immediate: true
})) {
  await refreshWith(value);

  if (value === 'stop') break;
}
```

The initial value is yielded only if the key exists when the iterator begins execution.

The iterator buffers updates so that multiple changes can accumulate while the consumer is processing an earlier value.

### `wait(key, options?)`

Wait for a key to satisfy a condition and return a promise that resolves with its value.

```
const value = await store.wait('token');
```

By default, `wait()` resolves immediately if the key already exists. Otherwise, it waits for a matching change.

Options:

| Option                   | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `predicate(value, prev)` | Determines whether a value satisfies the wait condition    |
| `timeout`                | Maximum wait duration in milliseconds                      |
| `immediate`              | Check the current value before waiting; defaults to `true` |
| `signal`                 | An `AbortSignal` that can cancel the wait                  |

#### Wait for a matching value

```
const count = await store.wait('count', {
  predicate: value => value >= 10
});
```

The promise resolves when the predicate passes.

#### Wait with a timeout

```
try {
  const token = await store.wait('token', {
    timeout: 5000
  });
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.log('Wait timed out');
  }
}
```

The timeout rejects the promise with a `TimeoutError`.

#### Cancel a wait

```
const controller = new AbortController();

const pending = store.wait('token', {
  signal: controller.signal
});

controller.abort();

try {
  await pending;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Wait cancelled');
  }
}
```

Aborting a pending wait rejects it with an `AbortError` and cleans up its registered waiter and associated listeners.

### `waitChange(key, options?)`

Wait for a subsequent change, ignoring the current value.

```
const nextValue = await store.waitChange('status');
```

Accepts the same options as `wait()`, except that `immediate` is forced to `false`.

### `waitFor(key, predicate, options?)`

A convenience method for waiting until a predicate passes.

```
const ready = await store.waitFor(
  'status',
  value => value === 'ready',
  { timeout: 10_000 }
);
```

Accepts the same options as `wait()`, with the predicate supplied as the second argument.

### `toJSON()`

Return a plain object containing the store's current entries.

```
const snapshot = store.toJSON();
```

Useful for inspection, serialization, and creating snapshots of the current state.

Only the stored entries are included; subscriptions, timers, waiters, and other internal state are excluded.

### `freeze()`

Prevent future calls to `set()`.

```
store.freeze();

store.set('user', 'Alice'); // Throws: Store is frozen
```

Freezing does not prevent reads, subscriptions, deletions, or clearing the store. It is a write guard for `set()`, not a complete immutable-state mechanism.

## Change notifications

Successful writes and deletions notify matching subscribers and emit a `change` event.

```
store.on('change', ({ key, value, prev }) => {
  console.log(key, prev, '->', value);
});
```

The event payload contains:

| Property | Description                           |
| -------- | ------------------------------------- |
| `key`    | Changed key                           |
| `value`  | New value, or `undefined` on deletion |
| `prev`   | Previous value                        |

Setting a key notifies subscribers even if the new value is equal to the previous value. Deleting a nonexistent key produces no notification.

Subscriber callbacks are invoked safely: if one throws, the error is reported through `process.emitWarning()` and notification can continue to other subscribers.

## TTL behavior

TTL is configured per write.

```
store.set('session', { userId: 42 }, {
  ttl: 30 * 60 * 1000
});
```

Writing to a key with an existing TTL clears its previous timer. A new TTL is installed only when a truthy `ttl` is provided.

When a TTL expires, the store deletes the key and notifies subscribers if the key still exists.

TTL timers use `unref()`, so they do not independently keep the Node.js process alive.

## Example: Coordinating asynchronous work

```
const store = require('./store');

async function waitForConnection() {
  return store.waitFor(
    'connection',
    value => value === 'connected',
    { timeout: 10_000 }
  );
}

async function start() {
  const connection = await waitForConnection();

  console.log('Connection state:', connection);
}

start().catch(console.error);

// Elsewhere in the application:
store.set('connection', 'connected');
```

This allows independent parts of an application to coordinate through shared state without repeatedly polling for updates.

## Design notes

- **In-memory only:** Values are not persisted across process restarts.
- **Singleton by default:** Modules importing the default export share the same store instance.
- **Independent instances:** Use `new Store()` when isolated state is required.
- **Key identity:** The underlying `Map` supports arbitrary key types, although some method signatures use strings for convenience.
- **No equality filtering:** Writes trigger notifications even when values have not changed.
- **TTL scope:** Expiration is managed per key and is not a general-purpose scheduling system.

## License

Add the license applicable to your project.

Clarify the CommonJS Export ShapeDocument Clear and Freeze Return Values
