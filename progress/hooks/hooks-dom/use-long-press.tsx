import { LongPressProps, useLongPress as useAriaLongPress } from 'react-aria';
import { useRef } from '#sauron';

export interface UseLongPressOptions extends LongPressProps {
  isDisabled?: boolean;
}

export function useLongPress(props: UseLongPressOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const { longPressProps } = useAriaLongPress(props, ref);
  
  return {
    longPressProps,
    ref
  };
}
