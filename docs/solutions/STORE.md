<h3 style="font-size:26px;">Store: <span style="font-size:16px;" >Bringing the modules together as one.</span></h3>


<p align="RIGHT"><em>The most opinionated platform... ever.</em></p>
<p align="RIGHT"><em>Trust me... I'm a fucking wizard... 🧙</em></p>


<div style="display: grid; grid-template-columns: 4fr 2fr; gap: 20px;">
<div>



> [!important] A Quick Note / TLDR
>
> This solution solves more than several problems, but I ended up packaging it as a single module due to the fact of where I wanted it placed. 
>
> Instead of installing some MASSIVE solution, spending weeks configuring and all the other fucking stupid chores they make you do...
>
> Instead this is meant to drop in... and simply... fucking use it.
>
> While it appears small in size, when comparing to what it actually offers in comparison to other solutions. This is a solution that hits way above its weight class. For good reason...
>
> This can either be used in one of 2 places.
> 1. If you import the default export, 'Store', you are using a instance that is globally shared among all of your node modules. If you create modules, there are times where you simply need to share values... this, VERY EASILY, lets you do that in secs with zero configuration. 
> 2. If you import the named export, then this allows you to create YOUR OWN unique instances where ever you need them.
>
> If offers:
> 1. two different kinds of state solutions, for difference use cases. One that is a tripled tiered scope format while the other is a more simple single tiered scope format.
> 2. A huge array of fns for ALL your import / module / comp / resource needs... Need to defer the execution of something because what it requires... isnt ready yet? 
> 3. Apparations allow you to create... perfectly typed 'nothings' ie an apparation, where not it makes typescript happy... BUT ALSO the component / fn that requested in the first place. The end result, no error thrown!
>
> There is quite a bit more within this readme, but I do want to come forward with one thing. 
>
> The type of coding this is geared towards... Will most likely put you out of your comfort zone if you use anything past the state solutions. This is because everything except the state solutions has been coded... plainly put, in very offensively coding type of way...
>
> If you cluctch your if's and else's close to your chest and check if this thing is the thing and all that, fucking garbage... thats defensive coding... The total opposite of what you are used to if you have never ventured to the dark side. 
> 
> If you are willing to dip a toe or two to see if the dark side is your cup of tea... BE WARNED... it is addicting... it just... hits different, you won't know what I mean till you try it, WHICH I SUGGEST YOU DO. As I find this type of coding to be... more fruitful, and more effecient, among other things, than its defensive counterpart.
>
> BUT this was a warning because for some of you, this will make you feel reaaaaallll uneasy about the code you write, lol, as the dark arts... they're not practiced by many, and the ones who do... never go back...
>
> To demonstrate... the power of the dark side... and not only show you the power it holds over your code, bundlers and even runtimes... it is also a fucking... genuinly fun time... 
>
> This first part is actually within the solution, which is the reason why I'm using it and if I let an AI explain, it will NOT get it right in any capacity... I will only go over one of the two uses that I have uncovered for it, to read more go to its specific docs.

You cannot look at this from any other perspective than... improving the ux. Because when you look at it, especially at first, in any other manner... it simply should not work. Below is the actual maybe promise fn.

```ts
export type MaybePromise<R = any> = R;
export function MaybePromise<R = any>(v: R): MaybePromise {
  return v !== undefined ? v as R : Promise.resolve(v) as Promise<R>
}
```

## THE TYPESCRIPT PRANK WARS... CONTINUES...

> [!IMPORTANT] First time round, we pulled a fast one on javascripts runtime... NOW... its typescripts turn...
>
> Because of maybe promise...
> 1. we have increased ergonomics at each of our defined call sites.
> 2. we have entirely removed the need/requirement to build and manange an entirely second api for solutions, as this places both async and sync javascript runtime contracts... and placing them with in a single function, WHILE AT THE SAME TIME... with a 100% sucess rate, no errors, no weirdness, and even increased performance as a side effect, we wil be coming back to this part shortly.
> 3. less of a mental / context load of what to use, when to use it and which piece to use in relation to where it ends up being defined
> 4. exploits a very small gap in javascripts runtime, which in effect leads to even more benefits but you can read more on this down below...
>
> This note... is related to an entirely... differently problem that this same exploit also solves. And let me tell you, it solves it in such a gratifying way...
> 
> Picture this, ya?... You don't have the most surface area to paly with in terms of code placement where you are... In addition to THAT problem, you don't have any possible way... of placing, exactly what it is that you need here due to the contract around the function body your currently coding inside of... doesn't happen often, when you get this stuck and your stumped... staring at it, if only I could use x... welllllll...
>
> [ME] 'Oh... would you look at that...' *stares at the ground over yonder real hard...*
>
> [typescript] 'Look... look at what?... I don't see anything, you know I LITEREALLY... cannot fall for that, right? My contracts are so wound up... they are tighter than... ALL the nuns assholes...'
>
> [ME] *stares at it harder... sees a twitch from typescript... slowly I lift my arm, 'over there... you don't see it... what's wrong with you old man, getting too damn old eh? It IS pretty obvious, its RIGHT there...' Points at the 'thing' even harder.*
>
> [typescript] *takes a real good look at you... staring you down..., 'As I said, don't be trying any of that funny businesss, you hear me?'*
>
> [ME] 'What are you so paranoid about old man?... you said it yourself, your asshole is to wound up to get anything past you...' *turns real hard to look at the same spot again... I just simpy don't move, finally typescript inches closer to get a better look at, whatever it is that your fucking staring at... and just... just when he inches JUST ENOUGH by you, like the flash you pivot and bolt, yeling behind ya, 'HA... YOINK BITCH!'
>
> [typescript] *starts to try to run after you, but is a feeble old man..., 'GET BACK HERE, YOU GOD DAMN SON OF A BITCH...'
>
> Literally... it is... almost entirely like that... it is so satisfying, lol...
>
> Let's take my weird bus as the example since that is where I ended up finding my new prank on typescript. 
> 
> Looking at it... there is no possible way for this function... to meet the requirements of maybe promise and satisfy what it needs, in order for it to truly work. First of all... we only have... A SINGLE ASYNC FUNCTION. How the fuck are we going to get typescript in letting us... basically... some fucking how... squeeze enough lemon out of this desert rock... to make enough juice... that is the sweetness that is, sync functionality.

```tsx
public async send(p: unknown, k: string, sl = this.sl, ms = this.ms, rt = this.rt, ttl?: number, binary = false): Promise<unknown> {
  const msgId = `[${rt}][${ms}][${sl}][${k}][${this._staffId()}]`.replace(/[.\[\]]/g, match => match === '.' ? '_' : '');
  const msg: CSE_Multiplexed_Msg = {
    id: msgId,
    rt,
    ms: ms,
    sl: sl,
    k: k,
    p: { p },
    ttl,
    ts: Date.now(),
    _ack: false,
    priority: this.defaultPriority,
    binary
  }

  if (!(await this.runBeforeSend(msg))) return { success: false, blocked: true }
  const result = await this.dispatch(msg)
  await this.runAfterSend(msg, result)
  return result
}
```
> [!IMPORTANT] 
>
> Haha... there IS NOTHING SYNC ABOUT IT... YOU COULD NOT FIND A MORE ASYNC LIKE FUNCTION THAN THAT. It literally has 100% coversage, that is entirely async. The ONLY things that AREN'T... are literally the console.logging functions that are the dev events...
>
> BUT HEY... We can NOW, define the call site... as if it were a sync function, pulling a fast, and hard one on typescript. 
>
> Because... boi is it fucking cheeky on how we pull this off. AND BTW... it passes the test suite... 100% through and through. Which means, it is rock solid in terms of what we can expect from it in terms of results, whenever we use it.
>
> What's the cheeky, immature... prank that we pulled on typescript to get what we want?

```tsx
public send<T = A>(p: U, k: S, s = this.s, m = this.m, r = this.r, chain?: CHAIN, adapter = "disruptor") {
	const msgId = this._byteid();
	const msg: SIG_BUS_Message = { id: msgId, rt: r, ms: m, sl: s, k: k, p: { p }, ts: Date.now(), _ack: false };

	let v: MaybePromise = this.DISPATCH(msg, adapter);
	if (v !== undefined && !(v instanceof Promise)) {
		return MCR_Combo(v, chain);
	} else {
		const timeoutMs = 5000 
		return MaybePromise(
			(() => {
				return new Promise<T>((resolve, reject) => {
					let timer: RET<typeof setTimeout> | UD;
					if (v) {
						if (timer) clearTimeout(timer);
							resolve(v as T);
							return;
						}
						if (timeoutMs) {
							timer = setTimeout(() => {
								reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`));
							}, timeoutMs);
						}
					});
				})(),
			);
		}
	}
```
> [!IMPORTANT] 
>
> You would be 100% correct in saying, 'but dude... it... IS an async fn... that will never work...'
>
> JUST LIKE with maybe prommise, trust me, I'm a fucking wizard... and hear me out...
>
> Yes it is 100% through and through a async fn, AND becuuse of the level of benefits we get from this singular async fn, it will never change.
>
> BUT in terms of what typescript CAN ACTUALLY SEE there is nothing wrong with this picture.
>
> The promise is locked behind a logic gate, in effect making typescript none the wiser that there is IN FACT A FUCKING PROMISE CONTRACT HIDDEN THERE.
>
> NOW, if you guessed that WE ARE LITERALLY DOING WHAT I USED IN THAT REDICULOUS EXAMPLE, you are correct. 
>
> There is 100% going to be times where, we simply only need a fire and forget... without await attached to it, so by giving typescript something to focus on, a big fat lie, but that's ok. When we use it like this, we don't really care if we get the value back, there will be times we don't even want it back so, it is as if we are sacrifcing a constant that we assigned... for the greater good.
>
> As you will notice, the logic gate changed ever so slightly... SOMETHING TO WATCH OUT FOR HERE, for all you 'any' haters out there, you HAVE TO... define that let, with any, because that logic gate, as it sits... will not let you run it without it. Actually, you could ACTUALLY stick maybe promise there too... 
>
> The gate checks to see IF it is NOT undefined... which ofcourse 100% of the time... this logic gate will fail due to the second condition since dispatch returns a promise 100% of the time... Effectively turning the gate AND the value, as a herring to succesfully and entirely distract typescript with a lie. Letting us execute the fn and take off running and the message gets to where you sent it... meanwhile, your herring is left stuck there returned with, what is most of the time, a shit fucking value to hold. But this time we welcome the returned promise... thank-you javascript, for teeing us up to fake out typescript. *gives a good ol'thumbs up* haha
>
> Removes the sync/async decision entirely. One name, one function, one return. Works as both a type and a value. Callers `await` if they want the value and don't if they don't — both work, always. Every platform that ships `readFile` *and* `readFileSync`, `getItem` *and* `getItemAsync`, `query` *and* `querySync` can ship one function instead.


OH... and if you were wondering about the title, 'the typescript prank wars continues'... this is not the only thing that... let me put it this way... I fucking come up on typescript soooo hard... and at the last second deek grandpa out so bad... his legs just tie up into a knot and lands face first, THWAP... hits the ground. If you hate typescript, like me, you will find lots of great things you can place into your toolkit to flip it off while you code at work all day long.


---

## 1. The design in one picture

There are two closely related ways to use the shared memory:

| Surface | What it represents | Main purpose |
|---|---|---|
| `store` methods | A conventional keyed value store | Publish, retrieve, mutate, observe, and wait for values |
| `store.state` | A namespaced reactive state store | Keep independent state domains under root/master/slave addresses |
| `store.maelstrom.rift` | A registry of named readiness/value slots | Coordinate modules around values or modules that may not exist yet |
| `store.maelstrom.waiter` | Subscriptions over one or more named slots | Run when one signal, or all requested signals, have arrived |
| `store.maelstrom.defer` | Dependency-aware task scheduler | Run work when all named dependencies are available |
| `store.maelstrom.module` | Module resolution and export lookup | Load, cache, inspect, and retrieve modules through the same named-entry mechanism |

The distinction between the two primary state surfaces matters:

- `store.set/get/subscribe/wait` operates on the store's ordinary private key/value data.
- `store.state.get/set/subscribe` operates on an addressable namespace selected by `globalKey`, `ms_reg`, and `sl_reg`.
- `store.maelstrom.rift(...)` operates on named readiness slots in the single `#rifts` registry.

They are complementary, not interchangeable APIs. Use the surface that matches the kind of coordination being performed.

### The intended sharing boundary

The exported default is one live `Store` instance:

```ts
export { Store };
export default new Store();
```

When Node modules resolve and import the same installed package instance, they receive the same default export and therefore the same in-process store. A module can contribute to the namespace without owning a separate store.

