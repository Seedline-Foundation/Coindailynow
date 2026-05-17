/**
 * Bloomberg-style loading: skeletons render immediately with stable min-heights (CLS-safe).
 */

export function InstantSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function ArticleListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <InstantSkeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/** Homepage hero + grid — matches layout in app/page.tsx */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" aria-busy="true" aria-label="Loading homepage">
      <InstantSkeleton className="h-16 w-full rounded-none" />
      <InstantSkeleton className="h-10 w-full rounded-none" />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <InstantSkeleton className="h-8 w-48" />
        <InstantSkeleton className="h-[380px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <InstantSkeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <InstantSkeleton key={i} className="h-56 w-full rounded-xl" />
              ))}
            </div>
            <InstantSkeleton className="h-6 w-36" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <InstantSkeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <InstantSkeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Homepage article grid only (inside shell with header/ticker) */
export function HomeArticlesSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <InstantSkeleton className="h-[380px] w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <InstantSkeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <InstantSkeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <InstantSkeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <InstantSkeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** /news listing */
export function NewsListSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" aria-busy="true">
      <InstantSkeleton className="h-10 w-64" />
      <InstantSkeleton className="h-[280px] w-full rounded-2xl" />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <InstantSkeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Article detail */
export function ArticlePageSkeleton() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-8 space-y-6" aria-busy="true">
      <InstantSkeleton className="h-4 w-48" />
      <InstantSkeleton className="h-6 w-24 rounded-full" />
      <InstantSkeleton className="h-12 w-full max-w-3xl" />
      <InstantSkeleton className="h-4 w-40" />
      <InstantSkeleton className="h-[360px] w-full rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <InstantSkeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </article>
  );
}
