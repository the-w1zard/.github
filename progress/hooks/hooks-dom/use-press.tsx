import { PressProps, usePress as useAriaPress } from 'react-aria';
import { useRef } from '#sauron';

export interface UsePressOptions extends PressProps {
  isDisabled?: boolean;
}

export function usePress(props: UsePressOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const { pressProps, isPressed } = useAriaPress(props, ref);
  
  return {
    pressProps,
    isPressed,
    ref
  };
}
