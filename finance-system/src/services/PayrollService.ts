import db from '../database/connection';
import { StaffPayroll, PayrollSchedule } from '../types';
import { paymentProcessor } from './PaymentProcessor';
import { notificationService } from './NotificationService';
import { auditService } from './AuditService';

/**
 * PayrollService
 * Staff are paid from CFIS every month on a date set by Super Admin.
 * Super Admin creates payroll schedules, CFIS auto-executes on pay day.
 */
export class PayrollService {

  async createSchedule(data: {
    staffWalletId: string;
    staffName: string;
    monthlyAmount: number;
    currency?: string;
    payDayOfMonth: number;
    createdBy: string;
  }): Promise<PayrollSchedule> {
    if (data.payDayOfMonth < 1 || data.payDayOfMonth > 28) {
      throw new Error('Pay day must be between 1 and 28');
    }

    const id = db.generateId();
    const result = await db.query<PayrollSchedule>(
      `INSERT INTO payroll_schedule (id, staff_wallet_id, staff_name, monthly_amount, currency, pay_day_of_month, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       RETURNING *`,
      [id, data.staffWalletId, data.staffName, data.monthlyAmount, data.currency || 'JY', data.payDayOfMonth, data.createdBy]
    );

    await notificationService.notifySuperAdmin(
      `Payroll Schedule Created — ${data.staffName}`,
      `${data.monthlyAmount} ${data.currency || 'JY'}/month on day ${data.payDayOfMonth}`,
      'PAYROLL', 'LOW'
    );

    await auditService.log({
      action: 'PAYROLL_SCHEDULE_CREATED',
      actor: data.createdBy,
      entity_type: 'PAYROLL_SCHEDULE',
      entity_id: id,
      new_value: { staffName: data.staffName, amount: data.monthlyAmount, payDay: data.payDayOfMonth }
    });

    return result.rows[0];
  }

  async updateSchedule(scheduleId: string, updates: Partial<{ monthlyAmount: number; payDayOfMonth: number; isActive: boolean }>, updatedBy: string): Promise<PayrollSchedule> {
    const current = await db.query('SELECT * FROM payroll_schedule WHERE id = $1', [scheduleId]);
    if (!current.rows[0]) throw new Error(`Schedule ${scheduleId} not found`);

    const sets: string[] = [];
    const params: any[] = [];
    if (updates.monthlyAmount !== undefined) { params.push(updates.monthlyAmount); sets.push(`monthly_amount = $${params.length}`); }
    if (updates.payDayOfMonth !== undefined) { params.push(updates.payDayOfMonth); sets.push(`pay_day_of_month = $${params.length}`); }
    if (updates.isActive !== undefined) { params.push(updates.isActive); sets.push(`is_active = $${params.length}`); }
    sets.push('updated_at = NOW()');
    params.push(scheduleId);

    const result = await db.query<PayrollSchedule>(
      `UPDATE payroll_schedule SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    await auditService.log({
      action: 'PAYROLL_SCHEDULE_UPDATED',
      actor: updatedBy,
      entity_type: 'PAYROLL_SCHEDULE',
      entity_id: scheduleId,
      old_value: current.rows[0],
      new_value: result.rows[0]
    });

    return result.rows[0];
  }

  async getSchedules(activeOnly = true): Promise<PayrollSchedule[]> {
    const query = activeOnly
      ? 'SELECT * FROM payroll_schedule WHERE is_active = true ORDER BY staff_name'
      : 'SELECT * FROM payroll_schedule ORDER BY staff_name';
    const result = await db.query<PayrollSchedule>(query);
    return result.rows;
  }

  // Called daily by cron to check if any payrolls are due
  async processMonthlyPayroll(): Promise<{ processed: number; failed: number }> {
    const today = new Date();
    const dayOfMonth = today.getDate();

    const schedules = await db.query<PayrollSchedule>(
      'SELECT * FROM payroll_schedule WHERE is_active = true AND pay_day_of_month = $1',
      [dayOfMonth]
    );

    if (schedules.rows.length === 0) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;

    for (const schedule of schedules.rows) {
      // Check if already paid this month
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const alreadyPaid = await db.query(
        `SELECT id FROM staff_payroll WHERE staff_wallet_id = $1 AND EXTRACT(MONTH FROM pay_date) = $2 AND EXTRACT(YEAR FROM pay_date) = $3 AND status IN ('SCHEDULED','PROCESSING','COMPLETED')`,
        [schedule.staff_wallet_id, month, year]
      );

      if (alreadyPaid.rows.length > 0) continue; // Already processed

      try {
        // Create payroll record
        const payrollId = db.generateId();
        await db.query(
          `INSERT INTO staff_payroll (id, staff_wallet_id, staff_name, staff_role, amount, currency, pay_date, pay_period_start, pay_period_end, status)
           VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8, 'SCHEDULED')`,
          [payrollId, schedule.staff_wallet_id, schedule.staff_name, schedule.monthly_amount, schedule.currency,
           today, new Date(year, today.getMonth(), 1), new Date(year, today.getMonth() + 1, 0)]
        );

        // Process via PaymentProcessor
        await paymentProcessor.processStaffPayroll({
          staffWalletId: schedule.staff_wallet_id,
          staffName: schedule.staff_name,
          amount: parseFloat(String(schedule.monthly_amount)),
          payrollId
        });

        await db.query("UPDATE staff_payroll SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1", [payrollId]);
        processed++;

      } catch (error: any) {
        failed++;
        console.error(`Payroll failed for ${schedule.staff_name}: ${error.message}`);
        await notificationService.notifySuperAdmin(
          `Payroll FAILED — ${schedule.staff_name}`,
          `Error: ${error.message}`,
          'PAYROLL', 'CRITICAL'
        );
      }
    }

    if (schedules.rows.length > 0) {
      await notificationService.notifySuperAdmin(
        `Monthly Payroll: ${processed} paid, ${failed} failed`,
        `Processed payroll for day ${dayOfMonth} of the month.`,
        'PAYROLL', failed > 0 ? 'CRITICAL' : 'MEDIUM'
      );
    }

    return { processed, failed };
  }

  async getPayrollHistory(staffWalletId?: string): Promise<StaffPayroll[]> {
    let query = 'SELECT * FROM staff_payroll';
    const params: any[] = [];
    if (staffWalletId) {
      params.push(staffWalletId);
      query += ' WHERE staff_wallet_id = $1';
    }
    query += ' ORDER BY pay_date DESC';
    const result = await db.query<StaffPayroll>(query, params);
    return result.rows;
  }
}

export const payrollService = new PayrollService();
