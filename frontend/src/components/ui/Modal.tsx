/**
 * Modal Component
 * Task 20: Authentication UI Components
 * 
 * Modal dialog component optimized for African mobile devices
 */

'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'african' | 'mobile-first';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  variant = 'african',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  className
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
    
    return () => {
      // Cleanup function for when modal is closed
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlay && event.target === event.currentTarget) {
      onClose();
    }
  };

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const variantStyles = {
    default: 'bg-white border border-neutral-200',
    african: 'bg-surface border border-secondary-200 shadow-2xl',
    'mobile-first': 'bg-white border-0 sm:border sm:border-secondary-200 shadow-2xl'
  };

  const modalClasses = clsx(
    'relative w-full rounded-lg shadow-xl transform transition-all',
    sizeStyles[size],
    variantStyles[variant],
    // Mobile-first responsive design
    {
      'mx-4 my-4': size !== 'full',
      'h-full sm:h-auto sm:my-8': variant === 'mobile-first',
      'rounded-none sm:rounded-lg': variant === 'mobile-first'
    },
    className
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={modalClasses}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              {title && (
                <h2
                  id="modal-title"
                  className="text-xl font-semibold text-neutral-900 African-accent"
                >
                  {title}
                </h2>
              )}
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="h-6 w-6 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Mobile-Optimized Bottom Sheet Modal ==========

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showHandle?: boolean;
  snapPoints?: number[];
  children: ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  showHandle = true,
  children,
  className
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
    
    return () => {
      // Cleanup function for when sheet is closed
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0">
        <div
          ref={sheetRef}
          className={clsx(
            'bg-white rounded-t-2xl shadow-2xl transform transition-all duration-300 ease-out',
            'max-h-[85vh] overflow-y-auto',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'bottomsheet-title' : undefined}
        >
          {/* Handle */}
          {showHandle && (
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-neutral-300 rounded-full" />
            </div>
          )}

          {/* Header */}
          {title && (
            <div className="px-6 pb-4">
              <h2
                id="bottomsheet-title"
                className="text-xl font-semibold text-neutral-900 text-center"
              >
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className="px-6 pb-6 safe-area-pb">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Confirmation Modal ==========

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false
}: ConfirmationModalProps) {
  const variantStyles = {
    danger: {
      icon: (
        <svg className="h-6 w-6 text-error-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      confirmButton: 'bg-error-DEFAULT hover:bg-error-dark text-white'
    },
    warning: {
      icon: (
        <svg className="h-6 w-6 text-warning-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      confirmButton: 'bg-warning-DEFAULT hover:bg-warning-dark text-white'
    },
    info: {
      icon: (
        <svg className="h-6 w-6 text-info-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      confirmButton: 'bg-primary-500 hover:bg-primary-600 text-white'
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      variant="african"
      closeOnOverlay={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
          {variantStyles[variant].icon}
        </div>

        {/* Content */}
        <h3 className="text-lg font-medium text-neutral-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center',
              variantStyles[variant].confirmButton
            )}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}