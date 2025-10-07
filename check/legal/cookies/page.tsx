import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | CoinDaily',
  description: 'Learn about our cookie usage and how to manage your preferences.',
  robots: 'index, follow',
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Cookie Policy</h1>
        <p className="text-gray-600">Effective Date: July 31, 2025</p>

        <p>
          This Cookie Policy explains how CoinDaily (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) uses cookies and similar 
          tracking technologies on our website and services to collect and store information.
        </p>

        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files placed on your device when you visit websites. 
          They help remember your preferences and improve your experience.
        </p>

        <h2>2. Types of Cookies We Use</h2>
        <ul>
          <li><strong>Essential Cookies</strong>: Required for core site functionality (e.g., login sessions).</li>
          <li><strong>Performance Cookies</strong>: Collect anonymous analytics data (e.g., Google Analytics).</li>
          <li><strong>Functional Cookies</strong>: Remember user preferences (e.g., language settings).</li>
          <li><strong>Advertising & Affiliate Cookies</strong>: Track clicks on affiliate links and ad impressions.</li>
        </ul>

        <h2>3. Third-Party Cookies</h2>
        <p>
          Our site may include cookies from third-party services (e.g., Cloudflare, Google Analytics, 
          affiliate networks) in compliance with GDPR, NDPR, and CCPA.
        </p>

        <h2>4. Your Choices</h2>
        <ul>
          <li><strong>Browser Settings</strong>: You can block or delete cookies via browser settings (Chrome, Firefox, Safari, Edge).</li>
          <li><strong>Opt-Out Links</strong>: Use tools like Google Analytics Opt-out: https://tools.google.com/dlpage/gaoptout</li>
        </ul>

        <h2>5. Consent</h2>
        <p>
          By using our site, you consent to our use of cookies as described in this policy. 
          You may withdraw consent at any time via browser settings.
        </p>

        <h2>6. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy periodically. Continued use indicates acceptance of any changes.
        </p>

        <h2>7. Contact</h2>
        <p>
          Email{' '}
          <a href="mailto:privacy@coindaily.com" className="text-blue-600 hover:text-blue-800">
            privacy@coindaily.com
          </a>{' '}
          for questions about this policy.
        </p>
      </div>
    </div>
  );
}
