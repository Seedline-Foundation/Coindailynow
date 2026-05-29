import { Router, Request, Response } from 'express';
import _prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const prisma = _prisma as any;
const router = Router();

// All ticket routes require authentication
router.use(authMiddleware);

/**
 * GET /api/tickets
 * Retrieves a paginated list of support tickets for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { status, search, page, limit } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
      feedbackType: 'TICKET'
    };

    if (status === 'open') {
      where.isResolved = false;
    } else if (status === 'resolved') {
      where.isResolved = true;
    }

    if (search) {
      where.OR = [
        { ticketId: { contains: search as string, mode: 'insensitive' } },
        { comment: { contains: search as string, mode: 'insensitive' } },
        { metadata: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.userFeedback.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tickets
 * Creates a new support ticket
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { subject, message, category, priority } = req.body;

    if (!subject || !message || !category) {
      return res.status(400).json({ error: 'Subject, message, and category are required' });
    }

    const ticketIdStr = `TR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const initialMetadata = {
      subject,
      responses: []
    };

    const ticket = await prisma.userFeedback.create({
      data: {
        userId,
        feedbackType: 'TICKET',
        feedbackCategory: category,
        severity: priority || 'normal',
        comment: message,
        ticketId: ticketIdStr,
        metadata: JSON.stringify(initialMetadata),
        isResolved: false
      }
    });

    return res.status(201).json({
      data: ticket
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tickets/:id
 * Appends a reply message to the ticket's responses list
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const username = (req as any).user!.username || 'User';
    const ticketId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ticket = await prisma.userFeedback.findUnique({
      where: { id: ticketId }
    });

    if (!ticket || ticket.userId !== userId || ticket.feedbackType !== 'TICKET') {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    let meta = { subject: '', responses: [] as any[] };
    if (ticket.metadata) {
      try {
        meta = JSON.parse(ticket.metadata);
      } catch (e) {
        meta = { subject: ticket.comment || 'Support Ticket', responses: [] };
      }
    }

    if (!meta.responses) meta.responses = [];

    const newResponse = {
      id: crypto.randomUUID(),
      author: username,
      authorRole: 'USER',
      message,
      createdAt: new Date().toISOString()
    };

    meta.responses.push(newResponse);

    // If the ticket was resolved, replying will reopen it
    const updatedTicket = await prisma.userFeedback.update({
      where: { id: ticketId },
      data: {
        metadata: JSON.stringify(meta),
        isResolved: false,
        resolvedAt: null,
        updatedAt: new Date()
      }
    });

    return res.json({
      data: updatedTicket
    });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
