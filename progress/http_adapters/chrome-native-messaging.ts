import { CSEAdapter, CSEMessage } from "../types";

 
import * as fs from 'fs'

// ─── Native Messaging — Extension Host ───────────────────────────────────
export function nativeMessagingHostAdapter(): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    process.nextTick(() => connectHandler?.())

    const readLoop = () => {
        const lenBuf = Buffer.alloc(4)
        const bytesRead = fs.readSync(0, lenBuf, 0, 4, null)
        if (bytesRead === 0) { disconnectHandler?.(); return }
        const len = lenBuf.readUInt32LE(0)
        const msgBuf = Buffer.alloc(len)
        fs.readSync(0, msgBuf, 0, len, null)
        try { messageHandler?.(JSON.parse(msgBuf.toString()) as  CSEMessage) } catch { }
        setImmediate(readLoop)
    }

    setImmediate(readLoop)

    return {
        send(msg) {
            const json = JSON.stringify(msg)
            const buf = Buffer.alloc(4 + Buffer.byteLength(json))
            buf.writeUInt32LE(Buffer.byteLength(json), 0)
            buf.write(json, 4)
            fs.writeSync(1, buf)
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}

// ─── Native Messaging — Browser ───────────────────────────────────────────
export function nativeMessagingBrowserAdapter(port:  { onMessage: { addListener: Function }; onDisconnect: { addListener: Function }; postMessage: Function }): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null

    port.onMessage.addListener((msg: any) => {
        try { messageHandler?.(msg as CSEMessage) } catch { }
    })
    port.onDisconnect.addListener(() => disconnectHandler?.())
    setTimeout(() => connectHandler?.(), 0)

    return {
        send(msg) { port.postMessage(msg) },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}
