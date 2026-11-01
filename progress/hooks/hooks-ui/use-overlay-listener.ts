import { useEffect, useRef, useCallback } from "#sauron";

export function useOverlayListener(
  ref: React.RefObject<HTMLElement>,
  callback: (event: { type: 'outsidePress' | 'escapeKey' }) => void,
  isOpen: boolean
) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback({ type: 'escapeKey' });
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback({ type: 'outsidePress' });
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback, isOpen]);
}
