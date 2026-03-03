/**
 * Ticket Detail API — single ticket operations
 * GET    /api/tickets/[id]   — get single ticket with responses
 * PATCH  /api/tickets/[id]   — update ticket status, assign, add response
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Ticket } from '../route';

// Access the shared global ticket store
declare global {
  // eslint-disable-next-line no-var
  var __ticketStore: Ticket[] | undefined;
}

interface TicketResponse {
  id: string;
  author: string;
  authorRole: 'user' | 'admin' | 'system';
  message: string;
  createdAt: string;
}

function getStore() {
  return globalThis.__ticketStore || [];
}

function generateResponseId(): string {
  return `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticket = getStore().find(t => t.id === params.id);
  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: ticket }, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const ticket = store.find((t: any) => t.id === params.id);
  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { status, assignedTo, responseMessage, responseAuthor, responseRole } = body;

    if (status) ticket.status = status;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;

    // Add a response/reply to the ticket
    if (responseMessage) {
      const newResponse: TicketResponse = {
        id: generateResponseId(),
        author: responseAuthor || 'Support Team',
        authorRole: responseRole || 'admin',
        message: responseMessage,
        createdAt: new Date().toISOString(),
      };
      ticket.responses.push(newResponse);
    }

    ticket.updatedAt = new Date().toISOString();

    return NextResponse.json({ success: true, data: ticket, message: 'Ticket updated' }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
