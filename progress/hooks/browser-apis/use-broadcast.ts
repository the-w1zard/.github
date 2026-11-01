import { createHook, HookState } from '#the-cloud'
import { _sid } from '../_sid'

interface BroadcastHookState extends HookState {
  rt:     BroadcastChannel | null
  channelName: string
}

export function useBroadcast<T>(channelName: string, initialValue: T | null = null, __sauron_id__ = _sid()): [T | null, (v: T) => void, () => T | null] {
  return createHook(
    'useBroadcast',
    __sauron_id__,
    (): BroadcastHookState => {
      const rt = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null
      const s: BroadcastHookState = {
        value:       initialValue,
        rt,
        channelName
      }
      if (rt) {
        rt.addEventListener('message', (e: MessageEvent) => { s.value = e.data })
      }
      s.cleanup = () => {
        if (!s.rt) return
        s.rt.close()
        s.rt = null
      }
      return s
    },
    (s: BroadcastHookState, key, notify) => {
      if (s.rt) {
        const existing = (s.rt as any).__onMessage__
        if (!existing) {
          const onMessage = (e: MessageEvent) => { s.value = e.data; notify(key) }
          ;(s.rt as any).__onMessage__ = onMessage
          s.rt.addEventListener('message', onMessage)
        }
      }

      const broadcast = (newValue: T) => {
        if (!s.rt) return
        s.value = newValue
        s.rt.postMessage(newValue)
        notify(key)
      }

      const getValue = () => s.value as T | null

      return [s.value as T | null, broadcast, getValue]
    }
  )
}
