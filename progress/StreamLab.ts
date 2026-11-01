

import { AsyncLocalStorage } from 'node:async_hooks';



/* ------------------------------------------------------------------ */
/* Bus contract — the surface StreamLab depends on                    */
/* ------------------------------------------------------------------ */

export interface StaffBus {
  CH_1: string;
  CH_2: string;
  CH_3: string;
  CH_4: string;
  send(data: unknown, quad: string, trip: string, sub: string, ch: string): void;
  sendsub(data: unknown, quad: string, trip: string, sub: string, ch: string): Promise<void>;
  sub(handler: (data: unknown) => void, quad: string, trip: string, sub: string, ch: string): () => void;
  multisub(handler: (data: unknown) => MaybePromise<void>, quad: string, trip: string, sub: string, ch: string): unknown;
}

/* ------------------------------------------------------------------ */
/* Wire envelope                                                       */
/* ------------------------------------------------------------------ */





/* ------------------------------------------------------------------ */
/* StreamLab                                                           */
/* ------------------------------------------------------------------ */



export class StreamLab {

  private readonly opts: { metrics?: (m: StreamLabMetrics) => void } = {}
  // private readonly defaultOffsets = new MemoryOffsetStore();
  // private readonly als = new AsyncLocalStorage<SauronStore>();
  // private readonly shared = new SauronStore();
  private readonly closeHandlers = new Set<() => void>();
  private relayCounter = 0;
  private closed = false;
  public WIRE_VERSION = 1;
  public STREAMLAB_VERSION = '1.0.0';
  private readonly counters: StreamLabMetrics = {
    dataSent: 0, dataAcked: 0, dataRetransmitted: 0, nackSent: 0, nackReceived: 0,
    overflow: 0, dlq: 0, dropped: 0, errors: 0, streamsActive: 0, streamsCompleted: 0,
    relaySent: 0,
  };
  withRequestScope<R>(fn: () => R): R {
    // tried to get snapshot of
    return this.als.run(fn);
  }
  dehydrate(): Record<string, unknown> {
    //  return this.getStore().snapshot();
  }
  hydrate(p: Record<string, unknown>, opts: { replace?: boolean } = {}): void {
    const store = this.getStore();
    for (const [k, v] of Object.entries(p)) store.set(k, v);
    void opts;
  }
  private subscribe(
    handler: (d: unknown) => MaybePromise<void>,
    quad: string, trip: string, sub: string, ch: string,
  ): () => void {
    let closed = false;
    let close: (() => void) | null = null;
    const result = this.staff.multisub(
      (d) => { if (!closed) return handler(d); },
      quad, trip, sub, ch,
    );
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<() => void>).then((u) => { if (closed) { const fn = u; fn?.(); } else close = u; }).catch(() => { });
    } else {
      close = result as () => void;
    }
    const unsub = () => { closed = true; if (close) { const fn = close; close = null; fn(); } };
    this.closeHandlers.add(unsub);
    return () => { this.closeHandlers.delete(unsub); unsub(); };
  }
  private trackActive(delta: number) {
    this.counters.streamsActive = Math.max(0, this.counters.streamsActive + delta);
    this.opts.metrics?.(this.counters);
  }
  public async sync(chunks: any[], k: string, sl = this.CH_1, ms = this.CH_1, rt = this.CH_1, onAck?: (seq: number) => void, windowSize = 32, binary = false, opts: SyncSendOptions = {},): Promise<void> {
    const sid = streamId(k, sl, ms, rt, opts.name ?? 'sync');
    const epoch = opts.epoch ?? newEpoch();
    const trace = opts.trace ?? newTrace();
    const total = chunks.length;
    const win = Math.max(1, opts.windowSize ?? windowSize);
    const timeoutMs = opts.timeoutMs ?? 2_500;
    const maxRetries = opts.maxRetries ?? 5;
    const backoffBase = opts.backoffBaseMs ?? 150;
    const ackTopic = `sync.${sid}:ack`;
    const retransmitTopic = `sync.${sid}:retransmit`;
    const abortTopic = `sync.${sid}:abort`;
    const doneTopic = `sync.${sid}:done`;

    return new Promise<void>((resolve, reject) => {
      const unacked = new Map<number, { p: unknown; retries: number; timer: ReturnType<typeof setTimeout> | null }>();
      const failed = new Set<number>();
      let cursor = 0;
      let finished = false;
      let closed = false;
      const mk = (kind: WireKind, seq: number, extra: Partial<WireEnvelope> = {}): WireEnvelope => ({
        v: this.WIRE_VERSION, kind, sid, epoch, seq, total, trace, ...extra,
      });
      const sendChunk = (seq: number) => {
        const entry = unacked.get(seq);
        if (!entry || closed) return;
        const { enc, data } = encodePayload(entry.p, binary);

        this.send(mk('data', seq, { data, enc, retryOf: entry.retries > 0 ? seq : undefined }), k, sl, ms, rt).send().catch((err) => failSeq(seq, err));

        this.counters.dataSent++;
        if (entry.retries > 0) this.counters.dataRetransmitted++;
        armTimer(seq);
      };
      const armTimer = (seq: number) => {
        const entry = unacked.get(seq);
        if (!entry) return;
        if (entry.timer) clearTimeout(entry.timer);
        const backoff = Math.min(backoffBase * 2 ** Math.min(entry.retries, 10), 30_000);
        const jitter = Number.parseInt(fnv1a(`${sid}:${seq}`), 36) % 47; // deterministic jitter, no RNG in protocol
        entry.timer = setTimeout(() => {
          if (closed || !unacked.has(seq)) return;
          entry.retries++;
          if (entry.retries > maxRetries) {
            failSeq(seq, new Error(`chunk ${seq} unacked after ${maxRetries} retries`));
            return;
          }
          sendChunk(seq);
        }, timeoutMs + backoff + jitter);
      };
      const failSeq = (seq: number, err: unknown) => {
        if (closed || failed.has(seq)) return;
        failed.add(seq);
        const entry = unacked.get(seq);
        if (entry) { if (entry.timer) clearTimeout(entry.timer); unacked.delete(seq); }
        this.counters.dlq++;
        const env = mk('data', seq, { data: entry?.p, enc: entry ? 'json' : undefined });
        Promise.resolve(opts.onDlq?.(env, err instanceof Error ? err.message : String(err))).catch(() => { });
        this.opts.metrics?.(this.counters);
        maybeFinish();
      };
      const finish = (err: Error | null) => {
        if (closed) return;
        closed = true;
        finished = true;
        for (const entry of unacked.values()) if (entry.timer) clearTimeout(entry.timer);
        unacked.clear();
        this.trackActive(-1);
        if (err) {
          this.counters.errors++;

          this.send(mk('abort', 0, { reason: err.message }), k, abortTopic, ms, rt).send().catch(() => { });
          reject(err);
        } else {
          this.counters.streamsCompleted++;

          this.send(mk('done', total, {}), k, doneTopic, ms, rt).send().catch(() => { });
          resolve();
        }
      };
      const maybeFinish = () => {
        if (closed || finished) return;
        if (opts.signal?.aborted) { finish(new Error('sync aborted by signal')); return; }
        if (cursor < total) return;
        if (unacked.size > 0) return;
        if (failed.size > 0) {
          finish(new Error(`sync ${sid} incomplete: chunk(s) [${[...failed].sort((a, b) => a - b).join(',')}] failed`));
        } else {
          finish(null);
        }
      };
      const pump = () => {
        while (!closed && unacked.size < win && cursor < total) {
          const seq = cursor++;
          unacked.set(seq, { p: chunks[seq], retries: 0, timer: null });
          if (opts.onProgress) opts.onProgress(total - unacked.size - failed.size, total);
          sendChunk(seq);
        }
      };
      const closeAck = this.handler((raw) => {
        const env = parseEnvelope(raw);
        if (!env || env.sid !== sid || env.epoch !== epoch || env.kind !== 'ack') return;
        const entry = unacked.get(env.seq);
        if (!entry) return; // duplicate/late ack
        if (entry.timer) clearTimeout(entry.timer);
        unacked.delete(env.seq);
        this.counters.dataAcked++;
        this.opts.metrics?.(this.counters);
        onAck?.(env.seq);
        if (opts.onProgress) opts.onProgress(total - unacked.size - failed.size, total);
        pump();
        maybeFinish();
      }, k, ackTopic, ms, rt);
      const closeNack = this.handler((raw) => {
        const env = parseEnvelope(raw);
        if (!env || env.sid !== sid || env.epoch !== epoch || env.kind !== 'nack') return;
        this.counters.nackReceived++;
        const entry = unacked.get(env.seq);
        if (!entry) return;
        entry.retries++;
        if (entry.retries > maxRetries) {
          failSeq(env.seq, new Error(`chunk ${env.seq} nacked to exhaustion`));
          return;
        }
        sendChunk(env.seq);
      }, k, retransmitTopic, ms, rt);
      const closeAbort = this.handler((raw) => {
        const env = parseEnvelope(raw);
        if (!env || env.sid !== sid || env.epoch !== epoch || env.kind !== 'abort') return;
        finish(new Error(`sync ${sid} aborted by receiver: ${env.reason ?? 'unknown'}`));
      }, k, abortTopic, ms, rt);
      const onAbort = () => finish(new Error('sync aborted by signal'));
      opts.signal?.addEventListener('abort', onAbort, { once: true });
      this.closeHandlers.add(() => {
        opts.signal?.removeEventListener('abort', onAbort);
        closeAck(); closeNack(); closeAbort();
        finished = true;
        for (const entry of unacked.values()) if (entry.timer) clearTimeout(entry.timer);
        unacked.clear();
      });

      pump();
      maybeFinish();

      if (chunks.length === 0) {
        // empty stream completes immediately, done already sent by maybeFinish
      }
    });
  }// syncSub() — receiver: ordered processing, dedupe, retransmit
  public syncSub(handler: (chunk: any, seq: number) => MaybePromise<void>, k: string, sl = this.CH_1, ms = this.CH_1, rt = this.CH_1, binary = false, opts: SyncSubOptions = {},): SyncHandle {
    const sid = streamId(k, sl, ms, rt, opts.name ?? 'sync');
    const maxSkew = opts.maxSkew ?? 4096;
    const bufferTtlMs = opts.bufferTtlMs ?? 10_000;
    const nackDelayMs = opts.nackDelayMs ?? 250;
    const nackBatch = opts.nackBatch ?? 64;
    const graceMs = opts.graceMs ?? 2_000;
    // const store = opts.offsetStore ?? this.defaultOffsets;
    const ackTopic = `sync.${sid}:ack`;
    const retransmitTopic = `sync.${sid}:retransmit`;
    const doneTopic = `sync.${sid}:done`;
    const abortTopic = `sync.${sid}:abort`;
    const dlqTopic = `sync.${sid}:dlq`;
    const trace = newTrace();

    const state = {
      epoch: null as string | null,
      total: 0,
      expected: 0,
      processing: new Set<number>(),
      buffer: new Map<number, WireEnvelope>(),
      bufferTimers: new Map<number, ReturnType<typeof setTimeout>>(),
      executor: new SerialExecutor(),
      nackPending: false,
      nackTimer: null as ReturnType<typeof setTimeout> | null,
      doneSeen: false,
      closed: false,
    };

    let cpTimer: ReturnType<typeof setTimeout> | null = null;
    let resolveComplete: () => void = () => { };
    let rejectComplete: (err: Error) => void = () => { };
    const completion = new Promise<void>((res, rej) => { resolveComplete = res; rejectComplete = rej; });

    const sendControl = (kind: WireKind, seq: number, topic: string, reason?: string) => {
      if (state.closed) return;
      const env: WireEnvelope = { v: WIRE_VERSION, kind, sid, epoch: state.epoch ?? '', seq, total: state.total, trace, reason };

      return this.send(env, k, topic, ms, rt).send().catch(() => { });
    };

    const sendAck = (seq: number) => sendControl('ack', seq, ackTopic);
    const sendNack = (seq: number) => sendControl('nack', seq, retransmitTopic);
    const sendAbort = (reason: string) => sendControl('abort', 0, abortTopic, reason);
    const scheduleCheckpoint = () => {
      if (cpTimer) return;
      cpTimer = setTimeout(() => {
        cpTimer = null;
        if (state.closed || state.epoch === null) return;
        tc.set(sid, { epoch: state.epoch, offset: state.expected }).catch(() => { });
      }, opts.checkpointEveryMs ?? 200);
    };
    const clearBufferTimers = () => { for (const t of state.bufferTimers.values()) clearTimeout(t); state.bufferTimers.clear(); };
    const finish = () => {
      if (state.closed) return;
      state.closed = true;
      if (state.nackTimer) clearTimeout(state.nackTimer);
      clearBufferTimers();
      if (cpTimer) clearTimeout(cpTimer);
      closeData(); closeDone(); closeAbort();
      this.trackActive(-1);
      this.counters.streamsCompleted++;
      tc.set(sid, { epoch: state.epoch, offset: state.expected }).catch(() => { });
      this.opts.metrics?.(this.counters);
      opts.onComplete?.();
      resolveComplete();
    };
    const fail = (err: Error) => {
      if (state.closed) return;
      state.closed = true;
      if (state.nackTimer) clearTimeout(state.nackTimer);
      clearBufferTimers();
      if (cpTimer) clearTimeout(cpTimer);
      closeData(); closeDone(); closeAbort();
      this.trackActive(-1);
      this.counters.errors++;
      this.opts.metrics?.(this.counters);
      tc.delete(sid).catch(() => { });
      sendAbort(err.message);
      opts.onComplete?.(err);
      rejectComplete(err);
    };
    const dlq = (env: WireEnvelope, reason: string) => {
      this.counters.dlq++;
      this.opts.metrics?.(this.counters);
      if (opts.onDlq) { Promise.resolve(opts.onDlq(env, reason)).catch(() => { }); return; }
      this.send({ ...env, kind: 'dlq', reason }, k, dlqTopic, ms, rt).catch(() => { }).send();
    };
    const overflow = (env: WireEnvelope, reason: string) => { this.counters.overflow++; dlq(env, reason); };
    const collectMissing = (): number[] => {
      const out: number[] = [];
      let s = state.expected;
      const cap = Math.min(nackBatch, maxSkew);
      while (out.length < cap && s < state.total) {
        if (!state.buffer.has(s)) out.push(s);
        s++;
      }
      return out;
    };
    const scheduleNack = () => {
      if (state.nackPending || state.closed) return;
      state.nackPending = true;
      state.nackTimer = setTimeout(() => {
        state.nackPending = false;
        state.nackTimer = null;
        if (state.closed) return;
        const missing = collectMissing();
        for (const seq of missing) { state.total > 0 && sendNack(seq); this.counters.nackSent++; }
        this.opts.metrics?.(this.counters);
      }, nackDelayMs);
    };
    const scheduleBufferTtl = (seq: number) => {
      const t = setTimeout(() => {
        state.bufferTimers.delete(seq);
        const env = state.buffer.get(seq);
        if (env && !state.closed) {
          state.buffer.delete(seq);
          overflow(env, `buffer TTL exceeded at seq ${seq}`);
        }
      }, bufferTtlMs);
      state.bufferTimers.set(seq, t);
    };
    const processSeq = (env: WireEnvelope) => {
      if (state.processing.has(env.seq)) { sendAck(env.seq); return; } // duplicate in flight
      state.processing.add(env.seq);
      state.executor.enqueue(async () => {
        if (state.closed || env.seq !== state.expected) return;
        const data = decodePayload(env, binary);
        await handler(data, env.seq);
        state.processing.delete(env.seq);
        state.expected = env.seq + 1;
        scheduleCheckpoint();
        await sendAck(env.seq);
        drain();
      }).catch((err: Error) => {
        state.processing.delete(env.seq);
        fail(new Error(`handler failed at seq ${env.seq}: ${err?.message ?? err}`));
      });
    };
    const drain = () => {
      while (!state.closed) {
        const next = state.buffer.get(state.expected);
        if (!next) break;
        state.buffer.delete(state.expected);
        const t = state.bufferTimers.get(state.expected);
        if (t) { clearTimeout(t); state.bufferTimers.delete(state.expected); }
        processSeq(next);
      }
    };
    const onData = (raw: unknown) => {
      const env = parseEnvelope(raw);
      if (!env || env.sid !== sid || env.kind !== 'data' || state.closed) return;

      if (state.epoch === null) {
        if (opts.epoch && opts.epoch !== env.epoch) return; // not our run
        state.epoch = env.epoch;
        this.trackActive(1);
        if (opts.epoch === env.epoch) {
          void tc.get(sid).then((cp) => { if (cp && cp.epoch === env.epoch && !state.closed) state.expected = Math.max(state.expected, cp.offset); }).catch(() => { });
        }// stale run 
      } else if (env.epoch !== state.epoch) { return; }
      state.total = env.total;

      if (env.seq < state.expected) { sendAck(env.seq); return; }           // ack replay / dedupe
      if (state.processing.has(env.seq)) { sendAck(env.seq); return; }      // in flight
      if (state.buffer.has(env.seq)) { sendAck(env.seq); return; }          // duplicate
      if (env.seq === state.expected) { processSeq(env); return; }
      if (state.buffer.size >= maxSkew || env.seq - state.expected > maxSkew) {
        overflow(env, `reorder skew exceeded (expected ${state.expected}, got ${env.seq})`); return;
      }
      state.buffer.set(env.seq, env);
      scheduleBufferTtl(env.seq);
      scheduleNack();
    };
    const onDone = (raw: unknown) => {
      const env = parseEnvelope(raw);
      if (!env || env.sid !== sid || env.kind !== 'done' || env.epoch !== state.epoch || state.closed) return;
      state.doneSeen = true;
      void state.executor.idle.then(() => {
        if (state.closed) return;
        if (state.expected >= env.total && state.buffer.size === 0 && state.processing.size === 0) { finish(); return; }
        scheduleNack();
        setTimeout(() => {
          if (state.closed) return;
          if (state.expected >= env.total && state.buffer.size === 0 && state.processing.size === 0) { finish(); return; }
          fail(new Error(`stream ${sid} incomplete after done: missing [${collectMissing().join(',')}]`));
        }, graceMs);
      });
    };
    const onAbort = (raw: unknown) => {
      const env = parseEnvelope(raw);
      if (!env || env.sid !== sid || env.kind !== 'abort' || env.epoch !== state.epoch || state.closed) return;
      fail(new Error(`sender aborted: ${env.reason ?? 'unknown'}`));
    };

    const closeData = this.subscribe(onData, k, sl, ms, rt);
    const closeDone = this.subscribe(onDone, k, doneTopic, ms, rt);
    const closeAbort = this.subscribe(onAbort, k, abortTopic, ms, rt);

    const handle: SyncHandle = {
      close() {
        if (!state.closed) finish(); // graceful teardown: checkpoint + resolve
      },
      whenComplete: () => completion,
      state: () => ({ epoch: state.epoch, expected: state.expected, buffered: state.buffer.size }),
    };
    this.closeHandlers.add(handle.close);
    return handle;
  }// relay() — fan-out with enforced backpressure 
  public relay(k: string, sl = this.CH_1, ms = this.CH_1, rt = this.CH_1, options: RelayOptions = {},): RelayHandle {
    const maxSubscribers = options.maxSubscribers ?? 100;
    const bufferSize = options.bufferSize ?? 1000;
    const strategy = options.backpressureStrategy ?? 'pause';
    const relayBase = `relay:${normCh(k)}`;
    const subs = new Map<string, RelaySub>();
    let ended = false;
    let lastSeq = 0;
    const self = this;

    const pumpLoop = (sub: RelaySub): Promise<void> => (async () => {
      while (!sub.closed) {
        while (!sub.closed && !sub.paused && sub.buffer.length > 0) {
          const env = sub.buffer.shift()!;
          try { await this.send(env, `${relayBase}:${sub.id}`, sl, ms, rt).send(); this.counters.relaySent++; }
          catch { this.counters.errors++; break; }// bus down — drop this subscriber instead of wedging publish
        }
        if (sub.closed) break;
        await new Promise<void>((res) => { sub.notify = res; });
      }
    })();
    const wake = (sub: RelaySub) => { if (sub.notify) { const n = sub.notify; sub.notify = null; n(); } };
    return {
      async publish(chunk: unknown) {
        if (ended) return;
        const seq = ++lastSeq;
        const env: WireEnvelope = { v: this.WIRE_VERSION, kind: 'data', sid: relayBase, epoch: 'relay', seq, total: 0, trace: newTrace(), data: chunk };
        await Promise.all([...subs.values()].map(async (sub) => {
          if (sub.closed) return;
          if (sub.buffer.length >= bufferSize) {
            switch (strategy) {
              case 'error': throw new Error(`relay ${relayBase}: subscriber ${sub.id} buffer overflow (${bufferSize})`);
              case 'drop': self.counters.dropped++; self.opts.metrics?.(self.counters); return;
              case 'pause':
                sub.paused = true;
                self.counters.dropped++;
                self.opts.metrics?.(self.counters);
                return;
            }
          }
          sub.buffer.push(env);
          wake(sub);
        }));
      },

      subscribe(handler: (chunk: unknown) => void) {
        if (ended) throw new Error(`relay ${relayBase} is ended`);
        if (subs.size >= maxSubscribers) throw new Error(`relay ${relayBase} at capacity (${maxSubscribers})`);
        const id = `s${Date.now().toString(36)}-${(++self.relayCounter).toString(36)}`;
        const sub: RelaySub = { id, buffer: [], paused: false, closed: false, notify: null, pump: Promise.resolve() };
        sub.pump = pumpLoop(sub);
        subs.set(id, sub);

        const unsubBus = self.handler((raw) => {
          const env = parseEnvelope(raw);
          if (!env || env.kind !== 'data' || env.sid !== relayBase) return;
          handler(env.data);
        }, `${relayBase}:${id}`, sl, ms, rt);

        const subHandle: RelaySubscription = {
          unsubscribe: () => { sub.closed = true; subs.delete(id); wake(sub); unsubBus(); },
          pause: () => { sub.paused = true; },
          resume: () => { sub.paused = false; wake(sub); },
          getBufferSize: () => sub.buffer.length,
        };
        return subHandle;
      },

      async end() {
        if (ended) return;
        ended = true;
        const drain = [...subs.values()].map(async (sub) => {
          sub.paused = false;
          wake(sub);
          while (!sub.closed && sub.buffer.length > 0) await sleep(2);
        });
        await Promise.all(drain);
        await Promise.all([...subs.values()].map((sub) =>
          self.send({ v: this.WIRE_VERSION, kind: 'done', sid: relayBase, epoch: 'relay', seq: 0, total: 0, trace: newTrace() }, `${relayBase}:${sub.id}`, sl, ms, rt).catch(() => { })
        ));
        for (const sub of subs.values()) sub.closed = true;
        subs.clear();
      },

      stats: () => ({ subscribers: subs.size, ended }),
    };
  }

  /* ================================================================ */
  /* useDRS() / useStateDRS() — isomorphic mirrored state             */
  /* ================================================================ */

  public drsKey(quad: string, trip: string, sub: string, ch: string): string {
    return [normCh(quad), normCh(trip), normCh(sub), normCh(ch)].join(':');
  }

  public useDRS(
    initial: any,
    k = this.staff.CH_4,
    sl = this.staff.CH_3,
    ms = this.staff.CH_2,
    rt = this.staff.CH_1,
    opts: DRSHookOptions = {},
  ) {
    const key = this.drsKey(k, sl, ms, rt);
    const store = this.getStore();

    const [state, setState] = React.useState<any>(() => {
      const hydrated = opts.hydrate?.(key);
      if (hydrated !== undefined) return hydrated; // client-side hydration p
      const existing = store.get(key);
      if (existing !== undefined) return existing;
      return isFunc(initial) ? (initial as () => any)() : initial;
    });

    React.useEffect(() => {
      const unsubBus = this.staff.sub((incoming: any) => {
        store.set(key, incoming);
        setState(incoming);
      }, k, sl, ms, rt);
      const unsubLocal = store.on(key, (v) => setState(v));
      return () => { unsubBus(); unsubLocal(); };
    }, [key, k, sl, ms, rt, store]);

    const setLive = React.useCallback((next: any) => {
      const current = store.get(key);
      const nv = isFunc(next) ? (next as (prev: any) => any)(current) : next;
      store.set(key, nv);
      this.staff.send(nv, k, sl, ms, rt);
    }, [key, k, sl, ms, rt, store]);

    return [state, setLive] as const;
  }

  /** Back-compat alias — identical implementation, no duplicated logic. */
  public useStateDRS(
    initial: any,
    k?: string,
    sl?: string,
    ms?: string,
    rt?: string,
    opts?: DRSHookOptions,
  ) {
    return this.useDRS(initial, k as string, sl as string, ms as string, rt as string, opts);
  }

  /* ---------------- lifecycle ---------------- */

  public metrics(): StreamLabMetrics { return { ...this.counters }; }

  public async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    for (const h of [...this.closeHandlers]) { try { h(); } catch { /* ignore */ } }
    this.closeHandlers.clear();
  }
}
