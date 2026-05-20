'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const mockCreatorData = {
  tier: 'Verified Analyst',
  tierBadge: '✅',
  totalCP: 2847,
  monthlyCP: 324,
  totalReads: 124300,
  monthlyReads: 24300,
  totalArticles: 67,
  monthlyArticles: 8,
  qualityScore: 88,
  consistencyScore: 92,
  adRevenue: 1240,
  subscribers: 3420,
  avgReadTime: '4m 32s',
  completionRate: 72,
  searchImpressions: 45200,
  searchClicks: 3200,
  topCountries: [
    { code: 'NG', name: 'Nigeria', percentage: 35 },
    { code: 'KE', name: 'Kenya', percentage: 22 },
    { code: 'ZA', name: 'South Africa', percentage: 18 },
    { code: 'GH', name: 'Ghana', percentage: 12 },
    { code: 'TZ', name: 'Tanzania', percentage: 8 },
  ],
  recentArticles: [
    { id: '1', title: 'Nigeria DeFi Landscape 2026: Complete Analysis', reads: 4200, cp: 63, status: 'LIVE', trending: true, trendingTier: 'VIRAL', date: '2026-05-18' },
    { id: '2', title: 'Stablecoins for African Remittances: A Deep Dive', reads: 2100, cp: 31.5, status: 'LIVE', trending: true, trendingTier: 'RISING', date: '2026-05-15' },
    { id: '3', title: 'Caribbean Remittance Corridor Index: What It Means', reads: 1800, cp: 27, status: 'LIVE', trending: false, trendingTier: 'STANDARD', date: '2026-05-12' },
    { id: '4', title: 'Kenya VASP Act: 6-Month Impact Assessment', reads: 3400, cp: 51, status: 'LIVE', trending: true, trendingTier: 'RISING', date: '2026-05-10' },
    { id: '5', title: 'CHIMA EM Crypto Adoption Index Methodology', reads: 0, cp: 0, status: 'DRAFT', trending: false, trendingTier: 'STANDARD', date: '2026-05-20' },
  ],
  earningsHistory: [
    { month: 'Jan', cp: 180, reads: 12000 },
    { month: 'Feb', cp: 210, reads: 15000 },
    { month: 'Mar', cp: 245, reads: 18200 },
    { month: 'Apr', cp: 290, reads: 21000 },
    { month: 'May', cp: 324, reads: 24300 },
  ],
  earningsByTier: {
    STANDARD: 120,
    RISING: 580,
    VIRAL: 1200,
    MEGA_VIRAL: 947,
  },
};

const trendingColors: Record<string, string> = {
  STANDARD: 'bg-gray-100 text-gray-600',
  RISING: 'bg-blue-100 text-blue-700',
  VIRAL: 'bg-orange-100 text-orange-700',
  MEGA_VIRAL: 'bg-red-100 text-red-700',
};

