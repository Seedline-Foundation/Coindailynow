/**
 * Base UI Components for Authentication
 * Task 20: Authentication UI Components
 * 
 * Reusable UI components with African-inspired design and mobile-first approach
 */

'use client';

import React, { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

// ========== Input Component ==========

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string | undefined;
  hint?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'african';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  helpText,
  size = 'md',
  variant = 'african',
  leftIcon,
  rightIcon,
  isLoading,
  className,
  disabled,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const baseStyles = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2';
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantStyles = {
    default: 'border-neutral-300 bg-white focus:border-primary-500 focus:ring-primary-500/20',
    african: 'border-secondary-200 bg-surface focus:border-primary-500 focus:ring-primary-500/20 placeholder-neutral-500'
  };

  const errorStyles = error ? 'border-error-DEFAULT focus:border-error-DEFAULT focus:ring-error/20' : '';
  
  const inputClasses = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    errorStyles,
    {
      'pl-10': leftIcon && size === 'md',
      'pl-9': leftIcon && size === 'sm',
      'pl-12': leftIcon && size === 'lg',
      'pr-10': rightIcon && size === 'md',
      'pr-9': rightIcon && size === 'sm',
      'pr-12': rightIcon && size === 'lg',
      'opacity-60 cursor-not-allowed': disabled || isLoading,
    },
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className={clsx(
            'absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400',
            {
              'text-sm': size === 'sm',
              'text-base': size === 'md',
              'text-lg': size === 'lg'
            }
          )}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          disabled={disabled || isLoading}
          {...props}
        />
        
        {(rightIcon || isLoading) && (
          <div className={clsx(
            'absolute right-3 top-1/2 transform -translate-y-1/2',
            {
              'text-sm': size === 'sm',
              'text-base': size === 'md',
              'text-lg': size === 'lg'
            }
          )}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-300 border-t-primary-600"></div>
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
      
      {(error || hint || helpText) && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-error-DEFAULT' : 'text-neutral-500'
        )}>
          {error || hint || helpText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ========== Textarea Component ==========

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | undefined;
  hint?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'african';
  isLoading?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  helpText,
  size = 'md',
  variant = 'african',
  isLoading,
  className,
  disabled,
  id,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const baseStyles = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 resize-vertical min-h-[100px]';
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantStyles = {
    default: 'border-neutral-300 bg-white focus:border-primary-500 focus:ring-primary-500/20',
    african: 'border-secondary-200 bg-surface focus:border-primary-500 focus:ring-primary-500/20 placeholder-neutral-500'
  };

  const errorStyles = error ? 'border-error-DEFAULT focus:border-error-DEFAULT focus:ring-error/20' : '';
  
  const textareaClasses = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    errorStyles,
    {
      'opacity-60 cursor-not-allowed': disabled || isLoading,
    },
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          disabled={disabled || isLoading}
          {...props}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-300 border-t-primary-600"></div>
          </div>
        )}
      </div>
      
      {(error || hint || helpText) && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-error-DEFAULT' : 'text-neutral-500'
        )}>
          {error || hint || helpText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ========== Button Component ==========

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'african-gold' | 'mobile-money';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  disabled,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-3 text-base gap-2',
    lg: 'px-6 py-4 text-lg gap-3',
    xl: 'px-8 py-5 text-xl gap-3'
  };

  const variantStyles = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500/50 shadow-md hover:shadow-lg',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-500/50 shadow-md hover:shadow-lg',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500/50',
    ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500/50',
    'african-gold': 'bg-gradient-to-r from-secondary-400 to-secondary-600 hover:from-secondary-500 hover:to-secondary-700 text-white shadow-lg hover:shadow-xl focus:ring-secondary-500/50',
    'mobile-money': 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-lg hover:shadow-xl focus:ring-accent-500/50'
  };

  const buttonClasses = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    {
      'w-full': fullWidth,
    },
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      ) : leftIcon}
      
      {children}
      
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';

