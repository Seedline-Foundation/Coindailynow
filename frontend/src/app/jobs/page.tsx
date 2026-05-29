'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  experience: string;
  compensation: string;
  description: string;
  requirements: string[];
  perks: string[];
  slots: number | string;
  urgent: boolean;
  category: 'content' | 'tech' | 'leadership';
}

const positions: JobPosition[] = [
  /* ──── Content & Contributor Positions ──── */
  {
    id: 'community-writer',
    title: 'Community Writer',
    department: 'Content',
    type: 'Freelance / Part-time',
    location: 'Remote — Africa-wide',
    experience: 'Entry level',
    compensation: 'Per-article pay + Ad revenue share (You=55%, We=45%)',
    description: 'Write engaging articles about cryptocurrency, DeFi, P2P trading, and blockchain technology from your local African market perspective. Perfect for crypto enthusiasts with a passion for writing.',
    requirements: ['Basic crypto/finance knowledge', 'Good writing skills in English or any African language', 'Active social media presence', 'Passion for African financial education', 'Ability to deliver 2-4 articles per month'],
    perks: ['Published byline on articles', 'CoinDaily author badge', 'Access to community Slack', 'Free CoinDaily Premium', 'AI writing tools access', 'Paid in CoinDaily Token'],
    slots: 'Unlimited',
    urgent: false,
    category: 'content',
  },
  {
    id: 'regional-expert',
    title: 'Regional Expert',
    department: 'Content & Analysis',
    type: 'Part-time / Contract',
    location: 'Remote — Nigeria, Kenya, South Africa, Ghana, or other African countries',
    experience: '2+ years in crypto/finance',
    compensation: 'Monthly retainer + Ad revenue share (55/45) + Course sales (80/20)',
    description: 'Provide deep, expert-level analysis of your regional crypto and finance market. Cover regulatory developments, exchange dynamics, P2P trends, and macroeconomic impact on digital assets.',
    requirements: ['Deep local market knowledge', '3+ published articles or equivalent experience', 'Verified expertise in your region', 'Local language fluency', 'Consistent availability for 4-8 articles/month', 'Understanding of local regulatory landscape'],
    perks: ['Featured author profile', 'Priority editorial calendar', 'Quarterly bonus pool', 'Event speaker invitations', 'Free CoinDaily Premium', 'Course creation rights', 'Paid in CoinDaily Token'],
    slots: 20,
    urgent: true,
    category: 'content',
  },
  {
    id: 'senior-analyst',
    title: 'Senior Market Analyst',
    department: 'Research & Data',
    type: 'Part-time / Full-time',
    location: 'Remote — Africa-wide',
    experience: '5+ years in finance/crypto',
    compensation: 'Monthly retainer + Ad revenue share (55/45) + Premium content revenue split',
    description: 'Produce institutional-grade market analysis, on-chain research, and investment-relevant insights for our premium subscriber base. Your work will be read by banks, fund managers, and high-net-worth individuals.',
    requirements: ['Professional finance/crypto background', '10+ published research pieces', 'Demonstrated analytical and data interpretation skills', 'Regular availability', 'Strong quantitative analysis skills', 'Experience with on-chain analytics'],
    perks: ['Premium author page', 'Monthly retainer', 'Revenue share on premium content', 'Conference sponsorship', 'Full AI tools suite', 'Premium podcast hosting', 'Paid in CoinDaily Token'],
    slots: 10,
    urgent: true,
    category: 'content',
  },
  {
    id: 'advisory-board',
    title: 'Advisory Board Member',
    department: 'Strategy & Leadership',
    type: 'Advisory',
    location: 'Remote — Global (Africa focus)',
    experience: '10+ years industry leadership',
    compensation: 'Retainer + Token allocation + Revenue share',
    description: 'Guide CoinDaily\'s strategic direction and content quality. Share your network, insights, and brand to accelerate Africa\'s crypto knowledge ecosystem.',
    requirements: ['Industry leader status', 'Outstanding application or invitation', 'Public figure or KOL in crypto/finance', 'Commitment to quarterly strategic reviews', 'Strong African market connections'],
    perks: ['Top-tier branding', 'Advisory compensation', 'CoinDaily Token allocation', 'Full editorial control', 'Direct line to CEO', 'Board voting rights', 'Paid in CoinDaily Token'],
    slots: 5,
    urgent: false,
    category: 'leadership',
  },
  {
    id: 'podcast-host',
    title: 'Premium Podcast Host',
    department: 'Content & Media',
    type: 'Freelance / Part-time',
    location: 'Remote — Africa-wide',
    experience: '1+ years podcasting or broadcasting',
    compensation: 'Revenue share on premium podcast subscriptions + Ad revenue (55/45)',
    description: 'Host premium podcast series covering African crypto markets, interviews with industry leaders, and educational content. Help build CoinDaily\'s audio content library.',
    requirements: ['Clear speaking voice and presentation skills', 'Crypto/finance knowledge', 'Basic audio recording equipment', 'Ability to produce weekly episodes', 'Interview skills'],
    perks: ['Professional podcast studio tools', 'Guest booking support', 'Marketing and promotion', 'Premium podcast page', 'Paid in CoinDaily Token'],
    slots: 8,
    urgent: false,
    category: 'content',
  },
  {
    id: 'course-creator',
    title: 'Course Creator',
    department: 'Education',
    type: 'Freelance / Project-based',
    location: 'Remote — Africa-wide',
    experience: 'Teaching/training experience preferred',
    compensation: 'Course sales revenue (You=80%, We=20% incl. processing fees)',
    description: 'Create comprehensive courses on cryptocurrency trading, blockchain technology, DeFi, regulation, and financial literacy for African audiences. Courses will be sold on CoinDaily\'s education platform.',
    requirements: ['Deep expertise in your subject area', 'Ability to explain complex topics simply', 'Content creation skills (video/text)', 'Crypto or finance background', 'Patience and teaching mindset'],
    perks: ['80% revenue on course sales', 'Course marketing support', 'AI tools for course creation', 'Student engagement analytics', 'Paid in CoinDaily Token'],
    slots: 15,
    urgent: false,
    category: 'content',
  },
  /* ──── Technical Positions ──── */
  {
    id: 'fullstack-engineer',
    title: 'Full-Stack Engineer',
    department: 'Engineering',
    type: 'Full-time / Contract',
    location: 'Remote — Africa-wide',
    experience: '3+ years',
    compensation: 'Competitive salary (paid in CoinDaily Token) + Token allocation',
    description: 'Build and maintain CoinDaily\'s platform using Next.js, TypeScript, Node.js, and PostgreSQL. Work on real-time market data, AI integrations, and user-facing features.',
    requirements: ['Proficiency in TypeScript, React/Next.js, Node.js', 'Database experience (PostgreSQL, Redis)', 'API design (REST + GraphQL)', 'Understanding of Web3/blockchain concepts', 'Git workflow and CI/CD experience'],
    perks: ['Work on cutting-edge AI + crypto platform', 'Token allocation', 'Remote work flexibility', 'Learning budget', 'Paid in CoinDaily Token'],
    slots: 3,
    urgent: true,
    category: 'tech',
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / ML Engineer',
    department: 'AI & Data',
    type: 'Full-time / Contract',
    location: 'Remote — Africa-wide',
    experience: '3+ years in ML/AI',
    compensation: 'Competitive salary (paid in CoinDaily Token) + Token allocation',
    description: 'Build and optimize CoinDaily\'s AI agent system — content generation, sentiment analysis, market prediction, translation (15 African languages), and moderation agents.',
    requirements: ['Python proficiency, experience with LLMs (GPT-4, Gemini)', 'NLP experience, especially multilingual', 'Understanding of transformer architectures', 'Experience with model fine-tuning and prompt engineering', 'Familiarity with microservices architecture'],
    perks: ['Work on Africa\'s most advanced AI content platform', 'Token allocation', 'Research publication support', 'Conference sponsorship', 'Paid in CoinDaily Token'],
    slots: 2,
    urgent: true,
    category: 'tech',
  },
  {
    id: 'blockchain-developer',
    title: 'Blockchain Developer',
    department: 'Engineering',
    type: 'Full-time / Contract',
    location: 'Remote — Africa-wide',
    experience: '2+ years in Web3',
    compensation: 'Competitive salary (paid in CoinDaily Token) + Token allocation',
    description: 'Develop smart contracts for CoinDaily Token, staking mechanisms, and DeFi integrations. Build the on-chain infrastructure powering our contributor payment system.',
    requirements: ['Solidity/Rust smart contract development', 'Experience with EVM-compatible chains', 'Understanding of DeFi protocols and tokenomics', 'Security auditing knowledge', 'Testing and deployment best practices'],
    perks: ['Build the token powering Africa\'s crypto media', 'Token allocation', 'Open source contributions', 'Paid in CoinDaily Token'],
    slots: 2,
    urgent: false,
    category: 'tech',
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst / Quantitative Researcher',
    department: 'AI & Data',
    type: 'Full-time / Part-time',
    location: 'Remote — Africa-wide',
    experience: '2+ years in data analysis',
    compensation: 'Competitive salary (paid in CoinDaily Token) + Token allocation',
    description: 'Analyze African crypto market data, build dashboards, create trading signals, and support our Data Insight premium service targeting traders, banks, and enterprises.',
    requirements: ['Strong Python/SQL skills', 'Experience with data visualization (charts, dashboards)', 'Statistical analysis and modeling', 'Understanding of crypto markets and trading', 'Ability to communicate findings clearly'],
    perks: ['Work with Africa\'s largest crypto dataset', 'Token allocation', 'Premium tool access', 'Paid in CoinDaily Token'],
    slots: 3,
    urgent: true,
    category: 'tech',
  },
  {
    id: 'devops-engineer',
    title: 'DevOps / Infrastructure Engineer',
    department: 'Engineering',
    type: 'Full-time / Contract',
    location: 'Remote — Africa-wide',
    experience: '3+ years',
    compensation: 'Competitive salary (paid in CoinDaily Token) + Token allocation',
    description: 'Manage CoinDaily\'s Docker-based infrastructure on Contabo VPS. Handle CI/CD pipelines, monitoring (Elasticsearch), CDN (Cloudflare), and ensure <500ms API response times.',
    requirements: ['Docker and container orchestration', 'Linux server administration', 'CI/CD (GitHub Actions)', 'Monitoring and logging (Elasticsearch, Grafana)', 'Nginx, Cloudflare, and CDN management'],
    perks: ['Architect Africa\'s crypto infrastructure', 'Token allocation', 'Learning budget', 'Paid in CoinDaily Token'],
    slots: 1,
    urgent: false,
    category: 'tech',
  },
  {
    id: 'mobile-developer',
    title: 'Mobile Developer (React Native)',
    department: 'Engineering',
    type: 'Full-time / Contract',
    location: 'Remote — Africa-wide',
    experience: '2+ years mobile development',
    compensation: 'Competitive salary (paid in CoinDaily Token) + Token allocation',
    description: 'Build CoinDaily\'s mobile app — PWA and native features for real-time market alerts, news reading, and contributor tools. Optimize for African mobile networks and devices.',
    requirements: ['React Native or Flutter experience', 'TypeScript proficiency', 'Mobile performance optimization', 'Push notification implementation', 'Offline-first architecture understanding'],
    perks: ['Build the app for millions of African crypto users', 'Token allocation', 'Device testing budget', 'Paid in CoinDaily Token'],
    slots: 2,
    urgent: false,
    category: 'tech',
  },
];

