// app/hooks/index.ts
import { useState, useEffect, useRef, useCallback } from '#sauron';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: Event) => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: Event) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}
