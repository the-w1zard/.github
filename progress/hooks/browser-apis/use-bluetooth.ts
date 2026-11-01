import { createHook, HookState } from '#the-cloud'
import { _sid } from '../_sid'

interface BluetoothHookState extends HookState {
  device:    any
  connected: boolean
  server:    any
  services:  Map<string, any>
  error:     any
  supported: boolean
}

export function useBluetooth(__sauron_id__ = _sid()) {
  return createHook(
    'useBluetooth',
    __sauron_id__,
    (): BluetoothHookState => ({
      value:     undefined,
      device:    null,
      connected: false,
      server:    null,
      services:  new Map(),
      error:     null,
      supported: typeof navigator !== 'undefined' && 'bluetooth' in navigator
    }),
    (s: BluetoothHookState, key, notify) => {
      const requestDevice = async (options = {}) => {
        if (!s.supported) { s.error = 'Bluetooth not supported'; notify(key); return }
        try {
          const device = await (navigator as any).bluetooth.requestDevice({
            acceptAllDevices: true,
            ...options
          })
          s.device = device
          device.addEventListener('gattserverdisconnected', () => {
            s.connected = false
            s.server    = null
            notify(key)
          })
          notify(key)
          return device
        } catch (error) {
          s.error = error
          notify(key)
        }
      }

      const connect = async () => {
        if (!s.device) return
        try {
          s.server    = await s.device.gatt.connect()
          s.connected = true
          notify(key)
          return s.server
        } catch (error) {
          s.error = error
          notify(key)
        }
      }

      const disconnect = () => {
        if (s.device?.gatt?.connected) s.device.gatt.disconnect()
      }

      const getService = async (uuid: string) => {
        if (!s.server) return
        try {
          const service = await s.server.getPrimaryService(uuid)
          s.services.set(uuid, service)
          return service
        } catch (error) {
          s.error = error
          notify(key)
        }
      }

      return [
        { device: s.device, connected: s.connected, error: s.error, supported: s.supported },
        { requestDevice, connect, disconnect, getService }
      ]
    }
  )
}
