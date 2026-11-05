<h1>DX: <span style="font-size:18px;" >The Wizard's Arsenal</span></h1>

<p align="right"><em>The most opinionated platform... ever.</em></p>
<p align="right"><em>Trust me... I'm a fucking wizard... 🧙</em></p>

<div style="display: grid; grid-template-columns: 4fr 2fr; gap: 20px;">
<div>

<span  style="font-family: monospace"> 


> [!NOTE] TLDR
>
> Take what is currently... lacking in the ux dept. and give it the updates they desperatly need.



</span>


## Built-in API Extensions

Extensions to native JavaScript objects that improve developer experience by adding commonly needed operations while preserving the original APIs.

The package extends native classes and exposes their implementations through `globalThis`, allowing them to be accessed without importing each class individually.


> [!IMPORTANT] UPDATE!!
>
> Where appropriate, there will be some additional functions that will surface as a complete byteop variant where each of the currently defined functions within this solution, will be getting a complete brother... or sister to stand beside it.
>
> This is not a priority for the solution, merely some extra goodies.
>
> With the performance difference between the two, I have found the use case for myself to create binary versions of each. Items like map and set are already in play and can be used. Items like array, will not be getting conversions.
> Conversions completed so far:
> 
> - map
>   - fn: M2B
>   - interface: M2BI
> - set
>   - fn: SET2B
>   - interface: SET2BI
> - boolean
>   - fn: B2B 
>   - interface: B2BI
>
> Each fn available globally, so your free to call without actually importing the implementation itself. The byteop variants will be mirror versions.
>
> For the ones that aren't familiar, don't worry I got you...
>
> There will be some accompanying utilities that will help with the use of the new fns as they either need to be converted to binary, or have values converted to use a pid in its place.
>
> The pid converter will come with a 1-1 conversion as well as the ability to convert using the 3/4 scoped channel format.
>
> Due to wanting to create the absolute dx possible, despite making a much more complex system available... each of the fns with have the same named fn, taking in the same props where applicable. For exmaple, getNestedMap... already has a stand in... getNestedMap, but inside the byte orientated class, taking in the same 3 props.
>
> There will be 2 encoders available, cbor and avro.
>
> Cbor being a bit more... lenient of the two, I guess is the right word. As you simply call upon encode or decode... and away you go. Where as with avro, you do need to set up a defined shapped schema in order to use it. Both of their use cases, but avro compresses to a much smaller figure and is 6x faster than cbor, if I remember correctly. It doesn't sound like much... but at these speed it adds up to a lot.
>
> For example, while acheiving the 900+ mill ops/sec with benching, obviously that is not a realistic goal when it comes to the users usage path, but we need to get as close as we can and having a 6x mulitplier when your doing 900 mill ops/sec... is fucking huge.


## Global APIs

| Global | Extends | Implementation | Purpose |
|---|---|---|---|
| `N2` | `Number` | `N2I` | Numeric operations, range mapping, formatting, and validation |
| `M2` | `Map` | `M2I` | Map access helpers, transformations, grouping, and comparison |
| `I2` | Iterator | `I2I` | Lazy iterator pipelines and collection operations |
| `ER2` | `Error` | `ER2I` | Error normalization, cloning, serialization, and wrapping |
| `D2` | `Date` | `D2I` | Date arithmetic, boundaries, comparisons, and formatting |
| `A2` | `Array` | `A2I` | Array manipulation, selection, grouping, and aggregation |
| `SET2` | `Set` | `SET2I` | Extended set operations |
| `O2` | `Object` | `O2I` | Extended object operations |
| `WM2` | `WeakMap` | `WM2I` | Extended weak-map operations |
| `WS2` | `WeakSet` | `WS2I` | Extended weak-set operations |
| `P2` | `Promise` | `P2I` | Extended promise operations |
| `S2` | `String` | `S2I` | Extended string operations |
| `U82` | `Uint8Array` | `U82I` | Extended byte-array operations |
| `USP2` | `URLSearchParams` | `USP2I` | Extended URL parameter operations |

The global declarations provide TypeScript access to these APIs. `MaybePromise` is also declared globally as a type alias.

## Quick Reference

## `A2` — Array

`A2I` extends `Array` and adds collection helpers. Methods returning arrays generally return `A2I` instances.

| Method | Description |
|---|---|
| `first()` / `last()` | Retrieve the first or last element |
| `isEmpty()` / `isNotEmpty()` | Check whether the array contains elements |
| `clear()` | Empty the array in place |
| `clone()` | Create a shallow copy |
| `unique()` / `compact()` | Remove duplicates or nullish values |
| `take()` / `takeLast()` | Select elements from either end |
| `drop()` / `dropLast()` | Remove elements from either end |
| `chunk(size)` | Split into fixed-size arrays |
| `flatten(depth?)` | Flatten nested arrays |
| `flatMap(callback)` | Map and flatten |
| `distinctBy(callback)` | Deduplicate by a computed key |
| `groupBy(callback)` | Group elements into a map |
| `partition(callback)` | Split into matching and nonmatching arrays |
| `insert(index, ...items)` | Insert elements in place |
| `removeAt(index)` | Remove and return an element |
| `remove(value)` / `removeAll(value)` | Remove one or all matching values |
| `replaceAt(index, value)` | Replace an element and return the previous value |
| `move(from, to)` / `swap(first, second)` | Reorder elements in place |
| `sample()` | Return a random element |
| `shuffle()` | Shuffle in place |
| `countBy(callback)` | Count matching elements |
| `sum(callback?)` / `average(callback?)` | Calculate numeric aggregates |
| `min(callback?)` / `max(callback?)` | Find minimum or maximum element |
| `equals(array)` | Compare arrays using `Object.is` |
| `includesAll(values)` | Check whether every supplied value exists |
| `intersects(values)` | Check whether any supplied value exists |

