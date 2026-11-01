import { WebSocketServer, WebSocket } from 'ws';
import * as vscode from 'vscode';
import { reliableSocket } from './ws-reliable-socket';
import { deleteSauron, getSauron, setSauron } from '../rxcdb/the_one';
let wssSingleton = null;
let supervisorStarted = false;
let isMaster = false;
let isClientConnected = false;
let failureCount = 0;
const clientSockets = new Map();
function routeKey(clientId, id) { return `cse:response-router:${clientId}:${id}`; }
function getCurrentWorkspaceName() { return vscode.workspace.workspaceFolders?.[0]?.name ?? 'unknown-instance'; }
async function sweepStaleRoutes() {
    const entries = cloudState.getByPrefix('cse:response-router:');
    for (const { key, value: originId } of entries) {
        const socket = clientSockets.get(originId);
        const alive = socket && socket.readyState === WebSocket.OPEN;
        if (!alive)
            cloudState.delete(key);
    }
}
export function crossCseNginConnect(staff, port, ngin) {
    if (wssSingleton)
        return wssSingleton;
    try {
        const wss = new WebSocketServer({ port });
        wssSingleton = wss;
        setupServer(wss, staff, ngin);
        isMaster = true;
    }
    catch (err) {
        if (err.code === "EADDRINUSE") {
            startSupervisor(port, staff, ngin);
            return null;
        }
        throw err;
    }
    startSupervisor(port, staff, ngin);
    return wssSingleton;
}
function startSupervisor(port, staff, ngin) {
    if (supervisorStarted)
        return;
    supervisorStarted = true;
    setInterval(async () => {
        const alive = await canConnectToServer(port);
        if (alive) {
            failureCount = 0;
            if (isMaster)
                return;
            if (isClientConnected)
                return;
            connectAsClient(port, staff, ngin);
            isClientConnected = true;
            isMaster = false;
            return;
        }
        // Master is down. Increment the failure count.
        failureCount++;
        const wsName = vscode.workspace.workspaceFolders?.[0]?.name;
        const allowedMissedChecks = (wsName.length % 3) + 1;
        // Sit tight until this specific window reaches its designated fallback slot
        if (failureCount < allowedMissedChecks) {
            return;
        }
        // This window's turn has arrived. Reset state and attempt takeover.
        isClientConnected = false;
        failureCount = 0;
        try {
            const wss = new WebSocketServer({ port });
            wssSingleton = wss;
            setupServer(wss, staff, ngin);
            isMaster = true;
            console.log(`[Supervisor] ${wsName} successfully claimed the master slot.`);
        }
        catch (err) {
            if (err.code === "EADDRINUSE") {
                // Someone else claimed it first! Fall back to client state smoothly
                connectAsClient(port, staff, ngin);
                isClientConnected = true;
                isMaster = false;
                return null;
            }
            throw err;
        }
    }, 30000);
}
function canConnectToServer(port) {
    return new Promise((resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`);
        ws.onopen = () => { ws.close(); resolve(true); };
        ws.onerror = () => resolve(false);
    });
}
function connectAsClient1(port, staff, ngin) {
    const currentWorkspaceName = getCurrentWorkspaceName();
    const existingSocket = clientSockets.get(currentWorkspaceName);
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN)
        return;
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    clientSockets.set(currentWorkspaceName, ws);
    ws.on("open", () => {
        console.log(`[RPC CLIENT] Workspace "${currentWorkspaceName}" connected to Master Hub on port ${port}`);
        ws.send(JSON.stringify({
            type: "rpc",
            id: Date.now(),
            method: "register",
            args: [currentWorkspaceName]
        }));
        // Pipe internal outgoing staff logic up through our master server link
        if (staff.registerAdapter) {
            staff.registerAdapter({
                id: `client:${currentWorkspaceName}`,
                onMessage: (cb) => {
                    const handler = (event) => {
                        try {
                            const data = JSON.parse(event.data.toString());
                            if (data.type === "staff:routed" || data.type === "staff:event") {
                                cb(data.p);
                            }
                        }
                        catch { }
                    };
                    ws.on("message", handler);
                    return () => ws.off("message", handler);
                },
                send: (rt, p) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: "rpc",
                            id: Date.now(),
                            method: "send",
                            args: [rt, { ...p, ws: currentWorkspaceName }],
                            ws: currentWorkspaceName
                        }));
                    }
                }
            });
        }
    });
    ws.on("message", async (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            // Handle targeted calls fired directly down from master server to this cross-process window
            if (msg.type === "rpc" && msg.method) {
                const targetEngine = (msg.method.startsWith('ngin:') || msg.method in ngin) ? ngin : staff;
                const fn = targetEngine[msg.method];
                if (fn) {
                    try {
                        const result = await fn(...(msg.args || []));
                        ws.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: true, result }));
                    }
                    catch (err) {
                        ws.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: false, error: String(err?.message ?? err) }));
                    }
                }
            }
        }
        catch { }
    });
    ws.on("close", () => {
        clientSockets.delete(currentWorkspaceName);
        console.log(`[RPC CLIENT] Disconnected from Master Hub. Attempting retry...`);
        setTimeout(() => connectAsClient(port, staff, ngin), 5000);
    });
    ws.on("error", () => { ws.close(); });
}
function connectAsClient(port, staff, ngin) {
    const currentWorkspaceName = getCurrentWorkspaceName();
    const existingSocket = clientSockets.get(currentWorkspaceName);
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN)
        return;
    const conn = reliableSocket(`ws://127.0.0.1:${port}`, {
        queueKey: `cse:rpc-adapter:queue:${currentWorkspaceName}`,
    });
    conn.onOpen(() => {
        console.log(`[RPC CLIENT] Workspace "${currentWorkspaceName}" connected to Master Hub on port ${port}`);
        conn.send(JSON.stringify({
            type: "rpc",
            id: Date.now(),
            method: "register",
            clientId: currentWorkspaceName,
        }));
        if (staff.registerAdapter) {
            staff.registerAdapter({
                id: `client:${currentWorkspaceName}`,
                onMessage: (cb) => {
                    return conn.onMessage((raw) => {
                        try {
                            const data = JSON.parse(raw);
                            if (data.type === "staff:routed" || data.type === "staff:event")
                                cb(data.p);
                        }
                        catch { }
                    });
                },
                send: (rt, p) => {
                    conn.send(JSON.stringify({
                        type: "rpc",
                        id: Date.now(),
                        method: "send",
                        args: [rt, { ...p, ws: currentWorkspaceName }],
                        ws: currentWorkspaceName,
                    }));
                }
            });
        }
    });
    conn.onMessage(async (raw) => {
        try {
            const msg = JSON.parse(raw);
            if (msg.type === "rpc" && msg.method) {
                const targetEngine = (msg.method.startsWith('ngin:') || msg.method in ngin) ? ngin : staff;
                const fn = targetEngine[msg.method];
                if (fn) {
                    try {
                        const result = await fn(msg);
                        conn.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: true, result }));
                    }
                    catch (err) {
                        conn.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: false, error: String(err?.message ?? err) }));
                    }
                }
            }
        }
        catch { }
    });
    conn.onClose(() => {
        clientSockets.delete(currentWorkspaceName);
        console.log(`[RPC CLIENT] Disconnected from Master Hub. Reconnecting...`);
    });
    clientSockets.set(currentWorkspaceName, conn);
}
function setupServer(wss, staff, ngin) {
    const currentWorkspace = getCurrentWorkspaceName();
    sweepStaleRoutes();
    wss.on("connection", (socket) => {
        const subs = new Map();
        let subIdSeq = 1;
        let socketClientId = null;
        const send = (msg) => { if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify(msg)); };
        const rpcMethods = {
            register: (msg) => {
                const id = msg.clientId;
                socketClientId = id;
                clientSockets.set(id, socket);
                return { ok: true };
            },
            sendToClient: (clientId, rt, p) => {
                const target = clientSockets.get(clientId);
                if (!target || target.readyState !== WebSocket.OPEN)
                    return { ok: false };
                target.send(JSON.stringify({ type: "staff:routed", clientId, rt, p }));
                return { ok: true };
            },
            // #region █████████ BASE FUNCTIONS ██████████████████████████████████████████████████████████████████████████████████████████
            sendsub: (rt, ms, p, ttl, binary = false) => staff.sendsub(rt, ms, p, ttl, binary),
            multisub: (rt, ms, handler) => staff.multisub(rt, ms, handler),
            // #endregion
            // #region █████████ STREAMS ██████████████████████████████████████████████████████████████████████████████████████████████████
            stream: (rt, ms, p, onChunk, binary = false) => staff.stream(rt, ms, p, onChunk, binary),
            streamHandler: (rt, ms, handler, binary = false) => staff.streamHandler(rt, ms, handler, binary),
            streamChunk: (rt, ms, streamId, chunk, binary = false) => staff.streamChunk(rt, ms, streamId, chunk, binary),
            streamDone: (rt, ms, streamId, binary = false) => staff.streamDone(rt, ms, streamId, binary),
            cancelStream: (rt, ms, streamId, binary = false) => staff.cancelStream(rt, ms, streamId, binary),
            syncStream: (rt, ms, p, onChunk, binary = false) => staff.syncStream(rt, ms, p, onChunk, binary),
            syncStreamHandler: (rt, ms, handler, binary = false) => staff.syncStreamHandler(rt, ms, handler, binary),
            streamRelay: (rt, ms, p, onChunk) => staff.streamRelay(rt, ms, p, onChunk),
            openSyncStream: (rt, ms, p, onChunk) => staff.openSyncStream(rt, ms, p, onChunk),
            openSyncStreamHandler: (rt, ms, handler) => staff.openSyncStreamHandler(rt, ms, handler),
            priorityStream: (rt, ms, p, onChunk) => staff.priorityStream(rt, ms, p, onChunk),
            priorityStreamHandler: (rt, ms, handler) => staff.priorityStreamHandler(rt, ms, handler),
            duplexStream: (rt, ms, p, onChunk) => staff.duplexStream(rt, ms, p, onChunk),
            duplexStreamHandler: (rt, ms, handler) => staff.duplexStreamHandler(rt, ms, handler),
            transactionalStream: (rt, ms, p, onChunk) => staff.transactionalStream(rt, ms, p, onChunk),
            transactionalStreamHandler: (rt, ms, handler) => staff.transactionalStreamHandler(rt, ms, handler),
            deltaStream: (rt, ms, p, onChunk) => staff.deltaStream(rt, ms, p, onChunk),
            deltaStreamHandler: (rt, ms, handler) => staff.deltaStreamHandler(rt, ms, handler),
            presenceStream: (rt, ms, p, onChunk) => staff.presenceStream(rt, ms, p, onChunk),
            presenceStreamHandler: (rt, ms, handler) => staff.presenceStreamHandler(rt, ms, handler),
            authorityStream: (rt, ms, p, onChunk) => staff.authorityStream(rt, ms, p, onChunk),
            authorityStreamHandler: (rt, ms, handler) => staff.authorityStreamHandler(rt, ms, handler),
            compressionStream: (rt, ms, p, onChunk) => staff.compressionStream(rt, ms, p, onChunk),
            compressionStreamHandler: (rt, ms, handler) => staff.compressionStreamHandler(rt, ms, handler),
            heatbeatStream: (rt, ms, p, onChunk) => staff.heatbeatStream(rt, ms, p, onChunk),
            heatbeatStreamHandler: (rt, ms, handler) => staff.heatbeatStreamHandler(rt, ms, handler),
            backPressureStream: (rt, ms, p, onChunk) => staff.backPressureStream(rt, ms, p, onChunk),
            backPressureStreamHandler: (rt, ms, handler) => staff.backPressureStreamHandler(rt, ms, handler),
            statefulStream: (rt, ms, p, onChunk) => staff.statefulStream(rt, ms, p, onChunk),
            statefulStreamHandler: (rt, ms, handler) => staff.statefulStreamHandler(rt, ms, handler),
            multicastStream: (rt, ms, p, onChunk) => staff.multicastStream(rt, ms, p, onChunk),
            multicastStreamHandler: (rt, ms, handler) => staff.multicastStreamHandler(rt, ms, handler),
            partitionedStream: (rt, ms, p, onChunk) => staff.partitionedStream(rt, ms, p, onChunk),
            partitionedStreamHandler: (rt, ms, handler) => staff.partitionedStreamHandler(rt, ms, handler),
            batchStream: (rt, ms, p, onChunk) => staff.batchStream(rt, ms, p, onChunk),
            batchStreamHandler: (rt, ms, handler) => staff.batchStreamHandler(rt, ms, handler),
            filteredStream: (rt, ms, p, onChunk) => staff.filteredStream(rt, ms, p, onChunk),
            filteredStreamHandler: (rt, ms, handler) => staff.filteredStreamHandler(rt, ms, handler),
            deadLetterStream: (rt, ms, p, onChunk) => staff.deadLetterStream(rt, ms, p, onChunk),
            deadLetterStreamHandler: (rt, ms, handler) => staff.deadLetterStreamHandler(rt, ms, handler),
            idempotentStream: (rt, ms, p, onChunk) => staff.idempotentStream(rt, ms, p, onChunk),
            idempotentStreamHandler: (rt, ms, handler) => staff.idempotentStreamHandler(rt, ms, handler),
            lateArrivalStream: (rt, ms, p, onChunk) => staff.lateArrivalStream(rt, ms, p, onChunk),
            lateArrivalStreamHandler: (rt, ms, handler) => staff.lateArrivalStreamHandler(rt, ms, handler),
            checkpointStream: (rt, ms, p, onChunk) => staff.checkpointStream(rt, ms, p, onChunk),
            checkpointStreamHandler: (rt, ms, handler) => staff.checkpointStreamHandler(rt, ms, handler),
            rateLimitedStream: (rt, ms, p, onChunk) => staff.rateLimitedStream(rt, ms, p, onChunk),
            rateLimitedStreamHandler: (rt, ms, handler) => staff.rateLimitedStreamHandler(rt, ms, handler),
            comboStream: (rt, ms, p, onChunk) => staff.comboStream(rt, ms, p, onChunk),
            comboStreamHandler: (rt, ms, handler) => staff.comboStreamHandler(rt, ms, handler),
            transformStream: (rt, ms, p, onChunk) => staff.transformStream(rt, ms, p, onChunk),
            transformStreamHandler: (rt, ms, handler) => staff.transformStreamHandler(rt, ms, handler),
            fanoutStream: (rt, ms, p, onChunk) => staff.fanoutStream(rt, ms, p, onChunk),
            fanoutStreamHandler: (rt, ms, handler) => staff.fanoutStreamHandler(rt, ms, handler),
            useLiveStream: (rt, ms, p, onChunk) => staff.useLiveStream(rt, ms, p, onChunk),
            useLiveStreamHandler: (rt, ms, handler) => staff.useLiveStreamHandler(rt, ms, handler),
            useLiveSyncStream: (rt, ms, p, onChunk) => staff.useLiveSyncStream(rt, ms, p, onChunk),
            useLiveSyncHandler: (rt, ms, handler) => staff.useLiveSyncHandler(rt, ms, handler),
            // #endregion
            // #region █████████ DUPLEX ███████████████████████████████████████████████████████████████████████████████████████████████████
            duplex: (rt, ms, opts, type) => staff.duplex(rt, ms, opts, type),
            openStream: (rt, ms, opts) => staff.openStream(rt, ms, opts),
            sx: (rt, ms, opts, type) => staff.sx(rt, ms, opts, type),
            sxHandler: (rt, ms, handlerFn, type) => staff.sxHandler(rt, ms, handlerFn, type),
            // #endregion
            // #region █████████ DRSS - DISTRBUTED REACTIVE STATE STREAMS ██████████████████████████████████████████████████████████████
            // #endregion
            // #region █████████ DRS ██████████████████████████████████████████████████████████████████████████████████████████████████████
            useObservableState: (rt, ms, initial) => staff.useObservableState(rt, ms, initial),
            useOptimisticState: (rt, ms, initial) => staff.useOptimisticState(rt, ms, initial),
            DRS: (rt, ms, initial) => staff.DRS(rt, ms, initial),
            live: (rt, ms, initial) => staff.live(rt, ms, initial),
            useLive: (rt, ms, initial) => staff.useLive(rt, ms, initial),
            useDRS: (rt, ms, initial) => staff.useDRS(rt, ms, initial),
            stateLive: (rt, ms, initial) => staff.stateLive(rt, ms, initial),
            stateDRS: (rt, ms, initial) => staff.stateDRS(rt, ms, initial),
            useStateCRDT: (rt, ms, initial) => staff.useStateCRDT(rt, ms, initial),
            useStateDRS: (rt, ms, initial) => staff.useStateDRS(rt, ms, initial),
            useRefDRS: (rt, ms, initial) => staff.useRefDRS(rt, ms, initial),
            useUmbrellaDRS: (rt, ms, initial) => staff.useUmbrellaDRS(rt, ms, initial),
            useContextDRS: (rt, ms, initial) => staff.useContextDRS(rt, ms, initial),
            DRSStore: (rt, ms, initial) => staff.DRSStore(rt, ms, initial),
            useDRSStore: (rt, ms, initial) => staff.useDRSStore(rt, ms, initial),
            useEffectDRS: (rt, ms, effect, deps = []) => staff.useEffectDRS(rt, ms, effect, deps),
            useAutoEffectDRS: (rt, ms, effect, deps = []) => staff.useAutoEffectDRS(rt, ms, effect, deps),
            useDeferredValueDRS: (rt, ms) => staff.useDeferredValueDRS(rt, ms),
            useImperativeHandleDRS: (ref, rt, ms, createHandle, deps = []) => staff.useImperativeHandleDRS(ref, rt, ms, createHandle, deps),
            useMemoDRS: (sources, compute) => staff.useMemoDRS(sources, compute),
            useReverseHeartbeat: (rt, ms, nodeId, resetIntervalMs) => staff.useReverseHeartbeat(rt, ms, nodeId, resetIntervalMs),
            useDRSDBRaft: (rt, ms, initial) => staff.useDRSDBRaft(rt, ms, initial),
            useRxDBRaft: (rt, ms, initial, db = 'kvdb') => staff.useRxDBRaft(rt, ms, initial, db),
            useDRSDBYata: (rt, ms) => staff.useDRSDBYata(rt, ms),
            useRxDBYata: (rt, ms, initial, db = 'kvdb') => staff.useRxDBYata(rt, ms, initial, db),
            useRTDB: (rt, ms, initial, db = 'kvdb') => staff.useRTDB(rt, ms, initial, db),
            drsdb: (rt, ms, initial) => staff.drsdb(rt, ms, initial),
            useDRSDB: (rt, ms, initial) => staff.useDRSDB(rt, ms, initial),
            useDRSDBOptimistic: (rt, ms, initial) => staff.useDRSDBOptimistic(rt, ms, initial),
            // #endregion
            // #region █████████ CONDITIONALS ████████████████████████████████████████████████████████████████████████████████████████████
            barrier: (rt, ms, participantId, total, options = {}) => staff.barrier(rt, ms, participantId, total, options),
            latch: (rt, ms) => staff.latch(rt, ms),
            gateMaster: (rt, ms, gatesFactory, options = { concurrency: true }) => staff.gateMaster(rt, ms, gatesFactory, options),
            gateMaster2: (rt, ms, gates) => staff.gateMaster2(rt, ms, gates),
            floodGateWithLive: () => staff.floodGateWithLive(),
            plinko: (rt, ms, initialState, tree, options = {}) => staff.plinko(rt, ms, initialState, tree, options),
            plinko3: (rt, ms) => staff.plinko3(rt, ms),
            plinko2: (rt, ms, tree, options = {}) => staff.plinko2(rt, ms, tree, options),
            getCircuitBreaker: (rt, options) => staff.getCircuitBreaker(rt, options),
            circuitBreaker: (rt, ms, operation, options) => staff.circuitBreaker(rt, ms, operation, options),
            conditionVariable: (rt, ms, raft, nodeId) => staff.conditionVariable(rt, ms, raft, nodeId),
            // #endregion
            // #region █████████ SPECIALTY ███████████████████████████████████████████████████████████████████████████████████████████████
            fusebox: (rt, ms, options = {}) => staff.fusebox(rt, ms, options),
            tripwire: (rt, ms, stateTarget, options = {}) => staff.tripwire(rt, ms, stateTarget, options),
            fathom: (rt, ms, options = {}) => staff.fathom(rt, ms, options),
            rigging: () => staff.rigging(),
            circus: (rt, ms, options = {}) => staff.circus(rt, ms, options),
            nebula: (rt, ms, options = {}) => staff.nebula(rt, ms, options),
            cyclone: (rt, ms, options = {}) => staff.cyclone(rt, ms, options),
            trident: (rt, ms, options = {}) => staff.trident(rt, ms, options),
            anchor: (rt, ms, options = {}) => staff.anchor(rt, ms, options),
            pipeline: (rt, ms) => staff.pipeline(rt, ms),
            tide: (rt, ms, options) => staff.tide(rt, ms, options),
            mesh: (rt, ms, options) => staff.mesh(rt, ms, options),
            echo: (rt, ms) => staff.echo(rt, ms),
            carousel: (rt, ms, options = {}) => staff.carousel(rt, ms, options),
            synapse: (localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options = {}) => staff.synapse(localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options),
            abortableFlight: (rt, ms) => staff.abortableFlight(rt, ms),
            tokenBucket: (rt, ms, options = {}) => staff.tokenBucket(rt, ms, options),
            tokenBucket_simple: (maxTokens, refillRateMs) => staff.tokenBucket_simple(maxTokens, refillRateMs),
            resilience: (rt, ms, options = {}) => staff.resilience(rt, ms, options),
            saga: (sagaId, ms, context) => staff.saga(sagaId, ms, context),
            ecs: (rt, ms) => staff.ecs(rt, ms),
            commandBuffer: (rt, ms, options) => staff.commandBuffer(rt, ms, options),
            reactor: (rt, ms, config) => staff.reactor(rt, ms, config),
            blackboard: (rt, ms) => staff.blackboard(rt, ms),
            snapshotIsolation: (rt, ms, options) => staff.snapshotIsolation(rt, ms, options),
            smartBeacon: (rt, ms, set_pulse) => staff.smartBeacon(rt, ms, set_pulse),
            crdt: (rt, ms, initial) => staff.crdt(rt, ms, initial),
            useCrdt: (rt, ms, initial) => staff.useCrdt(rt, ms, initial),
            createCRDTChannel: (rt, ms, initial, syncEngine) => staff.createCRDTChannel(rt, ms, initial, syncEngine),
            notifications: (rt, ms) => staff.notifications(rt, ms),
            useNotifications: (rt, ms) => staff.useNotifications(rt, ms),
            config: (namespace, ms, defaultConfig) => staff.config(namespace, ms, defaultConfig),
            useConfig: (namespace, ms, defaultConfig) => staff.useConfig(namespace, ms, defaultConfig),
            useFeatureFlag: (flag, ms, defaultValue) => staff.useFeatureFlag(flag, ms, defaultValue),
            lock: (rt, ms, resourceId, ttl) => staff.lock(rt, ms, resourceId, ttl),
            mapReduce: (rt, ms, mapper, reducer, initial, timeoutMs) => staff.mapReduce(rt, ms, mapper, reducer, initial, timeoutMs),
            rateLimit: (rt, ms, key, maxRequests, windowMs) => staff.rateLimit(rt, ms, key, maxRequests, windowMs),
            appendOnlyLog: (rt, ms, options) => staff.appendOnlyLog(rt, ms, options),
            // #endregion
            // #region █████████ JTF2 LEVEL ANALOGY BASED FEATURES █████████████████████████████████████████████████████████████████████
            harbormaster: (rt, ms, options = {}) => staff.harbormaster(rt, ms, options),
            beacon: (rt, ms, set_pulse) => staff.beacon(rt, ms, set_pulse),
            vessel: (rt, ms, set_pulse) => staff.vessel(rt, ms, set_pulse),
            dock: (rt, ms) => staff.dock(rt, ms),
            radar: (rt, ms, set_pulse, vessel_id) => staff.radar(rt, ms, set_pulse, vessel_id),
            torpedo: (rt, ms, p, timeoutMs) => staff.torpedo(rt, ms, p, timeoutMs),
            convoy: (rt, ms, nodeId, heartbeatInterval, dropThreshold) => staff.convoy(rt, ms, nodeId, heartbeatInterval, dropThreshold),
            sonar: (rt, ms, set_pulse) => staff.sonar(rt, ms, set_pulse),
            heartbeat: (rt, ms, interval, timeout) => staff.heartbeat(rt, ms, interval, timeout),
            watchdog: (rt, ms, options = {}) => staff.watchdog(rt, ms, options),
            singleFlight: (key, task) => staff.singleFlight(key, task),
            transaction: (rt, ms, operations) => staff.transaction(rt, ms, operations),
            autoFederate: (rt, ms, options = {}) => staff.autoFederate(rt, ms, options),
            visualFlow: (rt, ms, nodes) => staff.visualFlow(rt, ms, nodes),
            // #endregion
            // #region █████████ EPHEMERAL STATE █████████████████████████████████████████████████████████████████████████████████████████
            shadowState: (key, initial) => staff.shadowState(key, initial),
            useShadowState: (key, initial) => staff.useShadowState(key, initial),
            shadowStateWithTTL: (key, initial, ttlMs) => staff.shadowStateWithTTL(key, initial, ttlMs),
            batchShadowState: (key, initial, options = {}) => staff.batchShadowState(key, initial, options),
            // #endregion
            // #region █████████ NORMAL FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████████████████
            gar: (rt, ms, p, ttl, binary = false) => staff.gar(rt, ms, p, ttl, binary),
            reply: (replyChannel, ms, p) => staff.reply(replyChannel, ms, p),
            on: (rt, ms, handler) => staff.on(rt, ms, handler),
            once: (rt, ms, handler) => staff.once(rt, ms, handler),
            scope: (prefix) => ({
                send: (rt, p, ttl, binary = false) => staff.scope(prefix).send(rt, p, ttl, binary),
                sub: (rt, handler) => staff.scope(prefix).sub(rt, handler),
                gar: (rt, p, ttl) => staff.scope(prefix).gar(rt, p, ttl),
                use: (rt, fn) => staff.scope(prefix).use(rt, fn),
                live: (rt, initial) => staff.scope(prefix).live(rt, initial),
                scope: (subprefix) => staff.scope(prefix).scope(subprefix)
            }),
            scoped: (workspaceName) => staff.scoped(workspaceName),
            hasSubscription: (rt) => staff.hasSubscription(rt),
            receive: (msg) => staff.receive(msg),
            use: (rt, fn) => staff.use(rt, fn),
            useGlobal: (mw) => staff.useGlobal(mw),
            send: (rt, ms, p, ttl, binary = false) => staff.send(rt, ms, p, ttl, binary),
            sub: async (rt, ms, handler) => {
                const subId = await staff.sub(rt, ms, handler);
                return subId;
            },
            request: (rt, ms, p, binary = false) => staff.request(rt, ms, p, binary),
            broadcast: (rt, p, ttl) => staff.broadcast(rt, p, ttl),
            subWithHistory: async (rt, ms, handler, options) => {
                const subId = await staff.subWithHistory(rt, ms, handler, options);
                return subId;
            },
            batch: (messages, binary = false) => staff.batch(messages, binary),
            createGroup: (name, channels = [], options) => staff.createGroup(name, channels, options),
            deleteGroup: (name) => staff.deleteGroup(name),
            addToGroup: (name, rt) => staff.addToGroup(name, rt),
            removeFromGroup: (name, rt) => staff.removeFromGroup(name, rt),
            enableGroup: (name) => staff.enableGroup(name),
            disableGroup: (name) => staff.disableGroup(name),
            groupBroadcast: (name, p, ttl) => staff.groupBroadcast(name, p, ttl),
            subscribeByTag: async (tag, handler) => {
                const subId = await staff.subscribeByTag(tag, handler);
                return subId;
            },
            setDefaultPriority: (priority) => staff.setDefaultPriority(priority),
            getDefaultPriority: () => staff.getDefaultPriority(),
            ack: (messageId) => staff.ack(messageId),
            nak: (messageId, reason) => staff.nak(messageId, reason),
            onDeliveryReceipt: (handler) => staff.onDeliveryReceipt(handler),
            listDeadLetters: (rt) => staff.listDeadLetters(rt),
            requeueDeadLetter: (id, ttl) => staff.requeueDeadLetter(id, ttl),
            subscribeDurable: async (rt, handler, options) => {
                const subId = await staff.subscribeDurable(rt, handler, options);
                return subId;
            },
            setCheckpoint: (rt, ms, subscriberId, offset) => staff.setCheckpoint(rt, ms, subscriberId, offset),
            getCheckpoint: (rt, ms, subscriberId) => staff.getCheckpoint(rt, ms, subscriberId),
            replay: async (options, handler) => {
                const subId = await staff.replay(options, handler);
                return subId;
            },
            groupUse: (name, fn) => staff.groupUse(name, fn),
            setBackpressureConfig: (config) => staff.setBackpressureConfig(config),
            setChannelSchema: (rt, schema) => staff.setChannelSchema(rt, schema),
            getChannelSchema: (rt) => staff.getChannelSchema(rt),
            setChannelPermissions: (rt, perms) => staff.setChannelPermissions(rt, perms),
            getChannelPermissions: (rt) => staff.getChannelPermissions(rt),
            addRouteRule: (rule) => staff.addRouteRule(rule),
            removeRouteRule: (name) => staff.removeRouteRule(name),
            listRouteRules: () => staff.listRouteRules(),
            addTransform: (channelPattern, transform) => staff.addTransform(channelPattern, transform),
            removeTransform: (channelPattern) => staff.removeTransform(channelPattern),
            configureEncryption: (config) => staff.configureEncryption(config),
            configureCompression: (config) => staff.configureCompression(config),
            listTags: () => staff.listTags(),
            listChannelsByTag: (tag) => staff.listChannelsByTag(tag),
            listChannels: () => staff.listChannels(),
            getChannelInfo: (rt) => staff.getChannelInfo(rt),
            listHandlers: (rt) => staff.listHandlers(rt),
            listAdapters: () => staff.listAdapters(),
            listMiddleware: () => staff.listMiddleware(),
            getMessageCount: (rt) => staff.getMessageCount(rt),
            getAdapterMetrics: () => staff.getAdapterMetrics(),
            disableAdapter: (id) => staff.disableAdapter(id),
            enableAdapter: (id) => staff.enableAdapter(id),
            session: () => staff.session(),
            useSession: () => staff.useSession(),
            secrets: () => staff.secrets(),
            useSecrets: () => staff.useSecrets(),
            worker: (queueChannel, handler, options = {}) => staff.worker(queueChannel, handler, options),
            enqueueJob: (queueChannel, p, timeoutMs = 30000) => staff.enqueueJob(queueChannel, p, timeoutMs),
            signal: (key, initialValue, options) => staff.signal(key, initialValue, options),
            useSignal: (key, initialValue, options) => staff.useSignal(key, initialValue, options),
            machine: (rt, config) => staff.machine(rt, config),
            // #endregion
            // #region █████████ NGIN ███████████████████████████████████████████████████████████████████████████████████████████████████████
            // #region █████████ NGIN - MEMORY / CACHE ███████████████████████████████████████████████████████████████████████████████████████████████████████
            getMemory: (key) => ngin.getMemory(key),
            getManyMemory: (keys) => ngin.getManyMemory(keys),
            setMemory: (key, value) => ngin.setMemory(key, value),
            setManyMemory: (entries) => ngin.setManyMemory(entries),
            deleteMemory: (key) => ngin.deleteMemory(key),
            deleteManyMemory: (keys) => ngin.deleteManyMemory(keys),
            // #endregion
            // #region █████████ NGIN - LOCAL STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
            getLocalStorage: (key) => ngin.getLocalStorage(key),
            getManyLocalStorage: (keys) => ngin.getManyLocalStorage(keys),
            setLocalStorage: (key, value) => ngin.setLocalStorage(key, value),
            setManyLocalStorage: (entries) => ngin.setManyLocalStorage(entries),
            deleteLocalStorage: (key) => ngin.deleteLocalStorage(key),
            // #endregion
            // #region █████████ NGIN - SESSION STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
            getSessionStorage: (key) => ngin.getSessionStorage(key),
            getManySessionStorage: (keys) => ngin.getManySessionStorage(keys),
            setSessionStorage: (key, value) => ngin.setSessionStorage(key, value),
            setManySessionStorage: (entries) => ngin.setManySessionStorage(entries),
            deleteSessionStorage: (key) => ngin.deleteSessionStorage(key),
            // #endregion
            // #region █████████ NGIN - COOKIES ███████████████████████████████████████████████████████████████████████████████████████████████████████
            getCookie: (key) => ngin.getCookie(key),
            getManyCookie: (keys) => ngin.getManyCookie(keys),
            setCookie: (key, value, options) => ngin.setCookie(key, value, options),
            setManyCookie: (entries, options) => ngin.setManyCookie(entries, options),
            deleteCookie: (key, path, domain) => ngin.deleteCookie(key, path, domain),
            // #endregion
            // #region █████████ NGIN - SAURON ███████████████████████████████████████████████████████████████████████████████████████████████████████
            publish: (key, value, opts) => ngin.publish(key, value, opts),
            subscribe: (key, listener, opts) => ngin.subscribe(key, listener, opts),
            getAllSauron: (opts) => ngin.getAllSauron(opts),
            setSauron: (label, value, triggerRender = true, sl_reg, ms_reg, globalKey) => ngin.setSauron(label, value, triggerRender, sl_reg, ms_reg, globalKey),
            getSauron: (label, sl_reg, ms_reg, globalKey) => ngin.getSauron(label, sl_reg, ms_reg, globalKey),
            subSauron: (label, fn, sl_reg, ms_reg, globalKey) => ngin.subSauron(label, fn, sl_reg, ms_reg, globalKey),
            deleteSauron: (label, sl_reg, ms_reg, globalKey) => ngin.deleteSauron(label, sl_reg, ms_reg, globalKey),
            subAllSauron: (fn, sl_reg, ms_reg, globalKey) => ngin.subAllSauron(fn, sl_reg, ms_reg, globalKey),
            // #endregion
            // #region █████████ NGIN - SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
            createRegistry: (name) => ngin.createRegistry(name),
            getRegistry: (name) => ngin.getRegistry(name),
            getAllRegistries: () => ngin.getAllRegistries(),
            getGR: (label, registry) => ngin.getGR(label, registry),
            // #endregion
            // #region █████████ NGIN - HYPER SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
            createScopedReg: (name) => ngin.createScopedReg(name),
            // #endregion
            // #region █████████ NGIN - BINARY ███████████████████████████████████████████████████████████████████████████████████████████████████████
            getBinary: (key) => ngin.getBinary(key),
            setBinary: (key, value) => ngin.setBinary(key, value),
            deleteBinary: (key) => ngin.deleteBinary(key),
            // #endregion
            // #region █████████ NGIN - GLOBAL THIS ███████████████████████████████████████████████████████████████████████████████████████████████████████
            setGT: (label, value) => ngin.setGT(label, value),
            setManyGT: (entries) => ngin.setManyGT(entries),
            getGT: (label) => ngin.getGT(label),
            getManyGT: (keys) => ngin.getManyGT(keys),
            deleteGT: (label) => ngin.deleteGT(label),
            deleteManyGT: (keys) => ngin.deleteManyGT(keys),
            // #endregion  // #region █████████ NGIN - DB ███████████████████████████████████████████████████████████████████████████████████████████████████████
            get: (key) => ngin.get(key),
            getMany: (keys) => ngin.getMany(keys),
            set: (key, value) => ngin.set(key, value),
            setMany: (entries) => ngin.setMany(entries),
            delete: (key) => ngin.delete(key),
            deleteMany: (keys) => ngin.deleteMany(keys),
            // #endregion
            // #region █████████ NGIN - OTHER ███████████████████████████████████████████████████████████████████████████████████████████████████████
            nginScoped: (workspaceName) => ngin.nginScoped(workspaceName),
            watch: (key) => ngin.watch(key),
            watchMany: (keys) => ngin.watchMany(keys),
            watchPattern: (pattern) => ngin.watchPattern(pattern),
            watchPrefix: (prefix) => ngin.watchPrefix(prefix),
            watchAll: () => ngin.watchAll(),
            setIfChanged: (key, value) => ngin.setIfChanged(key, value),
            expire: (key, ms) => ngin.expire(key, ms),
            expireAt: (key, ts) => ngin.expireAt(key, ts),
            persist: (key) => ngin.persist(key),
            touch: (key, ms) => ngin.touch(key, ms),
            ngin_lock: (key, ttlMs) => ngin.lock(key, ttlMs),
            unlock: (key, owner) => ngin.unlock(key, owner),
            renewLock: (key, owner, ttlMs) => ngin.renewLock(key, owner, ttlMs),
            lockApi: () => ngin.lockApi(),
            sync: (key, options) => ngin.sync(key, options),
            ngin_transaction: async (ops) => ngin.transaction(ops),
            "ngin:batch": (entries) => ngin.batch(entries),
            "ngin:live": (key, initial = {}) => ngin.live(key, initial),
            computed: (key, deps, fn) => ngin.computed(key, deps, fn),
            nginScope: (prefix) => ngin.nginScope(prefix),
            snapshot: () => ngin.snapshot(),
            restore: (snapshot) => ngin.restore(snapshot),
            export: (prefix) => ngin.export(prefix),
            import: (data, strategy) => ngin.import(data, strategy),
            useNginMiddleware: (mw) => ngin.useNginMiddleware(mw),
            query: (expr) => ngin.query(expr),
            matchesQuery: (v, expr) => ngin.matchesQuery(v, expr),
            getMemoryEntries: () => ngin.getMemoryEntries(),
            openFile: (filePath) => ngin.openFile(filePath),
            closeFile: () => ngin.closeFile(),
            getTables: (useAux = false) => ngin.getTables(useAux),
            getSchema: (table, useAux = false) => ngin.getSchema(table, useAux),
            queryTable: (table, useAux = false) => ngin.queryTable(table, useAux),
            updateCell: (table, pkCol, pkVal, col, value, useAux = false) => ngin.updateCell(table, pkCol, pkVal, col, value, useAux),
            insertRow: (table, cols, values, useAux = false) => ngin.insertRow(table, cols, values, useAux),
            deleteRow: (table, pkCol, pkVal, useAux = false) => ngin.deleteRow(table, pkCol, pkVal, useAux),
            addColumn: (table, colName, colType, useAux = false) => ngin.addColumn(table, colName, colType, useAux),
            close: () => ngin.close(),
            unsub: (subId) => ngin.unsub(subId),
            // #endregion
            // #endregion
        };
        socket.on("message", async (raw) => {
            console.log('[CSE SERVER MESSAGE]', raw);
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            }
            catch {
                return;
            }
            if (msg.type === "rpc:res" || msg.type === "rpc:chunk") {
                // find which workspace this response is meant to go back to
                const originId = getSauron(routeKey(msg.clientId, msg.id));
                const originSocket = originId ? clientSockets.get(originId) : undefined;
                if (originSocket && originSocket.readyState === WebSocket.OPEN) {
                    originSocket.send(raw);
                    if (msg.type === "rpc:res" || msg.done) {
                        deleteSauron(routeKey(msg.clientId, msg.id));
                    }
                    return;
                }
            }
            if (msg.type !== "rpc")
                return;
            const targetWorkspace = msg.ws;
            if (targetWorkspace && targetWorkspace !== currentWorkspace) {
                const targetSocket = clientSockets.get(targetWorkspace);
                if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
                    // record who to send the eventual response back to — not the socket, just the id
                    setSauron(routeKey(msg.clientId, msg.id), socketClientId ?? currentWorkspace);
                    targetSocket.send(raw);
                    return;
                }
                else {
                    send({ type: "rpc:res", id: msg.id, ok: false, error: `Workspace instance "${targetWorkspace}" is not connected.` });
                    return;
                }
            }
            // ─── END WORKSPACE ROUTING CHECK ─────────────────────────────────────
            if (msg.method === "stream") {
                // Grab the explicit keys straight out of the message
                const { rt, ms, p } = msg;
                staff.stream(rt, ms, p, (chunk) => {
                    if (socket.readyState !== WebSocket.OPEN)
                        return;
                    if (chunk === null || chunk === undefined) {
                        send({ type: "rpc:chunk", id: msg.id, done: true });
                    }
                    else {
                        send({ type: "rpc:chunk", id: msg.id, chunk });
                    }
                });
                return;
            }
            const fn = rpcMethods[msg.method];
            if (!fn) {
                send({ type: "rpc:res", id: msg.id, ok: false, error: `Unknown method: ${msg.method}` });
                return;
            }
            try {
                const result = await fn(msg);
                send({ type: "rpc:res", id: msg.id, ok: true, result });
            }
            catch (err) {
                send({ type: "rpc:res", id: msg.id, ok: false, error: String(err?.message ?? err) });
            }
        });
        socket.on("close", () => {
            if (socketClientId)
                clientSockets.delete(socketClientId);
            subs.forEach((off) => off());
            subs.clear();
        });
    });
}
