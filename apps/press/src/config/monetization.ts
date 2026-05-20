/**
 * Press distribution monetization — launch pricing model (config-driven).
 * Override via NEXT_PUBLIC_PRESS_* env vars without code changes.
 */

export type PressTierId = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PressTier {
  id: PressTierId;
  label: string;
  joyPerSite: number;
  platformFeePercent: number;
  minSites: number;
  maxSites: number;
}

export const PRESS_MONETIZATION = {
  currency: 'JOY' as const,
  escrowHoldHours: 48,
  platformFeePercent: parseFloat(process.env.NEXT_PUBLIC_PRESS_PLATFORM_FEE || '5'),
  yellowCardEnabled: process.env.NEXT_PUBLIC_YELLOWCARD_CHECKOUT !== 'false',
  cfisEscrowEnabled: process.env.NEXT_PUBLIC_CFIS_ESCROW !== 'false',
  tiers: [
    { id: 'bronze', label: 'Bronze', joyPerSite: 50, platformFeePercent: 5, minSites: 1, maxSites: 5 },
    { id: 'silver', label: 'Silver', joyPerSite: 120, platformFeePercent: 5, minSites: 3, maxSites: 15 },
    { id: 'gold', label: 'Gold', joyPerSite: 250, platformFeePercent: 4, minSites: 5, maxSites: 30 },
    { id: 'platinum', label: 'Platinum', joyPerSite: 500, platformFeePercent: 3, minSites: 10, maxSites: 100 },
  ] as PressTier[],
};

export function estimateDistributionCost(siteCount: number, tierId: PressTierId = 'bronze') {
  const tier = PRESS_MONETIZATION.tiers.find((t) => t.id === tierId) || PRESS_MONETIZATION.tiers[0];
  const subtotal = siteCount * tier.joyPerSite;
  const fee = Math.ceil(subtotal * (tier.platformFeePercent / 100));
  return { subtotal, fee, total: subtotal + fee, tier };
}
