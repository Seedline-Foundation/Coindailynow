/**
 * Thumbnail Intelligence Engine
 * CTR Optimization — hero images and thumbnails are NOT the same thing.
 *
 * Handles:
 *  - Saliency-based focal point extraction
 *  - Platform-specific crop generation
 *  - Contrast and emotional clarity optimization
 *  - Mobile visibility validation
 */

import {
  ThumbnailPlan,
  PlatformCrop,
  ScenePlan,
  StoryType,
} from '../types';

const DEFAULT_PLATFORMS: PlatformCrop[] = [
  { platform: 'twitter', width: 1200, height: 675, crop_gravity: 'center' },
  { platform: 'youtube', width: 1280, height: 720, crop_gravity: 'attention' },
  { platform: 'telegram', width: 800, height: 418, crop_gravity: 'center' },
  { platform: 'homepage', width: 1200, height: 630, crop_gravity: 'attention' },
  { platform: 'mobile', width: 400, height: 300, crop_gravity: 'center' },
];

export class ThumbnailIntelligence {
  /**
   * Generate a thumbnail plan from a scene plan.
   */
  plan(scene: ScenePlan): ThumbnailPlan {
    const focalSubject = this.extractFocalSubject(scene);
    const emotion = this.extractThumbnailEmotion(scene);
    const cropFocus = this.determineCropFocus(scene);
    const contrast = this.determineContrast(scene.story_type);
    const mobileVisibility = this.assessMobileVisibility(scene);
    const platforms = this.selectPlatformVariants(scene.story_type);

    return {
      focal_subject: focalSubject,
      emotion,
      crop_focus: cropFocus,
      contrast,
      mobile_visibility: mobileVisibility,
      platform_variants: platforms,
    };
  }

  /**
   * Build thumbnail-specific prompt modifications.
   */
  buildThumbnailPromptOverrides(plan: ThumbnailPlan): {
    prompt_suffix: string;
    composition_override: string;
  } {
    const parts: string[] = [
      'single dominant focal point',
      `hero element: ${plan.focal_subject}`,
      `emotional clarity: ${plan.emotion}`,
      `contrast level: ${plan.contrast}`,
      'simplified composition',
      'strong silhouette',
      'no clutter',
      'no tiny elements',
    ];

    if (plan.mobile_visibility) {
      parts.push('mobile-optimized visibility', 'large readable elements');
    }

    return {
      prompt_suffix: parts.join(', '),
      composition_override: `thumbnail composition: ${plan.crop_focus} focused, ${plan.contrast} contrast, single hero subject`,
    };
  }

  /**
   * Validate that a generated thumbnail meets quality standards.
   */
  async validateThumbnail(
    imageBuffer: Buffer,
    plan: ThumbnailPlan
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const sizeKB = imageBuffer.length / 1024;
    if (sizeKB < 20) {
      issues.push('Image too small — likely low quality or corrupt');
    }

    if (sizeKB > 5000) {
      issues.push('Image too large — needs compression for fast loading');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private extractFocalSubject(scene: ScenePlan): string {
    const primary = scene.subjects.find(s => s.importance === 'primary');
    if (primary) return primary.type;
    return scene.symbolism[0] || 'cryptocurrency visual element';
  }

  private extractThumbnailEmotion(scene: ScenePlan): string {
    const emotionMap: Record<string, string> = {
      'breaking-news': 'urgent impact',
      'premium-feature': 'editorial authority',
      'market-analysis': 'data-driven clarity',
      cybercrime: 'dark threat',
      regulation: 'institutional weight',
      'ai-future': 'technological wonder',
      afrofuturism: 'cultural innovation',
      'startup-vc': 'explosive growth',
      'thumbnail-fast': 'instant recognition',
      'social-banner': 'shareable impact',
    };

    return emotionMap[scene.story_type] || scene.emotion.split(',')[0];
  }

  private determineCropFocus(scene: ScenePlan): ThumbnailPlan['crop_focus'] {
    const primarySubject = scene.subjects.find(s => s.importance === 'primary');

    if (!primarySubject?.position) return 'center';

    if (primarySubject.position.includes('left')) return 'left';
    if (primarySubject.position.includes('right')) return 'right';
    if (primarySubject.position.includes('top')) return 'top';
    if (primarySubject.position.includes('bottom')) return 'bottom';

    return 'center';
  }

  private determineContrast(storyType: StoryType): ThumbnailPlan['contrast'] {
    const highContrast: StoryType[] = ['breaking-news', 'cybercrime', 'thumbnail-fast'];
    const mediumContrast: StoryType[] = ['premium-feature', 'market-analysis', 'social-banner'];

    if (highContrast.includes(storyType)) return 'high';
    if (mediumContrast.includes(storyType)) return 'medium';
    return 'medium';
  }

  private assessMobileVisibility(scene: ScenePlan): boolean {
    const subjectCount = scene.subjects.length;
    const hasSimpleComposition = subjectCount <= 2;
    return hasSimpleComposition;
  }

  private selectPlatformVariants(storyType: StoryType): PlatformCrop[] {
    if (storyType === 'social-banner') {
      return DEFAULT_PLATFORMS.filter(p => ['twitter', 'telegram', 'youtube'].includes(p.platform));
    }

    if (storyType === 'thumbnail-fast') {
      return DEFAULT_PLATFORMS.filter(p => ['homepage', 'mobile'].includes(p.platform));
    }

    return DEFAULT_PLATFORMS;
  }
}

export default ThumbnailIntelligence;
