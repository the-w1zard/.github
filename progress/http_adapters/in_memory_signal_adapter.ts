import { emitters } from "../protocols/signals"
import { CSEAdapter, CSEMessage, CSE_Multiplexed_Msg } from "../types"

/**
 * CSEAdapter backed by EMITTERS — the in-realm, same-heap transport.
 * Outbound: collider -> EMITTERS rt (k = collider's rt id)
 * Inbound:  EMITTERS sub -> adapter handler
 */
export function emittersAdapter( id = 'emittersAdapter'): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let unsubAny: (() => void) | null = null
    let connected = false

    const adapter: CSEAdapter = {
        id,

        // Collider registers how to receive inbound messages
        onMessage(handler: (msg: CSEMessage) => void) {
            messageHandler = handler
            // Subscribe to EVERYTHING on the collider's trunk so the
            // handler is the single entry point for inbound traffic.
            // subAny fires for every k on the default hierarchy.
            unsubAny = emitters.sub.any((k, data) => {
                if (!messageHandler) return
                // Only deliver traffic that did NOT originate from this
                // adapter itself — prevents echo loops.
                if (data && typeof data === 'object' && (data as any).__from_adapter === id) return
                messageHandler(data as CSEMessage)
            })
            return () => {
                unsubAny?.()
                unsubAny = null
                messageHandler = null
            }
        },

        onConnect(handler: () => void) {
            // EMITTERS is always live — connect is immediate
            connected = true
            handler()
        },

        onDisconnect(handler: () => void) {
            connected = false
            handler?.()
        },

        // Collider calls this to push a message onto the wire
        send(msg: CSEMessage) {
            if (!connected) return
            // Tag the p so our own subAny ignores it (echo suppression)
            const tagged = (msg && typeof msg === 'object')
                ? { ...(msg as any), __from_adapter: id }
                : msg
            // Route on the collider's channels. The message already carries
            // rt/sub/trip/quad info, so emit on the same hierarchy:
            emitters.send(
                tagged,
                (msg as any)?.k ?? (msg as any)?.rt ?? 'default',
                (msg as any)?.sl ?? emitters.CH_3,
                (msg as any)?.ms ?? emitters.CH_2,
                (msg as any)?.rt ?? emitters.CH_1
            ).send()
        }
    }

    return adapter
}
