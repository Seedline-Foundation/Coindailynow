import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal | CoinDaily',
  description: 'All legal documents, policies, and terms governing CoinDaily platform.',
  robots: 'index, follow',
};

export default function LegalIndexPage() {
  const legalDocs = [
    {
      title: 'Terms of Service',
      href: '/legal/terms',
      description: 'Terms and conditions governing your use of CoinDaily.'
    },
    {
      title: 'Privacy Policy',
      href: '/legal/privacy',
      description: 'How we collect, use, and protect your personal data.'
    },
    {
      title: 'Cookie Policy',
      href: '/legal/cookies',
      description: 'Information about our cookie usage and your choices.'
    },
    {
      title: 'Affiliate Disclosure',
      href: '/legal/affiliate-disclosure',
      description: 'Transparency about our affiliate partnerships.'
    },
    {
      title: 'Disclaimer & No Financial Advice',
      href: '/legal/disclaimer',
      description: 'Important disclaimers about our content and services.'
    },
    {
      title: 'Risk Disclosure',
      href: '/legal/risk',
      description: 'Understanding the risks of cryptocurrency investments.'
    },
    {
      title: 'Intellectual Property',
      href: '/legal/intellectual-property',
      description: 'Copyright and trademark information.'
    },
    {
      title: 'User Content Policy',
      href: '/legal/user-content',
      description: 'Guidelines for user-generated content.'
    },
    {
      title: 'DMCA Policy',
      href: '/legal/dmca',
      description: 'Copyright infringement and takedown procedures.'
    },
    {
      title: 'Security & Breach Notification',
      href: '/legal/security',
      description: 'Our security measures and breach notification procedures.'
    },
    {
      title: 'AML & KYC Disclaimer',
      href: '/legal/aml-kyc',
      description: 'Anti-money laundering and know-your-customer compliance.'
    },
    {
      title: 'Accessibility Statement',
      href: '/legal/accessibility',
      description: 'Our commitment to digital accessibility.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Legal Documents</h1>
        <p className="text-gray-600">
          All policies and legal documents governing your use of CoinDaily platform and services.
        </p>

        <div className="grid gap-6 mt-8">
          {legalDocs.map((doc) => (
            <div key={doc.href} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                <a href={doc.href} className="text-blue-600 hover:text-blue-800 no-underline">
                  {doc.title}
                </a>
              </h3>
              <p className="text-gray-600 mb-0">{doc.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 p-6 rounded-lg">
          <h2>Contact Information</h2>
          <p>
            For questions about any of these legal documents, please contact us:
          </p>
          <ul>
            <li>General Legal: <a href="mailto:legal@coindaily.com" className="text-blue-600 hover:text-blue-800">legal@coindaily.com</a></li>
            <li>Privacy: <a href="mailto:privacy@coindaily.com" className="text-blue-600 hover:text-blue-800">privacy@coindaily.com</a></li>
            <li>DMCA: <a href="mailto:dmca@coindaily.com" className="text-blue-600 hover:text-blue-800">dmca@coindaily.com</a></li>
            <li>Security: <a href="mailto:security@coindaily.com" className="text-blue-600 hover:text-blue-800">security@coindaily.com</a></li>
            <li>Accessibility: <a href="mailto:accessibility@coindaily.com" className="text-blue-600 hover:text-blue-800">accessibility@coindaily.com</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
