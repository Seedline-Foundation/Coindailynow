'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  XCircle,
  Send,
  Loader2,
  Eye,
  ArrowLeft,
  Filter,
  Users,
  Inbox,
  TrendingUp,
  BarChart3,
  User,
  ChevronDown,
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

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  awaitingReply: number;
  resolved: number;
  closed: number;
  highPriority: number;
  avgResponseTime: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; textFull: string }> = {
  open: { label: 'Open', color: 'text-blue-400', bg: 'bg-blue-500/20', textFull: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'in-progress': { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/20', textFull: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'awaiting-reply': { label: 'Awaiting Reply', color: 'text-orange-400', bg: 'bg-orange-500/20', textFull: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  resolved: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-500/20', textFull: 'bg-green-500/20 text-green-400 border-green-500/30' },
  closed: { label: 'Closed', color: 'text-gray-400', bg: 'bg-gray-500/20', textFull: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const priorityConfig: Record<string, { label: string; dot: string; badge: string }> = {
  low: { label: 'Low', dot: 'bg-gray-400', badge: 'text-gray-400' },
  normal: { label: 'Normal', dot: 'bg-blue-400', badge: 'text-blue-400' },
  medium: { label: 'Medium', dot: 'bg-yellow-400', badge: 'text-yellow-400' },
  high: { label: 'High', dot: 'bg-orange-500', badge: 'text-orange-400' },
  critical: { label: 'Critical', dot: 'bg-red-500', badge: 'text-red-400' },
};

const categoryLabels: Record<string, string> = {
  technical: '🔧 Technical',
  account: '👤 Account',
  billing: '💳 Billing',
  feature: '💡 Feature',
  content: '📝 Content',
  general: '📋 General',
};

// ─── Safe number ──────────────────────────────────────────────────────────────
const safeNum = (v: any): number => {
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  return 0;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SuperAdminHelpCenterPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Reply
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [assignee, setAssignee] = useState('');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      const params = new URLSearchParams({ role: 'admin', status: filterStatus, category: filterCategory, priority: filterPriority });
      if (search) params.set('search', search);
      const res = await fetch(`/api/tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
        setStats(data.stats || null);
      }
    } catch { /* keep empty */ }
    finally { setLoading(false); }
  }, [filterStatus, filterCategory, filterPriority, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleReply = async () => {
    if (!selectedTicket) return;
    if (!reply.trim() && !statusUpdate && !assignee) return;
    setSending(true);
    try {
      const token = localStorage.getItem('super_admin_token');
      const body: any = {};
      if (reply.trim()) {
        body.responseMessage = reply;
        body.responseAuthor = 'Support Team';
        body.responseRole = 'admin';
      }
      if (statusUpdate) body.status = statusUpdate;
      if (assignee) body.assignedTo = assignee;

      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.data);
        setReply('');
        setStatusUpdate('');
        setAssignee('');
        fetchTickets();
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

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────
  if (view === 'detail' && selectedTicket) {
    const sc = statusConfig[selectedTicket.status] || statusConfig.open;
    const pc = priorityConfig[selectedTicket.priority] || priorityConfig.normal;
    return (
      <div className="space-y-6">
        <button onClick={() => { setView('list'); setSelectedTicket(null); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to All Tickets
        </button>

        {/* Ticket header */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-gray-500">{selectedTicket.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.textFull}`}>{sc.label}</span>
                <span className={`text-xs ${pc.badge}`}>● {pc.label}</span>
                <span className="text-xs text-gray-500">{categoryLabels[selectedTicket.category] || selectedTicket.category}</span>
              </div>
              <h1 className="text-xl font-bold text-white">{selectedTicket.subject}</h1>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{selectedTicket.userName}</p>
              <p className="text-xs text-gray-400">{selectedTicket.userEmail} · User ID: {selectedTicket.userId}</p>
            </div>
            <span className="ml-auto text-xs text-gray-500">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
          </div>

          {/* Original message */}
          <div className="text-sm text-gray-300 leading-relaxed bg-gray-900 rounded-lg p-4 border border-gray-700">
            {selectedTicket.message}
          </div>
          {selectedTicket.assignedTo && (
            <p className="text-xs text-gray-500 mt-2">Assigned to: <span className="text-blue-400">{selectedTicket.assignedTo}</span></p>
          )}
        </div>

        {/* Conversation thread */}
        {selectedTicket.responses.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Conversation ({selectedTicket.responses.length})</h2>
            {selectedTicket.responses.map(r => (
              <div key={r.id} className={`rounded-xl p-4 border ${r.authorRole === 'admin' ? 'bg-blue-900/10 border-blue-500/20 mr-8' : 'bg-gray-800 border-gray-700 ml-8'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold ${r.authorRole === 'admin' ? 'text-blue-400' : 'text-gray-300'}`}>{r.author}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${r.authorRole === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600 text-gray-300'}`}>
                    {r.authorRole === 'admin' ? 'Admin' : 'User'}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{r.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Admin action panel */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Admin Actions</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Update Status</label>
              <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— No change —</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="awaiting-reply">Awaiting Reply</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Assign To</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Unassigned —</option>
                <option value="Support Team">Support Team</option>
                <option value="Content Team">Content Team</option>
                <option value="Engineering">Engineering</option>
                <option value="Finance">Finance</option>
                <option value="CEO">CEO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Quick Actions</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStatusUpdate('resolved'); handleReply(); }}
                  className="px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 text-xs flex-1"
                >
                  ✓ Resolve
                </button>
                <button
                  onClick={() => { setStatusUpdate('closed'); handleReply(); }}
                  className="px-3 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600 text-xs flex-1"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Reply to User</label>
            <textarea
              rows={4}
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Type your response to the user..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleReply}
              disabled={sending || (!reply.trim() && !statusUpdate && !assignee)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : 'Send & Update'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Ticket className="h-8 w-8 text-amber-400" />
            Help Center — Tickets
          </h1>
          <p className="text-gray-400 mt-1">Manage user support tickets, track resolutions, and respond to inquiries</p>
        </div>
        <button onClick={fetchTickets} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Total', value: safeNum(stats.total), color: 'text-white', icon: Inbox },
            { label: 'Open', value: safeNum(stats.open), color: 'text-blue-400', icon: AlertTriangle },
            { label: 'In Progress', value: safeNum(stats.inProgress), color: 'text-yellow-400', icon: Clock },
            { label: 'Awaiting', value: safeNum(stats.awaitingReply), color: 'text-orange-400', icon: MessageSquare },
            { label: 'Resolved', value: safeNum(stats.resolved), color: 'text-green-400', icon: CheckCircle },
            { label: 'Closed', value: safeNum(stats.closed), color: 'text-gray-400', icon: XCircle },
            { label: 'High Priority', value: safeNum(stats.highPriority), color: 'text-red-400', icon: AlertTriangle },
            { label: 'Avg Response', value: stats.avgResponseTime || 'N/A', color: 'text-cyan-400', icon: TrendingUp },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets by ID, subject, user..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="awaiting-reply">Awaiting Reply</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Categories</option>
          <option value="technical">Technical</option>
          <option value="account">Account</option>
          <option value="billing">Billing</option>
          <option value="feature">Feature</option>
          <option value="content">Content</option>
          <option value="general">General</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Ticket Table */}
      {loading ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <Inbox className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No tickets found</h3>
          <p className="text-gray-400 text-sm">No support tickets match your current filters.</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-xs text-gray-400 uppercase">
                  <th className="px-4 py-3 text-left">Ticket</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Assigned</th>
                  <th className="px-4 py-3 text-left">Replies</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tickets.map(ticket => {
                  const sc = statusConfig[ticket.status] || statusConfig.open;
                  const pc = priorityConfig[ticket.priority] || priorityConfig.normal;
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-gray-500">{ticket.id}</p>
                        <p className="text-sm text-white font-medium truncate max-w-[250px]">{ticket.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white">{ticket.userName}</p>
                        <p className="text-xs text-gray-500">{ticket.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">{categoryLabels[ticket.category] || ticket.category}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs ${pc.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${pc.dot}`} />
                          {pc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${sc.textFull}`}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{ticket.assignedTo || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MessageSquare className="h-3 w-3" /> {ticket.responses.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(ticket.updatedAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setSelectedTicket(ticket); setView('detail'); setReply(''); setStatusUpdate(''); setAssignee(ticket.assignedTo || ''); }}
                          className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                          title="View & Respond"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
