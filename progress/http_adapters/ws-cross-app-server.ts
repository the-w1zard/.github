import { WebSocketServer, WebSocket } from 'ws'
import * as vscode from 'vscode'
import { reliableSocket } from './ws-reliable-socket';
import { deleteSauron, getSauron, setSauron } from '../rxcdb/the_one';

type RPCMsg =
  | { type: "rpc"; id: number; method: string; clientId?: string, rt?: any, ms?: any, p?: any, }
  | { type: "rpc:res"; id: number; ok: boolean; result?: any; error?: string }
  | { type: "staff:event"; subId: number; p: any }
  | { type: "rpc:chunk"; id: number | string; chunk?: any; done?: boolean }
  | { type: "staff:routed"; clientId: string; rt: string; p: any }

let wssSingleton: WebSocketServer | null = null
let supervisorStarted = false
let isMaster = false
let isClientConnected = false
let failureCount = 0;

const clientSockets = new Map<string, WebSocket>()

function routeKey(clientId: string, id: number | string): string { return `cse:response-router:${clientId}:${id}` }

function getCurrentWorkspaceName(): string { return vscode.workspace.workspaceFolders?.[0]?.name ?? 'unknown-instance' }

async function sweepStaleRoutes() {
  const entries = cloudState.getByPrefix<string>('cse:response-router:')
  for (const { key, value: originId } of entries) {
    const socket = clientSockets.get(originId)
    const alive = socket && socket.readyState === WebSocket.OPEN
    if (!alive) cloudState.delete(key)
  }
}
export function crossCseNginConnect(staff: any, port: number, ngin: any) {
  if (wssSingleton) return wssSingleton

  try {
    const wss = new WebSocketServer({ port })
    wssSingleton = wss
    setupServer(wss, staff, ngin)
    isMaster = true
  } catch (err: any) {
    if (err.code === "EADDRINUSE") {
      startSupervisor(port, staff, ngin)
      return null
    }
    throw err
  }

  startSupervisor(port, staff, ngin)
  return wssSingleton
}
function startSupervisor(port: number, staff: any, ngin: any) {
  if (supervisorStarted) return
  supervisorStarted = true

  setInterval(async () => {
    const alive = await canConnectToServer(port)

    if (alive) {
      failureCount = 0;
      if (isMaster) return
      if (isClientConnected) return

      connectAsClient(port, staff, ngin)
      isClientConnected = true
      isMaster = false
      return
    }

    // Master is down. Increment the failure count.
    failureCount++;

    const wsName = vscode.workspace.workspaceFolders?.[0]?.name
    const allowedMissedChecks = (wsName.length % 3) + 1

    // Sit tight until this specific window reaches its designated fallback slot
    if (failureCount < allowedMissedChecks) {
      return
    }

    // This window's turn has arrived. Reset state and attempt takeover.
    isClientConnected = false
    failureCount = 0

    try {
      const wss = new WebSocketServer({ port })
      wssSingleton = wss
      setupServer(wss, staff, ngin)
      isMaster = true
      console.log(`[Supervisor] ${wsName} successfully claimed the master slot.`)
    } catch (err: any) {
      if (err.code === "EADDRINUSE") {
        // Someone else claimed it first! Fall back to client state smoothly
        connectAsClient(port, staff, ngin)
        isClientConnected = true
        isMaster = false
        return null
      }
      throw err
    }
  }, 30000)
}
function canConnectToServer(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`)
    ws.onopen = () => { ws.close(); resolve(true) }
    ws.onerror = () => resolve(false)
  })
}
function connectAsClient1(port: number, staff: any, ngin: any) {
  const currentWorkspaceName = getCurrentWorkspaceName()
  const existingSocket = clientSockets.get(currentWorkspaceName)
  if (existingSocket && existingSocket.readyState === WebSocket.OPEN) return

  const ws = new WebSocket(`ws://127.0.0.1:${port}`)
  clientSockets.set(currentWorkspaceName, ws)

  ws.on("open", () => {
    console.log(`[RPC CLIENT] Workspace "${currentWorkspaceName}" connected to Master Hub on port ${port}`)

    ws.send(JSON.stringify({
      type: "rpc",
      id: Date.now(),
      method: "register",
      args: [currentWorkspaceName]
    }))

    // Pipe internal outgoing staff logic up through our master server link
    if (staff.registerAdapter) {
      staff.registerAdapter({
        id: `client:${currentWorkspaceName}`,
        onMessage: (cb: (m: any) => void) => {
          const handler = (event: any) => {
            try {
              const data = JSON.parse(event.data.toString())
              if (data.type === "staff:routed" || data.type === "staff:event") {
                cb(data.p)
              }
            } catch { }
          }
          ws.on("message", handler)
          return () => ws.off("message", handler)
        },
        send: (rt: string, p: any) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "rpc",
              id: Date.now(),
              method: "send",
              args: [rt, { ...p, ws: currentWorkspaceName }],
              ws: currentWorkspaceName
            }))
          }
        }
      })
    }
  })

  ws.on("message", async (raw: any) => {
    try {
      const msg = JSON.parse(raw.toString())

      // Handle targeted calls fired directly down from master server to this cross-process window
      if (msg.type === "rpc" && msg.method) {
        const targetEngine = (msg.method.startsWith('ngin:') || msg.method in ngin) ? ngin : staff
        const fn = targetEngine[msg.method]

        if (fn) {
          try {
            const result = await fn(...(msg.args || []))
            ws.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: true, result }))
          } catch (err: any) {
            ws.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: false, error: String(err?.message ?? err) }))
          }
        }
      }
    } catch { }
  })

  ws.on("close", () => {
    clientSockets.delete(currentWorkspaceName)
    console.log(`[RPC CLIENT] Disconnected from Master Hub. Attempting retry...`)
    setTimeout(() => connectAsClient(port, staff, ngin), 5000)
  })

  ws.on("error", () => { ws.close() })
}
function connectAsClient(port: number, staff: any, ngin: any) {
  const currentWorkspaceName = getCurrentWorkspaceName()
  const existingSocket = clientSockets.get(currentWorkspaceName)
  if (existingSocket && existingSocket.readyState === WebSocket.OPEN) return

  const conn = reliableSocket(`ws://127.0.0.1:${port}`, {
    queueKey: `cse:rpc-adapter:queue:${currentWorkspaceName}`,
  })

  conn.onOpen(() => {
    console.log(`[RPC CLIENT] Workspace "${currentWorkspaceName}" connected to Master Hub on port ${port}`)

    conn.send(JSON.stringify({
      type: "rpc",
      id: Date.now(),
      method: "register",
      clientId: currentWorkspaceName,
    }))

    if (staff.registerAdapter) {
      staff.registerAdapter({
        id: `client:${currentWorkspaceName}`,
        onMessage: (cb: (m: any) => void) => {
          return conn.onMessage((raw) => {
            try {
              const data = JSON.parse(raw)
              if (data.type === "staff:routed" || data.type === "staff:event") cb(data.p)
            } catch { }
          })
        },
        send: (rt: string, p: any) => {
          conn.send(JSON.stringify({
            type: "rpc",
            id: Date.now(),
            method: "send",
            args: [rt, { ...p, ws: currentWorkspaceName }],
            ws: currentWorkspaceName,
          }))
        }
      })
    }
  })

  conn.onMessage(async (raw) => {
    try {
      const msg = JSON.parse(raw)
      if (msg.type === "rpc" && msg.method) {
        const targetEngine = (msg.method.startsWith('ngin:') || msg.method in ngin) ? ngin : staff
        const fn = targetEngine[msg.method]
        if (fn) {
          try {
            const result = await fn(msg)
            conn.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: true, result }))
          } catch (err: any) {
            conn.send(JSON.stringify({ type: "rpc:res", id: msg.id, ok: false, error: String(err?.message ?? err) }))
          }
        }
      }
    } catch { }
  })

  conn.onClose(() => {
    clientSockets.delete(currentWorkspaceName)
    console.log(`[RPC CLIENT] Disconnected from Master Hub. Reconnecting...`)
  })

  clientSockets.set(currentWorkspaceName, conn as unknown as WebSocket)
}
function setupServer(wss: WebSocketServer, staff: any, ngin: any) {
  const currentWorkspace = getCurrentWorkspaceName()

  sweepStaleRoutes()

  wss.on("connection", (socket: any) => {
    const subs = new Map<number, () => void>()
    let subIdSeq = 1
    let socketClientId: string | null = null

    const send = (msg: RPCMsg) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg)) }

    const rpcMethods: any = {
      register: (msg: RPCMsg) => {
        const id = (msg as any).clientId
        socketClientId = id
        clientSockets.set(id, socket)
        return { ok: true }
      },
      sendToClient: (clientId: string, rt: string, p: any) => {
        const target = clientSockets.get(clientId)
        if (!target || target.readyState !== WebSocket.OPEN) return { ok: false }
        target.send(JSON.stringify({ type: "staff:routed", clientId, rt, p }))
        return { ok: true }
      },
      // #region █████████ BASE FUNCTIONS ██████████████████████████████████████████████████████████████████████████████████████████
      sendsub: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) => staff.sendsub(rt, ms, p, ttl, binary),
      multisub: (rt: string, ms: string, handler: any) => staff.multisub(rt, ms, handler),
      // #endregion
      // #region █████████ STREAMS ██████████████████████████████████████████████████████████████████████████████████████████████████
      stream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void, binary = false) => staff.stream(rt, ms, p, onChunk, binary),
      streamHandler: (rt: string, ms: string, handler: (d: any) => any, binary = false) => staff.streamHandler(rt, ms, handler, binary),
      streamChunk: (rt: string, ms: string, streamId: string, chunk: string, binary = false) => staff.streamChunk(rt, ms, streamId, chunk, binary),
      streamDone: (rt: string, ms: string, streamId: string, binary = false) => staff.streamDone(rt, ms, streamId, binary),
      cancelStream: (rt: string, ms: string, streamId: string, binary = false) => staff.cancelStream(rt, ms, streamId, binary),
      syncStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void, binary = false) => staff.syncStream(rt, ms, p, onChunk, binary),
      syncStreamHandler: (rt: string, ms: string, handler: (d: any) => any, binary = false) => staff.syncStreamHandler(rt, ms, handler, binary),
      streamRelay: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.streamRelay(rt, ms, p, onChunk),
      openSyncStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.openSyncStream(rt, ms, p, onChunk),
      openSyncStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.openSyncStreamHandler(rt, ms, handler),
      priorityStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.priorityStream(rt, ms, p, onChunk),
      priorityStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.priorityStreamHandler(rt, ms, handler),
      duplexStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.duplexStream(rt, ms, p, onChunk),
      duplexStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.duplexStreamHandler(rt, ms, handler),
      transactionalStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.transactionalStream(rt, ms, p, onChunk),
      transactionalStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.transactionalStreamHandler(rt, ms, handler),
      deltaStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.deltaStream(rt, ms, p, onChunk),
      deltaStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.deltaStreamHandler(rt, ms, handler),
      presenceStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.presenceStream(rt, ms, p, onChunk),
      presenceStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.presenceStreamHandler(rt, ms, handler),
      authorityStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.authorityStream(rt, ms, p, onChunk),
      authorityStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.authorityStreamHandler(rt, ms, handler),
      compressionStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.compressionStream(rt, ms, p, onChunk),
      compressionStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.compressionStreamHandler(rt, ms, handler),
      heatbeatStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.heatbeatStream(rt, ms, p, onChunk),
      heatbeatStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.heatbeatStreamHandler(rt, ms, handler),
      backPressureStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.backPressureStream(rt, ms, p, onChunk),
      backPressureStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.backPressureStreamHandler(rt, ms, handler),
      statefulStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.statefulStream(rt, ms, p, onChunk),
      statefulStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.statefulStreamHandler(rt, ms, handler),
      multicastStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.multicastStream(rt, ms, p, onChunk),
      multicastStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.multicastStreamHandler(rt, ms, handler),
      partitionedStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.partitionedStream(rt, ms, p, onChunk),
      partitionedStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.partitionedStreamHandler(rt, ms, handler),
      batchStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.batchStream(rt, ms, p, onChunk),
      batchStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.batchStreamHandler(rt, ms, handler),
      filteredStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.filteredStream(rt, ms, p, onChunk),
      filteredStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.filteredStreamHandler(rt, ms, handler),
      deadLetterStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.deadLetterStream(rt, ms, p, onChunk),
      deadLetterStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.deadLetterStreamHandler(rt, ms, handler),
      idempotentStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.idempotentStream(rt, ms, p, onChunk),
      idempotentStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.idempotentStreamHandler(rt, ms, handler),
      lateArrivalStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.lateArrivalStream(rt, ms, p, onChunk),
      lateArrivalStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.lateArrivalStreamHandler(rt, ms, handler),
      checkpointStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.checkpointStream(rt, ms, p, onChunk),
      checkpointStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.checkpointStreamHandler(rt, ms, handler),
      rateLimitedStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.rateLimitedStream(rt, ms, p, onChunk),
      rateLimitedStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.rateLimitedStreamHandler(rt, ms, handler),
      comboStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.comboStream(rt, ms, p, onChunk),
      comboStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.comboStreamHandler(rt, ms, handler),
      transformStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.transformStream(rt, ms, p, onChunk),
      transformStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.transformStreamHandler(rt, ms, handler),
      fanoutStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.fanoutStream(rt, ms, p, onChunk),
      fanoutStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.fanoutStreamHandler(rt, ms, handler),
      useLiveStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.useLiveStream(rt, ms, p, onChunk),
      useLiveStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.useLiveStreamHandler(rt, ms, handler),
      useLiveSyncStream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => staff.useLiveSyncStream(rt, ms, p, onChunk),
      useLiveSyncHandler: (rt: string, ms: string, handler: (d: any) => any) => staff.useLiveSyncHandler(rt, ms, handler),
      // #endregion
      // #region █████████ DUPLEX ███████████████████████████████████████████████████████████████████████████████████████████████████
      duplex: (rt: string, ms: string, opts?: any, type?: string) => staff.duplex(rt, ms, opts, type),
      openStream: (rt: string, ms: string, opts?: any) => staff.openStream(rt, ms, opts),
      sx: (rt: string, ms: string, opts?: any, type?: string) => staff.sx(rt, ms, opts, type),
      sxHandler: (rt: string, ms: string, handlerFn: any, type?: string) => staff.sxHandler(rt, ms, handlerFn, type),
      // #endregion
      // #region █████████ DRSS - DISTRBUTED REACTIVE STATE STREAMS ██████████████████████████████████████████████████████████████
      // #endregion
      // #region █████████ DRS ██████████████████████████████████████████████████████████████████████████████████████████████████████
      useObservableState: (rt: string, ms: string, initial?: any) => staff.useObservableState(rt, ms, initial),
      useOptimisticState: (rt: string, ms: string, initial?: any) => staff.useOptimisticState(rt, ms, initial),
      DRS: (rt: string, ms: string, initial?: any) => staff.DRS(rt, ms, initial),
      live: (rt: string, ms: string, initial?: any) => staff.live(rt, ms, initial),
      useLive: (rt: string, ms: string, initial?: any) => staff.useLive(rt, ms, initial),
      useDRS: (rt: string, ms: string, initial?: any) => staff.useDRS(rt, ms, initial),
      stateLive: (rt: string, ms: string, initial?: any) => staff.stateLive(rt, ms, initial),
      stateDRS: (rt: string, ms: string, initial?: any) => staff.stateDRS(rt, ms, initial),
      useStateCRDT: (rt: string, ms: string, initial?: any) => staff.useStateCRDT(rt, ms, initial),
      useStateDRS: (rt: string, ms: string, initial?: any) => staff.useStateDRS(rt, ms, initial),
      useRefDRS: (rt: string, ms: string, initial?: any) => staff.useRefDRS(rt, ms, initial),
      useUmbrellaDRS: (rt: string, ms: string, initial?: any) => staff.useUmbrellaDRS(rt, ms, initial),
      useContextDRS: (rt: string, ms: string, initial?: any) => staff.useContextDRS(rt, ms, initial),
      DRSStore: (rt: string, ms: string, initial?: any) => staff.DRSStore(rt, ms, initial),
      useDRSStore: (rt: string, ms: string, initial?: any) => staff.useDRSStore(rt, ms, initial),
      useEffectDRS: (rt: string, ms: string, effect: any, deps: any[] = []) => staff.useEffectDRS(rt, ms, effect, deps),
      useAutoEffectDRS: (rt: string, ms: string, effect: any, deps: any[] = []) => staff.useAutoEffectDRS(rt, ms, effect, deps),
      useDeferredValueDRS: (rt: string, ms: string) => staff.useDeferredValueDRS(rt, ms),
      useImperativeHandleDRS: (ref: any, rt: string, ms: string, createHandle: any, deps: any[] = []) => staff.useImperativeHandleDRS(ref, rt, ms, createHandle, deps),
      useMemoDRS: (sources: [rt: string, ms: string][], compute: any) => staff.useMemoDRS(sources, compute),
      useReverseHeartbeat: (rt: string, ms: string, nodeId?: string, resetIntervalMs?: number) => staff.useReverseHeartbeat(rt, ms, nodeId, resetIntervalMs),
      useDRSDBRaft: (rt: string, ms: string, initial: any) => staff.useDRSDBRaft(rt, ms, initial),
      useRxDBRaft: (rt: string, ms: string, initial?: any, db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => staff.useRxDBRaft(rt, ms, initial, db),
      useDRSDBYata: (rt: string, ms: string) => staff.useDRSDBYata(rt, ms),
      useRxDBYata: (rt: string, ms: string, initial?: any[], db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => staff.useRxDBYata(rt, ms, initial, db),
      useRTDB: (rt: string, ms: string, initial: any, db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => staff.useRTDB(rt, ms, initial, db),
      drsdb: (rt: string, ms: string, initial: any) => staff.drsdb(rt, ms, initial),
      useDRSDB: (rt: string, ms: string, initial: any) => staff.useDRSDB(rt, ms, initial),
      useDRSDBOptimistic: (rt: string, ms: string, initial: any) => staff.useDRSDBOptimistic(rt, ms, initial),
      // #endregion
      // #region █████████ CONDITIONALS ████████████████████████████████████████████████████████████████████████████████████████████
      barrier: (rt: string, ms: string, participantId: string, total: number, options: { timeoutMs?: number; autoReset?: boolean } = {}) => staff.barrier(rt, ms, participantId, total, options),
      latch: (rt: string, ms: string) => staff.latch(rt, ms),
      gateMaster: (rt: string, ms: string, gatesFactory: any, options: any = { concurrency: true }) => staff.gateMaster(rt, ms, gatesFactory, options),
      gateMaster2: (rt: string, ms: string, gates: any) => staff.gateMaster2(rt, ms, gates),
      floodGateWithLive: () => staff.floodGateWithLive(),
      plinko: (rt: string, ms: string, initialState: any, tree: any, options: any = {}) => staff.plinko(rt, ms, initialState, tree, options),
      plinko3: (rt: string, ms: string) => staff.plinko3(rt, ms),
      plinko2: (rt: string, ms: string, tree: any, options: any = {}) => staff.plinko2(rt, ms, tree, options),
      getCircuitBreaker: (rt: string, options?: any) => staff.getCircuitBreaker(rt, options),
      circuitBreaker: <T>(rt: string, ms: string, operation: () => Promise<T>, options: { failureThreshold: number; recoveryTimeout: number }) => staff.circuitBreaker(rt, ms, operation, options),
      conditionVariable: (rt: string, ms: string, raft: any, nodeId: string) => staff.conditionVariable(rt, ms, raft, nodeId),
      // #endregion
      // #region █████████ SPECIALTY ███████████████████████████████████████████████████████████████████████████████████████████████
      fusebox: (rt: string, ms: string, options: { globalFailureThreshold?: number; anomalyWindowMs?: number; autoTrip?: boolean } = {}) => staff.fusebox(rt, ms, options),
      tripwire: <T extends Record<string, unknown>>(rt: string, ms: string, stateTarget: T, options: {
        walBuffer?: () => Array<unknown>;
        snapshotInterval?: number;
      } = {}) => staff.tripwire(rt, ms, stateTarget, options),
      fathom: (
        rt: string,
        ms: string,
        options: {
          samplingWindowMs?: number;
          highWatermark?: number;
          criticalWatermark?: number;
        } = {}
      ) => staff.fathom(rt, ms, options),
      rigging: () => staff.rigging(),
      circus: (rt: string, ms: string, options: any = {}) => staff.circus(rt, ms, options),
      nebula: (rt: string, ms: string, options: any = {}) => staff.nebula(rt, ms, options),
      cyclone: (rt: string, ms: string, options: any = {}) => staff.cyclone(rt, ms, options),
      trident: (rt: string, ms: string, options: any = {}) => staff.trident(rt, ms, options),
      anchor: (rt: string, ms: string, options: any = {}) => staff.anchor(rt, ms, options),
      pipeline: (rt: string, ms: string) => staff.pipeline(rt, ms),
      tide: (rt: string, ms: string, options: any) => staff.tide(rt, ms, options),
      mesh: (rt: string, ms: string, options?: any) => staff.mesh(rt, ms, options),
      echo: <T = any, R = any>(rt: string, ms: string) => staff.echo(rt, ms),
      carousel: (rt: string, ms: string, options: any = {}) => staff.carousel(rt, ms, options),
      synapse: (localChannel: string, local_sub_channel: string, remoteChannel: string, remote_sub_channel: string, options: any = {}) => staff.synapse(localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options),
      abortableFlight: (rt: string, ms: string) => staff.abortableFlight(rt, ms),
      tokenBucket: (rt: string, ms: string, options: any = {}) => staff.tokenBucket(rt, ms, options),
      tokenBucket_simple: (maxTokens?: number, refillRateMs?: number) => staff.tokenBucket_simple(maxTokens, refillRateMs),
      resilience: (rt: string, ms: string, options: any = {}) => staff.resilience(rt, ms, options),
      saga: <TContext extends Record<string, unknown>>(sagaId: string, ms: string, context: TContext) => staff.saga(sagaId, ms, context),
      ecs: (rt: string, ms: string) => staff.ecs(rt, ms),
      commandBuffer: (rt: string, ms: string, options?: { batchSize?: number; flushInterval?: number; walPath?: string }) => staff.commandBuffer(rt, ms, options),
      reactor: <S extends string, E extends string>(
        rt: string,
        ms: string,
        config: {
          initialState: S;
          transitions: Record<S, Partial<Record<E, {
            target: S;
            action?: (p: any) => void;
            guard?: (state: any) => boolean;
          }>>>;
        }
      ) => staff.reactor(rt, ms, config),
      blackboard: (rt: string, ms: string) => staff.blackboard(rt, ms),
      snapshotIsolation: (
        rt: string,
        ms: string,
        options?: { snapshotInterval?: number }
      ) => staff.snapshotIsolation(rt, ms, options),

      smartBeacon: (rt: string, ms: string, set_pulse?: number) => staff.smartBeacon(rt, ms, set_pulse),
      crdt: <T extends Record<string, unknown>>(
        rt: string,
        ms: string,
        initial: T
      ) => staff.crdt(rt, ms, initial),
      useCrdt: <T extends Record<string, unknown>>(
        rt: string,
        ms: string,
        initial: T
      ) => staff.useCrdt(rt, ms, initial),
      createCRDTChannel: <T extends Record<string, unknown>>(
        rt: string,
        ms: string,
        initial: T,
        syncEngine: {
          DRS: <S>(key: string, init: S) => [S, (val: S | ((prev: S) => S)) => void];
          hlc: any;
        }
      ) => staff.createCRDTChannel(rt, ms, initial, syncEngine),
      notifications: (rt: string, ms: string) => staff.notifications(rt, ms),
      useNotifications: (rt: string, ms: string) => staff.useNotifications(rt, ms),
      config: <T extends Record<string, unknown>>(
        namespace: string,
        ms: string,
        defaultConfig: T
      ) => staff.config(namespace, ms, defaultConfig),
      useConfig: <T extends Record<string, unknown>>(
        namespace: string,
        ms: string,
        defaultConfig: T
      ) => staff.useConfig(namespace, ms, defaultConfig),
      useFeatureFlag: (flag: string, ms: string, defaultValue?: boolean) => staff.useFeatureFlag(flag, ms, defaultValue),
      lock: (
        rt: string,
        ms: string,
        resourceId: string,
        ttl?: number
      ) => staff.lock(rt, ms, resourceId, ttl),
      mapReduce: <T, R>(
        rt: string,
        ms: string,
        mapper: (item: T) => R,
        reducer: (acc: R, item: R) => R,
        initial: R,
        timeoutMs?: number,
      ) => staff.mapReduce(rt, ms, mapper, reducer, initial, timeoutMs),
      rateLimit: (
        rt: string,
        ms: string,
        key: string,
        maxRequests: number,
        windowMs: number
      ) => staff.rateLimit(rt, ms, key, maxRequests, windowMs),
      appendOnlyLog: <T>(
        rt: string,
        ms: string,
        options?: { maxSize?: number }
      ) => staff.appendOnlyLog(rt, ms, options),

      // #endregion
      // #region █████████ JTF2 LEVEL ANALOGY BASED FEATURES █████████████████████████████████████████████████████████████████████
      harbormaster: (rt: string, ms: string, options: any = {}) => staff.harbormaster(rt, ms, options),
      beacon: (rt: string, ms: string, set_pulse?: number) => staff.beacon(rt, ms, set_pulse),
      vessel: (rt: string, ms: string, set_pulse?: number) => staff.vessel(rt, ms, set_pulse),
      dock: (rt: string, ms: string) => staff.dock(rt, ms),
      radar: (
        rt: string,
        ms: string,
        set_pulse?: number,
        vessel_id?: any
      ) => staff.radar(rt, ms, set_pulse, vessel_id),
      torpedo: (
        rt: string,
        ms: string,
        p: unknown,
        timeoutMs?: number
      ) => staff.torpedo(rt, ms, p, timeoutMs),
      convoy: (
        rt: string,
        ms: string,
        nodeId: string,
        heartbeatInterval?: number,
        dropThreshold?: number
      ) => staff.convoy(rt, ms, nodeId, heartbeatInterval, dropThreshold),
      sonar: (
        rt: string,
        ms: string,
        set_pulse?: number
      ) => staff.sonar(rt, ms, set_pulse),
      heartbeat: (
        rt: string,
        ms: string,
        interval?: number,
        timeout?: number
      ) => staff.heartbeat(rt, ms, interval, timeout),
      watchdog: (
        rt: string,
        ms: string,
        options: {
          timeout?: number;
          onTimeout?: () => void | Promise<void>;
          interval?: number;
        } = {}
      ) => staff.watchdog(rt, ms, options),

      singleFlight: <T = any>(key: string, task: () => Promise<T>) =>
        staff.singleFlight(key, task),

      transaction: <T extends Record<string, unknown>>(
        rt: string,
        ms: string,
        operations: {
          prepare: () => Promise<T>;
          commit: (data: T) => Promise<void>;
          rollback: (data: T) => Promise<void>;
        }
      ) => staff.transaction(rt, ms, operations),

      autoFederate: (
        rt: string,
        ms: string,
        options: { maxLocalHandlers?: number } = {}
      ) => staff.autoFederate(rt, ms, options),

      visualFlow: <T>(
        rt: string,
        ms: string,
        nodes: Array<{
          id: string;
          transform: (data: any) => any;
          inputs: string[];
          outputs: string[];
        }>
      ) => staff.visualFlow(rt, ms, nodes),

      // #endregion
      // #region █████████ EPHEMERAL STATE █████████████████████████████████████████████████████████████████████████████████████████
      shadowState: <T>(
        key: string,
        initial: T | (() => T)
      ) => staff.shadowState(key, initial),

      useShadowState: <T>(
        key: string,
        initial: T | (() => T)
      ) => staff.useShadowState(key, initial),

      shadowStateWithTTL: <T = any>(
        key: string,
        initial: T | (() => T),
        ttlMs: number
      ) => staff.shadowStateWithTTL(key, initial, ttlMs),

      batchShadowState: <T extends Record<string, any>>(
        key: string,
        initial: T,
        options: { debounceMs?: number } = {}
      ) => staff.batchShadowState(key, initial, options),


      // #endregion
      // #region █████████ NORMAL FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████████████████
      gar: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) =>
        staff.gar(rt, ms, p, ttl, binary),

      reply: (replyChannel: string, ms: string, p: unknown) =>
        staff.reply(replyChannel, ms, p),

      on: (rt: string, ms: string, handler: any) =>
        staff.on(rt, ms, handler),

      once: (rt: string, ms: string, handler: any) =>
        staff.once(rt, ms, handler),

      scope: (prefix: string) => ({
        send: (rt: string, p: unknown, ttl?: number, binary = false) =>
          staff.scope(prefix).send(rt, p, ttl, binary),

        sub: (rt: string, handler: any) =>
          staff.scope(prefix).sub(rt, handler),

        gar: (rt: string, p: unknown, ttl?: number) =>
          staff.scope(prefix).gar(rt, p, ttl),

        use: (rt: string, fn: (msg: any) => boolean | void) =>
          staff.scope(prefix).use(rt, fn),

        live: <T extends Record<string, unknown>>(rt: string, initial: T) =>
          staff.scope(prefix).live(rt, initial),

        scope: (subprefix: string) =>
          staff.scope(prefix).scope(subprefix)
      }),

      scoped: (workspaceName: string) =>
        staff.scoped(workspaceName),

      hasSubscription: (rt: string) =>
        staff.hasSubscription(rt),

      receive: (msg: any) =>
        staff.receive(msg),

      use: (rt: string, fn: (msg: any) => boolean | void) =>
        staff.use(rt, fn),

      useGlobal: (mw: {
        beforeSend?(msg: any): boolean | void | Promise<boolean | void>
        afterSend?(msg: any, result: unknown): void | Promise<void>
        beforeReceive?(msg: any): boolean | void | Promise<boolean | void>
        afterReceive?(msg: any, result: unknown): void | Promise<void>
        onError?(err: Error, msg?: any): void | Promise<void>
      }) =>
        staff.useGlobal(mw),

      send: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) =>
        staff.send(rt, ms, p, ttl, binary),

      sub: async (rt: string, ms: string, handler: any) => {
        const subId = await staff.sub(rt, ms, handler);
        return subId;
      },

      request: (
        rt: string,
        ms: string,
        p: { timeout?: number;[key: string]: unknown },
        binary = false
      ) =>
        staff.request(rt, ms, p, binary),

      broadcast: (rt: string, p: unknown, ttl?: number) =>
        staff.broadcast(rt, p, ttl),

      subWithHistory: async (
        rt: string,
        ms: string,
        handler: any,
        options?: { limit?: number }
      ) => {
        const subId = await staff.subWithHistory(rt, ms, handler, options);
        return subId;
      },
      batch: (messages: { rt: string; p: { sequential?: boolean;[key: string]: unknown } }[], binary = false) =>
        staff.batch(messages, binary),

      createGroup: (name: string, channels: string[] = [], options?: any) =>
        staff.createGroup(name, channels, options),

      deleteGroup: (name: string) =>
        staff.deleteGroup(name),

      addToGroup: (name: string, rt: string) =>
        staff.addToGroup(name, rt),

      removeFromGroup: (name: string, rt: string) =>
        staff.removeFromGroup(name, rt),

      enableGroup: (name: string) =>
        staff.enableGroup(name),

      disableGroup: (name: string) =>
        staff.disableGroup(name),

      groupBroadcast: (name: string, p: unknown, ttl?: number) =>
        staff.groupBroadcast(name, p, ttl),

      subscribeByTag: async (tag: string, handler: any) => {
        const subId = await staff.subscribeByTag(tag, handler);
        return subId;
      },

      setDefaultPriority: (priority: any) =>
        staff.setDefaultPriority(priority),

      getDefaultPriority: () =>
        staff.getDefaultPriority(),

      ack: (messageId: string) =>
        staff.ack(messageId),

      nak: (messageId: string, reason?: string) =>
        staff.nak(messageId, reason),

      onDeliveryReceipt: (
        handler: (info: { id: string; status: 'ack' | 'nak'; reason?: string }) => void
      ) =>
        staff.onDeliveryReceipt(handler),

      listDeadLetters: (rt?: string) =>
        staff.listDeadLetters(rt),

      requeueDeadLetter: (id: string, ttl?: number) =>
        staff.requeueDeadLetter(id, ttl),

      subscribeDurable: async (
        rt: string,
        handler: any,
        options: any
      ) => {
        const subId = await staff.subscribeDurable(rt, handler, options);
        return subId;
      },

      setCheckpoint: (
        rt: string,
        ms: string,
        subscriberId: string,
        offset: number
      ) =>
        staff.setCheckpoint(rt, ms, subscriberId, offset),

      getCheckpoint: (
        rt: string,
        ms: string,
        subscriberId: string
      ) =>
        staff.getCheckpoint(rt, ms, subscriberId),

      replay: async (options: any, handler: any) => {
        const subId = await staff.replay(options, handler);
        return subId;
      },
      groupUse: (name: string, fn: (msg: any) => boolean | void) =>
        staff.groupUse(name, fn),

      setBackpressureConfig: (config: any) =>
        staff.setBackpressureConfig(config),

      setChannelSchema: (rt: string, schema: any) =>
        staff.setChannelSchema(rt, schema),

      getChannelSchema: (rt: string) =>
        staff.getChannelSchema(rt),

      setChannelPermissions: (rt: string, perms: any) =>
        staff.setChannelPermissions(rt, perms),

      getChannelPermissions: (rt: string) =>
        staff.getChannelPermissions(rt),

      addRouteRule: (rule: any) =>
        staff.addRouteRule(rule),

      removeRouteRule: (name: string) =>
        staff.removeRouteRule(name),

      listRouteRules: () =>
        staff.listRouteRules(),

      addTransform: (channelPattern: string, transform: any) =>
        staff.addTransform(channelPattern, transform),

      removeTransform: (channelPattern: string) =>
        staff.removeTransform(channelPattern),

      configureEncryption: (config: any) =>
        staff.configureEncryption(config),

      configureCompression: (config: any) =>
        staff.configureCompression(config),

      listTags: () =>
        staff.listTags(),

      listChannelsByTag: (tag: string) =>
        staff.listChannelsByTag(tag),

      listChannels: () =>
        staff.listChannels(),

      getChannelInfo: (rt: string) =>
        staff.getChannelInfo(rt),

      listHandlers: (rt?: string) =>
        staff.listHandlers(rt),

      listAdapters: () =>
        staff.listAdapters(),

      listMiddleware: () =>
        staff.listMiddleware(),

      getMessageCount: (rt: string) =>
        staff.getMessageCount(rt),

      getAdapterMetrics: () =>
        staff.getAdapterMetrics(),

      disableAdapter: (id: string) =>
        staff.disableAdapter(id),

      enableAdapter: (id: string) =>
        staff.enableAdapter(id),

      session: () =>
        staff.session(),

      useSession: () =>
        staff.useSession(),

      secrets: () =>
        staff.secrets(),

      useSecrets: () =>
        staff.useSecrets(),

      worker: <T = any, R = any>(queueChannel: string, handler: (job: T) => Promise<R> | R, options: { concurrency?: number } = {}) => staff.worker(queueChannel, handler, options),
      enqueueJob: <T = any, R = any>(queueChannel: string, p: T, timeoutMs = 30000) => staff.enqueueJob(queueChannel, p, timeoutMs),
      signal: <T>(key: any, initialValue?: T | (() => T), options?: any) => staff.signal(key, initialValue, options),
      useSignal: <T>(key: any, initialValue?: T | (() => T), options?: any) => staff.useSignal(key, initialValue, options),
      machine: <T extends string>(rt: string, config: { initial: T; states: Record<T, { transitions: Record<string, T>; onEnter?: () => void }> }) => staff.machine(rt, config),
      // #endregion

      // #region █████████ NGIN ███████████████████████████████████████████████████████████████████████████████████████████████████████
      // #region █████████ NGIN - MEMORY / CACHE ███████████████████████████████████████████████████████████████████████████████████████████████████████
      getMemory: (key: string) => ngin.getMemory(key),
      getManyMemory: (keys: string[]) => ngin.getManyMemory(keys),
      setMemory: (key: string, value: any) => ngin.setMemory(key, value),
      setManyMemory: (entries: Record<string, unknown>) => ngin.setManyMemory(entries),
      deleteMemory: (key: string) => ngin.deleteMemory(key),
      deleteManyMemory: (keys: string[]) => ngin.deleteManyMemory(keys),
      // #endregion

      // #region █████████ NGIN - LOCAL STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
      getLocalStorage: (key: string) => ngin.getLocalStorage(key),
      getManyLocalStorage: (keys: string[]) => ngin.getManyLocalStorage(keys),
      setLocalStorage: (key: string, value: any) => ngin.setLocalStorage(key, value),
      setManyLocalStorage: (entries: Record<string, any>) => ngin.setManyLocalStorage(entries),
    deleteLocalStorage: (key: string) => ngin.deleteLocalStorage(key),
      // #endregion

      // #region █████████ NGIN - SESSION STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
      getSessionStorage: (key: string) => ngin.getSessionStorage(key),
      getManySessionStorage: (keys: string[]) => ngin.getManySessionStorage(keys),
      setSessionStorage: (key: string, value: any) => ngin.setSessionStorage(key, value),
      setManySessionStorage: (entries: Record<string, any>) => ngin.setManySessionStorage(entries),
      deleteSessionStorage: (key: string) => ngin.deleteSessionStorage(key),
      // #endregion

      // #region █████████ NGIN - COOKIES ███████████████████████████████████████████████████████████████████████████████████████████████████████
      getCookie: (key: string) => ngin.getCookie(key),
      getManyCookie: (keys: string[]) => ngin.getManyCookie(keys),
      setCookie: (key: string, value: any, options?: { maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) => ngin.setCookie(key, value, options),
      setManyCookie: (entries: Record<string, any>, options?: { maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) => ngin.setManyCookie(entries, options),
      deleteCookie: (key: string, path?: string, domain?: string) => ngin.deleteCookie(key, path, domain),
      // #endregion

      // #region █████████ NGIN - SAURON ███████████████████████████████████████████████████████████████████████████████████████████████████████
      publish: (key: string | symbol, value: any, opts?: any) => ngin.publish(key, value, opts),
      subscribe: (key: string | symbol, listener: (value: any) => void, opts?: any) => ngin.subscribe(key, listener, opts),
      getAllSauron: (opts?: any) => ngin.getAllSauron(opts),
      setSauron: (label: string, value: any, triggerRender = true, sl_reg?: any, ms_reg?: any, globalKey?: any) => ngin.setSauron(label, value, triggerRender, sl_reg, ms_reg, globalKey),
      getSauron: (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => ngin.getSauron(label, sl_reg, ms_reg, globalKey),
      subSauron: (label: string, fn: (value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => ngin.subSauron(label, fn, sl_reg, ms_reg, globalKey),
      deleteSauron: (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => ngin.deleteSauron(label, sl_reg, ms_reg, globalKey),
      subAllSauron: (fn: (key: string | symbol, value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => ngin.subAllSauron(fn, sl_reg, ms_reg, globalKey),
      // #endregion

      // #region █████████ NGIN - SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
      createRegistry: (name: string): any & { name: string; destroy(): void } => ngin.createRegistry(name),
      getRegistry: (name: string) => ngin.getRegistry(name),
      getAllRegistries: () => ngin.getAllRegistries(),
      getGR: (label: string, registry: string) => ngin.getGR(label, registry),
      // #endregion

      // #region █████████ NGIN - HYPER SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
      createScopedReg: (name: string) => ngin.createScopedReg(name),
      // #endregion

      // #region █████████ NGIN - BINARY ███████████████████████████████████████████████████████████████████████████████████████████████████████
      getBinary: (key: string) => ngin.getBinary(key),
      setBinary: (key: string, value: any) => ngin.setBinary(key, value),
      deleteBinary: (key: string) => ngin.deleteBinary(key),
      // #endregion

      // #region █████████ NGIN - GLOBAL THIS ███████████████████████████████████████████████████████████████████████████████████████████████████████
      setGT: (label: string, value: any) => ngin.setGT(label, value),
      setManyGT: (entries: Record<string, any>) => ngin.setManyGT(entries),
      getGT: (label: string) => ngin.getGT(label),
      getManyGT: (keys: string[]) => ngin.getManyGT(keys),
      deleteGT: (label: string) => ngin.deleteGT(label),
      deleteManyGT: (keys: string[]) => ngin.deleteManyGT(keys),
      // #endregion  // #region █████████ NGIN - DB ███████████████████████████████████████████████████████████████████████████████████████████████████████
      get: (key: string) => ngin.get(key),
      getMany: (keys: string[]) => ngin.getMany(keys),

      set: (key: string, value: any) => ngin.set(key, value),
      setMany: (entries: Record<string, unknown>) => ngin.setMany(entries),

      delete: (key: string) => ngin.delete(key),
      deleteMany: (keys: string[]) => ngin.deleteMany(keys),
      // #endregion
      // #region █████████ NGIN - OTHER ███████████████████████████████████████████████████████████████████████████████████████████████████████
      nginScoped: (workspaceName: string) => ngin.nginScoped(workspaceName),

      watch: (key: string) => ngin.watch(key),
      watchMany: (keys: string[]) => ngin.watchMany(keys),
      watchPattern: (pattern: string) => ngin.watchPattern(pattern),
      watchPrefix: (prefix: string) => ngin.watchPrefix(prefix),
      watchAll: () => ngin.watchAll(),
      setIfChanged: (key: string, value: any) => ngin.setIfChanged(key, value),
      expire: (key: string, ms: number) => ngin.expire(key, ms),
      expireAt: (key: string, ts: number) => ngin.expireAt(key, ts),
      persist: (key: string) => ngin.persist(key),
      touch: (key: string, ms?: number) => ngin.touch(key, ms),
      ngin_lock: (key: string, ttlMs?: number) => ngin.lock(key, ttlMs),
      unlock: (key: string, owner: string) => ngin.unlock(key, owner),
      renewLock: (key: string, owner: string, ttlMs?: number) => ngin.renewLock(key, owner, ttlMs),
      lockApi: () => ngin.lockApi(),
      sync: (key: string, options?: any) => ngin.sync(key, options),
      ngin_transaction: async (ops: { method: string; args: any[] }[]) => ngin.transaction(ops),
      "ngin:batch": (entries: { key: string; value: unknown }[]) => ngin.batch(entries),
      "ngin:live": (key: string, initial: Record<string, unknown> = {}) => ngin.live(key, initial),
      computed: (key: string, deps: string[], fn: string) => ngin.computed(key, deps, fn),
      nginScope: (prefix: string) => ngin.nginScope(prefix),
      snapshot: () => ngin.snapshot(),
      restore: (snapshot: any) => ngin.restore(snapshot),
      export: (prefix?: string) => ngin.export(prefix),
      import: (data: Record<string, unknown>, strategy?: any) => ngin.import(data, strategy),
      useNginMiddleware: (mw: any) => ngin.useNginMiddleware(mw),
      query: (expr: any) => ngin.query(expr),
      matchesQuery: (v: any, expr: any) => ngin.matchesQuery(v, expr),
      getMemoryEntries: () => ngin.getMemoryEntries(),
      openFile: (filePath: string) => ngin.openFile(filePath),
      closeFile: () => ngin.closeFile(),
      getTables: (useAux = false) => ngin.getTables(useAux),
      getSchema: (table: string, useAux = false) => ngin.getSchema(table, useAux),
      queryTable: (table: string, useAux = false) => ngin.queryTable(table, useAux),
      updateCell: (table: string, pkCol: string, pkVal: unknown, col: string, value: unknown, useAux = false) => ngin.updateCell(table, pkCol, pkVal, col, value, useAux),
      insertRow: (table: string, cols: string[], values: unknown[], useAux = false) => ngin.insertRow(table, cols, values, useAux),
      deleteRow: (table: string, pkCol: string, pkVal: unknown, useAux = false) => ngin.deleteRow(table, pkCol, pkVal, useAux),
      addColumn: (table: string, colName: string, colType: string, useAux = false) => ngin.addColumn(table, colName, colType, useAux),
      close: () => ngin.close(),
      unsub: (subId: number) => ngin.unsub(subId),
      // #endregion
      // #endregion
    }


    socket.on("message", async (raw: any) => {

      console.log('[CSE SERVER MESSAGE]', raw)
      let msg: RPCMsg
      try { msg = JSON.parse(raw.toString()) } catch { return }

      if (msg.type === "rpc:res" || msg.type === "rpc:chunk") {
        // find which workspace this response is meant to go back to
        const originId = getSauron<string>(routeKey((msg as any).clientId, msg.id))
        const originSocket = originId ? clientSockets.get(originId) : undefined

        if (originSocket && originSocket.readyState === WebSocket.OPEN) {
          originSocket.send(raw)
          if (msg.type === "rpc:res" || (msg as any).done) {
            deleteSauron(routeKey((msg as any).clientId, msg.id))
          }
          return
        }
      }

      if (msg.type !== "rpc") return

      const targetWorkspace = (msg as any).ws
      if (targetWorkspace && targetWorkspace !== currentWorkspace) {
        const targetSocket = clientSockets.get(targetWorkspace)

        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          // record who to send the eventual response back to — not the socket, just the id
          setSauron(routeKey((msg as any).clientId, msg.id), socketClientId ?? currentWorkspace)
          targetSocket.send(raw)
          return
        } else {
          send({ type: "rpc:res", id: msg.id, ok: false, error: `Workspace instance "${targetWorkspace}" is not connected.` })
          return
        }
      }

      // ─── END WORKSPACE ROUTING CHECK ─────────────────────────────────────

      if (msg.method === "stream") {
        // Grab the explicit keys straight out of the message
        const { rt, ms, p } = msg;

        staff.stream(rt, ms, p, (chunk: any) => {
          if (socket.readyState !== WebSocket.OPEN) return;
          if (chunk === null || chunk === undefined) {
            send({ type: "rpc:chunk", id: msg.id, done: true });
          } else {
            send({ type: "rpc:chunk", id: msg.id, chunk });
          }
        });
        return;
      }

      const fn = rpcMethods[msg.method]
      if (!fn) {
        send({ type: "rpc:res", id: msg.id, ok: false, error: `Unknown method: ${msg.method}` })
        return
      }

      try {
        const result = await fn(msg);
        send({ type: "rpc:res", id: msg.id, ok: true, result })
      } catch (err: any) {
        send({ type: "rpc:res", id: msg.id, ok: false, error: String(err?.message ?? err) })
      }
    })
    socket.on("close", () => {
      if (socketClientId) clientSockets.delete(socketClientId)
      subs.forEach((off) => off()
      )
      subs.clear()
    })
  })
}




