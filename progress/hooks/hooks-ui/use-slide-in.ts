import { useEffect, useRef, useState } from "#sauron";

export function useSlideIn(
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


export function useSlideInAnimation(
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

function FeatureCard({ title, description, icon, direction = 'top', delay = 0 }) {
  const [ref, isVisible, animationClasses] = useSlideInAnimation(direction, 0.15, '0px 0px -50px 0px', 500, delay);
  
  return (
    <div 
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${animationClasses}`}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function DirectionalGrid({ items, title, directions = ['top', 'top', 'top'] }) {
  return (
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {items.map((item, index) => (
          <FeatureCard 
            key={index} 
            {...item} 
            direction={directions[index]} 
            delay={index * 100}
          />
        ))}
      </div>
    </div>
  );
}

export  function DirectionalAnimationsDemo() {
  // Different sections with various animation directions
  const [heroRef, heroVisible, heroClasses] = useSlideInAnimation('scale', 0.1);
  const [section1Ref, section1Visible, section1Classes] = useSlideInAnimation('bottom', 0.15);
  const [section2Ref, section2Visible, section2Classes] = useSlideInAnimation('left', 0.15);
  const [section3Ref, section3Visible, section3Classes] = useSlideInAnimation('right', 0.15);
  const [ctaRef, ctaVisible, ctaClasses] = useSlideInAnimation('fade', 0.15, '0px 0px -100px 0px', 800);

  const features = [
    { title: "Fast Performance", description: "Lightning-fast loading and smooth interactions", icon: "⚡" },
    { title: "Secure by Default", description: "Enterprise-grade security built-in", icon: "🔒" },
    { title: "Easy Integration", description: "Simple APIs and documentation", icon: "🔧" }
  ];

  const services = [
    { title: "Cloud Storage", description: "Scalable storage solutions", icon: "☁️" },
    { title: "Analytics", description: "Deep insights and reporting", icon: "📊" },
    { title: "Support", description: "24/7 customer support", icon: "💬" }
  ];

  const benefits = [
    { title: "Cost Effective", description: "Reduce operational costs", icon: "💰" },
    { title: "Reliable", description: "99.9% uptime guaranteed", icon: "✅" },
    { title: "Scalable", description: "Grow with your business", icon: "📈" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      
      {/* Hero Section - Scale Animation */}
      <section className="py-20 px-6">
        <div ref={heroRef} className={`max-w-4xl mx-auto text-center ${heroClasses}`}>
          <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Directional Slide Animations
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Scroll down to see animations from different directions
          </p>
          <div className="flex justify-center gap-4 flex-wrap text-sm">
            <span className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">↑ From Top</span>
            <span className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">↓ From Bottom</span>
            <span className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full">← From Left</span>
            <span className="bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full">→ From Right</span>
            <span className="bg-pink-100 dark:bg-pink-900 px-3 py-1 rounded-full">⚡ Scale & Fade</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section 1 - Slides from Bottom */}
        <section ref={section1Ref} className={section1Classes}>
          <DirectionalGrid
            items={features}
            title="Features (From Bottom ↓)"
            directions={['bottom', 'bottom', 'bottom']}
          />
        </section>

        {/* Section 2 - Slides from Left */}
        <section ref={section2Ref} className={section2Classes}>
          <DirectionalGrid
            items={services}
            title="Services (From Left ←)"
            directions={['left', 'left', 'left']}
          />
        </section>

        {/* Section 3 - Slides from Right */}
        <section ref={section3Ref} className={section3Classes}>
          <DirectionalGrid
            items={benefits}
            title="Benefits (From Right →)"
            directions={['right', 'right', 'right']}
          />
        </section>

        {/* Mixed Directions Demo */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4 text-center text-gray-900 dark:text-white">
            Mixed Directions Demo
          </h2>
          <DirectionalGrid
            items={[
              { title: "Top-Left", description: "Slides from top-left corner", icon: "↖️" },
              { title: "Scale Up", description: "Scales from center", icon: "🎯" },
              { title: "Top-Right", description: "Slides from top-right corner", icon: "↗️" }
            ]}
            directions={['top-left', 'scale', 'top-right']}
          />
        </section>

      </div>

      {/* CTA Section - Fade Animation */}
      <section className="py-20 px-6">
        <div ref={ctaRef} className={`max-w-4xl mx-auto text-center ${ctaClasses}`}>
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            This section fades in smoothly
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105">
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="py-16 px-6 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            Usage Examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Basic Usage:</h4>
              <code className="text-blue-600">
                {`const [ref, isVisible, classes] = useSlideInAnimation('top');`}
              </code>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">With Custom Settings:</h4>
              <code className="text-blue-600">
                {`useSlideInAnimation('left', 0.2, '0px', 800, 200);`}
              </code>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Available Directions:</h4>
              <code className="text-green-600">
                'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'scale', 'fade'
              </code>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">In Component:</h4>
              <code className="text-purple-600">
                {`<div ref={ref} className={\`\${isVisible ? 'animate-in' : 'animate-out'}\`}>Content</div>`}
              </code>
            </div>
          </div>
        </div>
      </section>

      <div className="h-32"></div>
    </div>
  );
}
