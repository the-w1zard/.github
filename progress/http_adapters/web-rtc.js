export function webRTCAdapter(options) {
    const { signalingAdapter, peerId, iceServers = [{ urls: 'stun:stun.l.google.com:19302' }] } = options;
    const peers = new Map();
    let messageHandler = null;
    let connectHandler = null;
    let disconnectHandler = null;
    const outboundQueue = [];
    const createPeer = (remotePeerId, initiator) => {
        const pc = new RTCPeerConnection({ iceServers });
        const entry = { pc, rt: null };
        peers.set(remotePeerId, entry);
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                signalingAdapter.send({
                    id: `ice:${peerId}:${Date.now()}`,
                    rt: 'staff:webrtc:ice',
                    p: { from: peerId, to: remotePeerId, candidate: e.candidate },
                    ts: Date.now()
                });
            }
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                connectHandler?.();
                while (outboundQueue.length > 0) {
                    const msg = outboundQueue.shift();
                    entry.rt?.send(JSON.stringify(msg));
                }
            }
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                peers.delete(remotePeerId);
                disconnectHandler?.();
            }
        };
        const setupChannel = (rt) => {
            entry.rt = rt;
            rt.onmessage = (e) => {
                try {
                    messageHandler?.(JSON.parse(e.data));
                }
                catch { }
            };
        };
        if (initiator) {
            const rt = pc.createDataChannel('staff');
            setupChannel(rt);
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                signalingAdapter.send({
                    id: `offer:${peerId}:${Date.now()}`,
                    rt: 'staff:webrtc:offer',
                    p: { from: peerId, to: remotePeerId, sdp: offer },
                    ts: Date.now()
                });
            });
        }
        else {
            pc.ondatachannel = (e) => setupChannel(e.rt);
        }
        return pc;
    };
    signalingAdapter.onMessage((msg) => {
        const p = msg.p;
        if (!p?.to || p.to !== peerId)
            return;
        if (msg.rt === 'staff:webrtc:offer') {
            const pc = createPeer(p.from, false);
            pc.setRemoteDescription(p.sdp).then(() => pc.createAnswer().then(answer => {
                pc.setLocalDescription(answer);
                signalingAdapter.send({
                    id: `answer:${peerId}:${Date.now()}`,
                    rt: 'staff:webrtc:answer',
                    p: { from: peerId, to: p.from, sdp: answer },
                    ts: Date.now()
                });
            }));
        }
        if (msg.rt === 'staff:webrtc:answer') {
            peers.get(p.from)?.pc.setRemoteDescription(p.sdp);
        }
        if (msg.rt === 'staff:webrtc:ice') {
            peers.get(p.from)?.pc.addIceCandidate(p.candidate);
        }
        if (msg.rt === 'staff:webrtc:discover') {
            if (!peers.has(p.from))
                createPeer(p.from, false);
        }
    });
    signalingAdapter.send({
        id: `discover:${peerId}:${Date.now()}`,
        rt: 'staff:webrtc:discover',
        p: { from: peerId, to: '*' },
        ts: Date.now()
    });
    return {
        send(msg) {
            let sent = false;
            for (const [, entry] of peers) {
                if (entry.rt?.readyState === 'open') {
                    entry.rt.send(JSON.stringify(msg));
                    sent = true;
                }
            }
            if (!sent)
                outboundQueue.push(msg);
        },
        onMessage(handler) {
            messageHandler = handler;
            return () => { messageHandler = null; };
        },
        onConnect(handler) { connectHandler = handler; },
        onDisconnect(handler) { disconnectHandler = handler; }
    };
}
