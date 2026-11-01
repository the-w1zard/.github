import { useEffect, RefObject } from '#sauron';

export function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element?: RefObject<HTMLElement>,
  options?: boolean | AddEventListenerOptions
) {
  useEffect(() => {
    const targetElement = element?.current || window;
    
    if (!targetElement?.addEventListener) return;
    
    const eventListener = (event: HTMLElementEventMap[K]) => handler(event);
    
    targetElement.addEventListener(eventName, eventListener, options);
    
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, handler, element, options]);
}

