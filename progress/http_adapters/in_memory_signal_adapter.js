import { emitters } from "../protocols/signals";
/**
 * CSEAdapter backed by EMITTERS — the in-realm, same-heap transport.
 * Outbound: collider -> EMITTERS rt (k = collider's rt id)
 * Inbound:  EMITTERS sub -> adapter handler
 */
export function emittersAdapter(id = 'emittersAdapter') {
    let messageHandler = null;
    let unsubAny = null;
    let connected = false;
    const adapter = {
        id,
        // Collider registers how to receive inbound messages
        onMessage(handler) {
            messageHandler = handler;
            // Subscribe to EVERYTHING on the collider's trunk so the
            // handler is the single entry point for inbound traffic.
            // subAny fires for every k on the default hierarchy.
            unsubAny = emitters.sub.any((k, data) => {
                if (!messageHandler)
                    return;
                // Only deliver traffic that did NOT originate from this
                // adapter itself — prevents echo loops.
                if (data && typeof data === 'object' && data.__from_adapter === id)
                    return;
                messageHandler(data);
            });
            return () => {
                unsubAny?.();
                unsubAny = null;
                messageHandler = null;
            };
        },
        onConnect(handler) {
            // EMITTERS is always live — connect is immediate
            connected = true;
            handler();
        },
        onDisconnect(handler) {
            connected = false;
            handler?.();
        },
        // Collider calls this to push a message onto the wire
        send(msg) {
            if (!connected)
                return;
            // Tag the p so our own subAny ignores it (echo suppression)
            const tagged = (msg && typeof msg === 'object')
                ? { ...msg, __from_adapter: id }
                : msg;
            // Route on the collider's channels. The message already carries
            // rt/sub/trip/quad info, so emit on the same hierarchy:
            emitters.send(tagged, msg?.k ?? msg?.rt ?? 'default', msg?.sl ?? emitters.CH_3, msg?.ms ?? emitters.CH_2, msg?.rt ?? emitters.CH_1).send();
        }
    };
    return adapter;
}
