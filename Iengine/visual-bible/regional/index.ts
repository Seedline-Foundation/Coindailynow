/**
 * Visual Bible — Regional Visual Identities
 * Defines location-specific visual languages, especially African Futurism.
 */

import { RegionalProfile, ColorPalette } from '../../types';

export interface RegionalStyleProfile {
  id: RegionalProfile;
  name: string;
  palette: string[];
  mood: string[];
  architecture: string[];
  lighting: string[];
  symbols: string[];
  camera_notes: string[];
  environments: string[];
}

export const regionalProfiles: Record<string, RegionalStyleProfile> = {
  'africa-west': {
    id: 'africa-west',
    name: 'West African Futurism',
    palette: ['warm gold', 'deep blue', 'neon amber', 'coral orange'],
    mood: ['digital renaissance', 'emerging power', 'urban innovation', 'youth energy'],
    architecture: [
      'Lagos smart-city skylines',
      'Accra tech hubs',
      'Abuja government districts with holographic overlays',
      'dense urban fintech corridors',
    ],
    lighting: ['humid cinematic glow', 'warm amber sunset', 'neon market lighting', 'tropical digital atmosphere'],
    symbols: [
      'mobile payment terminals',
      'M-Pesa kiosks',
      'youth traders with smartphones',
      'fintech street markets',
      'digital Naira tokens',
    ],
    camera_notes: [
      'street-level realism',
      'human-centric compositions',
      'movement-heavy scenes',
      'optimism-focused framing',
    ],
    environments: [
      'Lagos marina district at twilight',
      'Eko Atlantic smart-city',
      'Lekki tech corridor',
      'Obalende digital market',
      'Accra digital innovation center',
    ],
  },
  'africa-east': {
    id: 'africa-east',
    name: 'East African Futurism',
    palette: ['emerald green', 'savanna gold', 'digital blue', 'sunset orange'],
    mood: ['startup ecosystem energy', 'mobile-first innovation', 'green tech optimism'],
    architecture: [
      'Nairobi Silicon Savannah',
      'iHub innovation centers',
      'Konza Technopolis',
      'Kigali smart-city grids',
    ],
    lighting: ['golden savanna light', 'green tech glow', 'modern office illumination'],
    symbols: [
      'M-Pesa mobile money',
      'iHub coworking spaces',
      'savanna-tech fusion',
      'tea plantation data farms',
      'mobile banking revolution',
    ],
    camera_notes: ['wide establishing shots of tech campuses', 'close-ups of mobile innovation'],
    environments: [
      'Nairobi tech district',
      'Kigali innovation hub',
      'Dar es Salaam fintech corridor',
    ],
  },
  'africa-south': {
    id: 'africa-south',
    name: 'Southern African Tech',
    palette: ['ocean blue', 'gold', 'deep green', 'chrome silver'],
    mood: ['financial sophistication', 'mining-to-digital transition', 'institutional emergence'],
    architecture: [
      'Johannesburg financial district',
      'Cape Town tech hub',
      'modern African banking towers',
    ],
    lighting: ['clean modern institutional', 'ocean-reflected light', 'mining-gold illumination'],
    symbols: [
      'gold-to-digital conversion',
      'Rand digital tokens',
      'mining-tech fusion',
      'institutional trading floors',
    ],
    camera_notes: ['institutional perspective', 'panoramic city views', 'modern corporate angles'],
    environments: [
      'Sandton financial district',
      'Cape Town tech waterfront',
      'Johannesburg blockchain campus',
    ],
  },
  global: {
    id: 'global',
    name: 'Global Default',
    palette: ['neon cyan', 'electric purple', 'gold', 'dark navy'],
    mood: ['technological advancement', 'market dynamics', 'digital frontier'],
    architecture: ['futuristic trading floors', 'holographic data centers', 'cyberpunk metropolis'],
    lighting: ['neon volumetric glow', 'holographic ambience', 'cinematic depth lighting'],
    symbols: [
      'holographic crypto coins',
      'blockchain data streams',
      'global financial networks',
    ],
    camera_notes: ['cinematic wide-angle', 'dynamic low-angle power shots'],
    environments: [
      'futuristic trading floor',
      'global financial command center',
      'digital asset vault',
    ],
  },
  'middle-east': {
    id: 'middle-east',
    name: 'Middle East Financial Hub',
    palette: ['desert gold', 'royal blue', 'white marble', 'emerald'],
    mood: ['sovereign wealth', 'luxury innovation', 'desert-tech contrast'],
    architecture: [
      'Dubai financial towers',
      'Abu Dhabi sovereign wealth centers',
      'futuristic desert metropolis',
    ],
    lighting: ['desert sun with tech overlay', 'gold ambient', 'clean luxury illumination'],
    symbols: [
      'sovereign wealth funds',
      'desert-tech oasis',
      'gold-backed digital assets',
      'luxury fintech terminals',
    ],
    camera_notes: ['grand architectural perspective', 'luxury-tech fusion angles'],
    environments: ['Dubai International Financial Centre', 'Abu Dhabi Global Market'],
  },
  asia: {
    id: 'asia',
    name: 'Asian Tech Markets',
    palette: ['red', 'gold', 'neon pink', 'deep black'],
    mood: ['high-frequency trading', 'tech density', 'market velocity'],
    architecture: [
      'Tokyo financial district',
      'Singapore fintech hub',
      'Hong Kong trading towers',
    ],
    lighting: ['dense neon urban', 'high-contrast tech glow', 'rapid market illumination'],
    symbols: [
      'high-frequency trading terminals',
      'dense market data walls',
      'Asian exchange floors',
    ],
    camera_notes: ['tight urban framing', 'high-density compositions'],
    environments: ['Tokyo Kabutocho', 'Singapore CBD', 'Hong Kong Central'],
  },
};

/**
 * Get regional profile by identifier or region detection.
 */
export function getRegionalProfile(region?: string): RegionalStyleProfile {
  if (!region) return regionalProfiles['global'];

  const lower = region.toLowerCase();

  if (lower.includes('lagos') || lower.includes('nigeria') || lower.includes('ghana') || lower.includes('west africa')) {
    return regionalProfiles['africa-west'];
  }
  if (lower.includes('nairobi') || lower.includes('kenya') || lower.includes('rwanda') || lower.includes('east africa')) {
    return regionalProfiles['africa-east'];
  }
  if (lower.includes('johannesburg') || lower.includes('south africa') || lower.includes('cape town')) {
    return regionalProfiles['africa-south'];
  }
  if (lower.includes('dubai') || lower.includes('abu dhabi') || lower.includes('middle east') || lower.includes('saudi')) {
    return regionalProfiles['middle-east'];
  }
  if (lower.includes('tokyo') || lower.includes('singapore') || lower.includes('hong kong') || lower.includes('asia')) {
    return regionalProfiles['asia'];
  }
  if (lower.includes('africa')) {
    return regionalProfiles['africa-west'];
  }

  return regionalProfiles['global'];
}

/**
 * Build regional environment instruction for prompt.
 */
export function buildRegionalInstruction(profile: RegionalStyleProfile): string {
  const env = profile.environments[Math.floor(Math.random() * profile.environments.length)];
  const mood = profile.mood[Math.floor(Math.random() * profile.mood.length)];
  const lighting = profile.lighting[Math.floor(Math.random() * profile.lighting.length)];

  return `regional identity: ${profile.name}, environment: ${env}, mood: ${mood}, lighting atmosphere: ${lighting}`;
}

export default regionalProfiles;