This is in-process sharing. It does not, by itself, make JavaScript objects shared across separate Node processes, worker isolates, browser tabs, or machines. Those environments require an explicit transport or adapter; environment detection can identify some capabilities, but detection alone does not turn this in-memory store into cross-process shared memory.

Also, two physically duplicated installations of the package can produce two module instances and therefore two default stores. The shared-store property depends on consumers resolving the same package instance.

---

## 2. The central idea: shared namespace, not module ownership

A module should not have to own the data it contributes. It can publish a value under a known key and let any other participant access it.

For example:

```ts
// module A
import store from "@the-w1zard/maelstrom";

store.set("runtime:ready", true);
store.set("runtime:version", "1.0.0");
```

```ts
// module B — same package instance
import store from "@the-w1zard/maelstrom";

const ready = store.get<boolean>("runtime:ready");
const version = store.get<string>("runtime:version");
```

The producer and consumer are decoupled. Neither needs a direct reference to the other module. The agreed key is the rendezvous point.

For reactive state, the same idea is organized into addressable namespaces:

```ts
const address = {
  globalKey: "APPLICATION",
  ms_reg: "RUNTIME",
  sl_reg: "CAPABILITIES",
};

store.state.set("filesystem", true, address);

// Another module, using the same address:
const filesystem = store.state.get<boolean>("filesystem", address);
```

For readiness coordination, a Rift provides a named slot that can exist before its value is available:

```ts
const runtime = store.maelstrom.rift("runtime:ready");

// A consumer can wait before the producer has opened it.
const ready = runtime.wait();

// The producer opens the same named slot later.
runtime.open(true);
```

The important property is that the name identifies the shared location. The consumer does not need to receive a message from the producer or discover which module owns it.

---

## 3. Type aliases and value helpers

### `MaybePromise`

`MaybePromise` is a small return-shape helper. It returns an ordinary value when the value is not `undefined`; when the value is `undefined`, it returns `Promise.resolve(undefined)`.

```ts
MaybePromise(value);       // value, when defined
MaybePromise(undefined);   // Promise resolving to undefined
```

This is not a general promise detector or an automatic asynchronous wrapper. It does not await arbitrary thenables. Its specific distinction is whether the supplied result is `undefined`.

### `rv`

`rv` resolves a value-or-zero-argument-function input:

```ts
rv(value);       // returns value
rv(() => value); // calls the function and returns its result
```

It is useful where an API accepts either a concrete value or a lazy value factory.

### `sameValue`

`sameValue(a, b)` considers two values equal when:

- `Object.is(a, b)` is true; or
- both are `Date` instances representing the same timestamp.

It gives Date values a meaningful equality check without changing the normal `Object.is` behavior for other values.

---

## 4. `Rift` — a named slot that can be opened later

A `Rift` is a small in-process synchronization primitive. It represents one named place where a value may eventually arrive.

A Rift carries its own:

- current value;
- open/closed state;
- claim state;
- promise gate for callers waiting on it;
- listeners for the moment it opens;
- creation and opening timestamps.

The entry is self-contained: the value and the mechanism for waiting on that value live on the Rift itself. The registry only needs to find the entry by its name.

### Lifecycle

A newly created Rift is closed. Consumers can wait on it before a producer has supplied anything.

```ts
const rift = new Rift<string>();

const pending = rift.wait(); // waits for the gate to open
rift.open("available");

const value = await pending; // "available"
```

`open(value)` opens the Rift once, stores the value, resolves its gate, records `openedAt`, and notifies its `onOpen` listeners. Further calls to `open` do nothing until the Rift is reset.

`wait(timeoutMs)` returns the gate. With no timeout (or `0`), it waits indefinitely. A positive timeout opts into rejection if the gate has not opened within that interval.

`claim()` is a one-time claim operation. The first caller receives `true`; later callers receive `false`. This is used by cached resolution paths to ensure that only one participant performs the initial work while the others wait for its result.

`reset()` closes the Rift again, clears its value and timestamps, releases its claim state, and creates a new promise gate. It does not discard the listener array.

`onOpen(listener)` subscribes to the opening event and returns an unsubscribe function.

### Inspection

- `isOpen` indicates whether the Rift has opened.
- `isClaimed` indicates whether its one-time claim has been taken.
- `current` returns its current value, or `undefined`.
- `createdAt` records construction time.
- `openedAt` records the most recent opening time after construction/reset.

A Rift is not a queue of messages. It is a named value/readiness gate with a one-time opening lifecycle, plus explicit reset when a new cycle is needed.

---

## 5. `Store` — the ordinary shared key/value surface

The `Store` class extends Node's `EventEmitter` and owns the conventional key/value API. The default export is an instantiated `Store`.

Its ordinary data is held in `#data`. Key-specific subscriptions are held in `#subs`; global subscriptions are held in `#anySubs`; predicate waiters are held in `#waiters`. These are private to the store instance.

### Write operations

| Method | Behavior |
|---|---|
| `set(key, value)` | Writes a value, notifies matching waiters and subscribers, and returns the store for chaining |
| `setLazy(key, make)` | Reads the previous value, evaluates `make()`, writes the result, and notifies |
| `delete(key)` | Removes an existing key, notifies with `undefined`, and returns whether the key existed |
| `clear()` | Notifies for each current key with `undefined`, then clears the data |
| `setIfAbsent(key, value)` | Writes only if the key does not already exist |
| `setIfPresent(key, value)` | Replaces only an existing key |
| `replace(key, value)` | Alias for `setIfPresent` |
| `update(key, fn, initial)` | Updates from the old value and whether the key existed, using `initial` when needed |
| `inc(key, by = 1)` | Increments a numeric value by the supplied amount |
| `touch(key)` | Creates an absent key with value `undefined`, without overwriting an existing key |

The write helpers notify through the store's notification path. `set` also checks the store's frozen flag and throws `Store is frozen` when frozen. `freeze()` sets that flag.

### Read and inspection operations

| Method | Behavior |
|---|---|
| `get(key)` | Returns the stored value or `undefined` |
| `get(key, fallback)` | Returns the stored value, or the fallback if absent |
| `has(key)` | Tests whether the key exists |
| `getAll()` | Returns a clone of the underlying data container |
| `entries()` | Returns the entries as an array |
| `keys()` | Returns the keys |
| `values()` | Returns the values |
| `toJSON()` | Returns an object representation |
| `find(predicate)` | Finds a value matching a predicate |
| `findKey(predicate)` | Finds the key matching a predicate |
| `group(fn)` | Groups data using the supplied grouping function |
| `pick(keys)` | Returns the selected keys |
| `omit(keys)` | Returns the data excluding selected keys |
| `snapshot()` | Returns a clone of the data |
| `equals(other)` | Compares the data with another value |
| `snapshotSubs()` | Returns a snapshot of the key-specific subscriber sets |
| `subscribersOf(keys)` | Returns the union of subscribers registered for the requested keys |
| `unsubscribeAll(fns)` | Removes the supplied functions from key-specific and global subscriber sets |

The collection-oriented methods delegate to the underlying `M2` container. Their precise return types follow that container's API.

### Subscriptions: callback form

There are three subscription forms.

**One key:**

```ts
const unsubscribe = store.subscribe(
  "user",
  (value, previous, key) => {
    console.log(key, previous, value);
  }
);

store.set("user", "Alice");
unsubscribe();
```

Only changes for the selected key reach this listener.

**Every key:**

```ts
const unsubscribe = store.subscribe((value, previous, key) => {
  console.log("changed:", key, previous, value);
});
```

This registers a global watcher. The callback receives the new value, previous value, and changed key.

**Immediate key subscription:**

```ts
const unsubscribe = store.subscribe(
  "user",
  (value, previous, key) => {
    // receives later changes
  },
  { immediate: true }
);
```

When the key already exists, the current value is delivered on a microtask. The normal subscription remains active until unsubscribed.

### Subscriptions: async iterator form

Calling `subscribe` with a key and no callback returns an async generator:

```ts
for await (const value of store.subscribe("token", { immediate: true })) {
  await refreshWith(value);
  if (value === "stop") break;
}
```

The iterator buffers changes in an internal queue so a slower consumer does not lose values simply because it has not advanced to the next iteration yet. Leaving the loop runs the generator's cleanup and removes its subscriptions.

### Waiting for a key

`wait` returns a Promise that resolves when a key's value satisfies a predicate.

```ts
const token = await store.wait("token", {
  predicate: value => typeof value === "string",
  timeout: 5000,
  immediate: true,
});
```

Options:

- `predicate(value, previous)` decides whether a change qualifies. It defaults to always true.
- `timeout` is a millisecond timeout. When it expires, the Promise rejects with a `TimeoutError`.
- `immediate` checks the current value first. It defaults to `true`.
- `signal` accepts an `AbortSignal`; aborting rejects with an `AbortError`.

Convenience methods:

```ts
await store.waitChange("token");              // ignore the current value
await store.waitFor("token", isUsableToken);   // wait for a predicate
```

`waitChange` forces `immediate: false`. `waitFor` supplies the predicate.

### Notification and flush behavior

Store notifications are scheduled through a dirty-callback set and drained in a microtask. Repeated scheduling of the same cached notification callback is coalesced before it runs. This allows several writes in the same turn to settle before subscribers are notified.

The store also supports explicit batch scopes through the batch machinery used by the implementation: while an explicit scope is open, the drain retains pending callbacks rather than discarding them. Once the scope closes, the pending callbacks can be released.

This is notification scheduling, not a separate message transport. The state is written to the store first; subscribers are notified about the resulting state.

---

## 6. `store.state` — addressable reactive namespaces

`state` is the namespaced reactive store inside `Store`. It exists so multiple independent state domains can share the same store instance without colliding over generic keys.

Each state namespace is selected by three address components:

| Address field | Default | Role |
|---|---|---|
| `globalKey` | `store.r` (`"_root_k_"`) | Root namespace |
| `ms_reg` | `store.m` (`"_master_k_"`) | Master namespace inside the root |
| `sl_reg` | `store.s` (`"_slave_k_"`) | Slave/state namespace inside the master |

The defaults are also exposed as `store.r`, `store.m`, and `store.s`.

Conceptually, the address is:

```text
globalKey
  └── ms_reg
       └── sl_reg
            └── key → value
```

The same key can exist in two different namespaces without referring to the same state entry. Modules that intend to share a state value must use the same address tuple and key.

### `getMap`

`state.getMap(slave, master, root)` retrieves or creates the `M2` map at that address. It creates each missing level on demand and returns the leaf map.

This is the common address-resolution path used by the state operations. It avoids every caller having to construct or retain its own nested maps.

### `getMetadata`

`state.getMetadata(slave, master, root)` retrieves or creates the metadata object associated with the same address. The metadata is separate from the value map because it tracks the machinery around the state namespace.

The metadata structure includes:

- batch membership, queued values, and batch options;
- per-key history and time-travel positions;
- global listeners and global subscribers;
- waiters;
- system values;
- sealed and frozen key sets;
- key contracts;
- conflict values and conflict strategies (`latest`, `fail`, `accumulate`);
- causal records and scopes;
- message handlers;
- last-write source information;
- key/tuple indexes and weak lookup structures.

These are metadata facilities for the namespaced state system. They do not represent a second copy of the actual state values.

### State operations

```ts
const address = {
  globalKey: "APPLICATION",
  ms_reg: "RUNTIME",
  sl_reg: "CAPABILITIES",
};

store.state.set("filesystem", true, address);
const enabled = store.state.get<boolean>("filesystem", address);
```

`state.get` first checks the active state map. If the key is absent there, it checks the persistent map only when the key has been marked persistent. A recovered persistent value is copied back into the active state map before it is returned.

`state.set` accepts either a direct value or an updater function:

```ts
store.state.set("count", 1, address);
store.state.set("count", previous => (previous ?? 0) + 1, address);
```

It avoids a write when `Object.is(previous, next)` is true. Otherwise it records history (unless the time-travel system is currently reverting), updates active state, mirrors the value into persistent storage when the key is marked persistent, and schedules notifications when `triggerRender` is enabled.

The `set` options include:

- `triggerRender` — controls whether notification callbacks are scheduled; defaults to `true`.
- `cap` — maximum history length for the key; defaults to `200`.

### State subscriptions and lifecycle

- `state.subscribe(key, listener, address)` registers a listener for a key in the selected namespace and returns an unsubscribe function.
- `state.delete(key, address)` removes the key, clears its persistence marker/value when applicable, notifies its key listeners with `undefined`, and removes those listeners.
- `state.entries(address)` returns the entries in the selected active state map.
- `state.has(key, address)` checks active state and eligible persistent state.
- `state.persist(key, address)` marks a key for persistence within the store's persistent namespace.
- `state.unpersist(key, address)` removes the persistence marker and stored persistent value.
- `state.clear(address)` clears the active state map and its key listeners.
- `state.clearPersistent(address)` clears the persistent map and persistence markers.
- `state._emit(key, address)` schedules both key-level and global notification paths.

