import Link from 'next/link';
import { Megaphone, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-primary-500" />
            <span className="font-display font-bold text-xl text-white">SENDPRESS</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-dark-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-dark-500 text-sm mb-10">Last updated: February 13, 2026</p>

        <div className="prose-dark space-y-8 text-dark-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>CoinDaily Technologies Ltd. (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the SENDPRESS platform at press.coindaily.online. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By using SENDPRESS, you consent to the practices described herein.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p><strong className="text-white">Account Information:</strong> Name, email address, company name, website URL (for Partners), and wallet address (Polygon).</p>
            <p><strong className="text-white">Usage Data:</strong> Pages visited, features used, campaigns created, distribution history, IP address, browser type, device information, and referring URLs.</p>
            <p><strong className="text-white">Blockchain Data:</strong> Wallet addresses, transaction hashes, JOY token balances, and escrow contract interactions. Note that blockchain transactions are publicly visible by nature.</p>
            <p><strong className="text-white">Content Data:</strong> Press releases submitted or generated via AI, campaign configurations, and partner site position data.</p>
            <p><strong className="text-white">Communication Data:</strong> Support tickets, Discord messages in our help channels, and email correspondence.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p>We use collected information to: (a) provide, operate, and maintain the SENDPRESS platform; (b) process transactions and manage escrow settlements; (c) verify partner site placements via AI crawlers; (d) calculate and display Domain Health (DH) scores; (e) scan partner sites for malware, phishing, and policy violations; (f) generate analytics and reporting dashboards; (g) communicate service updates, security alerts, and marketing (with opt-out); (h) improve our AI models for content quality and verification accuracy; (i) comply with legal obligations and prevent fraudulent activity.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. AI Processing &amp; Content Analysis</h2>
            <p>Our AI systems (Ollama3, Gemini) process press releases for quality assurance, factual accuracy checks, and compliance verification. AI-generated content suggestions are based on your input data. We do not use your press releases to train our AI models without explicit consent. The Virus Agent scans partner sites automatically — site scan data is stored for 30 days for dispute resolution purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing &amp; Disclosure</h2>
            <p>We do <strong className="text-white">not</strong> sell your personal information. We may share data with: (a) partner sites — limited to the press release content and publisher name for display purposes; (b) blockchain networks — transaction data is publicly visible on Polygon; (c) service providers — hosting (Contabo), CDN (Cloudflare), and analytics tools; (d) legal authorities — when required by law, court order, or to protect our rights; (e) in the event of a merger, acquisition, or asset sale.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Security</h2>
            <p>We implement industry-standard security measures: (a) TLS/SSL encryption for all data in transit; (b) AES-256 encryption for sensitive data at rest; (c) JWT-based authentication with refresh tokens; (d) rate limiting and DDoS protection via Cloudflare; (e) regular security audits and penetration testing; (f) smart contract audits for escrow functionality. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data Retention</h2>
            <p>We retain your data as follows: (a) account data — for the duration of your account plus 12 months; (b) transaction data — permanently, as blockchain records are immutable; (c) campaign analytics — 24 months from campaign completion; (d) server logs — 30 days (hot storage) plus 6 months (cold storage); (e) virus scan logs — 30 days; (f) AI-generated content drafts — 90 days unless saved by the user.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to: (a) access, correct, or delete your personal data; (b) object to or restrict data processing; (c) request data portability; (d) withdraw consent for non-essential data processing; (e) lodge a complaint with a data protection authority. To exercise these rights, contact us at <a href="mailto:privacy@coindaily.online" className="text-primary-500 hover:text-primary-400">privacy@coindaily.online</a>. Note that blockchain transaction data cannot be deleted due to the immutable nature of blockchain technology.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Cookies &amp; Tracking</h2>
            <p>We use essential cookies for authentication and session management. We use analytics cookies (with your consent) to understand platform usage. You can manage cookie preferences through your browser settings. We do not use third-party advertising trackers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. International Transfers</h2>
            <p>Your data may be processed on servers located in different jurisdictions. We ensure appropriate safeguards are in place for international data transfers, including standard contractual clauses where applicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Children&apos;s Privacy</h2>
            <p>The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us personal data, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email and/or dashboard notification at least 14 days before the changes take effect. Your continued use of the Service constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact Us</h2>
            <p>For privacy-related inquiries: <a href="mailto:privacy@coindaily.online" className="text-primary-500 hover:text-primary-400">privacy@coindaily.online</a> or via our <a href="https://discord.gg/coindaily" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400">Discord Help Center</a>.</p>
            <p className="mt-2">Data Protection Officer: CoinDaily Technologies Ltd., Lagos, Nigeria.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
