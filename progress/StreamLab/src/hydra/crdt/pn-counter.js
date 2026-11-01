// #region ███████████████ CRDT █ PN_COUNTER ██████████████████████████████████████████
// ============================================================================
// CRDTs — G/PN-Counter, OR-Set, LWW-Register. State-based (send full state,
// merge is idempotent/commutative/associative), with a delta() escape hatch
// on PN_COUNTER for bandwidth-conscious sync. HLC-driven, not wall-clock —
// LWW's "last write wins" correctness depends entirely on that.
//
// KNOWN GAP: no non-negative/bounded counter variant.
// Bounding a counter is a global invariant that can't be evaluated from
// local replica state alone — offering one honestly requires coordination,
// which defeats the point of a CRDT. Not solved here; flagged, not faked.
// ============================================================================
/**
// PN-Counter — e.g. a like count multiple clients increment/decrement independently
const likes = new PN_COUNTER(staff.instanceId, hlc);
likes.increment();
likes.increment(3);
likes.decrement();
console.log(likes.value()); // 3

// broadcast + merge over the bus, same shape as fuseSignal's persistence wiring
staff.multisub('[COUNTERS]', 'post:42:likes', (state: PNCounterState) => likes.merge(state));
const unsub = () => staff.sendsub('[COUNTERS]', 'post:42:likes', likes.delta());
likes.increment(); unsub(); // broadcast only this replica's own slot, not the whole vector

// OR-Set — e.g. collaboratively edited tag list
const tags = new OR_SET<string>(staff.instanceId, hlc);
tags.add('urgent');
tags.add('bug');
tags.remove('bug');
console.log(tags.values()); // ['urgent']

staff.multisub('[TAGS]', 'post:42', (state: ORSetState<string>) => tags.merge(state));
staff.sendsub('[TAGS]', 'post:42', tags.getState());

// LWW-Register — e.g. a single "status" field multiple agents might set concurrently
const status = new LWW_REGISTER<'pending' | 'claimed' | 'done'>(staff.instanceId, hlc, 'pending');
status.set('claimed');
console.log(status.get()); // 'claimed'

staff.multisub('[TASK_STATUS]', 'task:7', (state: LWWState<string>) => status.merge(state));
staff.sendsub('[TASK_STATUS]', 'task:7', status.getState());
 */
export class PN_COUNTER {
    positive = {};
    negative = {};
    nodeId;
    constructor(nodeId) {
        this.nodeId = nodeId;
    }
    increment(amount = 1) {
        this.positive[this.nodeId] = (this.positive[this.nodeId] ?? 0) + amount;
    }
    decrement(amount = 1) {
        this.negative[this.nodeId] = (this.negative[this.nodeId] ?? 0) + amount;
    }
    value() {
        const sum = (rec) => Object.values(rec).reduce((a, b) => a + b, 0);
        return sum(this.positive) - sum(this.negative);
    }
    /** Element-wise max merge — this is what makes concurrent increments
     * conflict-free: each node only ever grows its own slot, merge never loses
     * a contribution regardless of what order states arrive in. */
    merge(other) {
        const state = other instanceof PN_COUNTER ? other.getState() : other;
        for (const [node, count] of Object.entries(state.positive)) {
            this.positive[node] = Math.max(this.positive[node] ?? 0, count);
        }
        for (const [node, count] of Object.entries(state.negative)) {
            this.negative[node] = Math.max(this.negative[node] ?? 0, count);
        }
    }
    getState() {
        return { positive: { ...this.positive }, negative: { ...this.negative } };
    }
    setState(state) {
        this.positive = {};
        for (const [k, v] of Object.entries(state.positive))
            this.positive[k] = v;
        this.negative = {};
        for (const [k, v] of Object.entries(state.negative))
            this.negative[k] = v;
    }
    /** Only this replica's own slot — sufficient for merge() on the receiving
     * end (max() with an unrelated node's existing value is a no-op), and far
     * smaller than getState() once many nodes have contributed over time. This
     * is the delta-state escape hatch from the gap analysis — not a generic
     * DIFFPATCH integration, since the whole state here is already just two
     * flat node->number maps; diffing that would add overhead, not save it. */
    delta() {
        return {
            positive: this.nodeId in this.positive ? { [this.nodeId]: this.positive[this.nodeId] } : {},
            negative: this.nodeId in this.negative ? { [this.nodeId]: this.negative[this.nodeId] } : {},
        };
    }
}
// #endregion
