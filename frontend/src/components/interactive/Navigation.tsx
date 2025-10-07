/**
 * Enhanced Navigation Component - Task 54
 * FR-086: Easy category navigation
 * FR-090: Click-through section headers
 * 
 * Interactive navigation with smooth scrolling and section jumping
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Hash, ArrowUp } from 'lucide-react';

// ========== Category Navigation ==========
interface CategoryNavProps {
  categories: Array<{
    id: string;
    name: string;
    icon?: React.ReactNode;
    count?: number;
    isActive?: boolean;
  }>;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showCounts?: boolean;
}

export function CategoryNavigation({
  categories,
  onCategoryChange,
  className,
  variant = 'horizontal',
  showCounts = true,
}: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange(categoryId);
    
    // Smooth scroll to section if it exists
    const element = document.getElementById(`section-${categoryId}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest' 
      });
    }
  };

  const containerClasses = variant === 'horizontal' 
    ? 'flex flex-wrap gap-2' 
    : 'flex flex-col space-y-1';

  return (
    <nav 
      className={cn(containerClasses, className)}
      role="navigation"
      aria-label="Content categories"
    >
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
            'hover:bg-gray-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500',
            activeCategory === category.id
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-white text-gray-700 border border-gray-200'
          )}
          aria-pressed={activeCategory === category.id}
          aria-label={`Navigate to ${category.name} section`}
        >
          {category.icon && (
            <span className="text-sm">{category.icon}</span>
          )}
          <span>{category.name}</span>
          {showCounts && category.count !== undefined && (
            <span 
              className={cn(
                'px-2 py-1 text-xs rounded-full',
                activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {category.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

// ========== Section Headers with Click-through ==========
interface SectionHeaderProps {
  id: string;
  title: string;
  subtitle?: string;
  count?: number;
  icon?: React.ReactNode;
  onHeaderClick?: (sectionId: string) => void;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (sectionId: string) => void;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  actions?: React.ReactNode;
}

export function SectionHeader({
  id,
  title,
  subtitle,
  count,
  icon,
  onHeaderClick,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  className,
  level = 2,
  actions,
}: SectionHeaderProps) {
  const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const handleClick = () => {
    if (onHeaderClick) {
      onHeaderClick(id);
    }
    
    if (isCollapsible && onToggleCollapse) {
      onToggleCollapse(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      className={cn(
        'group flex items-center justify-between py-4 border-b border-gray-200',
        (onHeaderClick || isCollapsible) && 'cursor-pointer hover:bg-gray-50 rounded-lg px-4 -mx-4',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={(onHeaderClick || isCollapsible) ? 0 : undefined}
      role={(onHeaderClick || isCollapsible) ? 'button' : undefined}
      aria-expanded={isCollapsible ? !isCollapsed : undefined}
      aria-controls={isCollapsible ? `content-${id}` : undefined}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
            {icon}
          </div>
        )}
        
        <div>
          {React.createElement(
            HeaderTag,
            {
              className: cn(
                'font-bold text-gray-900 group-hover:text-blue-600 transition-colors',
                level === 1 && 'text-3xl',
                level === 2 && 'text-2xl',
                level === 3 && 'text-xl',
                level === 4 && 'text-lg',
                level === 5 && 'text-base',
                level === 6 && 'text-sm'
              )
            },
            <>
              {title}
              {count !== undefined && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({count})
                </span>
              )}
            </>
          )}
          
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        
        {isCollapsible && (
          <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
        )}
        
        {(onHeaderClick && !isCollapsible) && (
          <Hash className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

// ========== Table of Contents / Quick Navigation ==========
interface TableOfContentsProps {
  sections: Array<{
    id: string;
    title: string;
    level?: number;
    isActive?: boolean;
  }>;
  className?: string;
  position?: 'fixed' | 'static';
  showActiveIndicator?: boolean;
}

export function TableOfContents({
  sections,
  className,
  position = 'static',
  showActiveIndicator = true,
}: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [isVisible, setIsVisible] = useState(false);

  // Track active section based on scroll position
  useEffect(() => {
    if (!showActiveIndicator) return;

    const observers: IntersectionObserver[] = [];
    
    sections.forEach((section) => {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setActiveSection(section.id);
            }
          },
          {
            threshold: 0.5,
            rootMargin: '-100px 0px -300px 0px',
          }
        );
        
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [sections, showActiveIndicator]);

  // Show/hide TOC based on scroll position
  useEffect(() => {
    if (position !== 'fixed') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [position]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest' 
      });
    }
  };

  const tocClasses = cn(
    'bg-white border border-gray-200 rounded-lg shadow-sm p-4',
    position === 'fixed' && [
      'fixed right-6 top-1/2 transform -translate-y-1/2 max-h-96 overflow-y-auto z-50',
      'transition-all duration-300',
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
    ],
    className
  );

  return (
    <nav className={tocClasses} role="navigation" aria-label="Table of contents">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Contents</h3>
      
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'w-full text-left px-2 py-1 text-sm rounded transition-colors',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
                section.level && section.level > 1 && `ml-${(section.level - 1) * 3}`,
                activeSection === section.id
                  ? 'text-blue-600 bg-blue-50 font-medium'
                  : 'text-gray-600'
              )}
              aria-current={activeSection === section.id ? 'location' : undefined}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ========== Back to Top Button ==========
export function BackToTopButton({ className }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg z-50',
        'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
        'transition-all duration-300 transform',
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-2 scale-95 pointer-events-none',
        className
      )}
      aria-label="Scroll to top of page"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

export default {
  CategoryNavigation,
  SectionHeader,
  TableOfContents,
  BackToTopButton,
};