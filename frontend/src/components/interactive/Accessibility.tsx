/**
 * Accessibility Enhancements - Task 54
 * FR-095: Accessible design with ARIA labels
 * FR-095: WCAG 2.1 accessibility compliance
 * 
 * Comprehensive accessibility utilities and components
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ========== Screen Reader Utilities ==========
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span', 
  className 
}: ScreenReaderOnlyProps) {
  return React.createElement(
    Component,
    {
      className: cn(
        'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        className
      )
    },
    children
  );
}

// ========== Live Region for Dynamic Updates ==========
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
  className,
}: LiveRegionProps) {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {children}
    </div>
  );
}

// ========== Focus Management ==========
interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({ 
  children, 
  active, 
  restoreFocus = true,
  className 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  if (!active) return <>{children}</>;

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// ========== Skip Links ==========
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-blue-600 text-white px-4 py-2 rounded-md font-medium z-50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
    >
      {children}
    </a>
  );
}

// ========== Accessible Button ==========
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  type = 'button',
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
}: AccessibleButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-md',
        'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span aria-hidden="true">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !loading && (
        <span aria-hidden="true">{icon}</span>
      )}
    </button>
  );
}

// ========== Accessible Form Field ==========
interface AccessibleFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  help?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

export function AccessibleField({
  label,
  children,
  error,
  help,
  required = false,
  className,
  labelClassName,
}: AccessibleFieldProps) {
  const fieldId = React.useId();
  const helpId = help ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'block text-sm font-medium text-gray-700',
          labelClassName
        )}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required,
      })}
      
      {help && (
        <p id={helpId} className="text-sm text-gray-600">
          {help}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ========== Accessible Modal ==========
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscapeKey?: boolean;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  closeOnOverlayClick = true,
  closeOnEscapeKey = true,
}: AccessibleModalProps) {
  const titleId = React.useId();
  
  useEffect(() => {
    if (!closeOnEscapeKey) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscapeKey]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <FocusTrap active={isOpen}>
        <div
          className={cn(
            'relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto',
            className
          )}
        >
          <div className="p-6">
            <h2 id={titleId} className="text-xl font-semibold text-gray-900 mb-4">
              {title}
            </h2>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

// ========== Keyboard Navigation Helper ==========
export function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement }>,
  onSelect?: (id: string) => void
) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && onSelect) {
          onSelect(items[activeIndex].id);
        }
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  }, [items, activeIndex, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management
  useEffect(() => {
    if (activeIndex >= 0 && items[activeIndex]?.element) {
      items[activeIndex].element?.focus();
    }
  }, [activeIndex, items]);

  return { activeIndex, setActiveIndex };
}

export default {
  ScreenReaderOnly,
  LiveRegion,
  FocusTrap,
  SkipLink,
  AccessibleButton,
  AccessibleField,
  AccessibleModal,
  useKeyboardNavigation,
};
