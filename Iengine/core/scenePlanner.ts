/**
 * Scene Planner — The Cinematic Brain
 * Converts editorial meaning into cinematic scene structure.
 *
 * Core principle:
 *   headline → narrative abstraction → scene structure
 * NOT:
 *   headline → prompt
 */

import {
  ScenePlan,
  NarrativeAnalysis,
  EmotionAnalysis,
  StoryType,
  WorkflowType,
  CameraDirective,
  EnvironmentDirective,
  SubjectDirective,
  LightingDirective,
  MotionDirective,
  CompositionDirective,
  RegionalProfile,
  StyleProfile,
} from '../types';
import { getCameraDirective } from '../visual-bible/camera';
import { getLightingDirective } from '../visual-bible/lighting';
import { getMotionDirective } from '../visual-bible/motion';
import { getCompositionDirective } from '../visual-bible/composition';
import { getSymbols, getSymbolContexts } from '../visual-bible/symbolism';
import { getRegionalProfile } from '../visual-bible/regional';
import { getStoryTypeConfig } from '../visual-bible/storytypes';
import { sceneDefaults } from './sceneDefaults';

export class ScenePlanner {
  private ollamaUrl: string;
  private model: string;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  }

  /**
   * Plan a complete cinematic scene from narrative + emotion analysis.
   * Calls local self-hosted Ollama for semantic framing with a rule-based fallback.
   */
  async plan(
    narrative: NarrativeAnalysis,
    emotion: EmotionAnalysis,
    region?: string,
    headline?: string
  ): Promise<ScenePlan> {
    const defaultPlan = this.planRuleBased(narrative, emotion, region);

    try {
      console.log(`[ScenePlanner] Attempting LLM planning via Ollama (${this.model})...`);
      
      const systemPrompt = `You are a cinematic art director for CoinDaily. Your task is to output a scene plan as valid JSON only. Never write image generation prompts directly.
Strictly adhere to the following JSON structure:
{
  "story_type": "breaking-news" | "premium-feature" | "market-analysis" | "cybercrime" | "regulation" | "ai-future" | "startup-vc" | "afrofuturism" | "thumbnail-fast" | "social-banner",
  "urgency": "critical" | "high" | "medium" | "low",
  "narrative": "A concise sentence describing the editorial narrative",
  "emotion": "A concise description of the emotional atmosphere",
  "camera": {
    "angle": "dramatic angle / high angle / low angle",
    "lens": "lens type e.g. 24mm wide / 50mm portrait",
    "movement": "implied camera movement",
    "depth": "depth of field description"
  },
  "environment": {
    "location": "location description",
    "time": "time of day / lighting state",
    "weather": "atmospheric details",
    "architecture": "architectural style"
  },
  "subjects": [
    { "type": "subject description", "importance": "primary" | "secondary" | "background", "position": "center" | "left" | "right" }
  ],
  "lighting": {
    "primary": "main light source",
    "secondary": "accent lighting",
    "ambient": "ambient environment light",
    "volumetric": true
  },
  "motion": {
    "type": "motion design elements",
    "intensity": "subtle" | "moderate" | "dynamic" | "extreme",
    "direction": "direction of movement"
  },
  "symbolism": ["symbolic motif 1", "symbolic motif 2"],
  "composition": {
    "rule": "composition rule e.g. rule of thirds / symmetry",
    "focal_point": "primary focus point",
    "balance": "compositional balance type",
    "depth_layers": 3
  },
  "workflow": "breaking-fast" | "premium-cinematic" | "cybercrime-dark" | "afrofuturist" | "market-chart" | "thumbnail-optimized" | "social-crop",
  "style_profile": "crypto-core" | "tradfi-institutional" | "ai-futurism" | "cybercrime-dark" | "regulation-authority" | "afrofuturism" | "latam-frontier" | "caribbean-digital" | "crypto-tradfi-fusion" | "startup-energy",
  "regional_profile": "global" | "africa-west" | "africa-east" | "africa-south" | "latam-brazil" | "latam-spanish" | "caribbean" | "middle-east" | "asia" | "europe" | "americas"
}`;

      const userPrompt = `Headline: "${headline || 'Cryptocurrency news update'}"
Topic: "${narrative.topic}"
Story Type: "${narrative.story_type}"
Urgency: "${narrative.urgency}"
Sentiment: "${narrative.sentiment}"
Market Emotion: "${narrative.market_emotion}"
Geopolitical Tension Score: ${narrative.geopolitical_tension}
Institutional vs Retail: "${narrative.institutional_vs_retail}"
Region Context: "${region || 'global'}"
Archetypes: ${JSON.stringify(narrative.symbolic_archetypes)}
Keywords: ${JSON.stringify(narrative.keywords)}

Create a highly detailed, brand-compliant, and cinematic scene plan in JSON based on the above narrative parameters. Output raw JSON only.`;

      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false,
          options: {
            temperature: 0.2
          }
        }),
        signal: AbortSignal.timeout(6000) // 6 seconds timeout max
      });

      if (!response.ok) {
        throw new Error(`Ollama response error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      let content = data.message?.content || '';

      // Strip think block if DeepSeek is used
      if (content.includes('<think>')) {
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      }

      // Find JSON block if it has markdown formatting
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      const parsedPlan = JSON.parse(content);
      
      if (this.validateScenePlan(parsedPlan)) {
        console.log(`[ScenePlanner] Successfully parsed and validated scene plan from LLM.`);
        return parsedPlan as ScenePlan;
      } else {
        console.warn(`[ScenePlanner] LLM output missing required fields. Falling back to rule-based plan.`);
      }
    } catch (error: any) {
      console.warn(`[ScenePlanner] LLM scene planning failed/timed out: ${error.message}. Falling back to rule-based plan.`);
    }

    return defaultPlan;
  }

  /**
   * Validate that the LLM response contains the complete required structure.
   */
  private validateScenePlan(plan: any): plan is ScenePlan {
    if (!plan || typeof plan !== 'object') return false;

    const requiredFields = [
      'story_type', 'urgency', 'narrative', 'emotion',
      'camera', 'environment', 'subjects', 'lighting',
      'motion', 'symbolism', 'composition', 'workflow',
      'style_profile', 'regional_profile'
    ];

    for (const field of requiredFields) {
      if (!(field in plan)) return false;
    }

    if (typeof plan.camera !== 'object' || !plan.camera.angle || !plan.camera.lens) return false;
    if (typeof plan.environment !== 'object' || !plan.environment.location || !plan.environment.time) return false;
    if (!Array.isArray(plan.subjects) || plan.subjects.length === 0) return false;
    if (typeof plan.lighting !== 'object' || !plan.lighting.primary) return false;
    if (typeof plan.motion !== 'object' || !plan.motion.type) return false;
    if (!Array.isArray(plan.symbolism)) return false;
    if (typeof plan.composition !== 'object' || !plan.composition.rule) return false;

    return true;
  }

  /**
   * Rule-based scene planner (fallback/offline method).
   */
  private planRuleBased(
    narrative: NarrativeAnalysis,
    emotion: EmotionAnalysis,
    region?: string
  ): ScenePlan {
    const storyType = narrative.story_type;
    const storyConfig = getStoryTypeConfig(storyType);
    const regionalProfile = getRegionalProfile(region);

    const camera = this.planCamera(storyType, narrative);
    const environment = this.planEnvironment(storyType, narrative, regionalProfile.id);
    const subjects = this.planSubjects(narrative, storyType);
    const lighting = this.planLighting(storyType, emotion);
    const motion = this.planMotion(storyType);
    const symbolism = this.planSymbolism(storyType, narrative);
    const composition = this.planComposition(storyType);
    const workflow = storyConfig.workflow;
    const styleProfile = this.selectStyleProfile(storyType, narrative);

    // Look for default matching fallback to keep structure, or assemble dynamically
    const baseDefault = sceneDefaults[storyType] || sceneDefaults['premium-feature'];

    return {
      ...baseDefault,
      story_type: storyType,
      urgency: narrative.urgency,
      narrative: this.buildNarrativeAbstraction(narrative, emotion),
      emotion: `${emotion.primary_emotion}${emotion.secondary_emotion ? ' with ' + emotion.secondary_emotion : ''}`,
      camera,
      environment,
      subjects,
      lighting,
      motion,
      symbolism,
      composition,
      workflow,
      style_profile: styleProfile,
      regional_profile: regionalProfile.id,
    };
  }

  private planCamera(storyType: StoryType, narrative: NarrativeAnalysis): CameraDirective {
    const base = getCameraDirective(storyType, narrative.topic);

    if (narrative.urgency === 'critical') {
      return { ...base, movement: 'rapid urgent push-in', depth: 'compressed dramatic' };
    }

    if (narrative.institutional_vs_retail === 'institutional') {
      return { ...base, angle: `${base.angle}, institutional authority perspective` };
    }

    return base;
  }

  private planEnvironment(
    storyType: StoryType,
    narrative: NarrativeAnalysis,
    region: RegionalProfile
  ): EnvironmentDirective {
    const contexts = getSymbolContexts(storyType);
    const location = contexts.length > 0
      ? contexts[Math.floor(Math.random() * contexts.length)]
      : 'futuristic digital environment';

    const regionalProfile = getRegionalProfile(region);
    const envOverride = regionalProfile.environments?.length
      ? regionalProfile.environments[Math.floor(Math.random() * regionalProfile.environments.length)]
      : undefined;

    const timeMap: Record<string, string> = {
      'breaking-news': 'night with emergency lighting',
      'premium-feature': 'golden hour cinematic',
      'market-analysis': 'night trading session',
      cybercrime: 'deep night',
      regulation: 'formal daytime',
      'ai-future': 'timeless synthetic',
      afrofuturism: 'warm sunset to twilight',
      'startup-vc': 'dawn of innovation',
    };

    return {
      location: envOverride || location,
      time: timeMap[storyType] || 'cinematic twilight',
      weather: this.getAtmosphere(storyType, narrative),
      architecture: regionalProfile.architecture?.[0] || 'futuristic tech architecture',
    };
  }

  private getAtmosphere(storyType: StoryType, narrative: NarrativeAnalysis): string {
    if (storyType === 'breaking-news') return 'stormy volatile atmosphere';
    if (storyType === 'cybercrime') return 'oppressive dark haze';
    if (storyType === 'afrofuturism') return 'humid tropical with digital particles';
    if (narrative.sentiment === 'bullish') return 'clear expansive atmosphere';
    if (narrative.sentiment === 'bearish') return 'ominous overcast tension';
    return 'atmospheric cinematic haze';
  }

  private planSubjects(
    narrative: NarrativeAnalysis,
    storyType: StoryType
  ): SubjectDirective[] {
    const symbols = getSymbols(storyType, 3);
    const subjects: SubjectDirective[] = [];

    if (symbols.length > 0) {
      subjects.push({
        type: symbols[0],
        importance: 'primary',
        position: 'center',
      });
    }

    for (let i = 1; i < symbols.length; i++) {
      subjects.push({
        type: symbols[i],
        importance: 'secondary',
        position: i === 1 ? 'left-background' : 'right-background',
      });
    }

    for (const entity of narrative.entities.slice(0, 2)) {
      const entitySymbol = this.entityToVisualSubject(entity);
      if (entitySymbol && !subjects.some(s => s.type === entitySymbol)) {
        subjects.push({
          type: entitySymbol,
          importance: 'secondary',
        });
      }
    }

    return subjects.slice(0, 5);
  }

  private entityToVisualSubject(entity: string): string | null {
    const mapping: Record<string, string> = {
      bitcoin: 'massive holographic bitcoin',
      ethereum: 'glowing ethereum diamond',
      binance: 'exchange trading terminal',
      coinbase: 'institutional trading platform',
      sec: 'regulatory enforcement hologram',
      blackrock: 'institutional asset management complex',
      solana: 'high-speed blockchain stream',
      ripple: 'cross-border payment network',
      'south africa': 'Johannesburg financial skyline',
      nigeria: 'Lagos fintech district',
      kenya: 'Nairobi innovation hub',
      brazil: 'São Paulo Faria Lima fintech towers',
      mexico: 'Mexico City CDMX crypto district',
      argentina: 'Buenos Aires Puerto Madero tech hub',
      colombia: 'Bogotá startup corridor with Andes backdrop',
      'el salvador': 'Bitcoin Beach Chivo wallet kiosk',
      venezuela: 'Venezuelan diaspora crypto remittance bridge',
      bahamas: 'Nassau CBDC sand dollar terminal',
      'cayman islands': 'Cayman Islands offshore crypto fund towers',
      jamaica: 'Kingston digital exchange plaza',
      'puerto rico': 'Condado crypto corridor',
      nubank: 'Nubank purple fintech holographic interface',
      'mercado libre': 'Mercado Libre crypto marketplace terminal',
    };

    return mapping[entity.toLowerCase()] || null;
  }

  private planLighting(storyType: StoryType, emotion: EmotionAnalysis): LightingDirective {
    const base = getLightingDirective(storyType);

    if (emotion.color_temperature === 'warm') {
      return { ...base, ambient: `${base.ambient}, warm emotional undertone` };
    }
    if (emotion.color_temperature === 'cool') {
      return { ...base, ambient: `${base.ambient}, cold analytical undertone` };
    }

    return base;
  }

  private planMotion(storyType: StoryType): MotionDirective {
    return getMotionDirective(storyType);
  }

  private planSymbolism(storyType: StoryType, narrative: NarrativeAnalysis): string[] {
    const baseSymbols = getSymbols(storyType, 4);
    const archetypeSymbols = narrative.symbolic_archetypes.map(a => `${a} visual motif`);
    return [...new Set([...baseSymbols, ...archetypeSymbols])].slice(0, 6);
  }

  private planComposition(storyType: StoryType): CompositionDirective {
    return getCompositionDirective(storyType);
  }

  private selectStyleProfile(storyType: StoryType, narrative: NarrativeAnalysis): StyleProfile {
    if (storyType === 'afrofuturism' || narrative.symbolic_archetypes.includes('african emergence')) {
      return 'afrofuturism';
    }
    if (narrative.symbolic_archetypes.includes('latam crypto adoption') || narrative.topic === 'latam') {
      return 'latam-frontier';
    }
    if (narrative.symbolic_archetypes.includes('caribbean digital islands') || narrative.topic === 'caribbean') {
      return 'caribbean-digital';
    }
    if (storyType === 'cybercrime') return 'cybercrime-dark';
    if (storyType === 'regulation') return 'regulation-authority';
    if (storyType === 'ai-future') return 'ai-futurism';

    if (narrative.institutional_vs_retail === 'institutional' && narrative.topic === 'etf') {
      return 'crypto-tradfi-fusion';
    }
    if (narrative.institutional_vs_retail === 'institutional') {
      return 'tradfi-institutional';
    }

    if (storyType === 'startup-vc') return 'startup-energy';

    return 'crypto-core';
  }

  private buildNarrativeAbstraction(
    narrative: NarrativeAnalysis,
    emotion: EmotionAnalysis
  ): string {
    const topicDesc = narrative.topic.replace(/-/g, ' ');
    const archetypes = narrative.symbolic_archetypes.join(' and ');
    const emotionDesc = emotion.primary_emotion;

    return `${topicDesc} narrative of ${archetypes || narrative.market_emotion}, conveying ${emotionDesc}`;
  }
}

export default ScenePlanner;
