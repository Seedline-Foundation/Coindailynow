/**
 * AI Cost Control & Budget Management API (STUB)
 * See docs/ai-system/TASK_10.3_IMPLEMENTATION.md for full implementation
 */

import express, { Request, Response } from 'express';
import { aiCostService } from '../services/aiCostService';

const router = express.Router();

// Stub authentication middleware
function authenticate(req: Request, res: Response, next: Function): void {
  // Stub - always pass
  next();
}

function authorizeAdmin(req: Request, res: Response, next: Function): void {
  // Stub - always pass
  next();
}

// Health check
router.get('/health', (req: Request, res: Response): void => {
  res.json({
    status: 'stub_mode',
    message: 'AI Cost system is in stub mode. Run migration to activate full implementation.',
    documentation: 'docs/ai-system/TASK_10.3_IMPLEMENTATION.md'
  });
});

export default router;
