'use client';

// Algorithm Defense Widget - Task 67
// User dashboard widget showing SEO health and algorithm defense status

import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, CheckCircle, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

interface DefenseHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  defenseScore: number;
  criticalIssues: number;
  activeWorkflows: number;
  volatileKeywords: number;
  contentToUpdate: number;
  responseTime: number;
}

export default function AlgorithmDefenseWidget() {
  const [health, setHealth] = useState<DefenseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadHealth();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      loadHealth();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const res = await fetch('/api/algorithm-defense/health');
      const data = await res.json();
      
      if (data.success) {
        setHealth(data.data);
        setLastUpdate(new Date());
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading defense health:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-100 text-green-800 border-green-300';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'CRITICAL': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDefenseScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500 text-center">Unable to load defense status</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Algorithm Defense</h3>
        </div>
        <button
          onClick={loadHealth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <div className={`inline-flex items-center px-3 py-2 rounded-full border ${getStatusColor(health.status)}`}>
          {getStatusIcon(health.status)}
          <span className="ml-2 font-medium text-sm">{health.status}</span>
        </div>
      </div>

      {/* Defense Score */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-gray-600">Defense Score</span>
          <span className={`text-2xl font-bold ${getDefenseScoreColor(health.defenseScore)}`}>
            {health.defenseScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              health.defenseScore >= 80
                ? 'bg-green-600'
                : health.defenseScore >= 60
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${health.defenseScore}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Critical Issues</span>
            {health.criticalIssues > 0 && (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <p className={`text-xl font-bold ${
            health.criticalIssues > 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {health.criticalIssues}
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Active Workflows</span>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{health.activeWorkflows}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Volatile Keywords</span>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{health.volatileKeywords}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Content Updates</span>
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{health.contentToUpdate}</p>
        </div>
      </div>

      {/* Response Time */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Response Time</span>
          <span className="text-sm font-medium text-gray-900">{health.responseTime}h</span>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Info Message */}
      {health.status !== 'HEALTHY' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {health.status === 'CRITICAL' && 
              '⚠️ Critical issues detected. Our team is working on recovery.'}
            {health.status === 'WARNING' && 
              '⚡ Some issues detected. Automated defense systems are active.'}
          </p>
        </div>
      )}
    </div>
  );
}

