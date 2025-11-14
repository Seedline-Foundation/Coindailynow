/**
 * Animation Components - Smooth animations & transitions
 * Session 2: UI Polish - Smooth animations
 */

import React, { useEffect, useState, useRef } from 'react';

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

export interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'bottom',
  delay = 0,
  duration = 400,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const transforms = {
    left: 'translateX(-20px)',
    right: 'translateX(20px)',
    top: 'translateY(-20px)',
    bottom: 'translateY(20px)',
  };

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0)' : transforms[direction],
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

export interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

export interface IntersectionAnimateProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn';
  direction?: 'left' | 'right' | 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export const IntersectionAnimate: React.FC<IntersectionAnimateProps> = ({
  children,
  animation = 'fadeIn',
  direction = 'bottom',
  threshold = 0.1,
  rootMargin = '0px',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const getAnimationStyles = () => {
    if (!isVisible) {
      switch (animation) {
        case 'fadeIn':
          return { opacity: 0 };
        case 'slideIn':
          const transforms = {
            left: 'translateX(-20px)',
            right: 'translateX(20px)',
            top: 'translateY(-20px)',
            bottom: 'translateY(20px)',
          };
          return { opacity: 0, transform: transforms[direction] };
        case 'scaleIn':
          return { opacity: 0, transform: 'scale(0.95)' };
      }
    }
    return { opacity: 1, transform: 'translate(0) scale(1)' };
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${className}`}
      style={getAnimationStyles()}
    >
      {children}
    </div>
  );
};

export interface StaggerChildrenProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
  children,
  staggerDelay = 100,
  className = '',
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={index * staggerDelay} key={index}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

export interface CollapsibleProps {
  children: React.ReactNode;
  isOpen: boolean;
  duration?: number;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  isOpen,
  duration = 300,
  className = '',
}) => {
  const [height, setHeight] = useState<number | 'auto'>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
      const timer = setTimeout(() => setHeight('auto'), duration);
      return () => clearTimeout(timer);
    } else {
      setHeight(0);
    }
  }, [isOpen, duration]);

  return (
    <div
      className={`overflow-hidden transition-all ${className}`}
      style={{
        height,
        transitionDuration: `${duration}ms`,
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

export interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  active = true,
  className = '',
}) => {
  return (
    <div className={`${active ? 'animate-pulse' : ''} ${className}`}>
      {children}
    </div>
  );
};

export interface BounceProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  active = true,
  className = '',
}) => {
  return (
    <div className={`${active ? 'animate-bounce' : ''} ${className}`}>
      {children}
    </div>
  );
};

export interface ShakeProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const Shake: React.FC<ShakeProps> = ({
  children,
  active = true,
  className = '',
}) => {
  return (
    <div className={`${active ? 'animate-shake' : ''} ${className}`}>
      {children}
    </div>
  );
};

// Hover animations
export const hoverAnimations = {
  scale: 'transition-transform hover:scale-105',
  lift: 'transition-all hover:shadow-lg hover:-translate-y-1',
  glow: 'transition-shadow hover:shadow-2xl',
  rotate: 'transition-transform hover:rotate-3',
  brightness: 'transition-all hover:brightness-110',
};

// Custom animations for tailwind config
export const customAnimations = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes loading-bar {
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
}
`;

