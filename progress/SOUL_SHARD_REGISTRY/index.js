export class SOUL_SHARD_REGISTRY {
    se;
    log = new ORC_SHOUT();
    crypto = new DISRUPTOR_CRYPTO();
    RIFTS_STORAGE_CONTAINER;
    S_CLASS_STORAGE_CONTAINER;
    k = "_THE_WIZARD_";
    s = "_SOUL_SHARD_REGISTRY_";
    c = "sauron";
    m;
    r;
    RTRN_TO_SDR = "_RETURN_TO_SENDER";
    hc_disptacher = "__DISPATCH_ENGINE__";
    hc_sl_reg = "__THE_PARTICLE_SMASHER__";
    cache_type;
    _cse_token;
    _init_sessionToken;
    _sessionToken;
    _sessionId;
    _auth_initialized = false;
    DEVTOOLS_ACTIVE = false;
    IS_THE_WIZARD = true;
    Bun = null;
    Deno = null;
    hasBun;
    hasDeno;
    hasNode;
    isBrowser = typeof window !== "undefined";
    isVSCode;
    isElectron;
    isUnix;
    isWindows;
    WS_KEY = USERS_CONFIG.WS_KEY;
    WS_ID = "";
    ready;
    constructor() {
        if (typeof globalThis.Deno !== "undefined") {
            this.Deno = globalThis.Deno;
        }
        if (typeof globalThis.Bun !== "undefined") {
            this.Bun = globalThis.Bun;
        }
        this.hasBun = typeof globalThis.Bun !== "undefined";
        this.hasDeno = typeof globalThis.Deno !== "undefined";
        this.hasNode = typeof process !== "undefined" && !!process.versions?.node;
        this.isVSCode = typeof process !== "undefined" && process.env.VSCODE_PID;
        this.isElectron = false;
        this.isUnix = false;
        this.isWindows = true;
        this.cache_type = USERS_CONFIG.CACHE_TYPE;
        this.ready = this.INIT();
        this.se = new SAURONS_EYE(this);
        this.m = "";
        this.r = USERS_CONFIG.APP_NAME;
        this.RIFTS_STORAGE_CONTAINER = new RIFTS_STORAGE_CONTAINER(this.k, this.s, this.c, this.m, this.r);
        this.S_CLASS_STORAGE_CONTAINER = new S_CLASS_STORAGE_CONTAINER(this.k, this.s, this.c, this.m, this.r);
    }
    ds(k) {
        return `${k}_SHARD_CACHE`;
    }
    MODULE_CACHE = new Map();
    _map(s = this.s, c = undefined, m = this.m, r = this.r) {
        /**let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
         // let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
         if (!root) {
             root = new Map<A, Map<A, Map<A, A>>>();
             (globalThis as A)[r] = root; // this.MODULE_CACHE.set(r, root);
         } */
        let ss = null;
        let cc = undefined;
        let mm = null;
        let rr = null;
        if (r !== undefined) {
            ss = s;
            cc = c;
            mm = m;
            rr = r;
        }
        else {
            ss = s;
            mm = c;
            rr = m;
        }
        let root;
        const cache_type = c !== undefined ? c : this.cache_type;
        switch (cache_type) {
            case "disruptor": {
                break;
            }
            case "sclass": {
                break;
            }
            case "rifts": {
                return r !== undefined ? root = this.RIFTS_STORAGE_CONTAINER._rifts(ss, cc, mm, rr) : root = this.RIFTS_STORAGE_CONTAINER._rifts(ss, mm, rr);
            }
            case "cookie": {
                break;
            }
            case "scookie": {
                break;
            }
            case "kvdb": {
                break;
            }
            case "rdb": {
                break;
            }
            case "tdb": {
                break;
            }
            case "gdb": {
                break;
            }
            case "idb": {
                break;
            }
            case "bdb": {
                break;
            }
            case "hpd": {
                break;
            }
            case "cache": {
                root = MODULE_CACHE;
                break;
            }
            case "sauron":
            default: {
                root = globalThis[rr];
                break;
            }
        }
        if (!root) {
            root = new Map();
            switch (this.cache_type) {
                case "disruptor": {
                    break;
                }
                case "cookie": {
                    break;
                }
                case "scookie": {
                    break;
                }
                case "kvdb": {
                    break;
                }
                case "rdb": {
                    break;
                }
                case "tdb": {
                    break;
                }
                case "gdb": {
                    break;
                }
                case "idb": {
                    break;
                }
                case "bdb": {
                    break;
                }
                case "hpd": {
                    break;
                }
                case "cache": {
                    MODULE_CACHE.clear();
                    MODULE_CACHE.set(rr, root);
                    break;
                }
                case "sauron":
                default: {
                    globalThis[rr] = root;
                    break;
                }
            }
        }
        let masterMap = root.get(mm);
        if (!masterMap) {
            masterMap = new Map();
            root.set(mm, masterMap);
        }
        if (c !== undefined) {
            // 3. Context Map Lookup
            let contextMap = masterMap.get(cc);
            if (!contextMap) {
                contextMap = new Map();
                masterMap.set(cc, contextMap);
            }
            // 4. Slave Map Lookup
            let slaveMap = contextMap.get(`${ss}_SAURON`);
            if (!slaveMap) {
                slaveMap = new Map();
                contextMap.set(`${ss}_SAURON`, slaveMap);
            }
            return slaveMap;
        }
        else {
            // 3. Slave Map Lookup
            let slaveMap = masterMap.get(`${ss}_SAURON`);
            if (!slaveMap) {
                slaveMap = new Map();
                masterMap.set(`${ss}_SAURON`, slaveMap);
            }
            return slaveMap;
        }
    }
    _sauron(s = this.s, m = this.m, r = this.r) {
        // 1. Root Lookup via Module Cache (Fast path)
        let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? globalThis[r] : null;
        //let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
        if (!root) {
            root = new Map();
            globalThis[r] = root; // this.MODULE_CACHE.set(r, root);
        }
        // 2. Master Map Lookup
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        // 3. Slave Map Lookup
        let slaveMap = masterMap.get(`${s}_SAURON`);
        if (!slaveMap) {
            slaveMap = new Map();
            masterMap.set(`${s}_SAURON`, slaveMap);
        }
        return slaveMap;
    }
    _s_class_rifts(s = this.s, m = this.m, r = this.r) {
        // 1. Root Lookup via Module Cache (Fast path)
        let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? globalThis[r] : null;
        //let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
        if (!root) {
            root = new Map();
            globalThis[r] = root; // this.MODULE_CACHE.set(r, root);
        }
        // 2. Master Map Lookup
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        // 3. Slave Map Lookup
        let slaveMap = masterMap.get(`${s}_S_CLASS_RIFTS`);
        if (!slaveMap) {
            slaveMap = new Map();
            masterMap.set(`${s}_S_CLASS_RIFTS`, slaveMap);
        }
        return slaveMap;
    }
    _cloud(s = this.s, m = this.m, r = this.r) {
        // 1. Root Lookup via Module Cache (Fast path)
        let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? globalThis[r] : null;
        //let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
        if (!root) {
            root = new Map();
            globalThis[r] = root; // this.MODULE_CACHE.set(r, root);
        }
        // 2. Master Map Lookup
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        // 3. Slave Map Lookup
        let slaveMap = masterMap.get(`${s}_CLOUD`);
        if (!slaveMap) {
            slaveMap = new Map();
            masterMap.set(`${s}_CLOUD`, slaveMap);
        }
        return slaveMap;
    }
    _drc(s = this.s, m = this.m, r = this.r) {
        // 1. Root Lookup via Module Cache (Fast path) 
        let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? globalThis[r] : this.MODULE_CACHE.get(r);
        ;
        //let root = this.MODULE_CACHE.get(r); //this. (globalThis as A)[r]; 
        if (!root) {
            root = new Map();
            globalThis[r] = root; // this.MODULE_CACHE.set(r, root);
        }
        // 2. Master Map Lookup
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        // 3. Slave Map Lookup
        let slaveMap = masterMap.get(`${s}_DRC`);
        if (!slaveMap) {
            slaveMap = new Map();
            masterMap.set(`${s}_DRC`, slaveMap);
        }
        return slaveMap;
    }
    _meta(s = this.s, m = this.m, r = this.r) {
        let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? globalThis[r] : null;
        //let root = (globalThis as A)[r];
        if (!root) {
            root = new Map();
            globalThis[r] = root;
        }
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        let metaMap = masterMap.get(`${s}_META`);
        if (!metaMap) {
            metaMap = {
                _sys: new Map(),
                _keyContracts: new Map(),
                _scopes: new Map(),
                _tupleCache: new Map(),
                _contracts: new Map(),
                _batches: new Set(),
                _batchQueue: new Map(),
                _batchOpts: new Map(),
                _globalListeners: new Set(),
                _global_subscribers: new Map(),
                _sealed: new Set(),
                _frozen: new Set(),
                _conflicts: new Map(),
                _conflictStrategies: new Map(),
                _causal: new Map(),
                _msgHandlers: new Map(),
                _lastWriteSource: new Map(),
                _mainMap: new Map(),
                _weakMap: new WeakMap(),
                _boundaries: new WeakMap(),
            };
            masterMap.set(`${s}_META`, metaMap);
        }
        return metaMap;
    }
    _mq(s = this.s, m = this.m, r = this.r) {
        // 1. Root Lookup via Module Cache (Fast path)
        let root = globalThis[r]; //USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
        //let root =  //this.MODULE_CACHE.get(r);
        if (!root) {
            root = new Map();
            globalThis[r] = root; // this.MODULE_CACHE.set(r, root);
        }
        // 2. Master Map Lookup
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        // 3. Slave Map Lookup
        let slaveMap = masterMap.get(`${s}_MQ`);
        if (!slaveMap) {
            slaveMap = new Map();
            masterMap.set(`${s}_MQ`, slaveMap);
        }
        return slaveMap;
    }
    _channels(s = this.s, m = this.m, r = this.r) {
        //let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
        let root = globalThis[r];
        if (!root) {
            root = new Map();
            globalThis[r] = root;
        }
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        let metaMap = masterMap.get(`${s}_CHANNELS`);
        if (!metaMap) {
            metaMap = {
                channels: new Map(),
                sub_channels: new Map(),
                trip_channels: new Map(),
                quad_channels: new Map(),
            };
            masterMap.set(`${s}_CHANNELS`, metaMap);
        }
        return metaMap;
    }
    _msgQState(s = this.s, m = this.m, r = this.r) {
        //let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
        let root = globalThis[r];
        if (!root) {
            root = new Map();
            globalThis[r] = root;
        }
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        let metaMap = masterMap.get(`${s}_MSG_Q_STATE`);
        if (!metaMap) {
            metaMap = {
                groups: new Map(), // string, { channels: Set<string>; enabled: boolean; middleware: ((msg: SIG_BUS_Message) => boolean | void)[] }
                schemas: new Map(), // string, SIG_BUS_Schema
                permissions: new Map(), // string, SIG_BUS_rtPermissions
                transforms: new Map(), // string, SIG_BUS_Transform[]
                tagSubs: new Map(), // string, Set<SIG_BUS_Handler>
                tagsByChannel: new Map(), // string, Set<string>
                durableHistory: new Map(), // string, SIG_BUS_Message[]
                durableOffsets: new Map(), // string, number
                deliveryHandlers: new Set(), // (info: { id: string; status: 'ack' | 'nak'; reason?: string }) => void
                middleware: [],
                routeRules: [],
                queue: [],
                deadLetters: [],
                encryptionConfigs: [],
                compressionConfigs: [],
                messageCount: new Map(), // string, number
                backpressure: {},
                wildcardSubscriptions: [],
            };
            masterMap.set(`${s}_MSG_Q_STATE`, metaMap);
        }
        return metaMap;
    }
    _adapters(s = this.s, m = this.m, r = this.r) {
        let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? globalThis[r] : null;
        //let root = (globalThis as A)[r];
        if (!root) {
            root = new Map();
            globalThis[r] = root;
        }
        let masterMap = root.get(m);
        if (!masterMap) {
            masterMap = new Map();
            root.set(m, masterMap);
        }
        let metaMap = masterMap.get(`${s}_ADAPTERS`);
        if (!metaMap) {
            metaMap = {
                same_boundary: null,
                cross_boundary: null,
                http: null,
                ws: null,
                reliableSocket: null,
                workerThreadAdapter: null,
                webTransportDatagramsAdapter: null,
                webTransportClientAdapter: null,
                webRtcDataChannelHostAdapter: null,
                webRtcDataChannelClientAdapter: null,
                dataChannelAdapter: null,
                startWebTransportServer: null,
                webTransportAdapter: null,
                webRTCAdapter: null,
                sseAdapter: null,
                sharedArrayBufferAdapter: null,
                sharedWorkerAdapter: null,
                serviceWorkerAdapter: null,
                postMessageAdapter: null,
                startNamedPipeBroker: null,
                startMQTTBroker: null,
                mqttAdapter: null,
                messageChannelAdapter: null,
                messageChannel: null,
                http2ClientAdapter: null,
                http2ServerAdapter: null,
                httpAdapter: null,
                electronIPCMainAdapter: null,
                electronIPCRendererAdapter: null,
                nativeMessagingHostAdapter: null,
                nativeMessagingBrowserAdapter: null,
                childProcessAdapter: null,
                broadcastChannelAdapter2: null,
                broadcastChannelAdapter: null,
                atom_adapter: null,
                adapterMetrics: new Map(),
            };
            masterMap.set(`${s}_ADAPTERS`, metaMap);
        }
        return metaMap;
    }
    maps = {
        root: (r = this.r) => {
            return globalThis[r];
        },
        master: (m = this.m, r = this.r) => {
            return this.maps.root(r)?.get(m);
        },
        slave: (s = this.s, m = this.m, r = this.r) => {
            return this.maps.master(m, r)?.get(s);
        },
    };
    wipe = {
        _map: (a, s = this.s) => {
            if (a === 6 + 6) {
                delete globalThis[`${s}_SHARD_CACHE`];
            }
        },
        _meta: (a, s = this.s) => {
            if (a === 6 + 6) {
                delete globalThis[`${s}_META`];
            }
        },
        _channels: (a, s = this.s) => {
            if (a === 6 + 6) {
                delete globalThis[`${s}_CHANNELS`];
            }
        },
        _msgQState: (a, s = this.s) => {
            if (a === 6 + 6) {
                delete globalThis[`${s}_MSG_Q_STATE`];
            }
        },
        _adapters: (a, s = this.s) => {
            if (a === 6 + 6) {
                delete globalThis[`${s}_ADAPTERS`];
            }
        },
    };
    _SS_MEMORY = new Map();
    async _withLock(key, fn) {
        if (typeof navigator !== "undefined" && navigator.locks) {
            return navigator.locks.request("ss_write_" + key, fn);
        }
        return fn();
    }
    getSS(key) {
        if (typeof window === "undefined")
            return;
        const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(key) : null;
        const v = this.crypto.deser(raw);
        return MaybePromise(v);
    }
    async setSS(key, value) {
        if (typeof window === "undefined")
            return;
        const serialized = this.crypto.ser(value);
        await this._withLock(key, () => {
            sessionStorage.setItem(key, serialized);
            this._SS_MEMORY.set(key, serialized);
        });
        return value;
    }
    generateId() {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            return arr[0].toString();
        }
        try {
            const { randomBytes } = require("crypto");
            return randomBytes(4).readUInt32BE(0).toString();
        }
        catch {
            return Math.floor(Math.random() * 0xffffffff).toString();
        }
    }
    async get_ws_id() {
        if (this.isBrowser) {
            let id = this.getSS(this.WS_KEY);
            if (!id) {
                id = this.generateId();
                this.setSS(this.WS_KEY, id);
            }
            this.WS_ID = id;
            return id;
        }
        if (this.isVSCode) {
            const vscode = require("vscode");
            const name = vscode.workspace.workspaceFolders?.[0]?.name;
            if (name)
                return name;
            const id = this.generateId();
            this.WS_ID = id;
            return id;
        }
        let cwd;
        if (this.hasBun || this.hasNode) {
            cwd = process.cwd();
        }
        else if (this.hasDeno) {
            cwd = this.Deno.cwd();
        }
        else {
            throw new Error("Unsupported environment");
        }
        let filePath;
        if (this.hasDeno) {
            const currentDir = new URL(".", import.meta.url).pathname;
            const projectRoot = new URL("../../../../../../", import.meta.url).pathname;
            filePath = new URL("the_wizard/wizards_vault/ws_id.txt", projectRoot).pathname;
        }
        else {
            const path = require("path");
            const currentDir = typeof import.meta?.dirname !== "undefined" ? import.meta.dirname : __dirname;
            const projectRoot = path.resolve(currentDir, "../../../../../../");
            filePath = path.join(projectRoot, "the_wizard", "wizards_vault", "ws_id.txt");
        }
        const readFile = async () => {
            try {
                if (this.hasBun) {
                    const file = Bun.file(filePath);
                    if (!(await file.exists()))
                        return null;
                    return await file.text();
                }
                else if (this.hasDeno) {
                    try {
                        await this.Deno.stat(filePath);
                        return await this.Deno.readTextFile(filePath);
                    }
                    catch {
                        return null;
                    }
                }
                else if (this.hasNode) {
                    const fs = require("fs");
                    if (!fs.existsSync(filePath))
                        return null;
                    return fs.readFileSync(filePath, "utf8");
                }
                return null;
            }
            catch {
                return null;
            }
        };
        const writeFile = async (data) => {
            if (this.hasBun) {
                await Bun.write(filePath, data);
            }
            else if (this.hasDeno) {
                await this.Deno.writeTextFile(filePath, data);
            }
            else if (this.hasNode) {
                const fs = require("fs");
                fs.writeFileSync(filePath, data, "utf8");
            }
        };
        let id = await readFile();
        if (id && !isNaN(Number(id))) {
            this.WS_ID = id;
            return id;
        }
        id = this.generateId();
        await writeFile(id);
        this.WS_ID = id;
        return id;
    }
    async INIT() {
        if (USERS_CONFIG.ENABLE_GLOBAL_WORKSPACE_CONTEXT === true) {
            this.m = await this.get_ws_id();
        }
        else {
            this.m = "__SAURON__";
        }
    }
}
