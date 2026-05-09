import { fetchArticle, fetchArticles, Article } from '@/lib/api';
import { notFound } from 'next/navigation';

export const revalidate = 30;

interface Props {
  params: { slug: string };
}

export default async function ArticlePage({ params }: Props) {
  const article = await fetchArticle(params.slug);

  if (!article) {
    notFound();
  }

  // Fetch related articles from the same category
  let related: Article[] = [];
  try {
    related = await fetchArticles({
      limit: 4,
      categoryId: article.Category?.id,
    });
    related = related.filter((a) => a.id !== article.id).slice(0, 3);
  } catch {
    // ok
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-primary-400 transition-colors">Home</a>
        <span>/</span>
        {article.Category && (
          <>
            <a href={`/category/${article.Category.slug}`} className="hover:text-primary-400 transition-colors">
              {article.Category.name}
            </a>
            <span>/</span>
          </>
        )}
        <span className="text-gray-400 truncate">{article.title}</span>
      </div>

      {/* Category badge */}
      {article.Category && (
        <a
          href={`/category/${article.Category.slug}`}
          className="inline-block px-3 py-1 bg-primary-500/10 text-primary-400 text-sm font-medium rounded-full mb-4 hover:bg-primary-500/20 transition-colors"
        >
          {article.Category.name}
        </a>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-4">
        {article.title}
      </h1>

      {/* Excerpt */}
      <p className="text-lg text-gray-400 mb-6 leading-relaxed">{article.excerpt}</p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-dark-800">
        {article.User && (
          <div className="flex items-center gap-2">
            {article.User.avatarUrl ? (
              <img src={article.User.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-semibold">
                {(article.User.firstName?.[0] || article.User.username[0]).toUpperCase()}
              </div>
            )}
            <span className="text-gray-300">
              {article.User.firstName ? `${article.User.firstName} ${article.User.lastName || ''}`.trim() : article.User.username}
            </span>
          </div>
        )}
        {article.publishedAt && (
          <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        )}
        <span>{article.readingTimeMinutes || 3} min read</span>
        <span>{article.viewCount || 0} views</span>
        {article.isPremium && (
          <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded">PREMIUM</span>
        )}
      </div>

      {/* Featured Image */}
      {article.featuredImageUrl && (
        <div className="mb-8 rounded-xl overflow-hidden">
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            className="w-full max-h-[500px] object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-invert prose-lg max-w-none
          prose-headings:font-display prose-headings:text-white
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white
          prose-code:text-primary-300 prose-code:bg-dark-800 prose-code:px-1 prose-code:rounded
          prose-blockquote:border-primary-400 prose-blockquote:text-gray-400
          prose-li:text-gray-300
        "
        dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
      />

      {/* Share / Actions */}
      <div className="flex items-center gap-4 mt-10 pt-8 border-t border-dark-800">
        <span className="text-sm text-gray-500">Share:</span>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`https://coindaily.online/article/${article.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Twitter / X
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://coindaily.online/article/${article.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Facebook
        </a>
      </div>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-display font-bold text-white mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((rel) => (
              <a key={rel.id} href={`/article/${rel.slug}`} className="group block">
                <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-dark-700 transition-all">
                  {rel.featuredImageUrl ? (
                    <img src={rel.featuredImageUrl} alt={rel.title} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-dark-800 flex items-center justify-center">
                      <span className="text-2xl">📰</span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">
                      {rel.publishedAt ? new Date(rel.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

/** Convert plain text content to basic HTML paragraphs */
function formatContent(content: string): string {
  if (!content) return '';
  // If content already has HTML tags, return as-is
  if (content.includes('<p>') || content.includes('<h') || content.includes('<div')) {
    return content;
  }
  // Split by double newlines into paragraphs
  return content
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}
