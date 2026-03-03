import db from '../database/connection';

export class AuditService {

  async log(data: {
    action: string;
    actor: string;
    entity_type?: string;
    entity_id?: string;
    old_value?: any;
    new_value?: any;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await db.query(
      `INSERT INTO audit_log (id, action, actor, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        db.generateId(), data.action, data.actor,
        data.entity_type || null, data.entity_id || null,
        data.old_value ? JSON.stringify(data.old_value) : null,
        data.new_value ? JSON.stringify(data.new_value) : null,
        data.ip_address || null, data.user_agent || null
      ]
    );
  }

  async getAuditTrail(filters?: {
    entity_type?: string;
    entity_id?: string;
    actor?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: any[]; total: number }> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.entity_type) { params.push(filters.entity_type); whereClause += ` AND entity_type = $${params.length}`; }
    if (filters?.entity_id) { params.push(filters.entity_id); whereClause += ` AND entity_id = $${params.length}::uuid`; }
    if (filters?.actor) { params.push(filters.actor); whereClause += ` AND actor = $${params.length}`; }
    if (filters?.action) { params.push(filters.action); whereClause += ` AND action = $${params.length}`; }
    if (filters?.start_date) { params.push(filters.start_date); whereClause += ` AND created_at >= $${params.length}`; }
    if (filters?.end_date) { params.push(filters.end_date); whereClause += ` AND created_at <= $${params.length}`; }

    const countResult = await db.query(`SELECT COUNT(*) FROM audit_log WHERE ${whereClause}`, params);
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    params.push(limit, offset);

    const result = await db.query(
      `SELECT * FROM audit_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { entries: result.rows, total: parseInt(countResult.rows[0].count) };
  }
}

export const auditService = new AuditService();
