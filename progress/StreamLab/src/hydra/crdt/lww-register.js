// #region ███████████████ CRDT █ LWW_REGISTER ████████████████████████████████████████
export class LWW_REGISTER {
    value;
    stamp;
    nodeId;
    hlc;
    constructor(nodeId, hlc, initial) {
        this.nodeId = nodeId;
        this.hlc = hlc;
        this.value = initial;
        this.stamp = this.hlc.tick();
    }
    set(value) {
        this.value = value;
        this.stamp = this.hlc.tick();
    }
    get() {
        return this.value;
    }
    /** HLC.compare(), not Date.now() — this is what closes the "LWW depends on
     * synchronized clocks" gap flagged in research. HLC ties are broken by its
     * own embedded logical counter + node id, so two concurrent writes never
     * produce a genuine tie needing an arbitrary secondary rule. */
    merge(other) {
        const state = other instanceof LWW_REGISTER ? other.getState() : other;
        if (this.hlc.compare(state.stamp, this.stamp) > 0) {
            this.value = state.value;
            this.stamp = state.stamp;
        }
    }
    getState() {
        return { value: this.value, stamp: this.stamp };
    }
    setState(state) {
        this.value = state.value;
        this.stamp = state.stamp;
    }
}
// #endregion
