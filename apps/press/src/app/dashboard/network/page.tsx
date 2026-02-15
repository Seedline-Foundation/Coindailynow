'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  Search,
  Star,
  Users,
  ExternalLink,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchAvailablePartnerSites } from '@/lib/api';

interface Partner {
  name: string;
  url: string;
  reach: string;
  category: string;
  rating: number;
  articles: number;
  verified: boolean;
}

export default function NetworkPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPartners = useCallback(async () => {
    try {
      const sites = await fetchAvailablePartnerSites();
      setPartners(sites.map((s: any) => ({
        name: s.domain.split('.')[0].charAt(0).toUpperCase() + s.domain.split('.')[0].slice(1),
        url: s.domain,
        reach: s.traffic_score ? `${(s.traffic_score / 1000).toFixed(0)}K` : `DH ${s.dh_score || 0}`,
        category: s.tier?.charAt(0).toUpperCase() + s.tier?.slice(1) || 'General',
        rating: Math.min(5, (Number(s.dh_score) / 20) || 3.0),
        articles: 0,
        verified: s.status === 'verified',
      })));
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const PARTNERS = partners;
  const verifiedCount = partners.filter(p => p.verified).length;
  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary-500" /> Partner Network</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">Partner Network</h1>
        <p className="text-dark-400 text-sm mb-6">Browse verified media sites in the SENDPRESS network. Select partners when creating a distribution campaign.</p>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input type="text" placeholder="Search partners..." className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none" />
          </div>
          <select className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none">
            <option value="">All Categories</option>
            <option value="news">News</option>
            <option value="crypto">Crypto</option>
            <option value="tech">Tech</option>
            <option value="finance">Finance</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Partners', value: loading ? '…' : `${partners.length}`, icon: Users },
            { label: 'Categories', value: loading ? '…' : `${new Set(partners.map(p => p.category)).size}`, icon: Globe },
            { label: 'Verified Sites', value: loading ? '…' : `${verifiedCount}`, icon: Shield },
            { label: 'Network', value: loading ? '…' : 'Active', icon: TrendingUp },
          ].map(stat => (
            <div key={stat.label} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
              <stat.icon className="w-5 h-5 text-primary-500 mb-2" />
              <p className="text-dark-400 text-xs">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Partner Grid */}
        {loading ? (
          <div className="text-center py-12 text-dark-400">Loading partner network…</div>
        ) : PARTNERS.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 mx-auto mb-3 text-dark-600" />
            <p className="text-dark-400">No verified partner sites yet.</p>
            <p className="text-dark-600 text-sm mt-1">Partners will appear here once they register and get verified.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARTNERS.map(p => (
            <div key={p.name} className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{p.name}</h3>
                  <p className="text-dark-500 text-xs flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3" /> {p.url}
                  </p>
                </div>
                {p.verified && (
                  <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-dark-400 mb-3">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.reach} reach</span>
                <span className="bg-dark-800 px-2 py-0.5 rounded">{p.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-medium">{p.rating}</span>
                </div>
                <span className="text-dark-500 text-xs">{p.articles} articles published</span>
              </div>
            </div>
          ))}
        </div>
        )}
      </main>
    </div>
  );
}
