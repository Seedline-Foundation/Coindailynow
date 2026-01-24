import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Generate breadcrumbs from router path
const generateBreadcrumbsFromPath = (asPath: string): BreadcrumbItem[] => {
  // Remove query parameters and hash
  const path = asPath.split('?')[0].split('#')[0];
  const segments = path.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  // Build breadcrumbs from path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast
    });
  });

  return breadcrumbs;
};

export default function BreadcrumbNavigation({ items, className }: BreadcrumbNavigationProps) {
  const router = useRouter();
  
  // Use provided items or generate from router path
  const breadcrumbItems = items || generateBreadcrumbsFromPath(router.asPath);

  // Don't show breadcrumbs on home page
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  const handleBreadcrumbClick = (label: string, href?: string) => {
    trackEvent('breadcrumb_click', { label, href });
  };

  return (
    <nav 
      className={cn('bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700', className)}
      aria-label="Breadcrumb"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center space-x-2 py-3 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon 
                  className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" 
                  aria-hidden="true"
                />
              )}
              
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  onClick={() => handleBreadcrumbClick(item.label, item.href)}
                  aria-label={index === 0 ? 'Go to home page' : `Go to ${item.label}`}
                >
                  {index === 0 && (
                    <HomeIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  )}
                  <span className={cn(
                    'hover:underline',
                    index === 0 && 'sr-only sm:not-sr-only'
                  )}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span 
                  className="flex items-center text-gray-900 dark:text-gray-100 font-medium"
                  aria-current="page"
                >
                  {index === 0 && (
                    <HomeIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  )}
                  <span className={cn(index === 0 && 'sr-only sm:not-sr-only')}>
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

// Hook for custom breadcrumb management
export function useBreadcrumbs() {
  const router = useRouter();
  
  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    // This could be connected to a context or state management solution
    // For now, we'll rely on the automatic generation
    console.log('Setting breadcrumbs:', items);
  };

  const addBreadcrumb = (item: BreadcrumbItem) => {
    // Add a breadcrumb to the current path
    console.log('Adding breadcrumb:', item);
  };

  return {
    setBreadcrumbs,
    addBreadcrumb,
    currentPath: router.asPath
  };
}
