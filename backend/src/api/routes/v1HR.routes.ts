import { Router, Request, Response } from 'express';
import hrService from '../../services/hrService';

const router = Router();

// Vacancies
router.get('/vacancies', async (req: Request, res: Response) => {
  try {
    const result = await hrService.listVacancies({
      status: req.query.status as string,
      department: req.query.department as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vacancies', async (req: Request, res: Response) => {
  try {
    const createdBy = (req as any).user?.id;
    const vacancy = await hrService.createVacancy({ ...req.body, createdBy });
    res.status(201).json({ success: true, data: vacancy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Applications
router.post('/applications', async (req: Request, res: Response) => {
  try {
    const application = await hrService.submitApplication(req.body);
    res.status(201).json({ success: true, data: application });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/applications/:id/score', async (req: Request, res: Response) => {
  try {
    const scores = await hrService.scoreApplication(req.params.id);
    res.json({ success: true, data: scores });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/applications/:id/stage', async (req: Request, res: Response) => {
  try {
    const { stage, notes } = req.body;
    const application = await hrService.updateApplicationStage(req.params.id, stage, notes);
    res.json({ success: true, data: application });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/applications/:id/interview', async (req: Request, res: Response) => {
  try {
    const { date, interviewerIds } = req.body;
    const application = await hrService.scheduleInterview(req.params.id, new Date(date), interviewerIds);
    res.json({ success: true, data: application });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Onboarding
router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const { userId, applicationId } = req.body;
    const onboarding = await hrService.createOnboarding(userId, applicationId);
    res.status(201).json({ success: true, data: onboarding });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await hrService.getHRStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
