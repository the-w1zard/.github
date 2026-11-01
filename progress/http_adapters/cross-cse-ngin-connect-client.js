const port = 11777;
const ws = new WebSocket(`ws://localhost:${port}`);
const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
let rpcId = 0;
const routedHandlers = new Map();
const pending = new Map();
const subHandlers = new Map();
const sendQueue = [];
ws.onopen = () => {
    while (sendQueue.length) {
        ws.send(sendQueue.shift());
    }
    rpcCall("register", { clientId });
};
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data.toString());
    console.log("%c[SERVER → WEBVIEW] INBOUND", "color: #ff007f; font-weight: bold;", msg);
    if (msg.type === "rpc:res") {
        const entry = pending.get(msg.id);
        if (!entry) {
            console.warn(`[RPC WARNING] Received response for untracked RPC ID: ${msg.id}`);
            return;
        }
        pending.delete(msg.id);
        if (msg.ok) {
            entry.resolve(msg.result);
        }
        else {
            entry.reject(new Error(msg.error));
        }
        return;
    }
    if (msg.type === "rpc:chunk") {
        const entry = pending.get(msg.id);
        if (!entry)
            return;
        if (msg.chunk !== undefined) {
            entry.onChunk?.(msg.chunk);
        }
        if (msg.done) {
            pending.delete(msg.id);
            entry.resolve?.(undefined);
        }
        return;
    }
    if (msg.type === "cse:event") {
        subHandlers.get(msg.subId)?.(msg.p);
        return;
    }
    if (msg.type === "cse:routed") {
        const handlers = routedHandlers.get(msg.rt)?.get(msg.ms);
        if (handlers)
            handlers.forEach(h => h(msg.p));
        return;
    }
};
function channelRpc(method, rt, ms, extra) { return rpcCall(method, { rt, ms, ...extra }); }
function addHandler2(rt, ms, handler) {
    if (!routedHandlers.has(rt))
        routedHandlers.set(rt, new Map());
    const subMap = routedHandlers.get(rt);
    if (!subMap.has(ms))
        subMap.set(ms, new Set());
    subMap.get(ms).add(handler);
    return () => subMap.get(ms)?.delete(handler);
}
function addHandler(_label, rt, ms, extra) {
    const handler = extra.handler;
    if (!routedHandlers.has(rt))
        routedHandlers.set(rt, new Map());
    const subMap = routedHandlers.get(rt);
    if (!subMap.has(ms))
        subMap.set(ms, new Set());
    subMap.get(ms).add(handler);
    return () => subMap.get(ms)?.delete(handler);
}
function rpcCall(method, params) {
    const id = rpcId++;
    const fullPayload = {
        type: "rpc",
        id,
        clientId,
        method,
        ws: window.WEBVIEW_WORKSPACE_CONTEXT,
        workspace: window.WEBVIEW_WORKSPACE_CONTEXT,
        timestamp: Date.now(),
        ...params,
    };
    const p = JSON.stringify(fullPayload);
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(p);
        }
        else {
            console.warn("[WEBVIEW QUEUEING] Socket not ready. Queueing packet.");
            sendQueue.push(p);
        }
    });
}
function streamRpc(method, rt, ms, extra) { return rpcCall(method, { rt, ms, ...extra }); }
function rpcStreamCall(method, onChunk, params) {
    const id = rpcId++;
    const fullPayload = {
        type: "rpc",
        id,
        clientId,
        method,
        ws: window.WEBVIEW_WORKSPACE_CONTEXT,
        workspace: window.WEBVIEW_WORKSPACE_CONTEXT,
        timestamp: Date.now(),
        ...params,
    };
    const p = JSON.stringify(fullPayload);
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, onChunk });
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(p);
        }
        else {
            console.warn("[WEBVIEW QUEUEING] Socket not ready. Queueing packet.");
            sendQueue.push(p);
        }
    });
}
function anyRpc(method, rt, ms, initial) { return rpcCall(method, { rt, ms, initial }); }
export const staff = {
    sendsub: (rt, ms, p, ttl, binary = false) => channelRpc("sendsub", rt, ms, { p, ttl, binary }),
    multisub: (rt, ms, handler) => {
        const unsub = addHandler('multisub', rt, ms, { handler });
        channelRpc("multisub", rt, ms);
        return () => {
            unsub();
            channelRpc("unsub", rt, ms);
        };
    },
    // #region NORMAL FUNCTIONS
    gar: (rt, ms, p, ttl, binary = false) => rpcCall("gar", { rt, ms, p, ttl, binary }),
    reply: (replyChannel, ms, p) => rpcCall("reply", { replyChannel, ms, p }),
    on: (rt, ms, handler) => { return rpcCall("on", { rt, ms, handler }); },
    once: (rt, ms, handler) => { return rpcCall("once", { rt, ms, handler }); },
    scope: (prefix) => ({
        send: (rt, p, ttl, binary = false) => rpcCall("send", { rt: `${prefix}:${rt}`, p, ttl, binary }),
        sub: (rt, handler) => rpcCall("sub", { rt: `${prefix}:${rt}`, handler }),
        gar: (rt, p, ttl) => rpcCall("gar", { rt: `${prefix}:${rt}`, p, ttl }),
        use: (rt, fn) => rpcCall("use", { rt: `${prefix}:${rt}`, fn: fn.toString() }),
        live: (rt, initial) => { return rpcCall("live", { rt: `${prefix}:${rt}`, initial }); },
        scope: (subprefix) => rpcCall("scope", { prefix: `${prefix}:${subprefix}` })
    }),
    scoped: (workspaceName) => rpcCall("scoped", { workspaceName }),
    hasSubscription: (rt) => rpcCall("hasSubscription", { rt }),
    receive: (msg) => rpcCall("receive", { msg }),
    // #endregion
    // #region STREAMS
    stream: (rt, ms, p, onChunk) => rpcStreamCall("stream", onChunk, { rt, ms, p }),
    streamHandler: (rt, ms, handler, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
    streamChunk: (rt, ms, streamId, chunk, binary = false) => rpcCall("streamChunk", { rt, ms, streamId, chunk, binary }),
    streamDone: (rt, ms, streamId, binary = false) => rpcCall("streamDone", { rt, ms, streamId, binary }),
    cancelStream: (rt, ms, streamId, binary = false) => rpcCall("cancelStream", { rt, ms, streamId, binary }),
    duplex: (rt, ms, opts) => streamRpc("duplex", rt, ms, opts),
    duplexHandler: (rt, ms, opts) => streamRpc("duplexHandler", rt, ms, opts),
    useObservableState: (rt, ms, initial) => anyRpc("useObservableState", rt, ms, initial),
    useOptimisticState: (rt, ms, initial) => anyRpc("useOptimisticState", rt, ms, initial),
    live: (rt, ms, initial) => anyRpc("live", rt, ms, initial),
    useLive: (rt, ms, initial) => anyRpc("useLive", rt, ms, initial),
    stateLive: (rt, ms, initial) => anyRpc("stateLive", rt, ms, initial),
    useStateLive: (rt, ms, initial) => anyRpc("useStateLive", rt, ms, initial),
    useRefLive: (rt, ms, initial) => anyRpc("useRefLive", rt, ms, initial),
    useUmbrellaStateLive: (rt, ms, initial) => anyRpc("useUmbrellaStateLive", rt, ms, initial),
    useContextLive: (rt, ms, initial) => anyRpc("useContextLive", rt, ms, initial),
    liveStore: (rt, ms, initial) => anyRpc("liveStore", rt, ms, initial),
    useLiveStore: (rt, ms, initial) => anyRpc("useLiveStore", rt, ms, initial),
    // #endregion
    use: (rt, fn) => rpcCall("use", { rt, fn: fn.toString() }),
    useGlobal: (mw) => rpcCall("useGlobal", { mw }),
    send: (rt, p, ttl, binary = false) => rpcCall("send", { rt, p, ttl, binary }),
    sub: async (rt, handler) => {
        const subId = (await rpcCall("sub", { rt }));
        subHandlers.set(subId, handler);
        return () => {
            subHandlers.delete(subId);
            rpcCall("unsub", { subId });
        };
    },
    request: (rt, ms, p, binary = false) => rpcCall("request", { rt, ms, p, binary }),
    broadcast: (rt, p, ttl) => rpcCall("broadcast", { rt, p, ttl }),
    subWithHistory: async (rt, ms, handler, options) => {
        const subId = (await rpcCall("subWithHistory", { rt, ms, options }));
        subHandlers.set(subId, handler);
        return () => {
            subHandlers.delete(subId);
            rpcCall("unsub", { subId });
        };
    },
    batch: (messages, binary = false) => rpcCall("batch", { messages, binary }),
    createGroup: (name, channels = [], options) => rpcCall("createGroup", { name, channels, options }),
    deleteGroup: (name) => rpcCall("deleteGroup", { name }),
    addToGroup: (name, rt) => rpcCall("addToGroup", { name, rt }),
    removeFromGroup: (name, rt) => rpcCall("removeFromGroup", { name, rt }),
    enableGroup: (name) => rpcCall("enableGroup", { name }),
    disableGroup: (name) => rpcCall("disableGroup", { name }),
    groupBroadcast: (name, p, ttl) => rpcCall("groupBroadcast", { name, p, ttl }),
    subscribeByTag: async (tag, handler) => {
        const subId = (await rpcCall("subscribeByTag", { tag }));
        subHandlers.set(subId, handler);
        return () => {
            subHandlers.delete(subId);
            rpcCall("unsub", { subId });
        };
    },
    setDefaultPriority: (priority) => rpcCall("setDefaultPriority", { priority }),
    getDefaultPriority: () => rpcCall("getDefaultPriority"),
    ack: (messageId) => rpcCall("ack", { messageId }),
    nak: (messageId, reason) => rpcCall("nak", { messageId, reason }),
    onDeliveryReceipt: (handler) => rpcCall("onDeliveryReceipt", { handler }),
    listDeadLetters: (rt) => rpcCall("listDeadLetters", { rt }),
    requeueDeadLetter: (id, ttl) => rpcCall("requeueDeadLetter", { id, ttl }),
    subscribeDurable: async (rt, handler, options) => {
        const subId = (await rpcCall("subscribeDurable", { rt, options }));
        subHandlers.set(subId, handler);
        return () => {
            subHandlers.delete(subId);
            rpcCall("unsub", { subId });
        };
    },
    setCheckpoint: (rt, ms, subscriberId, offset) => rpcCall("setCheckpoint", { rt, ms, subscriberId, offset }),
    getCheckpoint: (rt, ms, subscriberId) => rpcCall("getCheckpoint", { rt, ms, subscriberId }),
    replay: async (options, handler) => {
        const subId = (await rpcCall("replay", { options }));
        subHandlers.set(subId, handler);
        return () => {
            subHandlers.delete(subId);
            rpcCall("unsub", { subId });
        };
    },
    groupUse: (name, fn) => rpcCall("groupUse", { name, fn: fn.toString() }),
    setBackpressureConfig: (config) => rpcCall("setBackpressureConfig", { config }),
    setChannelSchema: (rt, schema) => rpcCall("setChannelSchema", { rt, schema }),
    getChannelSchema: (rt) => rpcCall("getChannelSchema", { rt }),
    setChannelPermissions: (rt, perms) => rpcCall("setChannelPermissions", { rt, perms }),
    getChannelPermissions: (rt) => rpcCall("getChannelPermissions", { rt }),
    addRouteRule: (rule) => rpcCall("addRouteRule", { rule }),
    removeRouteRule: (name) => rpcCall("removeRouteRule", { name }),
    listRouteRules: () => rpcCall("listRouteRules"),
    addTransform: (channelPattern, transform) => rpcCall("addTransform", { channelPattern, transform }),
    removeTransform: (channelPattern) => rpcCall("removeTransform", { channelPattern }),
    configureEncryption: (config) => rpcCall("configureEncryption", { config }),
    configureCompression: (config) => rpcCall("configureCompression", { config }),
    listTags: () => rpcCall("listTags"),
    listChannelsByTag: (tag) => rpcCall("listChannelsByTag", { tag }),
    listChannels: () => rpcCall("listChannels"),
    getChannelInfo: (rt) => rpcCall("getChannelInfo", { rt }),
    listHandlers: (rt) => rpcCall("listHandlers", { rt }),
    listAdapters: () => rpcCall("listAdapters"),
    listMiddleware: () => rpcCall("listMiddleware"),
    getMessageCount: (rt) => rpcCall("getMessageCount", { rt }),
    getAdapterMetrics: () => rpcCall("getAdapterMetrics"),
    disableAdapter: (id) => rpcCall("disableAdapter", { id }),
    enableAdapter: (id) => rpcCall("enableAdapter", { id }),
    session: () => rpcCall("session"),
    useSession: () => rpcCall("useSession"),
    secrets: () => rpcCall("secrets"),
    useSecrets: () => rpcCall("useSecrets"),
    worker: (queueChannel, ms, handler, options = {}) => rpcCall("worker", { queueChannel, ms, handler, options }),
    enqueueJob: (queueChannel, ms, p, timeoutMs = 30000) => rpcCall("enqueueJob", { queueChannel, ms, p, timeoutMs }),
    crdt: (rt, ms, initial) => rpcCall("crdt", { rt, ms, initial }),
    useCrdt: (rt, ms, initial) => rpcCall("useCrdt", { rt, ms, initial }),
    notifications: (topic = 'global', ms) => rpcCall("notifications", { topic, ms }),
    useNotifications: (topic = 'global', ms) => rpcCall("useNotifications", { topic, ms }),
    config: (namespace, ms, defaultConfig) => rpcCall("config", { namespace, ms, defaultConfig }),
    useConfig: (namespace, ms, defaultConfig) => rpcCall("useConfig", { namespace, ms, defaultConfig }),
    useFeatureFlag: (flag, ms, defaultValue = false) => rpcCall("useFeatureFlag", { flag, ms, defaultValue }),
    lock: (rt, ms, resourceId, ttl = 30000) => rpcCall("lock", { rt, ms, resourceId, ttl }),
    mapReduce: (rt, ms, mapper, reducer, initial, timeoutMs = 5000) => rpcCall("mapReduce", { rt, ms, mapper: mapper.toString(), reducer: reducer.toString(), initial, timeoutMs }),
    rateLimit: (rt, ms, key, maxRequests, windowMs) => rpcCall("rateLimit", { rt, ms, key, maxRequests, windowMs }),
    appendOnlyLog: (rt, ms, options) => rpcCall("appendOnlyLog", { rt, ms, options }),
    circuitBreaker: (rt, ms, operation, options) => rpcCall("circuitBreaker", { rt, ms, operation: operation.toString(), options }),
    transaction: (rt, ms, operations) => rpcCall("transaction", { rt, ms, operations: { prepare: operations.prepare.toString(), commit: operations.commit.toString(), rollback: operations.rollback.toString() } }),
    autoFederate: (rt, ms, options = {}) => rpcCall("autoFederate", { rt, ms, options }),
    visualFlow: (rt, ms, nodes) => rpcCall("visualFlow", { rt, ms, nodes: nodes.map(n => ({ ...n, transform: n.transform.toString() })) }),
};
/**
 syncStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void, binary = false) => rpcStreamCall("stream", onChunk, { rt, ms, p, binary }),
  syncStreamHandler: (rt: string, ms: string, handler: (d: any) => any, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
  streamRelay: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("streamRelay", onChunk, { rt, ms, p }),
  openSyncStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("openSyncStream", onChunk, { rt, ms, p }),
  openSyncStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("openSyncStreamHandler", rt, ms, { handler }),
  priorityStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("priorityStream", onChunk, { rt, ms, p }),
  priorityStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("priorityStreamHandler", rt, ms, { handler }),
  duplexStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("duplexStream", onChunk, { rt, ms, p }),
  duplexStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("duplexStreamHandler", rt, ms, { handler }),
  transactionalStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("transactionalStream", onChunk, { rt, ms, p }),
  transactionalStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("transactionalStreamHandler", rt, ms, { handler }),
  deltaStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("deltaStream", onChunk, { rt, ms, p }),
  deltaStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("deltaStreamHandler", rt, ms, { handler }),
  presenceStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("presenceStream", onChunk, { rt, ms, p }),
  presenceStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("presenceStreamHandler", rt, ms, { handler }),
  authorityStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("authorityStream", onChunk, { rt, ms, p }),
  authorityStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("authorityStreamHandler", rt, ms, { handler }),
  compressionStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("compressionStream", onChunk, { rt, ms, p }),
  compressionStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("compressionStreamHandler", rt, ms, { handler }),
  heatbeatStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("heatbeatStream", onChunk, { rt, ms, p }),
  heatbeatStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("heatbeatStreamHandler", rt, ms, handler),
  backPressureStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("backPressureStream", onChunk, { rt, ms, p }),
  backPressureStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("backPressureStreamHandler", rt, ms, { handler }),
  statefulStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("statefulStream", onChunk, { rt, ms, p }),
  statefulStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("statefulStreamHandler", rt, ms, { handler }),
  multicastStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("multicastStream", onChunk, { rt, ms, p }),
  multicastStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("multicastStreamHandler", rt, ms, { handler }),
  partitionedStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("partitionedStream", onChunk, { rt, ms, p }),
  partitionedStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("partitionedStreamHandler", rt, ms, { handler }),
  batchStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("batchStream", onChunk, { rt, ms, p }),
  batchStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("batchStreamHandler", rt, ms, { handler }),
  filteredStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("filteredStream", onChunk, { rt, ms, p }),
  filteredStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("filteredStreamHandler", rt, ms, { handler }),
  deadLetterStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("deadLetterStream", onChunk, { rt, ms, p }),
  deadLetterStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("deadLetterStreamHandler", rt, ms, { handler }),
  idempotentStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("idempotentStream", onChunk, { rt, ms, p }),
  idempotentStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("idempotentStreamHandler", rt, ms, { handler }),
  lateArrivalStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("lateArrivalStream", onChunk, { rt, ms, p }),
  lateArrivalStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("lateArrivalStreamHandler", rt, ms, { handler }),
  checkpointStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("checkpointStream", onChunk, { rt, ms, p }),
  checkpointStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("checkpointStreamHandler", rt, ms, { handler }),
  rateLimitedStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("rateLimitedStream", onChunk, { rt, ms, p }),
  rateLimitedStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("rateLimitedStreamHandler", rt, ms, { handler }),
  comboStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("comboStream", onChunk, { rt, ms, p }),
  comboStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("comboStreamHandler", rt, ms, { handler }),
  transformStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("transformStream", onChunk, { rt, ms, p }),
  transformStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("transformStreamHandler", rt, ms, { handler }),
  fanoutStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("fanoutStream", onChunk, { rt, ms, p }),
  fanoutStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("fanoutStreamHandler", rt, ms, { handler }),
  useLiveStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("useLiveStream", onChunk, { rt, ms, p }),
  useLiveStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("useLiveStreamHandler", rt, ms, { handler }),
  useLiveSyncStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("useLiveSyncStream", onChunk, { rt, ms, p }),
  useLiveSyncHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("useLiveSyncHandler", rt, ms, { handler }),
 */
export const kvdb = {
    // BASIC GET/SET
    get: (key, global = false) => rpcCall("get", { key, global }),
    getMany: (keys, global = false) => rpcCall("getMany", { keys, global }),
    getMemory: (key, global = false) => rpcCall("getMemory", { key, global }),
    getManyMemory: (keys, global = false) => rpcCall("getManyMemory", { keys, global }),
    getLocalStorage: (key, global = false) => rpcCall("getLocalStorage", { key, global }),
    set: (key, value, global = false) => rpcCall("set", { key, value, global }),
    setMany: (entries, global = false) => rpcCall("setMany", { entries, global }),
    setMemory: (key, value, global = false) => rpcCall("setMemory", { key, value, global }),
    setManyMemory: (entries, global = false) => rpcCall("setManyMemory", { entries, global }),
    setLocalStorage: (key, value, global = false) => rpcCall("setLocalStorage", { key, value, global }),
    delete: (key, global = false) => rpcCall("delete", { key, global }),
    deleteMany: (keys, global = false) => rpcCall("deleteMany", { keys, global }),
    deleteMemory: (key, global = false) => rpcCall("deleteMemory", { key, global }),
    deleteManyMemory: (keys, global = false) => rpcCall("deleteManyMemory", { keys, global }),
    expire: (key, ms) => rpcCall("expire", { key, ms }),
    expireAt: (key, ts) => rpcCall("expireAt", { key, ts }),
    persist: (key) => rpcCall("persist", { key }),
    touch: (key, ms) => rpcCall("touch", { key, ms }),
    lock: {
        acquire: (key, ms) => rpcCall("lock:acquire", { key, ms }),
        release: (key, owner) => rpcCall("lock:release", { key, owner }),
        renew: (key, owner, ms) => rpcCall("lock:renew", { key, owner, ms }),
    },
    transaction: (ops) => rpcCall("transaction", { ops }),
    batch: (entries) => rpcCall("ngin:batch", { entries }),
    live: (key, initial) => rpcCall("ngin:live", { key, initial }),
    computed: (key, deps, fnBody) => rpcCall("computed", { key, deps, fnBody: fnBody.toString() }),
    snapshot: () => rpcCall("snapshot", {}),
    restore: (snap) => rpcCall("restore", { snap }),
    export: (prefix) => rpcCall("export", { prefix }),
    import: (data, strategy) => rpcCall("import", { data, strategy }),
    index: {
        create: (name, config) => rpcCall("index:create", { name, config }),
        query: (name, filter) => rpcCall("index:query", { name, filter }),
    },
    query: (expr) => rpcCall("query", { expr }),
    openFile: (path) => rpcCall("openFile", { path }),
    closeFile: () => rpcCall("closeFile", {}),
    getTables: () => rpcCall("getTables", {}),
    getSchema: (table) => rpcCall("getSchema", { table }),
    queryTable: (table) => rpcCall("queryTable", { table }),
    updateCell: (table, pkCol, pkVal, col, value) => rpcCall("updateCell", { table, pkCol, pkVal, col, value }),
    insertRow: (table, cols, values) => rpcCall("insertRow", { table, cols, values }),
    deleteRow: (table, pkCol, pkVal) => rpcCall("deleteRow", { table, pkCol, pkVal }),
    addColumn: (table, col, type) => rpcCall("addColumn", { table, col, type }),
    atomic: {
        compareAndSwap: (key, expected, next) => rpcCall("atomicCompareAndSwap", { key, expected, next }),
        mutate: (key, fn) => rpcCall("atomicMutate", { key, fn }),
        increment: (key, by = 1) => rpcCall("atomicIncrement", { key, by }),
        append: (key, value) => rpcCall("atomicAppend", { key, value })
    }
};
export function useCSENGIN() {
    return {
        gar: (rt, p, ttl, binary = false) => rpcCall("gar", { rt, p, ttl, binary }),
        reply: (replyChannel, p) => rpcCall("reply", { replyChannel, p }),
        on: (rt, handler) => { return rpcCall("on", { rt, handler }); },
        once: (rt, handler) => { return rpcCall("once", { rt, handler }); },
        scope: (prefix) => ({
            send: (rt, p, ttl, binary = false) => rpcCall("send", { rt: `${prefix}:${rt}`, p, ttl, binary }),
            sub: (rt, handler) => rpcCall("sub", { rt: `${prefix}:${rt}`, handler }),
            gar: (rt, p, ttl) => rpcCall("gar", { rt: `${prefix}:${rt}`, p, ttl }),
            use: (rt, fn) => rpcCall("use", { rt: `${prefix}:${rt}`, fn: fn.toString() }),
            live: (rt, initial) => { return rpcCall("live", { rt: `${prefix}:${rt}`, initial }); },
            scope: (subprefix) => rpcCall("scope", { prefix: `${prefix}:${subprefix}` })
        }),
        scoped: (workspaceName) => rpcCall("scoped", { workspaceName }),
        hasSubscription: (rt) => rpcCall("hasSubscription", { rt }),
        receive: (msg) => rpcCall("receive", { msg }),
        streamChunk: (rt, streamId, chunk, binary = false) => rpcCall("streamChunk", { rt, streamId, chunk, binary }),
        streamDone: (rt, streamId, binary = false) => rpcCall("streamDone", { rt, streamId, binary }),
        cancelStream: (rt, streamId, binary = false) => rpcCall("cancelStream", { rt, streamId, binary }),
        use: (rt, fn) => rpcCall("use", { rt, fn: fn.toString() }),
        useGlobal: (mw) => rpcCall("useGlobal", { mw }),
        send: (rt, p, ttl, binary = false) => rpcCall("send", { rt, p, ttl, binary }),
        sendsub: (rt, ms, p, ttl, binary = false) => rpcCall("sendsub", { rt, ms, p, ttl, binary }),
        sub: async (rt, handler) => {
            const subId = (await rpcCall("sub", { rt }));
            subHandlers.set(subId, handler);
            return () => {
                subHandlers.delete(subId);
                rpcCall("unsub", { subId });
            };
        },
        multisub: async (rt, sc, handler) => {
            const subId = (await rpcCall("multisub", { rt, sc }));
            subHandlers.set(subId, handler);
            return () => {
                subHandlers.delete(subId);
                rpcCall("unsub", { subId });
            };
        },
        stream: (rt, ms, p, onChunk, binary = false) => rpcStreamCall("stream", onChunk, { rt, ms, p, binary }),
        streamHandler: (rt, ms, handler, binary = false) => rpcCall("streamHandler", { rt, ms, handler, binary }),
        live: (rt, initial = {}) => rpcCall("live", { rt, initial }),
        useLive: (rt, initial = {}, binary = false) => rpcCall("useLive", { rt, initial, binary }),
        request: (rt, p, binary = false) => rpcCall("request", { rt, p, binary }),
        broadcast: (rt, p, ttl) => rpcCall("broadcast", { rt, p, ttl }),
        subWithHistory: async (rt, handler, options) => {
            const subId = (await rpcCall("subWithHistory", { rt, options }));
            subHandlers.set(subId, handler);
            return () => {
                subHandlers.delete(subId);
                rpcCall("unsub", { subId });
            };
        },
        batch: (messages, binary = false) => rpcCall("batch", { messages, binary }),
        createGroup: (name, channels = [], options) => rpcCall("createGroup", { name, channels, options }),
        deleteGroup: (name) => rpcCall("deleteGroup", { name }),
        addToGroup: (name, rt) => rpcCall("addToGroup", { name, rt }),
        removeFromGroup: (name, rt) => rpcCall("removeFromGroup", { name, rt }),
        enableGroup: (name) => rpcCall("enableGroup", { name }),
        disableGroup: (name) => rpcCall("disableGroup", { name }),
        groupBroadcast: (name, p, ttl) => rpcCall("groupBroadcast", { name, p, ttl }),
        subscribeByTag: async (tag, handler) => {
            const subId = (await rpcCall("subscribeByTag", { tag }));
            subHandlers.set(subId, handler);
            return () => {
                subHandlers.delete(subId);
                rpcCall("unsub", { subId });
            };
        },
        setDefaultPriority: (priority) => rpcCall("setDefaultPriority", { priority }),
        getDefaultPriority: () => rpcCall("getDefaultPriority"),
        ack: (messageId) => rpcCall("ack", { messageId }),
        nak: (messageId, reason) => rpcCall("nak", { messageId, reason }),
        onDeliveryReceipt: (handler) => rpcCall("onDeliveryReceipt", { handler }),
        listDeadLetters: (rt) => rpcCall("listDeadLetters", { rt }),
        requeueDeadLetter: (id, ttl) => rpcCall("requeueDeadLetter", { id, ttl }),
        subscribeDurable: async (rt, handler, options) => {
            const subId = (await rpcCall("subscribeDurable", { rt, options }));
            subHandlers.set(subId, handler);
            return () => {
                subHandlers.delete(subId);
                rpcCall("unsub", { subId });
            };
        },
        setCheckpoint: (rt, subscriberId, offset) => rpcCall("setCheckpoint", { rt, subscriberId, offset }),
        getCheckpoint: (rt, subscriberId) => rpcCall("getCheckpoint", { rt, subscriberId }),
        replay: async (options, handler) => {
            const subId = (await rpcCall("replay", { options }));
            subHandlers.set(subId, handler);
            return () => {
                subHandlers.delete(subId);
                rpcCall("unsub", { subId });
            };
        },
        groupUse: (name, fn) => rpcCall("groupUse", { name, fn: fn.toString() }),
        setBackpressureConfig: (config) => rpcCall("setBackpressureConfig", { config }),
        setChannelSchema: (rt, schema) => rpcCall("setChannelSchema", { rt, schema }),
        getChannelSchema: (rt) => rpcCall("getChannelSchema", { rt }),
        setChannelPermissions: (rt, perms) => rpcCall("setChannelPermissions", { rt, perms }),
        getChannelPermissions: (rt) => rpcCall("getChannelPermissions", { rt }),
        addRouteRule: (rule) => rpcCall("addRouteRule", { rule }),
        removeRouteRule: (name) => rpcCall("removeRouteRule", { name }),
        listRouteRules: () => rpcCall("listRouteRules"),
        addTransform: (channelPattern, transform) => rpcCall("addTransform", { channelPattern, transform }),
        removeTransform: (channelPattern) => rpcCall("removeTransform", { channelPattern }),
        configureEncryption: (config) => rpcCall("configureEncryption", { config }),
        configureCompression: (config) => rpcCall("configureCompression", { config }),
        listTags: () => rpcCall("listTags"),
        listChannelsByTag: (tag) => rpcCall("listChannelsByTag", { tag }),
        listChannels: () => rpcCall("listChannels"),
        getChannelInfo: (rt) => rpcCall("getChannelInfo", { rt }),
        listHandlers: (rt) => rpcCall("listHandlers", { rt }),
        listAdapters: () => rpcCall("listAdapters"),
        listMiddleware: () => rpcCall("listMiddleware"),
        getMessageCount: (rt) => rpcCall("getMessageCount", { rt }),
        getAdapterMetrics: () => rpcCall("getAdapterMetrics"),
        disableAdapter: (id) => rpcCall("disableAdapter", { id }),
        enableAdapter: (id) => rpcCall("enableAdapter", { id }),
        session: () => rpcCall("session"),
        useSession: () => rpcCall("useSession"),
        secrets: () => rpcCall("secrets"),
        useSecrets: () => rpcCall("useSecrets"),
        worker: (queueChannel, handler, options = {}) => rpcCall("worker", { queueChannel, handler, options }),
        enqueueJob: (queueChannel, p, timeoutMs = 30000) => rpcCall("enqueueJob", { queueChannel, p, timeoutMs }),
        crdt: (rt, initial) => rpcCall("crdt", { rt, initial }),
        useCrdt: (rt, initial) => rpcCall("useCrdt", { rt, initial }),
        signal: (key, initialValue, options) => rpcCall("signal", { key, initialValue, options }),
        useSignal: (key, initialValue, options) => rpcCall("useSignal", { key, initialValue, options }),
        notifications: (topic = 'global') => rpcCall("notifications", { topic }),
        useNotifications: (topic = 'global') => rpcCall("useNotifications", { topic }),
        config: (namespace, defaultConfig) => rpcCall("config", { namespace, defaultConfig }),
        useConfig: (namespace, defaultConfig) => rpcCall("useConfig", { namespace, defaultConfig }),
        useFeatureFlag: (flag, defaultValue = false) => rpcCall("useFeatureFlag", { flag, defaultValue }),
        lock: (rt, resourceId, ttl = 30000) => rpcCall("lock", { rt, resourceId, ttl }),
        mapReduce: (rt, mapper, reducer, initial, timeoutMs = 5000) => rpcCall("mapReduce", { rt, mapper: mapper.toString(), reducer: reducer.toString(), initial, timeoutMs }),
        machine: (rt, config) => rpcCall("machine", { rt, config }),
        rateLimit: (rt, key, maxRequests, windowMs) => rpcCall("rateLimit", { rt, key, maxRequests, windowMs }),
        appendOnlyLog: (rt, options) => rpcCall("appendOnlyLog", { rt, options }),
        circuitBreaker: (rt, operation, options) => rpcCall("circuitBreaker", { rt, operation: operation.toString(), options }),
        transaction: (rt, operations) => rpcCall("transaction", { rt, operations: { prepare: operations.prepare.toString(), commit: operations.commit.toString(), rollback: operations.rollback.toString() } }),
        autoFederate: (rt, options = {}) => rpcCall("autoFederate", { rt, options }),
        visualFlow: (rt, nodes) => rpcCall("visualFlow", { rt, nodes: nodes.map(n => ({ ...n, transform: n.transform.toString() })) }),
        // NGIN
        get: (key, global = false) => rpcCall("get", { key, global }),
        getMany: (keys, global = false) => rpcCall("getMany", { keys, global }),
        getMemory: (key, global = false) => rpcCall("getMemory", { key, global }),
        getManyMemory: (keys, global = false) => rpcCall("getManyMemory", { keys, global }),
        getLocalStorage: (key, global = false) => rpcCall("getLocalStorage", { key, global }),
        set: (key, value, global = false) => rpcCall("set", { key, value, global }),
        setMany: (entries, global = false) => rpcCall("setMany", { entries, global }),
        setMemory: (key, value, global = false) => rpcCall("setMemory", { key, value, global }),
        setManyMemory: (entries, global = false) => rpcCall("setManyMemory", { entries, global }),
        setLocalStorage: (key, value, global = false) => rpcCall("setLocalStorage", { key, value, global }),
        delete: (key, global = false) => rpcCall("delete", { key, global }),
        deleteMany: (keys, global = false) => rpcCall("deleteMany", { keys, global }),
        deleteMemory: (key, global = false) => rpcCall("deleteMemory", { key, global }),
        deleteManyMemory: (keys, global = false) => rpcCall("deleteManyMemory", { keys, global }),
        expire: (key, ms) => rpcCall("expire", { key, ms }),
        expireAt: (key, ts) => rpcCall("expireAt", { key, ts }),
        persist: (key) => rpcCall("persist", { key }),
        touch: (key, ms) => rpcCall("touch", { key, ms }),
        ngin_lock: {
            acquire: (key, ms) => rpcCall("lock:acquire", { key, ms }),
            release: (key, owner) => rpcCall("lock:release", { key, owner }),
            renew: (key, owner, ms) => rpcCall("lock:renew", { key, owner, ms }),
        },
        ngin_transaction: (ops) => rpcCall("transaction", { ops }),
        ngin_batch: (entries) => rpcCall("ngin:batch", { entries }),
        ngin_live: (key, initial) => rpcCall("ngin:live", { key, initial }),
        computed: (key, deps, fnBody) => rpcCall("computed", { key, deps, fnBody: fnBody.toString() }),
        snapshot: () => rpcCall("snapshot", {}),
        restore: (snap) => rpcCall("restore", { snap }),
        export: (prefix) => rpcCall("export", { prefix }),
        import: (data, strategy) => rpcCall("import", { data, strategy }),
        index: {
            create: (name, config) => rpcCall("index:create", { name, config }),
            query: (name, filter) => rpcCall("index:query", { name, filter }),
        },
        query: (expr) => rpcCall("query", { expr }),
        openFile: (path) => rpcCall("openFile", { path }),
        closeFile: () => rpcCall("closeFile", {}),
        getTables: () => rpcCall("getTables", {}),
        getSchema: (table) => rpcCall("getSchema", { table }),
        queryTable: (table) => rpcCall("queryTable", { table }),
        updateCell: (table, pkCol, pkVal, col, value) => rpcCall("updateCell", { table, pkCol, pkVal, col, value }),
        insertRow: (table, cols, values) => rpcCall("insertRow", { table, cols, values }),
        deleteRow: (table, pkCol, pkVal) => rpcCall("deleteRow", { table, pkCol, pkVal }),
        addColumn: (table, col, type) => rpcCall("addColumn", { table, col, type }),
        atomic: {
            compareAndSwap: (key, expected, next) => rpcCall("atomicCompareAndSwap", { key, expected, next }),
            mutate: (key, fn) => rpcCall("atomicMutate", { key, fn }),
            increment: (key, by = 1) => rpcCall("atomicIncrement", { key, by }),
            append: (key, value) => rpcCall("atomicAppend", { key, value })
        }
    };
}
export async function exeCmd(command, targetDir, type, args, timeout = 2000) {
    const result = await staff.send("[TM][EXE]", { command, targetDir, args, type, timeout });
    return result;
}
export async function exeVSCCmd(command, args) {
    const result = await staff.send("[VSC][EXE]", { command, args });
    return result;
}
