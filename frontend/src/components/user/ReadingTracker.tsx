// frontend/src/components/user/ReadingTracker.tsx
// Task 66: Reading Behavior Tracker Component

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ReadingTrackerProps {
  articleId: string;
  onComplete?: () => void;
}

export default function ReadingTracker({
  articleId,
  onComplete,
}: ReadingTrackerProps) {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [startTime] = useState(Date.now());
  const [hasTracked, setHasTracked] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Track scroll behavior
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrolled = (scrollTop / (documentHeight - windowHeight)) * 100;

      setScrollPercentage(Math.min(scrolled, 100));

      // Debounce tracking
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        // Track if user has scrolled at least 25%
        if (scrolled >= 25 && !hasTracked) {
          trackReading(scrolled);
        }
      }, 2000); // Track after 2 seconds of no scrolling
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [articleId, hasTracked]);

  useEffect(() => {
    // Track when user leaves page
    const handleBeforeUnload = () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 5) {
        // Only track if user spent at least 5 seconds
        trackReading(scrollPercentage, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Track on unmount (for SPA navigation)
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 5) {
        trackReading(scrollPercentage, true);
      }
    };
  }, [scrollPercentage, startTime]);

  const trackReading = async (scrolled: number, isFinal: boolean = false) => {
    if (hasTracked && !isFinal) return;

    const duration = Math.floor((Date.now() - startTime) / 1000);
    const completed = scrolled >= 75; // Consider completed if scrolled 75%+

    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Don't track anonymous users

      const response = await fetch('/api/engagement/track-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          articleId,
          duration,
          scrollPercentage: scrolled,
          completed,
          deviceType: detectDeviceType(),
        }),
      });

      if (response.ok) {
        setHasTracked(true);
        if (completed && onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error tracking reading:', error);
    }
  };

  const detectDeviceType = (): string => {
    const width = window.innerWidth;
    if (width < 768) return 'MOBILE';
    if (width < 1024) return 'TABLET';
    return 'DESKTOP';
  };

  // Reading progress indicator
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="h-1 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
        style={{ width: `${scrollPercentage}%` }}
      />
    </div>
  );
}
