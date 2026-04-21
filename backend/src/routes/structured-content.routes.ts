import { Router, Request, Response } from 'express';
import { structuredContentService } from '../services/structuredContentService';

const router = Router();

router.get('/content', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.per_page || 50);
    const entity = req.query.entity ? String(req.query.entity) : undefined;
    const language = req.query.language ? String(req.query.language) : undefined;
    const territory = req.query.territory ? String(req.query.territory) : undefined;

    const payload = await structuredContentService.getStructuredContent({
      page,
      perPage,
      entity,
      language,
      territory,
    });

    res.json(payload);
  } catch (error) {
    console.error('[StructuredContent] Failed to fetch /content payload:', error);
    res.status(500).json({
      error: {
        code: 'STRUCTURED_CONTENT_FAILED',
        message: 'Failed to build structured content feed',
      },
    });
  }
});

router.get('/entities/:slug', async (req: Request, res: Response) => {
  try {
    const entity = await structuredContentService.getEntityBySlug(req.params.slug);

    if (!entity) {
      return res.status(404).json({
        error: {
          code: 'ENTITY_NOT_FOUND',
          message: 'Entity does not exist in the knowledge graph',
        },
      });
    }

    return res.json(entity);
  } catch (error) {
    console.error('[StructuredContent] Failed to fetch entity payload:', error);
    return res.status(500).json({
      error: {
        code: 'ENTITY_LOOKUP_FAILED',
        message: 'Failed to resolve entity payload',
      },
    });
  }
});

router.get('/regulatory-timeline', async (req: Request, res: Response) => {
  try {
    const jurisdictions = req.query.jurisdiction
      ? String(req.query.jurisdiction)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const since = req.query.since ? new Date(String(req.query.since)) : undefined;
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.per_page || 50);

    const payload = await structuredContentService.getRegulatoryTimeline({
      jurisdictions,
      since: since && !Number.isNaN(since.getTime()) ? since : undefined,
      page,
      perPage,
    });

    res.json(payload);
  } catch (error) {
    console.error('[StructuredContent] Failed to fetch regulatory timeline payload:', error);
    res.status(500).json({
      error: {
        code: 'REGULATORY_TIMELINE_FAILED',
        message: 'Failed to build regulatory timeline payload',
      },
    });
  }
});

export default router;
