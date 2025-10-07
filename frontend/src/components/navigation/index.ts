// Navigation Components Export
// Centralized exports for all navigation-related components

export { default as MainNavigation } from './MainNavigation';
export { default as BreadcrumbNavigation, useBreadcrumbs } from './BreadcrumbNavigation';
export { default as NavigationWrapper } from './NavigationWrapper';

// Export navigation analytics utilities
export * from '@/lib/navigation-analytics';

// Export types
export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  href?: string;
  items?: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}