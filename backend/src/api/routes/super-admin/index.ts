/** Super Admin API — composed routers (BE-1-1) */
import { Router } from 'express';
import statsRouter from './stats.routes';
import usersRouter from './users.routes';
import alertsRouter from './alerts.routes';
import articlesRouter from './articles.routes';
import aiRouter from './ai.routes';
import rolesRouter from './roles.routes';
import contentRouter from './content.routes';
import monetizationRouter from './monetization.routes';
import panelRouter from './panel.routes';
import dailyTasksRouter from './daily-tasks.routes';

const router = Router();
router.use(statsRouter);
router.use(usersRouter);
router.use(alertsRouter);
router.use(articlesRouter);
router.use(aiRouter);
router.use(rolesRouter);
router.use(contentRouter);
router.use(monetizationRouter);
router.use(panelRouter);
router.use(dailyTasksRouter);

export default router;
