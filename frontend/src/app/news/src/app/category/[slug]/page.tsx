import { fetchArticles, fetchCategories, Article } from '@/lib/api';

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

export default async function CategoryPage({ params }: Props) {
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === params.slug);

  let articles: Article[] = [];
  try {
    articles = await fetchArticles({
      limit: 30,
      categoryId: category?.id,
    });
  } catch {
    // ok
  }

  const categoryName = category?.name || params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <a href="/" className="hover:text-primary-400 transition-colors">Home</a>
          <span>/</span>
          <span className="text-gray-400">{categoryName}</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white">{categoryName}</h1>
        <p className="text-gray-400 mt-2">Latest {categoryName.toLowerCase()} news and updates from the African crypto market.</p>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-dark-800">
          <a
            href="/"
            className="px-4 py-2 text-sm rounded-lg bg-dark-800 text-gray-400 hover:text-white transition-colors"
          >
            All
          </a>
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                cat.slug === params.slug
                  ? 'bg-primary-500/20 text-primary-400 font-medium'
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <a key={article.id} href={`/article/${article.slug}`} className="group block">
              <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-dark-700 transition-all">
                {article.featuredImageUrl ? (
                  <img
                    src={article.featuredImageUrl}
                    alt={article.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                    <span className="text-3xl">📰</span>
                  </div>
                )}
                <div className="p-4">
                  {article.Category && (
                    <span className="text-xs text-primary-400 font-medium">{article.Category.name}</span>
                  )}
                  <h2 className="text-base font-semibold text-white mt-1 line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    {article.User && <span>{article.User.firstName || article.User.username}</span>}
                    {article.publishedAt && (
                      <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    )}
                    <span>{article.readingTimeMinutes || 3} min</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No articles in this category yet.</p>
          <a href="/" className="text-primary-400 hover:text-primary-300 text-sm mt-3 inline-block">
            ← Back to Home
          </a>
        </div>
      )}
    </div>
  );
}
