import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadBase64ImageToCdn } from '../services/b2MediaService';

const router = Router();

function allowPipelineOrUser(req: Request, res: Response, next: NextFunction) {
  const serviceToken = process.env.AI_PIPELINE_SERVICE_TOKEN;
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';
  if (serviceToken && bearer === serviceToken) {
    next();
    return;
  }
  return authMiddleware(req, res, next);
}

router.post('/upload', allowPipelineOrUser, async (req: Request, res: Response) => {
  try {
    const { image, prefix } = req.body;
    if (!image) {
      res.status(400).json({ success: false, error: 'image required (base64 or data URL)' });
      return;
    }
    const url = await uploadBase64ImageToCdn(image, prefix || 'uploads');
    res.json({ success: true, url });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
