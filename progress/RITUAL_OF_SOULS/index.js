export class RITUAL_OF_SOULS {
    r = THE_WIZARD_ROOT_REG;
    m = SAURON_MASTER_REG;
    s = "__SOUL_SIPHON__"; // SAURON_SLAVE_REG
    k = "__DING_SOUL_SHARD_RECEIVED__";
    root;
    //	public master: A;
    resolvers_singleton = null;
    resolvers() {
        if (this.resolvers_singleton !== null)
            return this.resolvers_singleton;
        return (this.resolvers_singleton = this.cell(THE_SINGULARITY_TEST, THE_SINGULARITY_SL_CH, this.m, this.r));
    }
    // solutions
    // rift_maelstrom
    // ROOT inside hook-system
    //     - SIGNALS
    //     - EMITTER
    //     - SAURON
    //     - RESOLVERS
    //     - DISRUPTOR
    //     - TH
    //     - HC_T
    //     - RX_SCHEDULER
    //     - TRANSPORT_HUB
    //     - MODULES
    modules_singleton = null;
    modules() {
        if (this.modules_singleton !== null)
            return this.modules_singleton;
        return (this.modules_singleton = this.cell("MODULES_CELL", `THE_SINGULARITY_SL_CH`, "__SAURON__", "__THE_WIZARD_REG__"));
    }
    disruptor_singleton = null;
    disruptor() {
        if (this.disruptor_singleton !== null)
            return this.disruptor_singleton;
        const v = new Date();
        return (this.disruptor_singleton = this.cell("DISRUPTOR_CELL", `THE_SINGULARITY_SL_CH`, "__SAURON__", "__THE_WIZARD_REG__", undefined, v));
    }
    DRSTime_singleton = null;
    DRSTime() {
        if (this.DRSTime_singleton !== null)
            return this.DRSTime_singleton;
        return (this.DRSTime_singleton = this.cell("DRSTime", "WARLOCKS_NECROMANCY_OBSERVATORY", `THE_SINGULARITY_SL_CH`, `THE_SINGULARITY_TEST`));
    }
    signals_singleton = null;
    signals() {
        if (this.signals_singleton !== null)
            return this.signals_singleton;
        return (this.signals_singleton = this.cell("SIGNALS_CELL", "WARLOCKS_NECROMANCY_OBSERVATORY", `THE_SINGULARITY_SL_CH`, `THE_SINGULARITY_TEST`));
    }
    sauron_singleton = null;
    sauron() {
        if (this.sauron_singleton !== null)
            return this.sauron_singleton;
        return (this.sauron_singleton = this.cell("SAURONS_CELL", "WARLOCKS_NECROMANCY_OBSERVATORY", `THE_SINGULARITY_SL_CH`, `THE_SINGULARITY_TEST`));
    }
    _sssclass_singleton = null;
    _useSSSCLASS() {
        if (this._sssclass_singleton !== null)
            return this._sssclass_singleton;
        return (this._sssclass_singleton = this.useCellMailbox(this, GRIMOIRE_OF_VALUES_CH, WARLOCKS_NECROMANCY_OBSERVATORY_CH, THE_WARLOCK_SL_CH, THE_WARLOCK_TEST));
    }
    /**private _useSSSCLASS() {
        // const [v, setV] = this._useSSSCLASS();
            //this.root.locks_tardis.setPrev_(setV, this);
    // this.master = v;
        //useEffect(() => { this.master = v; }, [v]);
        return this.useCellMailbox(this, GRIMOIRE_OF_VALUES_CH, WARLOCKS_NECROMANCY_OBSERVATORY_CH, THE_WARLOCK_SL_CH, THE_WARLOCK_TEST);
    } */
    constructor(root = null) {
        this.root = root;
        this.registering_adapters();
        this.IS_THIS_THE_FUCKING_BUS();
    }
    IS_THIS_THE_FUCKING_BUS() {
        console.log("yes...");
    }
    _bid() {
        return this.root.gv._bid;
    }
    registering_adapters() {
        // this.ADAPTERS.hadron_collider_adapter();
        // this.ADAPTERS.register_adapter_1();
        this._adapters.register_adapter_2();
        this._adapters.register_httpAdapter_11();
        this._adapters.register_atom_adapter_30();
        this._adapters.register_ws_adapter_31();
    }
    // ⣄                                  SET UP
    // #region ═════════════════════════════════════════════════════════════════════════════════════
    /**
      private _useRifts() {
            return root.DISRUPTOR.useSClass.mailbox(this, THE_SINGULARITY_TEST, THE_SINGULARITY_SL_CH, root.DISRUPTOR.m, root.DISRUPTOR.r);
        }
         constructor(root: A = null) {
             root = root
            const [v, setV] = this._useRifts();
            setPrev(setV, this);
            this.t = v;
            useEffect(() => { this.t = v; }, [v]);
         }
     */
    // #endregion
    // ⣄                                  DUPLEX
    // #region ═════════════════════════════════════════════════════════════════════════════════════
    duplex(readConfig, writeConfig) {
        /**const { readable, writable } = emitters.duplexStream(
            { quad: 'inbound_messages' },
            { quad: 'outbound_messages' }
        ); */
        return {
            readable: this.readStream(readConfig.k, readConfig.s, readConfig.m, readConfig.r),
            writable: this.writeStream(writeConfig.k, writeConfig.s, writeConfig.m, writeConfig.r),
        };
    }
    // #endregion
    // ⣄                                  SEND / SUB
    // #region ═════════════════════════════════════════════════════════════════════════════════════
    sen1d(p, k, s = this.s, m = this.m, r = this.r, chain, adapter = "disruptor") {
        const msgId = this._bid();
        const msg = { id: msgId, r: r, m: m, s: s, k: k, p: { p }, ts: Date.now(), _ack: false };
        let v = this.DISPATCH(msg, adapter);
        if (v !== undefined && !(v instanceof Promise)) {
            return MCR_Combo(v, chain);
        }
        else {
            const timeoutMs = 5000;
            return MaybePromise((() => {
                return new Promise((resolve, reject) => {
                    let timer;
                    if (v) {
                        if (timer)
                            clearTimeout(timer);
                        resolve(v);
                        return;
                    }
                    if (timeoutMs) {
                        timer = setTimeout(() => {
                            reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`));
                        }, timeoutMs);
                    }
                });
            })());
        }
    }
    send = (() => {
        const fn = (p, k, s = this.s, m = this.m, r = this.r, ttl, chain, binary = false, adapter = "ws") => {
            const msgId = this._bid();
            const msg = { id: msgId, r: r, m: m, s: s, k: k, p: { p }, ts: Date.now(), _ack: false };
            let v = this.DISPATCH(msg, adapter);
            if (v !== undefined && !(v instanceof Promise)) {
                return MCR_Combo(v, chain);
            }
            else {
                const timeoutMs = 5000;
                return MaybePromise((() => {
                    return new Promise((resolve, reject) => {
                        let timer;
                        if (v) {
                            if (timer)
                                clearTimeout(timer);
                            resolve(v);
                            return;
                        }
                        if (timeoutMs) {
                            timer = setTimeout(() => {
                                reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`));
                            }, timeoutMs);
                        }
                    });
                })());
            }
        };
        fn.bare_metal = (p, k, s = this.s, m = this.m, r = this.r, chain, adapter = "atom_adapter", binary = false) => {
            const msgId = this._bid();
            const msg = { id: msgId, r: r, m: m, s: s, k: k, p: { p }, ts: Date.now(), _ack: false };
            this.root.gv.cursor = (this.root.gv.cursor + 1) % this.root.gv.MAX_PENDING;
            const slot = this.root.gv.cursor;
            if (this.root.gv.pendingResolvers[slot] !== undefined) {
                this.root.gv.pendingResolvers[slot].reject(new Error("[rift] Previous slot overwritten/dropped"));
            }
            this.root.gv.sentTimestamps[slot] = performance.now();
            const a = this._adapters();
            const adp = a[adapter];
            // Dispatch payload
            let v = adp.send({ id: msgId, rt: r, ms: m, sl: s, k, p: { p }, ts: Date.now(), _ack: false }); // Trigger local handlers (ensure errors are caught and rejected)
            if (v !== undefined && !(v instanceof Promise)) {
                return MCR_Combo(v, chain);
            }
            else {
                const timeoutMs = 5000;
                return MaybePromise((() => {
                    return new Promise((resolve, reject) => {
                        let timer;
                        // Register slot resolver for the response handler to pick up later
                        this.root.gv.pendingResolvers[slot] = { resolve, reject, k }; // Dispatch payload
                        adp.send({ id: msgId, rt: r, ms: m, sl: s, k, p: { p }, ts: Date.now(), _ack: false }); // Trigger local handlers (ensure errors are caught and rejected)
                        Promise.resolve(ssr.se.invokeHandlers({ id: msgId, r: r, m: m, s: s, k, p: { p }, ts: Date.now(), _ack: false })).catch(reject);
                        if (timeoutMs) {
                            timer = setTimeout(() => {
                                reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`));
                            }, timeoutMs);
                        }
                    });
                })());
            }
        };
        fn.broadcast = async (p, k, s = this.s, m = this.m, r = this.r, ttl, binary = false, adapter = "http") => {
            const msgId = `[${r}][${m}][${s}][${k}][${_sid()}]`.replace(/[.\[\]]/g, (match) => (match === "." ? "_" : ""));
            const msg = { id: msgId, r: r, m: m, s: s, k, p: { p }, ttl, ts: Date.now(), _ack: false };
            Promise.resolve().then(() => {
                this.DISPATCH(msg, adapter);
                this.DISPATCH(msg, "http");
                this.DISPATCH(msg, "ws_adapter");
                this.DISPATCH(msg, "atom_adapter");
                this.DISPATCH(msg, "disruptor_adapter");
            });
            /** await Promise.all(
                    [...this._adapters()].map(a => {
                        try {
                            return this.DISPATCH(msg, adapter)
                        } catch {
                            return Promise.resolve()
                        }
                    })
                ) */
            await ssr.se.BACK_END.run.afterSend(msg, { success: true });
        };
        fn.broadcastState = (state, k, s, m, r, chain) => {
            const v = this.send(state, k, s, m, r).catch((err) => {
                console.error("Failed to broadcast state:", err);
            });
            return MCR_Combo(v, chain);
        };
        const isWildcard = (value) => value === "*";
        fn.emit = (k, p, s = this.s, m = this.m, r = this.r) => {
            const handlers = new Set();
            // Get the shared channels object
            const channelsObj = ssr._channels(s, m, r);
            const add = (set) => {
                if (set)
                    for (const handler of set)
                        handlers.add(handler);
            };
            const walkChannels = (channel) => {
                if (isWildcard(channel)) {
                    for (const set of channelsObj.channels.values())
                        add(set);
                }
                else {
                    add(channelsObj.channels.get(channel));
                }
            };
            const walkSubChannels = (sub, channel) => {
                if (isWildcard(sub)) {
                    for (const [ch, set] of channelsObj.sub_channels.values()) {
                        if (isWildcard(channel)) {
                            for (const handlersAtChannel of set.values())
                                add(handlersAtChannel);
                        }
                        else {
                            add(set.get(channel));
                        }
                    }
                }
                else {
                    const byChannel = channelsObj.sub_channels.get(sub);
                    if (!byChannel)
                        return;
                    if (isWildcard(channel)) {
                        for (const set of byChannel.values())
                            add(set);
                    }
                    else {
                        add(byChannel.get(channel));
                    }
                }
            };
            const walkTrips = (trip, sub, channel) => {
                if (isWildcard(trip)) {
                    for (const bySub of channelsObj.trip_channels.values()) {
                        if (isWildcard(sub)) {
                            for (const byChannel of bySub.values()) {
                                if (isWildcard(channel)) {
                                    for (const set of byChannel.values())
                                        add(set);
                                }
                                else {
                                    add(byChannel.get(channel));
                                }
                            }
                        }
                        else {
                            const byChannel = bySub.get(sub);
                            if (!byChannel)
                                continue;
                            if (isWildcard(channel)) {
                                for (const set of byChannel.values())
                                    add(set);
                            }
                            else {
                                add(byChannel.get(channel));
                            }
                        }
                    }
                }
                else {
                    const bySub = channelsObj.trip_channels.get(trip);
                    if (!bySub)
                        return;
                    if (isWildcard(sub)) {
                        for (const byChannel of bySub.values()) {
                            if (isWildcard(channel)) {
                                for (const set of byChannel.values())
                                    add(set);
                            }
                            else {
                                add(byChannel.get(channel));
                            }
                        }
                    }
                    else {
                        const byChannel = bySub.get(sub);
                        if (!byChannel)
                            return;
                        if (isWildcard(channel)) {
                            for (const set of byChannel.values())
                                add(set);
                        }
                        else {
                            add(byChannel.get(channel));
                        }
                    }
                }
            };
            const walkQuads = () => {
                if (isWildcard(k)) {
                    for (const byTrip of channelsObj.quad_channels.values()) {
                        if (isWildcard(s)) {
                            for (const bySub of byTrip.values()) {
                                if (isWildcard(m)) {
                                    for (const byChannel of bySub.values()) {
                                        if (isWildcard(r)) {
                                            for (const set of byChannel.values())
                                                add(set);
                                        }
                                        else {
                                            add(byChannel.get(r));
                                        }
                                    }
                                }
                                else {
                                    const byChannel = bySub.get(m);
                                    if (!byChannel)
                                        continue;
                                    if (isWildcard(r)) {
                                        for (const set of byChannel.values())
                                            add(set);
                                    }
                                    else {
                                        add(byChannel.get(r));
                                    }
                                }
                            }
                        }
                        else {
                            const bySub = byTrip.get(s);
                            if (!bySub)
                                continue;
                            if (isWildcard(m)) {
                                for (const byChannel of bySub.values()) {
                                    if (isWildcard(r)) {
                                        for (const set of byChannel.values())
                                            add(set);
                                    }
                                    else {
                                        add(byChannel.get(r));
                                    }
                                }
                            }
                            else {
                                const byChannel = bySub.get(m);
                                if (!byChannel)
                                    continue;
                                if (isWildcard(r)) {
                                    for (const set of byChannel.values())
                                        add(set);
                                }
                                else {
                                    add(byChannel.get(r));
                                }
                            }
                        }
                    }
                }
                else {
                    const byTrip = channelsObj.quad_channels.get(k);
                    if (!byTrip)
                        return;
                    if (isWildcard(s)) {
                        for (const bySub of byTrip.values()) {
                            if (isWildcard(m)) {
                                for (const byChannel of bySub.values()) {
                                    if (isWildcard(r)) {
                                        for (const set of byChannel.values())
                                            add(set);
                                    }
                                    else {
                                        add(byChannel.get(r));
                                    }
                                }
                            }
                            else {
                                const byChannel = bySub.get(m);
                                if (!byChannel)
                                    continue;
                                if (isWildcard(r)) {
                                    for (const set of byChannel.values())
                                        add(set);
                                }
                                else {
                                    add(byChannel.get(r));
                                }
                            }
                        }
                    }
                    else {
                        const bySub = byTrip.get(s);
                        if (!bySub)
                            return;
                        if (isWildcard(m)) {
                            for (const byChannel of bySub.values()) {
                                if (isWildcard(r)) {
                                    for (const set of byChannel.values())
                                        add(set);
                                }
                                else {
                                    add(byChannel.get(r));
                                }
                            }
                        }
                        else {
                            const byChannel = bySub.get(m);
                            if (!byChannel)
                                return;
                            if (isWildcard(r)) {
                                for (const set of byChannel.values())
                                    add(set);
                            }
                            else {
                                add(byChannel.get(r));
                            }
                        }
                    }
                }
            };
            // Use the index at the broadest requested scope.
            if (isWildcard(k)) {
                walkQuads();
            }
            else if (isWildcard(s)) {
                // trip_channels is keyed by s, then m, then r.
                walkTrips(s, m, r);
            }
            else if (isWildcard(m)) {
                // sub_channels is keyed by m, then r.
                walkSubChannels(m, r);
            }
            else if (isWildcard(r)) {
                // channels is keyed by r.
                walkChannels(r);
            }
            else {
                // Exact path: any one index can retrieve it.
                add(channelsObj.quad_channels.get(k)?.get(s)?.get(m)?.get(r));
            }
            for (const handler of handlers)
                handler(p);
        };
        return fn;
    })();
    sub = (() => {
        const fn = (handler, k, sl = this.s, ms = this.m, rt = this.r) => {
            // Get the shared channels object
            const channelsObj = ssr._channels(sl, ms, rt);
            // CHANNEL level - deepest
            if (!channelsObj.channels.has(rt)) {
                channelsObj.channels.set(rt, new Set());
            }
            channelsObj.channels.get(rt).add(handler);
            // SUB_CHANNEL level
            if (!channelsObj.sub_channels.has(ms)) {
                channelsObj.sub_channels.set(ms, new Map());
            }
            const subMap = channelsObj.sub_channels.get(ms);
            if (!subMap.has(rt)) {
                subMap.set(rt, new Set());
            }
            subMap.get(rt).add(handler);
            // TRIP_CHANNEL level
            if (!channelsObj.trip_channels.has(sl)) {
                channelsObj.trip_channels.set(sl, new Map());
            }
            const tripMap = channelsObj.trip_channels.get(sl);
            if (!tripMap.has(ms)) {
                tripMap.set(ms, new Set());
            }
            tripMap.get(ms).add(handler);
            // QUAD_CHANNEL level - first or lowest
            if (!channelsObj.quad_channels.has(k)) {
                channelsObj.quad_channels.set(k, new Map());
            }
            const quadMap = channelsObj.quad_channels.get(k);
            if (!quadMap.has(sl)) {
                quadMap.set(sl, new Set());
            }
            quadMap.get(sl).add(handler);
            return () => {
                // Re-fetch the channels object in case it changed
                const currentChannelsObj = ssr._channels(sl, ms, rt);
                // Clean up CHANNEL level
                const channelSet = currentChannelsObj.channels.get(rt);
                if (channelSet) {
                    channelSet.delete(handler);
                    if (channelSet.size === 0) {
                        currentChannelsObj.channels.delete(rt);
                    }
                }
                // Clean up SUB_CHANNEL level
                const currentSubMap = currentChannelsObj.sub_channels.get(ms);
                if (currentSubMap) {
                    const currentSubSet = currentSubMap.get(rt);
                    if (currentSubSet) {
                        currentSubSet.delete(handler);
                        if (currentSubSet.size === 0) {
                            currentSubMap.delete(rt);
                        }
                    }
                    if (currentSubMap.size === 0) {
                        currentChannelsObj.sub_channels.delete(ms);
                    }
                }
                // Clean up TRIP_CHANNEL level
                const currentTripMap = currentChannelsObj.trip_channels.get(sl);
                if (currentTripMap) {
                    const currentTripSet = currentTripMap.get(ms);
                    if (currentTripSet) {
                        currentTripSet.delete(handler);
                        if (currentTripSet.size === 0) {
                            currentTripMap.delete(ms);
                        }
                    }
                    if (currentTripMap.size === 0) {
                        currentChannelsObj.trip_channels.delete(sl);
                    }
                }
                // Clean up QUAD_CHANNEL level
                const currentQuadMap = currentChannelsObj.quad_channels.get(k);
                if (currentQuadMap) {
                    const currentQuadSet = currentQuadMap.get(sl);
                    if (currentQuadSet) {
                        currentQuadSet.delete(handler);
                        if (currentQuadSet.size === 0) {
                            currentQuadMap.delete(sl);
                        }
                    }
                    if (currentQuadMap.size === 0) {
                        currentChannelsObj.quad_channels.delete(k);
                    }
                }
            };
        };
        fn.sub2 = (handler, k, s = this.s, m = this.m, r = this.r) => {
            // CHANNEL level - deepest
            if (!ssr.se.channels().has(r)) {
                ssr.se.channels().set(r, new Set());
            }
            ssr.se.channels().get(r).add(handler);
            // SUB_CHANNEL level
            if (!ssr.se.sub_channels().has(m)) {
                ssr.se.sub_channels().set(m, new Map());
            }
            const subMap = ssr.se.sub_channels().get(m);
            if (!subMap.has(r)) {
                subMap.set(r, new Set());
            }
            subMap.get(r).add(handler);
            // TRIP_CHANNEL level
            if (!ssr.se.trip_channels().has(s)) {
                ssr.se.trip_channels().set(s, new Map());
            }
            const tripMap = ssr.se.trip_channels().get(s);
            if (!tripMap.has(m)) {
                tripMap.set(m, new Set());
            }
            tripMap.get(m).add(handler);
            // QUAD_CHANNEL level - first or lowest
            if (!ssr.se.quad_channels().has(k)) {
                ssr.se.quad_channels().set(k, new Map());
            }
            const quadMap = ssr.se.quad_channels().get(k);
            if (!quadMap.has(s)) {
                quadMap.set(s, new Set());
            }
            quadMap.get(s).add(handler);
            return () => {
                // Clean up CHANNEL level
                const channelSet = ssr.se.channels().get(r);
                if (channelSet) {
                    channelSet.delete(handler);
                    if (channelSet.size === 0) {
                        ssr.se.channels().delete(r);
                    }
                }
                // Clean up SUB_CHANNEL level
                const currentSubMap = ssr.se.sub_channels().get(m);
                if (currentSubMap) {
                    const currentSubSet = currentSubMap.get(r);
                    if (currentSubSet) {
                        currentSubSet.delete(handler);
                        if (currentSubSet.size === 0) {
                            currentSubMap.delete(r);
                        }
                    }
                    if (currentSubMap.size === 0) {
                        ssr.se.sub_channels().delete(m);
                    }
                }
                // Clean up TRIP_CHANNEL level
                const currentTripMap = ssr.se.trip_channels().get(s);
                if (currentTripMap) {
                    const currentTripSet = currentTripMap.get(m);
                    if (currentTripSet) {
                        currentTripSet.delete(handler);
                        if (currentTripSet.size === 0) {
                            currentTripMap.delete(m);
                        }
                    }
                    if (currentTripMap.size === 0) {
                        ssr.se.trip_channels().delete(s);
                    }
                }
                // Clean up QUAD_CHANNEL level
                const currentQuadMap = ssr.se.quad_channels().get(k);
                if (currentQuadMap) {
                    const currentQuadSet = currentQuadMap.get(s);
                    if (currentQuadSet) {
                        currentQuadSet.delete(handler);
                        if (currentQuadSet.size === 0) {
                            currentQuadMap.delete(s);
                        }
                    }
                    if (currentQuadMap.size === 0) {
                        ssr.se.quad_channels().delete(k);
                    }
                }
            };
        };
        fn.sub3 = (handler, k, s = this.s, m = this.m, r = this.r) => {
            // --- Helpers for registration ---
            const addToSet = (map, key) => {
                if (!map.has(key))
                    map.set(key, new Set());
                map.get(key).add(handler);
            };
            const addToNested = (map, outer, inner) => {
                if (!map.has(outer))
                    map.set(outer, new Map());
                addToSet(map.get(outer), inner);
            };
            // 1. Register across all channel levels
            addToSet(ssr.se.channels(), r);
            addToNested(ssr.se.sub_channels(), m, r);
            addToNested(ssr.se.trip_channels(), s, m); // or addToNested
            addToNested(ssr.se.trip_channels(), s, m);
            addToNested(ssr.se.quad_channels(), k, s);
            // --- Helpers for cleanup ---
            const removeFromSet = (map, key) => {
                const set = map.get(key);
                if (set) {
                    set.delete(handler);
                    if (set.size === 0)
                        map.delete(key);
                }
            };
            const removeFromNested = (map, outer, inner) => {
                const innerMap = map.get(outer);
                if (!innerMap)
                    return;
                removeFromSet(innerMap, inner);
                if (innerMap.size === 0)
                    map.delete(outer);
            };
            // Return unsubscription function
            return () => {
                removeFromSet(ssr.se.channels(), r);
                removeFromNested(ssr.se.sub_channels(), m, r);
                removeFromNested(ssr.se.trip_channels(), s, m);
                removeFromNested(ssr.se.quad_channels(), k, s);
            };
        };
        fn.subscribe = (handler, quad, trip, sub, ch) => {
            const _listeners = ssr._map(trip, sub, ch);
            let set = _listeners.get(quad);
            if (!set) {
                set = new Set();
                _listeners.set(quad, set);
            }
            set.add(handler);
            return () => {
                set.delete(handler);
                if (set.size === 0)
                    _listeners.delete(quad);
            };
        };
        fn.withHistory = (handler, k, s = this.s, m = this.m, r = this.r, options) => {
            const limit = options?.limit ?? 3;
            const past = this.history.get(r) ?? [];
            past.slice(-limit).forEach((msg) => handler(msg));
            return this.sub((data) => {
                const h = this.history.get(r) ?? [];
                h.push(data);
                if (h.length > limit)
                    h.splice(0, h.length - limit);
                this.history.set(r, h);
                handler(data);
            }, k, s, m, r);
        };
        fn.Any = (handler, s = this.s, m = this.m, r = this.r) => {
            return this.sub(handler, "*", s, m, r);
        };
        fn.All = (fn, s = this.s, m = this.m, r = this.r) => {
            return this.sub(fn, "*", s, m, r);
        };
        fn.unsub = (k, handler, s = this.s, m = this.m, r = this.r) => {
            const subs = ssr.se.getAllQuadChannelSubs(k, s, m, r);
            subs.delete(handler);
        };
        fn.once = (event, fn, s = this.s, m = this.m, r = this.r) => {
            const wrapper = (data) => {
                unsub();
                fn(data);
            };
            const unsub = this.sub(wrapper, event, s, m, r);
            return unsub;
        };
        return fn;
    })();
    // #endregion
    // ⣄                                  STREAM
    // #region ═════════════════════════════════════════════════════════════════════════════════════
    stream(p, onChunk, k, s = this.s, m = this.m, r = this.r, chain, binary = false) {
        const streamId = `[${r}][${m}][${s}][${k}][${_sid()}]`.replace(/[.\[\]]/g, (match) => (match === "." ? "_" : ""));
        const result = new Promise((resolve, reject) => {
            let closed = false;
            let closeSubscription;
            const finish = (error) => {
                if (closed)
                    return;
                closed = true;
                closeSubscription?.();
                if (error) {
                    reject(error instanceof Error ? error : new Error(String(error)));
                }
                else {
                    resolve();
                }
            };
            closeSubscription = this.sub((data) => {
                if (closed)
                    return;
                switch (data.type) {
                    case "chunk":
                        onChunk(data.data);
                        break;
                    case "done":
                        finish();
                        break;
                    case "error":
                        finish(data.error);
                        break;
                }
            }, k, s, m, r);
            try {
                this.send({ streamId, binary, ...p }, k, s, m, r);
            }
            catch (error) {
                finish(error);
            }
        });
        if (chain === "chain")
            return MaybePromise(new Chain(result));
        if (chain === "rechain")
            return MaybePromise(new ReChain(result, `send:${_sid()}`));
        return result;
    }
    handler(handler, k, s = this.s, m = this.m, r = this.r) {
        this.sub(async (inboundReq) => {
            if (!inboundReq || !inboundReq.streamId)
                return;
            const streamId = inboundReq.streamId;
            let isCancelled = false;
            let closeControlSubscription = null;
            try {
                // 1. Await the control stream cancellation listener safely
                closeControlSubscription = this.sub(() => {
                    isCancelled = true;
                }, `stream.${streamId}:cancel`, s, m, r);
                const result = await handler(inboundReq);
                let data = result;
                if (result && typeof result === "object" && "ok" in result && "data" in result) {
                    data = result.data;
                }
                if (typeof data === "function") {
                    data = data();
                }
                // Core Async Generator Stream Loop
                if (data && typeof data[Symbol.asyncIterator] === "function") {
                    for await (const chunk of data) {
                        if (isCancelled) {
                            if (typeof data.return === "function") {
                                await data.return();
                            }
                            break;
                        }
                        await this.send({ type: "chunk", data: chunk }, k, `stream.${streamId}`, m, r);
                    }
                    if (!isCancelled)
                        await this.send({ type: "done" }, k, `stream.${streamId}`, m, r);
                    if (closeControlSubscription)
                        closeControlSubscription();
                    return;
                }
                // Sync Generator Stream Loop
                if (data && typeof data[Symbol.iterator] === "function" && !Array.isArray(data)) {
                    for (const chunk of data) {
                        if (isCancelled)
                            break;
                        await this.send({ type: "chunk", data: chunk }, k, `stream.${streamId}`, m, r);
                    }
                    if (!isCancelled)
                        await this.send({ type: "done" }, k, `stream.${streamId}`, m, r);
                    if (closeControlSubscription)
                        closeControlSubscription();
                    return;
                }
                // Array Handling Stream Loop
                if (Array.isArray(data)) {
                    for (const chunk of data) {
                        if (isCancelled)
                            break;
                        await this.send({ type: "chunk", data: chunk }, k, `stream.${streamId}`, m, r);
                    }
                    if (!isCancelled)
                        await this.send({ type: "done" }, k, `stream.${streamId}`, m, r);
                    if (closeControlSubscription)
                        closeControlSubscription();
                    return;
                }
                // Fallback Single Value Response
                if (!isCancelled) {
                    await this.send({ type: "chunk", data: data }, k, `stream.${streamId}`, m, r);
                    await this.send({ type: "done" }, k, `stream.${streamId}`, m, r);
                }
                if (closeControlSubscription)
                    closeControlSubscription();
            }
            catch (err) {
                if (closeControlSubscription)
                    closeControlSubscription();
                // this._deadLetters().push({ id: streamId, r: r || this.r, p: inboundReq, ts: Date.now(), error: err.message });
                this.send({ type: "error", error: err.message }, k, `stream.${streamId}`, m, r);
            }
        }, k, s, m, r);
    }
    chunk(streamId, chunk, k, s = this.s, m = this.m, r = this.r) {
        this.send({ chunk }, `${k}:${streamId}:chunk`, s, m, r).catch(console.error);
    }
    done(streamId, k, s = this.s, m = this.m, r = this.r) {
        this.send({}, `${k}:${streamId}:done`, s, m, r).catch(console.error);
    }
    cancel(streamId, k, s = this.s, m = this.m, r = this.r) {
        this.streams.delete(streamId);
        this.send({}, `${k}:${streamId}:cancel`, s, m, r).catch(console.error);
    }
    transformStream(readConfig, writeConfig, transformer) {
        return new TransformStream({
            transform: async (chunk, controller) => {
                const transformed = transformer ? await Promise.resolve(transformer(chunk)) : chunk;
                if (transformed !== null && transformed !== undefined) {
                    this.send(transformed, writeConfig.k, writeConfig.sl, writeConfig.ms, writeConfig.rt);
                    controller.enqueue(transformed);
                }
            },
        });
    }
    readStream(k, s = this.s, m = this.m, r = this.r) {
        let unsubscribe = null;
        /**const readable = emitters.readableStream('telemetry_events');

        // Native Web Stream consumption anywhere
        readable.pipeTo(new WritableStream({
            write(chunk) {
                console.log('Stream received:', chunk);
            }
        })); */
        return new ReadableStream({
            start: (controller) => {
                unsubscribe = this.sub((data) => {
                    try {
                        controller.enqueue(data);
                    }
                    catch {
                        // Stream was closed or canceled downstream
                    }
                }, k, s, m, r);
            },
            cancel: () => {
                if (unsubscribe) {
                    unsubscribe();
                    unsubscribe = null;
                }
            },
        });
    }
    writeStream(k, s = this.s, m = this.m, r = this.r) {
        /**const writable = emitters.writableStream('incoming_logs');

        // Pipe browser fetch response body straight into your SIGNALS instance
        const response = await fetch('/api/stream');
        response.body?.pipeTo(writable); */
        return new WritableStream({
            write: (chunk) => {
                this.send(chunk, String(k), s, m, r);
            },
        });
    }
    // #endregion
    //                                    USE CELL
    // #region ═════════════════════════════════════════════════════════════════════════════════════════════
    isCRDTState = (val) => val && typeof val === "object" && Array.isArray(val.adds) && Array.isArray(val.removes);
    cell(k, s = this.s, m = this.m, r = this.r, chain, v) {
        const [value, setValue] = useState(() => {
            const existing = this.root.wno.get(k, s, m, r);
            if (existing !== undefined)
                return existing;
            if (v)
                return typeof v === "function" ? v() : v;
        });
        this.sub((i) => {
            const incoming = i.p;
            this.root.wno.set(k, incoming, false, s, m, r);
        }, k, s, m, r);
        this.root.wno.sub(k, (newValue) => setValue(newValue), s, m, r);
        return MCR_Combo(value, chain); // still no setter — this one was never meant to write
    }
    state_setter(v, k = `_USECELL`, s = this.s, m = this.m, r = this.r) {
        const existing = this.root.wno.get(k, s, m, r);
        if (existing !== undefined)
            return existing;
        const t = typeof v === "function" ? v() : v;
        this.root.wno.set(k, t, true, s, m, r);
        return t;
    }
    useCell(v, k = `_USECELL`, s = this.s, m = this.m, rt = this.r, type = "none", chain) {
        const cellKey = `${k}:${this.root.gv.RTRN_TO_SDR}`;
        const [state, setState] = useState(() => {
            return this.state_setter(v, k, s, m, r);
        });
        const senderTokenRef = this.signals().atom ? this.signals().atom(Symbol()) : atom(Symbol()); // Symbol();
        if (type === "none") {
            this.sub((i) => {
                const incoming = i.p;
                if (incoming?.from === senderTokenRef.value)
                    return;
                this.root.wno.set(k, incoming.value, false, s, m, rt);
                setState(incoming.value);
            }, k, s, m, rt); // stay in sync with local writes too (including our own setLive below)
            this.root.wno.sub(k, (newValue) => setState(newValue), s, m, rt);
        }
        const setLive = (next) => {
            const newValue = typeof next === "function" ? next(this.root.wno.get(k, s, m, rt)) : next;
            setState(newValue);
            this.root.wno.set(k, newValue, true, s, m, rt); // local write
            this.send({ value: newValue, from: senderTokenRef.value }, k, s, m, rt); // broadcast to the bus
        };
        let r;
        if (type === "waitFor") {
            this.send({ cmd: "waitFor", k, s, m, rt }, this.root.gv.hc_disptacher, this.root.gv.hc_sl_reg, SAURON_MASTER_REG, THE_WIZARD_ROOT_REG);
            this.sub((m) => setLive(m), cellKey, s, m, rt);
        }
        else if (type === "sub") {
            this.send({ cmd: "subscribe", k, s, m, r }, this.root.gv.hc_disptacher, this.root.gv.hc_sl_reg, SAURON_MASTER_REG, THE_WIZARD_ROOT_REG);
            this.sub((m) => setLive(m), cellKey, s, m, rt);
        }
        else if (type === "cell") {
            r = this.cell(cellKey, s, m, rt);
            useEffect(() => {
                if (r !== undefined) {
                    this.root.wno.set(k, r, false, s, m, rt);
                    setState(r);
                }
            }, [r]);
        }
        return [MCR_Combo(state, chain), setLive];
    }
    useCellCRDT(v, k = `_USECELL_CRDT`, s = this.s, m = this.m, r = this.r, type = "none", chain, nodeId = _sid()) {
        const cellKey = `${k}:${this.root.gv.RTRN_TO_SDR}`;
        const [state, setState] = useState(() => {
            const existing = this.root.wno.get(k, s, m, r);
            if (existing !== undefined)
                return existing;
            const t = typeof v === "function" ? v() : v;
            this.root.wno.set(k, t, true, s, m, r);
            return t;
        });
        const senderTokenRef = this.signals().atom ? this.signals().atom(Symbol()) : atom(Symbol());
        this.sub((i) => {
            const incoming = i.p;
            if (incoming?.from === senderTokenRef.value)
                return;
            if (incoming?._hlc) {
                this.resolvers()._hlc.update(incoming._hlc);
            }
            this.root.wno.set(k, (currentState) => {
                if (currentState && currentState.adds && incoming.adds) {
                    const localSet = new OR_SET(nodeId, this.resolvers()._hlc);
                    localSet.setState(currentState);
                    localSet.merge(incoming);
                    return localSet.getState();
                }
                return incoming;
            }, false, s, m, r);
        }, k, s, m, r);
        this.root.wno.sub(k, (newValue) => setState(newValue), s, m, r);
        const setLive = (next) => {
            this.resolvers()._hlc.tick();
            const currentState = this.root.wno.get(k, s, m, r);
            let newValue = typeof next === "function" ? next(currentState) : next;
            const isCRDTState = (val) => val && typeof val === "object" && Array.isArray(val.adds) && Array.isArray(val.removes);
            if (isCRDTState(newValue) && isCRDTState(currentState)) {
                const localSet = new OR_SET(nodeId, this.resolvers()._hlc);
                localSet.setState(currentState);
                localSet.merge(newValue);
                newValue = localSet.getState();
            }
            // Attach HLC clock metadata cleanly if it's an object, or wrap it
            let payloadWithClock = newValue;
            if (newValue && typeof newValue === "object" && !Array.isArray(newValue)) {
                payloadWithClock = { ...newValue, _hlc: this.resolvers()._hlc.tick() };
            }
            this.root.wno.set(k, payloadWithClock, true, s, m, r);
            this.send({ value: payloadWithClock, from: senderTokenRef.value }, k, s, m, r);
        };
        let vr;
        if (type === "waitFor") {
            this.send({ cmd: "waitFor", k, s, m, r }, this.root.gv.hc_disptacher, this.root.gv.hc_sl_reg, SAURON_MASTER_REG, THE_WIZARD_ROOT_REG);
            this.sub((m) => setState(m.p), cellKey, s, m, r);
        }
        else if (type === "sub") {
            this.send({ cmd: "subscribe", k, s, m, r }, this.root.gv.hc_disptacher, this.root.gv.hc_sl_reg, SAURON_MASTER_REG, THE_WIZARD_ROOT_REG);
            this.sub((m) => setState(m.p), cellKey, s, m, r);
        }
        else if (type === "cell") {
            r = this.cell(cellKey, s, m, r);
            useEffect(() => {
                if (r !== undefined) {
                    this.root.wno.set(k, r, false, s, m, r);
                    setState(vr);
                }
            }, [r]);
        }
        return [MCR_Combo(state, chain), setLive];
    }
    useCellCRDTB(v, k = `_USECELL_CRDTB`, s = this.s, m = this.m, r = this.r, nodeId = this._bid()) {
        const [state, setState] = useState(() => {
            const existing = this.root.wno.get(k, s, m, r);
            if (existing !== undefined)
                return existing;
            return typeof v === "function" ? v() : v;
        });
        const senderTokenRef = this.signals().atom ? this.signals().atom(Symbol()) : atom(Symbol());
        this.sub((i) => {
            const incoming = i.p;
            if (incoming?.from === senderTokenRef.current)
                return;
            if (incoming?._hlc) {
                this.resolvers()._hlc.update(incoming._hlc);
            }
            this.root.wno.set(k, (currentState) => {
                if (currentState && currentState.adds && incoming.adds) {
                    const localSet = new OR_SET(String(nodeId()), this.resolvers()._hlc);
                    localSet.setState(currentState);
                    localSet.merge(incoming);
                    return localSet.getState();
                }
                return incoming;
            }, false, s, m, r);
        }, k, s, m, r);
        this.root.wno.sub(k, (newValue) => setState(newValue), s, m, r);
        const setLive = (next) => {
            this.resolvers()._hlc.tick();
            const currentState = this.root.wno.get(k, s, m, r);
            let newValue = typeof next === "function" ? next(currentState) : next;
            const isCRDTState = (val) => val && typeof val === "object" && Array.isArray(val.adds) && Array.isArray(val.removes);
            if (isCRDTState(newValue) && isCRDTState(currentState)) {
                const localSet = new OR_SET(String(nodeId()), this.resolvers()._hlc);
                localSet.setState(currentState);
                localSet.merge(newValue);
                newValue = localSet.getState();
            }
            // Attach HLC clock metadata cleanly if it's an object, or wrap it
            let payloadWithClock = newValue;
            if (newValue && typeof newValue === "object" && !Array.isArray(newValue)) {
                payloadWithClock = { ...newValue, _hlc: this.resolvers()._hlc.tick() };
            }
            this.root.wno.set(k, payloadWithClock, true, s, m, r);
            this.send({ value: payloadWithClock, from: senderTokenRef.current }, k, s, m, r);
        };
        return [state, setLive];
    }
    useCellMailbox2(v, k = `_USECELL_MAILBOX2`, s = this.s, m = this.m, r = this.r) {
        const [state, setState] = useState(() => {
            const existing = this.root.wno.getSauron(k, s, m, r);
            if (existing !== undefined)
                return existing;
            if (v)
                return typeof v === "function" ? v() : v;
        });
        const queueRef = this.signals().atom ? this.signals().atom([]) : atom([]);
        const drainingRef = this.signals().atom ? this.signals().atom(false) : atom(false);
        const drain = () => {
            if (drainingRef.current)
                return;
            drainingRef.current = true;
            while (queueRef.current.length > 0) {
                const batch = queueRef.current.splice(0, queueRef.current.length);
                this.root.wno.setSauron(k, (current) => {
                    let next = current;
                    for (const incoming of batch) {
                        next = typeof incoming === "function" ? incoming(next) : incoming;
                    }
                    return next;
                }, false, s, m, r);
            }
            drainingRef.current = false;
            setState(this.root.wno.getSauron(k, s, m, r));
        };
        this.sub((i) => {
            const incoming = i.p;
            queueRef.current.push(incoming);
            if (!drainingRef.current)
                queueMicrotask(drain);
        }, k, s, m, r);
        const setLive = (next) => {
            this.send(next, k, s, m, r);
        };
        return [state, setLive];
    }
    useCellMailbox(v, k = `_USECELL_MAILBOX`, s = this.s, m = this.m, r = this.r) {
        const [state, setState] = useState(() => {
            const existing = this.root.wno.getSauron(k, s, m, r);
            if (existing !== undefined)
                return existing;
            return typeof v === "function" ? v() : v;
        });
        const queueRef = this.signals().atom ? this.signals().atom(null) : atom(null);
        if (!queueRef.current) {
            queueRef.current = new Queue(1);
        }
        // mailbox — replace the whole useEffect block:
        this.sub((i) => {
            const incoming = i.p;
            queueRef.current.run(async () => {
                const current = this.root.wno.getSauron(k, s, m, r);
                const next = typeof incoming === "function" ? incoming(current) : (incoming?.value ?? incoming);
                this.root.wno.setSauron(k, next, false, s, m, r);
                return next;
            });
        }, k, s, m, r);
        this.root.wno.subSauron(k, (newValue) => setState(newValue), s, m, r);
        const setLive = (next) => {
            this.send(next, k, s, m, r);
        };
        return [state, setLive];
    }
    // #endregion
    //                                    USE S CLASS
    // #region ═════════════════════════════════════════════════════════════════════════════════════════════
    useSClass(v, k = THE_WARLOCK_TEST, s = THE_WARLOCK_SL_CH, m = this.m, r = this.r, chain) {
        const ma = this.modules().create(k, v, undefined, s, m, r);
        const [state, setState] = useState(() => {
            const existing = ma.read();
            if (existing !== undefined)
                return existing;
        });
        const senderTokenRef = this.signals().atom ? this.signals().atom(Symbol()) : atom(Symbol()); // Symbol();
        this.sub((i) => {
            const incoming = i.p;
            if (incoming?.from === senderTokenRef.value)
                return;
            setState(incoming.value);
        }, k, s, m, r);
        const setLive = (next) => {
            const newValue = next;
            setState(newValue);
            ma.write(next);
            this.send({ value: newValue, from: senderTokenRef.value }, k, s, m, r);
        };
        return [MCR_Combo(state, chain), setLive];
    }
    useSClassCRDT(v, k = THE_WARLOCK_TEST, s = THE_WARLOCK_SL_CH, m = this.m, r = this.r, type = "none", chain, nodeId = _sid()) {
        const cellKey = `${k}:${this.root.gv.RTRN_TO_SDR}`;
        const ma = this.modules().create(k, v, undefined, s, m, r);
        const [state, setState] = useState(() => {
            const existing = ma.read();
            if (existing !== undefined)
                return existing;
        });
        const senderTokenRef = this.signals().atom ? this.signals().atom(Symbol()) : atom(Symbol());
        this.sub((i) => {
            const incoming = i.p;
            if (incoming?.from === senderTokenRef.value)
                return;
            if (incoming?._hlc) {
                this.resolvers()._hlc.update(incoming._hlc);
            }
            setState((currentState) => {
                if (currentState && currentState.adds && incoming.adds) {
                    const localSet = new OR_SET(nodeId, this.resolvers()._hlc);
                    localSet.setState(currentState);
                    localSet.merge(incoming);
                    return localSet.getState();
                }
                return incoming.value;
            });
        }, k, s, m, r);
        const setLive = (next) => {
            this.resolvers()._hlc.tick();
            const currentState = ma.read();
            let newValue = next;
            const isCRDTState = (val) => val && typeof val === "object" && Array.isArray(val.adds) && Array.isArray(val.removes);
            if (isCRDTState(newValue) && isCRDTState(currentState)) {
                const localSet = new OR_SET(nodeId, this.resolvers()._hlc);
                localSet.setState(currentState);
                localSet.merge(newValue);
                newValue = localSet.getState();
            }
            // Attach HLC clock metadata cleanly if it's an object, or wrap it
            const envelope = {
                value: newValue,
                from: senderTokenRef.current,
                _hlc: this.resolvers()._hlc.tick(),
            };
            setState(envelope.value);
            ma.write(envelope.value);
            this.send({ value: envelope, from: senderTokenRef.value }, k, s, m, r);
        };
        let rv;
        if (type === "waitFor") {
            this.send({ cmd: "waitFor", k, s, m, r }, this.root.gv.hc_disptacher, this.root.gv.hc_sl_reg, SAURON_MASTER_REG, THE_WIZARD_ROOT_REG);
            this.sub((m) => setState(m.p), cellKey, s, m, r);
        }
        else if (type === "sub") {
            this.send({ cmd: "subscribe", k, s, m, r }, this.root.gv.hc_disptacher, this.root.gv.hc_sl_reg, SAURON_MASTER_REG, THE_WIZARD_ROOT_REG);
            this.sub((m) => setState(m.p), cellKey, s, m, r);
        }
        else if (type === "cell") {
            rv = this.cell(cellKey, s, m, r);
            useEffect(() => {
                if (rv !== undefined) {
                    ma.write(rv);
                    setState(rv);
                }
            }, [r]);
        }
        return [MCR_Combo(state, chain), setLive];
    }
    useSClassCRDTB(v, k = this.k, s = this.s, m = this.m, r = this.r, nodeId = _sid()) {
        const ma = this.modules().create(k, v, undefined, s, m, r);
        const [state, setState] = useState(() => {
            const existing = ma.read();
            if (existing !== undefined)
                return existing.value ?? existing;
        });
        const senderTokenRef = this.signals().atom ? this.signals().atom(Symbol()) : atom(Symbol());
        useEffect(() => {
            this.sub((i) => {
                const incoming = i.p;
                if (incoming?.from === senderTokenRef.current)
                    return;
                if (incoming?._hlc)
                    this.resolvers()._hlc.update(incoming._hlc);
                ma.write((currentEnvelope) => {
                    const currentPayload = currentEnvelope?.value;
                    const incomingPayload = incoming.value;
                    if (this.isCRDTState(currentPayload) && this.isCRDTState(incomingPayload)) {
                        const localSet = new OR_SET(nodeId, this.resolvers()._hlc);
                        localSet.setState(currentPayload);
                        localSet.merge(incomingPayload);
                        return {
                            value: localSet.getState(),
                            from: incoming.from,
                            _hlc: incoming._hlc,
                        };
                    }
                    return incoming;
                });
                setState(incoming.value);
            }, k, s, m, r);
        }, [k, r, m]);
        const setLive = (next) => {
            this.resolvers()._hlc.tick();
            const currentState = ma.read();
            let newValue = next;
            if (this.isCRDTState(newValue) && this.isCRDTState(currentState)) {
                const localSet = new OR_SET(nodeId, this.resolvers()._hlc);
                localSet.setState(currentState);
                localSet.merge(newValue);
                newValue = localSet.getState();
            }
            const envelope = {
                value: newValue,
                from: senderTokenRef.current,
                _hlc: this.resolvers()._hlc.tick(),
            };
            ma.write(envelope);
            setState(envelope.value);
            this.send(envelope, k, s, m, r);
        };
        return [state.value ?? state, setLive];
    }
    useSClassMailbox(v, k = `_USESCLASS_MAILBOX`, s = this.s, m = this.m, r = this.r) {
        const [state, setState] = useState(() => {
            const existing = this.root.wno.getSauron(k, s, m, r);
            if (existing !== undefined)
                return existing;
            return typeof v === "function" ? v() : v;
        });
        const queueRef = this.signals().atom ? this.signals().atom(null) : atom(null);
        if (!queueRef.current) {
            queueRef.current = new Queue(1);
        }
        // mailbox — replace the whole useEffect block:
        this.sub((i) => {
            const incoming = i.p;
            queueRef.current.run(async () => {
                const current = this.root.wno.getSauron(k, s, m, r);
                const next = typeof incoming === "function" ? incoming(current) : (incoming?.value ?? incoming);
                this.root.wno.setSauron(k, next, false, s, m, r);
                return next;
            });
        }, k, s, m, r);
        this.root.wno.subSauron(k, (newValue) => setState(newValue), s, m, r);
        const setLive = (next) => {
            this.send(next, k, s, m, r);
        };
        return [state, setLive];
    }
    useSClassMailbox2(v, k = `_USECELL_MAILBOX2`, s = this.s, m = this.m, r = this.r) {
        const [state, setState] = useState(() => {
            const existing = this.root.wno.getSauron(k, s, m, r);
            if (existing !== undefined)
                return existing;
            if (v)
                return typeof v === "function" ? v() : v;
        });
        const queueRef = this.signals().atom ? this.signals().atom([]) : atom([]);
        const drainingRef = this.signals().atom ? this.signals().atom(false) : atom(false);
        const drain = () => {
            if (drainingRef.current)
                return;
            drainingRef.current = true;
            while (queueRef.current.length > 0) {
                const batch = queueRef.current.splice(0, queueRef.current.length);
                this.root.wno.setSauron(k, (current) => {
                    let next = current;
                    for (const incoming of batch) {
                        next = typeof incoming === "function" ? incoming(next) : incoming;
                    }
                    return next;
                }, false, s, m, r);
            }
            drainingRef.current = false;
            setState(this.root.wno.getSauron(k, s, m, r));
        };
        this.sub((i) => {
            const incoming = i.p;
            queueRef.current.push(incoming);
            if (!drainingRef.current)
                queueMicrotask(drain);
        }, k, s, m, r);
        const setLive = (next) => {
            this.send(next, k, s, m, r);
        };
        return [state, setLive];
    }
    // #endregion
    //                                    BACKEND
    // #region ═════════════════════════════════════════════════════════════════════════════════════════════
    oldsub(k, handler, s = this.s, m = this.m, r = this.r) {
        const _listeners = ssr._channels(s, m, r);
        if (!_listeners.has(k)) {
            _listeners.set(k, new Set());
        }
        _listeners.get(k).add(handler);
        return () => {
            const set = _listeners.get(k);
            if (set) {
                set.delete(handler);
                if (set.size === 0)
                    _listeners.delete(k);
            }
        };
    }
    subAny(handler, s = this.s, m = this.m, r = this.r) {
        return this.sub("*", handler, s, m, r);
    }
    subAll(fn, s = this.s, m = this.m, r = this.r) {
        return this.sub("*", fn, s, m, r);
    }
    unsub(k, handler, s = this.s, m = this.m, r = this.r) {
        const _listeners = ssr._channels(s, m, r);
        const set = _listeners.get(k);
        if (!set)
            return;
        set.delete(handler);
        if (set.size === 0)
            _listeners.delete(k);
    }
    emit(event, p, s = this.s, m = this.m, r = this.r) {
        const _listeners = ssr._channels(s, m, r);
        const set = _listeners.get(event);
        if (!set)
            return;
        for (const fn of set) {
            fn(p);
        }
    }
    once(event, fn, s = this.s, m = this.m, r = this.r) {
        const wrapper = (data) => {
            fn(data);
            this.unsub(event, wrapper, s, m, r);
        };
        return this.sub(event, wrapper, s, m, r);
    }
    removeAllListeners(event, s = this.s, m = this.m, r = this.r) {
        const _listeners = ssr._channels(s, m, r);
        if (event) {
            _listeners.delete(event);
        }
        else {
            _listeners.clear();
        }
    }
    listenerCount(event, s = this.s, m = this.m, r = this.r) {
        const _listeners = ssr._channels(s, m, r);
        const set = _listeners.get(event);
        return set ? set.size : 0;
    }
    eventNames(s = this.s, m = this.m, r = this.r) {
        const _listeners = ssr._channels(s, m, r);
        return Array.from(_listeners.keys());
    }
    // public adapters = new Map<string, Set<CSEAdapter>>() //new Set<CSEAdapter>()
    throttling = false;
    _cse_token;
    _init_sessionToken;
    _sessionToken;
    _sessionId;
    adapterMetrics = new Map();
    seen = new Set();
    middleware = [];
    online = true;
    backpressure = {};
    subscriptions = new Map();
    wildcardSubscriptions = [];
    groups = new Map();
    deliveryHandlers = new Set();
    deadLetters = [];
    durableOffsets = new Map(); // key: `${rt}:${subscriberId}`
    durableHistory = new Map();
    messageCount = new Map();
    _schemas = new Map();
    permissions = new Map();
    routeRules = [];
    transforms = new Map();
    encryptionConfigs = [];
    compressionConfigs = [];
    tagSubs = new Map();
    tagsByChannel = new Map();
    history = new Map();
    channels_ = new Map();
    sub_channels_ = new Map();
    trip_channels_ = new Map();
    quad_channels_ = new Map();
    streams = new Map();
    pending = new Map();
    queue = [];
    instanceId = `instance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    QUEUE_KEY = "staff:sends:offline:queue";
    globalMiddleware = {
        beforeSend: [],
        afterSend: [],
        beforeReceive: [],
        afterReceive: [],
        onError: [],
    };
    BACK_END = (() => {
        const fn = () => { };
        fn.SHOULD_BACKPRESSURE = () => {
            if (!ssr.se._backpressure().maxQueueSize)
                return false;
            if (ssr.se._queue().length < ssr.se._backpressure().maxQueueSize)
                return false;
            if (ssr.se.throttling)
                return true;
            ssr.se.throttling = true;
            setTimeout(() => {
                ssr.se.throttling = false;
                this.DISPATCH.drain().catch(console.error);
            }, ssr.se._backpressure().throttleMs ?? 100);
            return true;
        };
        return fn;
    })();
    getExactSubs = (k, s = this.s) => ssr.se.quad_channels().get(k)?.get(s) ?? new Set();
    async receive(msg) {
        // if (!(await this.BACK_END.run.beforeReceive(msg))) return
        if (!ssr.se.BACK_END.run.middleware(msg))
            return;
        // schema validation
        /**       const schema = this._schemas().get(msg.r)
            if (schema) {
                const ok = schema.validate(msg.p)
                if (!ok) {
                    this._deadLetters().push(msg)
                    await this.BACK_END.run.onError(new Error(`schema validation failed for ${msg.r}`), msg)
                    return
                }
                if (schema.coerce) msg.p = schema.coerce(msg.p)
            }
     */
        const result = await ssr.se.handlers.invoke(msg);
        await ssr.se.BACK_END.run.afterReceive(msg, result);
    }
    DISPATCH = (() => {
        const fn = async (raw, adapter) => {
            let msg = raw;
            //                                    DECODE DE-BINARY
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            // Decode first — mirrors encode running last on the send side.
            if (msg instanceof Uint8Array || (typeof Buffer !== "undefined" && Buffer.isBuffer(msg))) {
                msg = this.disruptor().t.decode_msg(msg);
                if (!msg)
                    return { success: false, decodeFailed: true };
            }
            // #endregion
            //                                    SECURE UNWRAP
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            //   if (this._auth_initialized) { msg = await this.encryption.unwrap(msg); if (!msg) return { success: false, unauthorized: true }; }
            // #endregion
            //                                    CHANNEL MAPPING
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            msg.r = msg.r ?? this.r;
            msg.m = msg.m ?? this.m;
            msg.s = msg.s ?? this.s;
            msg.k = msg.k;
            //	console.log(msg, "emitter.dispatch.msg");
            // #endregion
            //                                    TRACE METRICS
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            // if (this.DEVTOOLS_ACTIVE) this.t.traceStage(msg.id, msg.r, 'dispatch'); // _metrics
            // #endregion
            //                                    REPLY
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            if (msg.r && msg.r.startsWith(":reply:")) {
                const originalMsgId = msg.r.replace(":reply:", "");
                const pendingTx = this.root.gv.pending.get(originalMsgId);
                if (pendingTx) {
                    clearTimeout(pendingTx.timer);
                    this.root.gv.pending.delete(originalMsgId);
                    pendingTx.resolve(msg.p);
                    return { success: true, isReply: true };
                }
            }
            // #endregion
            //                                    TTL
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            if (this.root.gv.seen.has(msg.id))
                return { success: true };
            if (msg.ttl && Date.now() - msg.ts > msg.ttl) {
                // if (root.DEVTOOLS_ACTIVE) log(`[SIGNALS][DISPATCH][TTL]`, { msg: 'ttl_expired', p: msg }, t.deep)
                return { success: false, dropped: true };
            }
            if (this.root.gv.seen.size > 10000)
                this.root.gv.seen.clear();
            this.root.gv.seen.add(msg.id);
            // #endregion
            //                                    MSG HISTORY
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            const h = this.history.get(msg.r) ?? [];
            h.push(msg.p);
            if (h.length > 3)
                h.splice(0, h.length - 3);
            this.history.set(msg.r, h);
            // #endregion
            //                                    MSG COUNT
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            const count = (this.root.gv.messageCount.get(msg.r) ?? 0) + 1;
            this.root.gv.messageCount.set(msg.r, count);
            // #endregion
            //                                    IF RUNNING NO MIDDLEWARE
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            if (!ssr.se.BACK_END.run.middleware(msg)) {
                // if (this.DEVTOOLS_ACTIVE) log(`[SIGNALS][DISPATCH][NO_MIDDLEWARE]`, { msg: 'blocked', p: msg }, t.deep)
                return { success: false, dropped: true };
            }
            // #endregion
            //                                    ROUTING RULES
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            //   let targets = [...this.adapters].filter(a => a !== msg._adapter)
            /**  for (const rule of this._routeRules()) {
                    if (!rule.match(msg)) continue
                    if (root.DEVTOOLS_ACTIVE) {
                        // log(`[SIGNALS][DISPATCH][ROUTING]`, { msg: 'route_matched', p: msg  }, t.deep)
                        this.t.traceStage(msg.id, msg.r, 'route', { rule: rule.name }) // _metrics
                    }
                    //     if (rule.targetAdapters) { targets = targets.filter(a => rule.targetAdapters!.includes(a.id ?? '')) }
                    if (rule.targetrts) {
                        // if (this.DEVTOOLS_ACTIVE) this.emitDevtoolsEvent('route_rejected', msg.r, msg.m || undefined, msg.id, { rule: rule.name })
                        if (!rule.targetrts.includes(msg.r)) return { success: false, routed: false }
                    }
                } */
            // #endregion
            //                                    APPLY TRANSFORMS
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            /**   msg = await this.transforms.apply(msg, 'outgoing')
                if (root.DEVTOOLS_ACTIVE) {
                    //  this.emitDevtoolsEvent('transform_applied', msg.r, msg.m || undefined, msg.id, { direction: 'outgoing' });
                    this.t.traceStage(msg.id, msg.r, 'transform'); // _metrics
                } */
            /**  const localListeners = this.meta._subscribers(raw.k, raw.s, raw.m, raw.r)
                  if (localListeners && localListeners.size > 0) {
                      queueMicrotask(() => {
                          for (const listener of localListeners) {
                              listener(msg);
                          }
                      });
                  } */
            // #endregion
            //                                    SEND
            // #region ═════════════════════════════════════════════════════════════════════════════════════
            Promise.resolve().then(() => {
                const a = this._adapters();
                switch (adapter) {
                    case "http":
                        this.sendMessage(msg, a.http_adapter);
                        break;
                    case "ws":
                    case "cross_boundary":
                        this.sendMessage(msg, a.ws_adapter);
                        break;
                    case "disruptor":
                    case "same_boundary":
                        this.sendMessage(msg, a.disruptor_adapter);
                        break;
                    case "atom_adapter":
                        this.sendMessage(msg, a.atom_adapter);
                        break;
                    /**          case 'reliableSocket':
                            this.sendMessage(msg, a.reliableSocket);
                            break;
                        case 'webTransportDatagramsAdapter':
                            this.sendMessage(msg, a.webTransportDatagramsAdapter);
                            break;
                        case 'webTransportClientAdapter':
                            this.sendMessage(msg, a.webTransportClientAdapter);
                            break;
                        case 'startWebTransportServer':
                            this.sendMessage(msg, a.startWebTransportServer);
                            break;
                        case 'webTransportAdapter':
                            this.sendMessage(msg, a.webTransportAdapter);
                            break;
                        case 'webRTCAdapter':
                            this.sendMessage(msg, a.webRTCAdapter);
                            break;
                       
                        case 'http2ClientAdapter':
                            this.sendMessage(msg, a.http2ClientAdapter);
                            break;
                        case 'http2ServerAdapter':
                            this.sendMessage(msg, a.http2ServerAdapter);
                            break;
                        case 'httpAdapter':
                            this.sendMessage(msg, a.httpAdapter);
                            break;
                               case 'broadcastChannelAdapter2':
                            this.sendMessage(msg, a.broadcastChannelAdapter2);
                            break;
                        case 'broadcastChannelAdapter':
                            this.sendMessage(msg, a.broadcastChannelAdapter);
                            break;
                        case 'broadcastChannelAdapter':
                            this.sendMessage(msg, a.broadcastChannelAdapter);
                            break;
     */
                    default:
                        //	console.log("this.ws_adapter adapter");
                        this.sendMessage(msg, a.ws_adapter);
                    //   this.sendMessage(msg, a.broadcastChannelAdapter);
                    // this.sendMessage(msg, a.http);
                    // this.sendMessage(msg, a.same_boundary);
                }
            });
            // #endregion
            const result = await ssr.se.handlers.invoke(msg);
            //	console.log(result, "emitter.dispatch.result");
            return result;
        };
        fn.drain = async () => {
            const startTime = Date.now();
            const msgs = [...this.queue];
            this.queue = [];
            //await IDB_KV.delete(this.root.gv.QUEUE_KEY);
            this.root.wno.deleteSauron(this.root.gv.QUEUE_KEY);
            // Process each message through flood gates (round robin)
            for (const msg of msgs) {
                if (msg.ttl && msg.ts !== undefined && Date.now() - msg.ts > msg.ttl)
                    continue;
                await this.DISPATCH(msg);
            }
            //	this.disruptor().t.recordQueue("drain", Date.now() - startTime); // _metrics
        };
        fn.enqueue = async (msg) => {
            /** if (this.DEVTOOLS_ACTIVE) {
                    log(`[THE_WIZARD][SIGNALS][ENQUEUE]`, {
                        msg: msg,
                    }, t.deep)//this.drop.t.error
                    // this.emitDevtoolsEvent('enqueue', msg.r, msg.m || undefined, msg.id, {          priority: msg.priority,          ttl: msg.ttl        });
                    this.t.traceStage(msg.id, String(msg.r), 'enqueue', { priority: msg.priority, ttl: msg.ttl }); // _metrics
                    this.t.tracePayloadSize(msg.id, JSON.stringify(msg.p ?? '').length); // _metrics
                } */
            // Normal queue processing continues here...
            if (this.disruptor().DEVTOOLS_ACTIVE) {
                this.disruptor().t.recordQueue("enqueue");
            }
            this.queue.push(msg);
            this.queue.sort((a, b) => this.disruptor().priorityWeight(b.priority) - this.disruptor().priorityWeight(a.priority));
            if (this.backpressure.maxQueueSize && this.queue.length > this.backpressure.maxQueueSize) {
                const dropped = this.queue.pop();
                if (dropped) {
                    this.disruptor()._deadLetters().push(dropped);
                    if (this.disruptor().DEVTOOLS_ACTIVE)
                        this.disruptor().t.recordQueue("drop"); // _metrics
                }
            }
            const PAYLOAD_SIZE_CAP = 524288;
            const persistable = this.queue.map((m) => {
                const size = JSON.stringify(m.p).length;
                return size > PAYLOAD_SIZE_CAP ? { ...m, p: null } : m;
            });
            this.root.wno.set(this.root.gv.QUEUE_KEY, persistable);
            if (this.disruptor().DEVTOOLS_ACTIVE && this.queue.some((m) => m.id === msg.id)) {
                this.disruptor().t.finishTrace(msg.id, "queued");
            } // _metrics
        };
        fn.sendMessage = (msg, adapter, boundary) => {
            // Prepare p - JSON serialize, strip functions
            let finalizedPayload = { ...msg };
            if (finalizedPayload.p && typeof finalizedPayload.p === "object" && boundary === "cross-node") {
                finalizedPayload.p = JSON.parse(JSON.stringify(finalizedPayload.p, (key, value) => {
                    if (typeof value === "function")
                        return undefined;
                    return value;
                }));
            }
            // Send through adapter
            if (this.root.gv._auth_initialized) {
                const secured = this.disruptor().encryption.wrap(finalizedPayload);
                adapter.send(secured);
            }
            else {
                try {
                    adapter.send(finalizedPayload);
                }
                catch (e) {
                    console.log(`[SEND MESSAGE][ADAPTER: ${JSON.stringify(adapter)}][${e}]`);
                }
            }
        };
        return fn;
    })();
    ds(k) {
        return `${k}_MAP_SACRIFICE_YOUR_SOUL_`;
    }
    sendMessage(msg, adapter) {
        // Prepare p - JSON serialize, strip functions
        let finalizedPayload = { ...msg };
        if (finalizedPayload.p && typeof finalizedPayload.p === "object") {
            finalizedPayload.p = JSON.parse(JSON.stringify(finalizedPayload.p, (key, value) => {
                if (typeof value === "function")
                    return undefined;
                return value;
            }));
        }
        //  console.log(finalizedPayload, 'emitter.sendMessage.finalizedPayload')
        try {
            adapter.send(finalizedPayload);
        }
        catch (e) {
            console.log(`[SEND MESSAGE][ADAPTER: ${JSON.stringify(adapter)}][${e}]`);
        }
        /**
                 *  // Send through adapter
                 if (this._auth_vized) {
                     const secured = this.secureWrap(finalizedPayload);
                     adapter.send(secured as A);
                 } else {
                     adapter.send(finalizedPayload);
                 }
                 */
    }
    _adapters = (() => {
        /**
            fn.hadron_collider_adapter = (): SIG_BUS_Adapter => {
            const d = master_.rs.resolvers.HC_T.dispatch;
            let messageHandler: ((msg: SIG_BUS_Message) => void) | null = null;
            d.onPublish = (m: A) => messageHandler?.(m);

            return {
                id: "hadron-collider",
                send(msg: SIG_BUS_Message) {
                    d.publish(msg);
                }, // throws on a full queue, so register() demotes
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    handler?.();
                },
                onDisconnect() {},
            };
        };
        fn.register_adapter_1 = () => {
            this._adapters.registerAdapter(this._adapters.hadron_collider_adapter(), 1);
            // const root = this.REFRESH_ROOT()
            // const b = master_.rs.signals
            //defer.run('register_adapter_1', () => {            });
        };
         */
        const fn = (sl_reg = this.s, ms_reg = this.m, globalKey = this.r) => {
            return ssr._adapters(sl_reg, ms_reg, globalKey);
        };
        fn.registerAdapter = (adapter, assign) => {
            const a = ssr._adapters();
            if (assign === 1)
                a.disruptor_adapter = adapter;
            else if (assign === 2)
                a.pipe_adapter = adapter;
            else if (assign === 3)
                a.http_adapter = adapter;
            else if (assign === 4)
                a.reliableSocket = adapter;
            else if (assign === 5)
                a.workerThreadAdapter = adapter;
            else if (assign === 6)
                a.webTransportDatagramsAdapter = adapter;
            else if (assign === 7)
                a.webTransportClientAdapter = adapter;
            else if (assign === 8)
                a.webRtcDataChannelHostAdapter = adapter;
            else if (assign === 11)
                a.httpAdapter = adapter;
            else if (assign === 12)
                a.webTransportAdapter = adapter;
            else if (assign === 14)
                a.webRTCAdapter = adapter;
            else if (assign === 15)
                a.sharedArrayBufferAdapter = adapter;
            else if (assign === 16)
                a.sharedWorkerAdapter = adapter;
            else if (assign === 18)
                a.http2ClientAdapter = adapter;
            else if (assign === 21)
                a.mqttAdapter = adapter;
            else if (assign === 24)
                a.nativeMessagingHostAdapter = adapter;
            else if (assign === 26)
                a.childProcessAdapter = adapter;
            else if (assign === 27)
                a.broadcastChannelAdapter2 = adapter;
            else if (assign === 28)
                a.broadcastChannelAdapter = adapter;
            else if (assign === 30)
                a.atom_adapter = adapter;
            else if (assign === 31)
                a.ws_adapter = adapter;
            //else if (assign === 32) a.hadron_collider_adapter = adapter;
            //  const id = adapter.id ?? `adapter:${Math.random().toString(36).slice(2)}`
            const unsub = adapter.onMessage(async (msg) => {
                msg._adapter = adapter;
                try {
                    await this.receive(msg);
                }
                catch (e) {
                    await ssr.se.BACK_END.run.onError(e, msg);
                }
            });
            adapter.onConnect?.(() => {
                this.online = true;
                this.DISPATCH.drain().catch(console.error);
            });
            adapter.onDisconnect?.(() => {
                this.online = false;
            });
            return () => {
                unsub();
            };
        };
        fn.ws_adapter = (url = "ws://localhost:6453", protocols) => {
            let ws = null;
            let reconnectTimer = null;
            let reconnectDelay = 1000;
            const maxReconnectDelay = 30000;
            const messageQueue = [];
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            const connect = () => {
                ws = new WebSocket(url, protocols);
                ws.onopen = () => {
                    reconnectDelay = 1000;
                    while (messageQueue.length > 0) {
                        const msg = messageQueue.shift();
                        ws.send(JSON.stringify(msg));
                    }
                    connectHandler?.();
                };
                ws.onmessage = (e) => {
                    try {
                        const msg = JSON.parse(e.data);
                        messageHandler?.(msg);
                    }
                    catch { }
                };
                ws.onclose = () => {
                    disconnectHandler?.();
                    reconnectTimer = setTimeout(() => {
                        reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
                        connect();
                    }, reconnectDelay);
                };
                ws.onerror = () => ws?.close();
            };
            connect();
            return {
                send(msg) {
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(msg));
                    }
                    else {
                        messageQueue.push(msg);
                    }
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.hadron_collider_adapter = () => {
            /***	const d = this.root.HC_T.dispatch;
             let messageHandler: ((msg: SIG_BUS_Message) => void) | null = null;
             d.onPublish = (m: A) => messageHandler?.(m);
    
             return {
                 id: "hadron-collider",
                 send(msg: SIG_BUS_Message) {
                     d.publish(msg);
                 }, // throws on a full queue, so register() demotes
                 onMessage(handler) {
                     messageHandler = handler;
                     return () => {
                         messageHandler = null;
                     };
                 },
                 onConnect(handler) {
                     handler?.();
                 },
                 onDisconnect() {},
             }; */
        };
        fn.register_adapter_2 = () => {
            this._adapters.registerAdapter(this._adapters.pipe_adapter(), 2);
        };
        fn.register_reliableSocket_4 = () => {
            this._adapters.registerAdapter(this._adapters.reliableSocket(), 4);
        };
        fn.register_workerThreadAdapter_5 = () => {
            this._adapters.registerAdapter(this._adapters.workerThreadAdapter(), 5);
        };
        fn.register_webRtcDataChannelHostAdapter_8 = () => {
            this._adapters.registerAdapter(this._adapters.webRtcDataChannelHostAdapter(), 8);
        };
        fn.register_httpAdapter_11 = () => {
            this._adapters.registerAdapter(this._adapters.httpAdapter(), 11);
        };
        fn.register_webRTCAdapter_14 = () => {
            this._adapters.registerAdapter(this._adapters.webRTCAdapter(), 14);
        };
        fn.register_sharedArrayBufferAdapter_15 = () => {
            this._adapters.registerAdapter(this._adapters.sharedArrayBufferAdapter(), 15);
        };
        fn.register_http2ClientAdapter_18 = () => {
            this._adapters.registerAdapter(this._adapters.http2ClientAdapter(), 18);
        };
        fn.register_mqttAdapter_21 = () => {
            this._adapters.registerAdapter(this._adapters.mqttAdapter(), 21);
        };
        fn.register_nativeMessagingHostAdapter_24 = () => {
            this._adapters.registerAdapter(this._adapters.nativeMessagingHostAdapter(), 24);
        };
        fn.register_childProcessAdapter_26 = () => {
            this._adapters.registerAdapter(this._adapters.childProcessAdapter(), 26);
        };
        fn.register_broadcastChannelAdapter2_27 = () => {
            this._adapters.registerAdapter(this._adapters.broadcastChannelAdapter2(), 27);
        };
        fn.register_broadcastChannelAdapter_28 = () => {
            this._adapters.registerAdapter(this._adapters.broadcastChannelAdapter(), 28);
        };
        fn.register_atom_adapter_30 = () => {
            this._adapters.registerAdapter(this._adapters.atom_adapter(), 30);
        };
        fn.register_ws_adapter_31 = () => {
            this._adapters.registerAdapter(this._adapters.ws_adapter(), 31);
        };
        fn.atom_adapter = () => {
            const A = this.disruptor();
            const unsubs = new Map(); // address -> atom unsubscribe
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            let closed = false;
            // one atom per address; first sight creates it and attaches the bus handler
            const ensure = (m) => {
                const id = `${m.r}|${m.m}|${m.s}|${m.k}`;
                if (unsubs.has(id))
                    return;
                A.create(m.k, null, { triggerRender: false }, m.s, m.m, m.r); // add history: { max: 50 } if you want replay
                unsubs.set(id, A.subscribe(m.k, (current) => {
                    if (current && messageHandler)
                        messageHandler(current);
                }, m.s, m.m, m.r));
            };
            return {
                id: "atom",
                send(msg) {
                    if (closed)
                        throw new Error("atom adapter closed"); // register() demotes
                    ensure(msg);
                    A.write(msg.k, msg, "bus", msg.s, msg.m, msg.r);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                    handler?.();
                }, // in-process: always connected
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
                close() {
                    closed = true;
                    for (const u of unsubs.values())
                        u();
                    unsubs.clear();
                    disconnectHandler?.();
                },
            };
        };
        fn.pipe_adapter = () => {
            let messageHandler = null;
            let connectHandler;
            let disconnectHandler;
            let role = null;
            let server = null;
            let upstream = null; // client -> hub
            const clients = new Set(); // hub -> clients
            const setConnected = (r) => {
                const was = role !== null;
                role = r;
                if (!was && r)
                    connectHandler?.();
                else if (was && !r)
                    disconnectHandler?.();
            };
            const deliver = (frame) => {
                try {
                    const decoded = BinaryFrameSerializer.decodeFrame(frame);
                    if (!decoded.topicName)
                        return;
                    messageHandler?.(JSON.parse(new TextDecoder().decode(decoded.p)));
                }
                catch (e) {
                    console.error("[pipe-adapter] bad frame", e);
                }
            };
            // length-prefixed stream reader: [u32 LE length][frame]
            const attachReader = (sock, onFrame) => {
                let buf = Buffer.alloc(0);
                sock.on("data", (chunk) => {
                    const data = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
                    buf = buf.length ? Buffer.concat([buf, data]) : data;
                    while (buf.length >= 4) {
                        const len = buf.readUInt32LE(0);
                        if (buf.length < 4 + len)
                            break;
                        onFrame(buf.subarray(4, 4 + len));
                        buf = buf.subarray(4 + len);
                    }
                });
            };
            const wrap = (frame) => {
                const header = Buffer.allocUnsafe(4);
                header.writeUInt32LE(frame.byteLength, 0);
                return Buffer.concat([header, frame]);
            };
            const retry = () => setTimeout(start, 50 + Math.random() * 150); // jitter so peers don't elect at once
            // ---- hub role ----
            const onHubSocket = (sock) => {
                clients.add(sock);
                attachReader(sock, (frame) => {
                    deliver(frame); // hub consumes it too
                    const out = wrap(frame);
                    for (const c of clients)
                        if (c !== sock && !c.destroyed)
                            c.write(out); // relay to the others
                });
                const drop = () => clients.delete(sock);
                sock.on("close", drop);
                sock.on("error", drop);
            };
            // ---- client role ----
            const connectAsClient = () => {
                const sock = net.connect(this.root.gv.PIPE_PATH);
                let up = false;
                sock.on("connect", () => {
                    up = true;
                    upstream = sock;
                    setConnected("client");
                });
                attachReader(sock, deliver);
                sock.on("error", (e) => {
                    if (!up && !this.root.gv.IS_WIN && e.code === "ECONNREFUSED") {
                        try {
                            fs.unlinkSync(this.root.gv.PIPE_PATH);
                        }
                        catch { } // stale socket file from a dead hub
                    }
                });
                sock.on("close", () => {
                    if (upstream === sock)
                        upstream = null;
                    if (up)
                        setConnected(null);
                    retry();
                });
            };
            const self = this;
            // ---- election: first to listen is the hub, everyone else connects ----
            function start() {
                const srv = net.createServer(onHubSocket);
                srv.once("error", (e) => {
                    if (e.code === "EADDRINUSE")
                        connectAsClient();
                    else {
                        console.error("[pipe-adapter] listen failed", e);
                        retry();
                    }
                });
                srv.listen(self.root.gv.PIPE_PATH, () => {
                    server = srv;
                    setConnected("hub");
                });
            }
            start();
            return {
                id: "named-pipe",
                send(msg) {
                    if (!role)
                        throw new Error("pipe not connected"); // register() demotes
                    const out = wrap(BinaryFrameSerializer.encodeFrame(String(msg.k), JSON.stringify(msg)));
                    if (role === "hub") {
                        for (const c of clients)
                            if (!c.destroyed)
                                c.write(out);
                    }
                    else {
                        if (!upstream || upstream.destroyed)
                            throw new Error("pipe not connected");
                        upstream.write(out);
                    }
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                    if (role)
                        handler?.();
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        /**	fn.ws_adapter = (url: string = "ws://localhost:6454", protocols?: string | string[]): SIG_BUS_Adapter => {
            let ws: WebSocket | null = null;
            let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
            let reconnectDelay = 1000;
            let closed = false;
            const maxReconnectDelay = 30000;
            const messageQueue: SIG_BUS_Message[] = [];
            let messageHandler: ((msg: SIG_BUS_Message) => void) | null = null;
            let connectHandler: (() => void) | null = null;
            let disconnectHandler: (() => void) | null = null;

            const connect = () => {
                if (closed) return;
                ws = new WebSocket(url, protocols);

                ws.onopen = () => {
                    reconnectDelay = 1000;
                    while (messageQueue.length > 0) {
                        const msg = messageQueue.shift()!;
                        ws!.send(JSON.stringify(msg));
                    }
                    connectHandler?.();
                };

                ws.onmessage = (e) => {
                    try {
                        const msg = JSON.parse(e.data as string) as SIG_BUS_Message;
                        messageHandler?.(msg);
                    } catch {}
                };

                ws.onclose = () => {
                    disconnectHandler?.();
                    if (closed) return;
                    reconnectTimer = setTimeout(() => {
                        reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
                        connect();
                    }, reconnectDelay);
                    (reconnectTimer as A).unref?.(); // a retry timer alone must not keep the process alive
                };
                ws.onerror = () => ws?.close();
            };
            connect();
            return {
                id: "websocket",
                send(msg: A) {
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(msg));
                    } else {
                        messageQueue.push(msg);
                    }
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
                close() {
                    // optional: call from tests / shutdown
                    closed = true;
                    if (reconnectTimer) clearTimeout(reconnectTimer);
                    ws?.close();
                },
            };
        }; */
        fn.reliableSocket = (url = "ws://localhost:6455", options = {}) => {
            const opts = {
                reconnect: true,
                initialDelay: 1000,
                maxDelay: 30000,
                backoffMultiplier: 1.5,
                jitter: true,
                maxAttempts: Infinity,
                queueEnabled: true,
                maxQueueSize: 100,
                maxQueueAge: 300000,
                queueKey: `reliable-socket:queue:${url}`,
                ...options,
            };
            let socket = null;
            let status = "closed";
            let reconnectAttempts = 0;
            let reconnectTimer = null;
            let allowReconnect = opts.reconnect;
            const statusListeners = new Set();
            const messageListeners = new Set();
            const openListeners = new Set();
            const closeListeners = new Set();
            function setStatus(s) {
                status = s;
                statusListeners.forEach((l) => l(s));
            }
            function scheduleReconnect() {
                if (reconnectAttempts >= opts.maxAttempts)
                    return;
                let delay = Math.min(opts.initialDelay * opts.backoffMultiplier ** reconnectAttempts, opts.maxDelay);
                if (opts.jitter)
                    delay *= 0.5 + Math.random() * 0.5;
                reconnectTimer = setTimeout(() => {
                    reconnectAttempts++;
                    open();
                }, delay);
            }
            function open() {
                setStatus(reconnectAttempts > 0 ? "reconnecting" : "connecting");
                const ws = new WebSocket(url);
                socket = ws;
                ws.onopen = () => {
                    reconnectAttempts = 0;
                    setStatus("open");
                    openListeners.forEach((l) => l());
                    flushQueue();
                };
                ws.onmessage = (e) => {
                    let msg;
                    try {
                        msg = JSON.parse(String(e.data));
                    }
                    catch {
                        return;
                    }
                    messageListeners.forEach((l) => l(msg));
                };
                ws.onclose = () => {
                    setStatus("closed");
                    closeListeners.forEach((l) => l());
                    if (allowReconnect)
                        scheduleReconnect();
                };
                ws.onerror = () => ws.close();
            }
            const self = this;
            function flushQueue() {
                if (status !== "open" || !socket)
                    return;
                const now = Date.now();
                const queue = (self.root.wno.get(opts.queueKey) ?? []).filter((q) => now - q.queuedAt <= opts.maxQueueAge);
                queue.forEach((q) => socket?.send(q.raw));
                self.root.wno.set(opts.queueKey, []);
            }
            open();
            return {
                send(msg) {
                    const raw = JSON.stringify(msg);
                    if (status === "open" && socket) {
                        socket.send(raw);
                        return;
                    }
                    if (!opts.queueEnabled)
                        return;
                    const queue = self.root.wno.get(opts.queueKey) ?? [];
                    queue.push({ raw, queuedAt: Date.now() });
                    if (queue.length > opts.maxQueueSize)
                        queue.shift();
                    self.root.wno.set(opts.queueKey, queue);
                },
                onMessage(handler) {
                    messageListeners.add(handler);
                    return () => {
                        messageListeners.delete(handler);
                    };
                },
                onConnect(handler) {
                    openListeners.add(handler);
                    return () => {
                        openListeners.delete(handler);
                    };
                },
                onDisconnect(handler) {
                    closeListeners.add(handler);
                    return () => {
                        closeListeners.delete(handler);
                    };
                },
                onStatusChange(handler) {
                    statusListeners.add(handler);
                    return () => {
                        statusListeners.delete(handler);
                    };
                },
                status() {
                    return status;
                },
                queueSize() {
                    return (self.root.wno.get(opts.queueKey) ?? []).length;
                },
                close() {
                    allowReconnect = false;
                    if (reconnectTimer)
                        clearTimeout(reconnectTimer);
                    socket?.close();
                },
            };
        };
        fn.workerThreadAdapter = (worker = new Worker(new URL("./cse.worker.ts", import.meta.url))) => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            worker.on("message", (raw) => {
                try {
                    messageHandler?.(typeof raw === "string" ? JSON.parse(raw) : raw);
                }
                catch { }
            });
            worker.on("exit", () => disconnectHandler?.());
            process.nextTick(() => connectHandler?.());
            return {
                send(msg) {
                    worker.postMessage(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        // = new WebTransport('https://localhost:6456')
        fn.webTransportDatagramsAdapter = (session) => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            let writer = null;
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            async function pump() {
                const reader = session.datagrams.readable.getReader();
                let buffer = "";
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done)
                            break;
                        buffer += decoder.decode(value, { stream: true });
                        let idx;
                        while ((idx = buffer.indexOf("\n")) >= 0) {
                            const line = buffer.slice(0, idx);
                            buffer = buffer.slice(idx + 1);
                            if (!line)
                                continue;
                            try {
                                messageHandler?.(JSON.parse(line));
                            }
                            catch { }
                        }
                    }
                }
                catch { }
            }
            session.ready
                .then(async () => {
                connectHandler?.();
                writer = session.datagrams.writable.getWriter();
                pump();
            })
                .catch(() => { });
            session.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.());
            return {
                send(msg) {
                    if (!writer)
                        return;
                    // Datagrams are unreliable — write and forget. Size cap applies
                    // (WebTransport datagram MTU), caller splits large frames upstream.
                    writer.write(encoder.encode(JSON.stringify(msg) + "\n")).catch(() => { });
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.webTransportClientAdapter = (url = "https://localhost:6457") => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            const messageQueue = [];
            let writer = null;
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            const wt = new WebTransport(url);
            async function pump(readable) {
                const reader = readable.getReader();
                let buffer = "";
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done)
                            break;
                        buffer += decoder.decode(value, { stream: true });
                        let idx;
                        while ((idx = buffer.indexOf("\n")) >= 0) {
                            const line = buffer.slice(0, idx);
                            buffer = buffer.slice(idx + 1);
                            if (!line)
                                continue;
                            try {
                                messageHandler?.(JSON.parse(line));
                            }
                            catch { }
                        }
                    }
                }
                catch { }
            }
            async function open() {
                await wt.ready;
                const stream = await wt.createBidirectionalStream();
                writer = stream.writable.getWriter();
                pump(stream.readable);
                while (messageQueue.length > 0) {
                    writer.write(encoder.encode(JSON.stringify(messageQueue.shift()) + "\n")).catch(() => { });
                }
                connectHandler?.();
            }
            open().catch(() => { });
            wt.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.());
            return {
                send(msg) {
                    if (writer)
                        writer.write(encoder.encode(JSON.stringify(msg) + "\n")).catch(() => { });
                    else
                        messageQueue.push(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        // next 3 all same adapter
        fn.webRtcDataChannelHostAdapter = (pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        }), label = "cse") => {
            const dc = pc.createDataChannel(label, { ordered: true });
            return this._adapters.dataChannelAdapter(dc);
        };
        fn.webRtcDataChannelClientAdapter = (pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        }), label = "cse") => {
            return new Promise((resolve) => {
                pc.ondatachannel = (e) => {
                    if (e.channel.label === label) {
                        resolve(this._adapters.dataChannelAdapter(e.channel));
                    }
                };
            });
        };
        fn.dataChannelAdapter = (dc) => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            const messageQueue = [];
            dc.onopen = () => {
                while (messageQueue.length > 0)
                    dc.send(JSON.stringify(messageQueue.shift()));
                connectHandler?.();
            };
            dc.onmessage = (e) => {
                try {
                    messageHandler?.(JSON.parse(String(e.data)));
                }
                catch { }
            };
            dc.onclose = () => disconnectHandler?.();
            dc.onerror = () => dc.close();
            return {
                send(msg) {
                    if (dc.readyState === "open")
                        dc.send(JSON.stringify(msg));
                    else
                        messageQueue.push(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.startWebTransportServer = async (options) => {
            const handlers = new Map();
            const server = new HTTP3Server().handle({
                error(error) {
                    console.error("[WebTransport]", error.code, error.message, error.details);
                },
                session(session) {
                    const handler = handlers.get(session.path);
                    if (!handler)
                        return false;
                    handler(session);
                },
                datagram(session, data) {
                    // Handle incoming datagrams if needed.
                },
                webTransportStream(stream) {
                    // Handle newly opened reliable streams.
                },
                webTransportData(stream, data) {
                    // Handle reliable incoming stream data.
                },
            });
            await server.start({
                address: options.host ?? "0.0.0.0",
                port: options.port ?? 4433,
                certificateFile: options.cert,
                privateKeyFile: options.privKey,
            });
            return {
                onPath(path, handler) {
                    handlers.set(path, handler);
                },
                async close() {
                    handlers.clear();
                    await server.stop();
                },
            };
        };
        //= new WebTransport('https://localhost:6459')
        fn.webTransportAdapter = (session) => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            let writer = null;
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            async function pump(readable) {
                const reader = readable.getReader();
                let buffer = "";
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done)
                            break;
                        buffer += decoder.decode(value, { stream: true });
                        let idx;
                        while ((idx = buffer.indexOf("\n")) >= 0) {
                            const line = buffer.slice(0, idx);
                            buffer = buffer.slice(idx + 1);
                            if (!line)
                                continue;
                            try {
                                messageHandler?.(JSON.parse(line));
                            }
                            catch { }
                        }
                    }
                }
                catch { }
            }
            async function acceptIncoming() {
                const reader = session.incomingBidirectionalStreams.getReader();
                try {
                    while (true) {
                        const { value: stream, done } = await reader.read();
                        if (done)
                            break;
                        pump(stream.readable);
                    }
                }
                catch { }
            }
            session.ready
                .then(async () => {
                connectHandler?.();
                const outgoing = await session.createBidirectionalStream();
                writer = outgoing.writable.getWriter();
                pump(outgoing.readable);
                acceptIncoming();
            })
                .catch(() => { });
            session.closed.then(() => disconnectHandler?.()).catch(() => disconnectHandler?.());
            return {
                send(msg) {
                    if (!writer)
                        return;
                    writer.write(encoder.encode(JSON.stringify(msg) + "\n")).catch(() => { });
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.webRTCAdapter = (options = {
            signalingAdapter: fn.ws_adapter("ws://localhost:6460"),
            peerId: "client-1",
        }) => {
            const { signalingAdapter, peerId, iceServers = [{ urls: "stun:stun.l.google.com:19302" }] } = options;
            const peers = new Map();
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            const outboundQueue = [];
            const createPeer = (remotePeerId, initiator) => {
                const pc = new RTCPeerConnection({ iceServers });
                const entry = { pc, r: null };
                peers.set(remotePeerId, entry);
                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        signalingAdapter.send({
                            id: `ice:${peerId}:${Date.now()}`,
                            r: "staff:webrtc:ice",
                            p: { from: peerId, to: remotePeerId, candidate: e.candidate },
                            ts: Date.now(),
                        });
                    }
                };
                pc.onconnectionstatechange = () => {
                    if (pc.connectionState === "connected") {
                        connectHandler?.();
                        while (outboundQueue.length > 0) {
                            const msg = outboundQueue.shift();
                            entry.r?.send(JSON.stringify(msg));
                        }
                    }
                    if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                        peers.delete(remotePeerId);
                        disconnectHandler?.();
                    }
                };
                const setupChannel = (r) => {
                    entry.r = r;
                    r.onmessage = (e) => {
                        try {
                            messageHandler?.(JSON.parse(e.data));
                        }
                        catch { }
                    };
                };
                if (initiator) {
                    const r = pc.createDataChannel("staff");
                    setupChannel(r);
                    pc.createOffer().then((offer) => {
                        pc.setLocalDescription(offer);
                        signalingAdapter.send({
                            id: `offer:${peerId}:${Date.now()}`,
                            r: "staff:webrtc:offer",
                            p: { from: peerId, to: remotePeerId, sdp: offer },
                            ts: Date.now(),
                        });
                    });
                }
                else {
                    pc.ondatachannel = (e) => setupChannel(e.r);
                }
                return pc;
            };
            signalingAdapter.onMessage((msg) => {
                const p = msg.p;
                if (!p?.to || p.to !== peerId)
                    return;
                if (msg.r === "staff:webrtc:offer") {
                    const pc = createPeer(p.from, false);
                    pc.setRemoteDescription(p.sdp).then(() => pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        signalingAdapter.send({
                            id: `answer:${peerId}:${Date.now()}`,
                            r: "staff:webrtc:answer",
                            p: { from: peerId, to: p.from, sdp: answer },
                            ts: Date.now(),
                        });
                    }));
                }
                if (msg.r === "staff:webrtc:answer") {
                    peers.get(p.from)?.pc.setRemoteDescription(p.sdp);
                }
                if (msg.r === "staff:webrtc:ice") {
                    peers.get(p.from)?.pc.addIceCandidate(p.candidate);
                }
                if (msg.r === "staff:webrtc:discover") {
                    if (!peers.has(p.from))
                        createPeer(p.from, false);
                }
            });
            signalingAdapter.send({
                id: `discover:${peerId}:${Date.now()}`,
                r: "staff:webrtc:discover",
                p: { from: peerId, to: "*" },
                ts: Date.now(),
            });
            return {
                send(msg) {
                    let sent = false;
                    for (const [, entry] of peers) {
                        if (entry.r?.readyState === "open") {
                            entry.r.send(JSON.stringify(msg));
                            sent = true;
                        }
                    }
                    if (!sent)
                        outboundQueue.push(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.sseAdapter = (source) => {
            // ── server side ──────────────────────────────────────────────
            if ("res" in source) {
                const { req, res } = source;
                let connectHandler = null;
                let disconnectHandler = null;
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                });
                req.on("close", () => disconnectHandler?.());
                setTimeout(() => connectHandler?.(), 0);
                return {
                    send(msg) {
                        res.write(`data: ${JSON.stringify(msg)}\n\n`);
                    },
                    // no upstream over SSE — never fires
                    onMessage() {
                        return () => { };
                    },
                    onConnect(h) {
                        connectHandler = h;
                    },
                    onDisconnect(h) {
                        disconnectHandler = h;
                    },
                };
            }
            // ── client side ──────────────────────────────────────────────
            const { url } = source;
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            const es = new EventSource(url);
            es.onopen = () => connectHandler?.();
            es.onmessage = (e) => {
                try {
                    messageHandler?.(JSON.parse(e.data));
                }
                catch { }
            };
            es.onerror = () => disconnectHandler?.();
            return {
                // no send over SSE — caller must use an upstream transport
                send() {
                    throw new Error("sse: downstream-only transport, cannot send");
                },
                onMessage(h) {
                    messageHandler = h;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(h) {
                    connectHandler = h;
                },
                onDisconnect(h) {
                    disconnectHandler = h;
                },
            };
        };
        fn.sharedArrayBufferAdapter = (buffer = new SharedArrayBuffer(64 * 1024), ownToken = "worker-1") => {
            const view = new Uint8Array(buffer);
            const ints = new Int32Array(buffer);
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            // Header layout: [0]=write cursor, [1]=read cursor, [2]=owner token hash,
            // [3]=frame length ; p begins at byte 16.
            const HEADER = 16;
            const data = view.subarray(HEADER);
            let readCursor = 0;
            function write(msg) {
                const encoded = new TextEncoder().encode(JSON.stringify(msg));
                if (encoded.length > data.length - 4)
                    return false; // too big
                const writeAt = (Int32Array.prototype[Symbol.iterator] ?? (() => []));
                const w = ints[0] % data.length;
                // Simulated write — record length, stamp token, copy bytes.
                ints[2] = hashToken(ownToken);
                ints[3] = encoded.length;
                data.set(encoded, 0);
                ints[0] = (w + encoded.length) % data.length;
                return true;
            }
            function read() {
                if (ints[3] === 0)
                    return null;
                const len = ints[3];
                ints[3] = 0;
                const raw = data.slice(0, len);
                try {
                    return JSON.parse(new TextDecoder().decode(raw));
                }
                catch {
                    return null;
                }
            }
            function hashToken(s) {
                let h = 0;
                for (let i = 0; i < s.length; i++)
                    h = (h * 31 + s.charCodeAt(i)) | 0;
                return h;
            }
            // Poll the ring — SharedArrayBuffer has no event push, so we poll with a
            // short interval (only while the adapter is being listened to).
            let timer = null;
            function ensurePolling() {
                if (timer)
                    return;
                timer = setInterval(() => {
                    const m = read();
                    if (m && messageHandler)
                        messageHandler(m);
                }, 5);
            }
            queueMicrotask(() => connectHandler?.());
            return {
                send(msg) {
                    write(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    ensurePolling();
                    return () => {
                        messageHandler = null;
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                        }
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.sharedWorkerAdapter = (scriptUrl = this._adapters.sharedWorkerScript) => {
            /** const worker = ''// new SharedWorker(scriptUrl)
            const port = 6675//  worker.port
            let messageHandler: ((msg: SIG_BUS_Message) => void) | null = null
            let connectHandler: (() => void) | null = null

            port.onmessage = (e: A) => {
                if (e.data?.__cse_connect__) {
                    connectHandler?.()
                    return
                }
                try {
                    messageHandler?.(e.data as SIG_BUS_Message)
                } catch { }
            }

            port.start()
            port.postMessage({ __cse_connect__: true })

            return {
                send(msg) { port.postMessage(msg) },
                onMessage(handler) {
                    messageHandler = handler
                    return () => { messageHandler = null }
                },
                onConnect(handler) { connectHandler = handler },
                onDisconnect(_handler) { }
            } */
        };
        fn.sharedWorkerScript = `
	const ports = new Set();
	
	self.onconnect = (e) => {
		const port = e.ports[0];
		ports.add(port);
	
		port.onmessage = (event) => {
			if (event.data?.__cse_connect__) {
				port.postMessage({ __cse_connect__: true });
				return;
			}
			for (const p of ports) {
				if (p !== port) p.postMessage(event.data);
			}
			port.postMessage(event.data);
		};
	
		port.addEventListener('close', () => ports.delete(port));
		port.start();
	};
	`;
        fn.serviceWorkerAdapter = (scriptUrl = this._adapters.serviceWorkerScript, scope) => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            let registration = null;
            const init = async () => {
                if (!("serviceWorker" in navigator))
                    return;
                registration = await navigator.serviceWorker.register(scriptUrl, scope ? { scope } : undefined);
                navigator.serviceWorker.addEventListener("message", (e) => {
                    try {
                        messageHandler?.(e.data);
                    }
                    catch { }
                });
                navigator.serviceWorker.ready.then(() => connectHandler?.());
                registration.addEventListener("updatefound", () => {
                    disconnectHandler?.();
                });
            };
            init();
            return {
                send(msg) {
                    const sw = navigator.serviceWorker?.controller;
                    if (sw) {
                        sw.postMessage(msg);
                    }
                    else {
                        registration?.active?.postMessage(msg);
                    }
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.serviceWorkerScript = `
	self.addEventListener('install', () => self.skipWaiting());
	self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
	
	const queue = [];
	
	self.addEventListener('message', async (e) => {
		const msg = e.data;
		if (!msg?.r) return;
	
		const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
	
		if (clients.length === 0) {
			queue.push(msg);
			return;
		}
	
		for (const client of clients) {
			client.postMessage(msg);
		}
	});
	
	self.addEventListener('activate', async () => {
		const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
		while (queue.length > 0) {
			const msg = queue.shift();
			for (const client of clients) {
				client.postMessage(msg);
			}
		}
	});
	`;
        fn.postMessageAdapter = (target, targetOrigin) => {
            const messageHandlers = new Set();
            const connectHandlers = new Set();
            const disconnectHandlers = new Set();
            const listener = (event) => {
                if (event.origin !== targetOrigin)
                    return;
                const msg = event.data;
                if (!msg || typeof msg !== "object" || !("r" in msg))
                    return;
                messageHandlers.forEach((h) => h(msg));
            };
            window.addEventListener("message", listener);
            return {
                send: (msg) => target.postMessage(msg, targetOrigin),
                onMessage: (handler) => {
                    messageHandlers.add(handler);
                    return () => messageHandlers.delete(handler);
                },
                onConnect: (handler) => {
                    connectHandlers.add(handler);
                    handler();
                    return () => connectHandlers.delete(handler);
                },
                onDisconnect: (handler) => {
                    disconnectHandlers.add(handler);
                    return () => disconnectHandlers.delete(handler);
                },
            };
        };
        fn.startNamedPipeBroker = (pipeName) => {
            const pipePath = `\\\\.\\pipe\\${pipeName}`;
            const clients = new Set();
            const server = net.createServer((socket) => {
                let buffer = "";
                clients.add(socket);
                socket.on("data", (data) => {
                    buffer += data.toString();
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";
                    for (const line of lines) {
                        let msg;
                        try {
                            msg = JSON.parse(line);
                        }
                        catch {
                            continue;
                        }
                        for (const c of clients) {
                            if (c !== socket && !c.destroyed)
                                c.write(JSON.stringify(msg) + "\n");
                        }
                    }
                });
                socket.on("close", () => clients.delete(socket));
                socket.on("error", () => {
                    socket.destroy();
                    clients.delete(socket);
                });
            });
            server.listen(pipePath);
            return () => server.close();
        };
        fn.startMQTTBroker = (port = 6462) => {
            const broker = new Aedes();
            const server = net.createServer(broker.handle);
            server.listen(port);
            return () => {
                server.close();
                broker.close();
            };
        };
        fn.mqttAdapter = (brokerUrl = "mqtt://localhost:6464", topic = "staff") => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            const messageQueue = [];
            const client = mqtt.connect(brokerUrl);
            client.on("connect", () => {
                client.subscribe(topic);
                while (messageQueue.length > 0)
                    client.publish(topic, JSON.stringify(messageQueue.shift()));
                connectHandler?.();
            });
            client.on("message", (_topic, raw) => {
                try {
                    messageHandler?.(JSON.parse(raw.toString()));
                }
                catch { }
            });
            client.on("close", () => disconnectHandler?.());
            return {
                send(msg) {
                    if (client.connected) {
                        client.publish(topic, JSON.stringify(msg));
                    }
                    else {
                        messageQueue.push(msg);
                    }
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.messageChannelAdapter = (port1) => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            let connected = true;
            port1.onmessage = (e) => {
                try {
                    messageHandler?.(e.data);
                }
                catch { }
            };
            port1.onmessageerror = () => {
                connected = false;
                disconnectHandler?.();
            };
            port1.start();
            queueMicrotask(() => {
                if (connected)
                    connectHandler?.();
            });
            return {
                send(msg) {
                    if (connected)
                        port1.postMessage(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                    if (connected)
                        queueMicrotask(() => {
                            if (connected && connectHandler === handler)
                                handler();
                        });
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.messageChannel = () => {
            const { port1, port2 } = new MessageChannel();
            return {
                adapter: fn.messageChannelAdapter(port1),
                port: port2,
            };
        };
        fn.http2ClientAdapter = (url = "http://localhost:6461") => {
            let messageHandler = null;
            const ctl = new AbortController();
            async function listen() {
                try {
                    const res = await fetch(url, { signal: ctl.signal });
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done)
                            break;
                        buffer += decoder.decode(value, { stream: true });
                        let idx;
                        while ((idx = buffer.indexOf("\n")) >= 0) {
                            const line = buffer.slice(0, idx);
                            buffer = buffer.slice(idx + 1);
                            if (!line)
                                continue;
                            if (line.startsWith("data: ")) {
                                try {
                                    messageHandler?.(JSON.parse(line.slice(6)));
                                }
                                catch { }
                            }
                        }
                    }
                }
                catch { }
            }
            listen();
            return {
                send(msg) {
                    void fetch(url, { method: "POST", body: JSON.stringify(msg), signal: ctl.signal });
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    setTimeout(() => handler(), 0);
                },
                onDisconnect(handler) {
                    ctl.abort();
                    handler();
                },
            };
        };
        fn.http2ServerAdapter = (req, res) => {
            let messageHandler = null;
            res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
            req.on("data", (chunk) => {
                try {
                    messageHandler?.(JSON.parse(chunk.toString()));
                }
                catch { }
            });
            req.on("close", () => {
                /* client gone */
            });
            return {
                send(msg) {
                    res.write(`data: ${JSON.stringify(msg)}\n\n`);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    setTimeout(() => handler(), 0);
                },
                onDisconnect(handler) {
                    req.on("close", handler);
                },
            };
        };
        fn.httpAdapter = (baseUrl = "http://localhost:6458", intervalMs = 3000) => {
            let pollTimer = null;
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            let lastTs = Date.now();
            let online = true;
            const poll = async () => {
                try {
                    const res = await fetch(`${baseUrl}/staff/poll?since=${lastTs}`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    });
                    if (!res.ok)
                        throw new Error(`Poll failed: ${res.status}`);
                    const messages = await res.json();
                    if (!online) {
                        online = true;
                        connectHandler?.();
                    }
                    for (const msg of messages) {
                        lastTs = Math.max(lastTs, msg.ts + 1);
                        messageHandler?.(msg);
                    }
                }
                catch {
                    if (online) {
                        online = false;
                        disconnectHandler?.();
                    }
                }
            };
            pollTimer = setInterval(poll, intervalMs);
            poll();
            return {
                send(msg) {
                    fetch(`${baseUrl}/staff/send`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(msg),
                    }).catch(() => { });
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.electronIPCMainAdapter = (ipcMain, win) => {
            let messageHandler = null;
            let connectHandler = null;
            ipcMain.on("staff:msg", (_event, raw) => {
                try {
                    messageHandler?.(typeof raw === "string" ? JSON.parse(raw) : raw);
                }
                catch { }
            });
            win.webContents.once("did-finish-load", () => connectHandler?.());
            return {
                send(msg) {
                    win.webContents.send("staff:msg", msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) { },
            };
        };
        fn.electronIPCRendererAdapter = (ipcRenderer) => {
            let messageHandler = null;
            let connectHandler = null;
            ipcRenderer.on("staff:msg", (_event, raw) => {
                try {
                    messageHandler?.(typeof raw === "string" ? JSON.parse(raw) : raw);
                }
                catch { }
            });
            setTimeout(() => connectHandler?.(), 0);
            return {
                send(msg) {
                    ipcRenderer.send("staff:msg", msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) { },
            };
        };
        fn.nativeMessagingHostAdapter = () => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            process.nextTick(() => connectHandler?.());
            const readLoop = () => {
                const lenBuf = Buffer.alloc(4);
                const bytesRead = fs.readSync(0, lenBuf, 0, 4, null);
                if (bytesRead === 0) {
                    disconnectHandler?.();
                    return;
                }
                const len = lenBuf.readUInt32LE(0);
                const msgBuf = Buffer.alloc(len);
                fs.readSync(0, msgBuf, 0, len, null);
                try {
                    messageHandler?.(JSON.parse(msgBuf.toString()));
                }
                catch { }
                setImmediate(readLoop);
            };
            setImmediate(readLoop);
            return {
                send(msg) {
                    const json = JSON.stringify(msg);
                    const buf = Buffer.alloc(4 + Buffer.byteLength(json));
                    buf.writeUInt32LE(Buffer.byteLength(json), 0);
                    buf.write(json, 4);
                    fs.writeSync(1, buf);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.nativeMessagingBrowserAdapter = (port) => {
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            port.onMessage.addListener((msg) => {
                try {
                    messageHandler?.(msg);
                }
                catch { }
            });
            port.onDisconnect.addListener(() => disconnectHandler?.());
            setTimeout(() => connectHandler?.(), 0);
            return {
                send(msg) {
                    port.postMessage(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.childProcessAdapter = (proc = process) => {
            let messageHandler = null;
            let connectHandler = null;
            process.nextTick(() => connectHandler?.());
            proc.on("message", (raw) => {
                try {
                    messageHandler?.(JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)));
                }
                catch { }
            });
            return {
                send(msg) {
                    if (proc.send)
                        proc.send(JSON.stringify(msg));
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) { },
            };
        };
        fn.broadcastChannelAdapter2 = (channelName = "THE_WIZARD_CHANNEL") => {
            const r = new BroadcastChannel(channelName);
            let messageHandler = null;
            let connectHandler = null;
            let disconnectHandler = null;
            r.onmessage = (e) => {
                try {
                    messageHandler?.(e.data);
                }
                catch { }
            };
            // BroadcastChannel is synchronous-ish: it's usable immediately after
            // construction. Fire connect on next tick so handlers can attach.
            queueMicrotask(() => connectHandler?.());
            return {
                send(msg) {
                    r.postMessage(msg);
                },
                onMessage(handler) {
                    messageHandler = handler;
                    return () => {
                        messageHandler = null;
                    };
                },
                onConnect(handler) {
                    connectHandler = handler;
                },
                onDisconnect(handler) {
                    disconnectHandler = handler;
                },
            };
        };
        fn.broadcastChannelAdapter = (name = "THE_WIZARD") => {
            const bc = new BroadcastChannel(name);
            let _handler = null;
            bc.onmessage = (e) => _handler?.(e.data);
            return {
                send: (msg) => bc.postMessage(msg),
                onMessage: (h) => {
                    _handler = h;
                    return () => {
                        _handler = null;
                    };
                },
                onConnect: (h) => h(),
                onDisconnect: () => { },
            };
        };
        return fn;
    })();
}
