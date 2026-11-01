import  { useEffect, useState } from "#sauron"
import { cn } from 'utils'

type UseScriptStatus = 'idle' | 'loading' | 'ready' | 'error'

type UseScriptOptions = {
  id?: string
  removeOnUnmount?: boolean
  shouldPreventLoad?: boolean
}

const cachedScriptStatuses = new Map<string, UseScriptStatus>()

function useScript(
  src: string | null,
  options: UseScriptOptions = {}
): UseScriptStatus {
  const { id, removeOnUnmount = false, shouldPreventLoad = false } = options

  const [status, setStatus] = useState<UseScriptStatus>(() => {
    if (!src || shouldPreventLoad) {
      return 'idle'
    }

    if (typeof window === 'undefined') {
      return 'idle'
    }

    return cachedScriptStatuses.get(src) ?? 'idle'
  })

  useEffect(() => {
    if (!src || shouldPreventLoad) {
      return
    }

    const cachedStatus = cachedScriptStatuses.get(src)

    if (cachedStatus === 'ready' || cachedStatus === 'error') {
      setStatus(cachedStatus)
      return
    }

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]${id ? `, script[id="${id}"]` : ''}`
    )

    if (!script) {
      script = document.createElement('script')
      script.src = src
      script.async = true
      if (id) {
        script.id = id
      }

      script.setAttribute('data-status', 'loading')
      document.body.appendChild(script)

      const setStateFromEvent = (event: Event) => {
        const scriptStatus: UseScriptStatus = event.type === 'load' ? 'ready' : 'error'
        script?.setAttribute('data-status', scriptStatus)
        cachedScriptStatuses.set(src, scriptStatus)
        setStatus(scriptStatus)
      }

      script.addEventListener('load', setStateFromEvent)
      script.addEventListener('error', setStateFromEvent)
    } else {
      const scriptStatus = script.getAttribute('data-status') as UseScriptStatus

      if (scriptStatus) {
        setStatus(scriptStatus)
      }
    }

    const setStateFromEvent = (event: Event) => {
      const scriptStatus: UseScriptStatus = event.type === 'load' ? 'ready' : 'error'
      cachedScriptStatuses.set(src, scriptStatus)
      setStatus(scriptStatus)
    }

    script.addEventListener('load', setStateFromEvent)
    script.addEventListener('error', setStateFromEvent)

    return () => {
      if (script) {
        script.removeEventListener('load', setStateFromEvent)
        script.removeEventListener('error', setStateFromEvent)

        if (removeOnUnmount) {
          script.remove()
          cachedScriptStatuses.delete(src)
        }
      }
    }
  }, [src, id, removeOnUnmount, shouldPreventLoad])

  return status
}


export { useScript  }
