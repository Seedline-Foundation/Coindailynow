/**
 * Enhanced Animations Component - Task 54
 * FR-082, FR-083, FR-089, FR-093: Animated marquee, hover effects, visual cues, smooth transitions
 * 
 * CSS animations and interactive effects for the landing page
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ========== Fade In Animation ==========
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  triggerOnce?: boolean;
}

export function FadeIn({ 
  children, 
  delay = 0, 
  direction = 'up', 
  className,
  triggerOnce = true 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [triggerOnce]);

  const directionClasses = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible 
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ========== Enhanced Hover Effects ==========
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  hoverRotate?: number;
  hoverShadow?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export function HoverCard({
  children,
  className,
  hoverScale = 1.02,
  hoverRotate = 0,
  hoverShadow = true,
  clickable = false,
  onClick,
}: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out transform-gpu',
        hoverShadow && 'hover:shadow-lg hover:shadow-black/10',
        clickable && 'cursor-pointer',
        className
      )}
      style={{
        transform: isHovered 
          ? `scale(${hoverScale}) rotate(${hoverRotate}deg)` 
          : 'scale(1) rotate(0deg)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}

// ========== Enhanced Marquee Component ==========
interface EnhancedMarqueeProps {
  children: React.ReactNode;
  speed?: number; // pixels per second
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
  gradientEdges?: boolean;
}

export function EnhancedMarquee({
  children,
  speed = 50,
  direction = 'left',
  pauseOnHover = true,
  className,
  gradientEdges = true,
}: EnhancedMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [children]);

  const duration = contentWidth / speed;

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-white border-y border-gray-200',
        className
      )}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      role="region"
      aria-label="Scrolling news ticker"
    >
      {/* Gradient edges for fade effect */}
      {gradientEdges && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        </>
      )}
      
      {/* Scrolling content */}
      <div className="flex">
        <div
          ref={contentRef}
          className={cn(
            'flex animate-marquee whitespace-nowrap',
            direction === 'right' && 'animate-marquee-reverse',
            isPaused && 'animation-paused'
          )}
          style={{
            animationDuration: `${duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        >
          {children}
        </div>
        {/* Duplicate for seamless loop */}
        <div
          className={cn(
            'flex animate-marquee whitespace-nowrap',
            direction === 'right' && 'animate-marquee-reverse',
            isPaused && 'animation-paused'
          )}
          style={{
            animationDuration: `${duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ========== Progressive Loading Skeleton ==========
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full',
    rectangular: 'w-full h-24',
    circular: 'w-12 h-12 rounded-full',
    rounded: 'w-full h-24 rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
      role="presentation"
      aria-label="Loading content"
    />
  );
}

// ========== Visual Cues and Indicators ==========
interface VisualCueProps {
  type: 'new' | 'hot' | 'trending' | 'premium' | 'updated';
  className?: string;
  animate?: boolean;
}

export function VisualCue({ type, className, animate = true }: VisualCueProps) {
  const cueConfig = {
    new: {
      text: 'NEW',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      icon: '✨',
    },
    hot: {
      text: 'HOT',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      icon: '🔥',
    },
    trending: {
      text: 'TRENDING',
      bgColor: 'bg-purple-500',
      textColor: 'text-white',
      icon: '📈',
    },
    premium: {
      text: 'PREMIUM',
      bgColor: 'bg-yellow-500',
      textColor: 'text-black',
      icon: '⭐',
    },
    updated: {
      text: 'UPDATED',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      icon: '🔄',
    },
  };

  const config = cueConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full',
        config.bgColor,
        config.textColor,
        animate && 'animate-bounce',
        className
      )}
      role="status"
      aria-label={`${config.text} indicator`}
    >
      <span className="text-xs">{config.icon}</span>
      {config.text}
    </span>
  );
}

// ========== Loading States ==========
interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  className?: string;
}

export function LoadingState({ isLoading, children, skeleton, className }: LoadingStateProps) {
  if (isLoading && skeleton) {
    return <div className={className}>{skeleton}</div>;
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton variant="rounded" height={200} />
        <div className="space-y-2">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ========== Smooth Transition Wrapper ==========
interface TransitionWrapperProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
  duration?: number;
  type?: 'fade' | 'slide' | 'scale';
}

export function TransitionWrapper({
  children,
  show,
  className,
  duration = 300,
  type = 'fade',
}: TransitionWrapperProps) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  const transitionClasses = {
    fade: show ? 'opacity-100' : 'opacity-0',
    slide: show ? 'translate-y-0' : 'translate-y-4',
    scale: show ? 'scale-100' : 'scale-95',
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        transitionClasses[type],
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

export default {
  FadeIn,
  HoverCard,
  EnhancedMarquee,
  Skeleton,
  VisualCue,
  LoadingState,
  TransitionWrapper,
};