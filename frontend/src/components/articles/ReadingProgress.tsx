/**
 * ReadingProgress - Reading Progress Indicator Component
 * CoinDaily Platform - Task 21 Implementation
 */

import React from 'react';
import { formatDuration } from '../../utils/formatters';

interface ReadingProgressProps {
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  showTimeRemaining?: boolean;
  completed?: boolean;
  className?: string;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({
  progress,
  estimatedTimeRemaining = 0,
  showTimeRemaining = false,
  completed = false,
  className = ''
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Format remaining time
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return '0 min';
    if (seconds < 60) return '1 min';
    
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className={`reading-progress ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        {/* Background */}
        <div className="w-full bg-gray-200 h-1">
          {/* Progress Fill */}
          <div
            className={`h-full transition-all duration-300 ease-out ${
              completed 
                ? 'bg-green-500' 
                : 'bg-gradient-to-r from-green-400 to-green-600'
            }`}
            style={{ width: `${clampedProgress}%` }}
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Reading progress: ${clampedProgress}%`}
          />
        </div>

        {/* Progress Labels */}
        {(showTimeRemaining || completed) && (
          <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
            <span className="font-medium">
              {completed ? 'Complete' : `${Math.round(clampedProgress)}%`}
            </span>
            
            {showTimeRemaining && !completed && estimatedTimeRemaining > 0 && (
              <span>
                {formatTimeRemaining(estimatedTimeRemaining)} remaining
              </span>
            )}
            
            {completed && (
              <span className="text-green-600 font-medium flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Article complete
              </span>
            )}
          </div>
        )}
      </div>

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {completed && 'Article reading completed'}
        {!completed && clampedProgress > 0 && `${Math.round(clampedProgress)}% read`}
      </div>
    </div>
  );
};