import { useEffect, useRef } from "#sauron";

export function useUpdateEffect(effect: React.EffectCallback, dependencies: any[]) {
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      return effect();
    }
  }, dependencies);
}
