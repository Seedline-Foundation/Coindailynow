/**
 * Ticket API — In-memory ticket store for development
 * GET    /api/tickets            — list tickets (filtered by user token or all for admin)
 * POST   /api/tickets            — create new ticket
 *
 * Uses shared store so data persists across requests within the same server session.
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Shared In-Memory Ticket Store ────────────────────────────────────────────
export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: 'technical' | 'account' | 'billing' | 'feature' | 'content' | 'general';
  priority: 'low' | 'normal' | 'medium' | 'high' | 'critical';
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'awaiting-reply' | 'resolved' | 'closed';
  assignedTo?: string;
  responses: TicketResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketResponse {
  id: string;
  author: string;
  authorRole: 'user' | 'admin' | 'system';
  message: string;
  createdAt: string;
}

// Global store — survives across requests
declare global {
  var __ticketStore: Ticket[] | undefined;
}
if (!globalThis.__ticketStore) {
  globalThis.__ticketStore = [
    {
      id: 'TKT-1001',
      userId: 'user-001',
      userName: 'John Adeyemi',
      userEmail: 'john@example.com',
      category: 'technical',
      priority: 'high',
      subject: 'Unable to load portfolio page',
      message: 'When I click on Portfolio, the page keeps showing a loading spinner and never loads. I have tried refreshing and clearing cache. This started happening 2 days ago.',
      status: 'open',
      responses: [],
      createdAt: '2026-02-24T10:30:00Z',
      updatedAt: '2026-02-24T10:30:00Z',
    },
    {
      id: 'TKT-1002',
      userId: 'user-002',
      userName: 'Amina Okafor',
      userEmail: 'amina@example.com',
      category: 'billing',
      priority: 'medium',
      subject: 'Premium subscription not reflecting',
      message: 'I paid for the Premium tier via M-Pesa yesterday but my account still shows Free tier. Transaction reference: MPE2026022412345.',
      status: 'in-progress',
      assignedTo: 'Support Team',
      responses: [
        {
          id: 'resp-1',
          author: 'Support Team',
          authorRole: 'admin',
          message: 'Thank you for reaching out, Amina. We have located your transaction and are processing the upgrade. Please allow up to 4 hours for it to reflect.',
          createdAt: '2026-02-24T14:15:00Z',
        },
      ],
      createdAt: '2026-02-24T11:00:00Z',
      updatedAt: '2026-02-24T14:15:00Z',
    },
    {
      id: 'TKT-1003',
      userId: 'user-003',
      userName: 'Kwame Mensah',
      userEmail: 'kwame@example.com',
      category: 'feature',
      priority: 'normal',
      subject: 'Add Ghanaian cedi (GHS) to wallet',
      message: 'Hi team, could you add support for Ghanaian cedi in the wallet section? Currently I only see NGN and USD. Many of us in Ghana would appreciate this.',
      status: 'open',
      responses: [],
      createdAt: '2026-02-23T09:45:00Z',
      updatedAt: '2026-02-23T09:45:00Z',
    },
    {
      id: 'TKT-1004',
      userId: 'user-001',
      userName: 'John Adeyemi',
      userEmail: 'john@example.com',
      category: 'content',
      priority: 'low',
      subject: 'Article has incorrect data',
      message: 'The article "Bitcoin Hits $100K" published yesterday has incorrect market cap figures. Please verify and correct. The article slug is bitcoin-hits-100k-milestone.',
      status: 'resolved',
      assignedTo: 'Content Team',
      responses: [
        {
          id: 'resp-2',
          author: 'Content Team',
          authorRole: 'admin',
          message: 'Thank you for flagging this, John. We have corrected the market cap figures in the article. The updated version is now live.',
          createdAt: '2026-02-23T16:00:00Z',
        },
      ],
      createdAt: '2026-02-23T08:20:00Z',
      updatedAt: '2026-02-23T16:00:00Z',
    },
    {
      id: 'TKT-1005',
      userId: 'user-004',
      userName: 'Fatima Bello',
      userEmail: 'fatima@example.com',
      category: 'account',
      priority: 'high',
      subject: 'Cannot reset my password',
      message: 'I have been trying to reset my password for 3 days. The reset email never arrives. I have checked spam. My email is fatima@example.com. Please help urgently.',
      status: 'awaiting-reply',
      assignedTo: 'Support Team',
      responses: [
        {
          id: 'resp-3',
          author: 'Support Team',
          authorRole: 'admin',
          message: 'Hi Fatima, we have manually triggered a password reset to your email. Please check your inbox now. If you still do not receive it, please reply with an alternative email.',
          createdAt: '2026-02-24T09:00:00Z',
        },
      ],
      createdAt: '2026-02-22T15:30:00Z',
      updatedAt: '2026-02-24T09:00:00Z',
    },
  ];
}

function getStore(): Ticket[] {
  return globalThis.__ticketStore!;
}

function generateTicketId(): string {
  const store = getStore();
  const maxNum = store.reduce((max, t) => {
    const num = parseInt(t.id.replace('TKT-', ''), 10);
    return num > max ? num : max;
  }, 1000);
  return `TKT-${maxNum + 1}`;
}

// ─── GET: List tickets ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const role = searchParams.get('role'); // 'admin' returns all
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const priority = searchParams.get('priority');
  const search = searchParams.get('search')?.toLowerCase();

  let tickets = [...getStore()];

  // User-scoped view: only their tickets
  if (role !== 'admin' && userId) {
    tickets = tickets.filter(t => t.userId === userId);
  }

  if (status && status !== 'all') tickets = tickets.filter(t => t.status === status);
  if (category && category !== 'all') tickets = tickets.filter(t => t.category === category);
  if (priority && priority !== 'all') tickets = tickets.filter(t => t.priority === priority);
  if (search) {
    tickets = tickets.filter(t =>
      t.subject.toLowerCase().includes(search) ||
      t.message.toLowerCase().includes(search) ||
      t.id.toLowerCase().includes(search) ||
      t.userName.toLowerCase().includes(search)
    );
  }

  // Sort newest first
  tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Stats
  const all = getStore();
  const stats = {
    total: all.length,
    open: all.filter(t => t.status === 'open').length,
    inProgress: all.filter(t => t.status === 'in-progress').length,
    awaitingReply: all.filter(t => t.status === 'awaiting-reply').length,
    resolved: all.filter(t => t.status === 'resolved').length,
    closed: all.filter(t => t.status === 'closed').length,
    highPriority: all.filter(t => t.priority === 'high' || t.priority === 'critical').length,
    avgResponseTime: '2.4 hours',
  };

  return NextResponse.json({ success: true, data: tickets, stats }, { status: 200 });
}

// ─── POST: Create ticket ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, message, category, priority, userId, userName, userEmail } = body;

    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'Subject and message are required' }, { status: 400 });
    }

    const ticket: Ticket = {
      id: generateTicketId(),
      userId: userId || 'user-anonymous',
      userName: userName || 'Anonymous User',
      userEmail: userEmail || 'anonymous@coindaily.online',
      category: category || 'general',
      priority: priority || 'normal',
      subject,
      message,
      status: 'open',
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    getStore().push(ticket);

    return NextResponse.json({ success: true, data: ticket, message: `Ticket ${ticket.id} created successfully` }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
