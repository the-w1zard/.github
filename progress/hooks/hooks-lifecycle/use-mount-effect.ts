import { useEffect } from '#sauron';

export function useMountEffect(effect: React.EffectCallback) {
  useEffect(effect, []);
}
