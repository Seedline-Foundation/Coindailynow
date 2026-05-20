import Link from 'next/link';
import { listProducts, type MarketplaceProduct } from '@/lib/marketplaceApi';

export const metadata = {
  title: 'Marketplace · CoinDaily',
  description: 'Buy reports, courses, datasets, and templates from African crypto creators.',
};

export const revalidate = 60;

const KIND_LABEL: Record<string, string> = {
  ARTICLE_BUNDLE: 'Article bundle',
  COURSE: 'Course',
  TEMPLATE: 'Template',
  REPORT: 'Report',
  DATASET: 'Dataset',
  WEBINAR: 'Webinar',
  OTHER: 'Other',
};

export default async function MarketplaceIndex() {
  let items: MarketplaceProduct[] = [];
  let total = 0;
  try {
    const r = await listProducts({ limit: 24 });
    items = r.items;
    total = r.total;
  } catch {
    items = [];
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-[#8b949e] mt-1">
            Reports, courses, templates, and datasets from African crypto creators.{' '}
            {total > 0 && <span>· {total.toLocaleString()} listings</span>}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="border border-[#30363d] rounded-xl p-10 text-center text-[#8b949e]">
            <p>No listings yet — check back soon.</p>
            <p className="text-sm mt-3">
              Are you a creator?{' '}
              <Link href="/marketplace/sell" className="text-[#f97316] underline">
                Open a seller account
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <li
                key={p.id}
                className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-[#f97316] transition-colors"
              >
                <Link href={`/marketplace/${p.slug}`}>
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt={p.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-[#1f2937] to-[#111827] flex items-center justify-center text-[#374151] font-mono text-xs">
                      {KIND_LABEL[p.kind] || p.kind}
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-wider text-[#f97316] mb-1">
                      {KIND_LABEL[p.kind] || p.kind}
                    </p>
                    <h2 className="font-semibold text-white line-clamp-2 leading-snug">{p.title}</h2>
                    <p className="text-sm text-[#8b949e] line-clamp-2 mt-1.5">{p.shortPitch}</p>
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="font-mono text-emerald-400">
                        {Number(p.priceJoy).toLocaleString()} JOY
                      </span>
                      {p.ratingCount > 0 && (
                        <span className="text-[#8b949e]">
                          ★ {p.ratingAvg.toFixed(1)} ({p.ratingCount})
                        </span>
                      )}
                    </div>
                    {p.seller && (
                      <p className="text-xs text-[#6e7681] mt-2">
                        by <span className="text-[#e6edf3]">{p.seller.displayName}</span>
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
