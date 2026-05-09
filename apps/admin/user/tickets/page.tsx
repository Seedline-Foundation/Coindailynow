'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Send,
  Loader2,
  XCircle,
  ArrowLeft,
  Tag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TicketResponse {
  id: string;
  author: string;
  authorRole: 'user' | 'admin' | 'system';
  message: string;
  createdAt: string;
}

interface TicketData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  assignedTo?: string;
  responses: TicketResponse[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  open: { label: 'Open', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', icon: AlertTriangle },
  'in-progress': { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: Clock },
  'awaiting-reply': { label: 'Awaiting Reply', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; dot: string }> = {
  low: { label: 'Low', dot: 'bg-gray-400' },
  normal: { label: 'Normal', dot: 'bg-blue-400' },
  medium: { label: 'Medium', dot: 'bg-yellow-400' },
  high: { label: 'High', dot: 'bg-orange-500' },
  critical: { label: 'Critical', dot: 'bg-red-500' },
};

const categoryLabels: Record<string, string> = {
  technical: '🔧 Technical Issue',
  account: '👤 Account',
  billing: '💳 Billing',
  feature: '💡 Feature Request',
  content: '📝 Content',
  general: '📋 General',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Create form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');

  // Reply state
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/tickets?userId=user-001&status=${filterStatus}&search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTickets(data.data || []);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [filterStatus, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setCreating(true);
    setCreateMessage('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, message, category, priority,
          userId: 'user-001', userName: 'Demo User', userEmail: 'demo@coindaily.online',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateMessage(`Ticket ${data.data.id} created successfully!`);
        setSubject(''); setMessage(''); setCategory('general'); setPriority('normal');
        setTimeout(() => { setView('list'); setCreateMessage(''); fetchTickets(); }, 1500);
      } else {
        setCreateMessage(data.error || 'Failed to create ticket');
      }
    } catch {
      setCreateMessage('Failed to connect to server');
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseMessage: reply, responseAuthor: 'Demo User', responseRole: 'user' }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.data);
        setReply('');
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // ─── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (view === 'detail' && selectedTicket) {
    const sc = statusConfig[selectedTicket.status] || statusConfig.open;
    const pc = priorityConfig[selectedTicket.priority] || priorityConfig.normal;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => { setView('list'); setSelectedTicket(null); }} className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-dark-400 mb-1">{selectedTicket.id} · {categoryLabels[selectedTicket.category] || selectedTicket.category}</p>
              <h1 className="text-xl font-bold text-white">{selectedTicket.subject}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                <sc.icon className="h-3 w-3" /> {sc.label}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-dark-400">
                <span className={`h-2 w-2 rounded-full ${pc.dot}`} /> {pc.label}
              </span>
            </div>
          </div>
          <div className="text-sm text-dark-300 leading-relaxed bg-dark-800 rounded-lg p-4 border border-dark-700">
            {selectedTicket.message}
          </div>
          <p className="text-xs text-dark-500 mt-2">Submitted {new Date(selectedTicket.createdAt).toLocaleString()}</p>
        </div>

        {/* Responses */}
        <div className="space-y-3">
          {selectedTicket.responses.map(r => (
            <div key={r.id} className={`rounded-xl p-4 border ${r.authorRole === 'admin' ? 'bg-primary-500/5 border-primary-500/20 ml-0 mr-8' : 'bg-dark-800 border-dark-700 ml-8 mr-0'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold ${r.authorRole === 'admin' ? 'text-primary-400' : 'text-dark-300'}`}>{r.author}</span>
                <span className="text-xs text-dark-500">{r.authorRole === 'admin' ? 'Support' : 'You'}</span>
                <span className="text-xs text-dark-500 ml-auto">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="text-sm text-dark-200 leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>

        {/* Reply box (disabled for resolved/closed) */}
        {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <textarea
              rows={3}
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Write your reply..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
            <div className="flex justify-end mt-2">
              <button onClick={handleReply} disabled={sending || !reply.trim()} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2 text-sm">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── CREATE VIEW ───────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => { setView('list'); setCreateMessage(''); }} className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>

        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Ticket className="h-5 w-5 text-primary-500" />
            Submit a Support Ticket
          </h1>

          {createMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${createMessage.includes('success') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {createMessage}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Subject *</label>
              <input
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Brief description of your issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="general">📋 General</option>
                  <option value="technical">🔧 Technical Issue</option>
                  <option value="account">👤 Account</option>
                  <option value="billing">💳 Billing</option>
                  <option value="feature">💡 Feature Request</option>
                  <option value="content">📝 Content</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-dark-400 mb-1">Message *</label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Describe your issue in detail. Include any relevant links, transaction IDs, or screenshots."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setView('list')} className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600">Cancel</button>
              <button type="submit" disabled={creating} className="px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {creating ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary-500" />
            Support Tickets
          </h1>
          <p className="text-dark-400 text-sm mt-1">Track your support requests and get help from our team</p>
        </div>
        <button onClick={() => setView('create')} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="awaiting-reply">Awaiting Reply</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="text-center py-12 text-dark-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-dark-900 border border-dark-700 rounded-xl">
          <Ticket className="h-12 w-12 text-dark-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No tickets found</h3>
          <p className="text-dark-400 text-sm mb-4">You haven&apos;t submitted any support tickets yet.</p>
          <button onClick={() => setView('create')} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const sc = statusConfig[ticket.status] || statusConfig.open;
            const pc = priorityConfig[ticket.priority] || priorityConfig.normal;
            return (
              <button
                key={ticket.id}
                onClick={() => { setSelectedTicket(ticket); setView('detail'); }}
                className="w-full text-left bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-dark-500 font-mono">{ticket.id}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                        <sc.icon className="h-3 w-3" /> {sc.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-dark-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`} /> {pc.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1 truncate group-hover:text-primary-400 transition-colors">{ticket.subject}</h3>
                    <p className="text-xs text-dark-400 truncate">{ticket.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ticket.responses.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-dark-400">
                        <MessageSquare className="h-3 w-3" /> {ticket.responses.length}
                      </span>
                    )}
                    <span className="text-xs text-dark-500">{timeAgo(ticket.updatedAt)}</span>
                    <ChevronRight className="h-4 w-4 text-dark-600 group-hover:text-dark-400 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
