class WARLOCKS_NECROMANCY_OBSERVATORY<TA> {
	public root: WALOCKS_DOOM_CONTAINER<T>;
	//public master: A;
	public online = false;
	public readonly instanceId: string = `instance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	public _useSSSCLASS() {
		return this.root.rs.useCellMailbox(this, GRIMOIRE_OF_VALUES_CH, WARLOCKS_NECROMANCY_OBSERVATORY_CH, THE_WARLOCK_SL_CH, THE_WARLOCK_TEST);
		/**DEFER_.run("WARLOCKS.master_", (master_) => {
			const [v, setV] = this._useSSSCLASS();
        this.root.locks_tardis.setPrev_(setV, this);
			this.master = v;
			useEffect(() => {
				this.master = v;
			}, [v]);
		}); */
	}
	constructor(root: A = null) {
		this.root = root;
	}
	public FULFIL_THIS_WARLOCKS_NECROMANCY_OBSERVATORY(r: A) {
		this.root = r;
	}
	public REFRESH_WARLOCKS_NECROMANCY_OBSERVATORY_ROOT() {
		return this.root.acquire_root("REFRESH_WARLOCKS_NECROMANCY_OBSERVATORY_ROOT");
	}
	_globalNotifyCache = new WeakMap<A, Map<A, () => void>>();
	_notifyCache = new WeakMap<Map<A, Set<(value: A) => void>>, Map<A, () => void>>();
	public getNestedMap<K, V>(sl = this.root.gv.sl, ms = this.root.gv.ms, rt = this.root.gv.rt): Map<K, V> {
		return ssr._map(sl, ms, rt);
	}
	public getMetadata(sl = SAURON_SLAVE_REG, ms = SAURON_MASTER_REG, rt = THE_WIZARD_ROOT_REG) {
		return ssr._meta(sl, ms, rt);
	}
	public dirty = new Set<FlushCallback>();
	public _flushScheduled = false;
	public openScopes = new Set<BatchScope>();

	public onFlush(cb: FlushCallback): void {
		this.dirty.add(cb);
		this.scheduleDrain();
	}
	public scheduleDrain(): void {
		if (this._flushScheduled) return;
		this._flushScheduled = true;
		queueMicrotask(this.drain);
	}
	public drain(): void {
		this._flushScheduled = false;
		if (this.dirty.size === 0) return;

		// An explicit openBatch() scope is still open (deliberately spanning an await) —
		// don't drop the pending callbacks, just wait for closeBatch() to let them through.
		if (this.openScopes.size > 0) {
			this.scheduleDrain();
			return;
		}

		const callbacks = this.dirty;
		this.dirty = new Set();
		for (const cb of callbacks) cb();
	}
	scheduleGlobalNotify(key: string | symbol, meta: A, opts: ScopeOptions): void {
		let cache = this._globalNotifyCache.get(meta);
		if (!cache) {
			cache = new Map();
			this._globalNotifyCache.set(meta, cache);
		}
		let fn = cache.get(key);
		if (!fn) {
			fn = () => {
				cache!.delete(key);
				const finalVal = this.store.get(key, opts);
				const waiters = meta._waiters.get(key);
				if (waiters) {
					for (const resolveFn of waiters) {
						try {
							resolveFn(finalVal);
						} catch (err) {
							console.error(`[Sauron Waiter Error]:`, err);
						}
					}
					meta._waiters.delete(key);
				}
				for (const listener of meta._globalListeners) {
					try {
						listener(key, finalVal);
					} catch (err) {
						console.error(`[Sauron Global Listener Error]:`, err);
					}
				}
			};
			cache.set(key, fn);
		}
		this.onFlush(fn);
	}
	public scheduleNotify(key: A, _listeners: Map<A, Set<(value: A) => void>>, _state: Map<A, A>): void {
		let cache = this._notifyCache.get(_listeners);
		if (!cache) {
			cache = new Map();
			this._notifyCache.set(_listeners, cache);
		}
		let fn = cache.get(key);
		if (!fn) {
			fn = () => {
				cache!.delete(key);
				const val = _state.get(key);
				_listeners.get(key)?.forEach((l) => l(val));
			};
			cache.set(key, fn);
		}
		this.onFlush(fn);
	}
	public store = {
		get: <T = A,>(key: A, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): T | undefined => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _state = this.getNestedMap<A, A>(sl_reg, ms_reg, globalKey);
			const _persistent = this.getNestedMap<A, A>(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
			const _persistKeys = this.getNestedMap<A, boolean>(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);

			// recordDependency(key)
			if (_state.has(key)) return MaybePromise(_state.get(key));
			if (_persistKeys.has(key) && _persistent.has(key)) {
				const v = _persistent.get(key);
				_state.set(key, v);
				return MaybePromise(v);
			}
			return undefined;
		},
		set: <T = A,>(key: A, value: T | ((prev: T | undefined) => T), opts: { triggerRender?: boolean; cap?: number } & ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r, triggerRender: true, cap: 200 }) => {
			const { triggerRender = true, sl_reg, ms_reg, globalKey, cap } = opts;
			const _state = this.getNestedMap<A, A>(sl_reg, ms_reg, globalKey);
			const _persistent = this.getNestedMap<A, A>(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
			const _persistKeys = this.getNestedMap<A, boolean>(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
			const _listeners = this.getNestedMap<A, Set<(value: A) => void>>(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
			const prev = _state.get(key);
			const next = typeof value === "function" ? (value as (prev: T | undefined) => T)(prev) : value;
			if (Object.is(prev, next)) return;
			// TIME TRAVEL

			_state.set(key, next);
			if (_persistKeys.has(key)) _persistent.set(key, next);
			this.scheduleGlobalNotify(key, this.getMetadata(sl_reg, ms_reg, globalKey), opts);
			if (triggerRender) this.scheduleNotify(key, _listeners, _state);
			return MaybePromise(next as T);
		},
		subscribe: <T = A,>(key: A, listener: (value: T) => void, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): (() => void) => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _listeners = this.getNestedMap<A, Set<(value: A) => void>>(`${sl_reg}_LISTENERS`, ms_reg, globalKey);

			if (!_listeners.has(key)) _listeners.set(key, new Set());
			_listeners.get(key)!.add(listener);
			return () => {
				_listeners.get(key)?.delete(listener);
				if (_listeners.get(key)?.size === 0) _listeners.delete(key);
			};
		},
		delete: (key: A, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): boolean => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _state = this.getNestedMap<A, A>(sl_reg, ms_reg, globalKey);
			const _persistent = this.getNestedMap<A, A>(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
			const _persistKeys = this.getNestedMap<A, boolean>(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
			const _listeners = this.getNestedMap<A, Set<(value: A) => void>>(`${sl_reg}_LISTENERS`, ms_reg, globalKey);

			const existed = _state.delete(key);
			if (_persistKeys.has(key)) {
				_persistKeys.delete(key);
				_persistent.delete(key);
			}
			_listeners.get(key)?.forEach((l) => l(undefined));
			_listeners.delete(key);
			return MaybePromise(existed);
		},
		entries: <T = A,>(opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): [A, T][] => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _state = this.getNestedMap<A, A>(sl_reg, ms_reg, globalKey);
			return MaybePromise(Array.from(_state.entries()));
		},
		persist: (key: A, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): void => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _persistKeys = this.getNestedMap<A, Set<A>>(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey) as unknown as Set<A>;
			_persistKeys.add(key);
		},
		unpersist: (key: A, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): void => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _persistent = this.getNestedMap<A, A>(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
			const _persistKeys = this.getNestedMap<A, boolean>(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
			_persistKeys.delete(key);
			_persistent.delete(key);
		},
		has: (key: A, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): boolean => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _state = this.getNestedMap<A, A>(sl_reg, ms_reg, globalKey);
			const _persistent = this.getNestedMap<A, A>(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
			const _persistKeys = this.getNestedMap<A, boolean>(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);

			return _state.has(key) || (_persistKeys.has(key) && _persistent.has(key));
		},
		clear: (opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): void => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _state = this.getNestedMap<A, A>(sl_reg, ms_reg, globalKey);
			const _listeners = this.getNestedMap<A, Set<(value: A) => void>>(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
			_state.clear();
			_listeners.clear();
		},
		clearPersistent: (opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): void => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const _persistent = this.getNestedMap<A, A>(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
			const _persistKeys = this.getNestedMap<A, boolean>(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
			_persistent.clear();
			_persistKeys.clear();
		},
		_emit: (key: string | symbol, sl_reg = ssr.s, ms_reg = ssr.m, globalKey = ssr.r): void => {
			const opts = { sl_reg, ms_reg, globalKey };
			const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
			const _listeners = this.getNestedMap<A, Set<(value: A) => void>>(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
			const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
			this.scheduleNotify(key, _listeners, _state);
			this.scheduleGlobalNotify(key, meta, opts);
		},
	};
	public state: SauronState = {
		get: <T = A,>(key: string | symbol, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): T | undefined => {
			return MaybePromise(this.store.get<T>(key, opts) as T);
		},
		set: <T = A,>(key: string | symbol, value: T | ((prev: T | undefined) => T), opts: { triggerRender?: boolean } & ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): void => {
			const { sl_reg, ms_reg, globalKey, triggerRender = true } = opts;
			this.store.set(key, value, { triggerRender, sl_reg, ms_reg, globalKey });
			return MaybePromise(value as T);
		},
		delete: (key: string | symbol, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): boolean => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
			const deleted = this.store.delete(key, opts);
			if (deleted) {
				for (const listener of meta._globalListeners) {
					try {
						listener(key, undefined);
					} catch (err) {
						console.error(`[Sauron Global Listener Error]:`, err);
					}
				}
			}
			return deleted;
		},
		getByPrefix: <T = A,>(prefix: string, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): { key: string; value: T }[] => {
			return this.store
				.entries<T>(opts)
				.filter(([key]) => typeof key === "string" && key.startsWith(prefix))
				.map(([key, value]) => ({ key: key as string, value }));
		},
		getAll: <T = A,>(opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): Record<string | symbol, T> => {
			const result: Record<string | symbol, T> = {};
			for (const [key, value] of this.store.entries<T>(opts)) {
				result[key] = value;
			}
			return result;
		},
		subscribe: <T = A,>(key: string | symbol, listener: (value: T) => void, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): (() => void) => {
			return this.store.subscribe<T>(key, listener, opts);
		},
		subscribeAll: (listener: (key: string | symbol, value: A) => void, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): (() => void) => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
			meta._globalListeners.add(listener);
			return () => {
				meta._globalListeners.delete(listener);
			};
		},
		clear: (opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): void => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
			this.store.clear(opts);
			meta._waiters.clear();
			meta._globalListeners.clear();
		},
		waitFor: <T = A,>(key: string | symbol, opts: ScopeOptions = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }): Promise<T> => {
			const { sl_reg, ms_reg, globalKey } = opts;
			const meta = this.getMetadata(sl_reg, ms_reg, globalKey);

			// If it already exists, resolve immediately
			const existing = this.state.get<T>(key, opts);
			if (existing !== undefined) return Promise.resolve(existing);

			return new Promise<T>((resolve) => {
				if (!meta._waiters.has(key)) meta._waiters.set(key, new Set());
				meta._waiters.get(key)!.add(resolve as A);
			});
		},
	};
	public _broadcastSS(key: A, value: A, storageType: S, fn: S, path?: S, domain?: S, options?: A) {
		_localChange = true;
		_channel?.postMessage({ key, value, storageType, fn, path, domain, options });
	}
	public getChain<T = A>(key: A, sl?: A, ms?: A, rt?: A, chain?: "chain" | "rechain") {
		return MCR_Combo(this.state.get<T>(key, { s: sl, m: ms, r: rt }), chain);
	}
	public getReChain<T = A>(key: A, sl?: A, ms?: A, rt?: A) {
		return MaybePromise(new ReChain(this.state.get<T>(key, { s: sl, m: ms, r: rt })));
	}
	public get<T = A>(key: A, sl?: A, ms?: A, rt?: A) {
		return MaybePromise(this.state.get<T>(key, { s: sl, m: ms, r: rt }));
	}
	public getSauron<T = A>(key: A, sl?: A, ms?: A, rt?: A) {
		return MaybePromise(this.state.get<T>(key, { s: sl, m: ms, r: rt }));
	}
	public getAll<T = A>(opts?: ScopeOptions): Record<S | symbol, T> {
		return this.state.getAll<T>(opts);
	}
	public getAllSauron<T = A>(opts?: ScopeOptions): Record<S | symbol, T> {
		return this.state.getAll<T>(opts);
	}
	public async getMany<T = A>(keys: S[], sl?: A, ms?: A, rt?: A) {
		if (!Array.isArray(keys) || keys.length === 0) {
			return {};
		}

		const result: Record<S, T | undefined> = {};

		const promises = keys.map(async (key) => {
			const value = await this.get<T>(key, sl, ms, rt);
			return { key, value };
		});

		const results = await Promise.all(promises);

		for (const { key, value } of results) {
			result[key] = value;
		}

		return result;
	}
	public setChain<T = A>(label: A, value: T, triggerRender = true, sl?: A, ms?: A, rt?: A) {
		return MaybePromise(new Chain(this.state.set(label, value, { triggerRender, s: sl, m: ms, r: rt })));
	}
	public set<T = A>(label: A, value: T, triggerRender = true, sl?: A, ms?: A, rt?: A) {
		this._broadcastSS(label, value, "sauron", "set");
		return MaybePromise(this.state.set(label, value, { triggerRender, s: sl, m: ms, r: rt }));
	}
	public setSauron<T = A>(label: S, value: T, triggerRender = true, sl?: A, ms?: A, rt?: A) {
		this._broadcastSS(label, value, "sauron", "set");
		return MaybePromise(this.state.set(label, value, { triggerRender, s: sl, m: ms, r: rt }));
	}
	public async setMany<T = Record<S, A>>(entries: T): Promise<void> {
		if (!entries || typeof entries !== "object") {
			return;
		}
		// Batch all sets without triggering renders until the end
		const entriesArray = Object.entries(entries);
		for (let i = 0; i < entriesArray.length; i++) {
			const [key, value] = entriesArray[i];
			// Only trigger render on the last item to avoid multiple renders
			const triggerRender = i === entriesArray.length - 1;
			this.set(key, value, triggerRender);
		}
	}
	public subChain<T = A>(label: S, fn: (value: T) => V, sl?: A, ms?: A, rt?: A) {
		return MaybePromise(new Chain(this.state.subscribe<T>(label, fn, { s: sl, m: ms, r: rt })));
	}
	public sub<T = A>(label: A, fn: (value: T) => V, sl?: A, ms?: A, rt?: A): () => V {
		if (!label || !fn) return () => {};
		return MaybePromise(this.state.subscribe<T>(label, fn, { s: sl, m: ms, r: rt }));
	}
	public subSauron<T = A>(label: A, fn: (value: T) => V, sl?: A, ms?: A, rt?: A): () => V {
		if (!label || !fn) return () => {};
		return MaybePromise(this.state.subscribe<T>(label, fn, { s: sl, m: ms, r: rt }));
	}

	public subAll(fn: (key: A, value: A) => void, sl?: A, ms?: A, rt?: A): () => V {
		if (!fn) return () => {};
		return this.state.subscribeAll(fn, { s: sl, m: ms, r: rt });
	}
	public subAllSauron(fn: (key: S | symbol, value: A) => V, sl?: A, ms?: A, rt?: A): () => V {
		if (!fn) return () => {};
		return this.state.subscribeAll(fn, { s: sl, m: ms, r: rt });
	}
	public delSauron(label: S, sl?: A, ms?: A, rt?: A): B {
		if (!label) return false;
		const v = this.state.delete(label, { s: sl, m: ms, r: rt });
		this._broadcastSS(label, undefined, "sauron", "delete");
		return v;
	}
	public deleteSauron(label: A, sl?: A, ms?: A, rt?: A): B {
		if (!label) return false;
		const v = this.state.delete(label, { s: sl, m: ms, r: rt });
		this._broadcastSS(label, undefined, "sauron", "delete");
		return v;
	}
	public deleteChain(label: A, sl?: A, ms?: A, rt?: A) {
		return MaybePromise(new Chain(this.state.delete(label, { s: sl, m: ms, r: rt })));
	}
	public async deleteMany(keys: A[], sl?: A, ms?: A, rt?: A): P<B> {
		if (!Array.isArray(keys) || keys.length === 0) {
			return false;
		}
		let allDeleted = true;

		// Batch all deletes without triggering renders until the end
		for (let i = 0; i < keys.length; i++) {
			const deleted = this.delSauron(keys[i], sl, ms, rt);
			if (!deleted) {
				allDeleted = false;
			}
		}

		return allDeleted;
	}
	public waitFor<T = A>(label: S, sl?: A, ms?: A, rt?: A): P<T> {
		return this.state.waitFor<T>(label, { s: sl, m: ms, r: rt });
	}
	public waitForSauron<T = A>(label: S, sl?: A, ms?: A, rt?: A): P<T> {
		return this.state.waitFor<T>(label, { s: sl, m: ms, r: rt });
	}
}