Static helpers include `A2I.from()` and `A2I.of()`.


## `B2` — Byte Bool

`B2I` replaces boolean properties and boolean maps with a zero-allocation, PID-indexed `Uint8Array` lane. One byte per PID, no boxing, no `Map`, no per-entry allocation — `set`, `get`, and `toggle` are O(1) array stores, and `clear` is a single `fill(0)`.

| Method | Description |
|---|---|
| `set(pid, value)` | Set the boolean flag for a PID |
| `true(pid, value)` | Set the flag to `1` (`value` is accepted for call-site symmetry and ignored) |
| `false(pid, value)` | Set the flag to `0` (`value` is accepted for call-site symmetry and ignored) |
| `get(pid)` | Return `true` if the PID's flag is `1`, else `false` |
| `toggle(pid)` | Flip the PID's flag and return the new state |
| `clear()` | Zero every flag in place; no reallocation |
| `flags` | The backing `Uint8Array`, indexed by PID |

## `D2` — Date

`D2` extends `Date` and keeps the standard `Date` API, adding immutable date arithmetic, calendar helpers, human-readable diffs, custom formatting, and locale-aware parsing. Every method returns a new `D2I`; the receiver is never mutated.

Registered as a codec (`DATE_TAG = 0x4432`, `"D2"`): `enc` writes the epoch-ms as an `i64`, `dec` revives it as a `D2I`.

| Method | Description |
|---|---|
| `set(f)` | Return a new date with the given `{ year, month, day, hour, minute, second, ms }` fields applied; unset fields are preserved, `day` is clamped to the target month |
| `withDate(year, month, day)` | Replace the calendar date, keep the time |
| `sameTimeOn(other)` | Keep this date's time, adopt `other`'s calendar date |
| `at(hour, minute?, second?, ms?)` | Return a new date at the given time on this date |
| `atNoon()` / `midnight()` | `at(12)` / `startOfDay()` |
| `toInputDate()` / `toInputTime()` / `toInputDateTime()` / `toInputTimeWithSeconds()` | `YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`, `HH:mm:ss` for form inputs |

### Arithmetic

| Method | Description |
|---|---|
| `addMs` / `addSeconds` / `addMinutes` / `addHours` / `addDays` / `addWeeks` / `addMonths` / `addYears` | Return a new date shifted by the amount |
| `subDays` / `subWeeks` / `subMonths` / `subYears` | Negative-shift shorthand |
| `addBusinessDays(n)` / `nextBusinessDay()` / `prevBusinessDay()` | Shift by weekdays, skipping weekends |
| `next(unit)` / `prev(unit)` | Next/previous `day`, `week`, `month`, `quarter`, `year`, or weekday name (`"friday"`) |
| `nextWeek` / `prevWeek` / `nextMonth` / `prevMonth` / `nextQuarter` / `prevQuarter` / `nextYear` / `prevYear` | Named shorthands |

### Boundaries

| Method | Description |
|---|---|
| `startOfDay` / `endOfDay` | Local day boundaries |
| `startOfWeek(weekStartsOn?)` / `endOfWeek(weekStartsOn?)` | Week boundaries; `weekStartsOn` defaults to `0` (Sunday) |
| `startOfMonth` / `endOfMonth` | Month boundaries |
| `startOfQuarter` / `endOfQuarter` | Quarter boundaries |
| `startOfYear` / `endOfYear` | Year boundaries |

### Fields and predicates

| Method | Description |
|---|---|
| `month()` | 1-based month |
| `dateOfWeek()` / `dayOfYear()` / `quarter()` | Calendar fields |
| `daysInMonth()` / `daysInYear()` / `isLeapYear()` | Calendar facts |
| `isWeekend()` / `isWeekday()` / `isBusinessDay()` | Day-type predicates |
| `isBefore` / `isAfter` / `isEqual` / `isBetween` / `isSameOrBefore` / `isSameOrAfter` | Instant comparison |
| `sameDay` / `sameMonth` / `sameYear` / `isSame(unit, other)` | Calendar comparison |
| `isToday` / `isTomorrow` / `isYesterday` | Relative-day predicates |
| `clamp(min, max)` | Clamp into a range |

### Differences

| Method | Description |
|---|---|
| `diffMs` / `diffSeconds` / `diffMinutes` / `diffHours` / `diffDays` | Numeric difference from `other` |
| `calendarDays(other)` | Whole calendar days between the two dates |
| `businessDays(other)` | Weekdays between the two dates |
| `diffHuman(other?)` | Compact human diff, e.g. `"3d"` |
| `fromNow()` / `ago()` | Relative description, e.g. `"in 2 hours"`, `"3 minutes ago"` |
| `from(other)` | Relative description vs. `other` |
| `age(unit?)` | Elapsed years/months/days since this date |

### Formatting and parsing

