/**
 * AI System Dashboard - ai.coindaily.online
 * Central hub for AI agent orchestration and monitoring
 * Staff can independently work with AI models
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const SUPPORTED_LANGUAGES = [
  'Hausa', 'Yoruba', 'Igbo', 'Swahili', 'Amharic', 'Zulu', 'Shona', 
  'Afrikaans', 'Somali', 'Oromo', 'Arabic', 'French', 'Portuguese', 'Wolof', 'Kinyarwanda'
];

interface Agent {
  id: string;
  name: string;
  status: string;
  queue: number;
  completed: number;
  model: string;
}

interface Task {
  id: string | number;
  type: string;
  title: string;
  status: string;
  time: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

type ModalType = 'generate' | 'image' | 'translate' | 'analyze' | null;

// Default agents to show when backend is unreachable
const DEFAULT_AGENTS: Agent[] = [
  { id: 'content', name: 'Content Generator', status: 'unknown', queue: 0, completed: 0, model: 'Llama 3.1 8B' },
  { id: 'research', name: 'Research Agent', status: 'unknown', queue: 0, completed: 0, model: 'DeepSeek R1' },
  { id: 'review', name: 'Quality Reviewer', status: 'unknown', queue: 0, completed: 0, model: 'DeepSeek R1' },
  { id: 'translation', name: 'Translation Agent', status: 'unknown', queue: 0, completed: 0, model: 'NLLB-200' },
  { id: 'image', name: 'Image Generator', status: 'unknown', queue: 0, completed: 0, model: 'SDXL' },
  { id: 'market', name: 'Market Analyst', status: 'unknown', queue: 0, completed: 0, model: 'DeepSeek R1' },
  { id: 'sentiment', name: 'Sentiment Analyzer', status: 'unknown', queue: 0, completed: 0, model: 'DeepSeek R1' },
  { id: 'moderation', name: 'Content Moderator', status: 'unknown', queue: 0, completed: 0, model: 'DeepSeek R1' },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AISystemDashboard() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'loading'>('loading');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Form states
  const [articleTopic, setArticleTopic] = useState('');
  const [articleStyle, setArticleStyle] = useState('news');
  const [imagePrompt, setImagePrompt] = useState('');
  const [translateText, setTranslateText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Swahili');
  const [analysisTopic, setAnalysisTopic] = useState('');

  // Fetch live data from backend and health endpoint
  const fetchDashboardData = useCallback(async () => {
    // Fetch AI health status from local /api/health
    try {
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      setServices(healthData.services || []);
      setSystemStatus(healthData.status === 'operational' ? 'operational' : 'degraded');
    } catch {
      setSystemStatus('degraded');
    }

    // Fetch agents from backend
    try {
      const agentRes = await fetch(`${BACKEND_URL}/api/super-admin/ai-agents`);
      const agentData = await agentRes.json();
      if (agentData.agents && agentData.agents.length > 0) {
        setAgents(agentData.agents.map((a: any) => ({
          id: a.id || a.type,
          name: a.name,
          status: a.status === 'ACTIVE' || a.status === 'running' ? 'running' : a.status === 'PAUSED' ? 'paused' : a.status?.toLowerCase() || 'unknown',
          queue: a.queue ?? a.pendingTasks ?? 0,
          completed: a.completed ?? a.completedTasks ?? 0,
          model: a.model || a.modelVersion || 'Unknown',
        })));
      }
    } catch {
      // Keep defaults if backend unavailable
    }

    // Fetch recent tasks from backend
    try {
      const taskRes = await fetch(`${BACKEND_URL}/api/super-admin/ai-tasks?limit=10`);
      const taskData = await taskRes.json();
      if (taskData.tasks && taskData.tasks.length > 0) {
        setRecentTasks(taskData.tasks.map((t: any) => ({
          id: t.id,
          type: t.type || t.taskType || 'content',
          title: t.title || `${t.type || 'Task'}: ${t.id.slice(0, 8)}`,
          status: t.status?.toLowerCase() || 'queued',
          time: t.completedAt ? timeAgo(t.completedAt) : t.createdAt ? timeAgo(t.createdAt) : 'Unknown',
        })));
      }
    } catch {
      // No tasks available
    }

    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);
  
  const runningAgents = agents.filter(a => a.status === 'running').length;
  const totalQueue = agents.reduce((sum, a) => sum + a.queue, 0);
  const totalCompleted = agents.reduce((sum, a) => sum + a.completed, 0);

  const closeModal = () => {
    setActiveModal(null);
    setResult(null);
    setError(null);
  };

  const handleGenerateArticle = async () => {
    if (!articleTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: articleTopic, style: articleStyle, length: 'medium' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate article');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translateText, sourceLanguage: 'English', targetLanguage })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: analysisTopic, analysisType: 'comprehensive' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CoinDaily AI System</h1>
              <p className="text-sm text-gray-400">Agent Orchestration Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              systemStatus === 'operational' 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {systemStatus === 'operational' ? 'All Systems Operational' : 'Degraded Performance'}
            </span>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Agents" value={`${runningAgents}/${agents.length}`} icon="🤖" color="cyan" />
          <StatCard title="Tasks Completed" value={totalCompleted.toLocaleString()} icon="✅" color="green" />
          <StatCard title="Queue Size" value={totalQueue.toString()} icon="⏳" color="yellow" />
          <StatCard title="API Cost (Today)" value="$0.00" icon="💰" color="purple" />
        </div>

        {/* System Health */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">System Health</h2>
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <span className="text-xs text-gray-500">Updated {lastRefresh.toLocaleTimeString()}</span>
              )}
              <button
                onClick={fetchDashboardData}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <HealthIndicator icon="🖥️" label="API Server" status={systemStatus === 'loading' ? 'degraded' : 'healthy'} />
            <HealthIndicator icon="💾" label="Database" status="healthy" />
            {services.length > 0 ? services.map((svc) => (
              <HealthIndicator
                key={svc.name}
                icon={svc.name.includes('Ollama') ? '🦙' : svc.name.includes('DeepSeek') ? '🧠' : svc.name.includes('SDXL') ? '🖼️' : '🌍'}
                label={svc.name.split('(')[0].trim()}
                status={svc.status === 'healthy' ? 'healthy' : 'down'}
                latency={svc.latency}
              />
            )) : (
              <>
                <HealthIndicator icon="🦙" label="Ollama" status={systemStatus === 'loading' ? 'degraded' : 'down'} />
                <HealthIndicator icon="🧠" label="DeepSeek R1" status={systemStatus === 'loading' ? 'degraded' : 'down'} />
                <HealthIndicator icon="🖼️" label="SDXL" status={systemStatus === 'loading' ? 'degraded' : 'down'} />
                <HealthIndicator icon="🌍" label="NLLB-200" status={systemStatus === 'loading' ? 'degraded' : 'down'} />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Agents */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">AI Agents</h2>
              <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View All →
              </button>
            </div>
            <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
              {agents.slice(0, 6).map((agent) => (
                <div key={agent.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'running' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-white">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.model}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{agent.queue} queued</p>
                    <p className="text-xs text-gray-500">{agent.completed} done</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Tasks</h2>
              <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View All →
              </button>
            </div>
            <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
              {recentTasks.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p className="text-sm">No tasks yet</p>
                  <p className="text-xs mt-1">Use Quick Actions below to create tasks</p>
                </div>
              ) : recentTasks.map((task) => (
                <div key={task.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      task.status === 'processing' ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {task.type === 'content' ? '📝' :
                       task.type === 'image' ? '🖼️' :
                       task.type === 'translation' ? '🌍' :
                       task.type === 'review' ? '✓' : '🧠'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    task.status === 'processing' ? 'bg-cyan-500/10 text-cyan-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions - Interactive */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveModal('generate')}
              className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/50 rounded-xl transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">📝</span>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Generate Article</span>
              <span className="text-xs text-cyan-500">Llama 3.1</span>
            </button>
            <button
              onClick={() => setActiveModal('image')}
              className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-purple-500/50 rounded-xl transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🖼️</span>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Create Image</span>
              <span className="text-xs text-purple-500">SDXL</span>
            </button>
            <button
              onClick={() => setActiveModal('translate')}
              className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-green-500/50 rounded-xl transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🌍</span>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Translate Content</span>
              <span className="text-xs text-green-500">NLLB-200</span>
            </button>
            <button
              onClick={() => setActiveModal('analyze')}
              className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-orange-500/50 rounded-xl transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Market Analysis</span>
              <span className="text-xs text-orange-500">DeepSeek R1</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Generate Article Modal */}
            {activeModal === 'generate' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Generate Article</h3>
                      <p className="text-sm text-gray-400">Using Llama 3.1 8B via Ollama</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Topic / Prompt</label>
                    <textarea
                      value={articleTopic}
                      onChange={(e) => setArticleTopic(e.target.value)}
                      placeholder="E.g., Bitcoin adoption in Nigeria reaches new highs as mobile money integration expands"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Article Style</label>
                    <select
                      value={articleStyle}
                      onChange={(e) => setArticleStyle(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="news">News Article</option>
                      <option value="analysis">Analysis Piece</option>
                      <option value="explainer">Explainer / Educational</option>
                      <option value="opinion">Opinion / Editorial</option>
                    </select>
                  </div>
                  <button
                    onClick={handleGenerateArticle}
                    disabled={loading || !articleTopic.trim()}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading ? '⏳ Generating...' : '🚀 Generate Article'}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {result?.article && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-2">{result.article.title}</h4>
                      <p className="text-gray-400 text-sm mb-4">{result.article.excerpt}</p>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-300 text-sm">{result.article.content}</pre>
                      </div>
                      {result.processingTime && (
                        <p className="text-xs text-gray-500 mt-4">Generated in {result.processingTime}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Image Generation Modal */}
            {activeModal === 'image' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🖼️</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Create Image</h3>
                      <p className="text-sm text-gray-400">Using SDXL via Automatic1111</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Image Description</label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="E.g., Professional photograph of African entrepreneurs discussing cryptocurrency on smartphones, modern office, Lagos Nigeria"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none h-24"
                    />
                  </div>
                  <button
                    onClick={handleGenerateImage}
                    disabled={loading || !imagePrompt.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading ? '⏳ Generating (60-90s)...' : '🎨 Create Image'}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {result?.images?.[0] && (
                  <div className="mt-6">
                    <img 
                      src={`data:image/png;base64,${result.images[0]}`} 
                      alt="Generated" 
                      className="w-full rounded-lg border border-gray-700"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Translation Modal */}
            {activeModal === 'translate' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Translate Content</h3>
                      <p className="text-sm text-gray-400">Using NLLB-200 (15 African Languages)</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Text to Translate (English)</label>
                    <textarea
                      value={translateText}
                      onChange={(e) => setTranslateText(e.target.value)}
                      placeholder="Enter English text to translate..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none resize-none h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Target Language</label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none"
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleTranslate}
                    disabled={loading || !translateText.trim()}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading ? '⏳ Translating...' : '🌐 Translate'}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {result?.translation && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-400">English →</span>
                      <span className="text-sm text-green-400">{targetLanguage}</span>
                    </div>
                    <p className="text-white">{result.translation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Market Analysis Modal */}
            {activeModal === 'analyze' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Market Analysis</h3>
                      <p className="text-sm text-gray-400">Using DeepSeek R1 Reasoning</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Analysis Topic</label>
                    <textarea
                      value={analysisTopic}
                      onChange={(e) => setAnalysisTopic(e.target.value)}
                      placeholder="E.g., Impact of Ethereum ETF approval on African crypto markets and Luno trading volumes"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none h-24"
                    />
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !analysisTopic.trim()}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading ? '⏳ Analyzing...' : '🔍 Run Analysis'}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {result?.analysis && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          result.analysis.sentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
                          result.analysis.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {result.analysis.sentiment?.toUpperCase()}
                        </span>
                        {result.analysis.confidence && (
                          <span className="text-sm text-gray-400">
                            Confidence: {(result.analysis.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-white font-medium mb-2">Summary</h4>
                      <p className="text-gray-300 text-sm mb-4">{result.analysis.summary}</p>
                      
                      {result.analysis.keyFindings && (
                        <div className="mb-4">
                          <h5 className="text-white font-medium mb-2">Key Findings</h5>
                          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                            {result.analysis.keyFindings.map((f: string, i: number) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.analysis.recommendation && (
                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <h5 className="text-orange-400 font-medium mb-1">Recommendation</h5>
                          <p className="text-gray-300 text-sm">{result.analysis.recommendation}</p>
                        </div>
                      )}
                    </div>
                    {result.processingTime && (
                      <p className="text-xs text-gray-500">Analyzed in {result.processingTime}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
    green: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
    yellow: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20',
    purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function HealthIndicator({ icon, label, status, latency }: { icon: string; label: string; status: 'healthy' | 'degraded' | 'down'; latency?: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-sm text-white">{label}</p>
        <div className="flex items-center gap-2">
          <p className={`text-xs ${
            status === 'healthy' ? 'text-green-400' :
            status === 'degraded' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {status}
          </p>
          {latency !== undefined && <span className="text-xs text-gray-500">{latency}ms</span>}
        </div>
      </div>
    </div>
  );
}
