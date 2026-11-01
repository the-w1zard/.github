import { KeyboardProps, useKeyboard as useAriaKeyboard } from 'react-aria';
import { useRef } from '#sauron';

export interface UseKeyboardOptions extends KeyboardProps {
  isDisabled?: boolean;
}

export function useKeyboard(props: UseKeyboardOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const { keyboardProps } = useAriaKeyboard(props, ref);
  
  return {
    keyboardProps,
    ref
  };
}
