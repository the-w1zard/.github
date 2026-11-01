// use-blocker.ts
import {   createHook, notifyHook, getCurrentComponent } from '#the-cloud'
import { useNavigateY } from '#sauron'

 type BlockerState = 'unblocked' | 'blocked' | 'proceeding'
 interface Blocker {
  state: BlockerState
  proceed: () => void
  reset: () => void
}

export function useBlocker(shouldBlock: boolean | (() => boolean), __sauron_id__ = _sid()): Blocker {
  // Store navigate instance outside the hook state
  let navigate: ReturnType<typeof useNavigateY> | null = null
  
  return createHook(
    'useBlocker',
    __sauron_id__,
    () => {
      // Call useNavigateY inside the component context
      navigate = useNavigateY()
      
      const hook: any = {
        value: undefined,
        state: 'unblocked',
        pendingUrl: null,
        pendingReplace: false,
        origPush: null,
        origReplace: null,
        _beforeUnload: (e: BeforeUnloadEvent) => {
          const blocked = typeof shouldBlock === 'function' ? shouldBlock() : shouldBlock
          if (blocked) {
            e.preventDefault()
            e.returnValue = ''
          }
        },
        cleanup() {
          if (typeof window === 'undefined') return
          if (this.origPush) window.history.pushState = this.origPush
          if (this.origReplace) window.history.replaceState = this.origReplace
          window.removeEventListener('beforeunload', this._beforeUnload)
        }
      }

      if (typeof window !== 'undefined') {
        hook.origPush = window.history.pushState.bind(window.history)
        hook.origReplace = window.history.replaceState.bind(window.history)

        window.history.pushState = (data: any, unused: string, url?: string | URL | null) => {
          const blocked = typeof shouldBlock === 'function' ? shouldBlock() : shouldBlock
          if (blocked && url) {
            hook.pendingUrl = url.toString()
            hook.pendingReplace = false
            hook.state = 'blocked'
            notifyHook(`${getCurrentComponent().id}:useBlocker:${__sauron_id__}`)
            return
          }
          hook.origPush(data, unused, url)
        }

        window.history.replaceState = (data: any, unused: string, url?: string | URL | null) => {
          const blocked = typeof shouldBlock === 'function' ? shouldBlock() : shouldBlock
          if (blocked && url) {
            hook.pendingUrl = url.toString()
            hook.pendingReplace = true
            hook.state = 'blocked'
            notifyHook(`${getCurrentComponent().id}:useBlocker:${__sauron_id__}`)
            return
          }
          hook.origReplace(data, unused, url)
        }

        window.addEventListener('beforeunload', hook._beforeUnload)
      }

      return hook
    },
    (hook, key) => {
      const proceed = () => {
        if (!hook.pendingUrl) return
        hook.state = 'proceeding'
        const url = hook.pendingUrl
        const replace = hook.pendingReplace
        hook.pendingUrl = null

        if (navigate) {
          if (replace) {
            navigate.replace(url)
          } else {
            navigate.push(url)
          }
        }

        hook.state = 'unblocked'
        notifyHook(key)
      }

      const reset = () => {
        hook.pendingUrl = null
        hook.state = 'unblocked'
        notifyHook(key)
      }

      return { state: hook.state, proceed, reset }
    }
  )
}
