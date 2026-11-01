import { FocusWithinProps, useFocusWithin as useAriaFocusWithin } from 'react-aria';
import { useRef } from '#sauron';

export interface UseFocusWithinOptions extends FocusWithinProps {
  isDisabled?: boolean;
}

export function useFocusWithin(props: UseFocusWithinOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const { focusWithinProps } = useAriaFocusWithin(props, ref);
  
  return {
    focusWithinProps,
    ref
  };
}
