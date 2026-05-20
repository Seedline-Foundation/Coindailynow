import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/marketplaceApi';

export const revalidate = 30;

export default async function MarketplaceProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/marketplace" className="text-sm text-[#8b949e] hover:text-white">
          ← Back to marketplace
        </Link>

        <article className="mt-6 bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          {product.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.coverImage} alt={product.title} className="w-full h-72 object-cover" />
          )}
          <div className="p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-wider text-[#f97316] mb-2">{product.kind}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{product.title}</h1>
            <p className="text-[#8b949e] mt-2">{product.shortPitch}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="font-mono text-2xl text-emerald-400">
                {Number(product.priceJoy).toLocaleString()} JOY
              </span>
              {product.priceUsd && (
                <span className="text-sm text-[#8b949e]">
                  (~${Number(product.priceUsd).toFixed(2)} USD)
                </span>
              )}
              {product.ratingCount > 0 && (
                <span className="text-sm text-[#e6edf3]">
                  ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount} review
                  {product.ratingCount === 1 ? '' : 's'})
                </span>
              )}
            </div>

            {product.seller && (
              <div className="mt-4 flex items-center gap-3 text-sm text-[#8b949e]">
                {product.seller.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.seller.avatarUrl}
                    alt={product.seller.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  by <span className="text-white font-medium">{product.seller.displayName}</span>
                  {product.seller.ratingCount > 0 && (
                    <span className="ml-2">
                      · seller rating {product.seller.ratingAvg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <Link
              href={`/marketplace/${product.slug}/buy`}
              className="mt-6 inline-block bg-[#f97316] hover:bg-[#fb923c] text-black font-medium px-5 py-2.5 rounded-md text-sm"
            >
              Buy now
            </Link>

            <hr className="my-8 border-[#30363d]" />

            <div className="prose prose-invert max-w-none">
              <h2>About this listing</h2>
              <pre className="whitespace-pre-wrap text-sm text-[#cdd9e5] leading-relaxed font-sans">
                {product.description}
              </pre>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