| Method | Description |
|---|---|
| `fmt(format)` | Token substitution: `YYYY`, `YY`, `MMMM`, `MMM`, `MM`, `M`, `DD`, `D`, `dddd`, `ddd`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `SSS`, `A`, `a` |
| `toLocalString(format?)` | `toLocaleString("en-US", format)`; `format` defaults to `FORMAT.full` |
| `D2.from(value)` | Parse from `Date`, number (epoch ms), ISO string, `YYYY-MM-DD`, `YYYY-MM-DD HH:mm`, array `[y,m,d,h?,min?,s?,ms?]`, or object (`{ date, time }` or `{ year, month, day, … }`) |
| `D2.parseDate("YYYY-MM-DD")` | Local midnight for that date |
| `D2.parseDateTime("YYYY-MM-DD HH:mm")` | Local date-time |
| `D2.fromParts(y, m, d, h?, min?, s?, ms?)` | Construct from calendar parts |

### Statics

| Method | Description |
|---|---|
| `D2.now()` / `D2.today()` | Current instant / today's `startOfDay()` |
| `D2.fromUnix(s)` / `D2.fromUnixMs(ms)` | Construct from epoch seconds / milliseconds |
| `D2.min(...dates)` / `D2.max(...dates)` | Earliest / latest of the inputs |

### Ranges

`R2I` is a half-open `[start, end)` interval.

| Method | Description |
|---|---|
| `contains(d)` | Whether `d` falls inside the range |
| `overlaps(other)` | Whether two ranges intersect |
| `durationMs()` / `days()` | Length in ms / whole days |
| `eachDay(fn)` | Iterate each calendar day in the range |
| `toArray()` | `A2I<D2>` of days |
| `R2(start, end)` | Build a range from any two `D2`-coercible values |

## `ER2` — Error

| Method | Description |
|---|---|
| `clone()` | Copy message, name, cause, and stack |
| `toJSON()` | Produce a serializable error representation |
| `toString()` | Format as `name: message` |
| `ER2.is(value)` | Check whether a value is an `Error` |
| `ER2.isER2(value)` | Check whether a value is an `ER2I` |
| `ER2.from(value, fallback?)` | Normalize unknown values into `ER2I` |
| `ER2.wrap(value, message?)` | Wrap an error with a cause |
| `ER2.aggregate(errors, message?)` | Create an `AggregateError` from multiple errors |

`ER2` accepts an optional message and standard `ErrorOptions`, including `cause`.



## `I2` — Iterator

`I2` wraps an iterable or iterator and provides lazy transformation pipelines.

| Method | Description |
|---|---|
| `n()` / `r()` / `f()` | Intended aliases for `next`, `return`, and `throw` |
| `toArray()` | Consume into an array |
| `first()` / `last()` | Retrieve the first or last value |
| `at(index)` | Retrieve by position, supporting negative indices |
| `peek()` | Read the next value without consuming it |
| `nextValue()` | Return the next value |
| `nextOr(value)` / `nextOrM(make)` | Return the next value or a fallback |
| `nextOrThrow(error?)` | Throw if exhausted |
| `map(fn)` / `filter(pred)` | Lazy transformation and filtering |
| `flatMap(fn)` / `flat()` | Flatten mapped iterables |
| `take(limit)` / `drop(limit)` | Limit or skip values |
| `unique(fn?)` | Remove duplicate values or computed keys |
| `chunk(size)` | Emit arrays of a specified size |
| `zip(other)` | Pair values from two iterators |
| `concat(...others)` | Concatenate iterables |
| `enumerate()` | Emit index-value pairs |
| `find(pred)` / `findIndex(pred)` | Find a value or index |
| `some(pred)` / `every(pred)` | Predicate checks |
| `reduce(fn, initial)` / `forEach(fn)` | Aggregate or consume values |
| `count()` / `sum(fn?)` | Count or sum values |
| `join(separator?)` | Join values into a string |
| `partition(pred)` | Split into matching and nonmatching arrays |
| `group(fn)` | Group values into a map |
| `toSet()` / `toMap(keyFn, valueFn?)` | Convert to collections |
| `isEmpty()` | Check whether another value is available |
| `exhaust()` | Consume the remaining iterator |
| `clone()` | Create an iterator over a materialized copy |


## `M2` — Map

`M2` extends `Map` and retains the standard `Map` API, plus reactive subscriptions, derived values, batching, and a large set of convenience methods. Keys are arbitrary — any value `Map` accepts, `M2` accepts.

| Method | Description |
|---|---|
| `g(key)` / `h(key)` / `d(key)` / `c()` | Aliases for `get`, `has`, `delete`, and `clear` |
| `f` | Alias for `forEach` |
| `s(value, key)` | Set a value; function arguments are evaluated as factories |
| `mutate(key, fn)` | Update an existing value in place using the current value |
| `swap(value, key)` | Replace a value and return the previous value |
| `take(key)` | Get and delete a value |
| `peek(key)` | Return the value or `false` if absent |
| `getOrI(value, key)` | Get or insert a supplied value |
| `getOrM(make, key)` | Get or lazily create a value |
| `update(key, fn, initial?)` | Update using the current value, or an initial value if missing |
| `setIfAbsent(value, key)` | Insert only when missing |
| `setIfPresent(value, key)` | Set only when present |
| `replace(value, key)` | Replace only when present |
| `inc(key, by?)` | Increment a numeric entry |
| `touch(key)` | Ensure a key exists |
| `mapValues(fn)` / `mapKeys(fn)` | Transform values or keys into a new map |
| `filterKV(pred)` / `filterKeys(pred)` | Filter in place |
| `partition(pred)` | Split entries into matching and nonmatching maps |
| `find(pred)` | Find the first matching entry |
| `findKey(pred)` / `findValue(pred)` | Find a matching key or value |
| `some(pred)` / `every(pred)` | Predicate checks |
| `reduce(fn, initial)` | Reduce entries |
| `forEachKV(fn)` | Iterate over value, key, and map |
| `invert()` | Reverse keys and values |
| `group(fn)` | Group values by computed key, into a map of `A2` buckets |
| `unique(fn?)` | Deduplicate by computed or original value |
| `pick(keys)` / `omit(keys)` | Select or exclude keys |
| `merge(entries)` | Merge entries into the current map |
| `clearAndSet(entries)` | Replace all entries as a single batch |
| `toObject()` | Convert entries to an object |
| `toArray()` / `toKeys()` / `toValues()` | Convert entries, keys, or values to an `A2` |
| `clone()` | Create a shallow copy |
| `equals(other)` | Compare keys and values by value-aware equality |
| `on(fn)` | Subscribe to change events; returns an unsubscribe function |
| `off(fn)` | Unsubscribe a listener |
| `batch(fn)` | Run multiple writes, coalescing into one event per key |
| `dv(key, deps, fn)` | Define a derived value computed from other keys |
| `dirty(...keys)` | Mark derived values as needing recomputation |
| `$debug(limit?)` | Enable event history tracking |
| `$strict()` | Throw if mutated while iterating |
| `$history()` | Return recorded change events |
| `$why(key)` | Return the most recent event for a key |
| `$diff(other)` | Compare against another map: added, deleted, and changed entries |
| `fromObject(obj)` | Create a map from an object |
| `fromEntries(entries)` | Create a map from entries |
| `from(map)` | Create a map from another map |


