'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  PauseCircle,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPartnerSite, fetchSitePositions } from '@/lib/api';

/**
 * Partner Positions Page - press.coindaily.online/partner/positions
 *
 * Partners manage the ad/PR positions on their site.
 * Each position has a selector/slug, display type, and a price in JOY
 * that the partner sets within their tier range.
 *
 * Pricing: Partners set their OWN price within a tier-defined range.
 * The DH system determines tier and the range of acceptable pricing.
 */

const TIER_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  bronze: { min: 5, max: 20 },
  silver: { min: 15, max: 50 },
  gold: { min: 40, max: 150 },
  platinum: { min: 100, max: 500 },
};

interface Position {
  id: string;
  selectorOrSlug: string;
  displayType: 'card' | 'full' | 'feed';
  maxWords: number;
  priceJoy: number;
  available: boolean;
}

const MOCK_POSITIONS: Position[] = [
  { id: 'pos-1', selectorOrSlug: '/sponsored', displayType: 'full', maxWords: 1500, priceJoy: 75, available: true },
  { id: 'pos-2', selectorOrSlug: '#sidebar-widget', displayType: 'card', maxWords: 300, priceJoy: 25, available: true },
  { id: 'pos-3', selectorOrSlug: '/press/feed', displayType: 'feed', maxWords: 500, priceJoy: 15, available: false },
];

const CURRENT_TIER = 'gold';

export default function PartnerPositionsPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [currentTier, setCurrentTier] = useState('bronze');
  const range = TIER_PRICE_RANGES[currentTier];

  useEffect(() => {
    if (!user?.email) return;
    fetchPartnerSite(user.email).then(async site => {
      if (!site) return;
      if (site.tier) setCurrentTier(site.tier);
      const pos = await fetchSitePositions(site.id);
      setPositions(pos.map((p: any) => ({
        id: p.id,
        selectorOrSlug: p.selector_or_slug,
        displayType: p.display_type || 'card',
        maxWords: p.max_words || 500,
        priceJoy: Number(p.price_joy) || 0,
        available: p.is_active,
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.email]);

  const toggleAvailability = (id: string) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p))
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Positions</h1>
          <p className="text-dark-400">
            Manage PR display positions on your site. Set your own price within the{' '}
            <span className="text-primary-500 font-semibold">{range.min}–{range.max} JOY</span> range for your{' '}
            <span className="capitalize text-yellow-400">{currentTier}</span> tier.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Position
        </button>
      </div>

      {/* Tier Pricing Info */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">Tier Pricing Ranges (JOY per placement)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(TIER_PRICE_RANGES).map(([tier, r]) => (
            <div
              key={tier}
              className={`p-3 rounded-lg border ${
                tier === currentTier ? 'border-primary-500 bg-primary-500/5' : 'border-dark-700 bg-dark-800'
              }`}
            >
              <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">{tier}</p>
              <p className="text-white font-bold">
                {r.min}–{r.max} JOY
              </p>
              {tier === currentTier && (
                <span className="text-xs text-primary-500 mt-1 inline-block">← Your tier</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Positions List */}
      <div className="space-y-4">
        {positions.map((pos) => (
          <div
            key={pos.id}
            className="bg-dark-900 border border-dark-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="w-5 h-5 text-primary-500" />
                <code className="text-sm text-primary-400 bg-dark-700 px-2 py-0.5 rounded">
                  {pos.selectorOrSlug}
                </code>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    pos.available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {pos.available ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-dark-400">
                <span>Display: <span className="text-dark-200 capitalize">{pos.displayType}</span></span>
                <span>Max: <span className="text-dark-200">{pos.maxWords} words</span></span>
                <span>
                  Price:{' '}
                  <span className="text-white font-semibold">{pos.priceJoy} JOY</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAvailability(pos.id)}
                className={`p-2 rounded-lg transition-colors ${
                  pos.available
                    ? 'text-yellow-500 hover:bg-yellow-500/10'
                    : 'text-green-500 hover:bg-green-500/10'
                }`}
                title={pos.available ? 'Pause' : 'Activate'}
              >
                {pos.available ? <PauseCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </button>
              <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors" title="Edit">
                <Pencil className="w-5 h-5" />
              </button>
              <button className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {positions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-dark-500">
          <Layers className="w-16 h-16 mb-4" />
          <p className="text-lg mb-2">No positions configured</p>
          <p className="text-sm">Add a position to start receiving press releases.</p>
        </div>
      )}
    </>
  );
}
