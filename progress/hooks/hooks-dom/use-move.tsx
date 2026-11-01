import { MoveProps, useMove as useAriaMove } from 'react-aria';
import { useRef } from '#sauron';

export interface UseMoveOptions extends MoveProps {
  isDisabled?: boolean;
}

export function useMove(props: UseMoveOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const { moveProps } = useAriaMove(props, ref);
  
  return {
    moveProps,
    ref
  };
}
