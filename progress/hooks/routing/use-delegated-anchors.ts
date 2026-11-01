import { useNavigateY } from '#sauron'

function isLinkEvent(event: MouseEvent): HTMLAnchorElement | null {
  let el = event.target as HTMLElement | null
  while (el) {
    if (el.tagName === 'A') return el as HTMLAnchorElement
    el = el.parentElement
  }
  return null
}

interface DelegatedAnchorsState extends HookState {
  attached: boolean
}

export function useDelegatedAnchors(
  nodeRef:       { current: HTMLElement | null },
  __sauron_id__ = _sid()
) {
  return createHook(
    'useDelegatedAnchors',
    __sauron_id__,
    (): DelegatedAnchorsState => ({
      value:    undefined,
      attached: false
    }),
    (s: HookState) => {
      const state = s as DelegatedAnchorsState
      if (state.attached) return undefined

      const node = nodeRef.current
      if (!node) return undefined

      state.attached = true
      const nav = useNavigateY()

      const handler = (event: MouseEvent) => {
        const anchor = isLinkEvent(event)
        if (!anchor) return
        if (event.button !== 0) return
        if (anchor.target && anchor.target !== '_self') return
        if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
        if (anchor.hasAttribute('download')) return
        const { pathname, search, hash } = anchor
        nav.push(`${pathname}${search}${hash}`)
        event.preventDefault()
      }

      node.addEventListener('click', handler)
      state.cleanup = () => node.removeEventListener('click', handler)

      return undefined
    }
  )
}
