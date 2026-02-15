import Link from 'next/link';
import { Megaphone, ArrowLeft } from 'lucide-react';

export default function CookiesPage() {
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

        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-dark-500 text-sm mb-10">Last updated: February 13, 2026</p>

        <div className="prose-dark space-y-8 text-dark-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit our platform. They help us provide a better experience by remembering your preferences and session information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Essential Cookies</h2>
            <p>These cookies are required for the platform to function and cannot be disabled. They include: session authentication tokens, CSRF protection tokens, and wallet connection state. These do not track your activity for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Analytics Cookies</h2>
            <p>With your consent, we use analytics cookies to understand how users interact with SENDPRESS. This data helps us improve features and performance. We use self-hosted analytics tools and do not share analytics data with third-party advertisers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Managing Cookies</h2>
            <p>You can manage cookie preferences through your browser settings. Note that disabling essential cookies may prevent the platform from functioning correctly. For questions, contact <a href="mailto:privacy@coindaily.online" className="text-primary-500 hover:text-primary-400">privacy@coindaily.online</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
