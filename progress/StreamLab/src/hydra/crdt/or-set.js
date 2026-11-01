// #region ███████████████ CRDT █ OR_SET ███████████████████████████████████████████████
export class OR_SET {
    adds = new Map(); // tag -> entry
    removes = new Set(); // tags known removed
    nodeId;
    hlc;
    constructor(nodeId, hlc) {
        this.nodeId = nodeId;
        this.hlc = hlc;
    }
    add(item) {
        const tag = `${this.hlc.tick()}:${this.nodeId}`;
        this.adds.set(tag, { item, tag });
    }
    /** Removes every currently-visible tag for this item — a concurrent add on
     * another node produces a NEW tag this remove never saw, so it survives.
     * That's the actual OR-Set guarantee: add wins over a remove it wasn't
     * causally aware of. */
    remove(item) {
        for (const [tag, entry] of this.adds) {
            if (this.equals(entry.item, item))
                this.removes.add(tag);
        }
    }
    has(item) {
        for (const [tag, entry] of this.adds) {
            if (this.equals(entry.item, item) && !this.removes.has(tag))
                return true;
        }
        return false;
    }
    values() {
        const seen = new Set();
        const out = [];
        for (const [tag, entry] of this.adds) {
            if (this.removes.has(tag))
                continue;
            const key = JSON.stringify(entry.item);
            if (seen.has(key))
                continue;
            seen.add(key);
            out.push(entry.item);
        }
        return out;
    }
    /** Union of add-sets and remove-sets — both only ever grow. Tombstone
     * accumulation is real and disclosed, not solved here (see class header
     * gap on GC — no automatic pruning, matches the field guide's stated
     * concern that this is one of the hardest practical CRDT problems). */
    merge(other) {
        const state = other instanceof OR_SET ? other.getState() : other;
        for (const entry of state.adds)
            if (!this.adds.has(entry.tag))
                this.adds.set(entry.tag, entry);
        for (const entry of state.removes)
            this.removes.add(entry.tag);
    }
    getState() {
        return {
            adds: Array.from(this.adds.values()),
            removes: Array.from(this.removes).map((tag) => ({ item: this.adds.get(tag)?.item, tag })),
        };
    }
    setState(state) {
        this.adds = new Map(state.adds.map((e) => [e.tag, e]));
        this.removes = new Set(state.removes.map((r) => r.tag));
    }
    equals(a, b) {
        return typeof a === 'object' ? JSON.stringify(a) === JSON.stringify(b) : a === b;
    }
}
// #endregion
