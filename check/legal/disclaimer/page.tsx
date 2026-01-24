import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer & No Financial Advice | CoinDaily',
  description: 'Important disclaimers about our content and services. Not financial advice.',
  robots: 'index, follow',
};

export default function DisclaimerPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Disclaimer & No Financial Advice</h1>
        <p className="text-gray-600">Effective Date: July 31, 2025</p>

        <p>
          The information provided by CoinDaily (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) on our website and services 
          is for general informational purposes only. All content, including text, graphics, 
          images, and videos, is provided &ldquo;as is&rdquo; without any warranty of any kind.
        </p>

        <h2>Key Points</h2>
        <ul>
          <li>We are not a registered financial advisor, broker, or investment service.</li>
          <li>Content is not tailored to your individual financial situation.</li>
          <li>You should conduct your own research and consult with a qualified financial advisor before making any investment decisions.</li>
          <li>We do not guarantee the accuracy, completeness, or timeliness of the information provided.</li>
        </ul>

        <h2>Jurisdiction Requirements</h2>
        <ul>
          <li><strong>Nigeria</strong>: Compliant with the Investment and Securities Act, 2007 disclosure standards.</li>
          <li><strong>United States</strong>: Compliant with SEC regulations (17 CFR § 240.10b-5) regarding disclaimers.</li>
        </ul>

        <h2>Contact</h2>
        <p>
          For further clarifications, email{' '}
          <a href="mailto:legal@coindaily.com" className="text-blue-600 hover:text-blue-800">
            legal@coindaily.com
          </a>.
        </p>
      </div>
    </div>
  );
}
