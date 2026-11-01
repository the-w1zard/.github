// the-cloud/adapters/bun-websocket-server.ts
import { CSEAdapter, CSEMessage } from "../types";

export function bunWebSocketServerAdapter(port: number = 6452): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null
    let server: ReturnType<typeof Bun.serve> | null = null

    server = Bun.serve({
        port,
        fetch(req, server) {
            const success = server.upgrade(req, { data: { connectedAt: Date.now() } })
            if (success) return undefined
            return new Response("WebSocket server", { status: 400 })
        },
        websocket: {
            open(ws) {
                connectHandler?.()
            },
            message(ws, message) {
                try {
                    const msg = JSON.parse(String(message)) as CSEMessage
                    messageHandler?.(msg)
                } catch { }
            },
            close(ws) {
                disconnectHandler?.()
            }
        }
    })

    return {
        send(msg: CSEMessage) {
            if (server) {
                server.publish("all", JSON.stringify(msg))
            }
        },
        onMessage(handler) {
            messageHandler = handler
            return () => { messageHandler = null }
        },
        onConnect(handler) {
            connectHandler = handler
        },
        onDisconnect(handler) {
            disconnectHandler = handler
        }
    }
}