## `M2B` — Map binary

`M2B` is the dense, PID-indexed backing store for `M2`. Where `M2` accepts arbitrary keys and stores values in a `Map`, `M2B` stores fixed-width values in a flat `Float64Array`, indexed by integer PID. `pidToSlot` / `slotToPid` give O(1) lookup in both directions, and iteration walks the dense slot range — no hashing, no per-entry allocation.

`stride` controls how many doubles each PID holds: `stride = 1` stores scalars (`number`), `stride > 1` stores fixed-length `Float64Array` views. `cap` is the maximum PID; values outside `[0, cap)` read as absent.

| Method | Description |
|---|---|
| `g(pid)` / `h(pid)` / `d(pid)` / `c()` | Aliases for `get`, `has`, `delete`, and `clear` |
| `f` | Alias for `forEach` |
| `s(value, pid)` | Set a value for a PID |
| `mutate(pid, fn)` | Update an existing value in place using the current value |
| `swap(value, pid)` | Replace a value and return the previous value |
| `take(pid)` | Get and delete a value |
| `peek(pid)` | Return the value or `false` if absent |
| `getOrI(value, pid)` | Get or insert a supplied value |
| `getOrM(make, pid)` | Get or lazily create a value |
| `update(pid, fn, initial?)` | Update using the current value, or an initial value if missing |
| `setIfAbsent(value, pid)` | Insert only when missing |
| `setIfPresent(value, pid)` | Set only when present |
| `replace(value, pid)` | Replace only when present |
| `inc(pid, by?)` | Increment a numeric entry |
| `touch(pid)` | Ensure a PID exists |
| `mapValues(fn)` / `mapKeys(fn)` | Transform values or PIDs into a new map |
| `filterKV(pred)` / `filterKeys(pred)` | Filter in place |
| `partition(pred)` | Split entries into matching and nonmatching maps |
| `find(pred)` | Find the first matching entry |
| `findKey(pred)` / `findValue(pred)` | Find a matching PID or value |
| `some(pred)` / `every(pred)` | Predicate checks |
| `reduce(fn, initial)` | Reduce entries |
| `forEachKV(fn)` | Iterate over value, PID, and map |
| `invert()` | Reverse PIDs and values into a plain `Map` |
| `group(fn)` | Group values by computed key, into a map of arrays |
| `unique(fn?)` | Deduplicate by computed or original value |
| `pick(pids)` / `omit(pids)` | Select or exclude PIDs |
| `merge(entries)` | Merge entries into the current map |
| `clearAndSet(entries)` | Replace all entries as a single batch |
| `toObject()` | Convert entries to an object |
| `toArray()` / `toKeys()` / `toValues()` | Convert entries, PIDs, or values to an array |
| `clone()` | Create a shallow copy |
| `equals(other)` | Compare PIDs and values by value-aware equality |
| `on(fn)` | Subscribe to change events; returns an unsubscribe function |
| `off(fn)` | Unsubscribe a listener |
| `batch(fn)` | Run multiple writes, coalescing into one event per PID |
| `dv(pid, deps, fn)` | Define a derived value computed from other PIDs |
| `dirty(...pids)` | Mark derived values as needing recomputation |
| `$debug(limit?)` | Enable event history tracking |
| `$strict()` | Throw if mutated while iterating |
| `$history()` | Return recorded change events |
| `$why(pid)` | Return the most recent event for a PID |
| `$diff(other)` | Compare against another map: added, deleted, and changed entries |
| `fromObject(obj, cap, stride?)` | Create a map from an object |
| `fromEntries(entries, cap, stride?)` | Create a map from entries |
| `from(map, cap, stride?)` | Create a map from another map |

`cap`, `stride`, and `size` are exposed as readonly properties. `pidToSlot`, `slotToPid`, and `vals` are the backing arrays.

## `N2` — Number

Numeric helpers return `N2I` for chaining unless otherwise indicated.