Persistence here means retention in the store's own persistent namespace so a value can be restored into the active map. It is not, by itself, disk persistence or database storage.

### Notification coalescing

`state.scheduleNotify` schedules key-specific listeners. `state.scheduleGlobalNotify` schedules the namespace's global listeners and resolves registered waiters for the key.

Both paths cache scheduled callbacks so repeated scheduling for the same key can be coalesced before the flush executes. The callbacks read the final value when they run, rather than preserving every intermediate write as a separate event.

This is appropriate for reactive state observation: consumers are notified that the state has changed and can read the settled value. It is not intended to preserve every intermediate mutation as a durable event log.

---

## 7. The Maelstrom subsystem

`store.maelstrom` is the coordination and module-resolution surface. It is created once as part of the `Store` instance and closes over the store's one Rift registry, scheduler state, environment state, and logger.

The central registry is `#rifts`, a map from string labels to `Rift` entries. The registry is the authoritative location for named values and readiness state.

The key design rule is explicit in the implementation: **results are a view of the registry, not a second result map.** A result is recorded by annotating and opening the corresponding Rift entry. Waiters and deferred tasks are then advanced from that same entry.

### Logging and shared helpers

- `maelstrom.log(where, detail, type)` sends a structured message through `ORC_SHOUT`.
- `maelstrom.key_for(specifier)` resolves a module specifier relative to this file where supported, with a URL-based fallback.
- `maelstrom.normalizeFallback(...)` converts a supplied fallback value or fallback factory into a factory.
- `maelstrom.createSafeProxy()` creates a callable/property-safe fallback proxy for missing optional modules. It suppresses chained property access and logs suppressed access rather than immediately failing.
- `maelstrom.toNamespace(module)` leaves object namespaces intact and wraps primitive/function-style module results as `{ default: module }`.

### Blind loading primitives

`maelstrom.blind` provides dynamic loading without a static import dependency:

- `blind.import(specifier)` uses dynamic `import()`.
- `blind.require(specifier)` is available only where `require` exists; otherwise it is `null`.

The `blind` name reflects that these operations do not introduce a static dependency on the target module. Availability is still runtime-dependent.

### Runtime probes

`maelstrom.has` exposes runtime facts and probes:

- `has.node` and `has.bun` identify Node and Bun runtime versions.
- `has.require` indicates whether the require path is available.
- `has.local(filePath, module?)` checks whether a path resolved from `process.cwd()` exists, when running under Node/Bun.
- `maelstrom.is` reports additional environment facts such as browser presence, VS Code process presence, and the currently hard-coded platform flags in this implementation.

These are capability/environment checks, not guarantees that every listed adapter or transport is initialized.

---

## 8. The Rift registry API

The registry is exposed through `maelstrom.rift`. Every named operation ultimately finds or creates an entry in the same `#rifts` map.

### Basic registry access

| Method | Purpose |
|---|---|
| `rift(label)` | Get the Rift for a label, creating it if necessary |
| `rift.make<T>()` | Create a standalone Rift instance |
| `rift.inspect()` | Return registry labels and each entry's open/claimed/timestamp state |
| `rift.size` | Number of named entries |
| `rift.clear()` | Clear the registry |
| `rift.reset(label)` | Reset one existing Rift without deleting its registry slot |
| `rift.delete(label)` | Delete one registry entry |
| `rift.guard(label, fn, timeout?)` | Wait for a named gate and pass its unlock value to a function |
| `rift.load(specifier)` | Dynamically import a module with in-flight deduplication |

`rift.load` resolves the specifier to a stable key and uses a `mod:`-prefixed Rift entry. If the module is already loaded, it returns the cached module. If a load is already in flight, callers share that promise. A successful load opens the entry, indexes its exports, records the outcome, and clears the in-flight promise. A failed load clears the in-flight marker so a later call can retry.

### The result surface

`maelstrom.record(label, solver, value, storeKind)` is the common result-recording funnel.

It:

1. obtains the Rift for `label`;
2. tags the entry with the solver and store kind;
3. advances its version;
4. opens the Rift with the value;
5. re-fires the `__results__` sentinel Rift with a `ResultRecord`;
6. releases multi-label waiters for that label;
7. asks the deferred scheduler to drain.

It creates no parallel result registry.

Result accessors:

- `rift.result(label)` returns the result record for a label when a solver has been recorded.
- `rift.resultsFrom(solver)` filters the computed results view by solver.
- `rift.onResult(listener)` subscribes to the shared `__results__` sentinel, receiving each recorded result.
- `store.maelstrom.results` computes a read-only array view from the entries in `#rifts`.
- `rift.place(label, value, storeKind?)` places a value and records it as `place`.
- `rift.read(label, storeKind?)` reads the current value and records the read operation as `get`.
- `rift.get_value(label)` reads the current value without creating a separate value store.

A result record describes an outcome associated with a Rift entry. It is not a second source of truth.

### Solver operations

The named solver methods are different ways of interacting with the same registry. They do not each own their own result cache.

**`rift.read(label)` — get/place read path**

Reads the current value from the named Rift and records the `get` outcome.

**`rift.place(label, value)` — publish a value**

Opens the named Rift with the supplied value and records the `place` outcome.

**`rift.create(label, module)` — founder**

Creates/opens a named entry with the supplied module/value and records `create_rift`. Its fallback path attempts module resolution if the initial operation fails.

**`rift.use(label, wait?, apparation?, store?)` — traveler**

Follows a resolution ladder:

1. Return the current value if the Rift is already open.
2. If the Rift has been claimed, wait on the existing gate.
3. Otherwise attempt synchronous module resolution for the label.
4. If a synchronous value is found, open and record it.
5. If no value is available, return the supplied `apparation` fallback.

Errors are logged and the fallback is returned rather than allowing this path to crash the caller.

**`rift.bandit(label, module?, wait?, store?)` — tolerant envelope**

Provides a non-throwing result envelope for common cases: an already-open value, a wait for a value, an attempt to open with a supplied module, or an unavailable result represented by an apparation fallback. The envelope reports loading/waiting state and the value/module field appropriate to the path.

**`rift.resolve` — resolution helpers**

- `rift.resolve(name, value)` uses the global resolver with its configured wait period and supplied value.
- `rift.resolve.global(name, wait?, fallback?)` returns an already-open value, waits when the entry has been claimed, or returns the fallback when no value is available.

**`rift.has(module)` — scout**

Checks whether a module/value is already represented by the registry, known to the module loader, or available through the require/import probes. It returns a boolean.

### Cached and uncached module conjuration

`rift.conjure` is the optional-module resolution surface. It accepts module import options including the module name, fallback, whether the input is a module, whether to cache, whether to prefer `require`, and environment-specific import candidates.

**Cached `conjure(options)`**

When caching is enabled and a module name is supplied, the module name is the registry key. The first caller claims the Rift and performs the uncached resolution. Other callers wait on that same Rift. The resolved module or fallback is opened into the entry and recorded.

When caching is disabled or there is no module name, it uses the uncached path directly.

**`conjure.uncached(options)`**

Runs the resolution process without using the cached module-name gate. It considers the supplied import promise and environment-specific candidates, attempting synchronous paths before requiring asynchronous resolution where possible. Missing or failed optional candidates can resolve through the configured fallback.

**`conjure.get(label, cache?, module?)`**

Convenience operation for obtaining/conjuring a whole module namespace under a named Rift.

The key distinction is that cached conjuration shares one in-flight resolution for a label; uncached conjuration performs an independent resolution attempt.

### Local named imports

- `rift.probe(label, filePath, comp_name, fallback)` probes a locally sourced module/export path.
- `rift.use_if_available(label, filePath, comp_name, fallback, opts?)` uses the locally sourced named import when available and otherwise returns the fallback.

These functions are intended for named imports that may be supplied by the local project rather than guaranteed package dependencies.

### Promise gate helper

`rift.guard_promise_gate(get, name, fn, timeout?)` is the lower-level gate helper used by `rift.guard`: wait for the named value, then invoke the callback with the unlock value.

---

## 9. Module loading, caching, and export lookup

`maelstrom.module` groups the module-specific operations. Module results are still stored as Rift entries, with stable prefixes distinguishing loading paths.

### Loading paths

- `module.load(specifier)` is the asynchronous dynamic-import path. It uses `mod:` plus the resolved specifier as its key and deduplicates concurrent loads.
- `module.require(specifier)` is the synchronous require path. It uses a `req:` key, returns the cached value when already open, and returns `undefined` when `require` is unavailable.
- `module.check(moduleName)` performs a one-time availability check through the optional module resolution path. Concurrent callers share the check's Rift and receive its boolean result.
- `module.isLoaded(specifier)` checks whether the resolved `mod:` entry is open.
- `module.getLoaded(specifier)` returns the loaded module namespace when present, without initiating a new load.

### Export indexing

When a module is loaded, its enumerable named exports are indexed on that module's Rift entry.

- `module.indexExports(rift, key, mod)` records each exported name against the module key.
- `module.extract_named(namespace, comp_name)` extracts a named export from a namespace.
- `module.named_export(label, comp_name, module?)` resolves a named export through the module path.
- `module.export_of(name, specifier?)` finds a named export in a specific loaded module when a specifier is supplied. Without a specifier, it searches the loaded-module export indexes. If no source contains the name, it returns `undefined`. If more than one loaded module provides that name, it throws an ambiguity error rather than silently selecting one.

The export index belongs to the loaded module's Rift entry. It is not a separate global module registry.

---

## 10. Waiters — coordinate one signal or several

`maelstrom.waiter` provides callback coordination over named Rift entries.

It accepts either one label or an array of labels:

```ts
const id = store.maelstrom.waiter(
  ["config:ready", "database:ready"],
  () => {
    // both named entries have opened
  }
);
```

### One dependency

For one label, the waiter subscribes directly to that Rift's `onOpen` mechanism. If the entry is already open, the callback runs immediately. There is no second per-label result list.

### Multiple dependencies

For multiple labels, the waiter creates one entry in `#multiWaiters`. Each dependency is checked against its Rift. Already-open dependencies are marked ready; unopened dependencies subscribe to their own Rift. When all dependencies have opened, the waiter is removed and its callback runs.

`releaseMulti(label, value)` advances the multi-label waiters that depend on the opened label.

`cancel(id)` removes a matching multi-label waiter and reports whether it found one. The implementation's single-label path is a direct Rift subscription and does not add an entry to the multi-waiter table.

`wait_and_promise(timeoutMs, key, isOpen, current)` provides a Promise form of the single-label wait. It subscribes first and then rechecks the open state, closing the race where the Rift opens during subscription setup. It optionally times out and records the `wait_for` outcome when resolved.

This is a readiness subscription system, not a message queue. A waiter is interested in the opening of named entries and, for multi-dependency waits, in the point where every required entry is ready.

---

## 11. Deferred tasks — run work when dependencies exist

`maelstrom.defer` is a small dependency-aware scheduler.

A deferred task declares the named entries it needs. It remains pending until every dependency's Rift is open. Once ready, the scheduler claims it before execution so it cannot be dispatched twice by a re-entrant drain.

```ts
const taskId = store.maelstrom.defer(
  ["config:ready", "database:ready"],
  (config, database) => {
    return initializeService(config, database);
  }
);

// Later, producers provide the dependencies:
store.maelstrom.defer.provide("config:ready", config);
store.maelstrom.defer.provide("database:ready", database);
```

### Task registration and execution

`defer(deps, fn)` registers a task with a unique ID and pending state, then asks the scheduler to drain. The callback receives dependency values in the same order as the dependency list.

When every dependency is open:

1. the task changes from `pending` to `running`;
2. the executed counter advances;
3. current dependency values are read from the corresponding Rifts;
4. the callback runs;
5. synchronous completion or Promise settlement updates completion/failure statistics;
6. the task is removed when finished.

The scheduler guards against re-entrant draining. If another drain is requested while one is already running, it marks that another pass is needed and repeats after the current pass.

### Supplying and inspecting dependencies

| Method | Behavior |
|---|---|
| `defer.provide(key, value)` | Resets and opens the named Rift with a new value, records it, and drains tasks |
| `defer.provide({ key: value, ... })` | Provides several named dependency values |
| `defer.resolve(key)` | Provides the key with `undefined` |
| `defer.invalidate(key)` | Deletes the named Rift entry |
| `defer.has(key)` | Tests whether its Rift is open |
| `defer.get(key)` | Reads its current value |
| `defer.ready(task)` | Tests whether every dependency is open |
| `defer.cancel(id)` | Removes a pending task |
| `defer.inspect()` | Reports scheduler statistics and pending/running tasks |
| `defer.clear()` | Cancels and removes pending tasks |
| `defer.onError(error, id, deps)` | Reports task failure |
| `defer.onSuccess(id, deps)` | Reports successful completion |

