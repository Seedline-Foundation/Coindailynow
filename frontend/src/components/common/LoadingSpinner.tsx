/**
 * Loading Spinner Component
 * Task 22: Loading states for market data dashboard
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  message, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
          {message}
        </p>
      )}
    </div>
  );
}