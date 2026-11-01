import { signals } from "../../../protocols/signals.ts";
/**
 * streamRelay — deterministic fan-out bridge.
 *
 * Ingest on a rt; fan out to N subscribers. Guarantees:
 *   - Ordered: a subscriber sees payloads in ingest order.
 *   - Bounded buffering: `bufferSize` (default 512) caps how much a slow
 *     subscriber can queue before backpressure kicks in.
 *   - Strategy:
 *       "pause" — the relay pauses (stops ingesting) while any subscriber
 *                 is over threshold, then drains on resume.
 *       "drop"  — oldest p is dropped for the slow subscriber.
 *       "error" — the relay raises a listener error.
 *
 * The `pause()` used to be dead code (buffer never drained on resume); here
 * `resume()` drains the buffered queue so "pause" is real backpressure.
 */
// #region STREAM RELAY
export class StreamRelay {
    k;
    sl;
    ms;
    rt;
    maxSubscribers;
    bufferSize;
    strategy;
    subs = new Set();
    buffer = [];
    paused = false;
    ingesting = false;
    unsub;
    errorHandler;
    constructor(k = signals.CH_4, sl = signals.CH_3, ms = signals.CH_2, rt = signals.CH_1, opts = {}) {
        this.k = k;
        this.sl = sl;
        this.ms = ms;
        this.rt = rt;
        this.maxSubscribers = opts.maxSubscribers ?? 32;
        this.bufferSize = opts.bufferSize ?? 512;
        this.strategy = opts.backpressureStrategy ?? "pause";
    }
    onError(cb) { this.errorHandler = cb; }
    subscribe(fn) {
        if (this.subs.size >= this.maxSubscribers) {
            throw new Error(`streamRelay ${this.rt}: max subscribers (${this.maxSubscribers})`);
        }
        this.subs.add(fn);
        if (!this.unsub) {
            this.unsub = signals.sub(this.k, (data) => { this.ingest(data); }, this.sl, this.ms, this.rt);
        }
        return () => {
            this.subs.delete(fn);
            if (this.subs.size === 0 && this.unsub) {
                this.unsub();
                this.unsub = undefined;
            }
        };
    }
    ingest(data) {
        if (this.paused || this.ingesting) {
            this.buffer.push(data);
            if (this.buffer.length > this.bufferSize)
                this.applyBackpressure();
            return;
        }
        this.ingesting = true;
        try {
            for (const fn of [...this.subs]) {
                try {
                    fn(data);
                }
                catch (err) {
                    this.handleError(err);
                }
            }
        }
        finally {
            this.ingesting = false;
            this.drain();
        }
    }
    pause() { this.paused = true; }
    resume() {
        this.paused = false;
        this.drain();
    }
    drain() {
        if (this.paused || this.ingesting || this.buffer.length === 0)
            return;
        this.ingesting = true;
        try {
            const atOnce = this.buffer;
            this.buffer = [];
            for (const data of atOnce) {
                for (const fn of [...this.subs]) {
                    try {
                        fn(data);
                    }
                    catch (err) {
                        this.handleError(err);
                    }
                }
            }
        }
        finally {
            this.ingesting = false;
        }
        if (this.buffer.length > 0)
            this.drain();
    }
    applyBackpressure() {
        if (this.strategy === "pause")
            this.paused = true;
        else if (this.strategy === "drop")
            this.buffer.shift();
        else if (this.strategy === "error") {
            const err = new Error(`streamRelay ${this.rt}: buffer overflow`);
            if (this.errorHandler)
                this.errorHandler(err);
            else
                reportError(err);
        }
    }
    handleError(err) { if (this.errorHandler)
        this.errorHandler(err);
    else
        reportError(err); }
    bufferedCount() { return this.buffer.length; }
    subscriberCount() { return this.subs.size; }
}
// #endregion