`provide` intentionally resets the Rift before opening it. Unlike the ordinary one-shot `open`, this allows a dependency key to be supplied again with a replacement value and a new readiness cycle.

### Statistics

The scheduler tracks:

- `registered`;
- `executed`;
- `completed`;
- `failed`;
- `cancelled`.

`inspect()` returns these counters plus pending tasks and their missing dependencies, and currently running tasks.

Deferred tasks are stored in `#deferTasks`; dependency values are not copied into a separate dependency-value map. The values remain in the same Rift registry used by direct reads, waiters, and module coordination.

---

## 12. Environment and capability detection

The environment detector identifies the runtime and surrounding toolchain so optional module resolution can make informed choices.

### Candidate groups

The implementation defines candidate lists for:

- module-level tools (for example TypeScript, Vite, Rollup, ESLint, Babel, Vitest, and related tools);
- application/platform frameworks (for example React, Preact, Remix/React Router, Next, Nuxt, Svelte, Vue, Angular, and others);
- compilers and build tools (for example Rspack, Webpack, Vite, Rollup, esbuild, SWC, Babel, and others);
- package managers/bundlers (Bun, pnpm, Yarn, npm);
- adapters (including WebSocket, worker, Electron, MQTT, SSE, native messaging, and related names);
- capability candidates (shared/service/worker and native communication capabilities).

The lists are candidates to probe, not a claim that every candidate is installed or active.

### Detection methods

- `detect.capability(name)` checks selected runtime capabilities such as `SharedWorker`, service workers, Node workers, `BroadcastChannel`, Electron, named pipes, and native messaging.
- `detect.bundler()` identifies Bun directly or reads the Node package-manager user-agent to identify pnpm, Yarn, or npm.
- `detect.firstMatch(candidates)` returns the first candidate that passes `module.check`.
- `detect.all(candidates)` returns every candidate that passes `module.check`.
- `detect.environment(env_lib?)` starts environment detection, stores the resulting module-level tool, platform, compiler list, bundler, and adapter list in `ENV_STATE`, marks it ready, and records the result as `ENV_DETECTION`.

`useEnvState()` returns the current environment state with the `rt` and `subChannel` identifiers. If called before detection is complete, it warns once and returns the current defaults.

Environment detection is asynchronous. Calling `detect.environment()` starts the work; consumers should inspect `useEnvState().ready` before assuming the result is populated.

`cloudSupport()` reports whether the current global environment has browser-like window/document support. It is a support probe, not an active cloud transport.

---

## 13. Type interrogation

`maelstrom.type(value)` classifies a supplied value by checking important asynchronous and structural forms.

It distinguishes thenables and async iterables first, then primitive values, functions, typed-array views, Maps, Sets, Dates, regular expressions, Errors, iterables, and other object forms. It also contains Node-specific checks for `Buffer`, `URL`, and `URLSearchParams`.

This helper is intended to let the rest of the system inspect the shape of an input without requiring every caller to repeat the same set of checks.

The returned labels are the strings used by the implementation (for example `thenable`, `async-iterable`, `map`, `set`, `date`, `regexp`, `error`, `Buffer`, `URL`, and `plainObject`). The implementation's check order matters: a thenable is classified as `thenable` before its underlying object shape is considered.

---

## 14. Apparation — typed fallback values and no-op shapes

`maelstrom.apparation` is a collection of fallback factories. It can supply empty or inert values when an optional module, dependency, or value is unavailable.

It includes:

- generic empty objects and identity-style pass-through helpers;
- resolved Promises for generic, boolean, and typed values;
- no-op void functions and no-op functions returning generic values;
- callable/property-safe universal proxies;
- a pending thenable and an empty async iterable;
- primitive defaults (`null`, empty string, zero, `false`, `0n`, symbol, `undefined`);
- empty typed arrays, DataViews, ArrayBuffers, Maps, Sets, Dates, RegExps, Errors, iterables, iterators, objects, arrays, WeakMaps, and WeakSets;
- URL, URLSearchParams, and Buffer-compatible empty values.

These are fallback shapes, not real implementations of the missing dependency. They are useful when a caller needs a value with an expected broad shape so optional integration can remain non-fatal.

The `universal` and `universalNoop` proxies absorb property access, calls, construction, writes, and deletion in the ways defined by their proxy traps. They should be understood as defensive placeholders, not as a substitute for validating whether the underlying optional capability is genuinely available.

`maelstrom.reset()` clears the Rift registry, multi-waiters, deferred tasks, scheduler statistics, cached auto-cloud state, and environment-detection state.

---

## 15. `ORC_SHOUT` — structured console logging

`ORC_SHOUT` is the logger used by Maelstrom. It formats console output with CSS styles and provides themes for:

- `deep`;
- `vintage`;
- `error`;
- `warn`;
- `success`;
- `info`.

`log(message, payload?, theme?)` accepts a string or an array whose first element is the title and whose remaining elements are additional paragraphs. Object payloads are expanded into key/value console formatting.

Maelstrom's `log(where, detail, type)` selects the corresponding theme and prefixes messages with `[MAELSTROM][where]`. If `detail.error` is an `Error`, it is normalized to its message before logging.

The logger is diagnostic presentation. It does not own store state, module results, or task state.

---

## 16. How the pieces work together

A typical cross-module coordination flow looks like this:

1. A module obtains the shared default store instance.
2. It writes a value to a conventional key, a namespaced `state` address, or a named Rift, depending on the data's purpose.
3. Another module reads the same key/address/label, subscribes to it, or registers a waiter before it becomes available.
4. When a Rift opens or a state value changes, the corresponding subscription/notification path runs.
5. If work depends on multiple named values, a deferred task waits until all of those Rifts are open and then executes.
6. Module-loading outcomes and coordination outcomes are recorded against the same Rift entries and can be inspected through the results view.

The shared namespace is the meeting point. Modules do not need to import one another just to exchange runtime state.

### Choosing the right surface

| Need | Use |
|---|---|
| Store a value under a key and read it elsewhere | `store.set` / `store.get` |
| React to a key changing | `store.subscribe` |
| Wait until a key changes or satisfies a predicate | `store.wait`, `waitChange`, `waitFor` |
| Keep independent state domains apart | `store.state` with root/master/slave address |
| Retain a value in the store's persistent namespace | `store.state.persist` |
| Represent a named value that may arrive later | `store.maelstrom.rift(label)` |
| Wait for one or several named readiness signals | `store.maelstrom.waiter` |
| Run a function when all named inputs are available | `store.maelstrom.defer` |
| Load and cache a module by specifier | `store.maelstrom.module.load` or `rift.load` |
| Resolve an optional dependency with a fallback | `store.maelstrom.rift.conjure` |
| Inspect recorded named outcomes | `store.maelstrom.results` / `rift.result` |
| Detect runtime/toolchain capabilities | `store.maelstrom.detect` |

---

## 17. Important behavioral boundaries

A few distinctions prevent incorrect assumptions:

1. **One shared instance is not cross-process memory.** The default export is shared by modules that resolve the same package instance in the same process. Separate processes and isolates need an explicit transport.
2. **The ordinary store and `state` are separate surfaces.** `store.set` does not write into a `store.state` namespace, and `state.set` does not write into `#data`.
3. **Rifts are named gates, not message queues.** An open Rift holds a current value and notifies subscribers when it opens. It does not retain a sequence of messages.
4. **Opening is one-shot until reset.** `Rift.open` ignores subsequent opens. `reset` creates a new gate. `defer.provide` resets before opening so a dependency can be replaced.
5. **Deferred dependencies are Rift entries.** The task table stores task definitions and their status; dependency values remain in the Rift registry.
6. **Results are derived from the registry.** The results surface reads the same entries and uses a sentinel Rift for result notifications.
7. **State persistence is in-memory namespace retention.** The `_PERSISTENT` map is part of this store instance; it is not disk/database persistence.
8. **Notifications are coalesced.** Reactive notifications can report the final settled value after several writes in one flush. They are not a durable event stream of every intermediate value.
9. **Fallbacks are not successful integrations.** Safe proxies and apparation values prevent some missing optional dependencies from crashing a caller, but they do not mean the requested module or capability was present.
10. **Environment detection is asynchronous.** Consumers must wait for `ENV_STATE.ready` before relying on detected results.

---

## 18. Public exports and instance shape

The file exports:

```ts
export { Store };
export default new Store();
```

The named `Store` export allows a caller to create an independent store instance when isolation is desired. The default export is the shared live instance intended for cooperating modules.

The implementation also declares the `Rift` class and supporting types internally, but its final export comment identifies the public class exports as the `Store` and `Rift` classes plus the live default machine; `MaybePromise` remains a standalone helper. Confirm the package's actual barrel/export configuration when publishing a public type surface.

---

## 19. The reason it is one thing

The implementation is intentionally cohesive.

A shared store is only useful if every participant can agree on where a value lives and how to observe it. Splitting the value store, result registry, dependency registry, waiter registry, and module cache into unrelated systems would create multiple places that need to be kept in agreement.

This design instead uses a small number of authoritative structures:

- the ordinary `#data` map for the conventional key/value API;
- the addressed `#context` maps for namespaced reactive state;
- the addressed `#meta` maps for state-system metadata;
- the single `#rifts` registry for named values, readiness, module entries, and recorded outcomes;
- `#deferTasks` for deferred task definitions, not dependency values;
- `#multiWaiters` for multi-label waiter coordination.

The registry entry is where a named value lives. Its own opening mechanism is how subscribers are notified. The result surface is a view of those entries. Waiters subscribe to those entries. Deferred tasks check those entries. Module loading stores its result in those entries.

That is the unifying design: **one shared in-process memory namespace that modules can independently contribute to and consume from, with coordination mechanisms attached to the same underlying state rather than layered beside it.**

## Usage

```ts
import Store from "sauron";

// flat store
Store.set("user", user);
const unsub = Store.subscribe("user", (value, prev) => console.log(value));

// scoped state
Store.state.set("count", 0);
Store.state.subscribe("count", (v) => render(v));
Store.state.set("count", (prev) => prev + 1);

// rifts
const rift = Store.maelstrom.rift<Config>("config");
rift.open({ debug: true });         // fires once, forever
await rift.wait();                  // resolves immediately now

// modules
const fs = Store.maelstrom.module("node:fs");
const mod = await Store.maelstrom.module("./optional.js");

// deferred dependencies
Store.maelstrom.defer(["config", "logger"], (config, logger) => {
    logger.info("booted with", config);
});
Store.maelstrom.defer.provide("config", { debug: true });
Store.maelstrom.defer.provide("logger", console);

// apparations
const missing = Store.maelstrom.apparation.object<MyConfig>();
// missing.any.path.works.because.every.access.returns.an.apparation
```

## Quick Reference
// Importing A Store
```tsx
// Import the cross module accessible store
import Store from '@the-w1zard/store'
```
```tsx
// Import the class instance store to create a new store within the appy your are importing it into
import { Store } from '@the-w1zard/store'
```
> [!NOTE]
>
> Importing the class into the app, you do loose that shared context between node modules. But what you gain instead is a private namespaced store/context for your app.

