declare global {
  interface Window { WEBVIEW_WORKSPACE_CONTEXT?: string; }
}

const port = 11777;
const ws = new WebSocket(`ws://localhost:${port}`);
const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
let rpcId = 0;
const routedHandlers = new Map<string, Map<string, Set<(p: any) => void>>>();
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void; onChunk?: (c: any) => void }>();
const subHandlers = new Map<string, (p: any) => void>();
const sendQueue: string[] = [];

ws.onopen = () => {
  while (sendQueue.length) { ws.send(sendQueue.shift()!); }
  rpcCall("register", { clientId });
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data.toString()) as any;
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
    } else {
      entry.reject(new Error(msg.error));
    }
    return;
  }

  if (msg.type === "rpc:chunk") {
    const entry = pending.get(msg.id);
    if (!entry) return;

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
    if (handlers) handlers.forEach(h => h(msg.p));
    return;
  }
};

function channelRpc(method: string, rt: string, ms: string, extra?: Record<string, any>) { return rpcCall(method, { rt, ms, ...extra }); }
function addHandler2(rt: string, ms: string, handler: (p: any) => void) {
  if (!routedHandlers.has(rt)) routedHandlers.set(rt, new Map());
  const subMap = routedHandlers.get(rt)!;
  if (!subMap.has(ms)) subMap.set(ms, new Set());
  subMap.get(ms)!.add(handler);
  return () => subMap.get(ms)?.delete(handler);
}
function addHandler(_label: string, rt: string, ms: string, extra: { handler: (p: any) => void }) {
  const handler = extra.handler;
  if (!routedHandlers.has(rt)) routedHandlers.set(rt, new Map());
  const subMap = routedHandlers.get(rt)!;
  if (!subMap.has(ms)) subMap.set(ms, new Set());
  subMap.get(ms)!.add(handler);
  return () => subMap.get(ms)?.delete(handler);
}
function rpcCall(method: string, params?: Record<string, any>) {
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
    } else {
      console.warn("[WEBVIEW QUEUEING] Socket not ready. Queueing packet.");
      sendQueue.push(p);
    }
  });
}
function streamRpc(method: string, rt: string, ms: string, extra?: Record<string, any>) { return rpcCall(method, { rt, ms, ...extra }); }
function rpcStreamCall(method: string, onChunk: (c: any) => void, params?: Record<string, any>) {
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
    } else {
      console.warn("[WEBVIEW QUEUEING] Socket not ready. Queueing packet.");
      sendQueue.push(p);
    }
  });
}
function anyRpc(method: string, rt: string, ms: string, initial?: any) { return rpcCall(method, { rt, ms, initial }); }

