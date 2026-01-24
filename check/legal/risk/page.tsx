import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Disclosure | CoinDaily',
  description: 'Understanding the risks associated with cryptocurrency investments.',
  robots: 'index, follow',
};

export default function RiskDisclosurePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Risk Disclosure</h1>
        <p className="text-gray-600">Effective Date: July 31, 2025</p>

        <p>
          Investing in cryptocurrencies and memecoins involves substantial risk. CoinDaily 
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) provides educational content but does not guarantee investment outcomes.
        </p>

        <h2>Key Risks</h2>
        <ol>
          <li><strong>Volatility</strong>: Prices can swing dramatically due to market sentiment.</li>
          <li><strong>Regulatory Changes</strong>: Governments may impose restrictions or bans.</li>
          <li><strong>Security</strong>: Risk of hacks, scams, and loss of private keys.</li>
          <li><strong>Liquidity</strong>: Some tokens may have low trading volume.</li>
          <li><strong>Project Fundamentals</strong>: Projects may lack viability or team commitment.</li>
        </ol>

        <h2>Location-Specific Notes</h2>
        <ul>
          <li><strong>Nigeria</strong>: Compliant with SEC&rsquo;s guidelines on cryptocurrency education.</li>
          <li><strong>United States</strong>: Compliant with SEC Investor Bulletins and FINRA Notices.</li>
        </ul>

        <p>
          Users must conduct independent due diligence and consult financial professionals.
        </p>
      </div>
    </div>
  );
}
