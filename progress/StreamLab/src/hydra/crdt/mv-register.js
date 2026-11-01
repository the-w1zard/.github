export class MV_REGISTER {
    entries = new Map(); // stamp -> entry
    nodeId;
    hlc;
    constructor(nodeId, hlc, initial) {
        this.nodeId = nodeId;
        this.hlc = hlc;
        if (initial !== undefined)
            this.set(initial);
    }
    /** Write a value. Concurrent writes from other stamps are preserved.
     * Entries causally dominated by the new write are dropped — same-HLC
     * earlier ticks and anything we've already seen ordered before us. */
    set(value) {
        const stamp = this.hlc.tick();
        for (const s of this.entries.keys()) {
            if (this.hlc.compare(s, stamp) < 0)
                this.entries.delete(s);
        }
        this.entries.set(stamp, { value, stamp });
    }
    /** All concurrent values currently observable. */
    values() {
        return [...this.entries.values()].map((e) => e.value);
    }
    /** All entries with their stamps (for conflict UIs). */
    entriesOf() {
        return [...this.entries.values()];
    }
    /** How many concurrent values exist (1 = no divergence). */
    concurrency() {
        return this.entries.size;
    }
    /** The current resolved value: LWW winner by HLC order (same total
     * order as LWW_REGISTER), without discarding the losers. */
    get() {
        let best;
        for (const e of this.entries.values()) {
            if (!best || this.hlc.compare(e.stamp, best.stamp) > 0)
                best = e;
        }
        return best?.value;
    }
    /** Set-union merge by stamp — the CRDT law. Never loses a value. */
    merge(other) {
        const incoming = other instanceof MV_REGISTER ? other.entriesOf() : other;
        for (const e of incoming) {
            const existing = this.entries.get(e.stamp);
            if (!existing)
                this.entries.set(e.stamp, e);
        }
    }
    getState() {
        return this.entriesOf();
    }
    setState(state) {
        this.entries.clear();
        for (const e of state)
            this.entries.set(e.stamp, e);
    }
    /** Collapse divergence to a single value. Default: LWW by HLC. A custom
     * resolver receives the concurrent entries and returns the survivor. */
    collapse(resolve) {
        if (this.entries.size <= 1)
            return this.get();
        const list = this.entriesOf();
        const winner = resolve ? resolve(list) : list.reduce((a, b) => this.hlc.compare(b.stamp, a.stamp) > 0 ? b : a);
        this.entries.clear();
        this.entries.set(winner.stamp, winner);
        return winner.value;
    }
}
