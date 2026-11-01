export class SAURONS_EYE {
    ssr;
    constructor(ssr = null) {
        this.ssr = ssr;
    }
    pending = new Map();
    streams = new Map();
    u = undefined;
    uuuu = [this.u, this.u, this.u, this.u];
    UUUU = () => {
        return [this.ssr.s, this.ssr.m, this.ssr.r];
    };
    uuu = [this.u, this.u, this.u];
    UUU = () => {
        return [this.ssr.s, this.ssr.m, this.ssr.r];
    };
    uu = [this.u, this.u];
    UU = () => {
        return [this.ssr.m, this.ssr.r];
    };
    online = false;
    _auth_initialized = false;
    RTRN_TO_SDR = '_RETURN_TO_SENDER';
    hc_disptacher = '__DISPATCH_ENGINE__';
    hc_sl_reg = '__THE_PARTICLE_SMASHER__';
    WARLOCKS_NECROMANCY_OBSERVATORY_CH = 'WARLOCKS_NECROMANCY_OBSERVATORY';
    GRIMOIRE_OF_VALUES_CH = 'GRIMOIRE_OF_VALUES';
    QUEUE_KEY = 'staff:sends:offline:queue';
    defaultPriority = "normal";
    throttling = false;
    seen = new Set();
    MODULE_CACHE = new Map();
    messageCount = new Map();
    history = new Map();
    globalMiddleware = {
        beforeSend: [],
        afterSend: [],
        beforeReceive: [],
        afterReceive: [],
        onError: [],
    };
    //  public messageCount = new Map<string, number>()
    get opts() {
        return { s: this.ssr.s, m: this.ssr.m, r: this.ssr.r };
    }
    getKeyed(k = this.ssr.k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._map(s, m, r).get(k);
    }
    keyedMeta(k = this.ssr.k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._meta(s, m, r).get(k);
    }
    keyedChannels(k = this.ssr.k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._channels(s, m, r).channels.get(k);
    }
    channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._channels(s, m, r).channels;
    }
    sub_channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._channels(s, m, r).sub_channels;
    }
    trip_channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._channels(s, m, r).trip_channels;
    }
    quad_channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._channels(s, m, r).quad_channels;
    }
    getChannelSubs = (r = this.ssr.r) => this.channels().get(r) ?? new Set();
    getSubChannelSubs = (m = this.ssr.m, r = this.ssr.r) => {
        const subs = this.sub_channels().get(m);
        return subs?.get(r) ?? new Set();
    };
    getTripChannelSubs = (s = this.ssr.s, m = this.ssr.m) => {
        const subs = this.trip_channels().get(s);
        return subs?.get(m) ?? new Set();
    };
    getQuadChannelSubs = (k, s = this.ssr.s) => {
        const subs = this.quad_channels().get(k);
        return subs?.get(s) ?? new Set();
    };
    getAllChannelSubs = (r = this.ssr.r) => {
        const out = new Set();
        for (const h of this.getChannelSubs(r))
            out.add(h);
        return out;
    };
    getAllSubChannelSubs = (m = this.ssr.m, r = this.ssr.r) => {
        const out = new Set();
        for (const h of this.getSubChannelSubs(m, r))
            out.add(h);
        for (const h of this.getChannelSubs(r))
            out.add(h);
        return out;
    };
    getAllTripChannelSubs = (s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) => {
        const out = new Set();
        for (const h of this.getTripChannelSubs(s, m))
            out.add(h);
        for (const h of this.getSubChannelSubs(m, r))
            out.add(h);
        for (const h of this.getChannelSubs(r))
            out.add(h);
        return out;
    };
    getAllQuadChannelSubs = (k = this.ssr.k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) => {
        const out = new Set();
        for (const h of this.getQuadChannelSubs(k, s))
            out.add(h);
        for (const h of this.getTripChannelSubs(s, m))
            out.add(h);
        for (const h of this.getSubChannelSubs(m, r))
            out.add(h);
        for (const h of this.getChannelSubs(r))
            out.add(h);
        return out;
    };
    getExactSubs = (k = this.ssr.k, s = this.ssr.s) => this.quad_channels().get(k)?.get(s) ?? new Set();
    _groups(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).groups;
    }
    _queue(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).queue;
    }
    _deadLetters(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).deadLetters;
    }
    _wildcardSubscriptions(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).wildcardSubscriptions;
    }
    _transforms(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).transforms;
    }
    _encryptionConfigs(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).encryptionConfigs;
    }
    _compressionConfigs(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).compressionConfigs;
    }
    _durableOffsets(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).durableOffsets;
    }
    _durableHistory(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).durableHistory;
    }
    _tagSubs(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).tagSubs;
    }
    _tagsByChannel(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).tagsByChannel;
    }
    _routeRules(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).routeRules;
    }
    _messageCount(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).messageCount;
    }
    _middleware(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).middleware;
    }
    _schemas(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).schemas;
    }
    _permissions(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).permissions;
    }
    _backpressure(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._msgQState(s, m, r).backpressure;
    }
    _http(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._adapters(s, m, r).metaMap.http;
    }
    _cross_boundary(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._adapters(s, m, r).metaMap.cross_boundary;
    }
    _same_boundary(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._adapters(s, m, r).metaMap.same_boundary;
    }
    _adapterMetrics(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        return this.ssr._adapters(s, m, r).adapterMetrics;
    }
    priorityWeight(p) {
        if (p === "high")
            return 3;
        if (p === "low")
            return 1;
        return 2;
    }
    listenerCount(event, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        const _listeners = this.ssr._map(s, m, r);
        const set = _listeners.get(event);
        return set ? set.size : 0;
    }
    eventNames(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
        const names = [];
        // QUAD_CHANNEL: k → s → handlers — the user-facing keys
        for (const [k, bySl] of this.quad_channels()) {
            if (s && !bySl.has(s))
                continue;
            names.push(k);
        }
        // Fall back to CHANNEL-level keys (r) if quad map is empty for this scope
        if (names.length === 0) {
            for (const [r, set] of this.channels()) {
                if (r && r !== r)
                    continue;
                if (set.size > 0)
                    names.push(r);
            }
        }
        return names;
    }
    _serialExecutor = class {
        chain = Promise.resolve();
        enqueue(fn) {
            const run = this.chain.then(fn);
            this.chain = run.then(() => undefined, () => undefined);
            return run;
        }
        get idle() {
            return this.chain;
        }
    };
    executor() {
        return new this._serialExecutor();
    }
    handlers = {
        getExact: (q, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) => {
            const handlers = this.quad_channels(s, m, r).get(q);
            return handlers;
        },
        matching: (k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) => {
            // 1. handlers whose CHANNEL matches
            const byChannel = new Set();
            for (const [ch, set] of this.channels()) {
                if (this.handlers.matchesPattern(ch, r))
                    for (const h of set)
                        byChannel.add(h);
            }
            // 2. handlers whose CHANNEL and SUB match
            const bySub = new Set();
            for (const [sub, chMap] of this.sub_channels()) {
                if (!this.handlers.matchesPattern(sub, m))
                    continue;
                for (const [ch, set] of chMap) {
                    if (!this.handlers.matchesPattern(ch, r))
                        continue;
                    for (const h of set)
                        bySub.add(h);
                }
            }
            // 3. handlers whose SUB and TRIP match
            const byTrip = new Set();
            for (const [trip, subMap] of this.trip_channels()) {
                if (!this.handlers.matchesPattern(trip, s))
                    continue;
                for (const [sub, set] of subMap) {
                    if (!this.handlers.matchesPattern(sub, m))
                        continue;
                    for (const h of set)
                        byTrip.add(h);
                }
            }
            // 4. handlers whose TRIP and QUAD match
            const byQuad = new Set();
            for (const [quad, tripMap] of this.quad_channels()) {
                if (!this.handlers.matchesPattern(quad, k))
                    continue;
                for (const [trip, set] of tripMap) {
                    if (!this.handlers.matchesPattern(trip, s))
                        continue;
                    for (const h of set)
                        byQuad.add(h);
                }
            }
            // A handler matches only if it is in ALL four candidate sets.
            const out = [];
            for (const h of byChannel) {
                if (bySub.has(h) && byTrip.has(h) && byQuad.has(h))
                    out.push(h);
            }
            return out;
        },
        list: (k, s, m, r) => {
            if (r) {
                const handlers = this.ssr._map(s ?? this.ssr.s, m ?? this.ssr.m, r);
                const set = handlers.get(k ?? this.ssr.k);
                return [{ r, count: set?.size ?? 0 }];
            }
            // no r given — enumerate via the accessor across the current scope
            const out = [];
            for (const [ch] of this.ssr._map(this.ssr.s, this.ssr.m, this.ssr.r)) {
                const set = this.ssr._map(this.ssr.s, this.ssr.m, ch).get(this.ssr.k);
                out.push({ r: ch, count: set?.size ?? 0 });
            }
            return out;
        },
        invoke: async (msg) => {
            const handlers = this.handlers.matching(msg.k ? msg.k : "[NO_ADP_FOUND]", msg.s, msg.m, msg.r);
            if (handlers.length === 0)
                return { success: false };
            console.log(handlers, "emitter.invokeHandlers.handlers");
            // transforms (incoming)
            //  msg = await this.applyTransforms(msg, 'incoming')
            const results = await Promise.all(handlers.map((h) => Promise.resolve(h(msg.p)).catch(() => ({ success: false }))));
            console.log(results, "emitter.invokeHandlers.results");
            if (results.length === 1)
                return results[0];
            const merged = {};
            const collisions = [];
            for (const result of results) {
                if (result === undefined || result === null)
                    continue;
                if (typeof result !== "object") {
                    merged["value"] = result;
                    continue;
                }
                const r = result;
                for (const [key, value] of Object.entries(r)) {
                    if (key in merged)
                        collisions.push({ key, r: msg.r });
                    merged[key] = value;
                }
            }
            if (collisions.length > 0) {
                merged._cse_collisions = collisions;
            }
            console.log(merged, "emitter.invokeHandlers.merged");
            return Object.keys(merged).length === 0 ? { success: true } : merged;
        },
        matchesPattern: (pattern, r) => {
            if (pattern === "*")
                return true;
            if (pattern === r)
                return true;
            const regex = new RegExp("^" + pattern.replace(/\*/g, "[^:]+(?::[^:]+)*") + "$");
            return regex.test(r);
        },
    };
    schemas = {
        getAll: () => {
            return Object.fromEntries(this.ssr._msgQState().schemas);
        },
    };
    groups = {
        create: (name, channels = [], options) => {
            this._groups().set(name, {
                channels: new Set(channels),
                enabled: options?.enabled ?? true,
                middleware: options?.middleware ? [options.middleware] : [],
            });
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[HOOK_SYSTEM][SIGNALS][GROUPS][CREATE]`, { msg: "group_created", name }, t.error);
        },
        delete: (name) => {
            this._groups().delete(name);
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[HOOK_SYSTEM][SIGNALS][GROUPS][DELETE]`, { msg: "group_deleted", name }, t.error);
        },
        enable: (name) => {
            const g = this._groups().get(name);
            if (!g)
                return;
            g.enabled = true;
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[HOOK_SYSTEM][SIGNALS][GROUPS][ENABLE]`, { msg: "group_enabled", name }, t.error);
        },
        disable: (name) => {
            const g = this._groups().get(name);
            if (!g)
                return;
            g.enabled = false;
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[HOOK_SYSTEM][SIGNALS][GROUPS][DISABLE]`, { msg: "group_disabled", name }, t.error);
        },
        addTo: (name, r) => {
            const g = this._groups().get(name);
            if (!g)
                return;
            g.channels.add(r);
        },
        removeFrom: (name, r) => {
            const g = this._groups().get(name);
            if (!g)
                return;
            g.channels.delete(r);
        },
        use: (name, fn) => {
            const g = this._groups().get(name);
            if (!g)
                return;
            g.middleware.push(fn);
        },
        getAll: () => {
            const out = {};
            for (const [name, g] of this._groups()) {
                out[name] = { channels: [...g.channels], enabled: g.enabled, middlewareCount: g.middleware.length };
            }
            return out;
        },
    };
    transforms = {
        add: (channelPattern, transform) => {
            const list = this._transforms().get(channelPattern) ?? [];
            list.push(transform);
            this._transforms().set(channelPattern, list);
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[✘][HOOK_SYSTEM][CHECK_DYNAMIC]`, {
                    channelPattern,
                    msg: "transform_added",
                }, t.error); //this.emitDevtoolsEvent('transform_added', channelPattern)
        },
        getAll: () => {
            return Object.fromEntries(this._transforms());
        },
        apply: async (msg, dir) => {
            for (const [pattern, list] of this._transforms().entries()) {
                if (!this.handlers.matchesPattern(pattern, msg.r))
                    continue;
                for (const t of list) {
                    const fn = dir === "incoming" ? t.incoming : t.outgoing;
                    if (!fn)
                        continue;
                    msg = await Promise.resolve(fn(msg));
                }
            }
            return msg;
        },
        remove: (channelPattern) => {
            this._transforms().delete(channelPattern);
        },
    };
    encryption = {
        getConfigs: () => {
            return [...this._encryptionConfigs()];
        },
        configure: (config) => {
            this._encryptionConfigs().push(config);
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[SIGNALS][ENCRYPTION][CONFIGURE]`, { msg: "encryption_configured", config }, t.deep);
        },
        unwrap: async (msg) => {
            if (!msg?.sessionId || !msg?.token)
                return null;
            const expected = this.encryption.computeHmacSha256(this.ssr._cse_token, msg.sessionId);
            if (msg.token !== expected)
                return null;
            return msg.p;
        },
        wrap: (p) => {
            return {
                sessionId: this.ssr._sessionId,
                token: this.ssr._sessionToken,
                p,
            };
        },
        init: async () => {
            // no dotenv import — read the env directly
            const sk = (typeof process !== "undefined" && process.env?.ENC_TOKEN) || undefined;
            if (sk && sk.length >= 5) {
                // seed the session once, then derive a stable token from it
                this.ssr._cse_token = sk;
                this.ssr._sessionId = this.ssr.crypto.to_hex(this.ssr.crypto.random_bytes(16));
                // computeHmacSha256 is sync-hex on Node; if only WebCrypto is available
                // the async path fills _hmacCache and the sync read picks it up next tick.
                this.ssr._sessionToken = this.encryption.computeHmacSha256(this.ssr._cse_token, this.ssr._sessionId);
                this.ssr._init_sessionToken = !!this.ssr._sessionToken;
            }
            else {
                if (this.ssr.DEVTOOLS_ACTIVE)
                    log(`[SIGNALS][ENCRYPTION][CONFIGURE]`, { msg: "[!ENC_TOKEN - SIGNALS IS STILL AVAILABLE, IF YOU WOULD LIKE TO ADD A SECURITY LAYER THEN ADD ENC_TOKEN TO .ENV]" }, t.deep);
                this._auth_initialized = false;
            }
        },
        computeHmacSha256: (secret, data) => {
            if (!this.ssr.crypto.ready())
                return "";
            // try the sync path first (Node); catch the "no Node crypto" throw
            let syncResult = "";
            try {
                syncResult = this.ssr.crypto.hash_hmac_hex(secret, data);
            }
            catch {
                syncResult = "";
            }
            if (syncResult)
                return syncResult;
            // WebCrypto-only: fire async, cache, return "" this tick.
            // cache key must match whatever the sync path will look up next tick.
            const cacheKey = this.ssr.crypto.to_hex(this.ssr.crypto.to_utf8_bytes(secret)) + ":" +
                this.ssr.crypto.to_hex(this.ssr.crypto.to_utf8_bytes(data));
            this.ssr.crypto.hash_hmac_hex_async(secret, data).then((hex) => {
                this.ssr.crypto._hmacCache.set(cacheKey, hex);
            });
            return "";
        },
    };
    compression = {
        getConfigs: () => {
            return [...this._compressionConfigs()];
        },
        configure: (config) => {
            this._compressionConfigs().push(config);
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[SIGNALS][COMPRESSION][CONFIGURE]`, { msg: "compression_configured", config }, t.deep);
        },
    };
    checkpoints = {
        getAll: () => {
            return Object.fromEntries(this._durableOffsets());
        },
    };
    durable = {
        getHistorySizes: () => {
            const out = {};
            for (const [ch, hist] of this._durableHistory())
                out[ch] = hist.length;
            return out;
        },
    };
    tags = {
        sub: (tag, handler) => {
            const set = this._tagSubs().get(tag) ?? new Set();
            set.add(handler);
            this._tagSubs().set(tag, set);
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[SIGNALS][TAGS][SUB]`, { msg: "tag_subscribed", tag }, t.deep);
            return () => set.delete(handler);
        },
        list: () => {
            return [...this._tagSubs().keys()];
        },
        listChannels: (tag) => {
            const out = [];
            for (const [ch, tags] of this._tagsByChannel().entries()) {
                if (tags.has(tag))
                    out.push(ch);
            }
            return out;
        },
    };
    routes = {
        addRule: (rule) => {
            this._routeRules().push(rule);
            if (this.ssr.DEVTOOLS_ACTIVE)
                log(`[SIGNALS][ROUTES][ADD_RULE]`, { msg: "route_added", rule }, t.deep);
        },
        removeRule: (name) => {
            const state = this.ssr._msgQState();
            state.routeRules = state.routeRules.filter((r) => r.name !== name);
        },
        listRules: () => {
            return [...this._routeRules()];
        },
    };
    msgs = {
        getCount: (r) => {
            return this._messageCount().get(r) ?? 0;
        },
    };
    middleware = {
        list: () => {
            return [this._middleware().length];
        },
    };
    channels_ = {
        list: () => {
            return [...this.ssr._channels(this.ssr.s, this.ssr.m, this.ssr.r).keys()];
        },
        setSchema: (schema, r) => {
            this._schemas().set(r, schema);
        },
        setPermissions: (perms, r) => {
            this._permissions().set(r, perms);
        },
        getSchema: (r) => {
            return this._schemas().get(r) ?? null;
        },
        getPermissions: (r) => {
            return this._permissions().get(r) ?? null;
        },
    };
    defaultPriority_ = {
        set: (priority) => {
            this.defaultPriority = priority;
        },
        get: () => {
            return this.defaultPriority;
        },
    };
    traceCounter = 0;
    relayCounter = 0;
    closeHandlers = new Set();
    counters = {
        dataSent: 0,
        dataAcked: 0,
        dataRetransmitted: 0,
        nackSent: 0,
        nackReceived: 0,
        overflow: 0,
        dlq: 0,
        dropped: 0,
        errors: 0,
        streamsActive: 0,
        streamsCompleted: 0,
        relaySent: 0,
    };
    h = {
        //HELPERS
        WIRE_VERSION: 1,
        parseEnvelope: (raw) => {
            if (!raw || typeof raw !== "object")
                return null;
            const e = raw;
            if (e.v !== this.h.WIRE_VERSION || typeof e.sid !== "string" || typeof e.seq !== "number")
                return null;
            return e;
        },
        normCh: (v) => {
            return v.replace(/[\[\]]/g, "").trim();
        },
        fnv1a: (input) => {
            // FNV-1a 32-bit — isomorphic, deterministic, no crypto dependency.
            let h = 0x811c9dc5;
            for (let i = 0; i < input.length; i++) {
                h ^= input.charCodeAt(i);
                h = Math.imul(h, 0x01000193);
            }
            return (h >>> 0).toString(36);
        },
        streamId: (quad, trip, sub, ch, name = "stream") => {
            const base = [this.h.normCh(quad), this.h.normCh(trip), this.h.normCh(sub), this.h.normCh(ch)].join("|");
            const slug = name.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 20) || "s";
            return `sl_${this.h.fnv1a(`${base}|${name}`)}_${slug}`;
        },
        newEpoch: () => {
            return `${Date.now().toString(36)}-${this.h.fnv1a(Math.random().toString(36).slice(2))}`;
        },
        newTrace: () => {
            this.traceCounter = (this.traceCounter + 1) >>> 0;
            return `tr-${Date.now().toString(36)}-${this.traceCounter.toString(36)}-${this.h.fnv1a(Math.random().toString(36).slice(2))}`;
        },
        toBase64: (bytes) => {
            if (typeof Buffer !== "undefined")
                return Buffer.from(bytes).toString("base64");
            let s = "";
            for (let i = 0; i < bytes.length; i++)
                s += String.fromCharCode(bytes[i]);
            return btoa(s);
        },
        fromBase64: (b64) => {
            if (typeof Buffer !== "undefined")
                return new Uint8Array(Buffer.from(b64, "base64"));
            const bin = atob(b64);
            const out = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++)
                out[i] = bin.charCodeAt(i);
            return out;
        },
        encodePayload: (data, binary) => {
            if (!binary)
                return { enc: "json", data };
            const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
            return { enc: "base64", data: this.h.toBase64(bytes) };
        },
        decodePayload: (env, binary) => {
            if (binary && env.enc === "base64" && typeof env.data === "string")
                return this.h.fromBase64(env.data);
            return env.data;
        },
        sleep: (m) => new Promise((r) => setTimeout(r, m)),
        isFunc: (v) => {
            return typeof v === "function";
        },
        trackActive: (delta) => {
            this.counters.streamsActive = Math.max(0, this.counters.streamsActive + delta);
        },
        normalizeKey: (rawKey) => {
            return rawKey.trim().toLowerCase();
        },
    };
    BACK_END = (() => {
        const fn = () => { };
        fn.run = {
            beforeSend: async (msg) => {
                for (const fn of this.globalMiddleware.beforeSend) {
                    const r = await fn(msg);
                    if (r === false)
                        return false;
                }
                return true;
            },
            afterSend: async (msg, result) => {
                for (const fn of this.globalMiddleware.afterSend) {
                    await fn(msg, result);
                }
            },
            beforeReceive: async (msg) => {
                for (const fn of this.globalMiddleware.beforeReceive) {
                    const r = await fn(msg);
                    if (r === false)
                        return false;
                }
                return true;
            },
            afterReceive: async (msg, result) => {
                for (const fn of this.globalMiddleware.afterReceive) {
                    await fn(msg, result);
                }
            },
            onError: async (err, msg) => {
                for (const fn of this.globalMiddleware.onError) {
                    await fn(err, msg);
                }
                //  log(`[THE_WIZARD][STAFF][SEND_VIA_ADAPTER]`, {   msg: msg,  transport: `[${msg ? msg.boundary : 'undefined'}]`,  }, t.deep)//this.drop.t.error
            },
            middleware: (msg) => {
                for (const fn of this._middleware()) {
                    if (fn(msg) === false)
                        return false;
                }
                // group middleware
                for (const [, g] of this._groups()) {
                    if (!g.enabled)
                        continue;
                    if (![...g.channels].some((ch) => ssr.se.handlers.matchesPattern(ch, msg.r)))
                        continue;
                    for (const fn of g.middleware) {
                        if (fn(msg) === false)
                            return false;
                    }
                }
                return true;
            },
        };
        fn.clean_string = (r) => {
            return r.replace(/[\[\]]/g, "");
        };
        fn.getActiveStreams = () => {
            return [...this.streams.keys()];
        };
        return fn;
    })();
    async invokeHandler1s(msg) {
        const handlers = this.handlers.matching(msg.k ? msg.k : '[NO_ADP_FOUND]', msg.s, msg.m, msg.r);
        if (handlers.length === 0)
            return { success: false };
        // transforms (incoming)
        msg = await this.transforms.apply(msg, 'incoming');
        // if (this.DEVTOOLS_ACTIVE) this.emitDevtoolsEvent('transform_applied', msg.rt, msg.ms || undefined, msg.id, { direction: 'incoming' })
        const results = await Promise.all(handlers.map((h) => Promise.resolve(h(msg.p)).catch(() => ({ success: false }))));
        if (results.length === 1)
            return results[0];
        const merged = {};
        const collisions = [];
        for (const result of results) {
            if (result === undefined || result === null)
                continue;
            if (typeof result !== 'object') {
                merged['value'] = result;
                continue;
            }
            const r = result;
            for (const [key, value] of Object.entries(r)) {
                if (key in merged)
                    collisions.push({ key, rt: msg.r });
                merged[key] = value;
            }
        }
        if (collisions.length > 0) {
            merged._cse_collisions = collisions;
        }
        return Object.keys(merged).length === 0 ? { success: true } : merged;
    }
    // saving but should not be needed 
    matchingHandlers1() {
        /**k: string, s = this.s, m = this.m, r = this.r
         * : CSEHandler[]
        const byChannel = new Set<CSEHandler>();
        for (const [ch, set] of this.channels()) {
            if (this.matchesPattern(ch, r)) for (const h of set) byChannel.add(h);
        }

        // 2. handlers whose CHANNEL and SUB match
        const bySub = new Set<CSEHandler>();
        for (const [sub, chMap] of this.sub_channels()) {
            if (!this.matchesPattern(sub, m)) continue;
            for (const [ch, set] of chMap) {
                if (!this.matchesPattern(ch, r)) continue;
                for (const h of set) bySub.add(h);
            }
        }

        // 3. handlers whose SUB and TRIP match
        const byTrip = new Set<CSEHandler>();
        for (const [trip, subMap] of this.trip_channels()) {
            if (!this.matchesPattern(trip, s)) continue;
            for (const [sub, set] of subMap) {
                if (!this.matchesPattern(sub, m)) continue;
                for (const h of set) byTrip.add(h);
            }
        }

        // 4. handlers whose TRIP and QUAD match
        const byQuad = new Set<CSEHandler>();
        for (const [quad, tripMap] of this.quad_channels()) {
            if (!this.matchesPattern(quad, k)) continue;
            for (const [trip, set] of tripMap) {
                if (!this.matchesPattern(trip, s)) continue;
                for (const h of set) byQuad.add(h);
            }
        }

        // A handler matches only if it is in ALL four candidate sets.
        const out: CSEHandler[] = [];
        for (const h of byChannel) {
            if (bySub.has(h) && byTrip.has(h) && byQuad.has(h)) out.push(h);
        }
        return out; */
    }
}
