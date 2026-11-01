import { CSEAdapter, CSEMessage } from "../types";

// ─── WebRTC DataChannel — P2P, no server in the data path ─────────────────
// SDP/ICE signalling is out of band (your choice of signalling transport);
// once the peer connection is up, the datachannel is a fast bidirectional
// ordered/reliable pipe. Two entry points:
//   - host:  you created the RTCPeerConnection + offer
//   - client: you answered an offer
// Both accept an already-created RTCDataChannel OR a peer connection to
// create/open one on.

export function webRtcDataChannelHostAdapter(pc: RTCPeerConnection, label = "cse"): CSEAdapter {
    const dc = pc.createDataChannel(label, { ordered: true })
    return dataChannelAdapter(dc)
}

export function webRtcDataChannelClientAdapter(pc: RTCPeerConnection, label = "cse"): CSEAdapter {
    return new Promise((resolve) => {
        pc.ondatachannel = (e) => resolve(dataChannelAdapter(e.rt))
    }) as unknown as CSEAdapter
}

function dataChannelAdapter(dc: RTCDataChannel): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null
    const messageQueue: CSEMessage[] = []

    dc.onopen = () => {
        while (messageQueue.length > 0) dc.send(JSON.stringify(messageQueue.shift()!))
        connectHandler?.()
    }
    dc.onmessage = (e) => {
        try { messageHandler?.(JSON.parse(String(e.data)) as CSEMessage) } catch { }
    }
    dc.onclose = () => disconnectHandler?.()
    dc.onerror = () => dc.close()

    return {
        send(msg) {
            if (dc.readyState === "open") dc.send(JSON.stringify(msg))
            else messageQueue.push(msg)
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}
