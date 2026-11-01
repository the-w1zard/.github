import { useEffect, useRef } from "#sauron";

interface UseOverlayScrollListenerOptions {
  /**
   * Whether the overlay is currently open
   */
  isOpen: boolean;
  /**
   * Whether to prevent body scroll when overlay is open
   * @default true
   */
  preventBodyScroll?: boolean;
  /**
   * Callback fired when scroll is attempted while overlay is open
   */
  onScrollAttempt?: () => void;
  /**
   * Custom element to apply scroll prevention to
   * @default document.body
   */
  targetElement?: HTMLElement | null;
}

/**
 * Hook to manage scroll behavior when overlays are open
 * Prevents body scroll and optionally handles scroll events
 */
export const useOverlayScrollListener = ({
  isOpen,
  preventBodyScroll = true,
  onScrollAttempt,
  targetElement
}: UseOverlayScrollListenerOptions) => {
  const previousOverflowRef = useRef<string>('');
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (!preventBodyScroll) return;

    const element = targetElement || document.body;
    if (!element) return;

    if (isOpen) {
      // Store current scroll position and overflow style
      scrollPositionRef.current = window.pageYOffset;
      previousOverflowRef.current = element.style.overflow;
      
      // Prevent scrolling
      element.style.overflow = 'hidden';
      element.style.position = 'fixed';
      element.style.top = `-${scrollPositionRef.current}px`;
      element.style.width = '100%';
    } else {
      // Restore scrolling
      element.style.overflow = previousOverflowRef.current;
      element.style.position = '';
      element.style.top = '';
      element.style.width = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);
    }

    // Cleanup function
    return () => {
      if (isOpen) {
        element.style.overflow = previousOverflowRef.current;
        element.style.position = '';
        element.style.top = '';
        element.style.width = '';
        window.scrollTo(0, scrollPositionRef.current);
      }
    };
  }, [isOpen, preventBodyScroll, targetElement]);

  useEffect(() => {
    if (!isOpen || !onScrollAttempt) return;

    const handleScroll = (e: Event) => {
      e.preventDefault();
      onScrollAttempt();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      onScrollAttempt();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      onScrollAttempt();
    };

    // Add passive: false to ensure preventDefault works
    const options = { passive: false };

    document.addEventListener('scroll', handleScroll, options);
    document.addEventListener('wheel', handleWheel, options);
    document.addEventListener('touchmove', handleTouchMove, options);

    return () => {
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, onScrollAttempt]);
};

export default useOverlayScrollListener;
/**
 * // Basic usage
const { } = useOverlayScrollListener({
  isOpen: modalOpen
});

// With scroll attempt callback
const { } = useOverlayScrollListener({
  isOpen: drawerOpen,
  onScrollAttempt: () => console.log('User tried to scroll!')
});

// Custom target element
const { } = useOverlayScrollListener({
  isOpen: overlayOpen,
  targetElement: containerRef.current,
  preventBodyScroll: false
});
 */
