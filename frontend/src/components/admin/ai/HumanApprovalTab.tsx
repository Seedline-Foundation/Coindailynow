/**
 * Human Approval Tab Component
 * Manage content awaiting human review and approval
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, XCircle, Clock, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { aiManagementService, ContentWorkflow } from '@/services/aiManagementService';
import { aiWebSocketService } from '@/services/aiWebSocketService';

export default function HumanApprovalTab() {
  const [workflows, setWorkflows] = useState<ContentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ContentWorkflow | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadApprovalQueue();
    const unsub = aiWebSocketService.on('workflow:needs_review', handleNewReview);
    return () => unsub();
  }, []);

  const loadApprovalQueue = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getHumanApprovalQueue();
      setWorkflows(data);
    } catch (error) {
      console.error('[HumanApprovalTab] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReview = useCallback((data: any) => {
    setWorkflows(prev => [data.workflow, ...prev]);
  }, []);

  const handleApprove = async () => {
    if (!selectedWorkflow) return;
    try {
      await aiManagementService.processReviewDecision(selectedWorkflow.id, 'approve', reviewNotes);
      setSelectedWorkflow(null);
      setReviewNotes('');
      await loadApprovalQueue();
    } catch (error) {
      console.error('[HumanApprovalTab] Error approving:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedWorkflow) return;
    if (!reviewNotes.trim()) {
      alert('Please provide feedback for rejection');
      return;
    }
    try {
      await aiManagementService.processReviewDecision(selectedWorkflow.id, 'reject', reviewNotes);
      setSelectedWorkflow(null);
      setReviewNotes('');
      await loadApprovalQueue();
    } catch (error) {
      console.error('[HumanApprovalTab] Error rejecting:', error);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedWorkflow) return;
    if (!reviewNotes.trim()) {
      alert('Please provide revision instructions');
      return;
    }
    try {
      await aiManagementService.processReviewDecision(selectedWorkflow.id, 'revise', reviewNotes);
      setSelectedWorkflow(null);
      setReviewNotes('');
      await loadApprovalQueue();
    } catch (error) {
      console.error('[HumanApprovalTab] Error requesting revision:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Pending Approvals</h3>
            <p className="text-sm text-gray-600">{workflows.length} workflows awaiting review</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">{workflows.length}</span>
          </div>
        </div>
      </div>

      {/* Approval Queue */}
      <div className="grid gap-4">
        {workflows.map(workflow => (
          <div key={workflow.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">
                    Workflow {workflow.id.substring(0, 8)}
                  </h3>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                    Awaiting Review
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {workflow.qualityScores && Object.entries(workflow.qualityScores).map(([key, score]) => (
                    <div key={key} className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 capitalize mb-1">{key} Quality</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (score as number) >= 0.8 ? 'bg-green-500' :
                              (score as number) >= 0.6 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(score as number) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{((score as number) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {workflow.humanReviewNotes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm font-medium text-blue-900">AI Notes:</p>
                    <p className="text-sm text-blue-800 mt-1">{workflow.humanReviewNotes}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedWorkflow(workflow)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pending approvals</h3>
          <p className="text-gray-600">All workflows have been reviewed</p>
        </div>
      )}

      {/* Review Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <h2 className="text-2xl font-bold">Review Workflow</h2>
              <p className="text-sm text-gray-600">ID: {selectedWorkflow.id}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Quality Scores */}
              <div>
                <h3 className="font-semibold mb-3">Quality Assessment</h3>
                <div className="grid grid-cols-4 gap-4">
                  {selectedWorkflow.qualityScores && Object.entries(selectedWorkflow.qualityScores).map(([key, score]) => (
                    <div key={key} className="bg-gray-50 rounded p-4 text-center">
                      <p className="text-xs text-gray-600 capitalize mb-2">{key}</p>
                      <p className="text-3xl font-bold text-gray-900">{((score as number) * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Feedback */}
              <div>
                <label className="block font-semibold mb-2">Your Feedback</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide feedback, notes, or revision instructions..."
                  className="w-full px-4 py-3 border rounded-lg min-h-[120px] focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => {setSelectedWorkflow(null); setReviewNotes('');}}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleRequestRevision}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Request Revision
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

