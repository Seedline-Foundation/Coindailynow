import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock support tickets data - replace with actual database call
    const supportTickets = [
      {
        id: '1',
        ticketNumber: 'SUP-2024-001',
        title: 'Unable to access premium articles',
        user: {
          id: 'user_123',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          tier: 'gold',
          country: 'Nigeria'
        },
        category: 'subscription',
        priority: 'high',
        status: 'open',
        description: 'I paid for the gold subscription but I still cannot access premium articles. Please help.',
        createdAt: '2024-11-04T08:30:00Z',
        updatedAt: '2024-11-04T10:15:00Z',
        assignedTo: {
          id: 'agent_001',
          name: 'Support Agent 1',
          email: 'agent1@coindaily.com'
        },
        messages: [
          {
            id: 'msg_1',
            sender: 'user',
            message: 'I paid for the gold subscription but I still cannot access premium articles. Please help.',
            timestamp: '2024-11-04T08:30:00Z',
            attachments: []
          },
          {
            id: 'msg_2',
            sender: 'agent',
            message: 'Thank you for contacting us. I can see your payment went through successfully. Let me check your account access.',
            timestamp: '2024-11-04T09:45:00Z',
            attachments: []
          }
        ],
        tags: ['subscription', 'payment', 'access'],
        resolution: null,
        firstResponseTime: 75, // minutes
        customerSatisfaction: null
      },
      {
        id: '2',
        ticketNumber: 'SUP-2024-002',
        title: 'Article content not displaying correctly',
        user: {
          id: 'user_456',
          name: 'Michael Chen',
          email: 'michael.chen@example.com',
          tier: 'silver',
          country: 'Kenya'
        },
        category: 'technical',
        priority: 'medium',
        status: 'in_progress',
        description: 'The articles are showing garbled text and images are not loading properly on mobile.',
        createdAt: '2024-11-03T16:20:00Z',
        updatedAt: '2024-11-04T11:30:00Z',
        assignedTo: {
          id: 'agent_002',
          name: 'Tech Support Agent',
          email: 'tech@coindaily.com'
        },
        messages: [
          {
            id: 'msg_3',
            sender: 'user',
            message: 'The articles are showing garbled text and images are not loading properly on mobile.',
            timestamp: '2024-11-03T16:20:00Z',
            attachments: ['screenshot1.png', 'screenshot2.png']
          },
          {
            id: 'msg_4',
            sender: 'agent',
            message: 'Thank you for the screenshots. This looks like a caching issue. Please try clearing your browser cache.',
            timestamp: '2024-11-03T18:45:00Z',
            attachments: []
          },
          {
            id: 'msg_5',
            sender: 'user',
            message: 'I cleared the cache but the issue persists. It only happens on my phone.',
            timestamp: '2024-11-04T09:15:00Z',
            attachments: []
          }
        ],
        tags: ['technical', 'mobile', 'display'],
        resolution: null,
        firstResponseTime: 145,
        customerSatisfaction: null
      },
      {
        id: '3',
        ticketNumber: 'SUP-2024-003',
        title: 'Request for article correction',
        user: {
          id: 'user_789',
          name: 'Amara Okafor',
          email: 'amara.okafor@example.com',
          tier: 'free',
          country: 'Ghana'
        },
        category: 'content',
        priority: 'low',
        status: 'resolved',
        description: 'The Bitcoin price mentioned in article "Bitcoin Weekly Analysis" is incorrect. It shows $45,000 but the actual price was $43,500.',
        createdAt: '2024-11-02T14:10:00Z',
        updatedAt: '2024-11-03T10:30:00Z',
        assignedTo: {
          id: 'agent_003',
          name: 'Content Support',
          email: 'content@coindaily.com'
        },
        messages: [
          {
            id: 'msg_6',
            sender: 'user',
            message: 'The Bitcoin price mentioned in article "Bitcoin Weekly Analysis" is incorrect. It shows $45,000 but the actual price was $43,500.',
            timestamp: '2024-11-02T14:10:00Z',
            attachments: []
          },
          {
            id: 'msg_7',
            sender: 'agent',
            message: 'Thank you for pointing this out. I have forwarded this to our editorial team for correction.',
            timestamp: '2024-11-02T16:25:00Z',
            attachments: []
          },
          {
            id: 'msg_8',
            sender: 'agent',
            message: 'The article has been updated with the correct price. Thank you for helping us maintain accuracy.',
            timestamp: '2024-11-03T10:30:00Z',
            attachments: []
          }
        ],
        tags: ['content', 'correction', 'bitcoin'],
        resolution: 'Article corrected with accurate Bitcoin price information',
        firstResponseTime: 135,
        customerSatisfaction: 5
      },
      {
        id: '4',
        ticketNumber: 'SUP-2024-004',
        title: 'Billing inquiry - duplicate charge',
        user: {
          id: 'user_101',
          name: 'David Mwangi',
          email: 'david.mwangi@example.com',
          tier: 'platinum',
          country: 'Uganda'
        },
        category: 'billing',
        priority: 'high',
        status: 'escalated',
        description: 'I was charged twice for my platinum subscription this month. Please refund the duplicate charge.',
        createdAt: '2024-11-01T11:45:00Z',
        updatedAt: '2024-11-04T09:20:00Z',
        assignedTo: {
          id: 'agent_004',
          name: 'Billing Specialist',
          email: 'billing@coindaily.com'
        },
        messages: [
          {
            id: 'msg_9',
            sender: 'user',
            message: 'I was charged twice for my platinum subscription this month. Please refund the duplicate charge.',
            timestamp: '2024-11-01T11:45:00Z',
            attachments: ['bank_statement.pdf']
          },
          {
            id: 'msg_10',
            sender: 'agent',
            message: 'I can see the duplicate charge in our system. I am escalating this to our billing department for immediate refund processing.',
            timestamp: '2024-11-01T14:20:00Z',
            attachments: []
          },
          {
            id: 'msg_11',
            sender: 'agent',
            message: 'The refund has been processed and should appear in your account within 3-5 business days.',
            timestamp: '2024-11-04T09:20:00Z',
            attachments: ['refund_confirmation.pdf']
          }
        ],
        tags: ['billing', 'refund', 'duplicate'],
        resolution: 'Duplicate charge refunded, processing time 3-5 business days',
        firstResponseTime: 155,
        customerSatisfaction: 4
      }
    ];

    // Filter based on status, priority, and category
    let filteredTickets = supportTickets;
    
    if (status !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
    }
    
    if (priority !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === priority);
    }
    
    if (category !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.category === category);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total: supportTickets.length,
      open: supportTickets.filter(ticket => ticket.status === 'open').length,
      inProgress: supportTickets.filter(ticket => ticket.status === 'in_progress').length,
      resolved: supportTickets.filter(ticket => ticket.status === 'resolved').length,
      escalated: supportTickets.filter(ticket => ticket.status === 'escalated').length,
      high: supportTickets.filter(ticket => ticket.priority === 'high').length,
      medium: supportTickets.filter(ticket => ticket.priority === 'medium').length,
      low: supportTickets.filter(ticket => ticket.priority === 'low').length,
      avgResponseTime: supportTickets
        .reduce((sum, ticket) => sum + (ticket.firstResponseTime || 0), 0) / supportTickets.length,
      avgSatisfaction: supportTickets
        .filter(ticket => ticket.customerSatisfaction)
        .reduce((sum, ticket) => sum + (ticket.customerSatisfaction || 0), 0) / 
        supportTickets.filter(ticket => ticket.customerSatisfaction).length || 0
    };

    return NextResponse.json({
      tickets: paginatedTickets,
      stats,
      pagination: {
        page,
        limit,
        total: filteredTickets.length,
        pages: Math.ceil(filteredTickets.length / limit)
      }
    });
  } catch (error) {
    console.error('Support tickets fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ticketId, ...data } = await request.json();

    // Handle different support ticket actions
    switch (action) {
      case 'assign':
        console.log('Assigning ticket:', ticketId, data);
        return NextResponse.json({ success: true, message: 'Ticket assigned' });
        
      case 'respond':
        console.log('Adding response to ticket:', ticketId, data);
        return NextResponse.json({ success: true, message: 'Response added' });
        
      case 'escalate':
        console.log('Escalating ticket:', ticketId, data);
        return NextResponse.json({ success: true, message: 'Ticket escalated' });
        
      case 'resolve':
        console.log('Resolving ticket:', ticketId, data);
        return NextResponse.json({ success: true, message: 'Ticket resolved' });
        
      case 'close':
        console.log('Closing ticket:', ticketId, data);
        return NextResponse.json({ success: true, message: 'Ticket closed' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Support ticket action error:', error);
    return NextResponse.json(
      { error: 'Failed to process ticket action' },
      { status: 500 }
    );
  }
}