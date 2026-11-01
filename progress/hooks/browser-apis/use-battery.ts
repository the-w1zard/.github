import { createHook, HookState } from '#the-cloud'
import { _sid } from '../_sid'

interface BatteryHookState extends HookState {
  charging:        boolean
  level:           number
  chargingTime:    number
  dischargingTime: number
  supported:       boolean
  battery:         any
}

export function useBattery(__sauron_id__ = _sid()) {
  return createHook(
    'useBattery',
    __sauron_id__,
    (): BatteryHookState => {
      const supported = typeof navigator !== 'undefined' && 'getBattery' in navigator
      const s: BatteryHookState = {
        value:           undefined,
        charging:        true,
        level:           1,
        chargingTime:    0,
        dischargingTime: Infinity,
        supported,
        battery:         null
      }
      s.cleanup = () => {
        if (!s.battery) return
        s.battery.removeEventListener('chargingchange',      s.battery.__update__)
        s.battery.removeEventListener('levelchange',         s.battery.__update__)
        s.battery.removeEventListener('chargingtimechange',  s.battery.__update__)
        s.battery.removeEventListener('dischargingtimechange', s.battery.__update__)
      }
      return s
    },
    (s: BatteryHookState, key, notify) => {
      if (s.supported && !s.battery) {
        ;(navigator as any).getBattery().then((batteryManager: any) => {
          s.battery = batteryManager

          const update = () => {
            s.charging        = batteryManager.charging
            s.level           = batteryManager.level
            s.chargingTime    = batteryManager.chargingTime
            s.dischargingTime = batteryManager.dischargingTime
            notify(key)
          }

          batteryManager.__update__ = update
          batteryManager.addEventListener('chargingchange',       update)
          batteryManager.addEventListener('levelchange',          update)
          batteryManager.addEventListener('chargingtimechange',   update)
          batteryManager.addEventListener('dischargingtimechange', update)

          update()
        })
      }

      const getStatus = () => ({
        charging:        s.charging,
        level:           s.level,
        chargingTime:    s.chargingTime,
        dischargingTime: s.dischargingTime,
        supported:       s.supported
      })

      return [s, getStatus]
    }
  )
}
