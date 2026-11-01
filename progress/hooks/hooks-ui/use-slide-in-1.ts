import { useEffect, useRef, useState } from "#sauron";

// Enhanced hook with direction support
export function useSlideInV1(
  direction = 'top', 
  threshold = 0.15, 
  rootMargin = '0px 0px -50px 0px',
  duration = 500,
  delay = 0
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { 
        threshold, 
        rootMargin 
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin]);

  // Generate transform classes based on direction
  const getTransformClasses = () => {
    const transforms = {
      top: {
        hidden: 'translate-y-8 opacity-0',
        visible: 'translate-y-0 opacity-100'
      },
      bottom: {
        hidden: '-translate-y-8 opacity-0',
        visible: 'translate-y-0 opacity-100'
      },
      left: {
        hidden: 'translate-x-8 opacity-0',
        visible: 'translate-x-0 opacity-100'
      },
      right: {
        hidden: '-translate-x-8 opacity-0',
        visible: 'translate-x-0 opacity-100'
      },
      'top-left': {
        hidden: 'translate-x-8 translate-y-8 opacity-0',
        visible: 'translate-x-0 translate-y-0 opacity-100'
      },
      'top-right': {
        hidden: '-translate-x-8 translate-y-8 opacity-0',
        visible: 'translate-x-0 translate-y-0 opacity-100'
      },
      'bottom-left': {
        hidden: 'translate-x-8 -translate-y-8 opacity-0',
        visible: 'translate-x-0 translate-y-0 opacity-100'
      },
      'bottom-right': {
        hidden: '-translate-x-8 -translate-y-8 opacity-0',
        visible: 'translate-x-0 translate-y-0 opacity-100'
      },
      scale: {
        hidden: 'scale-95 opacity-0',
        visible: 'scale-100 opacity-100'
      },
      fade: {
        hidden: 'opacity-0',
        visible: 'opacity-100'
      }
    };

    return transforms[direction] || transforms.top;
  };

  const transforms = getTransformClasses();
  const baseClasses = `transform transition-all duration-${duration} ease-out`;
  const delayClass = delay > 0 ? `delay-${delay}` : '';
  
  const animationClasses = `${baseClasses} ${delayClass} ${
    isVisible ? transforms.visible : transforms.hidden
  }`;

  return [ref, isVisible, animationClasses];
}