export default function CreatorHubPage() {
  const [tab, setTab] = useState<'overview' | 'content' | 'earnings' | 'analytics' | 'tools'>('overview');
  const data = mockCreatorData;

  return (
    <div className="space-y-6">
      {/* Creator Header */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{data.tierBadge}</span>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">{data.tier}</span>
            </div>
            <h1 className="text-2xl font-bold">Creator Studio</h1>
            <p className="text-white/80 text-sm mt-1">Your content performance hub — like YouTube Partner Program for crypto journalism</p>
          </div>
          <div className="flex gap-3">
            <Link href="/user/creator/new-article" className="px-4 py-2 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50 transition">
              New Article
            </Link>
            <Link href="/user/creator/ai-research" className="px-4 py-2 bg-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/30 transition">
              AI Research
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total CP Earned', value: data.totalCP.toLocaleString(), icon: '🪙', trend: '+12%' },
          { label: 'Monthly CP', value: data.monthlyCP.toLocaleString(), icon: '📈', trend: '+8%' },
          { label: 'Total Reads', value: `${(data.totalReads / 1000).toFixed(1)}K`, icon: '👁️', trend: '+15%' },
          { label: 'Quality Score', value: `${data.qualityScore}/100`, icon: '⭐', trend: '+3' },
          { label: 'Subscribers', value: data.subscribers.toLocaleString(), icon: '👥', trend: '+120' },
          { label: 'Ad Revenue', value: `$${data.adRevenue}`, icon: '💰', trend: '+$180' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-green-600 font-semibold">{stat.trend}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: '🏠' },
          { key: 'content', label: 'My Content', icon: '📄' },
          { key: 'earnings', label: 'Earnings', icon: '💰' },
          { key: 'analytics', label: 'Analytics', icon: '📊' },
          { key: 'tools', label: 'Creator Tools', icon: '🛠️' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${tab === t.key ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Articles */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Recent Articles</h2>
              <button onClick={() => setTab('content')} className="text-xs text-orange-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {data.recentArticles.map(article => (
                <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{article.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{article.date}</span>
                      <span className="text-xs text-gray-500">{article.reads.toLocaleString()} reads</span>
                      {article.cp > 0 && <span className="text-xs text-orange-600 font-semibold">{article.cp} CP</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {article.trending && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendingColors[article.trendingTier]}`}>
                        {article.trendingTier === 'MEGA_VIRAL' ? 'MEGA' : article.trendingTier}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${article.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {article.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* CP Earnings Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">CP Earnings by Trending Tier</h3>
              <p className="text-xs text-gray-500 mb-3">Higher trending content earns more CP</p>
              <div className="space-y-2">
                {Object.entries(data.earningsByTier).map(([tier, cp]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendingColors[tier]}`}>{tier}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{cp} CP</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-sm font-bold text-orange-600">{data.totalCP} CP</span>
                </div>
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Your Audience</h3>
              <div className="space-y-2">
                {data.topCountries.map(c => (
                  <div key={c.code} className="flex items-center gap-2">
                    <span className="text-sm w-24">{c.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Tips to Earn More CP</h3>
              <ul className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
                <li>Write about trending topics in your region</li>
                <li>Include original data points (LLMs cite data)</li>
                <li>Add FAQ sections (triggers Google snippets)</li>
                <li>Share on WhatsApp groups for EM distribution</li>
                <li>Collaborate with other creators for cross-promotion</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {tab === 'content' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">My Articles</h2>
              <p className="text-sm text-gray-500">{data.totalArticles} total articles · {data.monthlyArticles} this month</p>
            </div>
            <Link href="/user/creator/new-article" className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700">
              Write New Article
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Article</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Trending</th>
                  <th className="pb-3 font-medium text-right">Reads</th>
                  <th className="pb-3 font-medium text-right">CP Earned</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentArticles.map(a => (
                  <tr key={a.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">{a.title}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {a.trending ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trendingColors[a.trendingTier]}`}>
                          {a.trendingTier}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-300">{a.reads.toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold text-orange-600">{a.cp > 0 ? `${a.cp} CP` : '—'}</td>
                    <td className="py-3 text-right text-gray-500">{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Earnings Tab */}
      {tab === 'earnings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Earnings Overview</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-orange-600">{data.totalCP}</p>
                <p className="text-xs text-gray-500">Total CP Earned (All Time)</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-600">{data.monthlyCP}</p>
                <p className="text-xs text-gray-500">CP This Month</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-600">${data.adRevenue}</p>
                <p className="text-xs text-gray-500">Ad Revenue (All Time)</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-purple-600">{data.tier}</p>
                <p className="text-xs text-gray-500">Current Tier</p>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Monthly Earnings Trend</h3>
            <div className="space-y-2">
              {data.earningsHistory.map(m => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8">{m.month}</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
                      style={{ width: `${(m.cp / 400) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 text-right">{m.cp} CP</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">How CP Earnings Work</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Only Trending Content Earns CP</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Unlike flat per-read payments, CoinDaily rewards content that trends. The higher your article trends, the more CP you earn. This incentivizes quality, shareability, and genuine engagement.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Trending Tiers & Multipliers</h4>
                {[
                  { tier: 'RISING', min: '50+ score', mult: '1.5x', desc: 'Content gaining traction' },
                  { tier: 'VIRAL', min: '200+ score', mult: '3x', desc: 'Widely shared & discussed' },
                  { tier: 'MEGA_VIRAL', min: '500+ score', mult: '5x', desc: 'Exceptional viral reach' },
                ].map(t => (
                  <div key={t.tier} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendingColors[t.tier]}`}>{t.tier}</span>
                      <span className="text-xs text-gray-500">{t.min}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{t.mult} CP</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Base CP Rate by Tier</h4>
                {[
                  { name: 'Community Writer', rate: '0.5 CP / 100 reads' },
                  { name: 'Regional Expert', rate: '1.0 CP / 100 reads' },
                  { name: 'Verified Analyst', rate: '1.5 CP / 100 reads' },
                  { name: 'Senior Fellow', rate: '3.0 CP / 100 reads' },
                  { name: 'Senior Analyst', rate: '2.0 CP / 100 reads' },
                  { name: 'Advisory Board', rate: '4.0 CP / 100 reads' },
                ].map(t => (
                  <div key={t.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">{t.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{t.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Content Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.avgReadTime}</p>
                <p className="text-xs text-gray-500">Avg. Read Time</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.completionRate}%</p>
                <p className="text-xs text-gray-500">Completion Rate</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{(data.searchImpressions / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500">Search Impressions</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{(data.searchClicks / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500">Search Clicks</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Audience Demographics</h2>
            <div className="space-y-3">
              {data.topCountries.map(c => (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32">{c.name}</span>
                  <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${c.percentage}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">SEO Performance</h2>
            <p className="text-sm text-gray-500 mb-4">How your content performs in search engines and LLM citations</p>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xl font-bold text-blue-600">{(data.searchImpressions / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500">Impressions</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-xl font-bold text-green-600">{(data.searchClicks / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500">Clicks</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-xl font-bold text-purple-600">{((data.searchClicks / data.searchImpressions) * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">CTR</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <p className="text-xl font-bold text-orange-600">{data.qualityScore}</p>
                <p className="text-xs text-gray-500">Quality Score</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {tab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'AI Research Assistant', desc: 'One-click market research from CoinGecko, on-chain analytics, regulatory feeds, and news sources.', icon: '🔍', link: '/user/creator/ai-research', available: true },
            { title: 'Content Studio', desc: 'AI-assisted article writer with headline generator, image creator, social media pack, and newsletter builder.', icon: '✍️', link: '/user/creator/new-article', available: true },
            { title: 'SEO Keyword Tracker', desc: 'Track keyword rankings for your articles across EM markets.', icon: '📈', link: '/user/creator/seo', available: true },
            { title: 'Social Media Pack', desc: 'Auto-generate Twitter threads, LinkedIn posts, WhatsApp summaries from your articles.', icon: '📱', link: '/user/creator/social', available: true },
            { title: 'Course Builder', desc: 'Create and sell educational courses on our platform. You keep 80%.', icon: '🎓', link: '/user/creator/courses', available: false },
            { title: 'Podcast Studio', desc: 'Launch and monetize your own premium podcast series.', icon: '🎙️', link: '/user/creator/podcast', available: false },
            { title: 'Newsletter Builder', desc: 'Build and manage your subscriber newsletter with AI assistance.', icon: '📧', link: '/user/creator/newsletter', available: true },
            { title: 'CHIMA Data Access', desc: 'Free access to CHIMA Index data for research and articles.', icon: '📊', link: '/insights/chima-index', available: true },
            { title: 'Press Release Submission', desc: 'Submit press releases for distribution across the NEXUS network.', icon: '📢', link: '/user/creator/press', available: true },
          ].map(tool => (
            <div key={tool.title} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border ${tool.available ? 'border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 cursor-pointer' : 'border-gray-100 dark:border-gray-700 opacity-60'} transition`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tool.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{tool.desc}</p>
                  {!tool.available && <span className="text-xs text-orange-600 font-medium mt-2 inline-block">Coming Soon</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
