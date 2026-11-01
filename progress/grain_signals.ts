/*==========================================================================================================================
   SAURONS ATONS/SIGNALS - Fine-grained reactivity system
	 - Preact Signals pattern: DOM-level updates, not component re-renders 
	 - Solid's .track()/.untrack() for performance control
   - Vue's automatic dependency tracking in computed
   Platform agnostic - works anywhere JavaScript runs

   // EXAMPLE USAGE
   // Basic usage
   const count = grain(0);
   const double = computed(() => count() * 2);
 
   effect(() => {
     console.log(`Count: ${count()}, Double: ${double()}`);
   });
 
   count.value = 5; // Logs "Count: 5, Double: 10"
 
   // Batch updates
   batch(() => {
     count.value = 10;
     count.value = 15; // Only one log
   });
 
   // Performance control with track/untrack
   const items = grain([1, 2, 3, 4, 5]);
   const total = computed(() => {
     // Don't track array mutations, only track array itself
     track(items);
     return untrack(() => items.value.reduce((sum, n) => sum + n, 0));
   });
	============================================================================== ⇦✦──⇦✦──✦──✦──← 'pew pew' 🧙 [SAURONS SIGNALS] */
// #endregion 
//                                                                                               [GRAIN]
// #region ══════════════════════════════════════════════════════════════════════════════════════════════════════
class GRAINS_INIT {
  defaultEquals<T>(a: T, b: T): boolean {
    return Object.is(a, b);
  }
  public context: TrackingContext = {
    effect: null,
    computed: null,
    batchDepth: 0,
    updateDepth: 0,
    pendingEffects: new M2(),
  };
  /** Creates a reactive grain
   *
   * @example
   * const count = grain(0);
   * count.value = 5;
   * console.log(count()); // 5
   */
  grain<T>(initialValue: T, options: GrainOptions<T> = {}): Grain<T> {
    const equals = options.equals || this.defaultEquals;
    const self = this;
    let value = initialValue;

    // Track subscribers (effects that depend on this grain), keyed by the
    // callback so re-subscribing an effect never creates a second live entry
    const subscribers = new Map<EffectFunction, EffectFunction>();

    // Track computed signals that depend on this grain
    const computedDeps = new Set<ComputationFunction<any>>();

    // Register a read with the active tracking context
    const registerRead = () => {
      if (self.context.effect) {
        self.context.effect(grainFn);
      }
      if (self.context.computed) {
        computedDeps.add(self.context.computed);
      }
    };

    const grainFn = function () {
      registerRead();
      return value;
    } as Grain<T>;

    Object.defineProperty(grainFn, 'value', {
      get: () => {
        registerRead();
        return value;
      },
      set: (newValue: T) => {
        if (equals(value, newValue)) return;

        value = newValue;

        // Snapshot before notifying: running a subscriber may re-subscribe
        // effects (deps are cleaned up on each run), which would otherwise
        // be picked up mid-iteration and loop forever.
        const subs = [...subscribers.entries()];
        const comps = [...computedDeps];

        self.context.updateDepth++;
        try {
          // Recompute dependent computed signals FIRST, synchronously, so
          // effects never observe stale derived values. `comp` is the
          // computed's full recompute: it assigns the output grain and
          // queues its own subscribers' notifications.
          comps.forEach((comp) => comp());

          // Queue effect notifications (deduped by callback). Never run
          // them here: they flush once, after the graph has settled.
          subs.forEach(([fn, effect]) => self.context.pendingEffects.set(fn, effect));
        } finally {
          self.context.updateDepth--;
          if (self.context.updateDepth === 0) {
            self.flushEffects();
          }
        }
      },
      enumerable: true,
      configurable: false,
    });

    // Get value without tracking
    grainFn.peek = () => value;

    grainFn.subscribe = (fn: (value: T) => void) => {
      let wrapper = subscribers.get(fn as any);
      if (!wrapper) {
        wrapper = () => fn(value);
        subscribers.set(fn as any, wrapper);
      }
      return () => {
        subscribers.delete(fn as any);
      };
    };

    // Make iterable for use in templates
    grainFn[Symbol.iterator] = function* () {
      yield grainFn.value;
    };

    return grainFn;
  }
  /** Creates a computed grain that automatically tracks dependencies
   *
   * @example
   * const firstName = grain('John');
   * const lastName = grain('Doe');
   * const fullName = computed(() => `${firstName()} ${lastName()}`);
   * console.log(fullName.value); // "John Doe"
   */
  computed<T>(    compute: () => T,    options: GrainOptions<T> = {}  ): Grain<T> {
    const equals = options.equals ?? this.defaultEquals;
  
    const node: ComputedNode<T> = {
      version: 0,
      state: 'DIRTY',
      disposed: false,
      compute,
      equals,
      value: undefined as T,
      hasValue: false,
      sources: new Map(),
      dependents: new Set(),
    };
  
    const self = this;
  
    const unsubscribeAll = () => {
      for (const unsub of node.sources.values()) unsub();
      node.sources.clear();
    };
  
    const recompute = () => {
      if (node.disposed) return;
  
      unsubscribeAll();
  
      const previousEffect = self.context.effect;
      const previousComputed = self.context.computed;
  
      self.context.computed = pull;
      self.context.effect = (source: Grain<any>) => {
        if (node.sources.has(source)) return;
  
        const unsub = source.subscribe(onSourceChanged);
        node.sources.set(source, unsub);
      };
  
      node.state = 'DIRTY';
  
      try {
        const next = compute();
  
        if (!node.hasValue || !equals(node.value, next)) {
          node.value = next;
          node.hasValue = true;
          node.version++;
          markDependents(node);
        } else {
          node.state = 'CLEAN';
        }
      } finally {
        self.context.effect = previousEffect;
        self.context.computed = previousComputed;
      }
    };
  
    const pull = (): T => {
      if (node.disposed) {
        throw new Error('Cannot read a disposed computed grain');
      }
  
      if (node.state === 'CHECK') {
        // Verify whether any direct source actually changed.
        for (const source of node.sources.keys()) {
          source.peek(); // or a dedicated `validate()` hook
        }
      }
  
      if (node.state === 'DIRTY') {
        recompute();
      }
  
      return node.value;
    };
  
    const onSourceChanged = () => {
      if (node.disposed) return;
  
      // Direct source changed: this node must recompute.
      node.state = 'DIRTY';
      markDependents(node);
  
      self.context.pendingEffects.set(notify, notify);
      self.flushEffects();
    };
  
    const notify = () => {
      if (node.disposed) return;
  
      // Recompute lazily only if a subscriber/effect needs the value.
      // For an effect subscribed to this computed, the effect's own
      // notify will call `pull()` through its tracked read.
    };
  
    const computedFn = (() => pull()) as Grain<T>;
  
    Object.defineProperty(computedFn, 'value', {
      get: pull,
      set: () => {
        throw new Error('Computed grains are read-only');
      },
      enumerable: true,
    });
  
    computedFn.peek = pull;
    computedFn.subscribe = (fn: (value: T) => void) => {
      const wrapper = () => fn(pull());
      return this.trackSubscription(computedFn, wrapper);
    };
  
    node.dispose = () => {
      node.disposed = true;
      unsubscribeAll();
  
      for (const dependent of node.dependents) {
        dependent.dependents.delete(node as any);
      }
      node.dependents.clear();
  
      this.context.pendingEffects.delete(notify);
    };
  
    // Initial evaluation.
    pull();
  
    return computedFn;
  }
  // BATCHING - Like Vue's nextTick
  /** Batch multiple updates into one notification
   *
   * @example
   * batch(() => {
   *   count.value = 5;
   *   name.value = 'John';
   *   // Only one update notification
   * });
   */
  batchGrains(fn: () => void): void {
    this.context.batchDepth++;
    try {
      fn();
    } finally {
      this.context.batchDepth--;

      if (this.context.batchDepth === 0) {
        // Flush pending effects (deduped by callback)
        this.flushEffects();
      }
    }
  }// Schedule a function to run after current batch
  nextTick(fn?: () => void): Promise<void> {
    return Promise.resolve().then(() => {
      if (fn) fn();
    });
  }// EFFECTS - Like Vue's watch or Solid's createEffect Creates an effect that automatically tracks dependencies
  effect(fn: EffectFunction): () => void {
    const deps = new Map<Grain<any>, () => void>();
    let disposed = false;
    let queued = false;
  
    const execute = () => {
      if (disposed) return;
  
      const previousEffect = this.context.effect;
      const seen = new Set<Grain<any>>();
  
      this.context.effect = (sig: Grain<any>) => {
        if (deps.has(sig)) {
          seen.add(sig);
          return;
        }
  
        const unsub = sig.subscribe(notify);
        deps.set(sig, unsub);
        seen.add(sig);
      };
  
      try {
        fn();
      } finally {
        this.context.effect = previousEffect;
  
        for (const [sig, unsub] of deps) {
          if (!seen.has(sig)) {
            unsub();
            deps.delete(sig);
          }
        }
      }
    };
  
    const notify = () => {
      if (disposed || queued) return;
      queued = true;
  
      this.context.pendingEffects.set(notify, () => {
        queued = false;
        execute();
      });
  
      this.flushEffects();
    };
  
    execute();
  
    return () => {
      disposed = true;
      this.context.pendingEffects.delete(notify);
  
      for (const unsub of deps.values()) unsub();
      deps.clear();
    };
  }// Creates an effect that runs only when dependencies change (like Vue's watchEffect)
  watchEffect(fn: EffectFunction): () => void {
    return this.effect(fn);
  }// Watches specific sources
  watch<T>(
    source: Grain<T> | (() => T),
    callback: (value: T, oldValue: T) => void,
    options: { immediate?: boolean } = {}
  ): () => void {
    let oldValue: T;
    let initialized = !!options.immediate;

    if (initialized) {
      oldValue =
        typeof source === 'function'
          ? (source as () => T)()
          : (source as Grain<T>).value;
    }

    const effectFn = () => {
      const value =
        typeof source === 'function'
          ? (source as () => T)()
          : (source as Grain<T>).value;

      if (initialized) {
        callback(value, oldValue);
      }
      initialized = true;
      oldValue = value;
    };

    return this.effect(effectFn);
  }// TRACK/UNTRACK - Like Solid's .track and .untrack -- Run function without tracking dependencies
  untrack<T>(fn: () => T): T {
    const previousEffect = this.context.effect;
    const previousComputed = this.context.computed;

    this.context.effect = null;
    this.context.computed = null;

    try {
      return fn();
    } finally {
      this.context.effect = previousEffect;
      this.context.computed = previousComputed;
    }
  }
  /** Track dependencies manually
   *
   * @example
   * const names = grain(['John', 'Jane']);
   * const first = computed(() => {
   *   track(names); // Track array, not individual items
   *   return names.value[0];
   * });
   */
  track(...sources: any[]): void {
    sources.forEach((source) => {
      if (source && typeof source === 'function' && 'peek' in source) {
        // It's a grain, access it to trigger tracking
        if (this.context.effect || this.context.computed) {
          source();
        }
      }
    });
  }// MEMO - Like Vue's computed but with explicit dependency tracking
  /** Creates a memoized value that only recomputes when dependencies change
   *
   * @example
   * const list = grain([1, 2, 3, 4, 5]);
   * const total = memo(() => {
   *   return list.value.reduce((sum, n) => sum + n, 0);
   * }, [list]); // Explicit deps like useEffect
   */
  memo1<T>(compute: () => T, dependencies: any[], options: GrainOptions<T> = {}): Grain<T> {
    const equals = options.equals || this.defaultEquals;

    const snapshot = (d: any) =>
      d && typeof d === 'function' && 'peek' in d ? d.peek() : d;

    let oldDeps = dependencies.map(snapshot);

    // Initial compute
    const value = compute();

    // Create grain for the memoized value
    const memoGrain = this.grain(value, options);

    // Create effect to update when dependencies change
    this.effect(() => {
      const newDeps = dependencies.map((d) =>
        d && typeof d === 'function' && 'peek' in d ? d() : d
      );

      const depsChanged =
        newDeps.length !== oldDeps.length ||
        newDeps.some((dep, i) => !Object.is(dep, oldDeps[i]));

      if (depsChanged) {
        const newValue = compute();
        if (!equals(memoGrain.peek(), newValue)) {
          memoGrain.value = newValue;
        }
        oldDeps = newDeps;
      }
    });

    return memoGrain;
  }
  memo<T>( compute: () => T, _dependencies: unknown[] = [], options: GrainOptions<T> = {}  ): Grain<T> {
    return this.computed(compute, options);
  }// REACT INTEGRATION - DOM-level updates without component re-renders
  /** Hook to use signals in components with DOM-level updates
   *
   * @example
   * function Counter() {
   *   const count = useSignal(0);
   *
   *   return (
   *     <button onClick={() => count.value++}>
   *       Count: {count}
   *     </button>
   *   );
   * }
   */
  // PERFORMANCE OPTIMIZATIONS
  /** Creates a grain that only updates when condition is met */
  lazyGrain<T>(
    producer: () => T,
    condition: (value: T) => boolean = () => true
  ): Grain<T | undefined> {
    const sig = this.grain<T | undefined>(undefined);
    let initialized = false;

    this.effect(() => {
      const value = producer();

      if (!initialized || condition(value)) {
        sig.value = value;
        initialized = true;
      }
    });

    return sig;
  }// Creates a throttled grain
  throttledGrain<T>(source: Grain<T>, delay: number): Grain<T> {
    const output = this.grain<T>(source.peek());
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let latest = source.peek();
    let disposed = false;
  
    const dispose = this.effect(() => {
      latest = source();
  
      if (timeout !== null) return;
  
      timeout = setTimeout(() => {
        timeout = null;
        if (!disposed) output.value = latest;
      }, delay);
    });
  
    return Object.assign(output, {
      dispose: () => {
        disposed = true;
        if (timeout !== null) clearTimeout(timeout);
        dispose();
      },
    });
  }// Creates a debounced grain
  debouncedGrain<T>(source: Grain<T>, delay: number): Grain<T> {
    const debounced = this.grain(source.peek());
    let timeout: any = null;

    this.effect(() => {
      const value = source();

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        debounced.value = value;
      }, delay);
    });

    return debounced;
  }// UTILITIES Checks if a value is a grain
  isGrain(value: any): value is Grain {
    return !!value && typeof value === 'function' && 'peek' in value && 'subscribe' in value;
  }// Converts a grain to a readonly grain
  readonly<T>(sig: Grain<T>): Grain<T> {
    const readOnlySig = (() => sig()) as Grain<T>;

    Object.defineProperty(readOnlySig, 'value', {
      get: () => sig.value,
      set: () => {
        const g = globalThis as any;
        if (g.process?.env?.NODE_ENV !== 'production') {
          console.warn('Cannot set value on readonly grain');
        }
      },
      enumerable: true,
    });

    readOnlySig.peek = sig.peek;
    readOnlySig.subscribe = sig.subscribe;
    readOnlySig[Symbol.iterator] = sig[Symbol.iterator];

    return readOnlySig;
  }// Creates a grain from an async source
  fromAsync<T>(promise: Promise<T>, initialValue?: T): Grain<T | undefined> {
    const sig = this.grain<T | undefined>(initialValue);

    promise.then((value) => {
      sig.value = value;
    });

    return sig;
  }// Combines multiple signals into one
  combine = <T extends Record<string, Grain<any>>>(
    signals: T
  ): Grain<{ [K in keyof T]: T[K] extends Grain<infer U> ? U : never }> => {
    return this.computed(() => {
      const result: any = {};
      for (const [key, sig] of Object.entries(signals)) {
        result[key] = sig();
      }
      return result;
    });
  };


  /** diamond graph
   const a = grain(1);
   const b = computed(() => a.value * 2);
   const c = computed(() => a.value * 3);
   const d = computed(() => b.value + c.value);
*/
private markDependents(node: ComputedNode<any>): void {
 for (const dependent of node.dependents) {
   if (dependent.disposed) continue;

   // A direct dependency changed, so this dependent must recompute.
   dependent.state = 'DIRTY';

   // Transitively affected computeds only need to be checked.
   for (const indirect of dependent.dependents) {
     if (!indirect.disposed && indirect.state === 'CLEAN') {
       indirect.state = 'CHECK';
     }
   }
 }
}
  private flushEffects(): void {
    if (this.context.updateDepth > 0 || this.context.batchDepth > 0) return;
  
    this.context.updateDepth++;
  
    try {
      while (this.context.pendingEffects.size > 0) {
        const pending = [...this.context.pendingEffects.values()];
        this.context.pendingEffects.clear();
  
        for (const run of pending) {
          run(); // effect reads computeds; pulls refresh them here
        }
      }
    } finally {
      this.context.updateDepth--;
    }
  }
}
// #endregion 
//                                                                                             [HELPERS]
// #region ══════════════════════════════════════════════════════════════════════════════════════════════════════
const defaultEquals = <T>(a: T, b: T): boolean => Object.is(a, b);
function isGrain(value: unknown): value is Grain<any> {
  return (
    !!value &&
    typeof value === 'function' &&
    'peek' in value &&
    'subscribe' in value &&
    'dispose' in value
  );
}
export function createReactiveSystem() {
  const context = {
    effect: null as ((node: ReactiveNode) => void) | null,
    computed: null as ComputedNode<any> | null,
    cleanup: null as ((fn: DisposeFn) => void) | null,
    batchDepth: 0,
    flushDepth: 0,
    pendingEffects: new Map<() => void, () => void>(),
  };

  /** dirty propagation
   * A node’s value changed (or may have changed).
   *
   * Direct dependents become DIRTY: they must recompute.
   * Their direct dependents become CHECK: they must verify whether
   * they are actually affected before recomputing.
   */
  function markDependents(node: ReactiveNode): void {
    for (const dependent of node.dependents) {
      if (dependent.disposed) continue;

      if (dependent.state === 'CLEAN' || dependent.state === 'CHECK') {
        dependent.state = 'DIRTY';
      }

      for (const indirect of dependent.dependents) {
        if (
          !indirect.disposed &&
          indirect.state === 'CLEAN'
        ) {
          indirect.state = 'CHECK';
        }
      }
    }
  }
  function flushEffects(): void {
    if (context.flushDepth > 0 || context.batchDepth > 0) return;

    context.flushDepth++;

    try {
      while (context.pendingEffects.size > 0) {
        const pending = [...context.pendingEffects.values()];
        context.pendingEffects.clear();

        for (const run of pending) {
          run();
        }
      }
    } finally {
      context.flushDepth--;
    }
  }
  function scheduleEffect(run: () => void): void {
    context.pendingEffects.set(run, run);
    flushEffects();
  }
  function grain<T>(initialValue: T, options: GrainOptions<T> = {}  ): Grain<T> {
    const equals = options.equals ?? defaultEquals;

    const node: SourceNode<T> = {
      type: 'source',
      state: 'CLEAN',
      disposed: false,
      value: initialValue,
      equals,
      dependents: new Set(),
      subscribers: new Map(),
    };

    const read = (): T => {
      if (node.disposed) {
        throw new Error('Cannot read a disposed grain');
      }

      if (context.effect) context.effect(node);
      if (context.computed) linkComputedToSource(context.computed, node);

      return node.value;
    };

    const write = (next: T): void => {
      if (node.disposed) {
        throw new Error('Cannot write to a disposed grain');
      }

      if (equals(node.value, next)) return;

      node.value = next;

      // This is the missing graph hookup:
      // every computed that directly reads this grain is now dirty.
      markDependents(node);

      for (const notify of node.subscribers.values()) {
        scheduleEffect(notify);
      }
    };

    const grainFn = read as Grain<T>;

    Object.defineProperty(grainFn, 'value', {
      get: read,
      set: write,
      enumerable: true,
    });

    grainFn.peek = () => node.value;

    grainFn.subscribe = (fn: (value: T) => void): DisposeFn => {
      const key = fn;
      const notify = () => fn(node.value);

      node.subscribers.set(key, notify);

      return () => {
        node.subscribers.delete(key);
      };
    };

    grainFn.dispose = () => {
      if (node.disposed) return;

      node.disposed = true;
      node.subscribers.clear();
      node.dependents.clear();
    };

    return grainFn;
  }
  function linkComputedToSource(computed: ComputedNode<any>, source: ReactiveNode  ): void {
    if (computed.sources.has(source)) return;

    const unsubscribe = source.subscribe(() => {
      onSourceChanged(computed, source);
    });

    computed.sources.set(source, unsubscribe);

    // Bidirectional edge: source knows its computed dependent.
    source.dependents.add(computed);
  }
  function unlinkStaleSources(computed: ComputedNode<any>): void {
    // Dependencies are rebuilt every run; remove edges that no longer exist.
    // Actual removal happens after the new dependency set is collected.
    computed.sources.forEach((unsubscribe, source) => {
      if (!currentSources.has(computed) || !currentSources.get(computed)!.has(source)) {
        unsubscribe();
        source.dependents.delete(computed);
        computed.sources.delete(source);
      }
    });
  }
  const currentSources = new WeakMap<
    ComputedNode<any>,
    Set<ReactiveNode>
  >();
  function onSourceChanged(computed: ComputedNode<any>, source: ReactiveNode  ): void {
    if (computed.disposed) return;

    // A direct source changed. This computed must recompute on next read.
    computed.state = 'DIRTY';

    // Propagate through the real graph.
    markDependents(computed);

    // Computeds do not run eagerly. Effects subscribed to this computed
    // will pull it when they execute.
    for (const notify of source.subscribers.values()) {
      scheduleEffect(notify);
    }
  }
  function computed<T>(compute: () => T, options: GrainOptions<T> = {}  ): Grain<T> {
    const equals = options.equals ?? defaultEquals;

    const node: ComputedNode<T> = {
      type: 'computed',
      state: 'DIRTY',
      disposed: false,
      compute,
      equals,
      value: undefined as T,
      hasValue: false,
      sources: new Map(),
      dependents: new Set(),
    };

    currentSources.set(node, new Set());

    const pull = (): T => {
      if (node.disposed) {
        throw new Error('Cannot read a disposed computed grain');
      }

      if (node.state === 'COMPUTING') {
        throw new Error('Circular computed dependency detected');
      }

      if (node.state === 'CHECK') {
        validateCheckState(node);
      }

      if (node.state === 'DIRTY') {
        recompute();
      }

      return node.value;
    };

    function validateCheckState(computed: ComputedNode<any>): void {
      // A CHECK node has an indirect dependency change.
      // Pull every direct source; if any becomes dirty and changes,
      // this node becomes dirty too.
      let changed = false;

      for (const source of [...computed.sources.keys()]) {
        if (source.type === 'computed') {
          const before = source.value;
          const value = (source as ComputedNode<any>).state === 'DIRTY'
            ? pullComputed(source as ComputedNode<any>)
            : source.value;

          if (!Object.is(before, value)) {
            changed = true;
          }
        }
      }

      computed.state = changed ? 'DIRTY' : 'CLEAN';
    }

    function pullComputed(computed: ComputedNode<any>): any {
      return computed.value;
    }

    function recompute(): void {
      if (node.disposed) return;

      const previousEffect = context.effect;
      const previousComputed = context.computed;
      const previousCleanup = context.cleanup;

      const seen = new Set<ReactiveNode>();
      currentSources.set(node, seen);

      const cleanups: DisposeFn[] = [];

      context.computed = node;
      context.effect = (source) => {
        if (seen.has(source)) return;

        seen.add(source);
        linkComputedToSource(node, source);
      };

      context.cleanup = (fn) => {
        cleanups.push(fn);
      };

      node.state = 'COMPUTING';

      try {
        const next = node.compute();

        const changed =
          !node.hasValue || !equals(node.value, next);

        if (changed) {
          node.value = next;
          node.hasValue = true;

          // The computed’s value changed, so its dependents are dirty.
          markDependents(node);
        }

        node.state = 'CLEAN';
      } finally {
        context.effect = previousEffect;
        context.computed = previousComputed;
        context.cleanup = previousCleanup;

        // Drop dependencies no longer read during this evaluation.
        for (const [source, unsubscribe] of [...node.sources]) {
          if (!seen.has(source)) {
            unsubscribe();
            source.dependents.delete(node);
            node.sources.delete(source);
          }
        }

        currentSources.set(node, seen);
      }
    }

    const computedFn = (() => pull()) as Grain<T>;

    Object.defineProperty(computedFn, 'value', {
      get: pull,
      set: () => {
        throw new Error('Computed grains are read-only');
      },
      enumerable: true,
    });

    computedFn.peek = pull;

    computedFn.subscribe = (fn: (value: T) => void): DisposeFn => {
      const notify = () => fn(pull());

      // Subscribe to the computed itself so effects re-run after pull.
      const effectDispose = effect(() => {
        fn(pull());
      });

      return effectDispose;
    };

    computedFn.dispose = () => {
      if (node.disposed) return;

      node.disposed = true;

      for (const [source, unsubscribe] of node.sources) {
        unsubscribe();
        source.dependents.delete(node);
      }

      node.sources.clear();
      node.dependents.clear();
      currentSources.delete(node);
    };

    // Evaluate once so the initial value is available synchronously.
    pull();

    return computedFn;
  }
  function effect(fn: EffectFunction): DisposeFn {
    let disposed = false;
    let cleanup: DisposeFn | null = null;

    const sources = new Map<ReactiveNode, DisposeFn>();
    const seen = new Set<ReactiveNode>();

    const run = () => {
      if (disposed) return;

      // Run prior cleanup before recomputing.
      cleanup?.();
      cleanup = null;

      seen.clear();

      const previousEffect = context.effect;
      const previousComputed = context.computed;
      const previousCleanup = context.cleanup;

      context.effect = (source) => {
        if (sources.has(source)) {
          seen.add(source);
          return;
        }

        const unsubscribe = source.subscribe(notify);
        sources.set(source, unsubscribe);
        source.dependents.add(effectNode);
        seen.add(source);
      };

      context.computed = null;
      context.cleanup = (fn) => {
        cleanup = fn;
      };

      try {
        const result = fn();
        if (typeof result === 'function') cleanup = result;
      } finally {
        context.effect = previousEffect;
        context.computed = previousComputed;
        context.cleanup = previousCleanup;

        for (const [source, unsubscribe] of [...sources]) {
          if (!seen.has(source)) {
            unsubscribe();
            source.dependents.delete(effectNode);
            sources.delete(source);
          }
        }
      }
    };

    const notify = () => {
      if (disposed) return;
      scheduleEffect(run);
    };

    const effectNode: ReactiveNode = {
      state: 'CLEAN',
      disposed: false,
      dependents: new Set(),
    };

    const dispose = () => {
      if (disposed) return;

      disposed = true;
      effectNode.disposed = true;

      context.pendingEffects.delete(run);

      cleanup?.();
      cleanup = null;

      for (const [source, unsubscribe] of sources) {
        unsubscribe();
        source.dependents.delete(effectNode);
      }

      sources.clear();
    };

    run();

    return dispose;
  }
  function batch<T>(fn: () => T): T {
    context.batchDepth++;

    try {
      return fn();
    } finally {
      context.batchDepth--;

      if (context.batchDepth === 0) {
        flushEffects();
      }
    }
  }
  function untrack<T>(fn: () => T): T {
    const previousEffect = context.effect;
    const previousComputed = context.computed;

    context.effect = null;
    context.computed = null;

    try {
      return fn();
    } finally {
      context.effect = previousEffect;
      context.computed = previousComputed;
    }
  }
  function onCleanup(fn: DisposeFn): void {    context.cleanup?.(fn);  }

  return {
    grain,
    computed,
    effect,
    batch,
    untrack,
    onCleanup,
    isGrain,
    flushEffects,
  };
}
// #endregion 
//                                                                                               [TYPES]
// #region ══════════════════════════════════════════════════════════════════════════════════════════════════════
type ComputationFunction<T> = () => T;
type EqualityFunction<T> = (prev: T, next: T) => boolean;
interface TrackingContext {/** What the tracking context can hold while an effect/computed runs. */
  effect: null | ((sig: Grain<any>) => void);
  computed: null | ComputationFunction<any>;
  batchDepth: number;
  // guards against flushes/recomputes re-entering themselves mid-flight;
  // when > 0, notifications queue up instead of flushing immediately
  updateDepth: number;
  // dedupes pending notifications by the subscriber callback itself,
  // keeping the per-grain wrapper that actually runs it
  pendingEffects: Map<EffectFunction, EffectFunction>;
}
interface Disposable {
  dispose(): void;
}
export type DisposeFn = () => void;
export type GrainOptions<T> = {
  equals?: (a: T, b: T) => boolean;
};
export type EffectFunction = () => void | DisposeFn;
export type Grain<T> = {
  (): T;
  value: T;
  peek(): T;
  subscribe(fn: (value: T) => void): DisposeFn;
  dispose(): void;
  readonly?: boolean;
};
type NodeState = 'CLEAN' | 'CHECK' | 'DIRTY' | 'COMPUTING';
type ReactiveNode = {
  state: NodeState;
  disposed: boolean;
  /** Computeds that read this node. */
  dependents: Set<ComputedNode<any>>;
};
type SourceNode<T> = ReactiveNode & {
  type: 'source';
  value: T;
  equals: (a: T, b: T) => boolean;
  subscribers: Map<unknown, () => void>;
};
type ComputedNode<T> = ReactiveNode & {
  type: 'computed';
  compute: () => T;
  equals: (a: T, b: T) => boolean;
  value: T;
  hasValue: boolean;
  /** Grains/computeds read during the latest evaluation. */
  sources: Map<ReactiveNode, DisposeFn>;
};

// #endregion 
//                                         [SIGNALS]
// #region ══════════════════════════════════════════════════════════════════════════════════════════════════════
export const ss_init = new GRAINS_INIT();
export const grain = ss_init.grain.bind(ss_init);
export const computed = ss_init.computed.bind(ss_init);
export const effect = ss_init.effect.bind(ss_init);
export const batch = ss_init.batchGrains.bind(ss_init);
// #endregion 






