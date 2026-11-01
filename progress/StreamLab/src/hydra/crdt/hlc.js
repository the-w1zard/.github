// crdt/hlc.ts — Hybrid Logical Clock, conforming to the `HLC` interface
// declared in the collab suite (yata.ts): tick() -> string, compare(a,b),
// update(remote). Swap for the real HYBRID_LOGICAL_CLOCK at integration —
// this is the in-lab stand-in so HYDRA's CRDT layer runs standalone.
//
// Format: `${physicalMs}:${counter}:${nodeId}` — compare() lexicographic on
// the ms:counter portion then nodeId tiebreak; tick() advances counter when
// physical time hasn't moved; update(remote) keeps monotonic causality.
export class HLC {
    last = 0;
    counter = 0;
    nodeId;
    constructor(nodeId) {
        this.nodeId = nodeId;
    }
    tick() {
        const now = Date.now();
        if (now > this.last) {
            this.last = now;
            this.counter = 0;
        }
        else {
            this.counter++;
        }
        return `${this.last}:${this.counter}:${this.nodeId}`;
    }
    compare(a, b) {
        if (a === b)
            return 0;
        const [aMs, aC, aN] = split(a);
        const [bMs, bC, bN] = split(b);
        if (aMs !== bMs)
            return aMs < bMs ? -1 : 1;
        if (aC !== bC)
            return aC < bC ? -1 : 1;
        return aN < bN ? -1 : 1;
    }
    update(remote) {
        const [rMs, rC] = split(remote);
        const now = Date.now();
        if (now > this.last && now > rMs) {
            this.last = now;
            this.counter = 0;
            return;
        }
        if (rMs > this.last) {
            this.last = rMs;
            this.counter = rC + 1;
        }
        else if (this.last === rMs && rC >= this.counter) {
            this.counter = rC + 1;
        }
        // else: local is ahead, nothing to do
    }
}
function split(s) {
    const i1 = s.indexOf(':'), i2 = s.indexOf(':', i1 + 1);
    return [Number(s.slice(0, i1)), Number(s.slice(i1 + 1, i2)), s.slice(i2 + 1)];
}