const categories = [
  { key: 'all', label: 'All Positions', count: positions.length },
  { key: 'content', label: 'Content & Writing', count: positions.filter(p => p.category === 'content').length },
  { key: 'tech', label: 'Technical', count: positions.filter(p => p.category === 'tech').length },
  { key: 'leadership', label: 'Leadership', count: positions.filter(p => p.category === 'leadership').length },
];

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const filteredPositions = selectedCategory === 'all'
    ? positions
    : positions.filter(p => p.category === selectedCategory);

  const urgentCount = positions.filter(p => p.urgent).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
            💼 We&apos;re Hiring
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Join CoinDaily — Shape Africa&apos;s Crypto Future
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
            We&apos;re building Africa&apos;s premier crypto and finance knowledge platform. Join our team of writers, analysts, engineers, and leaders.
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full text-sm font-bold mb-6">
            💎 ALL compensation paid in CoinDaily Token
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-blue-600">{positions.length}</p>
              <p className="text-xs text-gray-500">Open Positions</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              <p className="text-xs text-gray-500">Urgent Hiring</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-green-600">100%</p>
              <p className="text-xs text-gray-500">Remote</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-orange-600">🌍</p>
              <p className="text-xs text-gray-500">Africa-wide</p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(c => (
            <button key={c.key} onClick={() => setSelectedCategory(c.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedCategory === c.key ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border hover:bg-blue-50 dark:hover:bg-gray-700'}`}>
              {c.label} ({c.count})
            </button>
          ))}
        </div>

        {/* Job Listings */}
        <div className="space-y-4 mb-16">
          {filteredPositions.map(job => (
            <div key={job.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border-2 transition-all ${job.urgent ? 'border-red-300 dark:border-red-700' : 'border-transparent hover:border-blue-200 dark:hover:border-blue-800'}`}>
              {/* Job Header */}
              <div className="p-6 cursor-pointer" onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                      {job.urgent && <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs font-bold rounded-full animate-pulse">URGENT</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">🏢 {job.department}</span>
                      <span className="flex items-center gap-1">📍 {job.location}</span>
                      <span className="flex items-center gap-1">⏰ {job.type}</span>
                      <span className="flex items-center gap-1">📈 {job.experience}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
                      {typeof job.slots === 'number' ? `${job.slots} slots` : job.slots}
                    </span>
                    <span className="text-gray-400 text-xl">{expandedJob === job.id ? '−' : '+'}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedJob === job.id && (
                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{job.description}</p>

                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 mb-4 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300">💰 Compensation: {job.compensation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {job.requirements.map(r => (
                          <li key={r} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Perks & Benefits</h4>
                      <ul className="space-y-2">
                        {job.perks.map(p => (
                          <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => { setShowApplyModal(job.id); setApplied(false); }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow">
                      Apply Now 🚀
                    </button>
                    {job.category === 'content' && (
                      <Link href="/expert-program" className="px-6 py-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-xl font-bold hover:bg-orange-200 transition-all">
                        Learn About Partner Program →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Why CoinDaily */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center mb-16">
          <h3 className="text-2xl font-bold mb-6">Why Work With CoinDaily?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: '🌍', title: 'Africa-First Mission', desc: 'Build the continent\'s crypto knowledge infrastructure' },
              { icon: '🤖', title: 'Cutting-Edge AI', desc: 'Work with GPT-4, Gemini, and custom ML models' },
              { icon: '💎', title: 'Token Compensation', desc: 'Earn CoinDaily Token with staking rewards' },
              { icon: '🏠', title: '100% Remote', desc: 'Work from anywhere in Africa (or globally)' },
            ].map(i => (
              <div key={i.title} className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                <p className="text-3xl mb-2">{i.icon}</p>
                <h4 className="font-bold mb-1">{i.title}</h4>
                <p className="text-sm opacity-90">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Don&apos;t See Your Role?</h3>
          <p className="text-gray-500 mb-4">We&apos;re always looking for talented people. Send your CV and we&apos;ll reach out.</p>
          <a href="mailto:jobs@coindaily.online" className="px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 transition-all inline-block">
            Send Open Application → jobs@coindaily.online
          </a>
        </div>
      </main>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowApplyModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 border dark:border-gray-700 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {applied ? (
              <div className="text-center py-8">
                <p className="text-5xl mb-4">🎉</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted!</h3>
                <p className="text-gray-500 text-sm mb-4">We&apos;ll review your application within 48 hours.</p>
                <p className="text-xs text-gray-400">All compensation paid in CoinDaily Token.</p>
                <button onClick={() => setShowApplyModal(null)} className="mt-6 px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Apply: {positions.find(p => p.id === showApplyModal)?.title}
                  </h3>
                  <button onClick={() => setShowApplyModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); setApplied(true); }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name *</label>
                      <input type="text" required className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email *</label>
                      <input type="email" required className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Country *</label>
                    <select required className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                      <option value="">Select country</option>
                      <option>🇳🇬 Nigeria</option>
                      <option>🇰🇪 Kenya</option>
                      <option>🇿🇦 South Africa</option>
                      <option>🇬🇭 Ghana</option>
                      <option>🇪🇹 Ethiopia</option>
                      <option>🇹🇿 Tanzania</option>
                      <option>🇺🇬 Uganda</option>
                      <option>🇷🇼 Rwanda</option>
                      <option>🇪🇬 Egypt</option>
                      <option>🇨🇲 Cameroon</option>
                      <option>🇸🇳 Senegal</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Portfolio / LinkedIn / GitHub *</label>
                    <input type="url" required placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Why are you a great fit? *</label>
                    <textarea required rows={4} placeholder="Tell us about your experience and why you want to join CoinDaily..."
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                    Submit Application 🚀
                  </button>
                  <p className="text-xs text-gray-400 text-center">Reviewed within 48 hours. All compensation in CoinDaily Token.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
