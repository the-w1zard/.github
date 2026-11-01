import { useEffect, useRef } from "#sauron";

export function useUnmountEffect(effect: React.EffectCallback) {
  const effectRef = useRef(effect);
  
  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);
  
  useEffect(() => {
    return () => {
      effectRef.current();
    };
  }, []);
}
