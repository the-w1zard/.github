// src/websocket-staff-only.ts
import { WebSocketServer, WebSocket } from 'ws'
import { CSEAdapter, CSEMessage } from "../types";

type RPCMsg =
  | { type: "rpc"; id: number; method: string; args: any[]; clientId?: string }
  | { type: "rpc:res"; id: number; ok: boolean; result?: any; error?: string }
  | { type: "staff:event"; subId: number; p: any }
  | { type: "rpc:chunk"; id: number | string; chunk?: any; done?: boolean }
  | { type: "staff:routed"; clientId: string; rt: string; p: any }

let wssSingleton: WebSocketServer | null = null

export function startCseWebSocket(staff: any, port: number = 8080) {
  if (wssSingleton) return wssSingleton

  const wss = new WebSocketServer({ port })
  wssSingleton = wss
  
  setupServer(wss, staff)
  console.log(`[CSE WebSocket] Server running on port ${port}`)
  
  return wssSingleton
}

function setupServer(wss: WebSocketServer, staff: any) {
  const clientSockets = new Map<string, WebSocket>()
  const subs = new Map<number, () => void>()

  wss.on("connection", (socket) => {
    let subIdSeq = 1
    let socketClientId: string | null = null

    const send = (msg: RPCMsg) => { 
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg))
      }
    }

    const rpcMethods: Record<string, (...args: any[]) => any> = {
      // Client registration
      register: (clientId: string) => {
        socketClientId = clientId
        clientSockets.set(clientId, socket)
        return { ok: true }
      },

      // Send to specific client
      sendToClient: (clientId: string, rt: string, p: any) => {
        const target = clientSockets.get(clientId)
        if (!target || target.readyState !== WebSocket.OPEN) {
          return { ok: false, error: "Client not connected" }
        }
        target.send(JSON.stringify({ 
          type: "staff:routed", 
          clientId, 
          rt, 
          p 
        }))
        return { ok: true }
      },

      // CSE methods
      send: (rt: string, p: any, ttl?: number) => {
        console.log('[CSE:send]', rt, p)
        return staff.send(rt, p, ttl)
      },

      gar: (rt: string, p: any, ttl?: number) => {
        return staff.gar(rt, p, ttl)
      },

      reply: (replyChannel: string, p: any) => {
        return staff.reply(replyChannel, p)
      },

      request: (rt: string, p: any) => {
        return staff.request(rt, p)
      },

      broadcast: (rt: string, p: any, ttl?: number) => {
        return staff.broadcast(rt, p, ttl)
      },

      batch: (messages: { rt: string; p: any }[]) => {
        return staff.batch(messages)
      },

      sub: (rt: string) => {
        const subId = subIdSeq++
        const off = staff.sub(rt, (msg: any) => {
          send({ type: "staff:event", subId, p: msg })
        })
        subs.set(subId, off)
        return subId
      },

      subWithHistory: (rt: string, limit?: number) => {
        const subId = subIdSeq++
        const off = staff.subWithHistory(
          rt,
          (msg: any) => { 
            send({ type: "staff:event", subId, p: msg }) 
          },
          { limit }
        )
        subs.set(subId, off)
        return subId
      },

      unsub: (subId: number) => {
        const off = subs.get(subId)
        if (off) { 
          off(); 
          subs.delete(subId) 
        }
        return true
      },

      stream: async (rt: string, p: any) => {
        const streamId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        staff.stream(rt, p, (chunk: any, done: boolean) => {
          if (socket.readyState !== WebSocket.OPEN) return
          if (done) {
            send({ type: "rpc:chunk", id: streamId, done: true })
          } else {
            send({ type: "rpc:chunk", id: streamId, chunk })
          }
        })
        return { streamId }
      },

      cancelStream: (rt: string, streamId: string) => {
        return staff.cancelStream(rt, streamId)
      }
    }

    socket.on("message", async (raw) => {
      let msg: RPCMsg
      try { 
        msg = JSON.parse(raw.toString()) 
      } catch {
        return 
      }

      if (msg.type !== "rpc") return

      const fn = rpcMethods[msg.method]
      if (!fn) {
        send({ 
          type: "rpc:res", 
          id: msg.id, 
          ok: false, 
          error: `Unknown method: ${msg.method}` 
        })
        return
      }

      try {
        const result = await fn(...(msg.args || []))
        send({ type: "rpc:res", id: msg.id, ok: true, result })
      } catch (err: any) {
        send({ 
          type: "rpc:res", 
          id: msg.id, 
          ok: false, 
          error: String(err?.message ?? err) 
        })
      }
    })

    socket.on("close", () => {
      if (socketClientId) {
        clientSockets.delete(socketClientId)
      }
      subs.forEach((off) => off())
      subs.clear()
    })
  })
}

// For graceful shutdown
export function stopCseWebSocket() {
  if (wssSingleton) {
    wssSingleton.close()
    wssSingleton = null
    console.log('[CSE WebSocket] Server stopped')
  }
}
