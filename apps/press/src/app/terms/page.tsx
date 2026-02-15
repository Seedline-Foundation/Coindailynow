import Link from 'next/link';
import { Megaphone, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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

        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Terms &amp; Conditions</h1>
        <p className="text-dark-500 text-sm mb-10">Last updated: February 13, 2026</p>

        <div className="prose-dark space-y-8 text-dark-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the SENDPRESS platform (&ldquo;Service&rdquo;), operated by CoinDaily Technologies Ltd. (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound by these Terms &amp; Conditions (&ldquo;Terms&rdquo;). If you do not agree to all Terms, do not use the Service. These Terms apply to all users, including Publishers (media buyers) and Partners (site owners).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
            <p>SENDPRESS is an AI-powered press release distribution network that connects media buyers with verified website partners. The Service includes: (a) AI-assisted press release creation via Ollama3; (b) automated distribution to partner sites; (c) AI-powered content verification; (d) blockchain-based payment settlements using JOY tokens on Polygon; (e) escrow-protected transactions via smart contracts.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Registration</h2>
            <p>You must register an account to use the Service. You agree to: (a) provide accurate, current, and complete information; (b) maintain the security of your credentials and wallet; (c) accept responsibility for all activity under your account; (d) notify us immediately of any unauthorized use. You must be at least 18 years old to create an account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. JOY Token Payments &amp; Escrow</h2>
            <p>All transactions on SENDPRESS are denominated in JOY tokens on the Polygon blockchain. By using the Service, you acknowledge: (a) JOY tokens are locked in escrow smart contracts upon campaign creation; (b) escrow funds are released to Partners only after AI verification confirms correct press release placement; (c) transaction fees and gas costs on Polygon are the responsibility of the user; (d) the Company is not responsible for the market value fluctuations of JOY tokens; (e) refunds may be issued in JOY tokens if a placement fails AI verification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Publisher (Media Buyer) Obligations</h2>
            <p>As a Publisher, you agree: (a) all content submitted for distribution is accurate, lawful, and does not infringe third-party rights; (b) you will not submit content promoting scams, unlisted/unverified tokens, phishing, or illegal activities; (c) AI-generated press releases remain your responsibility once published; (d) you accept the AI verification process as the basis for escrow release; (e) campaign budgets are non-refundable once distribution to partner sites has begun, except for failed verifications.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Partner (Site Owner) Obligations</h2>
            <p>As a Partner, you agree: (a) your submitted website must be a legitimate, operational website with real traffic; (b) you will maintain press release placements for the agreed duration (minimum 30 days); (c) you will not artificially inflate traffic, engagement, or Domain Health metrics; (d) you accept that our AI Virus Agent will scan your site regularly for malware, spam, and policy violations; (e) removal of a verified placement before the agreed period may result in JOY clawback from your earnings; (f) the Company reserves the right to suspend or remove partners who violate these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. AI Content &amp; Verification</h2>
            <p>The Service uses AI models (Ollama3, Gemini) for content generation and verification. You acknowledge: (a) AI-generated content may require human review and editing; (b) AI verification is automated and may occasionally produce false positives or negatives; (c) the Company is not liable for AI-generated content errors; (d) the 24/7/365 virus scanning engine operates automatically and may flag or remove content without prior notice if threats are detected.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
            <p>The SENDPRESS platform, including its design, features, AI models, and branding, is owned by CoinDaily Technologies Ltd. Press releases submitted by Publishers remain the property of the Publisher. Partners grant the Company a non-exclusive license to display press releases on their sites for the agreed duration. The Company does not claim ownership of user-submitted content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, the Company shall not be liable for: (a) indirect, incidental, or consequential damages; (b) loss of profits, revenue, or data; (c) blockchain network failures, gas fee spikes, or smart contract vulnerabilities; (d) third-party website downtime or content removal; (e) market value changes of JOY tokens. Our total liability shall not exceed the amount of JOY tokens paid by you in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these Terms, with or without notice. Upon termination: (a) Publisher campaigns in progress will be completed; (b) Partner earnings in escrow will be released upon verification; (c) any locked JOY tokens for unstarted campaigns will be refunded; (d) you forfeit all rights to use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
            <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through binding arbitration in Lagos, Nigeria, or through the courts of competent jurisdiction in Lagos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Material changes will be notified via email and/or dashboard notification at least 14 days before taking effect. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:legal@coindaily.online" className="text-primary-500 hover:text-primary-400">legal@coindaily.online</a> or via our <a href="https://discord.gg/coindaily" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400">Discord Help Center</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
