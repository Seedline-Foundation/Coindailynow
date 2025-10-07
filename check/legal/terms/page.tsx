import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CoinDaily',
  description: 'Terms of Service governing your use of CoinDaily platform and services.',
  robots: 'index, follow',
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Terms of Service</h1>
        <p className="text-gray-600">Effective Date: July 31, 2025</p>

        <p>
          Welcome to CoinDaily (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern 
          your access to and use of our website, mobile applications, and services 
          (collectively, the &ldquo;Service&rdquo;). By accessing or using the Service, you agree to 
          be bound by these Terms.
        </p>

        <h2>1. Eligibility</h2>
        <p>
          You must be at least 18 years old or the age of majority in your jurisdiction. 
          If you are accessing the Service from Nigeria, you additionally agree to comply 
          with the Nigeria Data Protection Regulation (NDPR). If you are accessing from 
          the United States, you agree to comply with applicable federal and state laws, 
          including the California Consumer Privacy Act (CCPA) where applicable.
        </p>

        <h2>2. Account Registration</h2>
        <ul>
          <li>You may register with a valid email address or social login.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>Notify us immediately of any unauthorized use.</li>
        </ul>

        <h2>3. Acceptable Use</h2>
        <ul>
          <li>You agree not to use the Service for illegal activities, including money laundering, terrorism financing, or fraudulent schemes.</li>
          <li>Prohibitions include: hacking, spamming, distributing malware, or infringing intellectual property rights.</li>
        </ul>

        <h2>4. Affiliate Links & Disclosures</h2>
        <p>
          The Service contains affiliate links. We may earn commissions from qualifying purchases. 
          See our <a href="/legal/affiliate-disclosure" className="text-blue-600 hover:text-blue-800">Affiliate Disclosure</a> for details.
        </p>

        <h2>5. Content</h2>
        <p>
          All articles, analyses, and multimedia are provided &ldquo;as is&rdquo; without warranty. 
          For legal disclaimers, see our{' '}
          <a href="/legal/disclaimer" className="text-blue-600 hover:text-blue-800">
            Disclaimer & No Financial Advice
          </a>.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content, logos, trademarks, and software are owned by CoinDaily or our licensors. 
          Unauthorized use is prohibited. See{' '}
          <a href="/legal/intellectual-property" className="text-blue-600 hover:text-blue-800">
            Intellectual Property Notice
          </a>{' '}
          for details.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, we disclaim all liability for any indirect, 
          special, or consequential damages arising out of your use of the Service.
        </p>

        <h2>8. Governing Law & Dispute Resolution</h2>
        <ul>
          <li>Nigeria users: governed by the laws of the Federal Republic of Nigeria.</li>
          <li>US users: governed by the laws of the State of Delaware, USA.</li>
          <li>Any dispute will be resolved by binding arbitration in Lagos, Nigeria or Wilmington, Delaware, unless otherwise mutually agreed.</li>
        </ul>

        <h2>9. Modifications</h2>
        <p>
          We may update these Terms at any time. Continued use of the Service constitutes 
          acceptance of the updated Terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions or notices, email{' '}
          <a href="mailto:legal@coindaily.com" className="text-blue-600 hover:text-blue-800">
            legal@coindaily.com
          </a>.
        </p>
      </div>
    </div>
  );
}
