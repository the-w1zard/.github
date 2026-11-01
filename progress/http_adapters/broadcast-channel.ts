import { CSEAdapter, CSEMessage } from "../types";


export function broadcastChannelAdapter(name: string): CSEAdapter {
    const bc = new BroadcastChannel(name)
    let _handler: ((msg: CSEMessage) => void) | null = null

    bc.onmessage = (e) => _handler?.(e.data)

    return {
        send: (msg) => bc.postMessage(msg),
        onMessage: (h) => { _handler = h; return () => { _handler = null } },
        onConnect: (h) => h(),
        onDisconnect: () => { }
    }
}



