import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { notificationService } from '../services/NotificationService';
import { auditService } from '../services/AuditService';

const router = Router();

// GET /api/notifications
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await notificationService.getAll(limit, offset);
    res.json({ data: result.notifications, total: result.total });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'NOTIFY_ERROR', message: error.message } });
  }
});

// GET /api/notifications/unread
router.get('/unread', async (req: AuthenticatedRequest, res) => {
  try {
    const notifications = await notificationService.getUnread();
    res.json({ data: notifications, count: notifications.length });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'UNREAD_ERROR', message: error.message } });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    await notificationService.markRead(req.params.id);
    res.json({ data: { message: 'Marked as read' } });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'MARK_ERROR', message: error.message } });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req: AuthenticatedRequest, res) => {
  try {
    await notificationService.markAllRead();
    res.json({ data: { message: 'All notifications marked as read' } });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'MARK_ALL_ERROR', message: error.message } });
  }
});

// GET /api/audit
router.get('/audit', async (req: AuthenticatedRequest, res) => {
  try {
    const { entity_type, actor, action, start_date, end_date, limit, offset } = req.query;
    const result = await auditService.getAuditTrail({
      entity_type: entity_type as string,
      actor: actor as string,
      action: action as string,
      start_date: start_date as string,
      end_date: end_date as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.json({ data: result.entries, total: result.total });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'AUDIT_ERROR', message: error.message } });
  }
});

export default router;
