import { Router, Request, Response } from 'express';
import AIModerationService from '../services/aiModerationService';
import ContentModerationAgent from '../agents/moderation/contentModerationAgent';
import prisma from '../lib/prisma';
import { getRedis } from '../lib/redis';

const router = Router();
const perspectiveModeration = new AIModerationService(
  prisma,
  getRedis(),
  process.env.PERSPECTIVE_API_KEY || process.env.GOOGLE_PERSPECTIVE_API_KEY || '',
);
const moderationAgent = new ContentModerationAgent();

router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { text, contentId } = req.body;
    if (!text) {
      res.status(400).json({ success: false, error: 'text required' });
      return;
    }

    const agentTask = await moderationAgent.execute(
      { text, contentId: contentId || `scan_${Date.now()}` },
      'high',
    );
    const agentResult = (agentTask as { output?: Record<string, unknown> }).output || {};

    const agentAllowed =
      agentResult?.allowed !== false && Number(agentResult?.score ?? 0) < 0.85;

    const result = await perspectiveModeration.moderateContent({
      contentId: contentId || `scan_${Date.now()}`,
      contentType: 'article',
      text,
      userId: 'system',
    } as any);

    const allowed = agentAllowed && (result as { allowed?: boolean }).allowed !== false;

    res.json({
      success: true,
      allowed,
      agent: agentResult,
      perspective: result,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
