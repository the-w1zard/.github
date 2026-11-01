import {  createHook, notifyHook } from '#the-cloud'

export function useCapability(__sauron_id__ = _sid()) {
  return createHook(
    'useCapability',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        webgl: false,
        webgl2: false,
        wasm: false,
        webp: false,
        avif: false,
        webgpu: false,
        webxr: false,
        webcodecs: false,
        webrtc: false,
        websocket: typeof WebSocket !== 'undefined',
        worker: typeof Worker !== 'undefined',
        sharedWorker: typeof SharedWorker !== 'undefined',
        serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
        touch: typeof window !== 'undefined' && 'ontouchstart' in window,
        pointer: typeof window !== 'undefined' && 'onpointerdown' in window,
        gamepad: typeof navigator !== 'undefined' && 'getGamepads' in navigator,
        virtualKeyboard: typeof navigator !== 'undefined' && 'virtualKeyboard' in navigator,
        wakeLock: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
        bluetooth: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
        usb: typeof navigator !== 'undefined' && 'usb' in navigator,
        serial: typeof navigator !== 'undefined' && 'serial' in navigator,
        hid: typeof navigator !== 'undefined' && 'hid' in navigator,
        nfc: typeof window !== 'undefined' && 'NDEFReader' in window,
        fileSystem: typeof window !== 'undefined' && 'showOpenFilePicker' in window,
        viewTransition: typeof document !== 'undefined' && 'startViewTransition' in document
      }
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const caps = hook.value

      const detectWebGL = () => {
        try {
          const canvas = document.createElement('canvas')
          caps.webgl = !!canvas.getContext('webgl')
          caps.webgl2 = !!canvas.getContext('webgl2')
        } catch {
          caps.webgl = false
          caps.webgl2 = false
        }
      }

      const detectWASM = () => {
        caps.wasm =
          typeof WebAssembly === 'object' &&
          typeof WebAssembly.instantiate === 'function'
      }

      const detectWebP = () => {
        const canvas = document.createElement('canvas')
        caps.webp = canvas.toDataURL('image/webp').indexOf('image/webp') === 5
      }

      const detectAVIF = async () => {
        try {
          const img = new Image()
          img.src =
            'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgABkf8P/aAA=='

          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
          })

          caps.avif = true
        } catch {
          caps.avif = false
        }
      }

      // run once
      detectWebGL()
      detectWASM()
      detectWebP()
      detectAVIF().then(() => notifyHook(key))

      const has = (cap: string) => caps[cap]
      const supports = (features: string[]) => features.every(f => caps[f])

      return [caps, has, supports]
    }
  )
}
