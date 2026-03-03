import db from '../database/connection';
import { Notification, NotificationPriority } from '../types';

export class NotificationService {

  async create(data: {
    title: string;
    message: string;
    priority?: NotificationPriority;
    category?: string;
    reference_type?: string;
    reference_id?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const id = db.generateId();
    const result = await db.query<Notification>(
      `INSERT INTO notifications (id, recipient, title, message, priority, category, reference_type, reference_id, metadata)
       VALUES ($1, 'SUPER_ADMIN', $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id, data.title, data.message,
        data.priority || 'MEDIUM', data.category || null,
        data.reference_type || null, data.reference_id || null,
        JSON.stringify(data.metadata || {})
      ]
    );
    return result.rows[0];
  }

  async notifySuperAdmin(title: string, message: string, category: string, priority: NotificationPriority = 'MEDIUM', refType?: string, refId?: string): Promise<Notification> {
    return this.create({ title, message, priority, category, reference_type: refType, reference_id: refId });
  }

  async getUnread(): Promise<Notification[]> {
    const result = await db.query<Notification>(
      'SELECT * FROM notifications WHERE is_read = false ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async getAll(limit = 100, offset = 0): Promise<{ notifications: Notification[]; total: number }> {
    const countResult = await db.query('SELECT COUNT(*) FROM notifications');
    const result = await db.query<Notification>(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return { notifications: result.rows, total: parseInt(countResult.rows[0].count) };
  }

  async markRead(notificationId: string): Promise<void> {
    await db.query('UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1', [notificationId]);
  }

  async markAllRead(): Promise<void> {
    await db.query('UPDATE notifications SET is_read = true, read_at = NOW() WHERE is_read = false');
  }

  async getUnreadCount(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) FROM notifications WHERE is_read = false');
    return parseInt(result.rows[0].count);
  }
}

export const notificationService = new NotificationService();
