import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CoinDaily',
  description: 'Our privacy policy explaining how we collect, use, and protect your personal data.',
  robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Privacy Policy</h1>
        <p className="text-gray-600">Effective Date: July 31, 2025</p>

        <p>
          CoinDaily (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, store, and share your personal data 
          when you use our website, mobile applications, and services (collectively, the &ldquo;Service&rdquo;).
        </p>

        <h2>1. Scope & Jurisdiction</h2>
        <ul>
          <li><strong>United States</strong>: We comply with federal and state laws, including the California Consumer Privacy Act (CCPA).</li>
          <li><strong>Nigeria</strong>: We comply with the Nigeria Data Protection Regulation (NDPR).</li>
        </ul>

        <h2>2. Data We Collect</h2>
        <ol>
          <li><strong>Account Information</strong>: Name, email, username.</li>
          <li><strong>Usage Data</strong>: Pages viewed, IP address, device information, browser type.</li>
          <li><strong>Cookies & Tracking</strong>: See <a href="/legal/cookies" className="text-blue-600 hover:text-blue-800">Cookie Policy</a> for details.</li>
          <li><strong>Third-Party Data</strong>: OAuth provider profile data when you sign in.</li>
        </ol>

        <h2>3. How We Use Your Data</h2>
        <ul>
          <li><strong>To Provide & Improve Services</strong>: Personalization, analytics, security.</li>
          <li><strong>Communications</strong>: Newsletters, service announcements, marketing (opt-out available).</li>
          <li><strong>Legal Compliance</strong>: Fraud prevention, age verification, regulatory requirements.</li>
        </ul>

        <h2>4. Data Sharing</h2>
        <ul>
          <li><strong>Service Providers</strong>: Hosting, analytics, email delivery, and customer support vendors.</li>
          <li><strong>Affiliates & Partners</strong>: For fulfillment of affiliate programs (<a href="/legal/affiliate-disclosure" className="text-blue-600 hover:text-blue-800">Affiliate Disclosure</a>).</li>
          <li><strong>Legal Requests</strong>: When required by law, court order, or governmental request.</li>
        </ul>

        <h2>5. Your Rights</h2>
        <ul>
          <li><strong>Access & Portability</strong>: Request copy of data.</li>
          <li><strong>Correction & Deletion</strong>: Update or delete your personal data.</li>
          <li><strong>Opt-Out</strong>: Marketing emails and tracking cookies.</li>
          <li><strong>Do Not Sell My Info</strong> (CCPA): Submit a request via support@coindaily.com.</li>
        </ul>

        <h2>6. Data Security</h2>
        <p>
          We implement industry-standard measures (encryption, access controls) to protect your data. 
          In case of a breach, see <a href="/legal/security" className="text-blue-600 hover:text-blue-800">Security & Breach Notification Policy</a>.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain personal data for as long as necessary to fulfill the purposes outlined in this 
          policy or as required by law.
        </p>

        <h2>8. Children&rsquo;s Privacy</h2>
        <p>
          Our Service is not directed to children under 16 (Nigeria) or under 13 (US COPPA). 
          We do not knowingly collect data from minors.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this policy. You will be notified via email or site banner. 
          Continued use after changes implies acceptance.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          Email{' '}
          <a href="mailto:privacy@coindaily.com" className="text-blue-600 hover:text-blue-800">
            privacy@coindaily.com
          </a>
        </p>
      </div>
    </div>
  );
}
