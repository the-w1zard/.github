// #endregion
// #region █████████ CONSTANTS ████████████████████████████████████████████████████████████████████████████████████████████████
const port = 11777;
const ws = new WebSocket(`ws://localhost:${port}`);
const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
let rpcId = 0;
const routedHandlers = new Map();
const pending = new Map();
const subHandlers = new Map();
const sendQueue = [];
// #endregion
// #region █████████ WS ███████████████████████████████████████████████████████████████████████████████████████████████████████
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
// #endregion
// #region █████████ RPC FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████
function channelRpc(method, k, sl, ms, rt, extra) { return rpcCall(method, { k, sl, ms, rt, ...extra }); }
function addHandler2(handler, k, sl, ms, rt) {
    if (!routedHandlers.has(rt))
        routedHandlers.set(rt, new Map());
    const subMap = routedHandlers.get(rt);
    if (!subMap.has(ms))
        subMap.set(ms, new Set());
    subMap.get(ms).add(handler);
    return () => subMap.get(ms)?.delete(handler);
}
function addHandler(_label, k, sl, ms, rt, extra) {
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
function streamRpc(method, k, sl, ms, rt, extra) { return rpcCall(method, { k, sl, ms, rt, ...extra }); }
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
function anyRpc(method, k, sl, ms, rt, initial, ...opts) { return rpcCall(method, { k, sl, ms, rt, initial, ...opts }); }
function anykeyRpc(method, key, ...opts) { return rpcCall(method, { key, ...opts }); }
function createDuplexRpcProxy(method, k, sl, ms, rt, opts, type = 'default') {
    const downHandlers = new Set();
    const errorHandlers = new Set();
    const closeHandlers = new Set();
    let streamId;
    let closed = false;
    let fullyClosed = false;
    let fatallyErrored = false;
    const downUnsub = addHandler2((p) => {
        if (closed)
            return;
        const chunk = p?.chunk ?? p;
        const seq = p?.seq ?? -1;
        downHandlers.forEach(handler => handler(chunk, seq));
    }, k, `${sl}:down`, ms, rt);
    const errorUnsub = addHandler2((err) => {
        if (closed)
            return;
        errorHandlers.forEach(handler => handler(err));
        if (err.fatal) {
            fatallyErrored = true;
            closed = true;
        }
    }, k, `${sl}:error`, ms, rt);
    const closeUnsub = addHandler2((dir) => {
        if (dir === 'up' || dir === 'down') {
            closeHandlers.forEach(handler => handler());
        }
    }, k, `${sl}:remote-close`, ms, rt);
    const establish = rpcCall(method, {
        rt,
        ms,
        opts,
        type,
    }).then((result) => {
        streamId = result?.streamId ?? result?.id;
        return result;
    });
    const streamCall = (operation, p) => {
        return establish.then(() => rpcCall(`${method}:${operation}`, {
            rt,
            ms,
            streamId,
            p,
        }));
    };
    return {
        send: (p) => {
            if (closed || fatallyErrored)
                return;
            void streamCall('send', p);
        },
        onData: (handler) => {
            if (closed)
                return () => { };
            downHandlers.add(handler);
            return () => {
                downHandlers.delete(handler);
            };
        },
        onError: (handler) => {
            if (closed)
                return () => { };
            errorHandlers.add(handler);
            return () => {
                errorHandlers.delete(handler);
            };
        },
        onRemoteClose: (handler) => {
            if (closed)
                return () => { };
            closeHandlers.add(handler);
            return () => {
                closeHandlers.delete(handler);
            };
        },
        closeUp: () => {
            if (closed)
                return;
            void streamCall('closeUp');
        },
        closeDown: () => {
            if (closed)
                return;
            void streamCall('closeDown');
        },
        close: () => {
            if (closed)
                return;
            closed = true;
            fullyClosed = true;
            downUnsub();
            errorUnsub();
            closeUnsub();
            downHandlers.clear();
            errorHandlers.clear();
            closeHandlers.clear();
            void streamCall('close');
        },
        isFullyClosed: () => fullyClosed,
        isFatallyErrored: () => fatallyErrored,
    };
}
// #endregion
// #region █████████ CONSTANTS ███████████████████████████████████████████████████████████████████████████████████████████████
function FUCKYourRpc(method, ...props) {
    const id = rpcId++;
    const fullPayload = {
        type: "rpc",
        id,
        clientId,
        method,
        ws: window.WEBVIEW_WORKSPACE_CONTEXT,
        workspace: window.WEBVIEW_WORKSPACE_CONTEXT,
        timestamp: Date.now(),
        ...props,
    };
    const p = JSON.stringify(fullPayload);
    if (props.onChunk) {
        const onChunk = props.onChunk;
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
    else if (props.method === 'duplex') {
        const downHandlers = new Set();
        const errorHandlers = new Set();
        const closeHandlers = new Set();
        let streamId;
        let closed = false;
        let fullyClosed = false;
        let fatallyErrored = false;
        const downUnsub = addHandler2((p) => {
            if (closed)
                return;
            const chunk = p?.chunk ?? p;
            const seq = p?.seq ?? -1;
            downHandlers.forEach(handler => handler(chunk, seq));
        }, props.k, `${props.sl}:down`, props.ms, props.rt);
        const errorUnsub = addHandler2((err) => {
            if (closed)
                return;
            errorHandlers.forEach(handler => handler(err));
            if (err.fatal) {
                fatallyErrored = true;
                closed = true;
            }
        }, props.k, `${props.sl}:error`, props.ms, props.rt);
        const closeUnsub = addHandler2((dir) => {
            if (dir === 'up' || dir === 'down') {
                closeHandlers.forEach(handler => handler());
            }
        }, props.k, `${props.sl}:remote-close`, props.ms, props.rt);
        const establish = rpcCall(method, {
            ...props
        }).then((result) => {
            streamId = result?.streamId ?? result?.id;
            return result;
        });
        const streamCall = (operation, p) => {
            return establish.then(() => rpcCall(`${method}:${operation}`, {
                streamId,
                p,
                ...props
            }));
        };
        return {
            send: (p) => {
                if (closed || fatallyErrored)
                    return;
                void streamCall('send', p);
            },
            onData: (handler) => {
                if (closed)
                    return () => { };
                downHandlers.add(handler);
                return () => {
                    downHandlers.delete(handler);
                };
            },
            onError: (handler) => {
                if (closed)
                    return () => { };
                errorHandlers.add(handler);
                return () => {
                    errorHandlers.delete(handler);
                };
            },
            onRemoteClose: (handler) => {
                if (closed)
                    return () => { };
                closeHandlers.add(handler);
                return () => {
                    closeHandlers.delete(handler);
                };
            },
            closeUp: () => {
                if (closed)
                    return;
                void streamCall('closeUp');
            },
            closeDown: () => {
                if (closed)
                    return;
                void streamCall('closeDown');
            },
            close: () => {
                if (closed)
                    return;
                closed = true;
                fullyClosed = true;
                downUnsub();
                errorUnsub();
                closeUnsub();
                downHandlers.clear();
                errorHandlers.clear();
                closeHandlers.clear();
                void streamCall('close');
            },
            isFullyClosed: () => fullyClosed,
            isFatallyErrored: () => fatallyErrored,
        };
    }
    else {
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
}
export const staff = new Proxy({}, {
    get: (_, verb) => (...args) => FUCKYourRpc(verb, ...args)
});
export const staff1 = {
    // #region █████████ BASE FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████
    sendsub: (p, k, sl, ms, rt, ttl, binary = false) => channelRpc("sendsub", { p, ttl, binary }, k, sl, ms, rt, ttl, binary),
    send: (p, k, sl, ms, rt, ttl, binary = false) => channelRpc("sendsub", { p, ttl, binary }, k, sl, ms, rt, ttl, binary),
    multisub: (handler, k, sl, ms, rt) => {
        const unsub = addHandler('multisub', k, sl, ms, rt, { handler });
        channelRpc("multisub", k, sl, ms, rt);
        return () => {
            unsub();
            channelRpc("unsub", k, sl, ms, rt);
        };
    },
    // #endregion
    // #region █████████ STREAMS ██████████████████████████████████████████████████████████████████████████████████████████████
    stream: (rt, ms, p, onChunk) => rpcStreamCall("stream", onChunk, { rt, ms, p }),
    streamHandler: (rt, ms, handler, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
    streamChunk: (rt, ms, streamId, chunk, binary = false) => rpcCall("streamChunk", { rt, ms, streamId, chunk, binary }),
    streamDone: (rt, ms, streamId, binary = false) => rpcCall("streamDone", { rt, ms, streamId, binary }),
    cancelStream: (rt, ms, streamId, binary = false) => rpcCall("cancelStream", { rt, ms, streamId, binary }),
    syncStream: (rt, ms, p, onChunk, binary = false) => rpcStreamCall("stream", onChunk, { rt, ms, p, binary }),
    syncStreamHandler: (rt, ms, handler, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
    streamRelay: (rt, ms, p, onChunk) => rpcStreamCall("streamRelay", onChunk, { rt, ms, p }),
    openSyncStream: (rt, ms, p, onChunk) => rpcStreamCall("openSyncStream", onChunk, { rt, ms, p }),
    openSyncStreamHandler: (rt, ms, handler) => addHandler("openSyncStreamHandler", rt, ms, { handler }),
    priorityStream: (rt, ms, p, onChunk) => rpcStreamCall("priorityStream", onChunk, { rt, ms, p }),
    priorityStreamHandler: (rt, ms, handler) => addHandler("priorityStreamHandler", rt, ms, { handler }),
    duplexStream: (rt, ms, p, onChunk) => rpcStreamCall("duplexStream", onChunk, { rt, ms, p }),
    duplexStreamHandler: (rt, ms, handler) => addHandler("duplexStreamHandler", rt, ms, { handler }),
    transactionalStream: (rt, ms, p, onChunk) => rpcStreamCall("transactionalStream", onChunk, { rt, ms, p }),
    transactionalStreamHandler: (rt, ms, handler) => addHandler("transactionalStreamHandler", rt, ms, { handler }),
    deltaStream: (rt, ms, p, onChunk) => rpcStreamCall("deltaStream", onChunk, { rt, ms, p }),
    deltaStreamHandler: (rt, ms, handler) => addHandler("deltaStreamHandler", rt, ms, { handler }),
    presenceStream: (rt, ms, p, onChunk) => rpcStreamCall("presenceStream", onChunk, { rt, ms, p }),
    presenceStreamHandler: (rt, ms, handler) => addHandler("presenceStreamHandler", rt, ms, { handler }),
    authorityStream: (rt, ms, p, onChunk) => rpcStreamCall("authorityStream", onChunk, { rt, ms, p }),
    authorityStreamHandler: (rt, ms, handler) => addHandler("authorityStreamHandler", rt, ms, { handler }),
    compressionStream: (rt, ms, p, onChunk) => rpcStreamCall("compressionStream", onChunk, { rt, ms, p }),
    compressionStreamHandler: (rt, ms, handler) => addHandler("compressionStreamHandler", rt, ms, { handler }),
    heatbeatStream: (rt, ms, p, onChunk) => rpcStreamCall("heatbeatStream", onChunk, { rt, ms, p }),
    // heatbeatStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("heatbeatStreamHandler", rt, ms, handler),
    backPressureStream: (rt, ms, p, onChunk) => rpcStreamCall("backPressureStream", onChunk, { rt, ms, p }),
    backPressureStreamHandler: (rt, ms, handler) => addHandler("backPressureStreamHandler", rt, ms, { handler }),
    statefulStream: (rt, ms, p, onChunk) => rpcStreamCall("statefulStream", onChunk, { rt, ms, p }),
    statefulStreamHandler: (rt, ms, handler) => addHandler("statefulStreamHandler", rt, ms, { handler }),
    multicastStream: (rt, ms, p, onChunk) => rpcStreamCall("multicastStream", onChunk, { rt, ms, p }),
    multicastStreamHandler: (rt, ms, handler) => addHandler("multicastStreamHandler", rt, ms, { handler }),
    partitionedStream: (rt, ms, p, onChunk) => rpcStreamCall("partitionedStream", onChunk, { rt, ms, p }),
    partitionedStreamHandler: (rt, ms, handler) => addHandler("partitionedStreamHandler", rt, ms, { handler }),
    batchStream: (rt, ms, p, onChunk) => rpcStreamCall("batchStream", onChunk, { rt, ms, p }),
    batchStreamHandler: (rt, ms, handler) => addHandler("batchStreamHandler", rt, ms, { handler }),
    filteredStream: (rt, ms, p, onChunk) => rpcStreamCall("filteredStream", onChunk, { rt, ms, p }),
    filteredStreamHandler: (rt, ms, handler) => addHandler("filteredStreamHandler", rt, ms, { handler }),
    deadLetterStream: (rt, ms, p, onChunk) => rpcStreamCall("deadLetterStream", onChunk, { rt, ms, p }),
    deadLetterStreamHandler: (rt, ms, handler) => addHandler("deadLetterStreamHandler", rt, ms, { handler }),
    idempotentStream: (rt, ms, p, onChunk) => rpcStreamCall("idempotentStream", onChunk, { rt, ms, p }),
    idempotentStreamHandler: (rt, ms, handler) => addHandler("idempotentStreamHandler", rt, ms, { handler }),
    lateArrivalStream: (rt, ms, p, onChunk) => rpcStreamCall("lateArrivalStream", onChunk, { rt, ms, p }),
    lateArrivalStreamHandler: (rt, ms, handler) => addHandler("lateArrivalStreamHandler", rt, ms, { handler }),
    checkpointStream: (rt, ms, p, onChunk) => rpcStreamCall("checkpointStream", onChunk, { rt, ms, p }),
    checkpointStreamHandler: (rt, ms, handler) => addHandler("checkpointStreamHandler", rt, ms, { handler }),
    rateLimitedStream: (rt, ms, p, onChunk) => rpcStreamCall("rateLimitedStream", onChunk, { rt, ms, p }),
    rateLimitedStreamHandler: (rt, ms, handler) => addHandler("rateLimitedStreamHandler", rt, ms, { handler }),
    comboStream: (rt, ms, p, onChunk) => rpcStreamCall("comboStream", onChunk, { rt, ms, p }),
    comboStreamHandler: (rt, ms, handler) => addHandler("comboStreamHandler", rt, ms, { handler }),
    transformStream: (rt, ms, p, onChunk) => rpcStreamCall("transformStream", onChunk, { rt, ms, p }),
    transformStreamHandler: (rt, ms, handler) => addHandler("transformStreamHandler", rt, ms, { handler }),
    fanoutStream: (rt, ms, p, onChunk) => rpcStreamCall("fanoutStream", onChunk, { rt, ms, p }),
    fanoutStreamHandler: (rt, ms, handler) => addHandler("fanoutStreamHandler", rt, ms, { handler }),
    useLiveStream: (rt, ms, p, onChunk) => rpcStreamCall("useLiveStream", onChunk, { rt, ms, p }),
    useLiveStreamHandler: (rt, ms, handler) => addHandler("useLiveStreamHandler", rt, ms, { handler }),
    useLiveSyncStream: (rt, ms, p, onChunk) => rpcStreamCall("useLiveSyncStream", onChunk, { rt, ms, p }),
    useLiveSyncHandler: (rt, ms, handler) => addHandler("useLiveSyncHandler", rt, ms, { handler }),
    // #endregion
    // #region █████████ DUPLEX ███████████████████████████████████████████████████████████████████████████████████████████████
    duplex: (rt, ms, opts, type) => streamRpc("duplex", rt, ms, { opts, type }),
    openStream: (rt, ms, opts) => streamRpc("openStream", rt, ms, { opts, }),
    sx: (rt, ms, opts, type) => createDuplexRpcProxy("sx", rt, ms, { opts, type }),
    sxHandler: (rt, ms, opts, type) => createDuplexRpcProxy("sxHandler", rt, ms, { opts, type }),
    // #endregion
    // #region █████████ DRSS - DISTRBUTED REACTIVE STATE STREAMS ██████████████████████████████████████████████████████████
    useDRSS: () => anyRpc("useDRSS", '', ''),
    useDRSSHandler: () => anyRpc("useDRSSHandler", '', ''),
    useDRSSSync: () => anyRpc("useDRSSSync", '', ''),
    useDRSSSyncHandler: () => anyRpc("useDRSSSyncHandler", '', ''),
    // #endregion
    // #region █████████ DRS ██████████████████████████████████████████████████████████████████████████████████████████████████
    useObservableState: (rt, ms, initial) => anyRpc("useObservableState", rt, ms, initial),
    useOptimisticState: (rt, ms, initial) => anyRpc("useOptimisticState", rt, ms, initial),
    DRS: (rt, ms, initial) => anyRpc("DRS", rt, ms, initial),
    live: (rt, ms, initial) => anyRpc("live", rt, ms, initial),
    useLive: (rt, ms, initial) => anyRpc("useLive", rt, ms, initial),
    useDRS: (rt, ms, initial) => anyRpc("useDRS", rt, ms, initial),
    stateLive: (rt, ms, initial) => anyRpc("stateLive", rt, ms, initial),
    stateDRS: (rt, ms, initial) => anyRpc("stateDRS", rt, ms, initial),
    useStateCRDT: (rt, ms, initial) => anyRpc("useStateCRDT", rt, ms, initial),
    useStateDRS: (rt, ms, initial) => anyRpc("useStateDRS", rt, ms, initial),
    useRefDRS: (rt, ms, initial) => anyRpc("useRefDRS", rt, ms, initial),
    useUmbrellaDRS: (rt, ms, initial) => anyRpc("useUmbrellaDRS", rt, ms, initial),
    useContextDRS: (rt, ms, initial) => anyRpc("useContextDRS", rt, ms, initial),
    DRSStore: (rt, ms, initial) => anyRpc("DRSStore", rt, ms, initial),
    useDRSStore: (rt, ms, initial) => anyRpc("useDRSStore", rt, ms, initial),
    useEffectDRS: (rt, ms, effect, deps = []) => anyRpc("useEffectDRS", rt, ms, { effect, deps }),
    useAutoEffectDRS: (rt, ms, effect, deps = []) => anyRpc("useAutoEffectDRS", rt, ms, { effect, deps }),
    useDeferredValueDRS: (rt, ms) => anyRpc("useDeferredValueDRS", rt, ms),
    useImperativeHandleDRS: (ref, rt, ms, createHandle, deps = []) => anyRpc("useImperativeHandleDRS", rt, ms, { ref, createHandle, deps }),
    useMemoDRS: (sources, compute) => anyRpc("useMemoDRS", "", "", { sources, compute }),
    useReverseHeartbeat: (rt, ms, nodeId, resetIntervalMs) => anyRpc("useReverseHeartbeat", rt, ms, { nodeId, resetIntervalMs }),
    useDRSDBRaft: (rt, ms, initial) => anyRpc("useDRSDBRaft", rt, ms, { initial }),
    useRxDBRaft: (rt, ms, initial, db = 'kvdb') => anyRpc("useRxDBRaft", rt, ms, { initial, db }),
    useDRSDBYata: (rt, ms) => anyRpc("useDRSDBYata", rt, ms),
    useRxDBYata: (rt, ms, initial, db = 'kvdb') => anyRpc("useRxDBYata", rt, ms, { initial, db }),
    useRTDB: (rt, ms, initial, db = 'kvdb') => anyRpc("useRTDB", rt, ms, { initial, db }),
    drsdb: (rt, ms, initial) => anyRpc("drsdb", rt, ms, { initial }),
    useDRSDB: (rt, ms, initial) => anyRpc("useDRSDB", rt, ms, { initial }),
    useDRSDBOptimistic: (rt, ms, initial) => anyRpc("useDRSDBOptimistic", rt, ms, { initial }),
    useDRSDBCRDT: () => anyRpc("useDRSDBCRDT", '', ''),
    rtdbStream: () => anyRpc("useDRSDBCRDT", '', ''),
    drsdbStream: () => anyRpc("useDRSDBCRDT", '', ''),
    // #endregion
    // #region █████████ CONDITIONALS ████████████████████████████████████████████████████████████████████████████████████████
    barrier: (rt, ms, participantId, total, options = {}) => anyRpc("barrier", rt, ms, { participantId, total, options }),
    latch: (rt, ms) => anyRpc("latch", rt, ms),
    gateMaster: (rt, ms, gatesFactory, options = { concurrency: true }) => anyRpc("gateMaster", rt, ms, { gatesFactory, options }),
    gateMaster2: (rt, ms, gates) => anyRpc("gateMaster2", rt, ms, { gates }),
    floodGateWithLive: () => anyRpc("floodGateWithLive", '', ''),
    plinko: (rt, ms, initialState, tree, options = {}) => anyRpc("plinko", rt, ms, { initialState, tree, options }),
    plinko3: (rt, ms) => anyRpc("plinko3", rt, ms),
    plinko2: (rt, ms, tree, options = {}) => anyRpc("plinko2", rt, ms, tree, options),
    getCircuitBreaker: (rt, options) => anyRpc("getCircuitBreaker", rt, options),
    circuitBreaker: (rt, ms, operation, options) => anyRpc("circuitBreaker", rt, ms, operation, options),
    conditionVariable: (rt, ms, raft, nodeId) => anyRpc("conditionVariable", rt, ms, raft, nodeId),
    // #endregion
    // #region █████████ SPECIALTY ███████████████████████████████████████████████████████████████████████████████████████████
    worker: () => anyRpc("worker", '', ''),
    cron: () => anyRpc("cron", '', ''),
    fusebox: (rt, ms, options = {}) => anyRpc("fusebox", rt, ms, options),
    tripwire: (rt, ms, stateTarget, options = {}) => anyRpc("tripwire", rt, ms, stateTarget, options),
    fathom: (rt, ms, options = {}) => anyRpc("fathom", rt, ms, options),
    rigging: () => anyRpc("rigging", "", ""),
    circus: (rt, ms, options = {}) => anyRpc("circus", rt, ms, options),
    nebula: (rt, ms, options = {}) => anyRpc("nebula", rt, ms, options),
    cyclone: (rt, ms, options = {}) => anyRpc("cyclone", rt, ms, options),
    trident: (rt, ms, options = {}) => anyRpc("trident", rt, ms, options),
    anchor: (rt, ms, options = {}) => anyRpc("anchor", rt, ms, options),
    pipeline: (rt, ms) => anyRpc("pipeline", rt, ms),
    tide: (rt, ms, options) => anyRpc("tide", rt, ms, options),
    mesh: (rt, ms, options) => anyRpc("mesh", rt, ms, options),
    echo: (rt, ms) => anyRpc("echo", rt, ms),
    carousel: (rt, ms, options = {}) => anyRpc("carousel", rt, ms, options),
    synapse: (localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options = {}) => anyRpc("synapse", localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options),
    abortableFlight: (rt, ms) => anyRpc("abortableFlight", rt, ms),
    tokenBucket: (rt, ms, options = {}) => anyRpc("tokenBucket", rt, ms, options),
    tokenBucket_simple: (maxTokens, refillRateMs) => anyRpc("tokenBucket_simple", "", "", maxTokens, refillRateMs),
    resilience: (rt, ms, options = {}) => anyRpc("resilience", rt, ms, options),
    saga: (sagaId, ms, context) => anyRpc("saga", sagaId, ms, context),
    ecs: (rt, ms) => anyRpc("ecs", rt, ms),
    commandBuffer: (rt, ms, options) => anyRpc("commandBuffer", rt, ms, options),
    reactor: (rt, ms, config) => anyRpc("reactor", rt, ms, config),
    blackboard: (rt, ms) => anyRpc("blackboard", rt, ms),
    snapshotIsolation: (rt, ms, options) => anyRpc("snapshotIsolation", rt, ms, options),
    smartBeacon: (rt, ms, set_pulse) => anyRpc("smartBeacon", rt, ms, set_pulse),
    crdt: (rt, ms, initial) => anyRpc("crdt", rt, ms, initial),
    useCrdt: (rt, ms, initial) => anyRpc("useCrdt", rt, ms, initial),
    createCRDTChannel: (rt, ms, initial, syncEngine) => anyRpc("createCRDTChannel", rt, ms, initial, syncEngine),
    notifications: (rt, ms) => anyRpc("notifications", rt, ms),
    useNotifications: (rt, ms) => anyRpc("useNotifications", rt, ms),
    config: (namespace, ms, defaultConfig) => anyRpc("config", namespace, ms, defaultConfig),
    useConfig: (namespace, ms, defaultConfig) => anyRpc("useConfig", namespace, ms, defaultConfig),
    useFeatureFlag: (flag, ms, defaultValue) => anyRpc("useFeatureFlag", flag, ms, defaultValue),
    lock: (rt, ms, resourceId, ttl) => anyRpc("lock", rt, ms, resourceId, ttl),
    mapReduce: (rt, ms, mapper, reducer, initial, timeoutMs) => anyRpc("mapReduce", rt, ms, mapper, reducer, initial, timeoutMs),
    rateLimit: (rt, ms, key, maxRequests, windowMs) => anyRpc("rateLimit", rt, ms, key, maxRequests, windowMs),
    appendOnlyLog: (rt, ms, options) => anyRpc("appendOnlyLog", rt, ms, options),
    // #endregion
    // #region █████████ JTF2 LEVEL ANALOGY BASED FEATURES █████████████████████████████████████████████████████████████████
    harbormaster: (rt, ms, options = {}) => anyRpc("harbormaster", rt, ms, options),
    beacon: (rt, ms, set_pulse) => anyRpc("beacon", rt, ms, set_pulse),
    vessel: (rt, ms, set_pulse) => anyRpc("vessel", rt, ms, set_pulse),
    dock: (rt, ms) => anyRpc("dock", rt, ms),
    radar: (rt, ms, set_pulse, vessel_id) => anyRpc("radar", rt, ms, set_pulse, vessel_id),
    torpedo: (rt, ms, p, timeoutMs) => anyRpc("torpedo", rt, ms, p, timeoutMs),
    convoy: (rt, ms, nodeId, heartbeatInterval, dropThreshold) => anyRpc("convoy", rt, ms, nodeId, heartbeatInterval, dropThreshold),
    sonar: (rt, ms, set_pulse) => anyRpc("sonar", rt, ms, set_pulse),
    heartbeat: (rt, ms, interval, timeout) => anyRpc("heartbeat", rt, ms, interval, timeout),
    watchdog: (rt, ms, options = {}) => anyRpc("watchdog", rt, ms, options),
    singleFlight: (key, task) => anyRpc("singleFlight", "", "", key, task),
    transaction: (rt, ms, operations) => anyRpc("transaction", rt, ms, operations),
    autoFederate: (rt, ms, options = {}) => anyRpc("autoFederate", rt, ms, options),
    visualFlow: (rt, ms, nodes) => anyRpc("visualFlow", rt, ms, nodes),
    // #endregion
    // #region █████████ EPHEMERAL STATE ████████████████████████████████████████████████████████████████████████████████████
    shadowState: (key, initial) => anykeyRpc("shadowState", key, initial),
    useShadowState: (key, initial) => anykeyRpc("useShadowState", key, initial),
    shadowStateWithTTL: (key, initial, ttlMs) => anykeyRpc("shadowStateWithTTL", key, initial, ttlMs),
    batchShadowState: (key, initial, options = {}) => anykeyRpc("batchShadowState", key, initial, options),
    // #endregion
    // #region █████████ NORMAL FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████
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
    use: (rt, fn) => rpcCall("use", { rt, fn: fn.toString() }),
    useGlobal: (mw) => rpcCall("useGlobal", { mw }),
    send: (rt, ms, p, ttl, binary = false) => rpcCall("send", { rt, ms, p, ttl, binary }),
    sub: async (rt, ms, handler) => {
        const subId = (await rpcCall("sub", { rt, ms }));
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
    // #endregion
};
export const kvdb = {
    // #region █████████ NGIN - MEMORY / CACHE ██████████████████████████████████████████████████████████████████████████████
    getMemory: async (key) => await rpcCall("getMemory", { key }),
    getManyMemory: async (keys) => await rpcCall("getManyMemory", { keys }),
    setMemory: (key, value) => rpcCall("setMemory", { key, value }),
    setManyMemory: (entries) => rpcCall("setManyMemory", { entries }),
    deleteMemory: (key) => rpcCall("deleteMemory", { key }),
    deleteManyMemory: (keys) => rpcCall("deleteManyMemory", { keys }),
    // #endregion
    // #region █████████ NGIN - LOCAL STORAGE ███████████████████████████████████████████████████████████████████████████████
    getLocalStorage: async (key) => await rpcCall("getLocalStorage", { key }),
    getManyLocalStorage: async (keys) => await rpcCall("getManyLocalStorage", { keys }),
    setLocalStorage: (key, value) => rpcCall("setLocalStorage", { key, value }),
    setManyLocalStorage: (entries) => rpcCall("setManyLocalStorage", { entries }),
    deleteLocalStorage: (key) => rpcCall("deleteLocalStorage", { key }),
    // #endregion
    // #region █████████ NGIN - SESSION STORAGE █████████████████████████████████████████████████████████████████████████████
    getSessionStorage: async (key) => await rpcCall("getSessionStorage", { key }),
    getManySessionStorage: async (keys) => await rpcCall("getManySessionStorage", { keys }),
    setSessionStorage: (key, value) => rpcCall("setSessionStorage", { key, value }),
    setManySessionStorage: (entries) => rpcCall("setManySessionStorage", { entries }),
    deleteSessionStorage: (key) => rpcCall("deleteSessionStorage", { key }),
    // #endregion
    // #region █████████ NGIN - COOKIES █████████████████████████████████████████████████████████████████████████████████████
    getCookie: async (key) => await rpcCall("getCookie", { key }),
    getManyCookie: async (keys) => await rpcCall("getManyCookie", { keys }),
    setCookie: (key, value, options) => rpcCall("setCookie", { key, value, options }),
    setManyCookie: (entries, options) => rpcCall("setManyCookie", { entries, options }),
    deleteCookie: (key, path, domain) => rpcCall("deleteCookie", { key, path, domain }),
    // #endregion
    // #region █████████ NGIN - SAURON ██████████████████████████████████████████████████████████████████████████████████████
    publish: (key, value, opts) => rpcCall("publish", { key, value, opts }),
    subscribe: (key, listener, opts) => rpcCall("subscribe", { key, listener, opts }),
    getAllSauron: async (opts) => await rpcCall("getAllSauron", { opts }),
    setSauron: (label, value, triggerRender = true, sl_reg, ms_reg, globalKey) => rpcCall("setSauron", { label, value, triggerRender, sl_reg, ms_reg, globalKey }),
    getSauron: async (label, sl_reg, ms_reg, globalKey) => await rpcCall("getSauron", { label, sl_reg, ms_reg, globalKey, }),
    subSauron: (label, fn, sl_reg, ms_reg, globalKey) => rpcCall("subSauron", { label, fn, sl_reg, ms_reg, globalKey, }),
    deleteSauron: (label, sl_reg, ms_reg, globalKey) => rpcCall("deleteSauron", { label, sl_reg, ms_reg, globalKey, }),
    subAllSauron: (fn, sl_reg, ms_reg, globalKey) => rpcCall("subAllSauron", { fn, sl_reg, ms_reg, globalKey, }),
    // #endregion
    // #region █████████ NGIN - SCOPED REGISTRY ████████████████████████████████████████████████████████████████████████████
    createRegistry: (name) => rpcCall("createRegistry", { name }),
    getRegistry: async (name) => await rpcCall("getRegistry", { name }),
    getAllRegistries: async () => await rpcCall("getAllRegistries", {}),
    getGR: async (label, registry) => await rpcCall("getGR", { label, registry }),
    // #endregion
    // #region █████████ NGIN - HYPER SCOPED REGISTRY ██████████████████████████████████████████████████████████████████████
    createScopedReg: async (name) => await rpcCall("createScopedReg", { name }),
    // #endregion
    // #region █████████ NGIN - BINARY ██████████████████████████████████████████████████████████████████████████████████████
    getBinary: async (key) => await rpcCall("getBinary", { key }),
    setBinary: (key, value) => rpcCall("setBinary", { key, value }),
    deleteBinary: (key) => rpcCall("deleteBinary", { key }),
    // #endregion
    // #region █████████ NGIN - GLOBAL THIS █████████████████████████████████████████████████████████████████████████████████
    setGT: (label, value) => rpcCall("setGT", { label, value }),
    setManyGT: (entries) => rpcCall("setManyGT", { entries }),
    getGT: async (label) => await rpcCall("getGT", { label }),
    getManyGT: async (keys) => await rpcCall("getManyGT", { keys }),
    deleteGT: (label) => rpcCall("deleteGT", { label }),
    deleteManyGT: (keys) => rpcCall("deleteManyGT", { keys }),
    // #endregion
    // #region █████████ NGIN - DB ██████████████████████████████████████████████████████████████████████████████████████████
    get: (key, global = false) => rpcCall("get", { key, global }),
    getMany: (keys, global = false) => rpcCall("getMany", { keys, global }),
    set: (key, value, global = false) => rpcCall("set", { key, value, global }),
    setMany: (entries, global = false) => rpcCall("setMany", { entries, global }),
    delete: (key, global = false) => rpcCall("delete", { key, global }),
    deleteMany: (keys, global = false) => rpcCall("deleteMany", { keys, global }),
    // #endregion
    // #region █████████ NGIN - TIMING ██████████████████████████████████████████████████████████████████████████████████████
    expire: (key, ms) => rpcCall("expire", { key, ms }),
    expireAt: (key, ts) => rpcCall("expireAt", { key, ts }),
    persist: (key) => rpcCall("persist", { key }),
    touch: (key, ms) => rpcCall("touch", { key, ms }),
    lock: {
        acquire: (key, ms) => rpcCall("lock:acquire", { key, ms }),
        release: (key, owner) => rpcCall("lock:release", { key, owner }),
        renew: (key, owner, ms) => rpcCall("lock:renew", { key, owner, ms }),
    },
    // #endregion
    // #region █████████ NGIN - OTHER ███████████████████████████████████████████████████████████████████████████████████████
    transaction: (ops) => rpcCall("transaction", { ops }),
    batch: (entries) => rpcCall("kvdb:batch", { entries }),
    live: (key, initial) => rpcCall("kvdb:live", { key, initial }),
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
    },
    watch: (key, handler) => rpcCall("watch", { key, handler }),
    watchMany: (keys, handler) => rpcCall("watchMany", { keys, handler }),
    watchPattern: (pattern, handler) => rpcCall("watchPattern", { pattern, handler }),
    watchPrefix: (prefix, handler) => rpcCall("watchPrefix", { prefix, handler }),
    watchAll: (handler) => rpcCall("watchAll", { handler }),
    sync: (key, options) => rpcCall("sync", { key, options }),
    setIfChanged: (key, value) => rpcCall("setIfChanged", { key, value }),
    use: (mw) => rpcCall("use", { mw }),
    scoped: (workspaceName) => rpcCall("scoped", { workspaceName }),
    scope: (prefix) => rpcCall("scope", { prefix }),
    close: () => rpcCall("close", {}),
    useLive: () => rpcCall("useLive", {}),
    matchesQuery: (v, expr) => rpcCall("matchesQuery", { v, expr }),
    // #endregion
};
export { staff as cse, kvdb as ngin };
// #endregion
// #region █████████ USE STAFF KVDB ██████████████████████████████████████████████████████████████████████████████████████████
export function useCSENGIN() {
    return {
        // #region █████████ BASE FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████████████████
        sendsub: (rt, ms, p, ttl, binary = false) => channelRpc("sendsub", rt, ms, { p, ttl, binary }),
        multisub: (rt, ms, handler) => {
            const unsub = addHandler('multisub', rt, ms, { handler });
            channelRpc("multisub", rt, ms);
            return () => {
                unsub();
                channelRpc("unsub", rt, ms);
            };
        },
        // #endregion
        // #region █████████ STREAMS ███████████████████████████████████████████████████████████████████████████████████████████████████████
        stream: (rt, ms, p, onChunk) => rpcStreamCall("stream", onChunk, { rt, ms, p }),
        streamHandler: (rt, ms, handler, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
        streamChunk: (rt, ms, streamId, chunk, binary = false) => rpcCall("streamChunk", { rt, ms, streamId, chunk, binary }),
        streamDone: (rt, ms, streamId, binary = false) => rpcCall("streamDone", { rt, ms, streamId, binary }),
        cancelStream: (rt, ms, streamId, binary = false) => rpcCall("cancelStream", { rt, ms, streamId, binary }),
        syncStream: (rt, ms, p, onChunk, binary = false) => rpcStreamCall("stream", onChunk, { rt, ms, p, binary }),
        syncStreamHandler: (rt, ms, handler, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
        streamRelay: (rt, ms, p, onChunk) => rpcStreamCall("streamRelay", onChunk, { rt, ms, p }),
        openSyncStream: (rt, ms, p, onChunk) => rpcStreamCall("openSyncStream", onChunk, { rt, ms, p }),
        openSyncStreamHandler: (rt, ms, handler) => addHandler("openSyncStreamHandler", rt, ms, { handler }),
        priorityStream: (rt, ms, p, onChunk) => rpcStreamCall("priorityStream", onChunk, { rt, ms, p }),
        priorityStreamHandler: (rt, ms, handler) => addHandler("priorityStreamHandler", rt, ms, { handler }),
        duplexStream: (rt, ms, p, onChunk) => rpcStreamCall("duplexStream", onChunk, { rt, ms, p }),
        duplexStreamHandler: (rt, ms, handler) => addHandler("duplexStreamHandler", rt, ms, { handler }),
        transactionalStream: (rt, ms, p, onChunk) => rpcStreamCall("transactionalStream", onChunk, { rt, ms, p }),
        transactionalStreamHandler: (rt, ms, handler) => addHandler("transactionalStreamHandler", rt, ms, { handler }),
        deltaStream: (rt, ms, p, onChunk) => rpcStreamCall("deltaStream", onChunk, { rt, ms, p }),
        deltaStreamHandler: (rt, ms, handler) => addHandler("deltaStreamHandler", rt, ms, { handler }),
        presenceStream: (rt, ms, p, onChunk) => rpcStreamCall("presenceStream", onChunk, { rt, ms, p }),
        presenceStreamHandler: (rt, ms, handler) => addHandler("presenceStreamHandler", rt, ms, { handler }),
        authorityStream: (rt, ms, p, onChunk) => rpcStreamCall("authorityStream", onChunk, { rt, ms, p }),
        authorityStreamHandler: (rt, ms, handler) => addHandler("authorityStreamHandler", rt, ms, { handler }),
        compressionStream: (rt, ms, p, onChunk) => rpcStreamCall("compressionStream", onChunk, { rt, ms, p }),
        compressionStreamHandler: (rt, ms, handler) => addHandler("compressionStreamHandler", rt, ms, { handler }),
        heatbeatStream: (rt, ms, p, onChunk) => rpcStreamCall("heatbeatStream", onChunk, { rt, ms, p }),
        // heatbeatStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("heatbeatStreamHandler", rt, ms, handler),
        backPressureStream: (rt, ms, p, onChunk) => rpcStreamCall("backPressureStream", onChunk, { rt, ms, p }),
        backPressureStreamHandler: (rt, ms, handler) => addHandler("backPressureStreamHandler", rt, ms, { handler }),
        statefulStream: (rt, ms, p, onChunk) => rpcStreamCall("statefulStream", onChunk, { rt, ms, p }),
        statefulStreamHandler: (rt, ms, handler) => addHandler("statefulStreamHandler", rt, ms, { handler }),
        multicastStream: (rt, ms, p, onChunk) => rpcStreamCall("multicastStream", onChunk, { rt, ms, p }),
        multicastStreamHandler: (rt, ms, handler) => addHandler("multicastStreamHandler", rt, ms, { handler }),
        partitionedStream: (rt, ms, p, onChunk) => rpcStreamCall("partitionedStream", onChunk, { rt, ms, p }),
        partitionedStreamHandler: (rt, ms, handler) => addHandler("partitionedStreamHandler", rt, ms, { handler }),
        batchStream: (rt, ms, p, onChunk) => rpcStreamCall("batchStream", onChunk, { rt, ms, p }),
        batchStreamHandler: (rt, ms, handler) => addHandler("batchStreamHandler", rt, ms, { handler }),
        filteredStream: (rt, ms, p, onChunk) => rpcStreamCall("filteredStream", onChunk, { rt, ms, p }),
        filteredStreamHandler: (rt, ms, handler) => addHandler("filteredStreamHandler", rt, ms, { handler }),
        deadLetterStream: (rt, ms, p, onChunk) => rpcStreamCall("deadLetterStream", onChunk, { rt, ms, p }),
        deadLetterStreamHandler: (rt, ms, handler) => addHandler("deadLetterStreamHandler", rt, ms, { handler }),
        idempotentStream: (rt, ms, p, onChunk) => rpcStreamCall("idempotentStream", onChunk, { rt, ms, p }),
        idempotentStreamHandler: (rt, ms, handler) => addHandler("idempotentStreamHandler", rt, ms, { handler }),
        lateArrivalStream: (rt, ms, p, onChunk) => rpcStreamCall("lateArrivalStream", onChunk, { rt, ms, p }),
        lateArrivalStreamHandler: (rt, ms, handler) => addHandler("lateArrivalStreamHandler", rt, ms, { handler }),
        checkpointStream: (rt, ms, p, onChunk) => rpcStreamCall("checkpointStream", onChunk, { rt, ms, p }),
        checkpointStreamHandler: (rt, ms, handler) => addHandler("checkpointStreamHandler", rt, ms, { handler }),
        rateLimitedStream: (rt, ms, p, onChunk) => rpcStreamCall("rateLimitedStream", onChunk, { rt, ms, p }),
        rateLimitedStreamHandler: (rt, ms, handler) => addHandler("rateLimitedStreamHandler", rt, ms, { handler }),
        comboStream: (rt, ms, p, onChunk) => rpcStreamCall("comboStream", onChunk, { rt, ms, p }),
        comboStreamHandler: (rt, ms, handler) => addHandler("comboStreamHandler", rt, ms, { handler }),
        transformStream: (rt, ms, p, onChunk) => rpcStreamCall("transformStream", onChunk, { rt, ms, p }),
        transformStreamHandler: (rt, ms, handler) => addHandler("transformStreamHandler", rt, ms, { handler }),
        fanoutStream: (rt, ms, p, onChunk) => rpcStreamCall("fanoutStream", onChunk, { rt, ms, p }),
        fanoutStreamHandler: (rt, ms, handler) => addHandler("fanoutStreamHandler", rt, ms, { handler }),
        useLiveStream: (rt, ms, p, onChunk) => rpcStreamCall("useLiveStream", onChunk, { rt, ms, p }),
        useLiveStreamHandler: (rt, ms, handler) => addHandler("useLiveStreamHandler", rt, ms, { handler }),
        useLiveSyncStream: (rt, ms, p, onChunk) => rpcStreamCall("useLiveSyncStream", onChunk, { rt, ms, p }),
        useLiveSyncHandler: (rt, ms, handler) => addHandler("useLiveSyncHandler", rt, ms, { handler }),
        // #endregion
        // #region █████████ DUPLEX ███████████████████████████████████████████████████████████████████████████████████████████████████████
        duplex: (rt, ms, opts, type) => streamRpc("duplex", rt, ms, { opts, type }),
        openStream: (rt, ms, opts) => streamRpc("openStream", rt, ms, { opts, }),
        sx: (rt, ms, opts, type) => createDuplexRpcProxy("sx", rt, ms, { opts, type }),
        sxHandler: (rt, ms, opts, type) => createDuplexRpcProxy("sxHandler", rt, ms, { opts, type }),
        // #endregion
        // #region █████████ DRSS - DISTRBUTED REACTIVE STATE STREAMS ███████████████████████████████████████████████████████████████████████████████████████████████████████
        useDRSS: () => anyRpc("useDRSS", '', ''),
        useDRSSHandler: () => anyRpc("useDRSSHandler", '', ''),
        useDRSSSync: () => anyRpc("useDRSSSync", '', ''),
        useDRSSSyncHandler: () => anyRpc("useDRSSSyncHandler", '', ''),
        // #endregion
        // #region █████████ DRS ███████████████████████████████████████████████████████████████████████████████████████████████████████
        useObservableState: (rt, ms, initial) => anyRpc("useObservableState", rt, ms, initial),
        useOptimisticState: (rt, ms, initial) => anyRpc("useOptimisticState", rt, ms, initial),
        DRS: (rt, ms, initial) => anyRpc("DRS", rt, ms, initial),
        live: (rt, ms, initial) => anyRpc("live", rt, ms, initial),
        useLive: (rt, ms, initial) => anyRpc("useLive", rt, ms, initial),
        useDRS: (rt, ms, initial) => anyRpc("useDRS", rt, ms, initial),
        stateLive: (rt, ms, initial) => anyRpc("stateLive", rt, ms, initial),
        stateDRS: (rt, ms, initial) => anyRpc("stateDRS", rt, ms, initial),
        useStateCRDT: (rt, ms, initial) => anyRpc("useStateCRDT", rt, ms, initial),
        useStateDRS: (rt, ms, initial) => anyRpc("useStateDRS", rt, ms, initial),
        useRefDRS: (rt, ms, initial) => anyRpc("useRefDRS", rt, ms, initial),
        useUmbrellaDRS: (rt, ms, initial) => anyRpc("useUmbrellaDRS", rt, ms, initial),
        useContextDRS: (rt, ms, initial) => anyRpc("useContextDRS", rt, ms, initial),
        DRSStore: (rt, ms, initial) => anyRpc("DRSStore", rt, ms, initial),
        useDRSStore: (rt, ms, initial) => anyRpc("useDRSStore", rt, ms, initial),
        useEffectDRS: (rt, ms, effect, deps = []) => anyRpc("useEffectDRS", rt, ms, { effect, deps }),
        useAutoEffectDRS: (rt, ms, effect, deps = []) => anyRpc("useAutoEffectDRS", rt, ms, { effect, deps }),
        useDeferredValueDRS: (rt, ms) => anyRpc("useDeferredValueDRS", rt, ms),
        useImperativeHandleDRS: (ref, rt, ms, createHandle, deps = []) => anyRpc("useImperativeHandleDRS", rt, ms, { ref, createHandle, deps }),
        useMemoDRS: (sources, compute) => anyRpc("useMemoDRS", "", "", { sources, compute }),
        useReverseHeartbeat: (rt, ms, nodeId, resetIntervalMs) => anyRpc("useReverseHeartbeat", rt, ms, { nodeId, resetIntervalMs }),
        useDRSDBRaft: (rt, ms, initial) => anyRpc("useDRSDBRaft", rt, ms, { initial }),
        useRxDBRaft: (rt, ms, initial, db = 'kvdb') => anyRpc("useRxDBRaft", rt, ms, { initial, db }),
        useDRSDBYata: (rt, ms) => anyRpc("useDRSDBYata", rt, ms),
        useRxDBYata: (rt, ms, initial, db = 'kvdb') => anyRpc("useRxDBYata", rt, ms, { initial, db }),
        useRTDB: (rt, ms, initial, db = 'kvdb') => anyRpc("useRTDB", rt, ms, { initial, db }),
        drsdb: (rt, ms, initial) => anyRpc("drsdb", rt, ms, { initial }),
        useDRSDB: (rt, ms, initial) => anyRpc("useDRSDB", rt, ms, { initial }),
        useDRSDBOptimistic: (rt, ms, initial) => anyRpc("useDRSDBOptimistic", rt, ms, { initial }),
        useDRSDBCRDT: () => anyRpc("useDRSDBCRDT", '', ''),
        rtdbStream: () => anyRpc("useDRSDBCRDT", '', ''),
        drsdbStream: () => anyRpc("useDRSDBCRDT", '', ''),
        // #endregion
        // #region █████████ CONDITIONALS ███████████████████████████████████████████████████████████████████████████████████████████████████████
        barrier: (rt, ms, participantId, total, options = {}) => anyRpc("barrier", rt, ms, { participantId, total, options }),
        latch: (rt, ms) => anyRpc("latch", rt, ms),
        gateMaster: (rt, ms, gatesFactory, options = { concurrency: true }) => anyRpc("gateMaster", rt, ms, { gatesFactory, options }),
        gateMaster2: (rt, ms, gates) => anyRpc("gateMaster2", rt, ms, { gates }),
        floodGateWithLive: () => anyRpc("floodGateWithLive", '', ''),
        plinko: (rt, ms, initialState, tree, options = {}) => anyRpc("plinko", rt, ms, { initialState, tree, options }),
        plinko3: (rt, ms) => anyRpc("plinko3", rt, ms),
        plinko2: (rt, ms, tree, options = {}) => anyRpc("plinko2", rt, ms, tree, options),
        getCircuitBreaker: (rt, options) => anyRpc("getCircuitBreaker", rt, options),
        circuitBreaker: (rt, ms, operation, options) => anyRpc("circuitBreaker", rt, ms, operation, options),
        conditionVariable: (rt, ms, raft, nodeId) => anyRpc("conditionVariable", rt, ms, raft, nodeId),
        // #endregion
        // #region █████████ SPECIALTY ███████████████████████████████████████████████████████████████████████████████████████████████████████
        worker: () => anyRpc("worker", '', ''),
        cron: () => anyRpc("cron", '', ''),
        fusebox: (rt, ms, options = {}) => anyRpc("fusebox", rt, ms, options),
        tripwire: (rt, ms, stateTarget, options = {}) => anyRpc("tripwire", rt, ms, stateTarget, options),
        fathom: (rt, ms, options = {}) => anyRpc("fathom", rt, ms, options),
        rigging: () => anyRpc("rigging", "", ""),
        circus: (rt, ms, options = {}) => anyRpc("circus", rt, ms, options),
        nebula: (rt, ms, options = {}) => anyRpc("nebula", rt, ms, options),
        cyclone: (rt, ms, options = {}) => anyRpc("cyclone", rt, ms, options),
        trident: (rt, ms, options = {}) => anyRpc("trident", rt, ms, options),
        anchor: (rt, ms, options = {}) => anyRpc("anchor", rt, ms, options),
        pipeline: (rt, ms) => anyRpc("pipeline", rt, ms),
        tide: (rt, ms, options) => anyRpc("tide", rt, ms, options),
        mesh: (rt, ms, options) => anyRpc("mesh", rt, ms, options),
        echo: (rt, ms) => anyRpc("echo", rt, ms),
        carousel: (rt, ms, options = {}) => anyRpc("carousel", rt, ms, options),
        synapse: (localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options = {}) => anyRpc("synapse", localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options),
        abortableFlight: (rt, ms) => anyRpc("abortableFlight", rt, ms),
        tokenBucket: (rt, ms, options = {}) => anyRpc("tokenBucket", rt, ms, options),
        tokenBucket_simple: (maxTokens, refillRateMs) => anyRpc("tokenBucket_simple", "", "", maxTokens, refillRateMs),
        resilience: (rt, ms, options = {}) => anyRpc("resilience", rt, ms, options),
        saga: (sagaId, ms, context) => anyRpc("saga", sagaId, ms, context),
        ecs: (rt, ms) => anyRpc("ecs", rt, ms),
        commandBuffer: (rt, ms, options) => anyRpc("commandBuffer", rt, ms, options),
        reactor: (rt, ms, config) => anyRpc("reactor", rt, ms, config),
        blackboard: (rt, ms) => anyRpc("blackboard", rt, ms),
        snapshotIsolation: (rt, ms, options) => anyRpc("snapshotIsolation", rt, ms, options),
        smartBeacon: (rt, ms, set_pulse) => anyRpc("smartBeacon", rt, ms, set_pulse),
        crdt: (rt, ms, initial) => anyRpc("crdt", rt, ms, initial),
        useCrdt: (rt, ms, initial) => anyRpc("useCrdt", rt, ms, initial),
        createCRDTChannel: (rt, ms, initial, syncEngine) => anyRpc("createCRDTChannel", rt, ms, initial, syncEngine),
        notifications: (rt, ms) => anyRpc("notifications", rt, ms),
        useNotifications: (rt, ms) => anyRpc("useNotifications", rt, ms),
        config: (namespace, ms, defaultConfig) => anyRpc("config", namespace, ms, defaultConfig),
        useConfig: (namespace, ms, defaultConfig) => anyRpc("useConfig", namespace, ms, defaultConfig),
        useFeatureFlag: (flag, ms, defaultValue) => anyRpc("useFeatureFlag", flag, ms, defaultValue),
        lock: (rt, ms, resourceId, ttl) => anyRpc("lock", rt, ms, resourceId, ttl),
        mapReduce: (rt, ms, mapper, reducer, initial, timeoutMs) => anyRpc("mapReduce", rt, ms, mapper, reducer, initial, timeoutMs),
        rateLimit: (rt, ms, key, maxRequests, windowMs) => anyRpc("rateLimit", rt, ms, key, maxRequests, windowMs),
        appendOnlyLog: (rt, ms, options) => anyRpc("appendOnlyLog", rt, ms, options),
        // #endregion
        // #region █████████ JTF2 LEVEL ANALOGY BASED FEATURES ███████████████████████████████████████████████████████████████████████████████████████████████████████
        harbormaster: (rt, ms, options = {}) => anyRpc("harbormaster", rt, ms, options),
        beacon: (rt, ms, set_pulse) => anyRpc("beacon", rt, ms, set_pulse),
        vessel: (rt, ms, set_pulse) => anyRpc("vessel", rt, ms, set_pulse),
        dock: (rt, ms) => anyRpc("dock", rt, ms),
        radar: (rt, ms, set_pulse, vessel_id) => anyRpc("radar", rt, ms, set_pulse, vessel_id),
        torpedo: (rt, ms, p, timeoutMs) => anyRpc("torpedo", rt, ms, p, timeoutMs),
        convoy: (rt, ms, nodeId, heartbeatInterval, dropThreshold) => anyRpc("convoy", rt, ms, nodeId, heartbeatInterval, dropThreshold),
        sonar: (rt, ms, set_pulse) => anyRpc("sonar", rt, ms, set_pulse),
        heartbeat: (rt, ms, interval, timeout) => anyRpc("heartbeat", rt, ms, interval, timeout),
        watchdog: (rt, ms, options = {}) => anyRpc("watchdog", rt, ms, options),
        singleFlight: (key, task) => anyRpc("singleFlight", "", "", key, task),
        transaction: (rt, ms, operations) => anyRpc("transaction", rt, ms, operations),
        autoFederate: (rt, ms, options = {}) => anyRpc("autoFederate", rt, ms, options),
        visualFlow: (rt, ms, nodes) => anyRpc("visualFlow", rt, ms, nodes),
        // #endregion
        // #region █████████ EPHEMERAL STATE ███████████████████████████████████████████████████████████████████████████████████████████████████████
        shadowState: (key, initial) => anykeyRpc("shadowState", key, initial),
        useShadowState: (key, initial) => anykeyRpc("useShadowState", key, initial),
        shadowStateWithTTL: (key, initial, ttlMs) => anykeyRpc("shadowStateWithTTL", key, initial, ttlMs),
        batchShadowState: (key, initial, options = {}) => anykeyRpc("batchShadowState", key, initial, options),
        // #endregion
        // #region █████████ NORMAL FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████████████████
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
        use: (rt, fn) => rpcCall("use", { rt, fn: fn.toString() }),
        useGlobal: (mw) => rpcCall("useGlobal", { mw }),
        send: (rt, ms, p, ttl, binary = false) => rpcCall("send", { rt, ms, p, ttl, binary }),
        sub: async (rt, ms, handler) => {
            const subId = (await rpcCall("sub", { rt, ms }));
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
        // #endregion
        // #region █████████ NGIN - MEMORY / CACHE ███████████████████████████████████████████████████████████████████████████████████████████████████████
        getMemory: async (key) => await rpcCall("getMemory", { key }),
        getManyMemory: async (keys) => await rpcCall("getManyMemory", { keys }),
        setMemory: (key, value) => rpcCall("setMemory", { key, value }),
        setManyMemory: (entries) => rpcCall("setManyMemory", { entries }),
        deleteMemory: (key) => rpcCall("deleteMemory", { key }),
        deleteManyMemory: (keys) => rpcCall("deleteManyMemory", { keys }),
        // #endregion
        // #region █████████ NGIN - LOCAL STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
        getLocalStorage: async (key) => await rpcCall("getLocalStorage", { key }),
        getManyLocalStorage: async (keys) => await rpcCall("getManyLocalStorage", { keys }),
        setLocalStorage: (key, value) => rpcCall("setLocalStorage", { key, value }),
        setManyLocalStorage: (entries) => rpcCall("setManyLocalStorage", { entries }),
        // #endregion
        // #region █████████ NGIN - SESSION STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
        getSessionStorage: async (key) => await rpcCall("getSessionStorage", { key }),
        getManySessionStorage: async (keys) => await rpcCall("getManySessionStorage", { keys }),
        setSessionStorage: (key, value) => rpcCall("setSessionStorage", { key, value }),
        setManySessionStorage: (entries) => rpcCall("setManySessionStorage", { entries }),
        deleteSessionStorage: (key) => rpcCall("deleteSessionStorage", { key }),
        // #endregion
        // #region █████████ NGIN - COOKIES ███████████████████████████████████████████████████████████████████████████████████████████████████████
        getCookie: async (key) => await rpcCall("getCookie", { key }),
        getManyCookie: async (keys) => await rpcCall("getManyCookie", { keys }),
        setCookie: (key, value, options) => rpcCall("setCookie", { key, value, options }),
        setManyCookie: (entries, options) => rpcCall("setManyCookie", { entries, options }),
        deleteCookie: (key, path, domain) => rpcCall("deleteCookie", { key, path, domain }),
        // #endregion
        // #region █████████ NGIN - SAURON ███████████████████████████████████████████████████████████████████████████████████████████████████████
        publish: (key, value, opts) => rpcCall("publish", { key, value, opts }),
        subscribe: (key, listener, opts) => rpcCall("subscribe", { key, listener, opts }),
        getAllSauron: async (opts) => await rpcCall("getAllSauron", { opts }),
        setSauron: (label, value, triggerRender = true, sl_reg, ms_reg, globalKey) => rpcCall("setSauron", { label, value, triggerRender, sl_reg, ms_reg, globalKey }),
        getSauron: async (label, sl_reg, ms_reg, globalKey) => await rpcCall("getSauron", { label, sl_reg, ms_reg, globalKey, }),
        subSauron: (label, fn, sl_reg, ms_reg, globalKey) => rpcCall("subSauron", { label, fn, sl_reg, ms_reg, globalKey, }),
        deleteSauron: (label, sl_reg, ms_reg, globalKey) => rpcCall("deleteSauron", { label, sl_reg, ms_reg, globalKey, }),
        subAllSauron: (fn, sl_reg, ms_reg, globalKey) => rpcCall("subAllSauron", { fn, sl_reg, ms_reg, globalKey, }),
        // #endregion
        // #region █████████ NGIN - SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
        createRegistry: (name) => rpcCall("createRegistry", { name }),
        getRegistry: async (name) => await rpcCall("getRegistry", { name }),
        getAllRegistries: async () => await rpcCall("getAllRegistries", {}),
        getGR: async (label, registry) => await rpcCall("getGR", { label, registry }),
        // #endregion
        // #region █████████ NGIN - HYPER SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
        createScopedReg: async (name) => await rpcCall("createScopedReg", { name }),
        // #endregion
        // #region █████████ NGIN - BINARY ███████████████████████████████████████████████████████████████████████████████████████████████████████
        getBinary: async (key) => await rpcCall("getBinary", { key }),
        setBinary: (key, value) => rpcCall("setBinary", { key, value }),
        deleteBinary: (key) => rpcCall("deleteBinary", { key }),
        // #endregion
        // #region █████████ NGIN - GLOBAL THIS ███████████████████████████████████████████████████████████████████████████████████████████████████████
        setGT: (label, value) => rpcCall("setGT", { label, value }),
        setManyGT: (entries) => rpcCall("setManyGT", { entries }),
        getGT: async (label) => await rpcCall("getGT", { label }),
        getManyGT: async (keys) => await rpcCall("getManyGT", { keys }),
        deleteGT: (label) => rpcCall("deleteGT", { label }),
        deleteManyGT: (keys) => rpcCall("deleteManyGT", { keys }),
        // #endregion
        // #region █████████ NGIN - DB ███████████████████████████████████████████████████████████████████████████████████████████████████████
        get: (key, global = false) => rpcCall("get", { key, global }),
        getMany: (keys, global = false) => rpcCall("getMany", { keys, global }),
        set: (key, value, global = false) => rpcCall("set", { key, value, global }),
        setMany: (entries, global = false) => rpcCall("setMany", { entries, global }),
        delete: (key, global = false) => rpcCall("delete", { key, global }),
        deleteMany: (keys, global = false) => rpcCall("deleteMany", { keys, global }),
        // #endregion
        // #region █████████ NGIN - TIMING ███████████████████████████████████████████████████████████████████████████████████████████████████████
        expire: (key, ms) => rpcCall("expire", { key, ms }),
        expireAt: (key, ts) => rpcCall("expireAt", { key, ts }),
        persist: (key) => rpcCall("persist", { key }),
        touch: (key, ms) => rpcCall("touch", { key, ms }),
        ngin_lock: {
            acquire: (key, ms) => rpcCall("lock:acquire", { key, ms }),
            release: (key, owner) => rpcCall("lock:release", { key, owner }),
            renew: (key, owner, ms) => rpcCall("lock:renew", { key, owner, ms }),
        },
        // #endregion
        // #region █████████ NGIN - OTHER ███████████████████████████████████████████████████████████████████████████████████████████████████████
        ngin_transaction: (ops) => rpcCall("transaction", { ops }),
        ngin_batch: (entries) => rpcCall("kvdb:batch", { entries }),
        ngin_live: (key, initial) => rpcCall("kvdb:live", { key, initial }),
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
        // #endregion
    };
}
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[RETURN_OUTPUT]',  COMMAND:commmand })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: "powershellCommand", COMMAND:COMMAND })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: "powershellCommand", COMMAND:COMMAND, TARGET_DIR: TARGET_DIR, ARGS: ARGS })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[RUN_PS_DEV_SERVER]',  COMMAND:COMMAND })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[CREATE_TERMINAL]',  TARGET_DIR:cwd })
export async function exeCmd(command, targetDir, type, args, timeout = 2000) {
    const result = await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: type, COMMAND: command, TARGET_DIR: targetDir, ARGS: args });
    return result;
}
export async function exeVSCCmd(command, args) {
    const result = await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: 'command', COMMAND: command, ARGS: args });
    return result;
}
// #endregion
