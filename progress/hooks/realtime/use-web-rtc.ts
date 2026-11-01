import { createHook } from '#the-cloud'

interface WebRTCOptions {
  iceServers?: RTCIceServer[]
  autoConnect?: boolean
}

interface WebRTCInternalState {
  pc: RTCPeerConnection | null
  connected: boolean
  iceConnectionState: RTCIceConnectionState
  signalingState: RTCSignalingState
  connectionState: RTCPeerConnectionState
  localDescription: RTCSessionDescription | null
  remoteDescription: RTCSessionDescription | null
  candidates: RTCIceCandidate[]
  deps?: any[]
}

export function useWebRTC(options: WebRTCOptions = {},  __sauron_id__ = _sid()) {
  const {
    iceServers = [{ urls: "stun:stun.l.google.com:19302" }],
    autoConnect = false
  } = options

  return createHook(
    "useWebRTC",
     __sauron_id__,

    () => ({
      value: {
        pc: null,
        connected: false,
        iceConnectionState: "new",
        signalingState: "stable",
        connectionState: "new",
        localDescription: null,
        remoteDescription: null,
        candidates: [],
        deps: undefined
      } as WebRTCInternalState
    }),

    (hookState, key, notify) => {
      const s = hookState.value as WebRTCInternalState

      const createConnection = () => {
        if (typeof window === "undefined") return
        if (s.pc) return

        const pc = new RTCPeerConnection({ iceServers })
        s.pc = pc

        pc.oniceconnectionstatechange = () => {
          s.iceConnectionState = pc.iceConnectionState
          notify(key)
        }

        pc.onsignalingstatechange = () => {
          s.signalingState = pc.signalingState
          notify(key)
        }

        pc.onconnectionstatechange = () => {
          s.connectionState = pc.connectionState
          s.connected = pc.connectionState === "connected"
          notify(key)
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            s.candidates.push(event.candidate)
          }
        }
      }

      const createOffer = async () => {
        if (!s.pc) createConnection()
        const offer = await s.pc!.createOffer()
        await s.pc!.setLocalDescription(offer)
        s.localDescription = s.pc!.localDescription
        notify(key)
        return offer
      }

      const createAnswer = async () => {
        if (!s.pc) createConnection()
        const answer = await s.pc!.createAnswer()
        await s.pc!.setLocalDescription(answer)
        s.localDescription = s.pc!.localDescription
        notify(key)
        return answer
      }

      const setRemoteDescription = async (desc: RTCSessionDescriptionInit) => {
        if (!s.pc) createConnection()
        await s.pc!.setRemoteDescription(desc)
        s.remoteDescription = s.pc!.remoteDescription
        notify(key)
      }

      const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
        if (!s.pc) createConnection()
        await s.pc!.addIceCandidate(candidate)
      }

      const addStream = (stream: MediaStream) => {
        if (!s.pc) createConnection()
        stream.getTracks().forEach((track) => {
          s.pc!.addTrack(track, stream)
        })
      }

      const close = () => {
        if (s.pc) {
          s.pc.onicecandidate = null
          s.pc.oniceconnectionstatechange = null
          s.pc.onsignalingstatechange = null
          s.pc.onconnectionstatechange = null
          s.pc.close()
          s.pc = null
        }
        s.connected = false
        notify(key)
      }

      // dependency diffing
      const deps = [autoConnect]
      const changed =
        !s.deps ||
        s.deps.length !== deps.length ||
        s.deps.some((d, i) => d !== deps[i])

      if (changed) {
        s.deps = deps
        if (autoConnect) createConnection()
      }

      if (!hookState.cleanup) {
        hookState.cleanup = () => close()
      }

      return [
        {
          connected: s.connected,
          iceConnectionState: s.iceConnectionState,
          signalingState: s.signalingState,
          connectionState: s.connectionState,
          localDescription: s.localDescription,
          remoteDescription: s.remoteDescription
        },
        {
          createOffer,
          createAnswer,
          setRemoteDescription,
          addIceCandidate,
          addStream,
          close
        }
      ] as const
    }
  )
}
