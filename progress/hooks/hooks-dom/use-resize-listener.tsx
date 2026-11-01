import { useEffect, RefObject } from '#sauron';

export function useResizeListener(
  ref: RefObject<HTMLElement>,
  handler: (entries: ResizeObserverEntry[]) => void
) {
  useEffect(() => {
    const targetElement = ref.current;
    if (!targetElement) return;
    
    const observer = new ResizeObserver(handler);
    observer.observe(targetElement);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, handler]);
}