| Method | Description |
|---|---|
| `abs()` | Absolute value |
| `sign()` | Sign of the number |
| `neg()` | Negate the number |
| `inv()` | Reciprocal |
| `clamp(min, max)` | Constrain to a range |
| `wrap(min, max)` | Wrap into a range |
| `lerp(to, t)` | Linear interpolation |
| `map(inMin, inMax, outMin, outMax)` | Map between numeric ranges |
| `remap(...)` | Alias for `map()` |
| `roundTo(precision?)` | Round to decimal precision |
| `floorTo(precision?)` | Floor to decimal precision |
| `ceilTo(precision?)` | Ceiling to decimal precision |
| `truncTo(precision?)` | Truncate to decimal precision |
| `isFinite()` | Check for a finite number |
| `isInteger()` | Check for an integer |
| `isSafeInteger()` | Check for a safe integer |
| `isNaN()` | Check for `NaN` |
| `isBetween(min, max, inclusive?)` | Check whether the value is in a range |
| `isPositive()` / `isNegative()` | Check the sign |
| `isZero()` | Check for zero |
| `isEven()` / `isOdd()` | Check integer parity |
| `squared()` / `cubed()` | Square or cube |
| `sqrt()` / `cbrt()` | Square or cube root |
| `pow(exponent)` | Raise to a power |
| `root(degree)` | Calculate a root |
| `mod(divisor)` | Positive modulo |
| `percentOf(total)` | Calculate a percentage of a total |
| `percentChange(from)` | Calculate percentage change |
| `toRadians()` / `toDegrees()` | Convert angular units |
| `toOrdinal()` | Format as an ordinal |
| `toBytes(unit?, decimals?)` | Format as a byte quantity |
| `toCompact(locales?)` | Compact number formatting |
| `toCurrency(currency?, locales?)` | Currency formatting |
| `toPercent(decimals?, locales?)` | Percentage formatting |
| `times(fn)` | Execute a callback for each integer index below the value |
| `upTo(end, step?)` | Generate an ascending numeric array |
| `downTo(end, step?)` | Generate a descending numeric array |


## `O2` — Object

Provides static object inspection, nested-path access, cloning, merging, selection, transformation, comparison, and update helpers.

| Method | Description |
|---|---|
| `isEmpty(value)` / `isNotEmpty(value)` | Checks own-key count |
| `size(value)` | Returns the number of own keys, including symbols |
| `isPlainObject(value)` / `isObject(value)` | Checks object type |
| `get(value, path, fallback?)` | Reads a nested path |
| `getOr(value, path, fallback)` | Reads a nested path with a typed fallback |
| `set(value, path, next)` | Sets a nested path, creating intermediate objects |
| `unset(value, path)` | Deletes a nested property |
| `hasPath(value, path)` | Checks whether a nested path exists |
| `clone(value)` | Shallow-clones an object or array |
| `deepClone(value)` | Uses `structuredClone` |
| `deepMerge(target, source)` | Recursively merges plain objects |
| `defaults(target, defaults)` | Applies defaults while retaining target values |
| `getOrCreate(value, key, create)` | Creates a property when absent or undefined |
| `pick(value, keys)` / `omit(value, keys)` | Selects or excludes properties |
| `pickBy(value, predicate)` / `omitBy(value, predicate)` | Selects or excludes properties by predicate |
| `mapKeys(value, mapper)` | Transforms property keys |
| `mapValues(value, mapper)` | Transforms property values |
| `mapEntries(value, mapper)` | Transforms key-value entries |
| `filter(value, predicate)` | Selects properties by predicate |
| `isEqual(first, second)` | Performs recursive equality checks |
| `isShallowEqual(first, second)` | Compares own keys and values shallowly |
| `hasAll(value, keys)` / `hasAny(value, keys)` | Checks required own properties |
| `assertKeys(value, keys)` | Throws if required own properties are missing |
| `with(value, key, next)` | Returns a copy with a property changed |
| `without(value, key)` | Returns a copy without a property |
| `update(value, key, updater)` | Returns a copy with an updated property |

`O2` is exposed as a static utility constructor on `globalThis`.

## `P2` — Promise

Extends `Promise<T>` with chaining helpers, recovery, timing controls, and result conversion.

| Method | Description |
|---|---|
| `tap(fn)` | Runs a callback on fulfillment and preserves the value |
| `tapError(fn)` | Runs a callback on rejection and preserves the rejection |
| `recover(fn)` | Recovers from rejection |
| `fallback(value)` | Supplies a fallback after rejection |
| `timeout(ms, error?)` | Rejects if the promise does not settle before the timeout |
| `delay(ms)` | Delays delivery of a fulfilled value |
| `withDeadline(deadline, error?)` | Applies a deadline based on a timestamp |
| `map(fn)` / `flatMap(fn)` | Chains a transformation |
| `and(other)` / `zip(other)` | Combines a fulfilled value with another value or promise |
| `or(other)` | Uses an alternative after rejection |
| `unwrap()` | Returns the promise as a native `Promise<T>` type |
| `toResult()` | Converts fulfillment or rejection into an `{ ok, value/error }` result |
| `onResolve(fn)` / `onReject(fn)` | Registers fulfillment or rejection callbacks |
| `finallyDo(fn)` | Runs a final callback |

Static helpers:

| Method | Description |
|---|---|
| `resolve(value?)` / `reject(reason?)` | Creates a settled promise |
| `all(values)` | Waits for all promises to fulfill |
| `allSettled(values)` | Waits for all promises to settle |
| `race(values)` | Settles with the first settled promise |
| `any(values)` | Settles with the first fulfilled promise |
| `retry(fn, times?, delay?)` | Retries a task after rejection |
| `deferred<T>()` | Returns a promise with external `resolve` and `reject` functions |
| `try(fn)` | Executes a function and converts synchronous throws into rejection |

