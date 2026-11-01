
// app/hooks/index.ts
import { useState, useEffect, useRef, useCallback } from '#sauron';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