### SET / GET
```tsx
// Store a value 
Store.set("user", user)
```
```tsx
// Store a lazily-created value
Store.setLazy("user", () => createUser())
```
```tsx
// Retrieve a value 
Store.get("user")
```
```tsx
// Retrieve with fallback
Store.get("user", fallback)
```
```tsx
// Check whether a key exists 
Store.has("user")
```
```tsx
// Delete a value  
Store.delete("user")
```
```tsx
// Remove all values 
Store.clear()
```
```tsx
// Retrieve all values  
Store.getAll()
```
```tsx
// Freeze further writes  
Store.freeze()
```
### SUBSCRIPTIONS
```tsx
// Subscribe to changes on a specific key   
Store.subscribe("user", fn)
```
```tsx
// Subscribe to all store changes  
Store.subscribe(fn)
```
```tsx
// Subscribe and receive the current value immediately 
Store.subscribe("user", fn, { immediate: true })
```
```tsx
// Observe changes through an async iterator  
Store.subscribe("user")
```
```tsx
// Observe with an immediate initial value   
Store.subscribe("user", { immediate: true })
```
```tsx
// Unsubscribe all matching listeners   
Store.unsubscribeAll(fns)
```
```tsx
// Get subscribers registered for multiple keys
Store.subscribersOf(["user", "config"])
```
### WAITERS
```tsx
// Wait for the next matching value 
await Store.wait("user")
```
```tsx
// Wait for a change, ignoring the current value
await Store.waitChange("user")
```
```tsx
// Wait until a predicate is satisfied 
await Store.waitFor("user", predicate)
```
```tsx
// Wait with a timeout   
await Store.wait("user", { timeout: 5000 })
```
```tsx
// Wait with an AbortSignal  
await Store.wait("user", { signal })
```
### ATOMIC OPERATIONS
```tsx
// Set only when a key does not exist 
Store.setIfAbsent("user", user)
```
```tsx
// Set only when a key already exists
Store.setIfPresent("user", user)
```
```tsx
// Replace an existing value   
Store.replace("user", user)
```
```tsx
// Update using the previous value 
Store.update("count", fn, 0)
```
```tsx
// Increment a numeric value
Store.inc("count", 1)
```
```tsx
// Register a key without overwriting its value
Store.touch("user")
```
### COLLECTION / INSPECTION
```tsx
// Convert store to a plain object   
Store.toJSON()
```
```tsx
// Retrieve entries 
Store.entries()
```
```tsx
// Retrieve keys 
Store.keys()
```
```tsx
// Retrieve values  
Store.values()
```
```tsx
// Find a value   
TORE.find(predicate)
```
```tsx
// Find a matching key 
Store.findKey(predicate)
```
```tsx
// Group values
Store.group(fn)
```
```tsx
// Select specific keys  
Store.pick(keys)
```
```tsx
// Exclude specific keys   
Store.omit(keys)
```
```tsx
// Create a snapshot  
Store.snapshot()
```
```tsx
// Compare stores   
Store.equals(other)
```
```tsx
// Inspect subscription state    
Store.snapshotSubs()
```
### Store.STATE 
Scoped state is organized by root → master → slave → key.
```tsx
// Retrieve a scoped state map 
Store.state.getMap()
```
```tsx
// Retrieve a map using custom channels
Store.state.getMap(slave, master, root)
```
```tsx
// Retrieve scoped metadata 
Store.state.getMetadata()
```
```tsx
// Read a state value 
Store.state.get(key)
```
```tsx
// Read using custom channels   
Store.state.get(key, opts)
```
```tsx
// Write a state value
Store.state.set(key, value)
```
```tsx
// Write with notification options 
Store.state.set(key, value, opts)
```
```tsx
// Subscribe to a state key  
Store.state.subscribe(key, listener)
```
```tsx
// Check whether a state key exists
Store.state.has(key)
```
```tsx
// Delete a state key 
Store.state.delete(key)
```
```tsx
// Retrieve scoped entries
Store.state.entries()
```
```tsx
// Clear scoped state
Store.state.clear()
```
```tsx
// Schedule a key notification 
Store.state._emit(key)
```
### PERSISTENCE
```tsx
// Mark a state key for persistence 
Store.state.persist(key)
```
```tsx
// Remove a key from persistence 
Store.state.unpersist(key)
```
```tsx
// Clear persistent values 
Store.state.clearPersistent()
```
> Notification scheduling is cached and flushed through the Store's notification pipeline. State metadata also holds batching, history, time-travel, listeners, waiters, contracts, conflicts and scope information.

### MAELSTROM
MODULE RESOLUTION
```tsx
// Dynamically import an ESM module 
await Store.maelstrom.module("module")
```
```tsx
// Resolve a module relative to the current module 
Store.maelstrom.key_for("./module.js")
```
```tsx
// Synchronously require a module
Store.maelstrom.module.require("node:fs")
```
```tsx
// Check whether a module has loaded
Store.maelstrom.module.isLoaded("./module.js")
```
```tsx
// Retrieve a loaded module
Store.maelstrom.module.getLoaded("./module.js")
```
```tsx
// Extract a named export 
Store.maelstrom.module.extract_named(ns, "exportName")
```
```tsx
// Retrieve a named export 
Store.maelstrom.module.export_of("exportName")
```
```tsx
// Retrieve a named export from a specific module
Store.maelstrom.module.export_of("exportName", "./module.js")
```
```tsx
// Load and resolve a named export
Store.maelstrom.module.named_export("module", "exportName")
```
```tsx
// Initialize module resolution
Store.maelstrom.module.init("module")
```
```tsx
// Initialize a named export 
Store.maelstrom.module.init.named_export("module", "exportName")
```
```tsx
// Check whether a module exists 
await Store.maelstrom.module.check("module")
```
```tsx
// Index exports from a loaded module
Store.maelstrom.module.indexExports(rift, key, mod)
```
### RIFT REGISTRY
```tsx
// Retrieve or create a Rift
Store.maelstrom.rift("service.ready")
```
```tsx
// Create a Rift directly
Store.maelstrom.rift.make()
```
```tsx
// Check whether a Rift exists 
Store.maelstrom.rift.has("service.ready")
```
```tsx
// Inspect registered Rifts 
Store.maelstrom.rift.inspect()
```
```tsx
// Clear the Rift registry  
Store.maelstrom.rift.clear()
```
```tsx
// Read a Rift value 
Store.maelstrom.rift.read("service.ready")
```
```tsx
// Reset a Rift 
Store.maelstrom.rift.reset("service.ready")
```
```tsx
// Delete a Rift 
Store.maelstrom.rift.delete("service.ready")
```
```tsx
// Wait for a Rift 
await Store.maelstrom.rift("service.ready").wait()
```
```tsx
// Guard execution behind a Rift 
Store.maelstrom.rift.guard("service.ready", fn)
```
```tsx
// Resolve a global Rift
Store.maelstrom.rift.resolve.global("service.ready", timeout, value)
```
### RIFT RESOLUTION
```tsx
// Retrieve or resolve a module through a Rift  
Store.maelstrom.rift.use("service")
```
```tsx
// Create a Rift from a supplied value 
Store.maelstrom.rift.create("service", value)
```
```tsx
// Read a Rift value
Store.maelstrom.rift.read("service")
```
```tsx
// Resolve an existing or claimed Rift
Store.maelstrom.rift.resolve.global("service")
```
```tsx
// Resolve a module with a fallback  
Store.maelstrom.rift.resolve.global("service", timeout, fallback)
```
```tsx
// Probe a named export with a synchs fallback 
Store.maelstrom.rift.probe("service", "./module.js", "export", fallback)
```
```tsx
// Probe a named export w/o blocking 
Store.maelstrom.rift.use_if_available("service", "./module.js", "export", fallback)
```
```tsx
// Conjure a module through the Rift resolver
Store.maelstrom.rift.conjure(options)
```
```tsx
// Conjure without caching  
Store.maelstrom.rift.conjure.uncached(options)
```
```tsx
// Retrieve a module Rift
Store.maelstrom.rift.conjure.get("module")
```
### RESULTS
```tsx
// Retrieve all recorded results 
Store.maelstrom.results
```
```tsx
// Retrieve the number of registered Rifts 
Store.maelstrom.size
```
```tsx
// Retrieve a specific result 
Store.maelstrom.rift.result("service")
```
```tsx
// Filter results by solver  
Store.maelstrom.rift.resultsFrom("solver")
```
```tsx
// Subscribe to recorded results 
Store.maelstrom.rift.onResult(fn)
```
```tsx
// Record a resolution outcome  
Store.maelstrom.record(label, solver, value)
```
### WAITERS
```tsx
// Wait for one or more readiness signals 
Store.maelstrom.waiter("auth", fn)
```
```tsx
// Wait for multiple signals 
Store.maelstrom.waiter(["auth", "config"], fn)
```
```tsx
// Cancel a multi-signal waiter 
Store.maelstrom.waiter.cancel(id)
```
```tsx
// Wait for a Rift through a Promise 
Store.maelstrom.waiter.wait_and_promise(timeout, key, isOpen, current)
```
### DEFER
 
```tsx
// Schedule execution when dependencies become available 
Store.defer.run("kvdb", (a: A) => {
  this.MODULES = new MODULES(kvdb);
});

Store.defer.provide("kvdb", kvdb);
```
```tsx
// Schedule execution after multiple dependencies 
Store.defer(["cache", "logger"], fn)
```
```tsx
// Provide a dependency 
Store.defer.provide("cache", cacheInstance)
```
```tsx
// Provide multiple dependencies 
Store.maelstrom.defer.provide({ cache, logger })
```
```tsx
// Resolve a dependency without a value 
Store.maelstrom.defer.resolve("service.ready")
```
```tsx
// Invalidate a dependency   
Store.maelstrom.defer.invalidate("service.ready")
```
```tsx
// Check whether a dependency is available
Store.maelstrom.defer.has("cache")
```
```tsx
// Retrieve a dependency  
Store.maelstrom.defer.get("cache")
```
```tsx
// Check whether a task's dependencies are ready 
Store.maelstrom.defer.ready(task)
```
```tsx
// Cancel a pending task   
Store.maelstrom.defer.cancel(id)
```
```tsx
// Inspect pending/running tasks and scheduler statistics
Store.maelstrom.defer.inspect()
```
```tsx
// Clear pending tasks 
Store.maelstrom.defer.clear()
```
```tsx
// Drain the scheduler 
Store.maelstrom.defer.drain()
```
### ENVIRONMENT DETECTION
```tsx
// Detect runtime and available modules 
Store.maelstrom.detect.environment()
```
```tsx
// Detect a specific module
Store.maelstrom.detect.firstMatch(candidates)
```
```tsx
// Detect all available modules 
Store.maelstrom.detect.all(candidates)
```
```tsx
// Detect a runtime capability 
Store.maelstrom.detect.capability("shared_worker")
```
```tsx
// Detect the package manager  
Store.maelstrom.detect.bundler()
```
```tsx
// Inspect environment state  
Store.maelstrom.useEnvState()
```
### APPARATION
```tsx
// Create a generic array 
Store.maelstrom.apparation.array<string>()
```
```tsx
// Create a generic object 
Store.maelstrom.apparation.object<MyType>()
```
```tsx
// Create a generic Map 
Store.maelstrom.apparation.map<string, number>()
```
```tsx
// Create a generic Set  
Store.maelstrom.apparation.set<string>()
```
```tsx
// Create a generic Promise 
Store.maelstrom.apparation.promise<MyType>()
```
```tsx
// Create a generic function   
Store.maelstrom.apparation.func<MyType>()
```
```tsx
// Create a generic WeakMap
Store.maelstrom.apparation.weakMap<object, MyType>()
```
```tsx
// Create a generic async iterable 
Store.maelstrom.apparation.asyncIterable<MyType>()
```
```tsx
// Create a generic typed array 
Store.maelstrom.apparation.typedArray<Uint8Array>()
```
```tsx
// Create a generic value placeholder    
Store.maelstrom.apparation.any<MyType>()
```
### RESET / LOGGING
```tsx
// Log a MAELSTROM event
Store.maelstrom.log("AREA", detail)
```
```tsx
// Reset MAELSTROM registries, tasks and environment state   
Store.maelstrom.reset()
```
### APPARATION
```tsx
// interfaces, classes, objects, primitives
// any<T = any>() as T
// satisfies ANY type T
Apparation.any<T>()
```
```tsx
// Promise of any type
// : Promise<T>
// satisfies Promise<T>
Apparation.promise<T>()  
```
```tsx
// common use case  
// : Promise<boolean>
// satisfies Promise<boolean>
Apparation.booleanPromise() 
```
```tsx
// no return value
// : void
// satisfies void
Apparation.void()
```
```tsx
// Function that returns T
// : () => T
// satisfies () => T
Apparation.func<T>()
```
```tsx
// Function that returns void 
// : () => void 
// satisfies () => void
Apparation.funcVoid()
```
```tsx
// ANY type with method chaining support
// new Proxy({} as any
// satisfies ANY type T (supports chaining)
Apparation.universal<T = any>()
```
```tsx
// simpler version
// <T = any>(): T { return {} as T }
// satisfies ANY type T
Apparation.simpleNoop<T>()
```
```tsx
//  Promise of any type
// Promise<T> { return Promise.resolve({} as T) }
// satisfies Promise<T>
Apparation.noopPromise<T>()
```
```tsx
// Promise<boolean> 
// : Promise<boolean> { return Promise.resolve(false); }
// satisfies Promise<boolean>
Apparation.noopBooleanPromise()
```
```tsx
// void
// : void
// satisfies void
Apparation.noopVoid() 
```
```tsx
// Function that returns T 
// <T>(): () => T { return () => ({}) as T; }
// satisfies () => T 
Apparation.noopFunction<T>() 
```
# Shared Store — Problem / Solution Quick Reference

A task-oriented lookup sheet for the shared in-process store. Find the situation you have, then use the matching API.

> **Core idea:** modules do not need to call each other directly. One module publishes a value or readiness signal under a shared label; another module reads it, subscribes to it, waits for it, or defers work until it exists.

---

## 1. I need to defer a function until a resource is available

**Use:** `store.maelstrom.defer(dependency, callback)`

```ts
const taskId = store.maelstrom.defer("database", (db) => {
    db.query("SELECT 1");
});
```

The callback runs when the `"database"` Rift is open. The resolved dependency value is passed into the callback.

If the callback needs several resources, list every dependency:

