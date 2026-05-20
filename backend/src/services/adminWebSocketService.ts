/**
 * Admin real-time push channel.
 *
 * Provides a single emission API used by every backend surface that mutates
 * admin-facing state (editorial queue, AI tasks, finance approvals, content
 * moderation). Subscribers connect via Socket.IO under the `admin:*` rooms.
 *
 * Implements SPEC-ADM-3 ("Admin WebSocket subscriptions") at the
 * server-emit boundary; the admin app subscribes via Socket.IO from
 * `apps/admin/src/lib/adminSocket.ts`.
 */

import { logger } from '../utils/logger';

export type AdminChannel =
  | 'admin:editorial-queue'
  | 'admin:ai-tasks'
  | 'admin:finance-approvals'
  | 'admin:content-alerts'
  | 'admin:system-alerts';

let _io: any | null = null;

/**
 * Called once during server bootstrap with the Socket.IO server instance.
 * Avoids a circular import on WebSocketManager.
 */
export function registerAdminSocketServer(io: any) {
  _io = io;
}

function emit(channel: AdminChannel, event: string, payload: unknown) {
  if (!_io) {
    logger.debug('[adminWS] no socket server registered yet — drop event', { channel, event });
    return;
  }
  try {
    _io.to(channel).emit(event, {
      ...((payload as object) || {}),
      _ts: Date.now(),
    });
  } catch (e: any) {
    logger.warn('[adminWS] emit failed', { channel, event, error: e?.message });
  }
}

export function emitAdminQueueUpdate(payload: {
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'edit_requested' | 'published';
  itemId: string;
  status?: string;
  by?: string;
  at?: string;
}) {
  emit('admin:editorial-queue', 'queue_update', payload);
}

export function emitAiTaskUpdate(payload: {
  taskId: string;
  agentType: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  durationMs?: number;
}) {
  emit('admin:ai-tasks', 'task_update', payload);
}

export function emitFinanceApprovalRequest(payload: {
  approvalId: string;
  kind: 'WITHDRAWAL' | 'PAYROLL' | 'PRESS_PAYOUT' | 'BUYBACK';
  amount: number;
  currency: string;
  requestedBy: string;
  requestedAt: string;
}) {
  emit('admin:finance-approvals', 'approval_request', payload);
}

export function emitContentAlert(payload: {
  level: 'info' | 'warn' | 'critical';
  message: string;
  relatedId?: string;
}) {
  emit('admin:content-alerts', 'content_alert', payload);
}

export function emitSystemAlert(payload: {
  level: 'info' | 'warn' | 'critical';
  message: string;
  service?: string;
}) {
  emit('admin:system-alerts', 'system_alert', payload);
}
