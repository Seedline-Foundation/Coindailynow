/**
 * Error Boundary for Super Admin Dashboard
 * Catches and handles React errors gracefully
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);

    // Log error to monitoring service (if available)
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: 'dashboard',
          boundary: 'error-boundary',
        },
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/super-admin/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />

              <h1 className="text-2xl font-bold text-white mb-4">
                Dashboard Error
              </h1>

              <p className="text-gray-300 mb-6">
                Something went wrong while loading the dashboard. This error has been logged and our team has been notified.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">Error Details:</h3>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                </button>
              </div>

              <div className="mt-6 text-sm text-gray-400">
                <p>If this problem persists, please contact the development team.</p>
                <p className="mt-1">
                  Error ID: {Date.now().toString(36)}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withDashboardErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <DashboardErrorBoundary fallback={fallback}>
      <Component {...props} />
    </DashboardErrorBoundary>
  );

  WrappedComponent.displayName = `withDashboardErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manual error reporting
 */
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    console.error('Manual error report:', error, context);

    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(error, {
        contexts: context,
        tags: {
          source: 'manual-report',
          component: 'dashboard',
        },
      });
    }
  }, []);

  return { reportError };
}
