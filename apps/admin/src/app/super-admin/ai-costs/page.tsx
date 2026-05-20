'use client';

import React, { useState } from 'react';

const mockCostData = {
  totalCost: 1247.83,
  totalTokens: 45_200_000,
  totalTasks: 8420,
  avgCostPerTask: 0.148,
  avgLatency: 2340,
  dailyAverage: 41.59,
  forecast30d: 1247.7,
  budgetUsed: 62.4,
};

const mockByAgent = [
  { agent: 'Article Writer', cost: 420.30, tokens: 15_200_000, tasks: 2100, avgLatency: 3200 },
  { agent: 'SEO Optimizer', cost: 180.50, tokens: 8_400_000, tasks: 1800, avgLatency: 1800 },
  { agent: 'Fact-Check Agent', cost: 165.20, tokens: 7_100_000, tasks: 1500, avgLatency: 2100 },
  { agent: 'Image Generator', cost: 145.80, tokens: 0, tasks: 980, avgLatency: 8500 },
  { agent: 'Translator Agent', cost: 120.40, tokens: 5_800_000, tasks: 950, avgLatency: 1500 },
  { agent: 'GEO Citation Agent', cost: 95.30, tokens: 4_200_000, tasks: 620, avgLatency: 1900 },
  { agent: 'Regulatory Monitor', cost: 72.10, tokens: 2_800_000, tasks: 280, avgLatency: 4500 },
  { agent: 'Social Publisher', cost: 48.23, tokens: 1_700_000, tasks: 190, avgLatency: 950 },
];

const mockByModel = [
  { model: 'claude-sonnet', cost: 680.40, tokens: 22_000_000, tasks: 3200 },
  { model: 'gpt-4o-mini', cost: 245.20, tokens: 15_000_000, tasks: 3800 },
  { model: 'claude-haiku', cost: 180.30, tokens: 5_200_000, tasks: 1200 },
  { model: 'flux-pro', cost: 142.93, tokens: 0, tasks: 220 },
];

const mockBudgets = [
  { name: 'Monthly Global', limit: 2000, spent: 1247.83, type: 'MONTHLY', hardCap: false },
  { name: 'Article Writer Daily', limit: 50, spent: 14.01, type: 'DAILY', hardCap: true },
  { name: 'Image Gen Weekly', limit: 100, spent: 33.5, type: 'WEEKLY', hardCap: false },
];

export default function AICostTrackingPage() {
  const [view, setView] = useState<'agents' | 'models' | 'budgets'>('agents');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Cost Tracking</h1>
        <p className="text-sm text-gray-500">Real-time AI inference cost monitoring, budgets, and optimization</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-gray-900">${mockCostData.totalCost.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Total Spend (MTD)</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${mockCostData.budgetUsed}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{mockCostData.budgetUsed}% of budget</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-gray-900">{(mockCostData.totalTokens / 1_000_000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Total Tokens Used</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-gray-900">${mockCostData.avgCostPerTask.toFixed(3)}</p>
          <p className="text-xs text-gray-500">Avg Cost Per Task</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-gray-900">${mockCostData.dailyAverage.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Daily Average</p>
          <p className="text-xs text-gray-400 mt-1">30d forecast: ${mockCostData.forecast30d.toFixed(0)}</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'agents', label: 'By Agent' },
          { key: 'models', label: 'By Model' },
          { key: 'budgets', label: 'Budgets' },
        ].map(t => (
          <button key={t.key} onClick={() => setView(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${view === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {view === 'agents' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Agent</th>
                <th className="text-right p-3 font-medium text-gray-500">Cost (USD)</th>
                <th className="text-right p-3 font-medium text-gray-500">Tokens</th>
                <th className="text-right p-3 font-medium text-gray-500">Tasks</th>
                <th className="text-right p-3 font-medium text-gray-500">Avg Latency</th>
                <th className="text-right p-3 font-medium text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {mockByAgent.map(a => (
                <tr key={a.agent} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{a.agent}</td>
                  <td className="p-3 text-right">${a.cost.toFixed(2)}</td>
                  <td className="p-3 text-right text-gray-600">{(a.tokens / 1_000_000).toFixed(1)}M</td>
                  <td className="p-3 text-right text-gray-600">{a.tasks.toLocaleString()}</td>
                  <td className="p-3 text-right text-gray-600">{a.avgLatency}ms</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(a.cost / mockCostData.totalCost) * 100}%` }} />
                      </div>
                      <span className="text-xs">{((a.cost / mockCostData.totalCost) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'models' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Model</th>
                <th className="text-right p-3 font-medium text-gray-500">Cost (USD)</th>
                <th className="text-right p-3 font-medium text-gray-500">Tokens</th>
                <th className="text-right p-3 font-medium text-gray-500">Tasks</th>
                <th className="text-right p-3 font-medium text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {mockByModel.map(m => (
                <tr key={m.model} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{m.model}</td>
                  <td className="p-3 text-right">${m.cost.toFixed(2)}</td>
                  <td className="p-3 text-right text-gray-600">{m.tokens > 0 ? `${(m.tokens / 1_000_000).toFixed(1)}M` : 'N/A'}</td>
                  <td className="p-3 text-right text-gray-600">{m.tasks.toLocaleString()}</td>
                  <td className="p-3 text-right">{((m.cost / mockCostData.totalCost) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'budgets' && (
        <div className="space-y-4">
          {mockBudgets.map(b => {
            const pct = (b.spent / b.limit) * 100;
            return (
              <div key={b.name} className="bg-white rounded-xl border p-5">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{b.name}</h3>
                    <p className="text-xs text-gray-500">{b.type} budget {b.hardCap ? '(Hard Cap)' : '(Soft Cap)'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${b.spent.toFixed(2)} / ${b.limit}</p>
                    <p className={`text-xs font-semibold ${pct >= 90 ? 'text-red-600' : pct >= 80 ? 'text-orange-600' : 'text-green-600'}`}>
                      {pct.toFixed(1)}% used
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
