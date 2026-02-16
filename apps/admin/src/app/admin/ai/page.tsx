/**
 * Admin AI Management Page
 * Real-time AI agent monitoring with live backend data
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Bot, 
  Activity, 
  Settings,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  Clock,
  FileText,
  Image,
  Globe,
  TrendingUp,
  Loader2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { fetchAIAgents, fetchAITasks, fetchPlatformStats, fetchAIHealth } from '@/lib/api';

interface AIAgent {
  id: string;
  name: string;
  type: string;
  model: string;
  status: string;
  isActive: boolean;
  tasksCompleted: number;
  tasksQueued: number;
  tasksFailed: number;
  lastRun: string | null;
}

interface AITask {
  id: string;
  type: string;
  status: string;
  agent: string;
  model: string;
  title: string;
  processingTime: string | null;
  createdAt: string;
}

interface HealthService {
  name: string;
  status: string;
}

export default function AdminAIPage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<{ status: string; services: HealthService[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, tasksRes, statsRes, healthRes] = await Promise.all([
        fetchAIAgents(),
        fetchAITasks(10),
        fetchPlatformStats(),
        fetchAIHealth(),
      ]);
      setAgents(agentsRes.data || []);
      setTasks(tasksRes.data || []);
      setStats(statsRes.stats || null);
      setHealth(healthRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const runningAgents = agents.filter(a => a.status === 'running').length;
  const totalCompleted = agents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0);
  const totalQueued = agents.reduce((sum, a) => sum + (a.tasksQueued || 0), 0);

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="ml-3 text-gray-400">Loading AI system...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Management</h1>
          <p className="text-gray-400 mt-1">Control AI agents and automation systems</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg">
            <Settings className="w-4 h-4" /> Configure
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Agents" value={`${runningAgents}/${agents.length}`} icon={<Bot className="w-5 h-5" />} color="green" />
        <StatCard title="Tasks Completed" value={totalCompleted.toLocaleString()} icon={<CheckCircle className="w-5 h-5" />} color="blue" />
        <StatCard title="Tasks Queued" value={totalQueued.toString()} icon={<Clock className="w-5 h-5" />} color="yellow" />
        <StatCard title="AI Tasks (DB)" value={stats?.ai?.totalTasks?.toLocaleString() || '0'} icon={<TrendingUp className="w-5 h-5" />} color="purple" />
      </div>

      {/* System Health */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">System Health</h2>
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            health?.status === 'operational' ? 'bg-green-500/10 text-green-500' :
            health?.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-500' :
            'bg-red-500/10 text-red-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              health?.status === 'operational' ? 'bg-green-500' :
              health?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            } animate-pulse`}></span>
            {health?.status === 'operational' ? 'All Systems Operational' :
             health?.status === 'degraded' ? 'Degraded Performance' : 'Offline'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {health?.services?.length ? health.services.map((svc, i) => (
            <StatusItem key={i} label={svc.name} status={svc.status === 'healthy' ? 'online' : svc.status === 'degraded' ? 'degraded' : 'offline'} />
          )) : (
            <>
              <StatusItem label="API Server" status="online" />
              <StatusItem label="Database" status="online" />
              <StatusItem label="Ollama" status={health ? 'online' : 'offline'} />
              <StatusItem label="Translation" status={health ? 'online' : 'offline'} />
            </>
          )}
        </div>
      </div>

      {/* AI Agents */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">AI Agents ({agents.length})</h2>
        </div>
        <div className="divide-y divide-gray-700">
          {agents.map((agent) => (
            <div key={agent.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${agent.status === 'running' ? 'bg-green-500/10' : 'bg-gray-700'}`}>
                  <Brain className={`w-6 h-6 ${agent.status === 'running' ? 'text-green-500' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{agent.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      agent.status === 'running' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {agent.status === 'running' ? (
                        <><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Running</>
                      ) : (
                        <><Pause className="w-3 h-3" /> Paused</>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">Model: {agent.model} • Type: {agent.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{agent.tasksCompleted} completed</p>
                  <p className="text-xs text-gray-400">{agent.tasksQueued} queued / {agent.tasksFailed} failed</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  agent.status === 'running' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {agent.status === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </div>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No AI agents configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent AI Tasks */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Tasks ({tasks.length})</h2>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 py-2">
              <div className={`p-2 rounded-lg ${
                task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                task.status === 'processing' ? 'bg-cyan-500/10 text-cyan-400' :
                task.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {task.type?.includes('content') ? <FileText className="w-4 h-4" /> :
                 task.type?.includes('image') ? <Image className="w-4 h-4" /> :
                 task.type?.includes('translation') ? <Globe className="w-4 h-4" /> :
                 <Activity className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{task.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {task.agent} • {task.status} {task.processingTime ? `• ${task.processingTime}` : ''}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                task.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                task.status === 'processing' ? 'bg-cyan-500/10 text-cyan-400' :
                'bg-gray-800 text-gray-400'
              }`}>{task.status}</span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">No recent AI tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-500', blue: 'text-blue-500', yellow: 'text-yellow-500', purple: 'text-purple-500', red: 'text-red-500',
  };
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{title}</p>
        <div className={colorClasses[color] || 'text-gray-400'}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: 'online' | 'offline' | 'degraded' }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${
        status === 'online' ? 'bg-green-500' : status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
      }`}></span>
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  );
}