Chained operations return `P2` instances.



## `S2` — String

Extends `String` with common string checks, transformations, parsing, and conversion helpers.

| Method | Description |
|---|---|
| `empty()` / `notEmpty()` | Checks whether the string has characters |
| `blank()` / `notBlank()` | Checks whether the string is empty or whitespace-only |
| `equals(value)` | Checks exact equality |
| `equalsIgnoreCase(value)` | Checks equality without case sensitivity |
| `contains(value)` | Checks whether the string contains a value |
| `starts(value)` / `ends(value)` | Checks the beginning or end |
| `first()` / `last()` | Gets the first or last character |
| `reverse()` | Reverses the string by Unicode code point |
| `capitalize()` / `uncapitalize()` | Changes the first character's case |
| `titleCase()` | Capitalizes word initials |
| `camelCase()` | Converts to camel case |
| `kebabCase()` | Converts to kebab case |
| `snakeCase()` | Converts to snake case |
| `pascalCase()` | Converts to PascalCase |
| `words()` | Extracts letter-and-number sequences |
| `lines()` | Splits into lines |
| `chars()` / `toArray()` | Converts to an array of characters |
| `unique()` | Removes duplicate characters |
| `escapeRegExp()` | Escapes regular-expression special characters |
| `stripHtml()` | Removes HTML-like tags |
| `stripWhitespace()` | Removes all whitespace |
| `truncate(length, suffix?)` / `limit(length, suffix?)` | Limits string length |
| `toNumber()` | Converts to a number |
| `toInt(radix?)` | Parses an integer |
| `toFloat()` | Parses a floating-point number |
| `toBoolean()` | Parses `true`, `1`, `yes`, or `on` as true |
| `toJSON()` | Returns the JSON-serialized string |

Also inherits the native `String` API. `S2` is registered as a callable and constructible string wrapper.


## `SET2` — Set

`SET2` extends `Set` and retains the standard `Set` API, plus functional transforms, bulk mutation, set algebra, and conversion helpers. Like `M2`, keys are arbitrary — any value `Set` accepts, `SET2` accepts.

| Method | Description |
|---|---|
| `s(value)` | Alias for `add` |
| `take(value)` | Delete and return the value, or `undefined` if absent |
| `peek(value)` | Return the value or `false` if absent |
| `toggle(value)` | Add if absent, delete if present; returns the new membership |
| `first()` / `last()` | First or last value in iteration order |
| `union(other)` | New set of all values in either set |
| `intersection(other)` | New set of values in both sets |
| `difference(other)` | New set of values in this set but not the other |
| `symmetricDifference(other)` | New set of values in either set but not both |
| `isSubsetOf(other)` / `isSupersetOf(other)` | Containment checks |
| `isDisjointFrom(other)` | Whether the two sets share no values |
| `equals(other)` | Whether the two sets contain the same values |
| `filter(fn)` | New set of values matching the predicate |
| `map(fn)` | New set of mapped values |
| `partition(fn)` | Split into matching and nonmatching sets |
| `differenceBy(other, fn)` | Difference by computed key |
| `uniqueBy(fn)` | Deduplicate by computed key |
| `find(fn)` | First matching value, or `undefined` |
| `every(fn)` / `some(fn)` | Predicate checks |
| `reduce(fn, initial)` | Reduce values |
| `addAll(values)` | Add many values |
| `deleteAll(values)` | Delete many values; returns the count removed |
| `retainAll(values)` | Delete every value not in `values` |
| `update(values)` | Alias for `addAll` |
| `replace(values)` | Clear, then add all values |
| `swap(a, b)` | If `a` is present, delete `a` and add `b` |
| `clone()` | Create a shallow copy |
| `toArray()` | Convert to an array |
| `toMap(fn)` | Convert to an `M2`, using `fn` to produce `[key, value]` per entry |
| `toObject(fn?)` | Convert to an object, keyed by `fn(value)` or `String(value)` |
| `toJSON()` | Alias for `toArray` |
| `fromArray(values)` | Create a set from an array |
| `fromObject(obj)` | Create a set from an object's values |
| `fromEntries(entries)` | Create a set from the values of `[key, value]` pairs |
| `from(values)` | Create a set from any iterable |

## `SET2B` — Set Binary

`SET2BI` is the dense, PID-indexed backing store for `SET2`. Membership lives in a `Uint8Array` (`flags[pid] → 0/1`), dense iteration walks `slots`, and `pidToIdx` gives O(1) delete via swap-remove. `cap` is the maximum PID; values outside `[0, cap)` read as absent.

