/**
 * Error Components - Better error messages & user feedback
 * Session 2: UI Polish - Better error messages
 */

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  X,
} from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  onClose,
  closable = false,
  actions,
  className = '',
}) => {
  const variants = {
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-900 dark:text-green-100',
      messageColor: 'text-green-800 dark:text-green-200',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-100',
      messageColor: 'text-red-800 dark:text-red-200',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-100',
      messageColor: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-900 dark:text-blue-100',
      messageColor: 'text-blue-800 dark:text-blue-200',
    },
  };

  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <div
      className={`border rounded-lg p-4 ${config.container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <p className={`text-sm ${config.messageColor}`}>{message}</p>
          {actions && <div className="mt-3">{actions}</div>}
        </div>
        {closable && onClose && (
          <button
            onClick={onClose}
            className={`ml-3 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.iconColor} hover:opacity-75`}
            aria-label="Dismiss alert"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export interface ErrorMessageProps {
  error: Error | string;
  title?: string;
  retry?: () => void;
  reset?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title = 'Something went wrong',
  retry,
  reset,
  className = '',
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Alert
      variant="error"
      title={title}
      message={errorMessage}
      className={className}
      actions={
        (retry || reset) && (
          <div className="flex gap-2">
            {retry && (
              <button
                onClick={retry}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            )}
            {reset && (
              <button
                onClick={reset}
                className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )
      }
    />
  );
};

export interface ValidationErrorProps {
  errors: Record<string, string[]>;
  className?: string;
}

export const ValidationErrors: React.FC<ValidationErrorProps> = ({
  errors,
  className = '',
}) => {
  const errorEntries = Object.entries(errors);
  if (errorEntries.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {errorEntries.map(([field, messages]) => (
        <Alert
          key={field}
          variant="error"
          title={`${field.charAt(0).toUpperCase()}${field.slice(1)} Error`}
          message={messages.join(', ')}
        />
      ))}
    </div>
  );
};

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            We encountered an unexpected error. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={resetErrorBoundary}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export interface ToastProps {
  variant: AlertVariant;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  variant,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variants = {
    success: {
      bg: 'bg-green-600',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-600',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-yellow-600',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-600',
      icon: Info,
    },
  };

  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className={`${config.bg} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-md`}>
        <IconComponent className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{message}</p>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="flex-shrink-0 hover:opacity-75 transition-opacity"
            aria-label="Close toast"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Hook for toast notifications
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([]);

  const showToast = React.useCallback(
    (toast: Omit<ToastProps, 'onClose'>) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id, onClose: () => removeToast(id) }]);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};

// Common error messages
export const errorMessages = {
  network: 'Unable to connect. Please check your internet connection.',
  unauthorized: 'You need to be logged in to perform this action.',
  forbidden: "You don't have permission to access this resource.",
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  server: 'Server error. Please try again later.',
  timeout: 'Request timed out. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  
  // HTTP status code messages
  const status = error?.response?.status;
  if (status === 401) return errorMessages.unauthorized;
  if (status === 403) return errorMessages.forbidden;
  if (status === 404) return errorMessages.notFound;
  if (status >= 500) return errorMessages.server;
  
  return errorMessages.unknown;
};