```ts
store.maelstrom.defer(
    ["database", "configuration", "logger"],
    (db, config, logger) => {
        logger.info("Starting with configuration", config);
        db.connect(config.database);
    },
);
```

**Important:** every listed dependency must be available. The callback receives the values in the same order as the dependency labels.

## 2. I have created a resource and want waiting tasks to run

**Use:** `store.maelstrom.defer.provide(label, value)`

```ts
store.maelstrom.defer.provide("database", db);
```

For several resources at once:

```ts
store.maelstrom.defer.provide({
    database: db,
    configuration: config,
    logger,
});
```

`provide` publishes each value under its label and drains the deferred-task scheduler. It replaces the current value for that label, rather than relying on a one-time first open.

## 3. I only need to announce that something is ready

**Use:** `store.maelstrom.defer.resolve(label)`

```ts
store.maelstrom.defer.resolve("plugin-system-ready");
```

This opens the label with `undefined`. It is a readiness signal, not a resource handoff.

If another module needs an actual object or value, use `provide` instead.

## 4. I need to check whether a resource has been provided

**Use:** `has` and `get`

```ts
const ready = store.maelstrom.defer.has("database");
const db = store.maelstrom.defer.get<Database>("database");
```

- `has(label)` answers whether the label is currently open.
- `get(label)` returns its current value, or `undefined` if no value is available.

## 5. I need to cancel a deferred function that has not run yet

**Use:** the task ID returned by `defer`

```ts
const taskId = store.maelstrom.defer("database", (db) => {
    db.connect();
});

// Later, if it is still pending:
store.maelstrom.defer.cancel(taskId);
```

Cancellation applies to pending tasks. A task that has already started running is not cancelled by this method.

## 6. I need to see what deferred work is waiting

**Use:** `inspect`

```ts
const status = store.maelstrom.defer.inspect();

console.log(status.stats);
console.log(status.pending);
console.log(status.running);
```

Pending entries include their dependency labels and the labels that are still missing. The stats report registered, executed, completed, failed, and cancelled tasks.

## 7. I need to wait for one named resource and then continue

**Use:** a Rift's `wait()`

```ts
const database = await store.maelstrom.rift("database").wait();
```

With an explicit timeout:

```ts
const database = await store.maelstrom.rift("database").wait(5_000);
```

A Rift is a named slot that may not have been opened yet. `wait()` waits for that slot to open; without a timeout it waits indefinitely.

Use `defer` instead when you want to register work and let the scheduler invoke it automatically once dependencies are ready.

## 8. I need to run a function as soon as one named resource opens

**Use:** `waiter`

```ts
store.maelstrom.waiter("database", (db) => {
    db.connect();
});
```

If the label is already open, the callback runs immediately. Otherwise, it is attached to that label's Rift.

## 9. I need to run a function only after several signals have all fired

**Use:** `waiter` with an array of labels

```ts
store.maelstrom.waiter(
    ["database-ready", "routes-ready", "plugins-ready"],
    () => {
        startApplication();
    },
);
```

This is an **all-of** condition: every listed label must open before the callback runs.

The waiter returns an ID. `waiter.cancel(id)` can cancel a pending multi-label waiter.

## 10. I need to publish a named result for another module to read

**Use:** `place`

```ts
store.maelstrom.rift.place("database", db);
```

Read it elsewhere:

```ts
const db = store.maelstrom.rift.get_value<Database>("database");
```

The label is the shared rendezvous point. Both modules must use the same label and the same shared Store instance.

## 11. I need to read a named result and record that read

**Use:** `read`

```ts
const db = store.maelstrom.rift.read<Database>("database");
```

`read` returns the current value and records the operation in the result surface.

If you only want the current value without recording a `get` operation, use `get_value`.

## 12. I need to inspect or reset a named Rift

**Use:** `rift`, `inspect`, `reset`, or `delete`

```ts
const resource = store.maelstrom.rift<Database>("database");

console.log(resource.isOpen);
console.log(resource.current);

store.maelstrom.rift.inspect();
store.maelstrom.rift.reset("database");
store.maelstrom.rift.delete("database");
```

- `rift(label)` gets or creates the named slot.
- `inspect()` lists the known slots and their open/claim state.
- `reset(label)` closes the slot again and gives it a fresh wait gate.
- `delete(label)` removes the slot from the registry.

Resetting or deleting a label affects every module using that same Store instance and label.

## 13. I need a regular shared key/value entry

**Use:** the Store's ordinary `set` and `get`

```ts
store.set("active-user", user);
const currentUser = store.get("active-user");
```

Use this for ordinary shared values. Use named Rifts when the value is also a readiness/resource signal that other work should wait on.

## 14. I need to react whenever a regular key changes

**Use:** `subscribe`

```ts
const unsubscribe = store.subscribe("active-user", (value, previous, key) => {
    console.log(key, previous, "->", value);
});

store.set("active-user", nextUser);

// Stop receiving updates:
unsubscribe();
```

For every key change, use the all-key subscription form supported by the Store:

```ts
const unsubscribe = store.subscribe((value, previous, key) => {
    console.log("Changed:", key, value);
});
```

## 15. I need to wait until a regular key exists or meets a condition

**Use:** `wait`, `waitFor`, or `waitChange`

```ts
const token = await store.wait("token");
```

Wait for a condition:

```ts
const count = await store.waitFor("count", (value) => value >= 10);
```

Ignore the current value and wait for a subsequent change:

```ts
const nextToken = await store.waitChange("token");
```

A regular Store wait can also be bounded with `timeout` or cancelled with an `AbortSignal`:

```ts
const controller = new AbortController();

const token = await store.wait("token", {
    timeout: 5_000,
    signal: controller.signal,
});
```

## 16. I need namespaced reactive state rather than an ordinary Store key

**Use:** `store.state`

```ts
store.state.set("active-user", user);
const currentUser = store.state.get("active-user");
```

Subscribe to that state key:

```ts
const unsubscribe = store.state.subscribe("active-user", (value) => {
    console.log(value);
});
```

The state API is addressed by root, master, and slave namespace values. Defaults are supplied by the Store; pass options when a module needs a separate namespace:

```ts
const scope = {
    globalKey: "APPLICATION",
    ms_reg: "AUTH",
    sl_reg: "SESSION",
};

store.state.set("active-user", user, scope);
const currentUser = store.state.get("active-user", scope);
```

Use the same namespace values when reading, writing, or subscribing to the same state.

## 17. I need a state value to survive removal from the active state map

**Use:** `persist` and `unpersist`

```ts
store.state.set("configuration", config);
store.state.persist("configuration");
```

A persisted value is retained in the Store's in-memory persistent namespace and can be restored into the active state map when read.

```ts
store.state.unpersist("configuration");
```

**This is not disk persistence.** It is an in-memory persistence layer within the shared Store instance.

## 18. I need to load a module once and share the loaded result

**Use:** `store.maelstrom.rift.load`

```ts
const module = await store.maelstrom.rift.load<MyModule>("@scope/my-module");
```

Concurrent calls for the same normalized module key share the in-flight load. Once loaded, subsequent calls receive the cached module value.

For a synchronous CommonJS `require` path where available:

```ts
const module = store.maelstrom.module.require<MyModule>("@scope/my-module");
```

The synchronous form is unavailable in ESM/browser contexts and returns `undefined` there rather than providing an asynchronous import.

## 19. I need to check whether a module is loaded or retrieve it if it is

**Use:** `isLoaded` and `getLoaded`

```ts
const loaded = store.maelstrom.module.isLoaded("@scope/my-module");
const module = store.maelstrom.module.getLoaded<MyModule>("@scope/my-module");
```

These inspect the module cache; they do not initiate a load.

## 20. I need to find a named export from loaded modules

**Use:** `export_of`

```ts
const helper = store.maelstrom.module.export_of<(value: string) => string>("helper");
```

If the same export name is found in more than one loaded module, the lookup is ambiguous and throws. Specify the module when you want a particular source:

```ts
const helper = store.maelstrom.module.export_of("helper", "@scope/my-module");
```

## 21. I need to inspect the latest recorded operation or all recorded results

**Use:** `result`, `results`, `resultsFrom`, or `onResult`

```ts
const one = store.maelstrom.rift.result("database");
const all = store.maelstrom.results;
const placed = store.maelstrom.rift.resultsFrom("place");
```

Listen for recorded results:

```ts
const unsubscribe = store.maelstrom.rift.onResult((result) => {
    console.log(result);
});
```

The results surface is derived from the Rift registry; it is not a second independent result store.

---

## Choosing the right mechanism

| If the problem is… | Use… |
|---|---|
| Run this function once its resource(s) exist | `maelstrom.defer(labels, callback)` |
| Publish a resource for waiting work | `maelstrom.defer.provide(label, value)` |
| Announce readiness without a value | `maelstrom.defer.resolve(label)` |
| Await one named resource with a Promise | `maelstrom.rift(label).wait()` |
| Run a callback when one label opens | `maelstrom.waiter(label, callback)` |
| Run only after all labels open | `maelstrom.waiter(labels, callback)` |
| Publish/read a named rendezvous value | `maelstrom.rift.place` / `get_value` |
| Store an ordinary shared key/value | `set` / `get` |
| React to ordinary key changes | `subscribe` |
| Wait for an ordinary key or condition | `wait` / `waitFor` / `waitChange` |
| Use root/master/slave namespaced reactive state | `state` |
| Load and cache a module | `maelstrom.rift.load` |

## A few rules that prevent confusion

1. **Use one shared Store instance.** The shared namespace is shared by modules that resolve and use the same live Store instance in the same process.
2. **Labels are contracts.** A producer and consumer must agree on the exact label and on the value represented by that label.
3. **Use `defer` for scheduled continuation.** It is the direct answer to “I need this function to wait until a resource exists.”
4. **Use `wait()` when the caller needs a Promise.** Use `waiter` when the caller wants a callback.
5. **Use `provide` for a value; `resolve` for a signal.** A signal intentionally carries `undefined`.
6. **A deferred task waits for all declared dependencies.** It does not run when only the first one appears.
7. **Rifts are one-shot until reset.** `open` does not replace an already-open value. `defer.provide` resets the Rift before opening it with the new value.
8. **This is in-process shared memory.** Separate Node processes and worker isolates do not automatically share this instance.









</div>
<div style="font-size: 9px;  text-align: right">


## <span style="font-size: 10.5px;"> ⇦✦──⇦✦──✦──✦──←'pew pew'<span> <span style="font-size: 24px;"> 🧙 [TOC] <span>
<div style="font-size: 14px;  text-align: right">



</div>
 

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[PLATFORM]</span> </strong></summary>

<ul style="list-style: none; padding-left: 0;">
  <li><a href="../platform/TOC.md#TOC">TOC</a></li>
  <li><a href="../platform/ATOM.md#ATOM">ATOM</a></li>
  <li><a href="../platform/CELLS.md#CELLS">CELLS</a></li>
  <li><a href="../platform/CONVERGENCE.md#CONVERGENCE">CONVERGENCE</a></li>
  <li><a href="../platform/FORMS.md#FORMS">FORMS</a></li>
  <li><a href="../platform/GLOBAL_QUAD_KEY_CONTEXT.md#GLOBAL_QUAD_KEY_CONTEXT">GLOBAL_QUAD_KEY_CONTEXT</a></li>
  <li><a href="../platform/PERFORMANCE_DIVISION.md#PERFORMANCE_DIVISION">PERFORMANCE_DIVISION</a></li>
  <li><a href="../platform/REACTIVITY.md#REACTIVITY">REACTIVITY</a></li>
  <li><a href="../platform/ROUTE_COMPONENTS.md#ROUTE_COMPONENTS">ROUTE_COMPONENTS</a></li>
  <li><a href="../platform/SAURON.md#SAURON">SAURON</a></li>
  <li><a href="../platform/SIGNALS.md#SIGNALS">SIGNALS</a></li>
  <li><a href="../platform/STAFF.md#STAFF">STAFF</a></li>
  <li><a href="../platform/THE_WARLOCK_MODE.md#THE_WARLOCK_MODE">THE_WARLOCK_MODE</a></li>
  <li><a href="../platform/THE_WIZARD_MODE.md#THE_WIZARD_MODE">THE_WIZARD_MODE</a></li>
  <li><a href="../platform/WARLOCKS_NECROMANCY_OBSERVATORY.md#WARLOCKS_NECROMANCY_OBSERVATORY">WARLOCKS_NECROMANCY_OBSERVATORY</a></li>
</ul>

</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[MESSAGE QUEUES / BUSES]</span> </strong></summary>

<ul style="list-style: none; padding-left: 0;">
  <li><a href="../platform/TOC.md#TOC">DISRUPTOR</a></li>
  <li><a href="../platform/ATOM.md#ATOM">STAFF</a></li>
  <li><a href="../platform/CELLS.md#CELLS">CHAINS</a></li>
  <li><a href="../platform/CONVERGENCE.md#CONVERGENCE">XXSR TRICKY</a></li>
