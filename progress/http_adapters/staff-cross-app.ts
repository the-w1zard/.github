// src/staff/staff=cross=app.ts
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { CSEAdapter, CSEMessage } from "../types";



let _brokerClose: (() => void) | null = null

function startCSEBroker(port: number): void {
    if (_brokerClose) return
    const server = createServer()
    const wss = new WebSocketServer({ server })
    const clients = new Set<WebSocket>()

    wss.on('connection', (ws) => {
        clients.add(ws)
        ws.on('message', (raw) => {
            let msg: CSEMessage
            try { msg = JSON.parse(raw.toString()) } catch { return }
            for (const client of clients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(msg))
                }
            }
        })
        ws.on('close', () => clients.delete(ws))
        ws.on('error', () => { ws.terminate(); clients.delete(ws) })
    })

    server.listen(port)
    _brokerClose = () => { wss.close(); server.close() }
}
// ADAPTER 
function crossAppAdapter(port: number): CSEAdapter {
    const url = `ws://localhost:${port}`
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectDelay = 1000
    const maxReconnectDelay = 30000
    const messageQueue: CSEMessage[] = []
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    const connect = () => {
        ws = new WebSocket(url)
        ws.onopen = () => {
            reconnectDelay = 1000
            while (messageQueue.length > 0) ws!.send(JSON.stringify(messageQueue.shift()!))
            connectHandler?.()
        }
        ws.onmessage = (e) => {
            try { messageHandler?.(JSON.parse(e.data.toString()) as CSEMessage) } catch { }
        }
        ws.onclose = () => {
            disconnectHandler?.()
            reconnectTimer = setTimeout(() => {
                reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay)
                connect()
            }, reconnectDelay)
        }
        ws.onerror = () => ws?.close()
    }

    connect()

    return {
        send(msg) {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg))
            } else {
                messageQueue.push(msg)
            }
        },
        onMessage(handler) {
            messageHandler = handler
            return () => { messageHandler = null }
        },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}
export function initCrossAppComs(
    staff: { registerAdapter: (a: CSEAdapter) => () => void },
    enabled: boolean,
    port: number
): void {
    if (!enabled) return
    startCSEBroker(port)
    staff.registerAdapter(crossAppAdapter(port))
}