// ========== Checkbox Component ==========

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  variant?: 'default' | 'african';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  variant = 'african',
  className,
  ...props
}, ref) => {
  const variantStyles = {
    default: 'text-primary-600 focus:ring-primary-500 border-neutral-300',
    african: 'text-secondary-600 focus:ring-secondary-500 border-secondary-200'
  };

  const checkboxClasses = clsx(
    'h-5 w-5 rounded border-2 transition-colors duration-200 focus:ring-2 focus:ring-offset-2',
    variantStyles[variant],
    error ? 'border-error-DEFAULT focus:ring-error/20' : '',
    className
  );

  return (
    <div className="flex items-start">
      <input
        ref={ref}
        type="checkbox"
        className={checkboxClasses}
        {...props}
      />
      {label && (
        <div className="ml-3">
          <label className="text-sm font-medium text-neutral-700">
            {label}
          </label>
          {error && (
            <p className="mt-1 text-sm text-error-DEFAULT">{error}</p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// ========== Select Component ==========

interface SelectOption {
  value: string;
  label: string;
  flag?: string;
}

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string | undefined;
  hint?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'african';
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  helpText,
  size = 'md',
  variant = 'african',
  options,
  placeholder,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const baseStyles = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 bg-white appearance-none';
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantStyles = {
    default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
    african: 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500/20'
  };

  const errorStyles = error ? 'border-error-DEFAULT focus:border-error-DEFAULT focus:ring-error/20' : '';
  
  const selectClasses = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    errorStyles,
    'pr-10', // Space for dropdown arrow
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.flag ? `${option.flag} ${option.label}` : option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {(error || hint || helpText) && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-error-DEFAULT' : 'text-neutral-500'
        )}>
          {error || hint || helpText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// ========== MultiSelect Component ==========

interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  label?: string;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'african';
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
  id?: string;
}

export function MultiSelect({
  label,
  error,
  helpText,
  size = 'md',
  variant = 'african',
  options,
  values,
  onChange,
  placeholder = 'Select options...',
  maxSelections,
  className,
  id
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const multiSelectId = id || `multiselect-${Math.random().toString(36).substr(2, 9)}`;

  const handleToggleOption = (optionValue: string) => {
    const isSelected = values.includes(optionValue);
    
    if (isSelected) {
      onChange(values.filter(v => v !== optionValue));
    } else {
      if (maxSelections && values.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      onChange([...values, optionValue]);
    }
  };

  const selectedOptions = options.filter(option => values.includes(option.value));

  const baseStyles = 'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 bg-white cursor-pointer';
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantStyles = {
    default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
    african: 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500/20'
  };

  const errorStyles = error ? 'border-error-DEFAULT focus:border-error-DEFAULT focus:ring-error/20' : '';
  
  const selectClasses = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    errorStyles,
    'pr-10', // Space for dropdown arrow
    className
  );

  return (
    <div className="w-full relative">
      {label && (
        <label id={`${multiSelectId}-label`} className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          id={multiSelectId}
          className={selectClasses}
          onClick={() => setIsOpen(!isOpen)}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${multiSelectId}-label` : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {selectedOptions.length === 0 ? (
                <span className="text-neutral-500">{placeholder}</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map((option) => (
                    <span
                      key={option.value}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {option.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleOption(option.value);
                        }}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200 focus:outline-none focus:bg-primary-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center text-neutral-400">
              {maxSelections && (
                <span className="text-xs mr-2 text-neutral-500">
                  {values.length}/{maxSelections}
                </span>
              )}
              <svg
                className={clsx(
                  'h-5 w-5 transition-transform duration-200',
                  isOpen ? 'transform rotate-180' : ''
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => {
              const isSelected = values.includes(option.value);
              const isDisabled = maxSelections && !isSelected && values.length >= maxSelections;
              
              return (
                <div
                  key={option.value}
                  className={clsx(
                    'flex items-center px-4 py-3 cursor-pointer hover:bg-neutral-50',
                    isSelected && 'bg-primary-50',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => {
                    if (!isDisabled) {
                      handleToggleOption(option.value);
                    }
                  }}
                >
                  <div
                    className={clsx(
                      'w-4 h-4 border-2 rounded mr-3 flex items-center justify-center',
                      isSelected
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-neutral-300'
                    )}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-neutral-500 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {(error || helpText) && (
        <p className={clsx(
          'mt-2 text-sm',
          error ? 'text-error-DEFAULT' : 'text-neutral-500'
        )}>
          {error || helpText}
        </p>
      )}
    </div>
  );
}

// ========== Alert Component ==========

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  type = 'info',
  title,
  message,
  onClose,
  className
}: AlertProps) {
  const typeStyles = {
    info: 'bg-info-light/10 border-info-light text-info-dark',
    success: 'bg-success-light/10 border-success-light text-success-dark',
    warning: 'bg-warning-light/10 border-warning-light text-warning-dark',
    error: 'bg-error-light/10 border-error-light text-error-dark'
  };

  const iconMap = {
    info: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div className={clsx(
      'border border-l-4 p-4 rounded-r-md',
      typeStyles[type],
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          {iconMap[type]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Loading Spinner Component ==========

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className
}: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4'
  };

  const colorStyles = {
    primary: 'border-primary-300 border-t-primary-600',
    secondary: 'border-secondary-300 border-t-secondary-600',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div className={clsx(
      'animate-spin rounded-full',
      sizeStyles[size],
      colorStyles[color],
      className
    )} />
  );
}

// Card Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};
