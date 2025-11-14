/**
 * AMP Link Component
 * Adds AMP link to regular article pages for discoverability
 */

'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface AMPLinkProps {
  articleSlug: string;
  className?: string;
}

export default function AMPLink({ articleSlug, className = '' }: AMPLinkProps) {
  const ampUrl = `/amp/news/${articleSlug}`;

  return (
    <a
      href={ampUrl}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 ${className}`}
      title="View AMP version (40-60% faster on mobile)"
    >
      <Zap className="w-4 h-4" />
      <span>AMP Version</span>
    </a>
  );
}

/**
 * AMP Meta Tags Component
 * Adds AMP metadata to article head
 */
export function AMPMetaTags({ articleSlug }: { articleSlug: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coindaily.co';
  const ampUrl = `${baseUrl}/amp/news/${articleSlug}`;

  return (
    <>
      <link rel="amphtml" href={ampUrl} />
      <meta property="og:type" content="article" />
    </>
  );
}

