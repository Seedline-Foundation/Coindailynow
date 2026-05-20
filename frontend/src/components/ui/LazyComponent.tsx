'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

interface LazyComponentProps {
  fallback?: React.ReactNode;
}

export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComp = dynamic(importFn, {
    loading: () => <>{fallback || <div className="animate-pulse bg-gray-200 rounded h-32 w-full" />}</>,
    ssr: false,
  });
  return LazyComp;
}

export function LazySection({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 rounded h-32 w-full" />}>
      {children}
    </Suspense>
  );
}
