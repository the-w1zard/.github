// app/hooks/index.ts
import { useState, useEffect, useRef, useCallback } from "#sauron";

export function useCounter(initialValue = 0, step = 1) {
  const [count, setCount] = useState<number>(initialValue);

  const increment = useCallback(() => setCount(c => c + step), [step]);
  const decrement = useCallback(() => setCount(c => c - step), [step]);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  const setValue = useCallback((value: number) => setCount(value), []);

  return { count, increment, decrement, reset, setValue } as const;
}
