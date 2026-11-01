"use strict";
class WARLOCKS_NECROMANCY_OBSERVATORY {
    root;
    //public master: A;
    online = false;
    instanceId = `instance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    _useSSSCLASS() {
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
    constructor(root = null) {
        this.root = root;
    }
    FULFIL_THIS_WARLOCKS_NECROMANCY_OBSERVATORY(r) {
        this.root = r;
    }
    REFRESH_WARLOCKS_NECROMANCY_OBSERVATORY_ROOT() {
        return this.root.acquire_root("REFRESH_WARLOCKS_NECROMANCY_OBSERVATORY_ROOT");
    }
    _globalNotifyCache = new WeakMap();
    _notifyCache = new WeakMap();
    getNestedMap(sl = this.root.gv.sl, ms = this.root.gv.ms, rt = this.root.gv.rt) {
        return ssr._map(sl, ms, rt);
    }
    getMetadata(sl = SAURON_SLAVE_REG, ms = SAURON_MASTER_REG, rt = THE_WIZARD_ROOT_REG) {
        return ssr._meta(sl, ms, rt);
    }
    dirty = new Set();
    _flushScheduled = false;
    openScopes = new Set();
    onFlush(cb) {
        this.dirty.add(cb);
        this.scheduleDrain();
    }
    scheduleDrain() {
        if (this._flushScheduled)
            return;
        this._flushScheduled = true;
        queueMicrotask(this.drain);
    }
    drain() {
        this._flushScheduled = false;
        if (this.dirty.size === 0)
            return;
        // An explicit openBatch() scope is still open (deliberately spanning an await) —
        // don't drop the pending callbacks, just wait for closeBatch() to let them through.
        if (this.openScopes.size > 0) {
            this.scheduleDrain();
            return;
        }
        const callbacks = this.dirty;
        this.dirty = new Set();
        for (const cb of callbacks)
            cb();
    }
    scheduleGlobalNotify(key, meta, opts) {
        let cache = this._globalNotifyCache.get(meta);
        if (!cache) {
            cache = new Map();
            this._globalNotifyCache.set(meta, cache);
        }
        let fn = cache.get(key);
        if (!fn) {
            fn = () => {
                cache.delete(key);
                const finalVal = this.store.get(key, opts);
                const waiters = meta._waiters.get(key);
                if (waiters) {
                    for (const resolveFn of waiters) {
                        try {
                            resolveFn(finalVal);
                        }
                        catch (err) {
                            console.error(`[Sauron Waiter Error]:`, err);
                        }
                    }
                    meta._waiters.delete(key);
                }
                for (const listener of meta._globalListeners) {
                    try {
                        listener(key, finalVal);
                    }
                    catch (err) {
                        console.error(`[Sauron Global Listener Error]:`, err);
                    }
                }
            };
            cache.set(key, fn);
        }
        this.onFlush(fn);
    }
    scheduleNotify(key, _listeners, _state) {
        let cache = this._notifyCache.get(_listeners);
        if (!cache) {
            cache = new Map();
            this._notifyCache.set(_listeners, cache);
        }
        let fn = cache.get(key);
        if (!fn) {
            fn = () => {
                cache.delete(key);
                const val = _state.get(key);
                _listeners.get(key)?.forEach((l) => l(val));
            };
            cache.set(key, fn);
        }
        this.onFlush(fn);
    }
    store = {
        get: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
            const _persistent = this.getNestedMap(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
            const _persistKeys = this.getNestedMap(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
            // recordDependency(key)
            if (_state.has(key))
                return MaybePromise(_state.get(key));
            if (_persistKeys.has(key) && _persistent.has(key)) {
                const v = _persistent.get(key);
                _state.set(key, v);
                return MaybePromise(v);
            }
            return undefined;
        },
        set: (key, value, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r, triggerRender: true, cap: 200 }) => {
            const { triggerRender = true, sl_reg, ms_reg, globalKey, cap } = opts;
            const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
            const _persistent = this.getNestedMap(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
            const _persistKeys = this.getNestedMap(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
            const _listeners = this.getNestedMap(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
            const prev = _state.get(key);
            const next = typeof value === "function" ? value(prev) : value;
            if (Object.is(prev, next))
                return;
            // TIME TRAVEL
            _state.set(key, next);
            if (_persistKeys.has(key))
                _persistent.set(key, next);
            this.scheduleGlobalNotify(key, this.getMetadata(sl_reg, ms_reg, globalKey), opts);
            if (triggerRender)
                this.scheduleNotify(key, _listeners, _state);
            return MaybePromise(next);
        },
        subscribe: (key, listener, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _listeners = this.getNestedMap(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
            if (!_listeners.has(key))
                _listeners.set(key, new Set());
            _listeners.get(key).add(listener);
            return () => {
                _listeners.get(key)?.delete(listener);
                if (_listeners.get(key)?.size === 0)
                    _listeners.delete(key);
            };
        },
        delete: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
            const _persistent = this.getNestedMap(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
            const _persistKeys = this.getNestedMap(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
            const _listeners = this.getNestedMap(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
            const existed = _state.delete(key);
            if (_persistKeys.has(key)) {
                _persistKeys.delete(key);
                _persistent.delete(key);
            }
            _listeners.get(key)?.forEach((l) => l(undefined));
            _listeners.delete(key);
            return MaybePromise(existed);
        },
        entries: (opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
            return MaybePromise(Array.from(_state.entries()));
        },
        persist: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _persistKeys = this.getNestedMap(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
            _persistKeys.add(key);
        },
        unpersist: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _persistent = this.getNestedMap(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
            const _persistKeys = this.getNestedMap(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
            _persistKeys.delete(key);
            _persistent.delete(key);
        },
        has: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
            const _persistent = this.getNestedMap(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
            const _persistKeys = this.getNestedMap(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
            return _state.has(key) || (_persistKeys.has(key) && _persistent.has(key));
        },
        clear: (opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
            const _listeners = this.getNestedMap(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
            _state.clear();
            _listeners.clear();
        },
        clearPersistent: (opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const _persistent = this.getNestedMap(`${sl_reg}_PERSISTENT`, ms_reg, globalKey);
            const _persistKeys = this.getNestedMap(`${sl_reg}_PERSIST_KEYS`, ms_reg, globalKey);
            _persistent.clear();
            _persistKeys.clear();
        },
        _emit: (key, sl_reg = ssr.s, ms_reg = ssr.m, globalKey = ssr.r) => {
            const opts = { sl_reg, ms_reg, globalKey };
            const _state = this.getNestedMap(sl_reg, ms_reg, globalKey);
            const _listeners = this.getNestedMap(`${sl_reg}_LISTENERS`, ms_reg, globalKey);
            const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
            this.scheduleNotify(key, _listeners, _state);
            this.scheduleGlobalNotify(key, meta, opts);
        },
    };
    state = {
        get: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            return MaybePromise(this.store.get(key, opts));
        },
        set: (key, value, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey, triggerRender = true } = opts;
            this.store.set(key, value, { triggerRender, sl_reg, ms_reg, globalKey });
            return MaybePromise(value);
        },
        delete: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
            const deleted = this.store.delete(key, opts);
            if (deleted) {
                for (const listener of meta._globalListeners) {
                    try {
                        listener(key, undefined);
                    }
                    catch (err) {
                        console.error(`[Sauron Global Listener Error]:`, err);
                    }
                }
            }
            return deleted;
        },
        getByPrefix: (prefix, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            return this.store
                .entries(opts)
                .filter(([key]) => typeof key === "string" && key.startsWith(prefix))
                .map(([key, value]) => ({ key: key, value }));
        },
        getAll: (opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const result = {};
            for (const [key, value] of this.store.entries(opts)) {
                result[key] = value;
            }
            return result;
        },
        subscribe: (key, listener, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            return this.store.subscribe(key, listener, opts);
        },
        subscribeAll: (listener, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
            meta._globalListeners.add(listener);
            return () => {
                meta._globalListeners.delete(listener);
            };
        },
        clear: (opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
            this.store.clear(opts);
            meta._waiters.clear();
            meta._globalListeners.clear();
        },
        waitFor: (key, opts = { sl_reg: ssr.s, ms_reg: ssr.m, globalKey: ssr.r }) => {
            const { sl_reg, ms_reg, globalKey } = opts;
            const meta = this.getMetadata(sl_reg, ms_reg, globalKey);
            // If it already exists, resolve immediately
            const existing = this.state.get(key, opts);
            if (existing !== undefined)
                return Promise.resolve(existing);
            return new Promise((resolve) => {
                if (!meta._waiters.has(key))
                    meta._waiters.set(key, new Set());
                meta._waiters.get(key).add(resolve);
            });
        },
    };
    _broadcastSS(key, value, storageType, fn, path, domain, options) {
        _localChange = true;
        _channel?.postMessage({ key, value, storageType, fn, path, domain, options });
    }
    getChain(key, sl, ms, rt, chain) {
        return MCR_Combo(this.state.get(key, { s: sl, m: ms, r: rt }), chain);
    }
    getReChain(key, sl, ms, rt) {
        return MaybePromise(new ReChain(this.state.get(key, { s: sl, m: ms, r: rt })));
    }
    get(key, sl, ms, rt) {
        return MaybePromise(this.state.get(key, { s: sl, m: ms, r: rt }));
    }
    getSauron(key, sl, ms, rt) {
        return MaybePromise(this.state.get(key, { s: sl, m: ms, r: rt }));
    }
    getAll(opts) {
        return this.state.getAll(opts);
    }
    getAllSauron(opts) {
        return this.state.getAll(opts);
    }
    async getMany(keys, sl, ms, rt) {
        if (!Array.isArray(keys) || keys.length === 0) {
            return {};
        }
        const result = {};
        const promises = keys.map(async (key) => {
            const value = await this.get(key, sl, ms, rt);
            return { key, value };
        });
        const results = await Promise.all(promises);
        for (const { key, value } of results) {
            result[key] = value;
        }
        return result;
    }
    setChain(label, value, triggerRender = true, sl, ms, rt) {
        return MaybePromise(new Chain(this.state.set(label, value, { triggerRender, s: sl, m: ms, r: rt })));
    }
    set(label, value, triggerRender = true, sl, ms, rt) {
        this._broadcastSS(label, value, "sauron", "set");
        return MaybePromise(this.state.set(label, value, { triggerRender, s: sl, m: ms, r: rt }));
    }
    setSauron(label, value, triggerRender = true, sl, ms, rt) {
        this._broadcastSS(label, value, "sauron", "set");
        return MaybePromise(this.state.set(label, value, { triggerRender, s: sl, m: ms, r: rt }));
    }
    async setMany(entries) {
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
    subChain(label, fn, sl, ms, rt) {
        return MaybePromise(new Chain(this.state.subscribe(label, fn, { s: sl, m: ms, r: rt })));
    }
    sub(label, fn, sl, ms, rt) {
        if (!label || !fn)
            return () => { };
        return MaybePromise(this.state.subscribe(label, fn, { s: sl, m: ms, r: rt }));
    }
    subSauron(label, fn, sl, ms, rt) {
        if (!label || !fn)
            return () => { };
        return MaybePromise(this.state.subscribe(label, fn, { s: sl, m: ms, r: rt }));
    }
    subAll(fn, sl, ms, rt) {
        if (!fn)
            return () => { };
        return this.state.subscribeAll(fn, { s: sl, m: ms, r: rt });
    }
    subAllSauron(fn, sl, ms, rt) {
        if (!fn)
            return () => { };
        return this.state.subscribeAll(fn, { s: sl, m: ms, r: rt });
    }
    delSauron(label, sl, ms, rt) {
        if (!label)
            return false;
        const v = this.state.delete(label, { s: sl, m: ms, r: rt });
        this._broadcastSS(label, undefined, "sauron", "delete");
        return v;
    }
    deleteSauron(label, sl, ms, rt) {
        if (!label)
            return false;
        const v = this.state.delete(label, { s: sl, m: ms, r: rt });
        this._broadcastSS(label, undefined, "sauron", "delete");
        return v;
    }
    deleteChain(label, sl, ms, rt) {
        return MaybePromise(new Chain(this.state.delete(label, { s: sl, m: ms, r: rt })));
    }
    async deleteMany(keys, sl, ms, rt) {
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
    waitFor(label, sl, ms, rt) {
        return this.state.waitFor(label, { s: sl, m: ms, r: rt });
    }
    waitForSauron(label, sl, ms, rt) {
        return this.state.waitFor(label, { s: sl, m: ms, r: rt });
    }
}
