import { Header } from '@/components/landing';
import Footer from '@/components/footer/Footer';
import { HomePageSkeleton, NewsListSkeleton, ArticlePageSkeleton } from './InstantSkeleton';

type Variant = 'home' | 'news' | 'article' | 'minimal';

export function PageLoadingShell({ variant = 'minimal' }: { variant?: Variant }) {
  const body =
    variant === 'home' ? (
      <HomePageSkeleton />
    ) : variant === 'news' ? (
      <NewsListSkeleton />
    ) : variant === 'article' ? (
      <ArticlePageSkeleton />
    ) : (
      <NewsListSkeleton />
    );

  if (variant === 'minimal') {
    return <div className="min-h-[60vh] bg-gray-50">{body}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto">{body}</div>
      <Footer />
    </div>
  );
}
