/**
 * Today TO DO — Daily Task Dashboard
 * CEO assigns daily tasks (SEO, content, operations) to staff.
 * All admins see the shared checklist. Progress is tracked per day.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Save,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  AlertTriangle,
  Search,
  Globe,
  FileText,
  TrendingUp,
  Share2,
  Send,
  Megaphone,
  BookOpen,
  RefreshCw,
  Settings,
  Star,
  UserPlus,
  Eye,
  Ticket,
  Code,
  Wallet,
  Headphones,
  Lock,
  ShieldCheck,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */
interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
}

interface DailyLog {
  tasks: TaskItem[];
  updatedAt: string;
  updatedBy: string;
}

interface StaffAssignment {
  staffId: string;
  staffName: string;
  tasks: string[]; // task IDs
  assignedBy: string;
  assignedAt: string;
  date: string;
}

interface HistoryEntry {
  date: string;
  log: DailyLog;
}

/* ─── Category definitions ───────────────────────────────────────── */
const CATEGORIES = [
  { id: 'seo-technical', label: 'SEO Technical', icon: Settings, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'seo-content', label: 'SEO Content', icon: Search, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { id: 'content-creation', label: 'Content Creation', icon: FileText, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'social-media', label: 'Social Media', icon: Share2, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  { id: 'distribution', label: 'Distribution', icon: Send, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'link-building', label: 'Link Building', icon: Globe, color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { id: 'community', label: 'Community', icon: Users, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 'analytics', label: 'Analytics & Reporting', icon: BarChart3, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { id: 'operations', label: 'Operations', icon: ClipboardList, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  { id: 'ai-monitoring', label: 'AI/LLM Monitoring', icon: Eye, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { id: 'help-center', label: 'Help Center Tickets', icon: Ticket, color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  { id: 'research', label: 'Research Tasks', icon: BookOpen, color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  { id: 'dev-tasks', label: 'Dev Tasks', icon: Code, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { id: 'finance-monitoring', label: 'Finance / Crypto Data', icon: Wallet, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
];

/* ─── Default daily tasks derived from DO THESE SEO OFFLINE.md ──── */
const DEFAULT_DAILY_TASKS: TaskItem[] = [
  // SEO Technical
  { id: 'seo-1', title: 'Check Google Search Console for crawl errors', description: 'Review Coverage report, fix any new 404s or server errors', category: 'seo-technical', priority: 'critical', completed: false },
  { id: 'seo-2', title: 'Verify Core Web Vitals pass (LCP <2.5s, CLS <0.1)', description: 'Check PageSpeed Insights for homepage + top 5 articles', category: 'seo-technical', priority: 'high', completed: false },
  { id: 'seo-3', title: 'Check IndexNow submissions are firing on publish', description: 'Verify new articles pinged Bing & Yandex via IndexNow', category: 'seo-technical', priority: 'medium', completed: false },
  { id: 'seo-4', title: 'Review Google News Publisher Center', description: 'Check article approval status, fix any rejected articles', category: 'seo-technical', priority: 'high', completed: false },
  { id: 'seo-5', title: 'Validate structured data (Rich Results Test)', description: 'Test 2-3 latest articles for NewsArticle schema errors', category: 'seo-technical', priority: 'medium', completed: false },

  // SEO Content
  { id: 'seo-c1', title: 'Update 1 "Living Document" with fresh data', description: 'Rotate: Regulation Guide → CBDC Tracker → Exchange Comparison → Tax Guide', category: 'seo-content', priority: 'critical', completed: false },
  { id: 'seo-c2', title: 'Refresh 1 top-performing article with new stats', description: 'Check top 10 pages in GSC, update the oldest one with new keywords/data', category: 'seo-content', priority: 'high', completed: false },
  { id: 'seo-c3', title: 'Add "Quick Answer" to 2 existing articles', description: 'First 40 words should directly answer the query for featured snippets', category: 'seo-content', priority: 'medium', completed: false },
  { id: 'seo-c4', title: 'Ensure all new articles have "Key Facts" bullets', description: 'Every article needs scannable bullet points for AI extraction', category: 'seo-content', priority: 'high', completed: false },

  // Content Creation
  { id: 'cc-1', title: 'Publish 2 quality articles (morning + afternoon)', description: 'Follow content calendar: Mon=Market+Regulatory, Tue=Exchange+Interview, etc.', category: 'content-creation', priority: 'critical', completed: false },
  { id: 'cc-2', title: 'Write 1 pillar article section (2,000+ words target)', description: 'Work on this week\'s deep-dive topic or African crypto guide', category: 'content-creation', priority: 'high', completed: false },
  { id: 'cc-3', title: 'Add author bylines & bio links to all new articles', description: 'E-E-A-T signal: every article needs clear author attribution', category: 'content-creation', priority: 'high', completed: false },
  { id: 'cc-4', title: 'Include internal links (3-5 per new article)', description: 'Link to related articles, Living Documents, and entity pages', category: 'content-creation', priority: 'medium', completed: false },

  // Social Media
  { id: 'sm-1', title: 'Post 3-5 Twitter/X threads (peak hours: 7-9AM, 6-8PM WAT)', description: 'Break down each article into viral thread format with hook → data → opinion → CTA', category: 'social-media', priority: 'critical', completed: false },
  { id: 'sm-2', title: 'Engage with 10+ African crypto influencers', description: 'Reply, quote-tweet, add value to conversations of key African crypto voices', category: 'social-media', priority: 'high', completed: false },
  { id: 'sm-3', title: 'Post to Telegram channel (breaking alerts)', description: 'Share breaking news and analysis to CoinDaily Telegram', category: 'social-media', priority: 'high', completed: false },
  { id: 'sm-4', title: 'Create 1 WhatsApp shareable briefing card', description: 'Design daily crypto briefing image for WhatsApp distribution', category: 'social-media', priority: 'medium', completed: false },
  { id: 'sm-5', title: 'Post 1 LinkedIn article or regulatory insight', description: 'Target African fintech professionals — native LinkedIn boost', category: 'social-media', priority: 'medium', completed: false },

  // Distribution
  { id: 'dist-1', title: 'Send daily newsletter (African Crypto Brief)', description: 'Curated + original content email to subscriber list', category: 'distribution', priority: 'critical', completed: false },
  { id: 'dist-2', title: 'Verify RSS feeds are syncing to aggregators', description: 'Check Feedly, Flipboard, Apple News picks up latest articles', category: 'distribution', priority: 'medium', completed: false },

  // Link Building
  { id: 'lb-1', title: 'Respond to 3-5 HARO queries', description: 'Focus on crypto, fintech, African technology, regulation queries', category: 'link-building', priority: 'high', completed: false },
  { id: 'lb-2', title: 'Pitch 1 guest post to DA40+ publication', description: 'Target: TechCabal, CoinDesk, Business Insider Africa, Decrypt', category: 'link-building', priority: 'medium', completed: false },

  // Community
  { id: 'comm-1', title: 'Answer 3-5 Quora/Reddit questions (value-first)', description: 'Provide genuine value — mention CoinDaily naturally (max 1 in 5)', category: 'community', priority: 'medium', completed: false },
  { id: 'comm-2', title: 'Moderate community forum/Discord', description: 'Check reports, welcome new members, respond to questions', category: 'community', priority: 'medium', completed: false },

  // Analytics
  { id: 'an-1', title: 'Check GA4 real-time + daily traffic numbers', description: 'Note: organic sessions, bounce rate, top pages', category: 'analytics', priority: 'high', completed: false },
  { id: 'an-2', title: 'Review Search Console performance (clicks, CTR, position)', description: 'Check for ranking drops on core keywords, new query opportunities', category: 'analytics', priority: 'high', completed: false },
  { id: 'an-3', title: 'Log daily metrics in tracking spreadsheet', description: 'Traffic, CTR, avg position, backlinks, email subs, AI citations', category: 'analytics', priority: 'medium', completed: false },

  // AI/LLM Monitoring
  { id: 'ai-1', title: 'Test 1 query in ChatGPT mentioning African crypto', description: 'Check if CoinDaily appears as a cited source — rotate queries daily', category: 'ai-monitoring', priority: 'medium', completed: false },
  { id: 'ai-2', title: 'Test 1 query in Perplexity for African crypto', description: 'e.g. "Best crypto exchanges in Africa" — check citations', category: 'ai-monitoring', priority: 'medium', completed: false },
  { id: 'ai-3', title: 'Verify /llms.txt and /ai-access.json are serving', description: 'Quick check both files load correctly on production', category: 'ai-monitoring', priority: 'low', completed: false },

  // Operations
  { id: 'ops-1', title: 'Team standup / check-in', description: 'Quick sync with content team on priorities and blockers', category: 'operations', priority: 'high', completed: false },
  { id: 'ops-2', title: 'Review and approve pending articles', description: 'Check AI-generated and staff articles in moderation queue', category: 'operations', priority: 'high', completed: false },

  // Help Center Tickets
  { id: 'hc-1', title: 'Review and respond to open support tickets', description: 'Check new tickets, prioritize by urgency, reply within SLA', category: 'help-center', priority: 'high', completed: false },
  { id: 'hc-2', title: 'Escalate unresolved tickets older than 24h', description: 'Flag older tickets for senior team review', category: 'help-center', priority: 'critical', completed: false },
  { id: 'hc-3', title: 'Update FAQ/knowledge base for common issues', description: 'Add answers for recurring ticket topics to reduce future tickets', category: 'help-center', priority: 'medium', completed: false },

  // Research Tasks
  { id: 'res-1', title: 'Research trending African crypto topics', description: 'Check Twitter/X, Reddit, Telegram for trending discussions in African crypto space', category: 'research', priority: 'high', completed: false },
  { id: 'res-2', title: 'Monitor competitor content and strategy', description: 'Review TechCabal, Bitcoin.ke, CryptoTvPlus, ABCryptocurrency for new angles', category: 'research', priority: 'medium', completed: false },
  { id: 'res-3', title: 'Compile data for upcoming pillar articles', description: 'Gather statistics, regulations, market data for planned deep-dive content', category: 'research', priority: 'medium', completed: false },

  // Dev Tasks
  { id: 'dev-1', title: 'Check platform uptime and error logs', description: 'Review server logs, check 500 errors, monitor API response times', category: 'dev-tasks', priority: 'critical', completed: false },
  { id: 'dev-2', title: 'Review and merge pending pull requests', description: 'Code review, test, and merge PRs on GitHub', category: 'dev-tasks', priority: 'high', completed: false },
  { id: 'dev-3', title: 'Fix reported bugs from QA/support', description: 'Address top-priority bugs from the issue tracker', category: 'dev-tasks', priority: 'high', completed: false },
  { id: 'dev-4', title: 'Run automated test suite', description: 'Execute unit tests, integration tests, check for regressions', category: 'dev-tasks', priority: 'medium', completed: false },

  // Finance / Crypto Data Monitoring
  { id: 'fin-1', title: 'Monitor BTC, ETH, and top African token prices', description: 'Check for major price movements (>5%) that need breaking news coverage', category: 'finance-monitoring', priority: 'critical', completed: false },
  { id: 'fin-2', title: 'Check exchange API data feeds are live', description: 'Verify Binance Africa, Luno, Quidax, Valr data feeds are updating', category: 'finance-monitoring', priority: 'high', completed: false },
  { id: 'fin-3', title: 'Review whale wallet movements', description: 'Check on-chain alerts for large transactions affecting African markets', category: 'finance-monitoring', priority: 'medium', completed: false },
  { id: 'fin-4', title: 'Update market data widgets on homepage', description: 'Ensure live prices, market cap, and trending tokens display correctly', category: 'finance-monitoring', priority: 'high', completed: false },
];

/* ─── Mock staff list (replace with real data from users API) ──── */
const STAFF_LIST = [
  { id: 'ceo', name: 'CEO / Super Admin' },
  { id: 'editor-1', name: 'Editor-in-Chief' },
  { id: 'seo-lead', name: 'SEO Lead' },
  { id: 'content-writer-1', name: 'Content Writer 1' },
  { id: 'content-writer-2', name: 'Content Writer 2' },
  { id: 'social-media-mgr', name: 'Social Media Manager' },
  { id: 'community-mgr', name: 'Community Manager' },
];

/* ─── Role detection helper ──────────────────────────────────────── */
function detectCurrentRole(): { role: 'ceo' | 'staff'; staffId: string; staffName: string } {
  if (typeof window === 'undefined') return { role: 'ceo', staffId: 'ceo', staffName: 'CEO / Super Admin' };
  const token = localStorage.getItem('super_admin_token') || '';
  // CEO tokens start with mock_super_admin_token_ or contain 'ceo' / 'super-admin'
  const isCeo = token.includes('super_admin') || token.includes('ceo') || token.includes('super-admin');
  // In production, decode JWT to get staffId. For now, check localStorage for staff info
  const staffId = localStorage.getItem('staff_id') || (isCeo ? 'ceo' : 'staff-unknown');
  const staffName = localStorage.getItem('staff_name') || (isCeo ? 'CEO / Super Admin' : 'Staff');
  return { role: isCeo ? 'ceo' : 'staff', staffId, staffName };
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function TodayTodoPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [editingTemplates, setEditingTemplates] = useState(false);

  // Role-based access: CEO sees everything, staff sees only assigned tasks
  const [currentUser] = useState(() => detectCurrentRole());
  const isCeo = currentUser.role === 'ceo';

  // New task form
  const [newTask, setNewTask] = useState<Partial<TaskItem>>({
    title: '', description: '', category: 'operations', priority: 'medium',
  });

  // Assign form
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignTaskIds, setAssignTaskIds] = useState<string[]>([]);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('super_admin_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /* ─── Load tasks ─────────────────────────────────────────────── */
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Try loading today's log first
      const logResp = await fetch(`/api/super-admin/daily-tasks/today?date=${selectedDate}`, {
        headers: { ...getAuthHeaders() },
      });
      if (logResp.ok) {
        const logData = await logResp.json();
        if (logData.log?.tasks?.length) {
          setTasks(logData.log.tasks);
          setLoading(false);
          return;
        }
      }

      // No log for this date — try loading templates
      const tmplResp = await fetch('/api/super-admin/daily-tasks/templates', {
        headers: { ...getAuthHeaders() },
      });
      if (tmplResp.ok) {
        const tmplData = await tmplResp.json();
        if (tmplData.templates?.length) {
          // Reset completion status for new day
          setTasks(tmplData.templates.map((t: TaskItem) => ({ ...t, completed: false, completedBy: undefined, completedAt: undefined, notes: '' })));
          setLoading(false);
          return;
        }
      }

      // Fallback to defaults
      setTasks(DEFAULT_DAILY_TASKS);
    } catch (error) {
      console.warn('Failed to load tasks, using defaults:', error);
      setTasks(DEFAULT_DAILY_TASKS);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadAssignments = useCallback(async () => {
    try {
      const resp = await fetch(`/api/super-admin/daily-tasks/assignments?date=${selectedDate}`, {
        headers: { ...getAuthHeaders() },
      });
      if (resp.ok) {
        const data = await resp.json();
        setAssignments(data.assignments || []);
      }
    } catch { /* ignore */ }
  }, [selectedDate]);

  const loadHistory = async () => {
    try {
      const resp = await fetch('/api/super-admin/daily-tasks/history?days=14', {
        headers: { ...getAuthHeaders() },
      });
      if (resp.ok) {
        const data = await resp.json();
        setHistory(data.history || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { loadTasks(); loadAssignments(); }, [loadTasks, loadAssignments]);

  /* ─── Save tasks ─────────────────────────────────────────────── */
  const saveTasks = async () => {
    setSaving(true);
    try {
      const log: DailyLog = { tasks, updatedAt: new Date().toISOString(), updatedBy: 'super-admin' };
      const resp = await fetch('/api/super-admin/daily-tasks/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ log, date: selectedDate }),
      });
      if (resp.ok) {
        setMessage({ type: 'success', text: 'Daily tasks saved!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save tasks' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error saving tasks' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const saveAsTemplate = async () => {
    setSaving(true);
    try {
      // Strip completion data for template
      const templates = tasks.map(t => ({ ...t, completed: false, completedBy: undefined, completedAt: undefined, notes: '' }));
      const resp = await fetch('/api/super-admin/daily-tasks/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ templates }),
      });
      if (resp.ok) {
        setMessage({ type: 'success', text: 'Saved as daily template! This task list will auto-load every day.' });
        setEditingTemplates(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to save template' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  /* ─── Check if a task is assigned to current staff ────────────── */
  const isTaskAssignedToMe = (task: TaskItem): boolean => {
    if (isCeo) return true; // CEO can interact with all
    // Check if task is directly assigned to this user
    if (task.assignedTo === currentUser.staffName) return true;
    // Check assignments list
    const myAssignment = assignments.find(a => a.staffId === currentUser.staffId);
    if (myAssignment && myAssignment.tasks.includes(task.id)) return true;
    return false;
  };

  /* ─── Toggle task ────────────────────────────────────────────── */
  const toggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    // Staff can only toggle tasks assigned to them
    if (!isCeo && !isTaskAssignedToMe(task)) return;
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? {
            ...t,
            completed: !t.completed,
            completedBy: !t.completed ? currentUser.staffName : undefined,
            completedAt: !t.completed ? new Date().toISOString() : undefined,
          }
        : t
    ));
  };

  /* ─── Add task ───────────────────────────────────────────────── */
  const addTask = () => {
    if (!newTask.title?.trim()) return;
    const task: TaskItem = {
      id: `custom-${Date.now()}`,
      title: newTask.title!.trim(),
      description: newTask.description || '',
      category: newTask.category || 'operations',
      priority: (newTask.priority as TaskItem['priority']) || 'medium',
      completed: false,
    };
    setTasks(prev => [...prev, task]);
    setNewTask({ title: '', description: '', category: 'operations', priority: 'medium' });
    setShowAddTask(false);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  /* ─── Assign tasks to staff ─────────────────────────────────── */
  const assignTasks = async () => {
    if (!assignStaffId || assignTaskIds.length === 0) return;
    const staff = STAFF_LIST.find(s => s.id === assignStaffId);
    try {
      const resp = await fetch('/api/super-admin/daily-tasks/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          staffId: assignStaffId,
          staffName: staff?.name || assignStaffId,
          tasks: assignTaskIds,
          date: selectedDate,
          assignedBy: 'CEO',
        }),
      });
      if (resp.ok) {
        setMessage({ type: 'success', text: `Tasks assigned to ${staff?.name || assignStaffId}` });
        setTasks(prev => prev.map(t =>
          assignTaskIds.includes(t.id) ? { ...t, assignedTo: staff?.name || assignStaffId } : t
        ));
        loadAssignments();
        setShowAssign(false);
        setAssignTaskIds([]);
        setAssignStaffId('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to assign tasks' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  /* ─── Date navigation ───────────────────────────────────────── */
  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  /* ─── Filtered tasks ────────────────────────────────────────── */
  const filteredTasks = activeFilter === 'all' ? tasks : tasks.filter(t => t.category === activeFilter);

  /* ─── Stats ──────────────────────────────────────────────────── */
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const criticalPending = tasks.filter(t => !t.completed && t.priority === 'critical').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const categoryStats = CATEGORIES.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat.id);
    const done = catTasks.filter(t => t.completed).length;
    return { ...cat, total: catTasks.length, done };
  }).filter(c => c.total > 0);

  /* ─── Priority styling ──────────────────────────────────────── */
  const priorityStyles: Record<string, string> = {
    critical: 'border-l-4 border-l-red-500',
    high: 'border-l-4 border-l-orange-500',
    medium: 'border-l-4 border-l-blue-500',
    low: 'border-l-4 border-l-gray-400',
  };

  const priorityBadge: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading daily tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-red-600" />
            Today TO DO
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
              isCeo ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {isCeo ? 'CEO View' : currentUser.staffName}
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isCeo
              ? 'Daily task checklist — assign tasks to staff, track all progress'
              : 'Your assigned tasks for today — complete and save progress'
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date nav */}
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-2 flex items-center gap-2 min-w-[140px] justify-center">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{isToday ? 'Today' : selectedDate}</span>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg" disabled={isToday}>
              <ChevronRight className={`w-4 h-4 ${isToday ? 'text-gray-300' : ''}`} />
            </button>
          </div>

          <button onClick={() => { loadHistory(); setShowHistory(!showHistory); }} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Only CEO can assign tasks */}
          {isCeo && (
            <button onClick={() => setShowAssign(true)} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Assign</span>
            </button>
          )}

          {/* Any staff can add tasks */}
          <button onClick={() => setShowAddTask(true)} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </button>

          {/* Only CEO can set templates */}
          {isCeo && (
            <button onClick={saveAsTemplate} disabled={saving} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Set as Template</span>
            </button>
          )}

          <button onClick={saveTasks} disabled={saving} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm flex items-center gap-1">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* ── Message ──────────────────────────────────────────────── */}
      {message && (
        <div className={`p-3 rounded-lg border text-sm ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
          : message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* ── Staff Role Info Banner ───────────────────────────────── */}
      {!isCeo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Staff View — {currentUser.staffName}</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                You can see all tasks but can only interact with tasks assigned to you. Grayed-out tasks are assigned to other team members.
                You can add new tasks for the team. Only the CEO can assign or re-assign tasks.
              </p>
              {(() => {
                const myTasks = tasks.filter(t => isTaskAssignedToMe(t));
                const myDone = myTasks.filter(t => t.completed).length;
                return myTasks.length > 0 ? (
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mt-2">
                    Your tasks: {myDone}/{myTasks.length} completed ({myTasks.length > 0 ? Math.round((myDone / myTasks.length) * 100) : 0}%)
                  </p>
                ) : (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">No tasks assigned to you yet today.</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress Overview ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</h3>
            <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                progressPercent === 100 ? 'bg-green-500' : progressPercent > 50 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{completedTasks} of {totalTasks} tasks done</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Pending</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{criticalPending}</p>
          <p className="text-xs text-gray-500 mt-1">Must complete today</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
          <p className="text-xs text-gray-500 mt-1">Tasks done today</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignments</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{assignments.length}</p>
          <p className="text-xs text-gray-500 mt-1">Staff with tasks today</p>
        </div>
      </div>

      {/* ── Category filter bar ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            activeFilter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          All ({totalTasks})
        </button>
        {categoryStats.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
              activeFilter === cat.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : `${cat.color}`
            }`}
          >
            <cat.icon className="w-3 h-3" />
            {cat.label} ({cat.done}/{cat.total})
          </button>
        ))}
      </div>

      {/* ── Staff Assignments Banner ─────────────────────────────── */}
      {assignments.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" /> Staff Assignments for {isToday ? 'Today' : selectedDate}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {assignments.map((a, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm border border-purple-100 dark:border-purple-800">
                <span className="font-medium text-gray-900 dark:text-white">{a.staffName}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">· {(a.tasks || []).length} tasks</span>
                <span className="text-xs text-gray-400 ml-2">by {a.assignedBy}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Task List ────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No tasks in this category</p>
          </div>
        )}

        {filteredTasks.map(task => {
          const catInfo = CATEGORIES.find(c => c.id === task.category);
          const assignedToMe = isTaskAssignedToMe(task);
          const isGrayedOut = !isCeo && !assignedToMe;
          return (
            <div
              key={task.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${priorityStyles[task.priority]} ${
                task.completed ? 'opacity-60' : ''
              } ${isGrayedOut ? 'opacity-40 pointer-events-none grayscale' : ''} transition-all hover:shadow-md relative`}
            >
              {/* Gray overlay lock icon for staff on non-assigned tasks */}
              {isGrayedOut && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-gray-400 text-xs">
                  <Lock className="w-3 h-3" />
                  <span>Not assigned to you</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button onClick={() => toggleTask(task.id)} className="mt-0.5 flex-shrink-0" disabled={isGrayedOut}>
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isGrayedOut ? 'text-gray-300' : 'text-gray-400 hover:text-blue-500'} transition-colors`} />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {task.title}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${priorityBadge[task.priority]}`}>
                      {task.priority}
                    </span>
                    {catInfo && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400">
                        → {task.assignedTo}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{task.description}</p>
                  )}
                  {task.completed && task.completedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Done at {new Date(task.completedAt).toLocaleTimeString()} {task.completedBy && `by ${task.completedBy}`}
                    </p>
                  )}
                </div>

                {/* Delete — only CEO or task creator can delete */}
                {(isCeo || assignedToMe) && !isGrayedOut && (
                  <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add Task Modal ───────────────────────────────────────── */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddTask(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" /> Add Custom Task
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title || ''}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. Submit guest post to TechCabal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newTask.description || ''}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={2}
                  placeholder="Optional details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskItem['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddTask(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={addTask} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Add Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Tasks Modal ───────────────────────────────────── */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" /> Assign Tasks to Staff
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Staff Member</label>
                <select
                  value={assignStaffId}
                  onChange={e => setAssignStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Choose staff...</option>
                  {STAFF_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Tasks to Assign</label>
                <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {tasks.filter(t => !t.completed).map(t => (
                    <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignTaskIds.includes(t.id)}
                        onChange={e => {
                          setAssignTaskIds(prev =>
                            e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id)
                          );
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{t.title}</span>
                      <span className={`ml-auto px-1.5 py-0.5 text-xs rounded-full ${priorityBadge[t.priority]}`}>{t.priority}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{assignTaskIds.length} task(s) selected</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setShowAssign(false); setAssignTaskIds([]); }} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={assignTasks} disabled={!assignStaffId || assignTaskIds.length === 0} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg">
                  Assign ({assignTaskIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── History Panel ────────────────────────────────────────── */}
      {showHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Task Completion History (Last 14 Days)
          </h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No history yet. Complete and save tasks to track progress.</p>
          ) : (
            <div className="space-y-3">
              {history.map(entry => {
                const entryTasks = entry.log?.tasks || [];
                const done = entryTasks.filter((t: TaskItem) => t.completed).length;
                const total = entryTasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={entry.date} className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedDate(entry.date)}
                      className="text-sm font-mono text-blue-600 hover:underline w-24 text-left"
                    >
                      {entry.date}
                    </button>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all ${
                          pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-24 text-right">
                      {done}/{total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Category Progress Cards ──────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Category Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categoryStats.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id === activeFilter ? 'all' : cat.id)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 text-left hover:shadow-md transition-shadow ${
                activeFilter === cat.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <cat.icon className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{cat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{cat.done}/{cat.total}</span>
                <span className={`text-xs font-medium ${cat.done === cat.total && cat.total > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full ${cat.done === cat.total && cat.total > 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${cat.total > 0 ? (cat.done / cat.total) * 100 : 0}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
