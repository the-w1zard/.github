// ─── Electron IPC — Main Process ──────────────────────────────────────────
export function electronIPCMainAdapter(ipcMain, win) {
    let messageHandler = null;
    let connectHandler = null;
    ipcMain.on('staff:msg', (_event, raw) => {
        try {
            messageHandler?.(typeof raw === 'string' ? JSON.parse(raw) : raw);
        }
        catch { }
    });
    win.webContents.once('did-finish-load', () => connectHandler?.());
    return {
        send(msg) { win.webContents.send('staff:msg', msg); },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { }
    };
}
// ─── Electron IPC — Renderer Process ─────────────────────────────────────
export function electronIPCRendererAdapter(ipcRenderer) {
    let messageHandler = null;
    let connectHandler = null;
    ipcRenderer.on('staff:msg', (_event, raw) => {
        try {
            messageHandler?.(typeof raw === 'string' ? JSON.parse(raw) : raw);
        }
        catch { }
    });
    setTimeout(() => connectHandler?.(), 0);
    return {
        send(msg) { ipcRenderer.send('staff:msg', msg); },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null; }; },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { }
    };
}
