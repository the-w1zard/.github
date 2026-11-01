const _gs = (s, m, r, k) => {
    const g = globalThis;
    if (m === undefined && r === undefined && k === undefined)
        return g[s];
    return g[r]?.get(m)?.get(s)?.get(k);
};
let queuedLength = 0;
export class PATCHWERKZ_FEL_HOARDER {
    r = _gs('r_') ?? 'THE_WIZARD_ROOT_REG';
    m = _gs('m_') ?? "SAURON_MASTER_REG";
    s = _gs('s_') ?? "PATCHWERKZ_FEL_HOARDER";
    k = _gs('k_') ?? 'THE_KEY';
    mc = _gs('THE_WARLOCK_MODULE_CACHE_') ?? `__THE_WARLOCK_MODULE_CACHE__`;
    root;
    link;
    unlink;
    propagate;
    checkDirty;
    shallowPropagate;
    computed;
    signal;
    openScopes = new Set();
    dirty = new Set();
    _flushScheduled = false;
    _adapter = null;
    _currentHookState = null;
    _currentComponent = null;
    PRIORITY_ORDER = ["immediate", "user-blocking", "normal", "background", "idle"];
    GLOBAL_SCOPE = Symbol("global-scope");
    scopeCursors = { immediate: 0, "user-blocking": 0, normal: 0, background: 0, idle: 0 };
    currentScope = this.GLOBAL_SCOPE;
    loopScheduled = false;
    _subscribers = new Map();
    __subscribers = new Map();
    //  public _externalSubscribers = new Map<string, Map<string, Map<string, Map<SignalKey, Set<(value: A) => void>>>>>();
    _components = new Map();
    _pendingNotifications = new Set();
    externalSubscribers = new Set();
    instanceId = `instance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    total_cache_size = 5000;
    cycle = 0;
    runDepth = 0;
    batchDepth = 0;
    notifyIndex = 0;
    queuedLength = 0;
    HasChildEffect = 64;
    queued = [];
    activeSub;
    u = undefined;
    uuuu = [this.u, this.u, this.u, this.u];
    UUUU = [this.s, this.m, this.r];
    uuu = [this.u, this.u, this.u];
    UUU = [this.s, this.m, this.r];
    uu = [this.u, this.u];
    UU = [this.m, this.r];
    defaultErrorHandler = null;
    _mainMap = new Map();
    _weakMap = new WeakMap();
    _tupleCache = new Map();
    //public _listeners: Map<string, Set<SignalListener>> = new Map();
    _conflicts = new Map();
    _causal = new Map();
    _listeners = new Map();
    _globalListeners = new Map();
    _externalSubscribers = new Map();
    _waiters = new Map();
    constructor(root = null) {
        this.root = root;
        const self = this;
        function createReactiveSystem({ update, notify, unwatched }) {
            return {
                link,
                unlink,
                propagate,
                checkDirty,
                shallowPropagate,
            };
            function link(dep, sub, version) {
                const prevDep = sub.depsTail;
                if (prevDep !== undefined && prevDep.dep === dep) {
                    return;
                }
                const nextDep = prevDep !== undefined ? prevDep.nextDep : sub.deps;
                if (nextDep !== undefined && nextDep.dep === dep) {
                    nextDep.version = version;
                    sub.depsTail = nextDep;
                    return;
                }
                const prevSub = dep.subsTail;
                if (prevSub !== undefined && prevSub.version === version && prevSub.sub === sub) {
                    return;
                }
                const newLink = (sub.depsTail =
                    dep.subsTail =
                        {
                            version,
                            dep,
                            sub,
                            prevDep,
                            nextDep,
                            prevSub,
                            nextSub: undefined,
                        });
                if (nextDep !== undefined) {
                    nextDep.prevDep = newLink;
                }
                if (prevDep !== undefined) {
                    prevDep.nextDep = newLink;
                }
                else {
                    sub.deps = newLink;
                }
                if (prevSub !== undefined) {
                    prevSub.nextSub = newLink;
                }
                else {
                    dep.subs = newLink;
                }
            }
            function unlink(link, sub = link.sub) {
                const { dep, prevDep, nextDep, nextSub, prevSub } = link;
                if (nextDep !== undefined) {
                    nextDep.prevDep = prevDep;
                }
                else {
                    sub.depsTail = prevDep;
                }
                if (prevDep !== undefined) {
                    prevDep.nextDep = nextDep;
                }
                else {
                    sub.deps = nextDep;
                }
                if (nextSub !== undefined) {
                    nextSub.prevSub = prevSub;
                }
                else {
                    dep.subsTail = prevSub;
                }
                if (prevSub !== undefined) {
                    prevSub.nextSub = nextSub;
                }
                else if ((dep.subs = nextSub) === undefined) {
                    unwatched(dep);
                }
                return nextDep;
            }
            function propagate(link, innerWrite) {
                let next = link.nextSub;
                let stack;
                top: do {
                    const sub = link.sub;
                    let flags = sub.flags;
                    if (!(flags & (4 /* ReactiveFlags.RecursedCheck */ | 8 /* ReactiveFlags.Recursed */ | 16 /* ReactiveFlags.Dirty */ | 32 /* ReactiveFlags.Pending */))) {
                        sub.flags = flags | 32 /* ReactiveFlags.Pending */;
                        if (innerWrite) {
                            sub.flags |= 8 /* ReactiveFlags.Recursed */;
                        }
                    }
                    else if (!(flags & (4 /* ReactiveFlags.RecursedCheck */ | 8 /* ReactiveFlags.Recursed */))) {
                        flags = 0 /* ReactiveFlags.None */;
                    }
                    else if (!(flags & 4 /* ReactiveFlags.RecursedCheck */)) {
                        sub.flags = (flags & ~8 /* ReactiveFlags.Recursed */) | 32 /* ReactiveFlags.Pending */;
                    }
                    else if (!(flags & (16 /* ReactiveFlags.Dirty */ | 32 /* ReactiveFlags.Pending */)) && isValidLink(link, sub)) {
                        sub.flags = flags | (8 /* ReactiveFlags.Recursed */ | 32 /* ReactiveFlags.Pending */);
                        flags &= 1 /* ReactiveFlags.Mutable */;
                    }
                    else {
                        flags = 0 /* ReactiveFlags.None */;
                    }
                    if (flags & 2 /* ReactiveFlags.Watching */) {
                        notify(sub);
                    }
                    if (flags & 1 /* ReactiveFlags.Mutable */) {
                        const subSubs = sub.subs;
                        if (subSubs !== undefined) {
                            const nextSub = (link = subSubs).nextSub;
                            if (nextSub !== undefined) {
                                stack = { value: next, prev: stack };
                                next = nextSub;
                            }
                            continue;
                        }
                    }
                    if ((link = next) !== undefined) {
                        next = link.nextSub;
                        continue;
                    }
                    while (stack !== undefined) {
                        link = stack.value;
                        stack = stack.prev;
                        if (link !== undefined) {
                            next = link.nextSub;
                            continue top;
                        }
                    }
                    break;
                } while (true);
            }
            function checkDirty(link, sub) {
                let stack;
                let checkDepth = 0;
                let dirty = false;
                top: do {
                    const dep = link.dep;
                    const flags = dep.flags;
                    if (sub.flags & 16 /* ReactiveFlags.Dirty */) {
                        dirty = true;
                    }
                    else if ((flags & (1 /* ReactiveFlags.Mutable */ | 16 /* ReactiveFlags.Dirty */)) === (1 /* ReactiveFlags.Mutable */ | 16 /* ReactiveFlags.Dirty */)) {
                        const subs = dep.subs;
                        if (update(dep)) {
                            if (subs.nextSub !== undefined) {
                                shallowPropagate(subs);
                            }
                            dirty = true;
                        }
                    }
                    else if ((flags & (1 /* ReactiveFlags.Mutable */ | 32 /* ReactiveFlags.Pending */)) === (1 /* ReactiveFlags.Mutable */ | 32 /* ReactiveFlags.Pending */)) {
                        stack = { value: link, prev: stack };
                        link = dep.deps;
                        sub = dep;
                        ++checkDepth;
                        continue;
                    }
                    if (!dirty) {
                        const nextDep = link.nextDep;
                        if (nextDep !== undefined) {
                            link = nextDep;
                            continue;
                        }
                    }
                    while (checkDepth--) {
                        link = stack.value;
                        stack = stack.prev;
                        if (dirty) {
                            const subs = sub.subs;
                            if (update(sub)) {
                                if (subs.nextSub !== undefined) {
                                    shallowPropagate(subs);
                                }
                                sub = link.sub;
                                continue;
                            }
                            dirty = false;
                        }
                        else {
                            sub.flags &= ~32 /* ReactiveFlags.Pending */;
                        }
                        sub = link.sub;
                        const nextDep = link.nextDep;
                        if (nextDep !== undefined) {
                            link = nextDep;
                            continue top;
                        }
                    }
                    return dirty && !!sub.flags;
                } while (true);
            }
            function shallowPropagate(link) {
                do {
                    const sub = link.sub;
                    const flags = sub.flags;
                    if ((flags & (32 /* ReactiveFlags.Pending */ | 16 /* ReactiveFlags.Dirty */)) === 32 /* ReactiveFlags.Pending */) {
                        sub.flags = flags | 16 /* ReactiveFlags.Dirty */;
                        if ((flags & (2 /* ReactiveFlags.Watching */ | 4 /* ReactiveFlags.RecursedCheck */)) === 2 /* ReactiveFlags.Watching */) {
                            notify(sub);
                        }
                    }
                } while ((link = link.nextSub) !== undefined);
            }
            function isValidLink(checkLink, sub) {
                let link = sub.depsTail;
                while (link !== undefined) {
                    if (link === checkLink) {
                        return true;
                    }
                    link = link.prevDep;
                }
                return false;
            }
        }
        const { link, unlink, propagate, checkDirty, shallowPropagate } = createReactiveSystem({
            update(node) {
                if ("getter" in node) {
                    return self.updateComputed(node);
                }
                if ("currentValue" in node) {
                    return self.updateSignal(node);
                }
                node.flags = 1 /* ReactiveFlags.Mutable */;
                return true;
            },
            notify(effect) {
                let insertIndex = queuedLength;
                let firstInsertedIndex = insertIndex;
                do {
                    self.queued[insertIndex++] = effect;
                    effect.flags &= ~2 /* ReactiveFlags.Watching */;
                    effect = effect.subs?.sub;
                    if (effect === undefined || !(effect.flags & 2 /* ReactiveFlags.Watching */)) {
                        break;
                    }
                } while (true);
                queuedLength = insertIndex;
                while (firstInsertedIndex < --insertIndex) {
                    const left = self.queued[firstInsertedIndex];
                    self.queued[firstInsertedIndex++] = self.queued[insertIndex];
                    self.queued[insertIndex] = left;
                }
            },
            unwatched(node) {
                if ("getter" in node) {
                    if (node.depsTail !== undefined) {
                        node.flags = 1 /* ReactiveFlags.Mutable */ | 16 /* ReactiveFlags.Dirty */;
                        self.disposeAllDepsInReverse(node);
                    }
                }
                else if ("currentValue" in node) {
                    // Nothing to do for signals, they are always mutable and never dirty until pendingValue changes
                }
                else if ("fn" in node) {
                    self.effectOper.call(node, node);
                }
                else {
                    self.effectScopeOper.call(node, node);
                }
            },
        });
        function signal(v) {
            return self.signalOper.bind({
                value: v,
                currentValue: v,
                pendingValue: v,
                subs: undefined,
                subsTail: undefined,
                flags: 1 /* ReactiveFlags.Mutable */,
            });
        }
        function computed(getter) {
            return self.computedOper.bind({
                value: undefined,
                subs: undefined,
                subsTail: undefined,
                deps: undefined,
                depsTail: undefined,
                flags: 0 /* ReactiveFlags.None */,
                getter: getter,
            });
        }
        this.computed = computed;
        this.signal = signal;
        this.link = link;
        this.unlink = unlink;
        this.propagate = propagate;
        this.shallowPropagate = shallowPropagate;
        this.checkDirty = checkDirty;
    }
    _validateSchema(schema, value) {
        try {
            const next = schema.coerce ? schema.coerce(value) : value;
            if (schema.validate(next)) {
                return next;
            }
            throw new Error("[Sauron] Schema validation failed");
        }
        catch (error) {
            console.error("[Sauron] Schema validation failed:", error);
            throw error;
        }
    }
    _resolveConflict(conflict, previous, next, strategy = "latest") {
        if (conflict?.resolve) {
            return conflict.resolve(previous, next);
        }
        if (strategy === "fail") {
            console.warn('[Sauron] conflict rejected by "fail" strategy');
            return null;
        }
        if (strategy === "accumulate" && Array.isArray(previous) && Array.isArray(next)) {
            return [...previous, ...next];
        }
        return next;
    }
    flush = () => {
        try {
            while (this.notifyIndex < queuedLength) {
                const effect = this.queued[this.notifyIndex];
                this.queued[this.notifyIndex++] = undefined;
                this.run(effect);
            }
        }
        finally {
            while (this.notifyIndex < queuedLength) {
                const effect = this.queued[this.notifyIndex];
                this.queued[this.notifyIndex++] = undefined;
                effect.flags |= 2 /* ReactiveFlags.Watching */ | 8 /* ReactiveFlags.Recursed */;
            }
            this.notifyIndex = 0;
            queuedLength = 0;
        }
    };
    run = (e) => {
        const flags = e.flags;
        if (flags & 16 /* ReactiveFlags.Dirty */ || (flags & 32 /* ReactiveFlags.Pending */ && this.checkDirty(e.deps, e))) {
            if (flags & this.HasChildEffect) {
                let link = e.depsTail;
                while (link !== undefined) {
                    const prev = link.prevDep;
                    const dep = link.dep;
                    if (!("getter" in dep) && !("currentValue" in dep)) {
                        this.unlink(link, e);
                    }
                    link = prev;
                }
            }
            if (e.cleanup) {
                this.runCleanup(e);
                if (!e.flags) {
                    return;
                }
            }
            e.depsTail = undefined;
            e.flags = 2 /* ReactiveFlags.Watching */ | 4 /* ReactiveFlags.RecursedCheck */;
            const prevSub = this.setActiveSub(e);
            try {
                ++this.cycle;
                ++this.runDepth;
                e.cleanup = e.fn();
            }
            catch (err) {
                const handler = e.onError ?? this.defaultErrorHandler;
                if (handler)
                    handler(err, e);
                else
                    queueMicrotask(() => {
                        throw err;
                    });
            }
            finally {
                --this.runDepth;
                this.activeSub = prevSub;
                e.flags &= ~4 /* ReactiveFlags.RecursedCheck */;
                this.purgeDeps(e);
            }
        }
        else if (e.deps !== undefined) {
            e.flags = 2 /* ReactiveFlags.Watching */ | (flags & this.HasChildEffect);
        }
    };
    setActiveSub = (sub) => {
        const prevSub = this.activeSub;
        this.activeSub = sub;
        return prevSub;
    };
    purgeDeps = (sub) => {
        const depsTail = sub.depsTail;
        let dep = depsTail !== undefined ? depsTail.nextDep : sub.deps;
        while (dep !== undefined) {
            dep = this.unlink(dep, sub);
        }
    };
    updateComputed = (c) => {
        if (c.flags & this.HasChildEffect) {
            let link = c.depsTail;
            while (link !== undefined) {
                const prev = link.prevDep;
                const dep = link.dep;
                if (!("getter" in dep) && !("currentValue" in dep)) {
                    this.unlink(link, c);
                }
                link = prev;
            }
        }
        c.depsTail = undefined;
        c.flags = 1 /* ReactiveFlags.Mutable */ | 4 /* ReactiveFlags.RecursedCheck */;
        const prevSub = this.setActiveSub(c);
        try {
            ++this.cycle;
            const oldValue = c.value;
            return oldValue !== (c.value = c.getter(oldValue));
        }
        finally {
            this.activeSub = prevSub;
            c.flags &= ~4 /* ReactiveFlags.RecursedCheck */;
            this.purgeDeps(c);
        }
    };
    computedOper = (that) => {
        const flags = that.flags;
        if (flags & 16 /* ReactiveFlags.Dirty */ || (flags & 32 /* ReactiveFlags.Pending */ && (this.checkDirty(that.deps, that) || ((that.flags = flags & ~32 /* ReactiveFlags.Pending */), false)))) {
            if (this.updateComputed(that)) {
                const subs = that.subs;
                if (subs !== undefined) {
                    this.shallowPropagate(subs);
                }
            }
        }
        else if (!flags) {
            that.flags = 1 /* ReactiveFlags.Mutable */ | 4 /* ReactiveFlags.RecursedCheck */;
            const prevSub = this.setActiveSub(that);
            try {
                that.value = that.getter();
            }
            finally {
                this.activeSub = prevSub;
                that.flags &= ~4 /* ReactiveFlags.RecursedCheck */;
            }
        }
        const sub = this.activeSub;
        if (sub !== undefined) {
            this.link(that, sub, this.cycle);
        }
        return that.value;
    };
    signalOper(that, ...value) {
        if (value.length) {
            if (that.pendingValue !== (that.pendingValue = value[0])) {
                that.flags = 1 /* ReactiveFlags.Mutable */ | 16 /* ReactiveFlags.Dirty */;
                const subs = that.subs;
                if (subs !== undefined) {
                    this.propagate(subs, !!this.runDepth);
                    if (!this.batchDepth) {
                        this.flush();
                    }
                }
            }
        }
        else {
            if (that.flags & 16 /* ReactiveFlags.Dirty */) {
                if (this.updateSignal(that)) {
                    const subs = that.subs;
                    if (subs !== undefined) {
                        this.shallowPropagate(subs);
                    }
                }
            }
            const sub = this.activeSub;
            if (sub !== undefined) {
                this.link(that, sub, this.cycle);
            }
            return that.currentValue;
        }
    }
    effectOper(that) {
        this.effectScopeOper.call(this, that);
        if (that.cleanup) {
            this.runCleanup(that);
        }
    }
    disposeAllDepsInReverse(sub) {
        let link = sub.depsTail;
        while (link !== undefined) {
            const prev = link.prevDep;
            this.unlink(link, sub);
            link = prev;
        }
    }
    effectScopeOper(that) {
        if (that.children) {
            for (const child of that.children) {
                if ("fn" in child)
                    this.effectOper.call(this, child);
                else
                    this.effectScopeOper.call(this, child);
            }
            that.children.clear();
        }
        that.flags = 0 /* ReactiveFlags.None */;
        this.disposeAllDepsInReverse(that);
        const sub = that.subs;
        if (sub !== undefined)
            this.unlink(sub);
    }
    atom(v, key = `__THE_WARLOCK_SIGNALS_${_sid()}`, s = this.s, m = this.m, r = this.r, options) {
        const rk = this.create(key, v, options, s, m, r);
        const self = this;
        return {
            get value() {
                self._bindComponentToSignal(rk, s, m, r);
                return self.read(rk, s, m, r);
            },
            set value(v) {
                self.write(rk, v, "write", s, m, r);
            },
            peek() {
                return rk.node;
            },
            get current() {
                self._bindComponentToSignal(rk, s, m, r);
                return self.read(rk, s, m, r);
            },
            set current(v) {
                self.write(rk, v, "write", s, m, r);
            },
            set crt(v) {
                self.write(rk, v, "write", s, m, r);
            },
            set set(v) {
                self.write(rk, v, "write", s, m, r);
            },
        };
    }
    get(key, s = this.s, m = this.m, r = this.r) {
        const resolvedKey = this.resolveKey(key, s, m, r);
        const registry = ssr._map(s, m, r);
        return registry.get(resolvedKey);
    }
    create(key, v, options, s = this.s, m = this.m, r = this.r) {
        const resolvedKey = this.resolveKey(key, s, m, r);
        const registry = ssr._map(s, m, r);
        let atom = registry.get(resolvedKey);
        if (atom || v === undefined) {
            return atom;
        }
        const initialValue = typeof v === "function" ? v() : v;
        atom = new SIGNAL_CELL(resolvedKey, initialValue, options);
        registry.set(resolvedKey, atom);
        return atom;
    }
    write(key, value, source = "write", s = this.s, m = this.m, r = this.r) {
        return this._writeResolved(key, value, source, s, m, r);
    }
    read(key, s = this.s, m = this.m, r = this.r) {
        const rk = this.resolveKey(key, s, m, r);
        const atom = ssr._map(s, m, r).get(rk);
        return atom?.read();
    }
    peek(key, s = this.s, m = this.m, r = this.r) {
        const rk = this.resolveKey(key, s, m, r);
        const atom = ssr._map(s, m, r).get(rk);
        return atom?.peek();
    }
    updateSignal(s) {
        s.flags = 1 /* ReactiveFlags.Mutable */;
        return s.currentValue !== (s.currentValue = s.pendingValue);
    }
    resolveKey(key, s = this.s, m = this.m, r = this.r) {
        const atomMap = ssr._map(s, m, r);
        // 1. Arrays / Tuples -> Hash to a structural string key
        if (Array.isArray(key)) {
            return this._hashTuple(key);
        }
        // 2. Existing SIGNAL_CELL lookup by exact key (Symbol, Object reference, String, or Number)
        if (atomMap.has(key)) {
            return key;
        }
        // 3. Return raw key as-is (Map handles Symbol & Object references natively as SignalKey)
        return key;
    }
    normalizeKey(rawKey) {
        return rawKey.trim().toLowerCase();
    }
    runCleanup(e) {
        const cleanup = e.cleanup;
        e.cleanup = undefined;
        const prevSub = this.activeSub;
        this.activeSub = undefined;
        try {
            cleanup();
        }
        catch (err) {
            const handler = e.onError ?? this.defaultErrorHandler;
            if (handler)
                handler(err, e);
            else
                queueMicrotask(() => {
                    throw err;
                });
        }
        finally {
            this.activeSub = prevSub;
        }
    }
    _bindComponentToSignal(rk, s = this.s, m = this.m, r = this.r) {
        const component = this.root.SAURON.getCurrentComponent();
        if (!component)
            return;
        const hookKey = `${component.id}:signal:${r}:${m}:${s}:${rk}`;
        if (component.hooks.has(hookKey)) {
            return;
        }
        component.hooks.set(hookKey, { value: undefined });
        const atom = this.create(rk, undefined, undefined, s, m, r);
        if (!atom) {
            return;
        }
        const unsubSignal = atom.subscribeExternal(() => {
            this.root.SAURON.notifyHook(hookKey);
        });
        component.unmount.add(unsubSignal);
        if (component.render) {
            const unsubRender = this.root.SAURON.subscribeToHook(hookKey, () => component.render?.());
            component.unmount.add(unsubRender);
        }
    }
    _serializeTuple(tuple) {
        const parts = new Array(tuple.length);
        for (let i = 0; i < tuple.length; i++) {
            const item = tuple[i];
            const type = typeof item;
            if (item === null) {
                parts[i] = "null";
            }
            else if (type === "string") {
                parts[i] = `s:${item}`;
            }
            else if (type === "number") {
                parts[i] = `n:${item}`;
            }
            else if (type === "symbol") {
                parts[i] = `sym:${item.description ?? String(item)}`;
            }
            else if (type === "bigint") {
                parts[i] = `bi:${item.toString()}`;
            }
            else if (type === "undefined") {
                parts[i] = "undef";
            }
            else if (Array.isArray(item)) {
                parts[i] = `arr:[${this._serializeTuple(item)}]`;
            }
            else if (type === "object" || type === "function") {
                // Store object references cleanly
                let refId = this._weakMap.get(item);
                if (!refId) {
                    refId = `ref:${_sid()}`;
                    this._weakMap.set(item, refId);
                }
                parts[i] = refId;
            }
            else {
                parts[i] = `v:${String(item)}`;
            }
        }
        return parts.join("|");
    }
    _hashTuple(tuple) {
        const key = this._serializeTuple(tuple);
        const cached = this._tupleCache.get(key);
        if (cached) {
            // Refresh LRU position on access
            this._tupleCache.delete(key);
            this._tupleCache.set(key, cached);
            return cached;
        }
        // Use 64-bit split FNV-1a (or raw string key if total key length is short)
        let h1 = 0x811c9dc5;
        let h2 = 0x01000193;
        for (let i = 0; i < key.length; i++) {
            const code = key.charCodeAt(i);
            h1 = Math.imul(h1 ^ code, 16777619) >>> 0;
            h2 = Math.imul(h2 ^ code, 2246822507) >>> 0;
        }
        const result = `tuple:${h1.toString(36)}-${h2.toString(36)}`;
        this._tupleCache.set(key, result);
        // Evict oldest (true LRU) when over limit
        if (this._tupleCache.size > this.total_cache_size) {
            const toRemove = Math.floor(this._tupleCache.size * 0.2);
            const iter = this._tupleCache.keys();
            for (let i = 0; i < toRemove; i++) {
                const k = iter.next().value;
                if (k !== undefined)
                    this._tupleCache.delete(k);
            }
        }
        return result;
    }
    _writeResolved(rk, value, source, s = this.s, m = this.m, r = this.r, cause) {
        const resolvedKey = this.resolveKey(rk, s, m, r);
        const atom = this.create(resolvedKey, typeof value === "function" ? value() : value, undefined, s, m, r);
        if (!atom) {
            throw new Error(`[Sauron] Cannot write unknown signal "${String(resolvedKey)}"`);
        }
        return atom.write(value, {
            source,
            cause,
            triggerRender: atom.triggerRender,
        });
    }
}
export function chain(value) { return Promise.resolve(value); }
