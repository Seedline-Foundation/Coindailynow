import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';
import { Header } from '@/components/landing';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editorial Standards | CoinDaily Africa',
  description:
    'Our commitment to accuracy, independence, and transparency in cryptocurrency and financial market reporting across Africa.',
  openGraph: {
    title: 'Editorial Standards — CoinDaily Africa',
    description:
      'How we maintain accuracy, editorial independence, and responsible AI-assisted journalism.',
    type: 'website',
  },
};

export default function EditorialStandardsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Editorial Standards',
    description:
      'CoinDaily Africa editorial standards covering accuracy, sourcing, AI transparency, tone policy, and corrections.',
    publisher: {
      '@type': 'Organization',
      name: 'CoinDaily Africa',
      url: 'https://coindaily.online',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editorial Standards</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: May 14, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-8">
              <p className="text-blue-800 font-medium">
                CoinDaily Africa is committed to accuracy, independence, and transparency in all of our reporting.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Editorial Independence</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa maintains strict separation between editorial content and business operations. Our editorial team operates independently from advertising, sponsored content, and partnership teams. No advertiser, sponsor, or commercial partner has influence over our editorial decisions, story selection, or reporting angle.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                Sponsored content and paid press releases are clearly labeled and visually distinguished from editorial content. They are never presented as independent journalism.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Accuracy and Sourcing</h2>
              <p className="text-gray-600 leading-relaxed">
                We require attribution for all factual claims. Market data is sourced from verified exchange APIs and aggregators. Regulatory information is drawn from official government and central bank publications. Where possible, we seek multiple independent sources before publishing.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                When we report on-chain data, we cite the specific blockchain explorer, analytics platform, or data provider. When we report regulatory developments, we link to the original gazette, circular, or official statement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">AI-Assisted Content</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa uses artificial intelligence to assist in research, content drafting, and translation. Our AI systems are trained to produce factual, neutral, data-driven content consistent with institutional financial journalism standards. All AI-generated content undergoes human editorial review before publication.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                AI-generated content is identified as such where appropriate. Our AI systems are explicitly instructed to avoid sensationalist language, unsupported predictions, and financial advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Tone and Language Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa follows a strict editorial tone policy. Our content must be confident, neutral, and data-driven. We explicitly prohibit the following language in all editorial content:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-3">
                <li>Hype terms: &quot;moon,&quot; &quot;mooning,&quot; &quot;rocket,&quot; &quot;skyrocket,&quot; &quot;gem,&quot; &quot;100x&quot;</li>
                <li>Fear terms: &quot;crash,&quot; &quot;plunge,&quot; &quot;doom,&quot; &quot;bloodbath&quot;</li>
                <li>Crypto slang: &quot;WAGMI,&quot; &quot;NGMI,&quot; &quot;diamond hands,&quot; &quot;pump,&quot; &quot;dump,&quot; &quot;shill,&quot; &quot;FUD,&quot; &quot;hopium&quot;</li>
                <li>Unsubstantiated claims: &quot;guaranteed returns,&quot; &quot;next Bitcoin,&quot; &quot;can&#39;t lose&quot;</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Our editorial voice is modeled on institutional financial news services. We report facts, cite data, and provide context. We do not tell readers what to buy or sell.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Africa-First Framing</h2>
              <p className="text-gray-600 leading-relaxed">
                Every story on CoinDaily Africa is framed through the lens of African readers. Global events are contextualized for their impact on African markets, currencies, regulations, and consumers. A U.S. Federal Reserve interest rate decision is reported through its effect on the naira, rand, and shilling. A Bitcoin price movement is analyzed through the lens of African exchange volumes and P2P premiums.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Corrections Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We correct errors promptly and transparently. When a factual error is identified in published content, we issue a correction at the top of the article noting what was changed and when. Material corrections are logged and tracked.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                To report an error or request a correction, contact{' '}
                <a href="mailto:corrections@coindaily.online" className="text-blue-600 hover:underline">
                  corrections@coindaily.online
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Conflict of Interest Disclosure</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa and its editorial staff disclose any material financial interests in the assets, companies, or projects they cover. Staff members are prohibited from trading on information obtained through their editorial work before publication. When staff hold positions in assets covered by the platform, those positions are disclosed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Translation Quality</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa publishes content in multiple languages including English, Hausa, Yoruba, Swahili, and Zulu. Translations are produced using self-hosted NLLB-200 machine translation models and reviewed for accuracy. We continuously improve translation quality based on native-speaker feedback.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Not Financial Advice</h2>
              <p className="text-gray-600 leading-relaxed">
                Nothing published on CoinDaily Africa constitutes financial, investment, legal, or tax advice. Our content is for informational purposes only. Readers should consult qualified professionals before making financial decisions. See our{' '}
                <Link href="/disclaimer" className="text-blue-600 hover:underline">
                  full disclaimer
                </Link>{' '}
                for details.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/about" className="text-blue-600 hover:underline text-sm">
              &larr; About CoinDaily Africa
            </Link>
            <Link href="/disclaimer" className="text-blue-600 hover:underline text-sm">
              Disclaimer &rarr;
            </Link>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
