import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';
import { Header } from '@/components/landing';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | CoinDaily Africa — Crypto & Finance News',
  description:
    'Frequently asked questions about CoinDaily Africa: how we report crypto news, our coverage of African markets, AI-assisted journalism, and how to use the platform.',
  openGraph: {
    title: 'FAQ — CoinDaily Africa',
    description:
      'Answers to common questions about CoinDaily Africa, our coverage, and the platform.',
    type: 'website',
  },
};

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Platform
  {
    category: 'Platform',
    question: 'What is CoinDaily Africa?',
    answer:
      'CoinDaily Africa is an independent financial news platform covering cryptocurrency, blockchain, and traditional finance across Africa and the global diaspora. We provide real-time market data, regulatory analysis, and actionable intelligence for readers in Nigeria, Kenya, South Africa, Ghana, and beyond.',
  },
  {
    category: 'Platform',
    question: 'Is CoinDaily Africa free to use?',
    answer:
      'Yes. Core news, market data, and regulatory coverage are free. CoinDaily Pro subscribers get access to premium features including deeper market analysis, portfolio tracking, and data exports. See our pricing page for details.',
  },
  {
    category: 'Platform',
    question: 'Which countries does CoinDaily Africa cover?',
    answer:
      'We primarily cover Nigeria, Kenya, South Africa, and Ghana, with expanding coverage across Tanzania, Ethiopia, Egypt, and other African markets. We also serve the African diaspora in Europe, North America, the Caribbean, and Latin America. Our country switcher lets you filter news by region.',
  },
  {
    category: 'Platform',
    question: 'What languages is CoinDaily Africa available in?',
    answer:
      'CoinDaily Africa publishes in English, Hausa, Yoruba, Swahili, and Zulu. Translations are produced using self-hosted NLLB-200 machine translation models and reviewed for accuracy. We are continuously adding more African languages.',
  },

  // Content & Editorial
  {
    category: 'Content & Editorial',
    question: 'Does CoinDaily Africa use AI to write articles?',
    answer:
      'We use AI to assist with research, drafting, and translation. All AI-generated content is reviewed by human editors before publication. Our AI systems follow strict editorial guidelines that prohibit sensationalist language, unsupported predictions, and financial advice. Read our Editorial Standards page for full details.',
  },
  {
    category: 'Content & Editorial',
    question: 'Does CoinDaily Africa provide financial advice?',
    answer:
      'No. CoinDaily Africa provides financial news and market data for informational purposes only. Nothing on our platform constitutes financial, investment, legal, or tax advice. Always consult a qualified professional before making financial decisions.',
  },
  {
    category: 'Content & Editorial',
    question: 'How do you ensure accuracy in your reporting?',
    answer:
      'We require attribution for all factual claims. Market data comes from verified exchange APIs. Regulatory information is sourced from official government publications. We cite specific blockchain explorers for on-chain data. When errors are found, we issue corrections transparently at the top of the affected article.',
  },
  {
    category: 'Content & Editorial',
    question: 'How do I report an error or request a correction?',
    answer:
      'Contact corrections@coindaily.online with the article URL and a description of the error. We review and correct factual errors promptly, with a transparent correction notice added to the article.',
  },

  // Markets & Data
  {
    category: 'Markets & Data',
    question: 'Where does CoinDaily Africa get its market data?',
    answer:
      'Crypto prices come from exchange APIs including Binance, Luno, Quidax, and YellowCard. African equity indices (NGX, JSE, NSE) come from exchange feeds. FX rates are sourced from central bank published rates and P2P market midpoints. All data sources are attributed in our ticker bar and market pages.',
  },
  {
    category: 'Markets & Data',
    question: 'How often is market data updated?',
    answer:
      'Our homepage ticker bar refreshes crypto prices every 60 seconds. FX rates and equity indices update during market hours. Breaking news is published as events occur. Article content is refreshed based on the news cycle.',
  },
  {
    category: 'Markets & Data',
    question: 'What is the regulatory map?',
    answer:
      'Our regulatory map tracks cryptocurrency and digital asset regulations across African countries. It includes licensing frameworks, key regulatory events, compliance requirements, and official guidance from bodies like the SEC Nigeria, CMA Kenya, FSCA South Africa, and SEC Ghana.',
  },

  // Press & Business
  {
    category: 'Press & Business',
    question: 'How can I submit a press release?',
    answer:
      'Use our press wire service at press.coindaily.online to submit press releases for distribution. Releases are reviewed by editors before publication and distributed to our readership via the website, newsletter, and RSS feeds.',
  },
  {
    category: 'Press & Business',
    question: 'Does CoinDaily Africa accept advertising?',
    answer:
      'Yes, we accept display advertising and sponsored content from vetted partners. All sponsored content is clearly labeled and separated from editorial content. We maintain a strict firewall between advertising and editorial. Contact editorial@coindaily.online for advertising inquiries.',
  },
  {
    category: 'Press & Business',
    question: 'How do I contact CoinDaily Africa?',
    answer:
      'For press inquiries and partnerships: editorial@coindaily.online. For corrections: corrections@coindaily.online. For technical issues: support@coindaily.online.',
  },
];

const CATEGORIES = [...new Set(FAQ_DATA.map((f) => f.category))];

export default function FAQPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">
            Everything you need to know about CoinDaily Africa.
          </p>

          {/* Category nav */}
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`#${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
              >
                {cat}
              </a>
            ))}
          </div>

          {CATEGORIES.map((category) => (
            <section
              key={category}
              id={category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
              className="mb-10"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {category}
              </h2>
              <div className="space-y-6">
                {FAQ_DATA.filter((f) => f.category === category).map((faq, i) => (
                  <div key={i}>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-4">
              Still have questions? Reach out to{' '}
              <a
                href="mailto:editorial@coindaily.online"
                className="text-blue-600 hover:underline"
              >
                editorial@coindaily.online
              </a>.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/about" className="text-blue-600 hover:underline text-sm">
                About Us &rarr;
              </Link>
              <Link href="/editorial-standards" className="text-blue-600 hover:underline text-sm">
                Editorial Standards &rarr;
              </Link>
              <Link href="/" className="text-blue-600 hover:underline text-sm">
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
