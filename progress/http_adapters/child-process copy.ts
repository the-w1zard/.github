import { CSEAdapter, CSEMessage } from "../types";

 

// ─── Child Process ────────────────────────────────────────────────────────
export function childProcessAdapter(proc: NodeJS.Process = process): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null

    process.nextTick(() => connectHandler?.())

    proc.on('message', (raw: any) => {
        try { messageHandler?.(JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)) as CSEMessage) } catch { }
    })

    return {
        send(msg) {
            if (proc.send) proc.send(JSON.stringify(msg))
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { }
    }
}