</ul>


</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[PLATFORM PRIMTIVES]</span> </strong></summary>

<ul style="list-style: none; padding-left: 0;">
  <li><a href="../primitives/API_WARDS.md#API_WARDS">API_WARDS</a></li>
  <li><a href="../primitives/APPARATIONS_DQ.md#APPARATIONS_DQ">APPARATIONS_DQ</a></li>
  <li><a href="../primitives/ARCHETYPES.md#ARCHETYPES">ARCHETYPES</a></li>
  <li><a href="../primitives/BATCH.md#BATCH">BATCH</a></li>
  <li><a href="../primitives/BINARY.md#BINARY">BINARY</a></li>
  <li><a href="../primitives/CHAINS.md#CHAINS">CHAINS</a></li>
  <li><a href="../primitives/CHRONO_SHIFT.md#CHRONO_SHIFT">CHRONO_SHIFT</a></li>
  <li><a href="../primitives/CHRONOMANCER.md#CHRONOMANCER">CHRONOMANCER</a></li>
  <li><a href="../primitives/CONJURE_LIBRARIES.md#CONJURE_LIBRARIES">CONJURE_LIBRARIES</a></li>
  <li><a href="../primitives/CONJURE_MIMIC.md#CONJURE_MIMIC">CONJURE_MIMIC</a></li>
  <li><a href="../primitives/CRON.md#CRON">CRON</a></li>
  <li><a href="../primitives/DARK_PORTALS.md#DARK_PORTALS">DARK_PORTALS</a></li>
  <li><a href="../primitives/DUPLEX_STREAMS.md#DUPLEX_STREAMS">DUPLEX_STREAMS</a></li>
  <li><a href="../primitives/EMITTER.md#EMITTER">EMITTER</a></li>
  <li><a href="../primitives/EVOCATIONS.md#EVOCATIONS">EVOCATIONS</a></li>
  <li><a href="../primitives/EXECUTE_MASTER.md#EXECUTE_MASTER">EXECUTE_MASTER</a></li>
  <li><a href="../primitives/GATE_MASTER.md#GATE_MASTER">GATE_MASTER</a></li>
  <li><a href="../primitives/GATES.md#GATES">GATES</a></li>
  <li><a href="../primitives/GLYPH_BINDER.md#GLYPH_BINDER">GLYPH_BINDER</a></li>
  <li><a href="../primitives/GOLEMS.md#GOLEMS">GOLEMS</a></li>
  <li><a href="../primitives/GRIMOIRE.md#GRIMOIRE">GRIMOIRE</a></li>
  <li><a href="../primitives/ILLUSIONIST.md#ILLUSIONIST">ILLUSIONIST</a></li>
  <li><a href="../primitives/INCANTATIONS.md#INCANTATIONS">INCANTATIONS</a></li>
  <li><a href="../primitives/JOBS.md#JOBS">JOBS</a></li>
  <li><a href="../primitives/MACHINES_MACHINE.md#MACHINES_MACHINE">MACHINES_MACHINE</a></li>
  <li><a href="../primitives/MICROTASKS.md#MICROTASKS">MICROTASKS</a></li>
  <li><a href="../primitives/MSGS.md#MSGS">MSGS</a></li>
  <li><a href="../primitives/NO_NO_SQUARE_DQ.md#NO_NO_SQUARE_DQ">NO_NO_SQUARE_DQ</a></li>
  <li><a href="../primitives/PERFORMANCE_TIMER.md#PERFORMANCE_TIMER">PERFORMANCE_TIMER</a></li>
  <li><a href="../primitives/PLINKO_MASTER.md#PLINKO_MASTER">PLINKO_MASTER</a></li>
  <li><a href="../primitives/PRIORITY.md#PRIORITY">PRIORITY</a></li>
  <li><a href="../primitives/RDB.md#RDB">RDB</a></li>
  <li><a href="../primitives/RENDERIVITY_DQ.md#RENDERIVITY_DQ">RENDERIVITY_DQ</a></li>
  <li><a href="../primitives/RETRY_MASTER.md#RETRY_MASTER">RETRY_MASTER</a></li>
  <li><a href="../primitives/RUNE_HTTP.md#RUNE_HTTP">RUNE_HTTP</a></li>
  <li><a href="../primitives/S_CLASS.md#S_CLASS">S_CLASS</a></li>
  <li><a href="../primitives/SCHEDULER.md#SCHEDULER">SCHEDULER</a></li>
  <li><a href="../primitives/SENTINEL.md#SENTINEL">SENTINEL</a></li>
  <li><a href="../primitives/SESSION_SIGIL.md#SESSION_SIGIL">SESSION_SIGIL</a></li>
  <li><a href="../primitives/SPEELBOOK.md#SPEELBOOK">SPEELBOOK</a></li>
  <li><a href="../primitives/TIERED_QUEUE.md#TIERED_QUEUE">TIERED_QUEUE</a></li>
  <li><a href="../primitives/TIME_MACHINE.md#TIME_MACHINE">TIME_MACHINE</a></li>
  <li><a href="../primitives/TOME_OF_SECRETS.md#TOME_OF_SECRETS">TOME_OF_SECRETS</a></li>
  <li><a href="../primitives/TRANSMOGRIFY.md#TRANSMOGRIFY">TRANSMOGRIFY</a></li>
  <li><a href="../primitives/TYPES_MACHINE.md#TYPES_MACHINE">TYPES_MACHINE</a></li>
  <li><a href="../primitives/TYR.md#TYR">TYR</a></li>
  <li><a href="../primitives/VAULTS.md#VAULTS">VAULTS</a></li>
  <li><a href="../primitives/VENOM.md#VENOM">VENOM</a></li>
  <li><a href="../primitives/WARDS.md#WARDS">WARDS</a></li>
  <li><a href="../primitives/WIZARD_KEEP.md#WIZARD_KEEP">WIZARD_KEEP</a></li>
  <li><a href="../primitives/WORKERS.md#WORKERS">WORKERS</a></li>
  <li><a href="../primitives/WORKFLOW.md#WORKFLOW">WORKFLOW</a></li>
</ul>

</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[SOLUTIONS]</span> </strong></summary>

<ul style="list-style: none; padding-left: 0;">
  <li><a href="../solutions/BATCH.md#BATCH">BATCH</a></li>
  <li><a href="../solutions/CELLS.md#CELLS">CELLS</a></li>
  <li><a href="../solutions/CHEERIO.md#CHEERIO">CHEERIO</a></li>
  <li><a href="../solutions/CIRCUIT_BREAKER.md#CIRCUIT_BREAKER">CIRCUIT_BREAKER</a></li>
  <li><a href="../solutions/COMPRESSION.md#COMPRESSION">COMPRESSION</a></li>
  <li><a href="../solutions/CONCURRENT.md#CONCURRENT">CONCURRENT</a></li>
  <li><a href="../solutions/CQRS.md#CQRS">CQRS</a></li>
  <li><a href="../solutions/DEBOUNCE.md#DEBOUNCE">DEBOUNCE</a></li>
  <li><a href="../solutions/DEFER.md#DEFER">DEFER</a></li>
  <li><a href="../solutions/DEV_TOOLS.md#DEV_TOOLS">DEV_TOOLS</a></li>
  <li><a href="../solutions/DIFFPATCH.md#DIFFPATCH">DIFFPATCH</a></li>
  <li><a href="../solutions/DISTRIBUTED_EXE.md#DISTRIBUTED_EXE">DISTRIBUTED_EXE</a></li>
  <li><a href="../solutions/DISTRIBUTED_LOGIC_GATES.md#DISTRIBUTED_LOGIC_GATES">DISTRIBUTED_LOGIC_GATES</a></li>
  <li><a href="../solutions/DISTRIBUTED_PORTAL.md#DISTRIBUTED_PORTAL">DISTRIBUTED_PORTAL</a></li>
  <li><a href="../solutions/DISTRIBUTED_REACTIVE_STATE.md#DISTRIBUTED_REACTIVE_STATE">DISTRIBUTED_REACTIVE_STATE</a></li>
  <li><a href="../solutions/DRS.md#DRS">DRS</a></li>
  <li><a href="../solutions/EPHEMERAL_STATE.md#EPHEMERAL_STATE">EPHEMERAL_STATE</a></li>
  <li><a href="../solutions/FULL_TEXT_SEARCH.md#FULL_TEXT_SEARCH">FULL_TEXT_SEARCH</a></li>
  <li><a href="../solutions/HTTP_CLIENT.md#HTTP_CLIENT">HTTP_CLIENT</a></li>
  <li><a href="../solutions/LOGIC_GATES.md#LOGIC_GATES">LOGIC_GATES</a></li>
  <li><a href="../solutions/LONGPOLL.md#LONGPOLL">LONGPOLL</a></li>
  <li><a href="../solutions/LWW.md#LWW">LWW</a></li>
  <li><a href="../solutions/MV.md#MV">MV</a></li>
  <li><a href="../solutions/OPTIMISTIC.md#OPTIMISTIC">OPTIMISTIC</a></li>
  <li><a href="../solutions/OR.md#OR">OR</a></li>
  <li><a href="../solutions/PERFORMANCE_TIMER.md#PERFORMANCE_TIMER">PERFORMANCE_TIMER</a></li>
  <li><a href="../solutions/PN.md#PN">PN</a></li>
  <li><a href="../solutions/QUEUE_TIERED.md#QUEUE_TIERED">QUEUE_TIERED</a></li>
  <li><a href="../solutions/RAFT.md#RAFT">RAFT</a></li>
  <li><a href="../solutions/RATE_LIMIT.md#RATE_LIMIT">RATE_LIMIT</a></li>
  <li><a href="../solutions/REACTIVE_CHAINS.md#REACTIVE_CHAINS">REACTIVE_CHAINS</a></li>
  <li><a href="../solutions/REVERSE_HEART_BEAT_MGR.md#REVERSE_HEART_BEAT_MGR">REVERSE_HEART_BEAT_MGR</a></li>
  <li><a href="../solutions/RIFTS.md#RIFTS">RIFTS</a></li>
  <li><a href="../solutions/RIFT_MAELSTROM.md#RIFT_MAELSTROM">RIFT_MAELSTROM</a></li>
  <li><a href="../solutions/SEMAPHORE.md#SEMAPHORE">SEMAPHORE</a></li>
  <li><a href="../solutions/SEND_SUB.md#SEND_SUB">SEND_SUB</a></li>
  <li><a href="../solutions/SIGNALS.md#SIGNALS">SIGNALS</a></li>
  <li><a href="../solutions/SPREADSHEET.md#SPREADSHEET">SPREADSHEET</a></li>
  <li><a href="../solutions/SSE.md#SSE">SSE</a></li>
  <li><a href="../solutions/STAFF.md#STAFF">STAFF</a></li>
  <li><a href="../solutions/STREAMS.md#STREAMS">STREAMS</a></li>
  <li><a href="../solutions/SWR.md#SWR">SWR</a></li>
  <li><a href="../solutions/TEMPORAL_SHIFT.md#TEMPORAL_SHIFT">TEMPORAL_SHIFT</a></li>
  <li><a href="../solutions/THROTTLE.md#THROTTLE">THROTTLE</a></li>
  <li><a href="../solutions/WIRE_TAPS.md#WIRE_TAPS">WIRE_TAPS</a></li>
  <li><a href="../solutions/WORKSPACE_GLOBAL.md#WORKSPACE_GLOBAL">WORKSPACE_GLOBAL</a></li>
  <li><a href="../solutions/WS.md#WS">WS</a></li>
  <li><a href="../solutions/XXSR.md#XXSR">XXSR</a></li>
  <li><a href="../solutions/YATA.md#YATA">YATA</a></li>
  <li><a href="../solutions/YIMIR.md#YIMIR">YIMIR</a></li>
</ul>

</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[DATABASES]</span> </strong></summary>

