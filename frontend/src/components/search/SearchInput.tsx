/**
 * Search Input Component
 * Task 23: Search input with autocomplete and accessibility features
 */

import React, { forwardRef } from 'react';
import { useSearch } from '../../contexts/SearchContext';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: (e: React.FocusEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    placeholder = "Search...",
    disabled = false,
    className = ""
  }, ref) {
    const { state } = useSearch();

    return (
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          search-input
          w-full px-4 py-3 pr-24 text-gray-900 placeholder-gray-500
          bg-white border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
        aria-label="Search CoinDaily content"
        aria-autocomplete="list"
        aria-expanded={false}
        autoComplete="off"
        spellCheck={false}
      />
    );
  }
);