| Method | Description |
|---|---|
| `s(pid)` | Alias for `add` |
| `add(pid)` | Add a PID |
| `has(pid)` | Whether the PID is a member |
| `delete(pid)` | Remove a PID; returns whether it was present |
| `clear()` | Remove every member in place |
| `take(pid)` | Delete and return the PID, or `undefined` if absent |
| `peek(pid)` | Return the PID or `false` if absent |
| `toggle(pid)` | Add if absent, delete if present; returns the new membership |
| `first()` / `last()` | First or last PID in dense order |
| `union(other)` | New set of all PIDs in either set |
| `intersection(other)` | New set of PIDs in both sets |
| `difference(other)` | New set of PIDs in this set but not the other |
| `symmetricDifference(other)` | New set of PIDs in either set but not both |
| `isSubsetOf(other)` / `isSupersetOf(other)` | Containment checks |
| `isDisjointFrom(other)` | Whether the two sets share no PIDs |
| `equals(other)` | Whether the two sets contain the same PIDs |
| `filter(fn)` | New set of PIDs matching the predicate |
| `map(fn)` | New set of mapped PIDs |
| `partition(fn)` | Split into matching and nonmatching sets |
| `differenceBy(other, fn)` | Difference by computed key |
| `uniqueBy(fn)` | Deduplicate by computed key |
| `find(fn)` | First matching PID, or `undefined` |
| `every(fn)` / `some(fn)` | Predicate checks |
| `reduce(fn, initial)` | Reduce PIDs |
| `addAll(pids)` | Add many PIDs |
| `deleteAll(pids)` | Delete many PIDs; returns the count removed |
| `retainAll(pids)` | Delete every PID not in `pids` |
| `update(pids)` | Alias for `addAll` |
| `replace(pids)` | Clear, then add all PIDs |
| `swap(a, b)` | If `a` is present, delete `a` and add `b` |
| `clone()` | Create a shallow copy |
| `toArray()` | Convert to an array of PIDs |
| `toMap(fn)` | Convert to a plain `Map`, using `fn` to produce `[key, value]` per PID |
| `toObject(fn?)` | Convert to an object, keyed by `fn(pid)` or `String(pid)` |
| `toJSON()` | Alias for `toArray` |
| `fromArray(pids, cap?)` | Create a set from an array of PIDs |
| `fromObject(obj, cap?)` | Create a set from an object's values |
| `fromEntries(entries, cap?)` | Create a set from the values of `[key, value]` pairs |
| `from(pids, cap?)` | Create a set from any iterable of PIDs |

## `U82` — Uint8Array

Extends `Array<T>` with collection access, transformations, set-like operations, and in-place utilities.

| Method | Description |
|---|---|
| `first()` / `second()` / `third()` / `last()` | Gets an element by position |
| `random()` | Gets a random element |
| `isEmpty()` / `isNotEmpty()` | Checks whether the array has elements |
| `isNotEmptyAndDefined()` | Checks for at least one non-nullish element |
| `clear()` | Empties the array in place |
| `clone()` | Creates a shallow copy |
| `unique()` | Removes duplicate values |
| `compact()` | Removes `null` and `undefined` |
| `chunk(size)` | Splits into groups of a given size |
| `flatten(depth?)` / `flattenDeep()` | Flattens nested arrays |
| `shuffle()` / `shuffleInPlace()` | Randomizes the array in place |
| `sample(count?)` / `pick(count?)` | Selects random elements without replacement |
| `count(predicate?)` | Counts all elements or matching elements |
| `sum()` / `average()` / `min()` / `max()` | Numeric aggregations |
| `groupBy(keyFn)` | Groups elements by computed key |
| `keyBy(keyFn)` / `toMap(keyFn)` | Maps computed keys to elements |
| `partition(predicate)` | Splits elements into matching and nonmatching arrays |
| `difference(other)` | Returns elements not present in another iterable |
| `intersection(other)` | Returns elements present in another iterable |
| `union(other)` | Combines unique elements |
| `symmetricDifference(other)` | Returns elements exclusive to either collection |
| `take(count)` / `takeLast(count)` | Takes elements from either end |
| `drop(count)` / `dropLast(count)` | Removes elements from either end in the returned copy |
| `pluck(key)` | Extracts a property from every element |
| `insert(index, ...items)` | Inserts elements in place |
| `removeAt(index)` | Removes and returns an element |
| `remove(value)` | Removes the first matching element |
| `removeWhere(predicate)` | Removes all matching elements in place |
| `replace(oldValue, newValue)` | Replaces the first matching element |
| `move(from, to)` | Moves an element to another index |
| `swap(i, j)` | Swaps two positions |
| `toSet()` | Converts to a native `Set` |
| `equals(other)` | Checks element-by-element equality |
| `startsWith(other)` / `endsWith(other)` | Checks matching elements at either end |
| `isSorted(compareFn?)` | Checks whether elements are sorted |
| `frequencies()` | Counts occurrences of each element |

Also inherits the native `Array` API. Static `from()` and `of()` return the enhanced array type.


## `USP2` — URLSearchParams

Extends `URLSearchParams` with typed value access, serialization, merging, and convenience methods.

| Method | Description |
|---|---|
| `getOr(name, fallback)` | Gets a parameter or returns a fallback |
| `getOrNull(name)` | Gets a parameter or returns `null` |
| `getOrThrow(name, error?)` | Gets a parameter or throws |
| `getNumber(name, fallback?)` | Parses a finite number |
| `getInt(name, radix?)` | Parses an integer |
| `getFloat(name)` | Parses a floating-point number |
| `getBoolean(name, fallback?)` | Parses boolean-like values |
| `getJSON<T>(name)` | Parses JSON; returns `undefined` on missing or invalid JSON |
| `getArray(name, separator?)` | Splits a parameter into an array |
| `getObject<T>()` | Converts parameters to an object, preserving repeated values as arrays |
| `setNumber(name, value)` | Sets a numeric parameter |
| `setBoolean(name, value)` | Sets a boolean parameter |
| `setJSON(name, value)` | JSON-serializes a value into a parameter |
| `setArray(name, values, separator?)` | Joins values into a parameter |
| `setIfAbsent(name, value)` | Sets only if the parameter does not exist |
| `setIfPresent(name, value)` | Sets only if the parameter exists |
| `appendAll(params)` | Appends parameters from another source |
| `merge(params, overwrite?)` | Merges parameters, overwriting by default |
| `clone()` | Creates a copy |
| `clear()` | Removes all parameters |
| `isEmpty()` / `isNotEmpty()` | Checks whether parameters exist |
| `toObject()` / `toJSON()` | Converts parameters to an object |
| `toURLSearchParams()` | Returns a native `URLSearchParams` copy |
| `toURL(url)` | Creates a URL and appends these parameters |

