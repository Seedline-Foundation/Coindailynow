/**
 * Prompt Composer
 * Translates structured Scene Plans into optimized generation prompts.
 *
 * The LLM does NOT generate final prompts directly.
 * Instead: Scene Planner → Structured JSON → Prompt Composer
 * This gives consistency, auditability, optimization, and easier upgrades.
 */

import { ScenePlan, StoryType } from '../types';
import { buildColorInstruction, getColorPalette } from '../visual-bible/color';
import { buildNegativePrompt, getDomainFromStoryType } from '../visual-bible/negative-rules';
import { buildRegionalInstruction, getRegionalProfile } from '../visual-bible/regional';

export class PromptComposer {
  /**
   * Compose a complete positive prompt from a scene plan.
   */
  composePositive(scene: ScenePlan): string {
    const parts: string[] = [];

    parts.push(this.buildQualityPrefix(scene.story_type));
    parts.push(this.buildSceneDescription(scene));
    parts.push(this.buildCameraInstruction(scene));
    parts.push(this.buildEnvironmentInstruction(scene));
    parts.push(this.buildSubjectInstruction(scene));
    parts.push(this.buildLightingInstruction(scene));
    parts.push(this.buildMotionInstruction(scene));
    parts.push(this.buildSymbolismInstruction(scene));
    parts.push(this.buildCompositionInstruction(scene));

    const palette = getColorPalette(scene.story_type);
    parts.push(buildColorInstruction(palette));

    if (scene.regional_profile !== 'global') {
      const regional = getRegionalProfile(scene.regional_profile);
      parts.push(buildRegionalInstruction(regional));
    }

    parts.push(this.buildStyleSuffix(scene));

    return parts
      .filter(p => p.length > 0)
      .join(', ');
  }

  /**
   * Compose a complete negative prompt from the scene plan.
   */
  composeNegative(scene: ScenePlan): string {
    const domain = getDomainFromStoryType(scene.story_type);
    return buildNegativePrompt(domain);
  }

  /**
   * Compose both positive and negative prompts.
   */
  compose(scene: ScenePlan): { positive: string; negative: string } {
    return {
      positive: this.composePositive(scene),
      negative: this.composeNegative(scene),
    };
  }

  private buildQualityPrefix(storyType: StoryType): string {
    const premiumTypes: StoryType[] = ['premium-feature', 'afrofuturism', 'ai-future'];

    if (premiumTypes.includes(storyType)) {
      return 'masterpiece, best quality, ultra detailed, 8k resolution, professional photography, cinematic composition';
    }

    if (storyType === 'thumbnail-fast') {
      return 'high contrast, bold composition, clear focal point, professional quality';
    }

    return 'best quality, detailed, professional, cinematic lighting, 4k resolution';
  }

  private buildSceneDescription(scene: ScenePlan): string {
    return `scene depicting ${scene.narrative}, emotional atmosphere of ${scene.emotion}`;
  }

  private buildCameraInstruction(scene: ScenePlan): string {
    const cam = scene.camera;
    const parts = [
      `camera angle: ${cam.angle}`,
      `lens: ${cam.lens}`,
    ];
    if (cam.movement !== 'static') {
      parts.push(`implied movement: ${cam.movement}`);
    }
    parts.push(`depth of field: ${cam.depth}`);
    return parts.join(', ');
  }

  private buildEnvironmentInstruction(scene: ScenePlan): string {
    const env = scene.environment;
    return `environment: ${env.location}, time: ${env.time}, atmosphere: ${env.weather}, architecture style: ${env.architecture}`;
  }

  private buildSubjectInstruction(scene: ScenePlan): string {
    const primary = scene.subjects.filter(s => s.importance === 'primary');
    const secondary = scene.subjects.filter(s => s.importance === 'secondary');

    const parts: string[] = [];
    if (primary.length > 0) {
      parts.push(`primary focal subject: ${primary.map(s => s.type).join(' and ')}`);
    }
    if (secondary.length > 0) {
      parts.push(`secondary elements: ${secondary.map(s => s.type).join(', ')}`);
    }
    return parts.join(', ');
  }

  private buildLightingInstruction(scene: ScenePlan): string {
    const lit = scene.lighting;
    const parts = [`lighting: ${lit.primary}`];
    if (lit.secondary) parts.push(lit.secondary);
    if (lit.volumetric) parts.push('volumetric god rays');
    if (lit.ambient) parts.push(`ambient: ${lit.ambient}`);
    return parts.join(', ');
  }

  private buildMotionInstruction(scene: ScenePlan): string {
    const mot = scene.motion;
    if (mot.intensity === 'subtle') {
      return `subtle motion suggestion: ${mot.type}`;
    }
    return `dynamic motion: ${mot.type}, ${mot.intensity} intensity${mot.direction ? ', direction: ' + mot.direction : ''}`;
  }

  private buildSymbolismInstruction(scene: ScenePlan): string {
    if (scene.symbolism.length === 0) return '';
    return `symbolic elements: ${scene.symbolism.join(', ')}`;
  }

  private buildCompositionInstruction(scene: ScenePlan): string {
    const comp = scene.composition;
    return `composition: ${comp.rule}, focal point: ${comp.focal_point}, balance: ${comp.balance}${comp.depth_layers ? ', depth layers: ' + comp.depth_layers : ''}`;
  }

  private buildStyleSuffix(scene: ScenePlan): string {
    const styleMap: Record<string, string> = {
      'crypto-core': 'cyberpunk crypto aesthetic, neon blockchain art',
      'tradfi-institutional': 'institutional financial aesthetic, clean corporate design',
      'ai-futurism': 'synthetic intelligence aesthetic, neural art style',
      'cybercrime-dark': 'dark cyber infiltration aesthetic, surveillance noir',
      'regulation-authority': 'institutional authority aesthetic, formal governance design',
      afrofuturism: 'African futurism aesthetic, pan-African tech innovation art',
      'latam-frontier': 'Latin American crypto frontier aesthetic, tropical fintech revolution, remittance innovation art',
      'caribbean-digital': 'Caribbean digital island aesthetic, turquoise offshore innovation, CBDC paradise art',
      'crypto-tradfi-fusion': 'institutional crypto aesthetic, finance meets blockchain',
      'startup-energy': 'innovation startup aesthetic, dynamic entrepreneurship art',
    };

    return styleMap[scene.style_profile] || 'professional editorial aesthetic';
  }
}

export default PromptComposer;
