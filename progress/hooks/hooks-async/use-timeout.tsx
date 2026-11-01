// app/hooks/index.ts
import { useState, useEffect, useRef, useCallback } from '#sauron';

export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setTimeout(() => {
        if (savedCallback.current) {
          savedCallback.current();
        }
      }, delay);
      return () => clearTimeout(id);
    }
  }, [delay]);
}
