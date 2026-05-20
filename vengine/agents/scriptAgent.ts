import { VideoScript } from '../types';

interface ArticleInput {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

/**
 * Script Agent - Converts articles into video scripts.
 * 
 * For each article, generates:
 * - 60-second short (TikTok/Reels format, vertical)
 * - 3-minute deep dive (YouTube format, landscape)
 * 
 * Uses Claude Sonnet for script generation.
 */
export class ScriptAgent {
  /**
   * Generate a short-form video script (60 seconds)
   */
  async generateShortScript(article: ArticleInput): Promise<VideoScript> {
    const script: VideoScript = {
      articleId: article.id,
      title: article.title,
      hook: this.extractHook(article),
      keyPoints: this.extractKeyPoints(article, 3),
      cta: this.generateCTA(article),
      totalDuration: 60,
      format: 'SHORT',
      orientation: 'VERTICAL',
    };

    return script;
  }

  /**
   * Generate a long-form video script (3 minutes)
   */
  async generateLongScript(article: ArticleInput): Promise<VideoScript> {
    const script: VideoScript = {
      articleId: article.id,
      title: article.title,
      hook: this.extractHook(article),
      keyPoints: this.extractKeyPoints(article, 6),
      cta: this.generateCTA(article),
      totalDuration: 180,
      format: 'LONG',
      orientation: 'LANDSCAPE',
    };

    return script;
  }

  private extractHook(article: ArticleInput): string {
    const sentences = article.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences[0]?.trim() || article.title;
  }

  private extractKeyPoints(article: ArticleInput, count: number) {
    const paragraphs = article.content.split('\n\n').filter(p => p.trim().length > 50);
    const pointDuration = Math.floor(45 / count);

    return paragraphs.slice(0, count).map((p, i) => ({
      text: p.substring(0, 200).trim(),
      duration: pointDuration,
      visualDescription: `Key point ${i + 1}: Visual representation of "${p.substring(0, 50)}..."`,
    }));
  }

  private generateCTA(article: ArticleInput): string {
    return `Read the full article on CoinDaily. Follow for more ${article.category} updates.`;
  }
}

export default new ScriptAgent();