Also exposes `size` and inherits the native `URLSearchParams` API.



## `WM2` — WeakMap

Extends `WeakMap<K, V>` with aliases, lazy initialization, conditional updates, and optional explicit key tracking.

| Method | Description |
|---|---|
| `g` / `h` / `d` | Aliases for `get` / `has` / `delete` |
| `s(key, value)` | Sets a value; evaluates a function argument lazily |
| `swap(key, value)` | Sets a value and returns the previous value |
| `take(key)` / `getAndDelete(key)` | Gets and deletes a value |
| `peek(key)` | Returns the value or `false` if absent |
| `getOrI(key, value)` | Gets an existing value or stores the supplied value |
| `getOrM(key, make)` | Gets an existing value or lazily creates and stores one |
| `getOr(key, fallback)` | Gets a value or returns a fallback |
| `getOrThrow(key, error?)` | Gets a value or throws |
| `getOrCreate(key, make)` / `ensure(key, make)` | Lazily creates a missing value |
| `update(key, fn, initial)` | Computes and stores an updated value |
| `setIfAbsent(key, value)` | Sets only if the key is absent |
| `setIfPresent(key, value)` | Sets only if the key exists |
| `hasOrSet(key, value)` | Returns whether the key already existed; otherwise sets it |
| `replace(key, value)` | Replaces a value only when the key exists |
| `touch(key)` | Inserts `undefined` for an absent key |
| `track(key)` / `untrack(key)` | Enables or removes explicit key tracking |
| `trackedKeys()` / `trackedValues()` / `trackedEntries()` | Reads explicitly tracked keys and their current values |
| `forEachTracked(fn)` | Iterates tracked entries still present |
| `clearTracked()` | Deletes tracked keys from the WeakMap and clears tracking |

**Tracking note:** Tracking retains strong references to keys and can prevent garbage collection. Tracking is opt-in.




## `WS2` — WeakSet

Extends `WeakSet<T>` with conditional membership, bulk operations, and optional explicit tracking.

| Method | Description |
|---|---|
| `addIfAbsent(value)` | Adds only if absent; returns whether it added |
| `toggle(value)` | Adds if absent or deletes if present; returns the new membership state |
| `deleteIfPresent(value)` | Deletes a value if present |
| `hasAll(values)` / `hasAny(values)` | Checks membership across an iterable |
| `addAll(values)` | Adds multiple values |
| `deleteAll(values)` | Deletes multiple values and returns the deletion count |
| `replace(oldValue, newValue)` | Replaces a member if the old value exists |
| `track(value)` | Adds a value and explicitly tracks it |
| `untrack(value)` | Removes a value from explicit tracking |
| `trackedKeys()` | Returns explicitly tracked values |
| `forEachTracked(callback, thisArg?)` | Iterates tracked values still present in the WeakSet |
| `clearTracked()` | Deletes all explicitly tracked values |

**Tracking note:** Native `WeakSet` values are not enumerable. These helpers maintain a separate strong-reference `Set` for tracked values; tracked objects can therefore remain reachable until untracked or cleared.


## Usage

After the package's initialization module has executed, the registered globals can be used directly:

```ts
const values = new A2(1, 2, 2, 3, 4);

values.unique().chunk(2);
// [[1, 2], [3, 4]]

new N2(42).clamp(0, 10).valueOf();
// 10

const cache = new M2<string, number>();
cache.s("count", 1);
cache.inc("count");
// 2

const iterator = new I2([1, 2, 3, 4]);
iterator.filter(value => value % 2 === 0).toArray();
// [2, 4]

const error = ER2.from("Something failed");
error.toJSON();
```






</div>
<div style="font-size: 9px;  text-align: right">


## <span style="font-size: 10.5px;"> ⇦✦──⇦✦──✦──✦──←'pew pew'<span> <span style="font-size: 24px;"> 🧙 [TOC] <span>
<div style="font-size: 14px;  text-align: right">

<ul style="list-style: none; padding-left: 0;">
  <li><a href="#a2--array">A2 — Array</a></li>
  <li><a href="#b2--byte-bool">B2 — Byte Boolean</a></li>
  <li><a href="#d2--date">D2 — Date</a></li>
  <li><a href="#er2--error">ER2 — Error</a></li>
  <li><a href="#i2--iterator">I2 — Iterator</a></li>
  <li><a href="#m2--map">M2 — Map</a></li>
  <li><a href="#m2b--map-binary">M2B — Map Binary</a></li>
  <li><a href="#n2--number">N2 — Number</a></li>
  <li><a href="#o2--object">O2 — Object</a></li>
  <li><a href="#p2--promise">P2 — Promise</a></li>
  <li><a href="#usp2--urlsearchparams">USP2 — URLSearchParams</a></li>
  <li><a href="#u82--array">U82 — Uint8Array</a></li>
  <li><a href="#s2--string">S2 — String</a></li>
  <li><a href="#ws2--weakset">WS2 — WeakSet</a></li>
  <li><a href="#wm2--weakmap">WM2 — WeakMap</a></li>
  <li><a href="#o2--object">O2 — Object</a></li>
  <li><a href="#set2--set">SET2 — Set</a></li>
  <li><a href="#set2b--set-binary">SET2B — Set Binary</a></li>
</ul>

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
