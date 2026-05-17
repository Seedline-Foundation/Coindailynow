/**
 * AI-1-4: Content moderation agent — delegates to backend Perspective/rules when available.
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class ContentModerationAgent extends BaseAgent {
  constructor() {
    super({
      id: 'content-moderation-agent',
      name: 'Content Moderation Agent',
      type: 'moderation',
      category: 'content',
      description: 'Screens UGC and articles for policy violations before publish.',
      capabilities: ['toxicity_detection', 'spam_detection', 'policy_enforcement'],
      model: 'llama',
      timeoutMs: 60000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { text, contentId } = task.input;
    const apiBase = process.env.BACKEND_API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${apiBase}/api/moderation/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, contentId }),
      });
      if (res.ok) return (await res.json()) as Record<string, any>;
    } catch {
      /* local heuristic fallback */
    }

    const lower = String(text || '').toLowerCase();
    const blocked = ['scam guaranteed', 'double your bitcoin'].some((p) => lower.includes(p));

    return {
      allowed: !blocked,
      score: blocked ? 0.95 : 0.1,
      labels: blocked ? ['spam'] : [],
      source: 'local_heuristic',
    };
  }
}

export default ContentModerationAgent;
