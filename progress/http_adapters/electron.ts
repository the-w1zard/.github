import { CSEAdapter, CSEMessage } from "../types";



// ─── Electron IPC — Main Process ──────────────────────────────────────────
export function electronIPCMainAdapter( ipcMain: { on: Function; handle: Function; removeHandler: Function }, win: { webContents: { send: Function; once: Function } }): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null

    ipcMain.on('staff:msg', (_event, raw: any) => {
        try { messageHandler?.(typeof raw === 'string' ? JSON.parse(raw) : raw as CSEMessage) } catch { }
    })

    win.webContents.once('did-finish-load', () => connectHandler?.())

    return {
        send(msg) { win.webContents.send('staff:msg', msg) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { }
    }
}

// ─── Electron IPC — Renderer Process ─────────────────────────────────────
export function electronIPCRendererAdapter(ipcRenderer: { on: Function; send: Function; invoke: Function; removeListener: Function }): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null

    ipcRenderer.on('staff:msg', (_event, raw: any) => {
        try { messageHandler?.(typeof raw === 'string' ? JSON.parse(raw) : raw as CSEMessage) } catch { }
    })

    setTimeout(() => connectHandler?.(), 0)

    return {
        send(msg) { ipcRenderer.send('staff:msg', msg) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { }
    }
}


