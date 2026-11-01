import { useCallback } from '#sauron';

export function useSmoothScroll() {
 const smoothScrollTo = useCallback((elementId: string) => {
    // Remove # if present
    const cleanId = elementId.startsWith('#') ? elementId.slice(1) : elementId;
    const element = document.getElementById(cleanId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  const smoothScrollToElement = useCallback((element: HTMLElement) => {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  const smoothScrollToTop = useCallback(() => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  }, []);

  return {
    smoothScrollTo,
    smoothScrollToElement,
    smoothScrollToTop
  };
}