<ul style="list-style: none; padding-left: 0;">
  <li><a href="../databases/BDB.md#BDB">BDB</a></li>
  <li><a href="../databases/BINARY.md#BINARY">BINARY</a></li>
  <li><a href="../databases/COOKIE.md#COOKIE">COOKIE</a></li>
  <li><a href="../databases/GDB.md#GDB">GDB</a></li>
  <li><a href="../databases/GT.md#GT">GT</a></li>
  <li><a href="../databases/HADRON_COLLIDER.md#HADRON_COLLIDER">HADRON_COLLIDER</a></li>
  <li><a href="../databases/IDB_HADRON_COLLIDER.md#IDB_HADRON_COLLIDER">IDB_HADRON_COLLIDER</a></li>
  <li><a href="../databases/IDB_HC_SINK.md#IDB_HC_SINK">IDB_HC_SINK</a></li>
  <li><a href="../databases/IDB_KVDB.md#IDB_KVDB">IDB_KVDB</a></li>
  <li><a href="../databases/IDB_RDB.md#IDB_RDB">IDB_RDB</a></li>
  <li><a href="../databases/KVDB.md#KVDB">KVDB</a></li>
  <li><a href="../databases/LS.md#LS">LS</a></li>
  <li><a href="../databases/MEMORY.md#MEMORY">MEMORY</a></li>
  <li><a href="../databases/RDB.md#RDB">RDB</a></li>
  <li><a href="../databases/REGISTRIES.md#REGISTRIES">REGISTRIES</a></li>
  <li><a href="../databases/SAURON.md#SAURON">SAURON</a></li>
  <li><a href="../databases/SECURE_COOKIE.md#SECURE_COOKIE">SECURE_COOKIE</a></li>
  <li><a href="../databases/SS.md#SS">SS</a></li>
  <li><a href="../databases/TDB.md#TDB">TDB</a></li>
  <li><a href="../databases/VDB.md#VDB">VDB</a></li>
</ul>


</details>


<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[BAG OF TRICKS]</span> </strong></summary>



<ul style="list-style: none; padding-left: 0;">
  <li><a href="../bag_of_tricks/BARRIER.md#BARRIER">BARRIER</a></li>
  <li><a href="../bag_of_tricks/CALL_IF.md#CALL_IF">CALL_IF</a></li>
  <li><a href="../bag_of_tricks/CHAIN_RECHAIN.md#CHAIN_RECHAIN">CHAIN_RECHAIN</a></li>
  <li><a href="../bag_of_tricks/chain.md#chain">chain</a></li>
  <li><a href="../bag_of_tricks/clamp.md#clamp">clamp</a></li>
  <li><a href="../bag_of_tricks/deferred.md#deferred">deferred</a></li>
  <li><a href="../bag_of_tricks/evaluator.md#evaluator">evaluator</a></li>
  <li><a href="../bag_of_tricks/finally.md#finally">finally</a></li>
  <li><a href="../bag_of_tricks/gate.md#gate">gate</a></li>
  <li><a href="../bag_of_tricks/ignore_arg.md#ignore_arg">ignore_arg</a></li>
  <li><a href="../bag_of_tricks/invoke.md#invoke">invoke</a></li>
  <li><a href="../bag_of_tricks/is_defined.md#is_defined">is_defined</a></li>
  <li><a href="../bag_of_tricks/is_not_defined.md#is_not_defined">is_not_defined</a></li>
  <li><a href="../bag_of_tricks/LAZY.md#LAZY">LAZY</a></li>
  <li><a href="../bag_of_tricks/MAYBE_PROMISE.md#MAYBE_PROMISE">MAYBE_PROMISE</a></li>
  <li><a href="../bag_of_tricks/maybe.md#maybe">maybe</a></li>
  <li><a href="../bag_of_tricks/mcr_combo.md#mcr_combo">mcr_combo</a></li>
  <li><a href="../bag_of_tricks/ONCE.md#ONCE">ONCE</a></li>
  <li><a href="../bag_of_tricks/or_default.md#or_default">or_default</a></li>
  <li><a href="../bag_of_tricks/patch_state.md#patch_state">patch_state</a></li>
  <li><a href="../bag_of_tricks/retry_with_backoff.md#retry_with_backoff">retry_with_backoff</a></li>
  <li><a href="../bag_of_tricks/run_with_retry.md#run_with_retry">run_with_retry</a></li>
  <li><a href="../bag_of_tricks/SERIAL_EXECUTOR.md#SERIAL_EXECUTOR">SERIAL_EXECUTOR</a></li>
  <li><a href="../bag_of_tricks/set_keys.md#set_keys">set_keys</a></li>
  <li><a href="../bag_of_tricks/set_prev.md#set_prev">set_prev</a></li>
  <li><a href="../bag_of_tricks/sleep.md#sleep">sleep</a></li>
  <li><a href="../bag_of_tricks/tap.md#tap">tap</a></li>
  <li><a href="../bag_of_tricks/thenable.md#thenable">thenable</a></li>
  <li><a href="../bag_of_tricks/TIMED_PROMISE.md#TIMED_PROMISE">TIMED_PROMISE</a></li>
  <li><a href="../bag_of_tricks/to_promise.md#to_promise">to_promise</a></li>
  <li><a href="../bag_of_tricks/try_catch.md#try_catch">try_catch</a></li>
  <li><a href="../bag_of_tricks/unreachable.md#unreachable">unreachable</a></li>
  <li><a href="../bag_of_tricks/WAIT_AND_PROMISE.md#WAIT_AND_PROMISE">WAIT_AND_PROMISE</a></li>
</ul>

</details>



<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[TODO & IDEAS]</span> </strong></summary>


<ul style="list-style: none; padding-left: 0;">
  <li><a href="TO_DO_AND_IDEAS.md#todo--ideas">TODO &amp; IDEAS</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#the_wizard">[THE_WIZARD]</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#primitives">[PRIMITIVES]</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#next_level_ideas">[NEXT_LEVEL_IDEAS]</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#kvdb">KVDB</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#prxcdb">PRxCDB</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#staff">STAFF</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#--e--mc2--">E = mc^2</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#native-custom-built-solutions">NATIVE, CUSTOM BUILT SOLUTIONS</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#storage-context">STORAGE CONTEXT</a></li>
  <li><a href="TO_DO_AND_IDEAS.md#other">OTHER</a></li>
</ul>

</details>

<br/>

```
                          🗨️           ☁️
                       🌴🌵                             🧙            
┌──────────┐          ┌──────────────────────────┐
└──────────┘          └──────────────────────────┘
              ☁️      
  🔮        🏜️🌵🏜️🌴🌵                         🏜️
┌─────────────────────────────┐        ┌─────────┐
└─────────────────────────────┘        └─────────┘

                                         🏜️🌴🌵
           ┌──────────────────────────────────────┐
           └──────────────────────────────────────┘
         ☁️                  
           🌴🌴                🏜️🌴                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🏜️🌴🏜️🌵      🌪️                    🧙     🏝️🏜️
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️       ☁️                              
    🌴🌵                                     🌵🏜️
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                            🌵🌴🌴       
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

         🌵🌴                      🌵          🌴
┌────────────────┐        ┌───────────────────────┐
└────────────────┘        └───────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                     🌴🌵          🌵🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵          🌵🌵                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
            ☁️          ☁️                     
                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘

  🌵🌴               🌴🌵          🌵🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴          🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
            ☁️          ☁️                     
  🌴🌵                         🌵🌵          🏜️🌴
┌──────────┐       ┌───────────────────────────────┐
└──────────┘       └───────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

            🌵🌴                  🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵          🧙🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️       ☁️                              
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                          🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵      🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

             🌵🌴                                             🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                                🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                    🌵🌴                              🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵                          🌴                     
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                             

  🌴                            🌵 
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵🌴                                       
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                               🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
                                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                 🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                                           🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵                🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌴                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                            🌵             🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                             🌵
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                   ☁️                     
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵   🌴🌴                                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                           🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
  🌵                           
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                  🌵           🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵           🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

   🌵        🌵🌴                             
┌──────────────────┐        ┌───────────────┐
└──────────────────┘        └───────────────┘
                   ☁️          ☁️                     
🌴                                      🌵        🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵            🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

        🌵🌴                                   🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                           🌵                           
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                            🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘
                   ☁️          ☁️                     
  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                              🌵🌵
┌───────────────────┐       ┌────────┐       ┌────┐
└───────────────────┘       └────────┘       └────┘

                                              🌵🌴                      
                   ┌──────────────────────────────┐
                   └──────────────────────────────┘
                   ☁️          ☁️                     
  🌴                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵                   🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴              🌵
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                        ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                               🌵🌴                          
                       ┌──────────────────────────┐
                       └──────────────────────────┘
         ☁️                  
  🌴🌵                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵        🌴                                🌵
┌────────────────────────┐       ┌────────────────┐
└────────────────────────┘       └────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
      ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
              ☁️      
  🔮        🏜️🌵🏜️🌴🌵                         🏜️
┌─────────────────────────────┐        ┌─────────┐
└─────────────────────────────┘        └─────────┘

                                         🏜️🌴🌵
           ┌──────────────────────────────────────┐
           └──────────────────────────────────────┘
         ☁️                  
           🌴🌴                🏜️🌴                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🏜️🌴🏜️🌵      🌪️                    🧙     🏝️🏜️
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️       ☁️                              
    🌴🌵                                     🌵🏜️
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                            🌵🌴🌴       
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

         🌵🌴                      🌵          🌴
┌────────────────┐        ┌───────────────────────┐
└────────────────┘        └───────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                     🌴🌵          🌵🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵          🌵🌵                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
            ☁️          ☁️                     
                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘

  🌵🌴               🌴🌵          🌵🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴          🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
            ☁️          ☁️                     
  🌴🌵                         🌵🌵          🏜️🌴
┌──────────┐       ┌───────────────────────────────┐
└──────────┘       └───────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

            🌵🌴                  🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵          🧙🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️       ☁️                              
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                          🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵      🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

             🌵🌴                                             🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                                🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                    🌵🌴                              🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵                          🌴                     
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                             

  🌴                            🌵 
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵🌴                                       
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                               🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
                                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                 🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                                           🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵                🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌴                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                            🌵             🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                             🌵
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                   ☁️                     
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵   🌴🌴                                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                           🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
  🌵                           
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                  🌵           🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵           🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

   🌵        🌵🌴                             
┌──────────────────┐        ┌───────────────┐
└──────────────────┘        └───────────────┘
                   ☁️          ☁️                     
🌴                                      🌵        🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵            🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

        🌵🌴                                   🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                           🌵                           
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                            🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘
                   ☁️          ☁️                     
  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                              🌵🌵
┌───────────────────┐       ┌────────┐       ┌────┐
└───────────────────┘       └────────┘       └────┘

                                              🌵🌴                      
                   ┌──────────────────────────────┐
                   └──────────────────────────────┘
                   ☁️          ☁️                     
  🌴                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵                   🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴              🌵
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                        ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                               🌵🌴                          
                       ┌──────────────────────────┐
                       └──────────────────────────┘
         ☁️                  
  🌴🌵                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵        🌴                                🌵
┌────────────────────────┐       ┌────────────────┐
└────────────────────────┘       └────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
      ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

              ☁️      
  🔮        🏜️🌵🏜️🌴🌵                         🏜️
┌─────────────────────────────┐        ┌─────────┐
└─────────────────────────────┘        └─────────┘

                                         🏜️🌴🌵
           ┌──────────────────────────────────────┐
           └──────────────────────────────────────┘
         ☁️                  
           🌴🌴                🏜️🌴                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🏜️🌴🏜️🌵      🌪️                    🧙     🏝️🏜️
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️       ☁️                              
    🌴🌵                                     🌵🏜️
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                            🌵🌴🌴       
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

         🌵🌴                      🌵          🌴
┌────────────────┐        ┌───────────────────────┐
└────────────────┘        └───────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                     🌴🌵          🌵🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵          🌵🌵                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
            ☁️          ☁️                     
                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘

  🌵🌴               🌴🌵          🌵🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴          🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
            ☁️          ☁️                     
  🌴🌵                         🌵🌵          🏜️🌴
┌──────────┐       ┌───────────────────────────────┐
└──────────┘       └───────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

            🌵🌴                  🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵          🧙🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️       ☁️                              
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                          🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵      🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

             🌵🌴                                             🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                                🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                    🌵🌴                              🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵                          🌴                     
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                             

  🌴                            🌵 
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵🌴                                       
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                               🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
                                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                 🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                                           🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵                🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌴                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                            🌵             🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                             🌵
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                   ☁️                     
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵   🌴🌴                                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                           🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
  🌵                           
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                  🌵           🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵           🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

   🌵        🌵🌴                             
┌──────────────────┐        ┌───────────────┐
└──────────────────┘        └───────────────┘
                   ☁️          ☁️                     
🌴                                      🌵        🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵            🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

        🌵🌴                                   🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                           🌵                           
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                            🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘
                   ☁️          ☁️                     
  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                              🌵🌵
┌───────────────────┐       ┌────────┐       ┌────┐
└───────────────────┘       └────────┘       └────┘

                                              🌵🌴                      
                   ┌──────────────────────────────┐
                   └──────────────────────────────┘
                   ☁️          ☁️                     
  🌴                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵                   🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴              🌵
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                        ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                               🌵🌴                          
                       ┌──────────────────────────┐
                       └──────────────────────────┘
         ☁️                  
  🌴🌵                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵        🌴                                🌵
┌────────────────────────┐       ┌────────────────┐
└────────────────────────┘       └────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
      ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                  🌵             🌴                         🌵
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘
```
</div>
</div>
