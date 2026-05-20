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

export class ScenePlanner {
  /**
   * Plan a complete cinematic scene from narrative + emotion analysis.
   */
  plan(
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
    const workflow = this.selectWorkflow(storyConfig.workflow);
    const styleProfile = this.selectStyleProfile(storyType, narrative);

    return {
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

  private selectWorkflow(workflowType: WorkflowType): WorkflowType {
    return workflowType;
  }

  private selectStyleProfile(storyType: StoryType, narrative: NarrativeAnalysis): StyleProfile {
    if (storyType === 'afrofuturism' || narrative.symbolic_archetypes.includes('african emergence')) {
      return 'afrofuturism';
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
