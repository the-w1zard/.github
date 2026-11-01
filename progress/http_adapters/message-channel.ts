import { CSEAdapter, CSEMessage } from "../types";


export function messageChannel(): { adapter: CSEAdapter; port: MessagePort } {
    const { port1, port2 } = new MessageChannel()
    let _handler: ((msg: CSEMessage) => void) | null = null

    port1.onmessage = (e) => _handler?.(e.data)

    const adapter: CSEAdapter = {
        send: (msg) => port1.postMessage(msg),
        onMessage: (h) => { _handler = h; return () => { _handler = null } },
    }

    return { adapter, port: port2 }
}
