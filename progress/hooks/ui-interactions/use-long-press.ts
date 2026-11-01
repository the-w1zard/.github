import { createHook, notifyHook } from'#the-cloud'

export function useLongPress(
  callback: (ev: Event) => void,
  options: {
    threshold?: number
    onStart?: (ev: Event) => void
    onFinish?: (ev: Event) => void
    onCancel?: (ev: Event) => void
  } = {},
  __sauron_id__ = _sid()
) {
  const {
    threshold = 400,
    onStart,
    onFinish,
    onCancel
  } = options

  return createHook(
    'useLongPress',
    __sauron_id__,

    () => ({
      value: {
        isLongPressing: false,
        timeoutId: null as any,
        ref: null as HTMLElement | null,
        attached: false,
        cleanup: null as null | (() => void)
      }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const setRef = (node: HTMLElement | null) => {
        s.ref = node
        notify(key)
      }

      const getIsLongPressing = () => s.isLongPressing

      if (!s.attached && typeof window !== 'undefined') {
        s.attached = true

        const attach = () => {
          if (!s.ref) return

          const start = (e: Event) => {
            onStart?.(e)

            s.timeoutId = setTimeout(() => {
              s.isLongPressing = true
              callback(e)
              notify(key)
            }, threshold)
          }

          const cancel = (e: Event) => {
            if (s.timeoutId) clearTimeout(s.timeoutId)

            if (s.isLongPressing) {
              onFinish?.(e)
            } else {
              onCancel?.(e)
            }

            s.isLongPressing = false
            notify(key)
          }

          s.ref.addEventListener('mousedown', start)
          s.ref.addEventListener('touchstart', start)
          s.ref.addEventListener('mouseup', cancel)
          s.ref.addEventListener('mouseleave', cancel)
          s.ref.addEventListener('touchend', cancel)
          s.ref.addEventListener('touchcancel', cancel)

          s.cleanup = () => {
            if (!s.ref) return
            s.ref.removeEventListener('mousedown', start)
            s.ref.removeEventListener('touchstart', start)
            s.ref.removeEventListener('mouseup', cancel)
            s.ref.removeEventListener('mouseleave', cancel)
            s.ref.removeEventListener('touchend', cancel)
            s.ref.removeEventListener('touchcancel', cancel)
            if (s.timeoutId) clearTimeout(s.timeoutId)
          }
        }

        queueMicrotask(attach)
      }

      return [setRef, s.isLongPressing, getIsLongPressing]
    }
  )
}
