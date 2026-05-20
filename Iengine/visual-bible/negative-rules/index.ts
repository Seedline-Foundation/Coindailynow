/**
 * Visual Bible — Negative Rules
 * Universal suppression rules to prevent quality degradation.
 */

export const universalNegatives: string[] = [
  'watermark',
  'text',
  'text artifacts',
  'logos',
  'signature',
  'username',
  'deformed anatomy',
  'duplicate limbs',
  'malformed hands',
  'extra fingers',
  'fused fingers',
  'too many fingers',
  'missing fingers',
  'poorly drawn hands',
  'poorly drawn face',
  'bad anatomy',
  'wrong anatomy',
  'extra limbs',
  'missing limbs',
  'floating limbs',
  'disconnected limbs',
  'mutation',
  'mutated',
  'ugly',
  'disgusting',
  'blurry',
  'poor perspective',
  'blurry background',
  'AI-generated typography',
  'low quality',
  'low resolution',
  'jpeg artifacts',
  'compression artifacts',
  'pixelated',
  'grainy',
  'noisy',
  'overexposed',
  'underexposed',
  'chromatic aberration',
  'distorted',
  'disfigured',
  'gross proportions',
  'malformed',
  'cropped',
  'out of frame',
  'worst quality',
  'normal quality',
];

export const domainNegatives: Record<string, string[]> = {
  crypto: [
    'stock photo generic',
    'clipart',
    'cartoon style',
    'realistic human faces',
    'natural landscape without tech',
  ],
  tradfi: [
    'neon chaos',
    'cyberpunk excess',
    'unstable framing',
    'informal aesthetics',
    'street art style',
  ],
  ai: [
    'organic naturalism',
    'low-tech aesthetics',
    'rustic environments',
    'warm cozy lighting',
  ],
  cybercrime: [
    'bright cheerful lighting',
    'optimistic framing',
    'warm inviting tones',
    'natural sunlight',
    'happy atmosphere',
  ],
  afrofuturism: [
    'poverty imagery',
    'colonial aesthetics',
    'western-only architecture',
    'stereotypical depictions',
    'rural underdevelopment',
    'aid/charity imagery',
  ],
  breaking: [
    'calm atmosphere',
    'peaceful composition',
    'soft pastel colors',
    'relaxed framing',
  ],
  regulation: [
    'informal settings',
    'chaotic environments',
    'neon party lighting',
    'street-level chaos',
  ],
};

/**
 * Build the full negative prompt string for a given domain.
 */
export function buildNegativePrompt(domain: string): string {
  const domainSpecific = domainNegatives[domain] || [];
  const allNegatives = [...universalNegatives, ...domainSpecific];
  return allNegatives.join(', ');
}

/**
 * Get domain key from story type.
 */
export function getDomainFromStoryType(storyType: string): string {
  const mapping: Record<string, string> = {
    'breaking-news': 'breaking',
    'premium-feature': 'crypto',
    'market-analysis': 'crypto',
    cybercrime: 'cybercrime',
    regulation: 'regulation',
    'ai-future': 'ai',
    'startup-vc': 'crypto',
    afrofuturism: 'afrofuturism',
    'thumbnail-fast': 'crypto',
    'social-banner': 'crypto',
  };

  return mapping[storyType] || 'crypto';
}

export default { universalNegatives, domainNegatives, buildNegativePrompt };
