// #region ███████████████ CRDT █ MV_REGISTER ███████████████████████████████████████████
// ============================================================================
// MV_REGISTER — multi-value register (the "black hole" primitive).
//
// Unlike LWW_REGISTER, which silently drops concurrent values, MV_REGISTER
// keeps ALL concurrent values observable. Divergence is a *feature*: two
// replicas that disagreed remain two observable states until someone
// explicitly collapses the register to a single winner.
//
// Merge is set-union by unique stamp — idempotent, commutative, associative.
// collapse() resolves via the HLC compare (same total order as LWW), or a
// custom resolver (app policy, user pick, etc.).
//
// Usage sketch (mirrors the LWW example in pn-counter.ts):
//   const reg = new MV_REGISTER<string>(staff.instanceId, hlc);
//   reg.set('a'); reg.merge(remote.getState());
//   if (reg.concurrency() > 1) showConflictUI(reg.values());
//   reg.collapse(); // or collapse((a, b) => pickOne(a, b))
// ============================================================================
import { HLC } from "./hlc.ts";

export interface MVEntry<T> { value: T; stamp: string }

export class MV_REGISTER<T> {
    private entries = new Map<string, MVEntry<T>>();   // stamp -> entry
    private readonly nodeId: string;
    private readonly hlc: HLC;

    constructor(nodeId: string, hlc: HLC, initial?: T) {
        this.nodeId = nodeId;
        this.hlc = hlc;
        if (initial !== undefined) this.set(initial);
    }

    /** Write a value. Concurrent writes from other stamps are preserved.
     * Entries causally dominated by the new write are dropped — same-HLC
     * earlier ticks and anything we've already seen ordered before us. */
    set(value: T): void {
        const stamp = this.hlc.tick();
        for (const s of this.entries.keys()) {
            if (this.hlc.compare(s, stamp) < 0) this.entries.delete(s);
        }
        this.entries.set(stamp, { value, stamp });
    }

    /** All concurrent values currently observable. */
    values(): T[] {
        return [...this.entries.values()].map((e) => e.value);
    }

    /** All entries with their stamps (for conflict UIs). */
    entriesOf(): MVEntry<T>[] {
        return [...this.entries.values()];
    }

    /** How many concurrent values exist (1 = no divergence). */
    concurrency(): number {
        return this.entries.size;
    }

    /** The current resolved value: LWW winner by HLC order (same total
     * order as LWW_REGISTER), without discarding the losers. */
    get(): T | undefined {
        let best: MVEntry<T> | undefined;
        for (const e of this.entries.values()) {
            if (!best || this.hlc.compare(e.stamp, best.stamp) > 0) best = e;
        }
        return best?.value;
    }

    /** Set-union merge by stamp — the CRDT law. Never loses a value. */
    merge(other: MV_REGISTER<T> | MVEntry<T>[]): void {
        const incoming = other instanceof MV_REGISTER ? other.entriesOf() : other;
        for (const e of incoming) {
            const existing = this.entries.get(e.stamp);
            if (!existing) this.entries.set(e.stamp, e);
        }
    }

    getState(): MVEntry<T>[] {
        return this.entriesOf();
    }

    setState(state: MVEntry<T>[]): void {
        this.entries.clear();
        for (const e of state) this.entries.set(e.stamp, e);
    }

    /** Collapse divergence to a single value. Default: LWW by HLC. A custom
     * resolver receives the concurrent entries and returns the survivor. */
    collapse(resolve?: (entries: MVEntry<T>[]) => MVEntry<T>): T | undefined {
        if (this.entries.size <= 1) return this.get();
        const list = this.entriesOf();
        const winner = resolve ? resolve(list) : list.reduce((a, b) =>
            this.hlc.compare(b.stamp, a.stamp) > 0 ? b : a);
        this.entries.clear();
        this.entries.set(winner.stamp, winner);
        return winner.value;
    }
}
