// #region █████████ GLOBAL ███████████████████████████████████████████████████████████████████████████████████████████████████
declare global {
  interface Window { WEBVIEW_WORKSPACE_CONTEXT?: string; }
}

// #endregion
// #region █████████ CONSTANTS ████████████████████████████████████████████████████████████████████████████████████████████████
const port = 11777;
const ws = new WebSocket(`ws://localhost:${port}`);
const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
let rpcId = 0;
const routedHandlers = new Map<string, Map<string, Set<(p: any) => void>>>();
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void; onChunk?: (c: any) => void }>();
const subHandlers = new Map<string, (p: any) => void>();
const sendQueue: string[] = [];
// #endregion
// #region █████████ WS ███████████████████████████████████████████████████████████████████████████████████████████████████████
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
// #endregion
// #region █████████ RPC FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████

function channelRpc(method: string, k: string, sl: string, ms: string, rt: string, extra?: Record<string, any>) { return rpcCall(method, { k, sl, ms, rt, ...extra }); }
function addHandler2(handler: (p: any) => void, k: string, sl: string, ms: string, rt: string) {
  if (!routedHandlers.has(rt)) routedHandlers.set(rt, new Map());
  const subMap = routedHandlers.get(rt)!;
  if (!subMap.has(ms)) subMap.set(ms, new Set());
  subMap.get(ms)!.add(handler);
  return () => subMap.get(ms)?.delete(handler);
}
function addHandler(_label: string, k: string, sl: string, ms: string, rt: string, extra: { handler: (p: any) => void }) {
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

function streamRpc(method: string, k: string, sl: string, ms: string, rt: string, extra?: Record<string, any>) { return rpcCall(method, { k, sl, ms, rt, ...extra }); }
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
    if (ws.readyState === WebSocket.OPEN) { ws.send(p); }
    else { console.warn("[WEBVIEW QUEUEING] Socket not ready. Queueing packet."); sendQueue.push(p); }
  });
}
function anyRpc(method: string, k: string, sl: string, ms: string, rt: string, initial?: any, ...opts: any) { return rpcCall(method, { k, sl, ms, rt, initial, ...opts }); }
function anykeyRpc(method: string, key: string, ...opts: any) { return rpcCall(method, { key, ...opts }); }
function createDuplexRpcProxy<TUp = any, TDown = any>(
  method: 'sx' | 'sxHandler',
  k: string, sl: string, ms: string, rt: string,
  opts?: any,
  type = 'default'
) {
  const downHandlers = new Set<(chunk: TDown, seq: number) => void>();
  const errorHandlers = new Set<(err: any) => void>();
  const closeHandlers = new Set<() => void>();

  let streamId: string | undefined;
  let closed = false;
  let fullyClosed = false;
  let fatallyErrored = false;

  const downUnsub = addHandler2(

    (p: any) => {
      if (closed) return;

      const chunk = p?.chunk ?? p;
      const seq = p?.seq ?? -1;

      downHandlers.forEach(handler => handler(chunk, seq));
    }, k,
    `${sl}:down`,
    ms,
    rt,
  );

  const errorUnsub = addHandler2(
    (err: any) => {
      if (closed) return;

      errorHandlers.forEach(handler => handler(err));

      if (err.fatal) {
        fatallyErrored = true;
        closed = true;
      }
    }, k,
    `${sl}:error`,
    ms,
    rt,
  );

  const closeUnsub = addHandler2(
    (dir: 'up' | 'down') => {
      if (dir === 'up' || dir === 'down') {
        closeHandlers.forEach(handler => handler());
      }
    }, k,
    `${sl}:remote-close`,
    ms,
    rt,
  );

  const establish = rpcCall(method, {
    rt,
    ms,
    opts,
    type,
  }).then((result: any) => {
    streamId = result?.streamId ?? result?.id;
    return result;
  });

  const streamCall = (
    operation: string,
    p?: any
  ) => {
    return establish.then(() =>
      rpcCall(`${method}:${operation}`, {
        rt,
        ms,
        streamId,
        p,
      })
    );
  };

  return {
    send: (p: TUp) => {
      if (closed || fatallyErrored) return;

      void streamCall('send', p);
    },

    onData: (
      handler: (chunk: TDown, seq: number) => void
    ) => {
      if (closed) return () => { };

      downHandlers.add(handler);

      return () => {
        downHandlers.delete(handler);
      };
    },

    onError: (
      handler: (err: any) => void
    ) => {
      if (closed) return () => { };

      errorHandlers.add(handler);

      return () => {
        errorHandlers.delete(handler);
      };
    },

    onRemoteClose: (
      handler: () => void
    ) => {
      if (closed) return () => { };

      closeHandlers.add(handler);

      return () => {
        closeHandlers.delete(handler);
      };
    },

    closeUp: () => {
      if (closed) return;

      void streamCall('closeUp');
    },

    closeDown: () => {
      if (closed) return;

      void streamCall('closeDown');
    },

    close: () => {
      if (closed) return;

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
// #region █████████ TYPES ████████████████████████████████████████████████████████████████████████████████████████████████████

type RpcCall = (op: string, params: Record<string, any>) => Promise<any>;
type ChannelRpc = (op: string, rt: string, ms: string, params?: Record<string, any>) => Promise<any>;
type AnyRpc = (op: string, rt: string, ms: string, ...args: any[]) => Promise<any>;
type AnyKeyRpc = (op: string, key: string, ...args: any[]) => Promise<any>;
type RpcStreamCall = (op: string, onChunk: (chunk: any) => void, params?: Record<string, any>) => Promise<any>;
type StreamRpc = (op: string, rt: string, ms: string, params?: Record<string, any>) => Promise<any>;
type AddHandler = (type: string, rt: string, ms: string, params: Record<string, any>) => () => void;
type CreateDuplexRpcProxy = (op: string, rt: string, ms: string, params?: Record<string, any>) => any;
type Unsubscribe = () => void;
type MessageHandler = (p: any) => void | Promise<void>;
interface DuplexStreamProxy<TUp = any, TDown = any> {
  send: (p: TUp) => void;
  onData: (handler: (chunk: TDown, seq: number) => void) => () => void;
  onError: (handler: (err: any) => void) => () => void;
  onRemoteClose: (handler: () => void) => () => void;
  closeUp: () => void;
  closeDown: () => void;
  close: () => void;
  isFullyClosed: () => boolean;
  isFatallyErrored: () => boolean;
}
interface Kvdb {
  // ─── MEMORY ──────────────────────────────────────────────────────
  getMemory: (key: any, global?: boolean) => Promise<any>;
  getManyMemory: (keys: any, global?: boolean) => Promise<any>;
  setMemory: (key: any, value: any, global?: boolean) => Promise<any>;
  setManyMemory: (entries: any, global?: boolean) => Promise<any>;
  deleteMemory: (key: any, global?: boolean) => Promise<any>;
  deleteManyMemory: (keys: any, global?: boolean) => Promise<any>;

  // ─── LOCAL STORAGE ──────────────────────────────────────────────
  getLocalStorage: (key: any, global?: boolean) => Promise<any>;
  getManyLocalStorage: (keys: string[]) => Promise<any>;
  setLocalStorage: (key: any, value: any, global?: boolean) => Promise<any>;
  setManyLocalStorage: (entries: Record<string, any>) => Promise<any>;
  deleteLocalStorage: (key: string) => Promise<any>;

  // ─── SESSION STORAGE ────────────────────────────────────────────
  getSessionStorage: (key: string) => Promise<any>;
  getManySessionStorage: (keys: string[]) => Promise<any>;
  setSessionStorage: (key: string, value: any) => Promise<any>;
  setManySessionStorage: (entries: Record<string, any>) => Promise<any>;
  deleteSessionStorage: (key: string) => Promise<any>;

  // ─── COOKIES ─────────────────────────────────────────────────────
  getCookie: (key: string) => Promise<any>;
  getManyCookie: (keys: string[]) => Promise<any>;
  setCookie: (key: string, value: any, options?: CookieOptions) => Promise<any>;
  setManyCookie: (entries: Record<string, any>, options?: CookieOptions) => Promise<any>;
  deleteCookie: (key: string, path?: string, domain?: string) => Promise<any>;

  // ─── SAURON (REACTIVE STATE) ────────────────────────────────────
  publish: (key: string | symbol, value: any, opts?: any) => Promise<any>;
  subscribe: (key: string | symbol, listener: (value: any) => void, opts?: any) => Promise<any>;
  getAllSauron: (opts?: any) => Promise<any>;
  setSauron: (label: string, value: any, triggerRender?: boolean, sl_reg?: any, ms_reg?: any, globalKey?: any) => Promise<any>;
  getSauron: (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => Promise<any>;
  subSauron: (label: string, fn: (value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => Promise<any>;
  deleteSauron: (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => Promise<any>;
  subAllSauron: (fn: (key: string | symbol, value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => Promise<any>;

  // ─── SCOPED REGISTRY ────────────────────────────────────────────
  createRegistry: (name: string) => Promise<any & { name: string; destroy(): void }>;
  getRegistry: (name: string) => Promise<any>;
  getAllRegistries: () => Promise<any>;
  getGR: (label: string, registry: string) => Promise<any>;

  // ─── HYPER SCOPED REGISTRY ─────────────────────────────────────
  createScopedReg: (name: string) => Promise<any>;

  // ─── BINARY ─────────────────────────────────────────────────────
  getBinary: (key: string) => Promise<any>;
  setBinary: (key: string, value: any) => Promise<any>;
  deleteBinary: (key: string) => Promise<any>;

  // ─── GLOBAL THIS ────────────────────────────────────────────────
  setGT: (label: string, value: any) => Promise<any>;
  setManyGT: (entries: Record<string, any>) => Promise<any>;
  getGT: (label: string) => Promise<any>;
  getManyGT: (keys: string[]) => Promise<any>;
  deleteGT: (label: string) => Promise<any>;
  deleteManyGT: (keys: string[]) => Promise<any>;

  // ─── BASIC GET/SET ──────────────────────────────────────────────
  get: (key: any, global?: boolean) => Promise<any>;
  getMany: (keys: any, global?: boolean) => Promise<any>;
  set: (key: any, value: any, global?: boolean) => Promise<any>;
  setMany: (entries: any, global?: boolean) => Promise<any>;
  delete: (key: any, global?: boolean) => Promise<any>;
  deleteMany: (keys: any, global?: boolean) => Promise<any>;

  // ─── TTL ─────────────────────────────────────────────────────────
  expire: (key: any, ms: any) => Promise<any>;
  expireAt: (key: any, ts: any) => Promise<any>;
  persist: (key: any) => Promise<any>;
  touch: (key: any, ms: any) => Promise<any>;

  // ─── LOCKS ──────────────────────────────────────────────────────
  lock: {
    acquire: (key: any, ms: any) => Promise<any>;
    release: (key: any, owner: any) => Promise<any>;
    renew: (key: any, owner: any, ms: any) => Promise<any>;
  };

  // ─── ADVANCED ───────────────────────────────────────────────────
  transaction: (ops: any) => Promise<any>;
  batch: (entries: any) => Promise<any>;
  live: (key: any, initial: any) => Promise<any>;
  computed: (key: any, deps: any, fnBody: any) => Promise<any>;

  // ─── SNAPSHOT ──────────────────────────────────────────────────
  snapshot: () => Promise<any>;
  restore: (snap: any) => Promise<any>;
  export: (prefix: any) => Promise<any>;
  import: (data: any, strategy: any) => Promise<any>;

  // ─── INDEX ──────────────────────────────────────────────────────
  index: {
    create: (name: any, config: any) => Promise<any>;
    query: (name: any, filter: any) => Promise<any>;
  };

  // ─── QUERY ──────────────────────────────────────────────────────
  query: (expr: any) => Promise<any>;

  // ─── SQLITE ────────────────────────────────────────────────────
  openFile: (path: any) => Promise<any>;
  closeFile: () => Promise<any>;
  getTables: () => Promise<any>;
  getSchema: (table: any) => Promise<any>;
  queryTable: (table: any) => Promise<any>;

  updateCell: (table: any, pkCol: any, pkVal: any, col: any, value: any) => Promise<any>;
  insertRow: (table: any, cols: any, values: any) => Promise<any>;
  deleteRow: (table: any, pkCol: any, pkVal: any) => Promise<any>;
  addColumn: (table: any, col: any, type: any) => Promise<any>;
  // ─── ATOMIC ─────────────────────────────────────────────────────
  atomic: {
    compareAndSwap: (key: string, expected: any, next: any) => Promise<any>;
    mutate: (key: string, fn: string) => Promise<any>;
    increment: (key: string, by?: number) => Promise<any>;
    append: (key: string, value: any) => Promise<any>;
  };
  matchesQuery: (v: any, expr: any) => any
  useLive: () => any
  close: () => any
  scope: (prefix: string) => any
  setIfChanged: (key: string, value: any) => Promise<any>
  use: (mw: any) => any
  sync: (key: string, options?: { direction?: 'memory->adapter' | 'adapter->memory' | 'both' }) => Promise<any>

  watch: (key: string, handler: (value: any) => void) => Promise<any>
  watchMany: (keys: string[], handler: (value: any) => void) => Promise<any>
  watchPattern: (pattern: string, handler: (value: any) => void) => Promise<any>
  watchPrefix: (prefix: string, handler: (value: any) => void) => Promise<any>
  watchAll: (handler: (value: any) => void) => Promise<any>
  scoped: (workspaceName: string) => any








}

interface CookieOptions {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// #endregion
// #region █████████ CONSTANTS ███████████████████████████████████████████████████████████████████████████████████████████████
function FUCKYourRpc(method: string, ...props: any) {
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
    const onChunk = props.onChunk
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, onChunk });
      if (ws.readyState === WebSocket.OPEN) { ws.send(p); }
      else { console.warn("[WEBVIEW QUEUEING] Socket not ready. Queueing packet."); sendQueue.push(p); }
    });
  } else if (props.method === 'duplex') {
    const downHandlers = new Set<(chunk: any, seq: number) => void>();
    const errorHandlers = new Set<(err: any) => void>();
    const closeHandlers = new Set<() => void>();

    let streamId: string | undefined;
    let closed = false;
    let fullyClosed = false;
    let fatallyErrored = false;

    const downUnsub = addHandler2(

      (p: any) => {
        if (closed) return;

        const chunk = p?.chunk ?? p;
        const seq = p?.seq ?? -1;

        downHandlers.forEach(handler => handler(chunk, seq));
      }, props.k,
      `${props.sl}:down`,
      props.ms,
      props.rt,
    );

    const errorUnsub = addHandler2(
      (err: any) => {
        if (closed) return;

        errorHandlers.forEach(handler => handler(err));

        if (err.fatal) {
          fatallyErrored = true;
          closed = true;
        }
      }, props.k,
      `${props.sl}:error`,
      props.ms,
      props.rt,
    );

    const closeUnsub = addHandler2(
      (dir: 'up' | 'down') => {
        if (dir === 'up' || dir === 'down') {
          closeHandlers.forEach(handler => handler());
        }
      }, props.k,
      `${props.sl}:remote-close`,
      props.ms,
      props.rt,
    );
    const establish = rpcCall(method, {
      ...props
    }).then((result: any) => {
      streamId = result?.streamId ?? result?.id;
      return result;
    });

    const streamCall = (
      operation: string,
      p?: any
    ) => {
      return establish.then(() =>
        rpcCall(`${method}:${operation}`, {

          streamId,
          p,
          ...props
        })
      );
    };

    return {
      send: (p: any) => {
        if (closed || fatallyErrored) return;

        void streamCall('send', p);
      },

      onData: (
        handler: (chunk: any, seq: number) => void
      ) => {
        if (closed) return () => { };

        downHandlers.add(handler);

        return () => {
          downHandlers.delete(handler);
        };
      },

      onError: (
        handler: (err: any) => void
      ) => {
        if (closed) return () => { };

        errorHandlers.add(handler);

        return () => {
          errorHandlers.delete(handler);
        };
      },

      onRemoteClose: (
        handler: () => void
      ) => {
        if (closed) return () => { };

        closeHandlers.add(handler);

        return () => {
          closeHandlers.delete(handler);
        };
      },

      closeUp: () => {
        if (closed) return;

        void streamCall('closeUp');
      },

      closeDown: () => {
        if (closed) return;

        void streamCall('closeDown');
      },

      close: () => {
        if (closed) return;

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
  } else {
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      if (ws.readyState === WebSocket.OPEN) { ws.send(p); }
      else { console.warn("[WEBVIEW QUEUEING] Socket not ready. Queueing packet."); sendQueue.push(p); }
    });
  }
}
export const staff = new Proxy({} as any, {
  get: (_, verb: string) => (...args: any[]) => FUCKYourRpc(verb, ...args)
});
export const staff1 = {
  // #region █████████ BASE FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████
  sendsub: (p: any, k: string, sl: string, ms: string, rt: string, ttl?: number, binary = false) => channelRpc("sendsub", { p, ttl, binary }, k, sl, ms, rt, ttl, binary),
  send: (p: any, k: string, sl: string, ms: string, rt: string, ttl?: number, binary = false) => channelRpc("sendsub", { p, ttl, binary }, k, sl, ms, rt, ttl, binary),
  multisub: (handler: (p: any) => void, k: string, sl: string, ms: string, rt: string) => {
    const unsub = addHandler('multisub', k, sl, ms, rt, { handler },);
    channelRpc("multisub", k, sl, ms, rt);
    return () => {
      unsub();
      channelRpc("unsub", k, sl, ms, rt);
    };
  },
  // #endregion
  // #region █████████ STREAMS ██████████████████████████████████████████████████████████████████████████████████████████████
  stream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("stream", onChunk, { rt, ms, p }),
  streamHandler: (rt: string, ms: string, handler: (d: any) => any, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
  streamChunk: (rt: string, ms: string, streamId: string, chunk: string, binary = false) => rpcCall("streamChunk", { rt, ms, streamId, chunk, binary }),
  streamDone: (rt: string, ms: string, streamId: string, binary = false) => rpcCall("streamDone", { rt, ms, streamId, binary }),

  cancelStream: (rt: string, ms: string, streamId: string, binary = false) => rpcCall("cancelStream", { rt, ms, streamId, binary }),
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
  // heatbeatStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("heatbeatStreamHandler", rt, ms, handler),
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
  // #endregion
  // #region █████████ DUPLEX ███████████████████████████████████████████████████████████████████████████████████████████████
  duplex: (rt: string, ms: string, opts?: any, type?: string) => streamRpc("duplex", rt, ms, { opts, type }),
  openStream: (rt: string, ms: string, opts?: any,) => streamRpc("openStream", rt, ms, { opts, }),
  sx: (rt: string, ms: string, opts?: any, type?: string) => createDuplexRpcProxy("sx", rt, ms, { opts, type }),
  sxHandler: (rt: string, ms: string, opts?: any, type?: string) => createDuplexRpcProxy("sxHandler", rt, ms, { opts, type }),
  // #endregion
  // #region █████████ DRSS - DISTRBUTED REACTIVE STATE STREAMS ██████████████████████████████████████████████████████████
  useDRSS: () => anyRpc("useDRSS", '', '',),
  useDRSSHandler: () => anyRpc("useDRSSHandler", '', '',),
  useDRSSSync: () => anyRpc("useDRSSSync", '', '',),
  useDRSSSyncHandler: () => anyRpc("useDRSSSyncHandler", '', '',),
  // #endregion
  // #region █████████ DRS ██████████████████████████████████████████████████████████████████████████████████████████████████
  useObservableState: (rt: string, ms: string, initial?: any) => anyRpc("useObservableState", rt, ms, initial),
  useOptimisticState: (rt: string, ms: string, initial?: any) => anyRpc("useOptimisticState", rt, ms, initial),
  DRS: (rt: string, ms: string, initial?: any) => anyRpc("DRS", rt, ms, initial),
  live: (rt: string, ms: string, initial?: any) => anyRpc("live", rt, ms, initial),
  useLive: (rt: string, ms: string, initial?: any) => anyRpc("useLive", rt, ms, initial),
  useDRS: (rt: string, ms: string, initial?: any) => anyRpc("useDRS", rt, ms, initial),
  stateLive: (rt: string, ms: string, initial?: any) => anyRpc("stateLive", rt, ms, initial),
  stateDRS: (rt: string, ms: string, initial?: any) => anyRpc("stateDRS", rt, ms, initial),
  useStateCRDT: (rt: string, ms: string, initial?: any) => anyRpc("useStateCRDT", rt, ms, initial),
  useStateDRS: (rt: string, ms: string, initial?: any) => anyRpc("useStateDRS", rt, ms, initial),
  useRefDRS: (rt: string, ms: string, initial?: any) => anyRpc("useRefDRS", rt, ms, initial),
  useUmbrellaDRS: (rt: string, ms: string, initial?: any) => anyRpc("useUmbrellaDRS", rt, ms, initial),
  useContextDRS: (rt: string, ms: string, initial?: any) => anyRpc("useContextDRS", rt, ms, initial),
  DRSStore: (rt: string, ms: string, initial?: any) => anyRpc("DRSStore", rt, ms, initial),
  useDRSStore: (rt: string, ms: string, initial?: any) => anyRpc("useDRSStore", rt, ms, initial),
  useEffectDRS: (rt: string, ms: string, effect: any, deps: any[] = []) => anyRpc("useEffectDRS", rt, ms, { effect, deps }),
  useAutoEffectDRS: (rt: string, ms: string, effect: any, deps: any[] = []) => anyRpc("useAutoEffectDRS", rt, ms, { effect, deps }),
  useDeferredValueDRS: (rt: string, ms: string,) => anyRpc("useDeferredValueDRS", rt, ms),
  useImperativeHandleDRS: (ref: any, rt: string, ms: string, createHandle: any, deps: any[] = []) => anyRpc("useImperativeHandleDRS", rt, ms, { ref, createHandle, deps }),
  useMemoDRS: (sources: [rt: string, ms: string][], compute: any) => anyRpc("useMemoDRS", "", "", { sources, compute }),
  useReverseHeartbeat: (rt: string, ms: string, nodeId?: string, resetIntervalMs?: number) => anyRpc("useReverseHeartbeat", rt, ms, { nodeId, resetIntervalMs }),
  useDRSDBRaft: (rt: string, ms: string, initial: any) => anyRpc("useDRSDBRaft", rt, ms, { initial }),
  useRxDBRaft: (rt: string, ms: string, initial?: any, db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => anyRpc("useRxDBRaft", rt, ms, { initial, db }),
  useDRSDBYata: (rt: string, ms: string) => anyRpc("useDRSDBYata", rt, ms),
  useRxDBYata: (rt: string, ms: string, initial?: any[], db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => anyRpc("useRxDBYata", rt, ms, { initial, db }),
  useRTDB: (rt: string, ms: string, initial: any, db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => anyRpc("useRTDB", rt, ms, { initial, db }),
  drsdb: (rt: string, ms: string, initial: any) => anyRpc("drsdb", rt, ms, { initial }),
  useDRSDB: (rt: string, ms: string, initial: any) => anyRpc("useDRSDB", rt, ms, { initial }),
  useDRSDBOptimistic: (rt: string, ms: string, initial: any) => anyRpc("useDRSDBOptimistic", rt, ms, { initial }),
  useDRSDBCRDT: () => anyRpc("useDRSDBCRDT", '', '',),
  rtdbStream: () => anyRpc("useDRSDBCRDT", '', '',),
  drsdbStream: () => anyRpc("useDRSDBCRDT", '', '',),
  // #endregion
  // #region █████████ CONDITIONALS ████████████████████████████████████████████████████████████████████████████████████████
  barrier: (rt: string, ms: string, participantId: string, total: number, options: { timeoutMs?: number; autoReset?: boolean } = {}) => anyRpc("barrier", rt, ms, { participantId, total, options }),
  latch: (rt: string, ms: string) => anyRpc("latch", rt, ms),
  gateMaster: (rt: string, ms: string, gatesFactory: any, options: any = { concurrency: true }) => anyRpc("gateMaster", rt, ms, { gatesFactory, options }),
  gateMaster2: (rt: string, ms: string, gates: any) => anyRpc("gateMaster2", rt, ms, { gates }),
  floodGateWithLive: () => anyRpc("floodGateWithLive", '', '',),
  plinko: (rt: string, ms: string, initialState: any, tree: any, options: any = {}) => anyRpc("plinko", rt, ms, { initialState, tree, options }),
  plinko3: (rt: string, ms: string) => anyRpc("plinko3", rt, ms),
  plinko2: (rt: string, ms: string, tree: any, options: any = {}) => anyRpc("plinko2", rt, ms, tree, options),
  getCircuitBreaker: (rt: string, options?: any) => anyRpc("getCircuitBreaker", rt, options),
  circuitBreaker: <T>(rt: string, ms: string, operation: () => Promise<T>, options: { failureThreshold: number; recoveryTimeout: number }) => anyRpc("circuitBreaker", rt, ms, operation, options),
  conditionVariable: (rt: string, ms: string, raft: any, nodeId: string) => anyRpc("conditionVariable", rt, ms, raft, nodeId),
  // #endregion
  // #region █████████ SPECIALTY ███████████████████████████████████████████████████████████████████████████████████████████
  worker: () => anyRpc("worker", '', '',),
  cron: () => anyRpc("cron", '', '',),
  fusebox: (rt: string, ms: string, options: { globalFailureThreshold?: number; anomalyWindowMs?: number; autoTrip?: boolean; } = {}) => anyRpc("fusebox", rt, ms, options),
  tripwire: <T extends Record<string, unknown>>(rt: string, ms: string, stateTarget: T, options: {
    walBuffer?: () => Array<unknown>;
    snapshotInterval?: number;
  } = {}) => anyRpc("tripwire", rt, ms, stateTarget, options),
  fathom: (
    rt: string,
    ms: string,
    options: {
      samplingWindowMs?: number;
      highWatermark?: number;
      criticalWatermark?: number;
    } = {}
  ) => anyRpc("fathom", rt, ms, options),
  rigging: () => anyRpc("rigging", "", ""),
  circus: (rt: string, ms: string, options: any = {}) => anyRpc("circus", rt, ms, options),
  nebula: (rt: string, ms: string, options: any = {}) => anyRpc("nebula", rt, ms, options),
  cyclone: (rt: string, ms: string, options: any = {}) => anyRpc("cyclone", rt, ms, options),
  trident: (rt: string, ms: string, options: any = {}) => anyRpc("trident", rt, ms, options),
  anchor: (rt: string, ms: string, options: any = {}) => anyRpc("anchor", rt, ms, options),
  pipeline: (rt: string, ms: string) => anyRpc("pipeline", rt, ms),
  tide: (rt: string, ms: string, options: any) => anyRpc("tide", rt, ms, options),
  mesh: (rt: string, ms: string, options?: any) => anyRpc("mesh", rt, ms, options),
  echo: <T = any, R = any>(rt: string, ms: string) => anyRpc("echo", rt, ms),
  carousel: (rt: string, ms: string, options: any = {}) => anyRpc("carousel", rt, ms, options),
  synapse: (localChannel: string, local_sub_channel: string, remoteChannel: string, remote_sub_channel: string, options: any = {}) => anyRpc("synapse", localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options),
  abortableFlight: (rt: string, ms: string) => anyRpc("abortableFlight", rt, ms),
  tokenBucket: (rt: string, ms: string, options: any = {}) => anyRpc("tokenBucket", rt, ms, options),
  tokenBucket_simple: (maxTokens?: number, refillRateMs?: number) => anyRpc("tokenBucket_simple", "", "", maxTokens, refillRateMs),
  resilience: (rt: string, ms: string, options: any = {}) => anyRpc("resilience", rt, ms, options),
  saga: <TContext extends Record<string, unknown>>(sagaId: string, ms: string, context: TContext) => anyRpc("saga", sagaId, ms, context),

  ecs: (rt: string, ms: string) => anyRpc("ecs", rt, ms),
  commandBuffer: (rt: string, ms: string, options?: { batchSize?: number; flushInterval?: number; walPath?: string; }) => anyRpc("commandBuffer", rt, ms, options),
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
  ) => anyRpc("reactor", rt, ms, config),
  blackboard: (rt: string, ms: string) => anyRpc("blackboard", rt, ms),
  snapshotIsolation: <T>(
    rt: string,
    ms: string,
    options?: { snapshotInterval?: number }
  ) => anyRpc("snapshotIsolation", rt, ms, options),
  smartBeacon: (rt: string, ms: string, set_pulse?: number) => anyRpc("smartBeacon", rt, ms, set_pulse),
  crdt: <T extends Record<string, unknown>>(
    rt: string,
    ms: string,
    initial: T
  ) => anyRpc("crdt", rt, ms, initial),
  useCrdt: <T extends Record<string, unknown>>(
    rt: string,
    ms: string,
    initial: T
  ) => anyRpc("useCrdt", rt, ms, initial),
  createCRDTChannel: <T extends Record<string, unknown>>(
    rt: string,
    ms: string,
    initial: T,
    syncEngine: {
      DRS: <S>(key: string, init: S) => [S, (val: S | ((prev: S) => S)) => void];
      hlc: any;
    }
  ) => anyRpc("createCRDTChannel", rt, ms, initial, syncEngine),

  notifications: (rt: string, ms: string) => anyRpc("notifications", rt, ms),
  useNotifications: (rt: string, ms: string) => anyRpc("useNotifications", rt, ms),
  config: <T extends Record<string, unknown>>(
    namespace: string,
    ms: string,
    defaultConfig: T
  ) => anyRpc("config", namespace, ms, defaultConfig),

  useConfig: <T extends Record<string, unknown>>(
    namespace: string,
    ms: string,
    defaultConfig: T
  ) => anyRpc("useConfig", namespace, ms, defaultConfig),
  useFeatureFlag: (flag: string, ms: string, defaultValue?: boolean) => anyRpc("useFeatureFlag", flag, ms, defaultValue),
  lock: (
    rt: string,
    ms: string,
    resourceId: string,
    ttl?: number
  ) => anyRpc("lock", rt, ms, resourceId, ttl),
  mapReduce: <T, R>(
    rt: string,
    ms: string,
    mapper: (item: T) => R,
    reducer: (acc: R, item: R) => R,
    initial: R,
    timeoutMs?: number,
  ) => anyRpc("mapReduce", rt, ms, mapper, reducer, initial, timeoutMs),
  rateLimit: (
    rt: string,
    ms: string,
    key: string,
    maxRequests: number,
    windowMs: number
  ) => anyRpc("rateLimit", rt, ms, key, maxRequests, windowMs),
  appendOnlyLog: <T>(
    rt: string,
    ms: string,
    options?: { maxSize?: number }
  ) => anyRpc("appendOnlyLog", rt, ms, options),
  // #endregion
  // #region █████████ JTF2 LEVEL ANALOGY BASED FEATURES █████████████████████████████████████████████████████████████████
  harbormaster: (rt: string, ms: string, options: any = {}) =>
    anyRpc("harbormaster", rt, ms, options),
  beacon: (rt: string, ms: string, set_pulse?: number) =>
    anyRpc("beacon", rt, ms, set_pulse),
  vessel: (rt: string, ms: string, set_pulse?: number) =>
    anyRpc("vessel", rt, ms, set_pulse),
  dock: (rt: string, ms: string) =>
    anyRpc("dock", rt, ms),
  radar: (
    rt: string,
    ms: string,
    set_pulse?: number,
    vessel_id?: any
  ) => anyRpc("radar", rt, ms, set_pulse, vessel_id),
  torpedo: (
    rt: string,
    ms: string,
    p: unknown,
    timeoutMs?: number
  ) => anyRpc("torpedo", rt, ms, p, timeoutMs),
  convoy: (
    rt: string,
    ms: string,
    nodeId: string,
    heartbeatInterval?: number,
    dropThreshold?: number
  ) => anyRpc("convoy", rt, ms, nodeId, heartbeatInterval, dropThreshold),
  sonar: (
    rt: string,
    ms: string,
    set_pulse?: number
  ) => anyRpc("sonar", rt, ms, set_pulse),
  heartbeat: (
    rt: string,
    ms: string,
    interval?: number,
    timeout?: number
  ) => anyRpc("heartbeat", rt, ms, interval, timeout),
  watchdog: (
    rt: string,
    ms: string,
    options: {
      timeout?: number;
      onTimeout?: () => void | Promise<void>;
      interval?: number;
    } = {}
  ) => anyRpc("watchdog", rt, ms, options),
  singleFlight: <T = any>(key: string, task: () => Promise<T>) =>
    anyRpc("singleFlight", "", "", key, task),
  transaction: <T extends Record<string, unknown>>(
    rt: string,
    ms: string,
    operations: {
      prepare: () => Promise<T>;
      commit: (data: T) => Promise<void>;
      rollback: (data: T) => Promise<void>;
    }
  ) => anyRpc("transaction", rt, ms, operations),
  autoFederate: (
    rt: string,
    ms: string,
    options: { maxLocalHandlers?: number } = {}
  ) => anyRpc("autoFederate", rt, ms, options),
  visualFlow: <T>(
    rt: string,
    ms: string,
    nodes: Array<{
      id: string;
      transform: (data: any) => any;
      inputs: string[];
      outputs: string[];
    }>
  ) => anyRpc("visualFlow", rt, ms, nodes),
  // #endregion
  // #region █████████ EPHEMERAL STATE ████████████████████████████████████████████████████████████████████████████████████
  shadowState: <T>(
    key: string,
    initial: T | (() => T)
  ) => anykeyRpc("shadowState", key, initial),
  useShadowState: <T>(
    key: string,
    initial: T | (() => T)
  ) => anykeyRpc("useShadowState", key, initial),
  shadowStateWithTTL: <T = any>(key: string, initial: T | (() => T), ttlMs: number) => anykeyRpc("shadowStateWithTTL", key, initial, ttlMs),
  batchShadowState: <T extends Record<string, any>>(key: string, initial: T, options: { debounceMs?: number } = {}) => anykeyRpc("batchShadowState", key, initial, options),
  // #endregion
  // #region █████████ NORMAL FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████
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
  use: (rt: string, fn: (msg: any) => boolean | void) => rpcCall("use", { rt, fn: fn.toString() }),
  useGlobal: (mw: {
    beforeSend?(msg: any): boolean | void | Promise<boolean | void>
    afterSend?(msg: any, result: unknown): void | Promise<void>
    beforeReceive?(msg: any): boolean | void | Promise<boolean | void>
    afterReceive?(msg: any, result: unknown): void | Promise<void>
    onError?(err: Error, msg?: any): void | Promise<void>
  }) => rpcCall("useGlobal", { mw }),
  send: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) => rpcCall("send", { rt, ms, p, ttl, binary }),
  sub: async (rt: string, ms: string, handler: any) => {
    const subId = (await rpcCall("sub", { rt, ms })) as any;
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
  // #endregion

};

export const kvdb: Kvdb = {
  // #region █████████ NGIN - MEMORY / CACHE ██████████████████████████████████████████████████████████████████████████████
  getMemory: async (key: any) => await rpcCall("getMemory", { key }),
  getManyMemory: async (keys: any) => await rpcCall("getManyMemory", { keys }),
  setMemory: (key: any, value: any) => rpcCall("setMemory", { key, value }),
  setManyMemory: (entries: any) => rpcCall("setManyMemory", { entries }),
  deleteMemory: (key: any) => rpcCall("deleteMemory", { key }),
  deleteManyMemory: (keys: any) => rpcCall("deleteManyMemory", { keys }),
  // #endregion
  // #region █████████ NGIN - LOCAL STORAGE ███████████████████████████████████████████████████████████████████████████████
  getLocalStorage: async (key: any) => await rpcCall("getLocalStorage", { key }),
  getManyLocalStorage: async (keys: string[]): Promise<any> => await rpcCall("getManyLocalStorage", { keys }),
  setLocalStorage: (key: any, value: any) => rpcCall("setLocalStorage", { key, value }),
  setManyLocalStorage: (entries: Record<string, any>): Promise<any> => rpcCall("setManyLocalStorage", { entries }),
  deleteLocalStorage: (key: string) => rpcCall("deleteLocalStorage", { key }),
  // #endregion
  // #region █████████ NGIN - SESSION STORAGE █████████████████████████████████████████████████████████████████████████████
  getSessionStorage: async (key: string): Promise<any> => await rpcCall("getSessionStorage", { key }),
  getManySessionStorage: async (keys: string[]): Promise<any> => await rpcCall("getManySessionStorage", { keys }),
  setSessionStorage: (key: string, value: any): Promise<any> => rpcCall("setSessionStorage", { key, value }),
  setManySessionStorage: (entries: Record<string, any>): Promise<any> => rpcCall("setManySessionStorage", { entries }),
  deleteSessionStorage: (key: string): Promise<any> => rpcCall("deleteSessionStorage", { key }),
  // #endregion
  // #region █████████ NGIN - COOKIES █████████████████████████████████████████████████████████████████████████████████████
  getCookie: async (key: string): Promise<any> => await rpcCall("getCookie", { key }),
  getManyCookie: async (keys: string[]): Promise<any> => await rpcCall("getManyCookie", { keys }),
  setCookie: (key: string, value: any, options?: { maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' }): Promise<any> => rpcCall("setCookie", { key, value, options }),
  setManyCookie: (entries: Record<string, any>, options?: { maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none'; }): Promise<any> => rpcCall("setManyCookie", { entries, options }),
  deleteCookie: (key: string, path?: string, domain?: string): Promise<any> => rpcCall("deleteCookie", { key, path, domain }),
  // #endregion
  // #region █████████ NGIN - SAURON ██████████████████████████████████████████████████████████████████████████████████████
  publish: (key: string | symbol, value: any, opts?: any) => rpcCall("publish", { key, value, opts }),
  subscribe: (key: string | symbol, listener: (value: any) => void, opts?: any) => rpcCall("subscribe", { key, listener, opts }),
  getAllSauron: async (opts?: any) => await rpcCall("getAllSauron", { opts }),
  setSauron: (label: string, value: any, triggerRender = true, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("setSauron", { label, value, triggerRender, sl_reg, ms_reg, globalKey }),
  getSauron: async (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => await rpcCall("getSauron", { label, sl_reg, ms_reg, globalKey, }),
  subSauron: (label: string, fn: (value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("subSauron", { label, fn, sl_reg, ms_reg, globalKey, }),
  deleteSauron: (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("deleteSauron", { label, sl_reg, ms_reg, globalKey, }),
  subAllSauron: (fn: (key: string | symbol, value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("subAllSauron", { fn, sl_reg, ms_reg, globalKey, }),
  // #endregion
  // #region █████████ NGIN - SCOPED REGISTRY ████████████████████████████████████████████████████████████████████████████
  createRegistry: (name: string): any & { name: string; destroy(): void } => rpcCall("createRegistry", { name }),
  getRegistry: async (name: string) => await rpcCall("getRegistry", { name }),
  getAllRegistries: async () => await rpcCall("getAllRegistries", {}),
  getGR: async (label: string, registry: string) => await rpcCall("getGR", { label, registry }),
  // #endregion
  // #region █████████ NGIN - HYPER SCOPED REGISTRY ██████████████████████████████████████████████████████████████████████
  createScopedReg: async (name: string) => await rpcCall("createScopedReg", { name }),
  // #endregion
  // #region █████████ NGIN - BINARY ██████████████████████████████████████████████████████████████████████████████████████
  getBinary: async (key: string): Promise<any> => await rpcCall("getBinary", { key }),
  setBinary: (key: string, value: any): Promise<any> => rpcCall("setBinary", { key, value }),
  deleteBinary: (key: string): Promise<any> => rpcCall("deleteBinary", { key }),
  // #endregion
  // #region █████████ NGIN - GLOBAL THIS █████████████████████████████████████████████████████████████████████████████████
  setGT: (label: string, value: any) => rpcCall("setGT", { label, value }),
  setManyGT: (entries: Record<string, any>): Promise<any> => rpcCall("setManyGT", { entries }),
  getGT: async (label: string) => await rpcCall("getGT", { label }),
  getManyGT: async (keys: string[]): Promise<any> => await rpcCall("getManyGT", { keys }),
  deleteGT: (label: string): any => rpcCall("deleteGT", { label }),
  deleteManyGT: (keys: string[]): Promise<any> => rpcCall("deleteManyGT", { keys }),
  // #endregion
  // #region █████████ NGIN - DB ██████████████████████████████████████████████████████████████████████████████████████████
  get: (key: any, global = false) => rpcCall("get", { key, global }),
  getMany: (keys: any, global = false) => rpcCall("getMany", { keys, global }),
  set: (key: any, value: any, global = false) => rpcCall("set", { key, value, global }),
  setMany: (entries: any, global = false) => rpcCall("setMany", { entries, global }),
  delete: (key: any, global = false) => rpcCall("delete", { key, global }),
  deleteMany: (keys: any, global = false) => rpcCall("deleteMany", { keys, global }),
  // #endregion
  // #region █████████ NGIN - TIMING ██████████████████████████████████████████████████████████████████████████████████████

  expire: (key: any, ms: any) => rpcCall("expire", { key, ms }),
  expireAt: (key: any, ts: any) => rpcCall("expireAt", { key, ts }),
  persist: (key: any) => rpcCall("persist", { key }),
  touch: (key: any, ms: any) => rpcCall("touch", { key, ms }),

  lock: {
    acquire: (key: any, ms: any) => rpcCall("lock:acquire", { key, ms }),
    release: (key: any, owner: any) => rpcCall("lock:release", { key, owner }),
    renew: (key: any, owner: any, ms: any) => rpcCall("lock:renew", { key, owner, ms }),
  },

  // #endregion
  // #region █████████ NGIN - OTHER ███████████████████████████████████████████████████████████████████████████████████████
  transaction: (ops: any) => rpcCall("transaction", { ops }),
  batch: (entries: any) => rpcCall("kvdb:batch", { entries }),
  live: (key: any, initial: any) => rpcCall("kvdb:live", { key, initial }),
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
    compareAndSwap: (key: string, expected: any, next: any) => rpcCall("atomicCompareAndSwap", { key, expected, next }),
    mutate: (key: string, fn: string) => rpcCall("atomicMutate", { key, fn }),
    increment: (key: string, by = 1) => rpcCall("atomicIncrement", { key, by }),
    append: (key: string, value: any) => rpcCall("atomicAppend", { key, value })
  },
  watch: (key: string, handler: (value: any) => void) => rpcCall("watch", { key, handler }),
  watchMany: (keys: string[], handler: (value: any) => void) => rpcCall("watchMany", { keys, handler }),
  watchPattern: (pattern: string, handler: (value: any) => void) => rpcCall("watchPattern", { pattern, handler }),
  watchPrefix: (prefix: string, handler: (value: any) => void) => rpcCall("watchPrefix", { prefix, handler }),
  watchAll: (handler: (value: any) => void) => rpcCall("watchAll", { handler }),
  sync: (key: string, options?: { direction?: 'memory->adapter' | 'adapter->memory' | 'both' }) => rpcCall("sync", { key, options }),
  setIfChanged: (key: string, value: any) => rpcCall("setIfChanged", { key, value }),
  use: (mw: any) => rpcCall("use", { mw }),
  scoped: (workspaceName: string) => rpcCall("scoped", { workspaceName }),
  scope: (prefix: string) => rpcCall("scope", { prefix }),
  close: () => rpcCall("close", {}),
  useLive: () => rpcCall("useLive", {}),
  matchesQuery: (v: any, expr: any) => rpcCall("matchesQuery", { v, expr }),
  // #endregion
}
export { staff as cse, kvdb as ngin }
// #endregion
// #region █████████ USE STAFF KVDB ██████████████████████████████████████████████████████████████████████████████████████████
export function useCSENGIN() {
  return {
    // #region █████████ BASE FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████████████████
    sendsub: (rt: string, ms: string, p: any, ttl?: number, binary = false) => channelRpc("sendsub", rt, ms, { p, ttl, binary }),
    multisub: (rt: string, ms: string, handler: (p: any) => void) => {
      const unsub = addHandler('multisub', rt, ms, { handler });
      channelRpc("multisub", rt, ms);
      return () => {
        unsub();
        channelRpc("unsub", rt, ms);
      };
    },
    // #endregion
    // #region █████████ STREAMS ███████████████████████████████████████████████████████████████████████████████████████████████████████
    stream: (rt: string, ms: string, p: any, onChunk: (chunk: any) => void) => rpcStreamCall("stream", onChunk, { rt, ms, p }),
    streamHandler: (rt: string, ms: string, handler: (d: any) => any, binary = false) => addHandler("streamHandler", rt, ms, { handler }),
    streamChunk: (rt: string, ms: string, streamId: string, chunk: string, binary = false) => rpcCall("streamChunk", { rt, ms, streamId, chunk, binary }),
    streamDone: (rt: string, ms: string, streamId: string, binary = false) => rpcCall("streamDone", { rt, ms, streamId, binary }),

    cancelStream: (rt: string, ms: string, streamId: string, binary = false) => rpcCall("cancelStream", { rt, ms, streamId, binary }),
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
    // heatbeatStreamHandler: (rt: string, ms: string, handler: (d: any) => any) => addHandler("heatbeatStreamHandler", rt, ms, handler),
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
    // #endregion
    // #region █████████ DUPLEX ███████████████████████████████████████████████████████████████████████████████████████████████████████
    duplex: (rt: string, ms: string, opts?: any, type?: string) => streamRpc("duplex", rt, ms, { opts, type }),
    openStream: (rt: string, ms: string, opts?: any,) => streamRpc("openStream", rt, ms, { opts, }),
    sx: (rt: string, ms: string, opts?: any, type?: string) => createDuplexRpcProxy("sx", rt, ms, { opts, type }),
    sxHandler: (rt: string, ms: string, opts?: any, type?: string) => createDuplexRpcProxy("sxHandler", rt, ms, { opts, type }),
    // #endregion
    // #region █████████ DRSS - DISTRBUTED REACTIVE STATE STREAMS ███████████████████████████████████████████████████████████████████████████████████████████████████████
    useDRSS: () => anyRpc("useDRSS", '', '',),
    useDRSSHandler: () => anyRpc("useDRSSHandler", '', '',),
    useDRSSSync: () => anyRpc("useDRSSSync", '', '',),
    useDRSSSyncHandler: () => anyRpc("useDRSSSyncHandler", '', '',),
    // #endregion
    // #region █████████ DRS ███████████████████████████████████████████████████████████████████████████████████████████████████████
    useObservableState: (rt: string, ms: string, initial?: any) => anyRpc("useObservableState", rt, ms, initial),
    useOptimisticState: (rt: string, ms: string, initial?: any) => anyRpc("useOptimisticState", rt, ms, initial),
    DRS: (rt: string, ms: string, initial?: any) => anyRpc("DRS", rt, ms, initial),
    live: (rt: string, ms: string, initial?: any) => anyRpc("live", rt, ms, initial),
    useLive: (rt: string, ms: string, initial?: any) => anyRpc("useLive", rt, ms, initial),
    useDRS: (rt: string, ms: string, initial?: any) => anyRpc("useDRS", rt, ms, initial),
    stateLive: (rt: string, ms: string, initial?: any) => anyRpc("stateLive", rt, ms, initial),
    stateDRS: (rt: string, ms: string, initial?: any) => anyRpc("stateDRS", rt, ms, initial),
    useStateCRDT: (rt: string, ms: string, initial?: any) => anyRpc("useStateCRDT", rt, ms, initial),
    useStateDRS: (rt: string, ms: string, initial?: any) => anyRpc("useStateDRS", rt, ms, initial),
    useRefDRS: (rt: string, ms: string, initial?: any) => anyRpc("useRefDRS", rt, ms, initial),
    useUmbrellaDRS: (rt: string, ms: string, initial?: any) => anyRpc("useUmbrellaDRS", rt, ms, initial),
    useContextDRS: (rt: string, ms: string, initial?: any) => anyRpc("useContextDRS", rt, ms, initial),
    DRSStore: (rt: string, ms: string, initial?: any) => anyRpc("DRSStore", rt, ms, initial),
    useDRSStore: (rt: string, ms: string, initial?: any) => anyRpc("useDRSStore", rt, ms, initial),
    useEffectDRS: (rt: string, ms: string, effect: any, deps: any[] = []) => anyRpc("useEffectDRS", rt, ms, { effect, deps }),
    useAutoEffectDRS: (rt: string, ms: string, effect: any, deps: any[] = []) => anyRpc("useAutoEffectDRS", rt, ms, { effect, deps }),
    useDeferredValueDRS: (rt: string, ms: string,) => anyRpc("useDeferredValueDRS", rt, ms),
    useImperativeHandleDRS: (ref: any, rt: string, ms: string, createHandle: any, deps: any[] = []) => anyRpc("useImperativeHandleDRS", rt, ms, { ref, createHandle, deps }),
    useMemoDRS: (sources: [rt: string, ms: string][], compute: any) => anyRpc("useMemoDRS", "", "", { sources, compute }),
    useReverseHeartbeat: (rt: string, ms: string, nodeId?: string, resetIntervalMs?: number) => anyRpc("useReverseHeartbeat", rt, ms, { nodeId, resetIntervalMs }),
    useDRSDBRaft: (rt: string, ms: string, initial: any) => anyRpc("useDRSDBRaft", rt, ms, { initial }),
    useRxDBRaft: (rt: string, ms: string, initial?: any, db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => anyRpc("useRxDBRaft", rt, ms, { initial, db }),
    useDRSDBYata: (rt: string, ms: string) => anyRpc("useDRSDBYata", rt, ms),
    useRxDBYata: (rt: string, ms: string, initial?: any[], db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => anyRpc("useRxDBYata", rt, ms, { initial, db }),
    useRTDB: (rt: string, ms: string, initial: any, db: 'rdb' | 'kvdb' | 'tdb' | 'vdb' | 'gdb' | 'memory' = 'kvdb') => anyRpc("useRTDB", rt, ms, { initial, db }),
    drsdb: (rt: string, ms: string, initial: any) => anyRpc("drsdb", rt, ms, { initial }),
    useDRSDB: (rt: string, ms: string, initial: any) => anyRpc("useDRSDB", rt, ms, { initial }),
    useDRSDBOptimistic: (rt: string, ms: string, initial: any) => anyRpc("useDRSDBOptimistic", rt, ms, { initial }),
    useDRSDBCRDT: () => anyRpc("useDRSDBCRDT", '', '',),
    rtdbStream: () => anyRpc("useDRSDBCRDT", '', '',),
    drsdbStream: () => anyRpc("useDRSDBCRDT", '', '',),
    // #endregion
    // #region █████████ CONDITIONALS ███████████████████████████████████████████████████████████████████████████████████████████████████████
    barrier: (rt: string, ms: string, participantId: string, total: number, options: { timeoutMs?: number; autoReset?: boolean } = {}) => anyRpc("barrier", rt, ms, { participantId, total, options }),
    latch: (rt: string, ms: string) => anyRpc("latch", rt, ms),
    gateMaster: (rt: string, ms: string, gatesFactory: any, options: any = { concurrency: true }) => anyRpc("gateMaster", rt, ms, { gatesFactory, options }),
    gateMaster2: (rt: string, ms: string, gates: any) => anyRpc("gateMaster2", rt, ms, { gates }),
    floodGateWithLive: () => anyRpc("floodGateWithLive", '', '',),
    plinko: (rt: string, ms: string, initialState: any, tree: any, options: any = {}) => anyRpc("plinko", rt, ms, { initialState, tree, options }),
    plinko3: (rt: string, ms: string) => anyRpc("plinko3", rt, ms),
    plinko2: (rt: string, ms: string, tree: any, options: any = {}) => anyRpc("plinko2", rt, ms, tree, options),
    getCircuitBreaker: (rt: string, options?: any) => anyRpc("getCircuitBreaker", rt, options),
    circuitBreaker: <T>(rt: string, ms: string, operation: () => Promise<T>, options: { failureThreshold: number; recoveryTimeout: number }) => anyRpc("circuitBreaker", rt, ms, operation, options),
    conditionVariable: (rt: string, ms: string, raft: any, nodeId: string) => anyRpc("conditionVariable", rt, ms, raft, nodeId),
    // #endregion
    // #region █████████ SPECIALTY ███████████████████████████████████████████████████████████████████████████████████████████████████████
    worker: () => anyRpc("worker", '', '',),
    cron: () => anyRpc("cron", '', '',),
    fusebox: (rt: string, ms: string, options: { globalFailureThreshold?: number; anomalyWindowMs?: number; autoTrip?: boolean; } = {}) => anyRpc("fusebox", rt, ms, options),
    tripwire: <T extends Record<string, unknown>>(rt: string, ms: string, stateTarget: T, options: {
      walBuffer?: () => Array<unknown>;
      snapshotInterval?: number;
    } = {}) => anyRpc("tripwire", rt, ms, stateTarget, options),
    fathom: (
      rt: string,
      ms: string,
      options: {
        samplingWindowMs?: number;
        highWatermark?: number;
        criticalWatermark?: number;
      } = {}
    ) => anyRpc("fathom", rt, ms, options),
    rigging: () => anyRpc("rigging", "", ""),
    circus: (rt: string, ms: string, options: any = {}) => anyRpc("circus", rt, ms, options),
    nebula: (rt: string, ms: string, options: any = {}) => anyRpc("nebula", rt, ms, options),
    cyclone: (rt: string, ms: string, options: any = {}) => anyRpc("cyclone", rt, ms, options),
    trident: (rt: string, ms: string, options: any = {}) => anyRpc("trident", rt, ms, options),
    anchor: (rt: string, ms: string, options: any = {}) => anyRpc("anchor", rt, ms, options),
    pipeline: (rt: string, ms: string) => anyRpc("pipeline", rt, ms),
    tide: (rt: string, ms: string, options: any) => anyRpc("tide", rt, ms, options),
    mesh: (rt: string, ms: string, options?: any) => anyRpc("mesh", rt, ms, options),
    echo: <T = any, R = any>(rt: string, ms: string) => anyRpc("echo", rt, ms),
    carousel: (rt: string, ms: string, options: any = {}) => anyRpc("carousel", rt, ms, options),
    synapse: (localChannel: string, local_sub_channel: string, remoteChannel: string, remote_sub_channel: string, options: any = {}) => anyRpc("synapse", localChannel, local_sub_channel, remoteChannel, remote_sub_channel, options),
    abortableFlight: (rt: string, ms: string) => anyRpc("abortableFlight", rt, ms),
    tokenBucket: (rt: string, ms: string, options: any = {}) => anyRpc("tokenBucket", rt, ms, options),
    tokenBucket_simple: (maxTokens?: number, refillRateMs?: number) => anyRpc("tokenBucket_simple", "", "", maxTokens, refillRateMs),
    resilience: (rt: string, ms: string, options: any = {}) => anyRpc("resilience", rt, ms, options),
    saga: <TContext extends Record<string, unknown>>(sagaId: string, ms: string, context: TContext) => anyRpc("saga", sagaId, ms, context),

    ecs: (rt: string, ms: string) => anyRpc("ecs", rt, ms),
    commandBuffer: (rt: string, ms: string, options?: { batchSize?: number; flushInterval?: number; walPath?: string; }) => anyRpc("commandBuffer", rt, ms, options),
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
    ) => anyRpc("reactor", rt, ms, config),
    blackboard: (rt: string, ms: string) => anyRpc("blackboard", rt, ms),
    snapshotIsolation: <T>(
      rt: string,
      ms: string,
      options?: { snapshotInterval?: number }
    ) => anyRpc("snapshotIsolation", rt, ms, options),
    smartBeacon: (rt: string, ms: string, set_pulse?: number) => anyRpc("smartBeacon", rt, ms, set_pulse),
    crdt: <T extends Record<string, unknown>>(
      rt: string,
      ms: string,
      initial: T
    ) => anyRpc("crdt", rt, ms, initial),
    useCrdt: <T extends Record<string, unknown>>(
      rt: string,
      ms: string,
      initial: T
    ) => anyRpc("useCrdt", rt, ms, initial),
    createCRDTChannel: <T extends Record<string, unknown>>(
      rt: string,
      ms: string,
      initial: T,
      syncEngine: {
        DRS: <S>(key: string, init: S) => [S, (val: S | ((prev: S) => S)) => void];
        hlc: any;
      }
    ) => anyRpc("createCRDTChannel", rt, ms, initial, syncEngine),

    notifications: (rt: string, ms: string) => anyRpc("notifications", rt, ms),
    useNotifications: (rt: string, ms: string) => anyRpc("useNotifications", rt, ms),
    config: <T extends Record<string, unknown>>(
      namespace: string,
      ms: string,
      defaultConfig: T
    ) => anyRpc("config", namespace, ms, defaultConfig),

    useConfig: <T extends Record<string, unknown>>(
      namespace: string,
      ms: string,
      defaultConfig: T
    ) => anyRpc("useConfig", namespace, ms, defaultConfig),
    useFeatureFlag: (flag: string, ms: string, defaultValue?: boolean) => anyRpc("useFeatureFlag", flag, ms, defaultValue),
    lock: (
      rt: string,
      ms: string,
      resourceId: string,
      ttl?: number
    ) => anyRpc("lock", rt, ms, resourceId, ttl),
    mapReduce: <T, R>(
      rt: string,
      ms: string,
      mapper: (item: T) => R,
      reducer: (acc: R, item: R) => R,
      initial: R,
      timeoutMs?: number,
    ) => anyRpc("mapReduce", rt, ms, mapper, reducer, initial, timeoutMs),
    rateLimit: (
      rt: string,
      ms: string,
      key: string,
      maxRequests: number,
      windowMs: number
    ) => anyRpc("rateLimit", rt, ms, key, maxRequests, windowMs),
    appendOnlyLog: <T>(
      rt: string,
      ms: string,
      options?: { maxSize?: number }
    ) => anyRpc("appendOnlyLog", rt, ms, options),
    // #endregion
    // #region █████████ JTF2 LEVEL ANALOGY BASED FEATURES ███████████████████████████████████████████████████████████████████████████████████████████████████████
    harbormaster: (rt: string, ms: string, options: any = {}) =>
      anyRpc("harbormaster", rt, ms, options),
    beacon: (rt: string, ms: string, set_pulse?: number) =>
      anyRpc("beacon", rt, ms, set_pulse),
    vessel: (rt: string, ms: string, set_pulse?: number) =>
      anyRpc("vessel", rt, ms, set_pulse),
    dock: (rt: string, ms: string) =>
      anyRpc("dock", rt, ms),
    radar: (
      rt: string,
      ms: string,
      set_pulse?: number,
      vessel_id?: any
    ) => anyRpc("radar", rt, ms, set_pulse, vessel_id),
    torpedo: (
      rt: string,
      ms: string,
      p: unknown,
      timeoutMs?: number
    ) => anyRpc("torpedo", rt, ms, p, timeoutMs),
    convoy: (
      rt: string,
      ms: string,
      nodeId: string,
      heartbeatInterval?: number,
      dropThreshold?: number
    ) => anyRpc("convoy", rt, ms, nodeId, heartbeatInterval, dropThreshold),
    sonar: (
      rt: string,
      ms: string,
      set_pulse?: number
    ) => anyRpc("sonar", rt, ms, set_pulse),
    heartbeat: (
      rt: string,
      ms: string,
      interval?: number,
      timeout?: number
    ) => anyRpc("heartbeat", rt, ms, interval, timeout),
    watchdog: (
      rt: string,
      ms: string,
      options: {
        timeout?: number;
        onTimeout?: () => void | Promise<void>;
        interval?: number;
      } = {}
    ) => anyRpc("watchdog", rt, ms, options),
    singleFlight: <T = any>(key: string, task: () => Promise<T>) =>
      anyRpc("singleFlight", "", "", key, task),
    transaction: <T extends Record<string, unknown>>(
      rt: string,
      ms: string,
      operations: {
        prepare: () => Promise<T>;
        commit: (data: T) => Promise<void>;
        rollback: (data: T) => Promise<void>;
      }
    ) => anyRpc("transaction", rt, ms, operations),
    autoFederate: (
      rt: string,
      ms: string,
      options: { maxLocalHandlers?: number } = {}
    ) => anyRpc("autoFederate", rt, ms, options),
    visualFlow: <T>(
      rt: string,
      ms: string,
      nodes: Array<{
        id: string;
        transform: (data: any) => any;
        inputs: string[];
        outputs: string[];
      }>
    ) => anyRpc("visualFlow", rt, ms, nodes),
    // #endregion
    // #region █████████ EPHEMERAL STATE ███████████████████████████████████████████████████████████████████████████████████████████████████████
    shadowState: <T>(
      key: string,
      initial: T | (() => T)
    ) => anykeyRpc("shadowState", key, initial),
    useShadowState: <T>(
      key: string,
      initial: T | (() => T)
    ) => anykeyRpc("useShadowState", key, initial),
    shadowStateWithTTL: <T = any>(key: string, initial: T | (() => T), ttlMs: number) => anykeyRpc("shadowStateWithTTL", key, initial, ttlMs),
    batchShadowState: <T extends Record<string, any>>(key: string, initial: T, options: { debounceMs?: number } = {}) => anykeyRpc("batchShadowState", key, initial, options),
    // #endregion
    // #region █████████ NORMAL FUNCTIONS ███████████████████████████████████████████████████████████████████████████████████████████████████████
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
    use: (rt: string, fn: (msg: any) => boolean | void) => rpcCall("use", { rt, fn: fn.toString() }),
    useGlobal: (mw: {
      beforeSend?(msg: any): boolean | void | Promise<boolean | void>
      afterSend?(msg: any, result: unknown): void | Promise<void>
      beforeReceive?(msg: any): boolean | void | Promise<boolean | void>
      afterReceive?(msg: any, result: unknown): void | Promise<void>
      onError?(err: Error, msg?: any): void | Promise<void>
    }) => rpcCall("useGlobal", { mw }),
    send: (rt: string, ms: string, p: unknown, ttl?: number, binary = false) => rpcCall("send", { rt, ms, p, ttl, binary }),
    sub: async (rt: string, ms: string, handler: any) => {
      const subId = (await rpcCall("sub", { rt, ms })) as any;
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
    // #endregion


    // #region █████████ NGIN - MEMORY / CACHE ███████████████████████████████████████████████████████████████████████████████████████████████████████
    getMemory: async (key: any) => await rpcCall("getMemory", { key }),
    getManyMemory: async (keys: any) => await rpcCall("getManyMemory", { keys }),
    setMemory: (key: any, value: any) => rpcCall("setMemory", { key, value }),
    setManyMemory: (entries: any) => rpcCall("setManyMemory", { entries }),
    deleteMemory: (key: any) => rpcCall("deleteMemory", { key }),
    deleteManyMemory: (keys: any) => rpcCall("deleteManyMemory", { keys }),
    // #endregion
    // #region █████████ NGIN - LOCAL STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
    getLocalStorage: async (key: any) => await rpcCall("getLocalStorage", { key }),
    getManyLocalStorage: async (keys: string[]): Promise<any> => await rpcCall("getManyLocalStorage", { keys }),
    setLocalStorage: (key: any, value: any) => rpcCall("setLocalStorage", { key, value }),
    setManyLocalStorage: (entries: Record<string, any>): Promise<any> => rpcCall("setManyLocalStorage", { entries }),
    // #endregion
    // #region █████████ NGIN - SESSION STORAGE ███████████████████████████████████████████████████████████████████████████████████████████████████████
    getSessionStorage: async (key: string): Promise<any> => await rpcCall("getSessionStorage", { key }),
    getManySessionStorage: async (keys: string[]): Promise<any> => await rpcCall("getManySessionStorage", { keys }),
    setSessionStorage: (key: string, value: any): Promise<any> => rpcCall("setSessionStorage", { key, value }),
    setManySessionStorage: (entries: Record<string, any>): Promise<any> => rpcCall("setManySessionStorage", { entries }),
    deleteSessionStorage: (key: string): Promise<any> => rpcCall("deleteSessionStorage", { key }),
    // #endregion
    // #region █████████ NGIN - COOKIES ███████████████████████████████████████████████████████████████████████████████████████████████████████
    getCookie: async (key: string): Promise<any> => await rpcCall("getCookie", { key }),
    getManyCookie: async (keys: string[]): Promise<any> => await rpcCall("getManyCookie", { keys }),
    setCookie: (key: string, value: any, options?: { maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' }): Promise<any> => rpcCall("setCookie", { key, value, options }),
    setManyCookie: (entries: Record<string, any>, options?: { maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none'; }): Promise<any> => rpcCall("setManyCookie", { entries, options }),
    deleteCookie: (key: string, path?: string, domain?: string): Promise<any> => rpcCall("deleteCookie", { key, path, domain }),
    // #endregion
    // #region █████████ NGIN - SAURON ███████████████████████████████████████████████████████████████████████████████████████████████████████
    publish: (key: string | symbol, value: any, opts?: any) => rpcCall("publish", { key, value, opts }),
    subscribe: (key: string | symbol, listener: (value: any) => void, opts?: any) => rpcCall("subscribe", { key, listener, opts }),
    getAllSauron: async (opts?: any) => await rpcCall("getAllSauron", { opts }),
    setSauron: (label: string, value: any, triggerRender = true, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("setSauron", { label, value, triggerRender, sl_reg, ms_reg, globalKey }),
    getSauron: async (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => await rpcCall("getSauron", { label, sl_reg, ms_reg, globalKey, }),
    subSauron: (label: string, fn: (value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("subSauron", { label, fn, sl_reg, ms_reg, globalKey, }),
    deleteSauron: (label: string, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("deleteSauron", { label, sl_reg, ms_reg, globalKey, }),
    subAllSauron: (fn: (key: string | symbol, value: any) => void, sl_reg?: any, ms_reg?: any, globalKey?: any) => rpcCall("subAllSauron", { fn, sl_reg, ms_reg, globalKey, }),
    // #endregion
    // #region █████████ NGIN - SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
    createRegistry: (name: string): any & { name: string; destroy(): void } => rpcCall("createRegistry", { name }),
    getRegistry: async (name: string) => await rpcCall("getRegistry", { name }),
    getAllRegistries: async () => await rpcCall("getAllRegistries", {}),
    getGR: async (label: string, registry: string) => await rpcCall("getGR", { label, registry }),
    // #endregion
    // #region █████████ NGIN - HYPER SCOPED REGISTRY ███████████████████████████████████████████████████████████████████████████████████████████████████████
    createScopedReg: async (name: string) => await rpcCall("createScopedReg", { name }),
    // #endregion
    // #region █████████ NGIN - BINARY ███████████████████████████████████████████████████████████████████████████████████████████████████████
    getBinary: async (key: string): Promise<any> => await rpcCall("getBinary", { key }),
    setBinary: (key: string, value: any): Promise<any> => rpcCall("setBinary", { key, value }),
    deleteBinary: (key: string): Promise<any> => rpcCall("deleteBinary", { key }),
    // #endregion
    // #region █████████ NGIN - GLOBAL THIS ███████████████████████████████████████████████████████████████████████████████████████████████████████
    setGT: (label: string, value: any) => rpcCall("setGT", { label, value }),
    setManyGT: (entries: Record<string, any>): Promise<any> => rpcCall("setManyGT", { entries }),
    getGT: async (label: string) => await rpcCall("getGT", { label }),
    getManyGT: async (keys: string[]): Promise<any> => await rpcCall("getManyGT", { keys }),
    deleteGT: (label: string): any => rpcCall("deleteGT", { label }),
    deleteManyGT: (keys: string[]): Promise<any> => rpcCall("deleteManyGT", { keys }),
    // #endregion
    // #region █████████ NGIN - DB ███████████████████████████████████████████████████████████████████████████████████████████████████████
    get: (key: any, global = false) => rpcCall("get", { key, global }),
    getMany: (keys: any, global = false) => rpcCall("getMany", { keys, global }),
    set: (key: any, value: any, global = false) => rpcCall("set", { key, value, global }),
    setMany: (entries: any, global = false) => rpcCall("setMany", { entries, global }),
    delete: (key: any, global = false) => rpcCall("delete", { key, global }),
    deleteMany: (keys: any, global = false) => rpcCall("deleteMany", { keys, global }),
    // #endregion
    // #region █████████ NGIN - TIMING ███████████████████████████████████████████████████████████████████████████████████████████████████████

    expire: (key: any, ms: any) => rpcCall("expire", { key, ms }),
    expireAt: (key: any, ts: any) => rpcCall("expireAt", { key, ts }),
    persist: (key: any) => rpcCall("persist", { key }),
    touch: (key: any, ms: any) => rpcCall("touch", { key, ms }),

    ngin_lock: {
      acquire: (key: any, ms: any) => rpcCall("lock:acquire", { key, ms }),
      release: (key: any, owner: any) => rpcCall("lock:release", { key, owner }),
      renew: (key: any, owner: any, ms: any) => rpcCall("lock:renew", { key, owner, ms }),
    },

    // #endregion
    // #region █████████ NGIN - OTHER ███████████████████████████████████████████████████████████████████████████████████████████████████████
    ngin_transaction: (ops: any) => rpcCall("transaction", { ops }),
    ngin_batch: (entries: any) => rpcCall("kvdb:batch", { entries }),
    ngin_live: (key: any, initial: any) => rpcCall("kvdb:live", { key, initial }),
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
      compareAndSwap: (key: string, expected: any, next: any) => rpcCall("atomicCompareAndSwap", { key, expected, next }),
      mutate: (key: string, fn: string) => rpcCall("atomicMutate", { key, fn }),
      increment: (key: string, by = 1) => rpcCall("atomicIncrement", { key, by }),
      append: (key: string, value: any) => rpcCall("atomicAppend", { key, value })
    }
    // #endregion
  }
}
// #endregion
// #region █████████ HELPERS █████████████████████████████████████████████████████████████████████████████████████████████████
type cmds = "file" | "fileAtLine" | "url" | "command" | "powershellCommand" | "debianCMD" | "snippet" | "chain" | "concurrent" | "copyValue" | "cmdChain" | "settingsToggle" | "apiCall" | "label" | "search" | "layout" | "folder" | "npmScripts" | "tasks" | "md" | "conditionalChain" | "menu" | "wait" | "wsnote" | "argChain" | "argConcurrent" | "conditional" | "fire" | "fireDebian"
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[RETURN_OUTPUT]',  COMMAND:commmand })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: "powershellCommand", COMMAND:COMMAND })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: "powershellCommand", COMMAND:COMMAND, TARGET_DIR: TARGET_DIR, ARGS: ARGS })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[RUN_PS_DEV_SERVER]',  COMMAND:COMMAND })
//  await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[CREATE_TERMINAL]',  TARGET_DIR:cwd })
export async function exeCmd(command: string, targetDir: string, type: cmds, args: any, timeout = 2000) {
  const result = await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: type, COMMAND: command, TARGET_DIR: targetDir, ARGS: args })
  return result
}
export async function exeVSCCmd(command: string, args?: any) {
  const result = await staff.sendsub('[THE_WIZARD]', '[TERMINAL_NGIN]', { cmd: '[MASTER]', COMMAND_TYPE: 'command', COMMAND: command, ARGS: args })
  return result
}

// #endregion









