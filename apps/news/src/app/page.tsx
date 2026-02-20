import { fetchArticles, fetchCategories, Article } from '@/lib/api';
import NewsletterForm from './components/NewsletterForm';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  let articles: Article[] = [];
  let categories: { id: string; name: string; slug: string }[] = [];

  try {
    [articles, categories] = await Promise.all([
      fetchArticles({ limit: 20 }),
      fetchCategories(),
    ]);
  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
  }

  const featured = articles[0];
  const latest = articles.slice(1, 7);
  const more = articles.slice(7);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Featured Article */}
      {featured ? (
        <section className="mb-10">
          <a href={`/article/${featured.slug}`} className="group block">
            <div className="relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-700">
              {featured.featuredImageUrl ? (
                <img
                  src={featured.featuredImageUrl}
                  alt={featured.title}
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-[400px] bg-gradient-to-br from-primary-500/20 to-dark-800 flex items-center justify-center">
                  <span className="text-6xl">📰</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                {featured.Category && (
                  <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full mb-3">
                    {featured.Category.name}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
                  {featured.title}
                </h1>
                <p className="text-gray-300 text-lg max-w-2xl line-clamp-2">{featured.excerpt}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  {featured.User && (
                    <span>By {featured.User.firstName || featured.User.username}</span>
                  )}
                  {featured.publishedAt && (
                    <span>{new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  )}
                  <span>{featured.readingTimeMinutes || 3} min read</span>
                </div>
              </div>
            </div>
          </a>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl bg-dark-800 border border-dark-700 p-12 text-center">
          <h2 className="text-2xl font-display font-bold text-white mb-3">Welcome to CoinDaily</h2>
          <p className="text-gray-400">Africa&apos;s premier cryptocurrency news platform. Articles coming soon.</p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Latest News */}
          {latest.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary-400 rounded-full" />
                Latest News
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {latest.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {/* More Articles */}
          {more.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary-400 rounded-full" />
                More Stories
              </h2>
              <div className="space-y-4">
                {more.map((article) => (
                  <ArticleRow key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {articles.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No articles published yet.</p>
              <p className="text-gray-600 text-sm mt-2">Content will appear here once articles are published via the admin panel.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="px-3 py-1.5 bg-dark-800 hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 text-sm rounded-lg transition-colors"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">African Exchanges</h3>
            <div className="space-y-3">
              {[
                { name: 'Luno', region: 'South Africa, Nigeria', url: 'https://www.luno.com' },
                { name: 'Quidax', region: 'Nigeria', url: 'https://www.quidax.com' },
                { name: 'Valr', region: 'South Africa', url: 'https://www.valr.com' },
                { name: 'BuyCoins', region: 'Nigeria', url: 'https://buycoins.africa' },
              ].map((exchange) => (
                <a
                  key={exchange.name}
                  href={exchange.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-dark-800 transition-colors group"
                >
                  <div>
                    <p className="text-sm text-white group-hover:text-primary-400 transition-colors">{exchange.name}</p>
                    <p className="text-xs text-gray-500">{exchange.region}</p>
                  </div>
                  <span className="text-gray-600 group-hover:text-gray-400">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-gradient-to-br from-primary-500/10 to-dark-900 border border-primary-500/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Stay Updated</h3>
            <p className="text-xs text-gray-400 mb-4">Get the latest African crypto news delivered to your inbox.</p>
            <NewsletterForm />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <a href={`/article/${article.slug}`} className="group block">
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-dark-700 transition-all">
        {article.featuredImageUrl ? (
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
            <span className="text-3xl">📰</span>
          </div>
        )}
        <div className="p-4">
          {article.Category && (
            <span className="text-xs text-primary-400 font-medium">{article.Category.name}</span>
          )}
          <h3 className="text-base font-semibold text-white mt-1 line-clamp-2 group-hover:text-primary-400 transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">{article.excerpt}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {article.publishedAt && (
              <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
            <span>{article.readingTimeMinutes || 3} min</span>
            <span>{article.viewCount || 0} views</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function ArticleRow({ article }: { article: Article }) {
  return (
    <a href={`/article/${article.slug}`} className="group flex gap-4 p-3 rounded-xl hover:bg-dark-900/50 transition-colors">
      {article.featuredImageUrl ? (
        <img
          src={article.featuredImageUrl}
          alt={article.title}
          className="w-24 h-20 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-24 h-20 bg-dark-800 rounded-lg shrink-0 flex items-center justify-center">
          <span className="text-xl">📰</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {article.Category && (
          <span className="text-xs text-primary-400 font-medium">{article.Category.name}</span>
        )}
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {article.publishedAt && (
            <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          )}
          <span>{article.viewCount || 0} views</span>
        </div>
      </div>
    </a>
  );
}
