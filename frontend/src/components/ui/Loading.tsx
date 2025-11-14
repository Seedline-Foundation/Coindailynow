/**
 * Loading Components - Comprehensive loading states
 * Session 2: UI Polish - Loading states & spinners
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    secondary: 'border-secondary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
  };

  return (
    <div className={`flex gap-1.5 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '1s',
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface LoadingBarProps {
  progress?: number; // 0-100
  indeterminate?: boolean;
  height?: 'xs' | 'sm' | 'md';
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({
  progress = 0,
  indeterminate = false,
  height = 'sm',
  color = 'primary',
  className = '',
}) => {
  const heightClasses = {
    xs: 'h-0.5',
    sm: 'h-1',
    md: 'h-2',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
  };

  return (
    <div
      className={`relative w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClasses[height]} ${className}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${heightClasses[height]} ${colorClasses[color]} rounded-full transition-all duration-300 ${
          indeterminate ? 'animate-loading-bar' : ''
        }`}
        style={{
          width: indeterminate ? '40%' : `${progress}%`,
        }}
      />
    </div>
  );
};

export interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
}) => {
  const baseClass = 'animate-pulse bg-gray-300 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${variantClasses.text}`}
            style={{
              width: i === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClass} ${variantClasses.card} ${className}`}>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded" />
            <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={{
        width: width || '100%',
        height: height || (variant === 'circular' ? width : '1rem'),
      }}
    />
  );
};

export interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  children?: React.ReactNode;
  blur?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message,
  children,
  blur = true,
  className = '',
}) => {
  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${
        blur ? 'backdrop-blur-sm' : ''
      } ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-sm mx-4 text-center">
        {children || (
          <>
            <LoadingSpinner size="xl" className="mx-auto mb-4" />
            {message && (
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading...',
  fullScreen = true,
}) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900'
    : 'flex items-center justify-center p-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

// Article card skeleton
export const ArticleCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-300 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
    </div>
  </div>
);

// Dashboard card skeleton
export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded" />
    </div>
    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2" />
    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
  </div>
);

// Add loading bar animation to tailwind config
export const loadingBarAnimation = `
@keyframes loading-bar {
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
}
`;

