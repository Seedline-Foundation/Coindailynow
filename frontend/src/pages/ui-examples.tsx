/**
 * Integration Examples - How to use new UI components
 * Practical examples for implementing UI polish components
 */

import React from 'react';
import { 
  LoadingSpinner, 
  LoadingSkeleton, 
  LoadingOverlay,
  ArticleCardSkeleton 
} from '@/components/ui/Loading';
import { 
  FadeIn, 
  SlideIn, 
  IntersectionAnimate,
  StaggerChildren 
} from '@/components/ui/Animations';
import { 
  Alert, 
  ErrorMessage, 
  useToast,
  EmptyState 
} from '@/components/ui/Errors';
import { FileText, Plus } from 'lucide-react';

// =============================================================================
// EXAMPLE 1: Article List with Loading States and Animations
// =============================================================================

export function ArticleListExample() {
  const [articles, setArticles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/articles');
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state with skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <ErrorMessage
        error={error}
        title="Failed to load articles"
        retry={fetchArticles}
      />
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={64} />}
        title="No articles found"
        description="There are no articles to display at the moment."
        action={{
          label: 'Refresh',
          onClick: fetchArticles,
        }}
      />
    );
  }

  // Success state with staggered animations
  return (
    <StaggerChildren staggerDelay={50} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <IntersectionAnimate key={article.id} animation="fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{article.excerpt}</p>
          </div>
        </IntersectionAnimate>
      ))}
    </StaggerChildren>
  );
}

// =============================================================================
// EXAMPLE 2: Form Submission with Loading and Toast
// =============================================================================

export function FormExample() {
  const [submitting, setSubmitting] = React.useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast({
        variant: 'success',
        message: 'Form submitted successfully!',
        duration: 5000,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        message: 'Failed to submit form. Please try again.',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FadeIn>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </FadeIn>
  );
}

// =============================================================================
// EXAMPLE 3: Dashboard Stats with Slide-In Animation
// =============================================================================

export function DashboardStatsExample() {
  const stats = [
    { label: 'Total Articles', value: '1,234', change: '+12%', positive: true },
    { label: 'Active Users', value: '5,678', change: '+8%', positive: true },
    { label: 'Page Views', value: '89,012', change: '-3%', positive: false },
    { label: 'Engagement', value: '76%', change: '+5%', positive: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <SlideIn
          key={stat.label}
          direction="bottom"
          delay={index * 100}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {stat.label}
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold">{stat.value}</p>
            <span
              className={`text-sm font-medium ${
                stat.positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.change}
            </span>
          </div>
        </SlideIn>
      ))}
    </div>
  );
}

// =============================================================================
// EXAMPLE 4: Data Fetching with Loading Overlay
// =============================================================================

export function DataFetchExample() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setData({ message: 'Data loaded successfully!' });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={fetchData}
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Load Data
      </button>

      {data && (
        <FadeIn>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{data.message}</p>
          </div>
        </FadeIn>
      )}

      <LoadingOverlay
        show={loading}
        message="Loading data..."
        blur
      />
    </div>
  );
}

// =============================================================================
// EXAMPLE 5: Alert Messages
// =============================================================================

export function AlertsExample() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Alert
        variant="success"
        title="Success!"
        message="Your changes have been saved successfully."
        closable
      />

      <Alert
        variant="error"
        title="Error"
        message="There was a problem processing your request."
        closable
        actions={
          <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
            Try Again
          </button>
        }
      />

      <Alert
        variant="warning"
        title="Warning"
        message="Your subscription will expire in 3 days."
        closable
      />

      <Alert
        variant="info"
        message="New features are now available. Check them out!"
        closable
      />
    </div>
  );
}

// =============================================================================
// EXAMPLE 6: Loading States Gallery
// =============================================================================

export function LoadingStatesExample() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spinners</h3>
        <div className="flex items-center gap-6">
          <LoadingSpinner size="xs" />
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
          <LoadingSpinner size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Skeletons</h3>
        <div className="space-y-4">
          <LoadingSkeleton variant="text" lines={3} />
          <LoadingSkeleton variant="rectangular" width="100%" height={200} />
          <div className="flex gap-4">
            <LoadingSkeleton variant="circular" width={64} height={64} />
            <div className="flex-1">
              <LoadingSkeleton variant="text" lines={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 7: Complete Page with All Features
// =============================================================================

export function CompletePageExample() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setData({ items: [1, 2, 3, 4, 5] });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    showToast({
      variant: 'success',
      message: 'Action completed successfully!',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton variant="text" width="50%" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} variant="card" height={200} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessage
          error={error}
          title="Failed to load page"
          retry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <FadeIn>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      </FadeIn>

      <Alert
        variant="info"
        message="Welcome back! Here's your dashboard overview."
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StaggerChildren staggerDelay={100}>
          {data.items.map((item: number) => (
            <IntersectionAnimate key={item} animation="scaleIn">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">Card {item}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This is a sample card with smooth animations.
                </p>
                <button
                  onClick={handleAction}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Take Action
                </button>
              </div>
            </IntersectionAnimate>
          ))}
        </StaggerChildren>
      </div>
    </div>
  );
}

// =============================================================================
// Export all examples
// =============================================================================

export default function IntegrationExamplesPage() {
  const [activeExample, setActiveExample] = React.useState('article-list');

  const examples = {
    'article-list': { component: ArticleListExample, name: 'Article List' },
    'form': { component: FormExample, name: 'Form Submission' },
    'stats': { component: DashboardStatsExample, name: 'Dashboard Stats' },
    'data-fetch': { component: DataFetchExample, name: 'Data Fetching' },
    'alerts': { component: AlertsExample, name: 'Alert Messages' },
    'loading': { component: LoadingStatesExample, name: 'Loading States' },
    'complete': { component: CompletePageExample, name: 'Complete Page' },
  };

  const ActiveComponent = examples[activeExample as keyof typeof examples].component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2">UI Components Integration Examples</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Practical examples of how to use the new UI polish components
        </p>

        {/* Example selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(examples).map(([key, { name }]) => (
            <button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeExample === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Active example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}

