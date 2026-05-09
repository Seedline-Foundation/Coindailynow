/**
 * Workflows Tab Component
 * Monitor and manage content workflow pipelines
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, ChevronRight, Loader2, Play, Pause, RotateCcw } from 'lucide-react';
import { aiManagementService, ContentWorkflow } from '@/services/aiManagementService';
import { aiWebSocketService } from '@/services/aiWebSocketService';

export default function WorkflowsTab() {
  const [workflows, setWorkflows] = useState<ContentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ContentWorkflow | null>(null);

  useEffect(() => {
    loadWorkflows();
    const unsub = aiWebSocketService.on('workflow:stage_changed', handleWorkflowUpdate);
    return () => unsub();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getWorkflows({ limit: 50 });
      setWorkflows(data.workflows);
    } catch (error) {
      console.error('[WorkflowsTab] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowUpdate = useCallback((data: any) => {
    setWorkflows(prev => {
      const index = prev.findIndex(w => w.id === data.workflow.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = data.workflow;
        return updated;
      }
      return prev;
    });
  }, []);

  const handlePause = async (id: string) => {
    try {
      await aiManagementService.pauseWorkflow(id);
      await loadWorkflows();
    } catch (error) {
      console.error('[WorkflowsTab] Error pausing:', error);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await aiManagementService.resumeWorkflow(id);
      await loadWorkflows();
    } catch (error) {
      console.error('[WorkflowsTab] Error resuming:', error);
    }
  };

  const handleRollback = async (id: string) => {
    if (!confirm('Rollback to previous stage?')) return;
    try {
      await aiManagementService.rollbackWorkflow(id);
      await loadWorkflows();
    } catch (error) {
      console.error('[WorkflowsTab] Error rolling back:', error);
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {workflows.map(workflow => (
          <div key={workflow.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Workflow {workflow.id.substring(0, 8)}</h3>
                <p className="text-sm text-gray-600">
                  Current Stage: <span className="font-medium capitalize">{workflow.currentStage.replace('_', ' ')}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                  workflow.status === 'failed' ? 'bg-red-100 text-red-800' :
                  workflow.status === 'paused' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {workflow.status.replace('_', ' ')}
                </span>
                {workflow.status === 'in_progress' && (
                  <button onClick={() => handlePause(workflow.id)} className="p-2 hover:bg-gray-100 rounded">
                    <Pause className="h-4 w-4" />
                  </button>
                )}
                {workflow.status === 'paused' && (
                  <button onClick={() => handleResume(workflow.id)} className="p-2 hover:bg-gray-100 rounded">
                    <Play className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => handleRollback(workflow.id)} className="p-2 hover:bg-gray-100 rounded">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {workflow.stages.map((stage, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className={`w-full p-3 rounded-lg border-2 ${
                      stage.status === 'completed' ? 'bg-green-50 border-green-200' :
                      stage.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                      stage.status === 'failed' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        {getStageIcon(stage.status)}
                        {stage.qualityScore !== undefined && (
                          <span className="text-xs font-semibold">
                            {(stage.qualityScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium capitalize">{stage.name.replace('_', ' ')}</p>
                      {stage.error && (
                        <p className="text-xs text-red-600 mt-1 truncate" title={stage.error}>
                          {stage.error}
                        </p>
                      )}
                    </div>
                  </div>
                  {idx < workflow.stages.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Quality Scores */}
            {workflow.qualityScores && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {Object.entries(workflow.qualityScores).map(([key, score]) => (
                  <div key={key} className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-600 capitalize">{key}</p>
                    <p className="text-lg font-semibold">{((score as number) * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
          <p className="text-gray-600">No active workflows at the moment</p>
        </div>
      )}
    </div>
  );
}