export const staff = {
  sendsub: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) => channelRpc("sendsub", rt, ms, { p, ttl, binary }),
  multisub: (rt: string, ms: string, handler: (p: any) => void) => {
    const unsub = addHandler('multisub', rt, ms, { handler });
    channelRpc("multisub", rt, ms);
    return () => {
      unsub();
      channelRpc("unsub", rt, ms);
    };
  },

  // #region NORMAL FUNCTIONS
  gar: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) => rpcCall("gar", { rt, ms, p, ttl, binary }),
  reply: (replyChannel: string, ms: string, p: unknown) => rpcCall("reply", { replyChannel, ms, p }),
  on: (rt: string, ms: string, handler: any) => { return rpcCall("on", { rt, ms, handler }) },
  once: (rt: string, ms: string, handler: any) => { return rpcCall("once", { rt, ms, handler }) },
  scope: (prefix: string) => ({
    send: (rt: string, p: unknown, ttl?: number, binary = false) => rpcCall("send", { rt: `${prefix}:${rt}`, p, ttl, binary }),
    sub: (rt: string, handler: any) => rpcCall("sub", { rt: `${prefix}:${rt}`, handler }),
    gar: (rt: string, p: unknown, ttl?: number) => rpcCall("gar", { rt: `${prefix}:${rt}`, p, ttl }),
    use: (rt: string, fn: (msg: any) => boolean | void) => rpcCall("use", { rt: `${prefix}:${rt}`, fn: fn.toString() }),
    live: <T extends Record<string, unknown>>(rt: string, initial: T) => { return rpcCall("live", { rt: `${prefix}:${rt}`, initial }) },
    scope: (subprefix: string) => rpcCall("scope", { prefix: `${prefix}:${subprefix}` })
  }),
  scoped: (workspaceName: string) => rpcCall("scoped", { workspaceName }),
  hasSubscription: (rt: string) => rpcCall("hasSubscription", { rt }),
  receive: (msg: any) => rpcCall("receive", { msg }),
  // #endregion
  // #region STREAMS
  stream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("stream", onChunk, { rt, ms, p }),
  streamHandler: (rt: string, ms: string, handler: (d: any) => any, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
  streamChunk: (rt: string, ms: string, streamId: string, chunk: string, binary = false) => rpcCall("streamChunk", { rt, ms, streamId, chunk, binary }),
  streamDone: (rt: string, ms: string, streamId: string, binary = false) => rpcCall("streamDone", { rt, ms, streamId, binary }),
  cancelStream: (rt: string, ms: string, streamId: string, binary = false) => rpcCall("cancelStream", { rt, ms, streamId, binary }),

  duplex: (rt: string, ms: string, opts?: any) => streamRpc("duplex", rt, ms, opts),
  duplexHandler: (rt: string, ms: string, opts?: any) => streamRpc("duplexHandler", rt, ms, opts),

  useObservableState: (rt: string, ms: string, initial?: any) => anyRpc("useObservableState", rt, ms, initial),
  useOptimisticState: (rt: string, ms: string, initial?: any) => anyRpc("useOptimisticState", rt, ms, initial),
  live: (rt: string, ms: string, initial?: any) => anyRpc("live", rt, ms, initial),
  useLive: (rt: string, ms: string, initial?: any) => anyRpc("useLive", rt, ms, initial),
  stateLive: (rt: string, ms: string, initial?: any) => anyRpc("stateLive", rt, ms, initial),
  useStateLive: (rt: string, ms: string, initial?: any) => anyRpc("useStateLive", rt, ms, initial),
  useRefLive: (rt: string, ms: string, initial?: any) => anyRpc("useRefLive", rt, ms, initial),
  useUmbrellaStateLive: (rt: string, ms: string, initial?: any) => anyRpc("useUmbrellaStateLive", rt, ms, initial),
  useContextLive: (rt: string, ms: string, initial?: any) => anyRpc("useContextLive", rt, ms, initial),
  liveStore: (rt: string, ms: string, initial?: any) => anyRpc("liveStore", rt, ms, initial),
  useLiveStore: (rt: string, ms: string, initial?: any) => anyRpc("useLiveStore", rt, ms, initial), 


  // #endregion
  use: (rt: string, fn: (msg: any) => boolean | void) => rpcCall("use", { rt, fn: fn.toString() }),
  useGlobal: (mw: {
    beforeSend?(msg: any): boolean | void | Promise<boolean | void>
    afterSend?(msg: any, result: unknown): void | Promise<void>
    beforeReceive?(msg: any): boolean | void | Promise<boolean | void>
    afterReceive?(msg: any, result: unknown): void | Promise<void>
    onError?(err: Error, msg?: any): void | Promise<void>
  }) => rpcCall("useGlobal", { mw }),
  send: (rt: string, p: unknown, ttl?: number, binary = false) => rpcCall("send", { rt, p, ttl, binary }),
  sub: async (rt: string, handler: any) => {
    const subId = (await rpcCall("sub", { rt })) as any;
    subHandlers.set(subId, handler);
    return () => {
      subHandlers.delete(subId);
      rpcCall("unsub", { subId });
    };
  },

  request: (rt: string, ms: string, p: { timeout?: number;[key: string]: unknown }, binary = false) => rpcCall("request", { rt, ms, p, binary }),
  broadcast: (rt: string, p: unknown, ttl?: number) => rpcCall("broadcast", { rt, p, ttl }),
  subWithHistory: async (rt: string, ms: string, handler: any, options?: { limit?: number }) => {
    const subId = (await rpcCall("subWithHistory", { rt, ms, options })) as any;
    subHandlers.set(subId, handler);
    return () => {
      subHandlers.delete(subId);
      rpcCall("unsub", { subId });
    };
  },
  batch: (messages: { rt: string; p: { sequential?: boolean;[key: string]: unknown } }[], binary = false) => rpcCall("batch", { messages, binary }),
  createGroup: (name: string, channels: string[] = [], options?: any) => rpcCall("createGroup", { name, channels, options }),
  deleteGroup: (name: string) => rpcCall("deleteGroup", { name }),
  addToGroup: (name: string, rt: string) => rpcCall("addToGroup", { name, rt }),
  removeFromGroup: (name: string, rt: string) => rpcCall("removeFromGroup", { name, rt }),
  enableGroup: (name: string) => rpcCall("enableGroup", { name }),
  disableGroup: (name: string) => rpcCall("disableGroup", { name }),
  groupBroadcast: (name: string, p: unknown, ttl?: number) => rpcCall("groupBroadcast", { name, p, ttl }),
  subscribeByTag: async (tag: string, handler: any) => {
    const subId = (await rpcCall("subscribeByTag", { tag })) as any;
    subHandlers.set(subId, handler);
    return () => {
      subHandlers.delete(subId);
      rpcCall("unsub", { subId });
    };
  },

  setDefaultPriority: (priority: any) => rpcCall("setDefaultPriority", { priority }),
  getDefaultPriority: () => rpcCall("getDefaultPriority"),
  ack: (messageId: string) => rpcCall("ack", { messageId }),
  nak: (messageId: string, reason?: string) => rpcCall("nak", { messageId, reason }),
  onDeliveryReceipt: (handler: (info: { id: string; status: 'ack' | 'nak'; reason?: string }) => void) => rpcCall("onDeliveryReceipt", { handler }),
  listDeadLetters: (rt?: string) => rpcCall("listDeadLetters", { rt }),
  requeueDeadLetter: (id: string, ttl?: number) => rpcCall("requeueDeadLetter", { id, ttl }),
  subscribeDurable: async (rt: string, handler: any, options: any) => {
    const subId = (await rpcCall("subscribeDurable", { rt, options })) as any;
    subHandlers.set(subId, handler);
    return () => {
      subHandlers.delete(subId);
      rpcCall("unsub", { subId });
    };
  },
  setCheckpoint: (rt: string, ms: string, subscriberId: string, offset: number) => rpcCall("setCheckpoint", { rt, ms, subscriberId, offset }),
  getCheckpoint: (rt: string, ms: string, subscriberId: string) => rpcCall("getCheckpoint", { rt, ms, subscriberId }),
  replay: async (options: any, handler: any) => {
    const subId = (await rpcCall("replay", { options })) as any;
    subHandlers.set(subId, handler);
    return () => {
      subHandlers.delete(subId);
      rpcCall("unsub", { subId });
    };
  },
  groupUse: (name: string, fn: (msg: any) => boolean | void) => rpcCall("groupUse", { name, fn: fn.toString() }),
  setBackpressureConfig: (config: any) => rpcCall("setBackpressureConfig", { config }),
  setChannelSchema: (rt: string, schema: any) => rpcCall("setChannelSchema", { rt, schema }),
  getChannelSchema: (rt: string) => rpcCall("getChannelSchema", { rt }),
  setChannelPermissions: (rt: string, perms: any) => rpcCall("setChannelPermissions", { rt, perms }),
  getChannelPermissions: (rt: string) => rpcCall("getChannelPermissions", { rt }),
  addRouteRule: (rule: any) => rpcCall("addRouteRule", { rule }),
  removeRouteRule: (name: string) => rpcCall("removeRouteRule", { name }),
  listRouteRules: () => rpcCall("listRouteRules"),
  addTransform: (channelPattern: string, transform: any) => rpcCall("addTransform", { channelPattern, transform }),
  removeTransform: (channelPattern: string) => rpcCall("removeTransform", { channelPattern }),
  configureEncryption: (config: any) => rpcCall("configureEncryption", { config }),
  configureCompression: (config: any) => rpcCall("configureCompression", { config }),
  listTags: () => rpcCall("listTags"),
  listChannelsByTag: (tag: string) => rpcCall("listChannelsByTag", { tag }),
  listChannels: () => rpcCall("listChannels"),
  getChannelInfo: (rt: string) => rpcCall("getChannelInfo", { rt }),
  listHandlers: (rt?: string) => rpcCall("listHandlers", { rt }),
  listAdapters: () => rpcCall("listAdapters"),
  listMiddleware: () => rpcCall("listMiddleware"),
  getMessageCount: (rt: string) => rpcCall("getMessageCount", { rt }),
  getAdapterMetrics: () => rpcCall("getAdapterMetrics"),
  disableAdapter: (id: string) => rpcCall("disableAdapter", { id }),
  enableAdapter: (id: string) => rpcCall("enableAdapter", { id }),


  session: () => rpcCall("session"),
  useSession: () => rpcCall("useSession"),
  secrets: () => rpcCall("secrets"),
  useSecrets: () => rpcCall("useSecrets"),

  worker: <T = any, R = any>(queueChannel: string, ms: string, handler: (job: T) => Promise<R> | R, options: { concurrency?: number } = {}) => rpcCall("worker", { queueChannel, ms, handler, options }),
  enqueueJob: <T = any, R = any>(queueChannel: string, ms: string, p: T, timeoutMs = 30000) => rpcCall("enqueueJob", { queueChannel, ms, p, timeoutMs }),
  crdt: <T extends Record<string, unknown>>(rt: string, ms: string, initial: T) => rpcCall("crdt", { rt, ms, initial }),
  useCrdt: <T extends Record<string, unknown>>(rt: string, ms: string, initial: T) => rpcCall("useCrdt", { rt, ms, initial }), 
  notifications: (topic = 'global', ms: string) => rpcCall("notifications", { topic, ms }),
  useNotifications: (topic = 'global', ms: string) => rpcCall("useNotifications", { topic, ms }),
  config: <T extends Record<string, unknown>>(namespace: string, ms: string, defaultConfig: T) => rpcCall("config", { namespace, ms, defaultConfig }),
  useConfig: <T extends Record<string, unknown>>(namespace: string, ms: string, defaultConfig: T) => rpcCall("useConfig", { namespace, ms, defaultConfig }),
  useFeatureFlag: (flag: string, ms: string, defaultValue = false) => rpcCall("useFeatureFlag", { flag, ms, defaultValue }),
  lock: (rt: string, ms: string, resourceId: string, ttl = 30000) => rpcCall("lock", { rt, ms, resourceId, ttl }),
  mapReduce: <T, R>(rt: string, ms: string, mapper: (item: T) => R, reducer: (acc: R, item: R) => R, initial: R, timeoutMs = 5000) => rpcCall("mapReduce", { rt, ms, mapper: mapper.toString(), reducer: reducer.toString(), initial, timeoutMs }),
  rateLimit: (rt: string, ms: string, key: string, maxRequests: number, windowMs: number) => rpcCall("rateLimit", { rt, ms, key, maxRequests, windowMs }),
  appendOnlyLog: (rt: string, ms: string, options?: { maxSize?: number }) => rpcCall("appendOnlyLog", { rt, ms, options }),
  circuitBreaker: <T>(rt: string, ms: string, operation: () => Promise<T>, options: { failureThreshold: number; recoveryTimeout: number }) => rpcCall("circuitBreaker", { rt, ms, operation: operation.toString(), options }),
  


  transaction: <T extends Record<string, unknown>>(rt: string, ms: string, operations: { prepare: () => Promise<T>; commit: (data: T) => Promise<void>; 
    rollback: (data: T) => Promise<void> }) => rpcCall("transaction", { rt, ms, operations: { prepare: operations.prepare.toString(), commit: operations.commit.toString(), rollback: operations.rollback.toString() } }),
  autoFederate: (rt: string, ms: string, options: { maxLocalHandlers?: number } = {}) => rpcCall("autoFederate", { rt, ms, options }),
  visualFlow: (rt: string, ms: string, nodes: Array<{ id: string; transform: (data: any) => any; inputs: string[]; outputs: string[] }>) => rpcCall("visualFlow", { rt, ms, nodes: nodes.map(n => ({ ...n, transform: n.transform.toString() })) }),


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
  get: (key: any, global = false) => rpcCall("get", { key, global }),
  getMany: (keys: any, global = false) => rpcCall("getMany", { keys, global }),
  getMemory: (key: any, global = false) => rpcCall("getMemory", { key, global }),
  getManyMemory: (keys: any, global = false) => rpcCall("getManyMemory", { keys, global }),
  getLocalStorage: (key: any, global = false) => rpcCall("getLocalStorage", { key, global }),

  set: (key: any, value: any, global = false) => rpcCall("set", { key, value, global }),
  setMany: (entries: any, global = false) => rpcCall("setMany", { entries, global }),
  setMemory: (key: any, value: any, global = false) => rpcCall("setMemory", { key, value, global }),
  setManyMemory: (entries: any, global = false) => rpcCall("setManyMemory", { entries, global }),
  setLocalStorage: (key: any, value: any, global = false) => rpcCall("setLocalStorage", { key, value, global }),

  delete: (key: any, global = false) => rpcCall("delete", { key, global }),
  deleteMany: (keys: any, global = false) => rpcCall("deleteMany", { keys, global }),
  deleteMemory: (key: any, global = false) => rpcCall("deleteMemory", { key, global }),
  deleteManyMemory: (keys: any, global = false) => rpcCall("deleteManyMemory", { keys, global }),
  expire: (key: any, ms: any) => rpcCall("expire", { key, ms }),
  expireAt: (key: any, ts: any) => rpcCall("expireAt", { key, ts }),
  persist: (key: any) => rpcCall("persist", { key }),
  touch: (key: any, ms: any) => rpcCall("touch", { key, ms }),

  lock: {
    acquire: (key: any, ms: any) => rpcCall("lock:acquire", { key, ms }),
    release: (key: any, owner: any) => rpcCall("lock:release", { key, owner }),
    renew: (key: any, owner: any, ms: any) => rpcCall("lock:renew", { key, owner, ms }),
  },

  transaction: (ops: any) => rpcCall("transaction", { ops }),
  batch: (entries: any) => rpcCall("ngin:batch", { entries }),
  live: (key: any, initial: any) => rpcCall("ngin:live", { key, initial }),
  computed: (key: any, deps: any, fnBody: any) => rpcCall("computed", { key, deps, fnBody: fnBody.toString() }),
  snapshot: () => rpcCall("snapshot", {}),
  restore: (snap: any) => rpcCall("restore", { snap }),
  export: (prefix: any) => rpcCall("export", { prefix }),
  import: (data: any, strategy: any) => rpcCall("import", { data, strategy }),

  index: {
    create: (name: any, config: any) => rpcCall("index:create", { name, config }),
    query: (name: any, filter: any) => rpcCall("index:query", { name, filter }),
  },

  query: (expr: any) => rpcCall("query", { expr }),
  openFile: (path: any) => rpcCall("openFile", { path }),
  closeFile: () => rpcCall("closeFile", {}),
  getTables: () => rpcCall("getTables", {}),
  getSchema: (table: any) => rpcCall("getSchema", { table }),
  queryTable: (table: any) => rpcCall("queryTable", { table }),

  updateCell: (table: any, pkCol: any, pkVal: any, col: any, value: any) =>
    rpcCall("updateCell", { table, pkCol, pkVal, col, value }),
  insertRow: (table: any, cols: any, values: any) =>
    rpcCall("insertRow", { table, cols, values }),
  deleteRow: (table: any, pkCol: any, pkVal: any) =>
    rpcCall("deleteRow", { table, pkCol, pkVal }),
  addColumn: (table: any, col: any, type: any) =>
    rpcCall("addColumn", { table, col, type }),

  atomic: {
    compareAndSwap: (key: string, expected: any, next: any) =>
      rpcCall("atomicCompareAndSwap", { key, expected, next }),
    mutate: (key: string, fn: string) =>
      rpcCall("atomicMutate", { key, fn }),
    increment: (key: string, by = 1) =>
      rpcCall("atomicIncrement", { key, by }),
    append: (key: string, value: any) =>
      rpcCall("atomicAppend", { key, value })
  }
}
export function useCSENGIN() {
  return {
    gar: (rt: string, p: unknown, ttl?: number, binary = false) => rpcCall("gar", { rt, p, ttl, binary }),
    reply: (replyChannel: string, p: unknown) => rpcCall("reply", { replyChannel, p }),
    on: (rt: string, handler: any) => { return rpcCall("on", { rt, handler }) },
    once: (rt: string, handler: any) => { return rpcCall("once", { rt, handler }) },
    scope: (prefix: string) => ({
      send: (rt: string, p: unknown, ttl?: number, binary = false) => rpcCall("send", { rt: `${prefix}:${rt}`, p, ttl, binary }),
      sub: (rt: string, handler: any) => rpcCall("sub", { rt: `${prefix}:${rt}`, handler }),
      gar: (rt: string, p: unknown, ttl?: number) => rpcCall("gar", { rt: `${prefix}:${rt}`, p, ttl }),
      use: (rt: string, fn: (msg: any) => boolean | void) => rpcCall("use", { rt: `${prefix}:${rt}`, fn: fn.toString() }),
      live: <T extends Record<string, unknown>>(rt: string, initial: T) => { return rpcCall("live", { rt: `${prefix}:${rt}`, initial }) },
      scope: (subprefix: string) => rpcCall("scope", { prefix: `${prefix}:${subprefix}` })
    }),
    scoped: (workspaceName: string) => rpcCall("scoped", { workspaceName }),
    hasSubscription: (rt: string) => rpcCall("hasSubscription", { rt }),
    receive: (msg: any) => rpcCall("receive", { msg }),
    streamChunk: (rt: string, streamId: string, chunk: string, binary = false) => rpcCall("streamChunk", { rt, streamId, chunk, binary }),
    streamDone: (rt: string, streamId: string, binary = false) => rpcCall("streamDone", { rt, streamId, binary }),
    cancelStream: (rt: string, streamId: string, binary = false) => rpcCall("cancelStream", { rt, streamId, binary }),


    use: (rt: string, fn: (msg: any) => boolean | void) => rpcCall("use", { rt, fn: fn.toString() }),
    useGlobal: (mw: {
      beforeSend?(msg: any): boolean | void | Promise<boolean | void>
      afterSend?(msg: any, result: unknown): void | Promise<void>
      beforeReceive?(msg: any): boolean | void | Promise<boolean | void>
      afterReceive?(msg: any, result: unknown): void | Promise<void>
      onError?(err: Error, msg?: any): void | Promise<void>
    }) => rpcCall("useGlobal", { mw }),
    send: (rt: string, p: unknown, ttl?: number, binary = false) => rpcCall("send", { rt, p, ttl, binary }),
    sendsub: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) => rpcCall("sendsub", { rt, ms, p, ttl, binary }),
    sub: async (rt: string, handler: any) => {
      const subId = (await rpcCall("sub", { rt })) as any;
      subHandlers.set(subId, handler);
      return () => {
        subHandlers.delete(subId);
        rpcCall("unsub", { subId });
      };
    },
    multisub: async (rt: string, sc: string, handler: any) => {
      const subId = (await rpcCall("multisub", { rt, sc })) as any;
      subHandlers.set(subId, handler);
      return () => {
        subHandlers.delete(subId);
        rpcCall("unsub", { subId });
      };
    },
    stream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void, binary = false) => rpcStreamCall("stream", onChunk, { rt, ms, p, binary }),
    streamHandler: (rt: string, ms: string, handler: (d: any) => any, binary = false) => rpcCall("streamHandler", { rt, ms, handler, binary }),
    live: (rt: string, initial: Record<string, unknown> = {}) => rpcCall("live", { rt, initial }),
    useLive: (rt: string, initial: Record<string, unknown> = {}, binary = false) => rpcCall("useLive", { rt, initial, binary }),
    request: (rt: string, p: { timeout?: number;[key: string]: unknown }, binary = false) => rpcCall("request", { rt, p, binary }),
    broadcast: (rt: string, p: unknown, ttl?: number) => rpcCall("broadcast", { rt, p, ttl }),
    subWithHistory: async (rt: string, handler: any, options?: { limit?: number }) => {
      const subId = (await rpcCall("subWithHistory", { rt, options })) as any;
      subHandlers.set(subId, handler);
      return () => {
        subHandlers.delete(subId);
        rpcCall("unsub", { subId });
      };
    },
    batch: (messages: { rt: string; p: { sequential?: boolean;[key: string]: unknown } }[], binary = false) => rpcCall("batch", { messages, binary }),
    createGroup: (name: string, channels: string[] = [], options?: any) => rpcCall("createGroup", { name, channels, options }),
    deleteGroup: (name: string) => rpcCall("deleteGroup", { name }),
    addToGroup: (name: string, rt: string) => rpcCall("addToGroup", { name, rt }),
    removeFromGroup: (name: string, rt: string) => rpcCall("removeFromGroup", { name, rt }),
    enableGroup: (name: string) => rpcCall("enableGroup", { name }),
    disableGroup: (name: string) => rpcCall("disableGroup", { name }),
    groupBroadcast: (name: string, p: unknown, ttl?: number) => rpcCall("groupBroadcast", { name, p, ttl }),
    subscribeByTag: async (tag: string, handler: any) => {
      const subId = (await rpcCall("subscribeByTag", { tag })) as any;
      subHandlers.set(subId, handler);
      return () => {
        subHandlers.delete(subId);
        rpcCall("unsub", { subId });
      };
    },

    setDefaultPriority: (priority: any) => rpcCall("setDefaultPriority", { priority }),
    getDefaultPriority: () => rpcCall("getDefaultPriority"),
    ack: (messageId: string) => rpcCall("ack", { messageId }),
    nak: (messageId: string, reason?: string) => rpcCall("nak", { messageId, reason }),
    onDeliveryReceipt: (handler: (info: { id: string; status: 'ack' | 'nak'; reason?: string }) => void) => rpcCall("onDeliveryReceipt", { handler }),
    listDeadLetters: (rt?: string) => rpcCall("listDeadLetters", { rt }),
    requeueDeadLetter: (id: string, ttl?: number) => rpcCall("requeueDeadLetter", { id, ttl }),
    subscribeDurable: async (rt: string, handler: any, options: any) => {
      const subId = (await rpcCall("subscribeDurable", { rt, options })) as any;
      subHandlers.set(subId, handler);
      return () => {
        subHandlers.delete(subId);
        rpcCall("unsub", { subId });
      };
    },
    setCheckpoint: (rt: string, subscriberId: string, offset: number) => rpcCall("setCheckpoint", { rt, subscriberId, offset }),
    getCheckpoint: (rt: string, subscriberId: string) => rpcCall("getCheckpoint", { rt, subscriberId }),
    replay: async (options: any, handler: any) => {
      const subId = (await rpcCall("replay", { options })) as any;
      subHandlers.set(subId, handler);
      return () => {
        subHandlers.delete(subId);
        rpcCall("unsub", { subId });
      };
    },
    groupUse: (name: string, fn: (msg: any) => boolean | void) => rpcCall("groupUse", { name, fn: fn.toString() }),
    setBackpressureConfig: (config: any) => rpcCall("setBackpressureConfig", { config }),
    setChannelSchema: (rt: string, schema: any) => rpcCall("setChannelSchema", { rt, schema }),
    getChannelSchema: (rt: string) => rpcCall("getChannelSchema", { rt }),
    setChannelPermissions: (rt: string, perms: any) => rpcCall("setChannelPermissions", { rt, perms }),
    getChannelPermissions: (rt: string) => rpcCall("getChannelPermissions", { rt }),
    addRouteRule: (rule: any) => rpcCall("addRouteRule", { rule }),
    removeRouteRule: (name: string) => rpcCall("removeRouteRule", { name }),
    listRouteRules: () => rpcCall("listRouteRules"),
    addTransform: (channelPattern: string, transform: any) => rpcCall("addTransform", { channelPattern, transform }),
    removeTransform: (channelPattern: string) => rpcCall("removeTransform", { channelPattern }),
    configureEncryption: (config: any) => rpcCall("configureEncryption", { config }),
    configureCompression: (config: any) => rpcCall("configureCompression", { config }),
    listTags: () => rpcCall("listTags"),
    listChannelsByTag: (tag: string) => rpcCall("listChannelsByTag", { tag }),
    listChannels: () => rpcCall("listChannels"),
    getChannelInfo: (rt: string) => rpcCall("getChannelInfo", { rt }),
    listHandlers: (rt?: string) => rpcCall("listHandlers", { rt }),
    listAdapters: () => rpcCall("listAdapters"),
    listMiddleware: () => rpcCall("listMiddleware"),
    getMessageCount: (rt: string) => rpcCall("getMessageCount", { rt }),
    getAdapterMetrics: () => rpcCall("getAdapterMetrics"),
    disableAdapter: (id: string) => rpcCall("disableAdapter", { id }),
    enableAdapter: (id: string) => rpcCall("enableAdapter", { id }),


    session: () => rpcCall("session"),
    useSession: () => rpcCall("useSession"),
    secrets: () => rpcCall("secrets"),
    useSecrets: () => rpcCall("useSecrets"),
    worker: <T = any, R = any>(queueChannel: string, handler: (job: T) => Promise<R> | R, options: { concurrency?: number } = {}) => rpcCall("worker", { queueChannel, handler, options }),
    enqueueJob: <T = any, R = any>(queueChannel: string, p: T, timeoutMs = 30000) => rpcCall("enqueueJob", { queueChannel, p, timeoutMs }),
    crdt: <T extends Record<string, unknown>>(rt: string, initial: T) => rpcCall("crdt", { rt, initial }),
    useCrdt: <T extends Record<string, unknown>>(rt: string, initial: T) => rpcCall("useCrdt", { rt, initial }),
    signal: <T>(key: any, initialValue?: T | (() => T), options?: any) => rpcCall("signal", { key, initialValue, options }),
    useSignal: <T>(key: any, initialValue?: T | (() => T), options?: any) => rpcCall("useSignal", { key, initialValue, options }),
    notifications: (topic = 'global') => rpcCall("notifications", { topic }),
    useNotifications: (topic = 'global') => rpcCall("useNotifications", { topic }),
    config: <T extends Record<string, unknown>>(namespace: string, defaultConfig: T) => rpcCall("config", { namespace, defaultConfig }),
    useConfig: <T extends Record<string, unknown>>(namespace: string, defaultConfig: T) => rpcCall("useConfig", { namespace, defaultConfig }),
    useFeatureFlag: (flag: string, defaultValue = false) => rpcCall("useFeatureFlag", { flag, defaultValue }),
    lock: (rt: string, resourceId: string, ttl = 30000) => rpcCall("lock", { rt, resourceId, ttl }),
    mapReduce: <T, R>(rt: string, mapper: (item: T) => R, reducer: (acc: R, item: R) => R, initial: R, timeoutMs = 5000) => rpcCall("mapReduce", { rt, mapper: mapper.toString(), reducer: reducer.toString(), initial, timeoutMs }),
    machine: <T extends string>(rt: string, config: { initial: T; states: Record<T, { transitions: Record<string, T>; onEnter?: () => void }> }) => rpcCall("machine", { rt, config }),
    rateLimit: (rt: string, key: string, maxRequests: number, windowMs: number) => rpcCall("rateLimit", { rt, key, maxRequests, windowMs }),
    appendOnlyLog: (rt: string, options?: { maxSize?: number }) => rpcCall("appendOnlyLog", { rt, options }),
    circuitBreaker: <T>(rt: string, operation: () => Promise<T>, options: { failureThreshold: number; recoveryTimeout: number }) => rpcCall("circuitBreaker", { rt, operation: operation.toString(), options }),
    transaction: <T extends Record<string, unknown>>(rt: string, operations: { prepare: () => Promise<T>; commit: (data: T) => Promise<void>; rollback: (data: T) => Promise<void> }) => rpcCall("transaction", { rt, operations: { prepare: operations.prepare.toString(), commit: operations.commit.toString(), rollback: operations.rollback.toString() } }),
    autoFederate: (rt: string, options: { maxLocalHandlers?: number } = {}) => rpcCall("autoFederate", { rt, options }),
    visualFlow: (rt: string, nodes: Array<{ id: string; transform: (data: any) => any; inputs: string[]; outputs: string[] }>) => rpcCall("visualFlow", { rt, nodes: nodes.map(n => ({ ...n, transform: n.transform.toString() })) }),


    // NGIN
    get: (key: any, global = false) => rpcCall("get", { key, global }),
    getMany: (keys: any, global = false) => rpcCall("getMany", { keys, global }),
    getMemory: (key: any, global = false) => rpcCall("getMemory", { key, global }),
    getManyMemory: (keys: any, global = false) => rpcCall("getManyMemory", { keys, global }),
    getLocalStorage: (key: any, global = false) => rpcCall("getLocalStorage", { key, global }),

    set: (key: any, value: any, global = false) => rpcCall("set", { key, value, global }),
    setMany: (entries: any, global = false) => rpcCall("setMany", { entries, global }),
    setMemory: (key: any, value: any, global = false) => rpcCall("setMemory", { key, value, global }),
    setManyMemory: (entries: any, global = false) => rpcCall("setManyMemory", { entries, global }),
    setLocalStorage: (key: any, value: any, global = false) => rpcCall("setLocalStorage", { key, value, global }),

    delete: (key: any, global = false) => rpcCall("delete", { key, global }),
    deleteMany: (keys: any, global = false) => rpcCall("deleteMany", { keys, global }),
    deleteMemory: (key: any, global = false) => rpcCall("deleteMemory", { key, global }),
    deleteManyMemory: (keys: any, global = false) => rpcCall("deleteManyMemory", { keys, global }),
    expire: (key: any, ms: any) => rpcCall("expire", { key, ms }),
    expireAt: (key: any, ts: any) => rpcCall("expireAt", { key, ts }),
    persist: (key: any) => rpcCall("persist", { key }),
    touch: (key: any, ms: any) => rpcCall("touch", { key, ms }),

    ngin_lock: {
      acquire: (key: any, ms: any) => rpcCall("lock:acquire", { key, ms }),
      release: (key: any, owner: any) => rpcCall("lock:release", { key, owner }),
      renew: (key: any, owner: any, ms: any) => rpcCall("lock:renew", { key, owner, ms }),
    },

    ngin_transaction: (ops: any) => rpcCall("transaction", { ops }),
    ngin_batch: (entries: any) => rpcCall("ngin:batch", { entries }),
    ngin_live: (key: any, initial: any) => rpcCall("ngin:live", { key, initial }),
    computed: (key: any, deps: any, fnBody: any) => rpcCall("computed", { key, deps, fnBody: fnBody.toString() }),
    snapshot: () => rpcCall("snapshot", {}),
    restore: (snap: any) => rpcCall("restore", { snap }),
    export: (prefix: any) => rpcCall("export", { prefix }),
    import: (data: any, strategy: any) => rpcCall("import", { data, strategy }),

    index: {
      create: (name: any, config: any) => rpcCall("index:create", { name, config }),
      query: (name: any, filter: any) => rpcCall("index:query", { name, filter }),
    },

    query: (expr: any) => rpcCall("query", { expr }),
    openFile: (path: any) => rpcCall("openFile", { path }),
    closeFile: () => rpcCall("closeFile", {}),
    getTables: () => rpcCall("getTables", {}),
    getSchema: (table: any) => rpcCall("getSchema", { table }),
    queryTable: (table: any) => rpcCall("queryTable", { table }),

    updateCell: (table: any, pkCol: any, pkVal: any, col: any, value: any) => rpcCall("updateCell", { table, pkCol, pkVal, col, value }),
    insertRow: (table: any, cols: any, values: any) => rpcCall("insertRow", { table, cols, values }),
    deleteRow: (table: any, pkCol: any, pkVal: any) => rpcCall("deleteRow", { table, pkCol, pkVal }),
    addColumn: (table: any, col: any, type: any) => rpcCall("addColumn", { table, col, type }),

    atomic: {
      compareAndSwap: (key: string, expected: any, next: any) =>
        rpcCall("atomicCompareAndSwap", { key, expected, next }),
      mutate: (key: string, fn: string) =>
        rpcCall("atomicMutate", { key, fn }),
      increment: (key: string, by = 1) =>
        rpcCall("atomicIncrement", { key, by }),
      append: (key: string, value: any) =>
        rpcCall("atomicAppend", { key, value })
    }
  }
}

type cmds = "file" | "fileAtLine" | "url" | "command" | "powershellCommand" | "debianCMD" | "snippet" | "chain" | "concurrent" | "copyValue" | "cmdChain" | "settingsToggle" | "apiCall" | "label" | "search" | "layout" | "folder" | "npmScripts" | "tasks" | "md" | "conditionalChain" | "menu" | "wait" | "wsnote" | "argChain" | "argConcurrent" | "conditional" | "fire" | "fireDebian"

export async function exeCmd(command: string, targetDir: string, type: cmds, args: any, timeout = 2000) {
  const result = await staff.send("[TM][EXE]", { command, targetDir, args, type, timeout })
  return result
}
export async function exeVSCCmd(command: string, args?: any) {
  const result = await staff.send("[VSC][EXE]", { command, args })
  return result
}









