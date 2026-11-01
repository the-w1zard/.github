import React, { useEffect, useRef, useState } from '#sauron'
import { cn } from 'utils'

type EventType = 'mousedown' | 'mouseup' | 'touchstart' | 'touchend' | 'focusin' | 'focusout'

function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T> | React.RefObject<T>[],
  handler: (event: Event) => void,
  eventType: EventType = 'mousedown',
  eventListenerOptions: AddEventListenerOptions = {}
): void {
  useEffect(() => {
    const listener = (event: Event) => {
      const refs = Array.isArray(ref) ? ref : [ref]
      
      const target = event.target as Node
      
      const isOutside = refs.every((r) => {
        const element = r.current
        return element && !element.contains(target)
      })

      if (isOutside) {
        handler(event)
      }
    }

    document.addEventListener(eventType, listener, eventListenerOptions)

    return () => {
      document.removeEventListener(eventType, listener, eventListenerOptions)
    }
  }, [ref, handler, eventType, eventListenerOptions])
}


 
export { useOnClickOutside,}
