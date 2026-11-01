import { FocusProps, useFocus as useAriaFocus } from 'react-aria';
import { useRef } from '#sauron';

export interface UseFocusOptions extends FocusProps {
  isDisabled?: boolean;
}

export function useFocus(props: UseFocusOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const { focusProps, isFocused } = useAriaFocus(props, ref);
  
  return {
    focusProps,
    isFocused,
    ref
  };
}
