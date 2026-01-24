import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | CoinDaily',
  description: 'Transparency about our affiliate partnerships and commission structures.',
  robots: 'index, follow',
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Affiliate Disclosure</h1>
        <p className="text-gray-600">Effective Date: July 31, 2025</p>

        <p>
          At CoinDaily, we participate in affiliate advertising programs designed to provide 
          a means for us to earn fees by linking to third-party products and services at 
          no additional cost to you.
        </p>

        <h2>1. Nature of Affiliate Links</h2>
        <ul>
          <li>When you click on an affiliate link and complete a qualifying purchase, CoinDaily may earn a commission or referral fee.</li>
          <li>This does not affect the price you pay for the product or service.</li>
        </ul>

        <h2>2. Transparency & Trust</h2>
        <ul>
          <li>All affiliate links will be clearly labeled with a disclaimer such as &ldquo;(Affiliate Link)&rdquo; or &ldquo;Sponsored.&rdquo;</li>
          <li>We only promote products and services that we have vetted for quality and reliability.</li>
        </ul>

        <h2>3. Applicable Regulations</h2>
        <ul>
          <li><strong>Nigeria</strong>: Compliant with Consumer Protection Guidance by the Advertising Practitioners Council of Nigeria (APCON).</li>
          <li><strong>United States</strong>: Compliant with Federal Trade Commission (FTC) endorsement guidelines.</li>
        </ul>

        <h2>4. Independent Reviews</h2>
        <p>
          Our editorial team retains full control over content; affiliate partnerships do not 
          influence editorial integrity or opinions.
        </p>

        <h2>5. Contact</h2>
        <p>
          Email{' '}
          <a href="mailto:legal@coindaily.com" className="text-blue-600 hover:text-blue-800">
            legal@coindaily.com
          </a>{' '}
          for questions regarding our affiliate relationships.
        </p>
      </div>
    </div>
  );
}
