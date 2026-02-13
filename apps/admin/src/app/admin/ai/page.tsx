/**
 * Admin AI Management Page
 * AI system control panel for content generation and automation
 */

'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  Bot, 
  Zap, 
  Activity, 
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Image,
  Globe,
  TrendingUp
} from 'lucide-react';

// Mock AI agents data
const mockAgents = [
  { id: 'content', name: 'Content Generator', status: 'running', tasksCompleted: 245, tasksQueued: 12, lastRun: '2 min ago', model: 'GPT-4 Turbo' },
  { id: 'research', name: 'Research Agent', status: 'running', tasksCompleted: 189, tasksQueued: 5, lastRun: '5 min ago', model: 'GPT-4 Turbo' },
  { id: 'review', name: 'Quality Reviewer', status: 'running', tasksCompleted: 312, tasksQueued: 8, lastRun: '1 min ago', model: 'Gemini Pro' },
  { id: 'translation', name: 'Translation Agent', status: 'paused', tasksCompleted: 156, tasksQueued: 23, lastRun: '15 min ago', model: 'NLLB-200' },
  { id: 'image', name: 'Image Generator', status: 'running', tasksCompleted: 89, tasksQueued: 3, lastRun: '8 min ago', model: 'DALL-E 3' },
  { id: 'market', name: 'Market Analyst', status: 'running', tasksCompleted: 432, tasksQueued: 0, lastRun: '30 sec ago', model: 'Grok' },
];

export default function AdminAIPage() {
  const [agents, setAgents] = useState(mockAgents);

  const toggleAgent = (agentId: string) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'running' ? 'paused' : 'running' }
        : agent
    ));
  };

  const runningAgents = agents.filter(a => a.status === 'running').length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const queuedTasks = agents.reduce((sum, a) => sum + a.tasksQueued, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Management</h1>
          <p className="text-dark-400 mt-1">Control AI agents and automation systems</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors border border-dark-700">
            <RefreshCw className="w-4 h-4" />
            Refresh All
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Agents" 
          value={`${runningAgents}/${agents.length}`} 
          icon={<Bot className="w-5 h-5" />}
          color="green"
        />
        <StatCard 
          title="Tasks Completed" 
          value={totalTasks.toLocaleString()} 
          icon={<CheckCircle className="w-5 h-5" />}
          color="blue"
        />
        <StatCard 
          title="Tasks Queued" 
          value={queuedTasks.toString()} 
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard 
          title="AI Cost (Today)" 
          value="$45.20" 
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* System Status */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">System Status</h2>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            All Systems Operational
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatusItem label="OpenAI API" status="online" />
          <StatusItem label="Gemini API" status="online" />
          <StatusItem label="Translation Service" status="degraded" />
          <StatusItem label="Image Service" status="online" />
        </div>
      </div>

      {/* AI Agents */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">AI Agents</h2>
        </div>
        <div className="divide-y divide-dark-700">
          {agents.map((agent) => (
            <div key={agent.id} className="px-6 py-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  agent.status === 'running' ? 'bg-green-500/10' : 'bg-dark-700'
                }`}>
                  <Brain className={`w-6 h-6 ${
                    agent.status === 'running' ? 'text-green-500' : 'text-dark-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{agent.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      agent.status === 'running' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {agent.status === 'running' ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          Running
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3" />
                          Paused
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-dark-400 mt-0.5">
                    Model: {agent.model} • Last run: {agent.lastRun}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{agent.tasksCompleted} completed</p>
                  <p className="text-xs text-dark-400">{agent.tasksQueued} in queue</p>
                </div>
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    agent.status === 'running'
                      ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  }`}
                >
                  {agent.status === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent AI Activity */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityItem 
            icon={<FileText className="w-4 h-4" />}
            title="Article generated: 'Bitcoin Price Analysis'"
            time="2 min ago"
            agent="Content Generator"
          />
          <ActivityItem 
            icon={<CheckCircle className="w-4 h-4" />}
            title="Quality review passed: 'M-Pesa Integration'"
            time="5 min ago"
            agent="Quality Reviewer"
          />
          <ActivityItem 
            icon={<Image className="w-4 h-4" />}
            title="Featured image created for news article"
            time="8 min ago"
            agent="Image Generator"
          />
          <ActivityItem 
            icon={<Globe className="w-4 h-4" />}
            title="Article translated to Swahili, Yoruba"
            time="15 min ago"
            agent="Translation Agent"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
  };
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-dark-400 text-sm">{title}</p>
        <div className={colorClasses[color as keyof typeof colorClasses]}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: 'online' | 'offline' | 'degraded' }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${
        status === 'online' ? 'bg-green-500' :
        status === 'degraded' ? 'bg-yellow-500' :
        'bg-red-500'
      }`}></span>
      <span className="text-sm text-dark-300">{label}</span>
    </div>
  );
}

function ActivityItem({ icon, title, time, agent }: { icon: React.ReactNode; title: string; time: string; agent: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="p-2 rounded-lg bg-dark-800 text-dark-400">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-white">{title}</p>
        <p className="text-xs text-dark-500 mt-0.5">{agent} • {time}</p>
      </div>
    </div>
  );
}
