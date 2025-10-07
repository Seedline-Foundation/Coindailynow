/**
 *import React, { useState } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

// Local type definitions to avoid import issues
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ContentWorkflow {
  id: string;
  articleId: string;
  currentState: string;
  assignedReviewer?: User;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStatusPanelProps {
  workflows: ContentWorkflow[];
  currentArticleId?: string;
  user: User;
  onRefresh: () => void;
}nel - Displays and manages article workflow status
 * Features: Workflow tracking, progress indicators, status updates, assignment management
 */

'use client';

import React, { useState } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { ContentWorkflow, User } from '../../services/cmsService';

interface WorkflowStatusPanelProps {
  workflows: ContentWorkflow[];
  currentArticleId?: string;
  user: User;
  onRefresh: () => void;
}

interface WorkflowStepProps {
  step: {
    id: string;
    stepName: string;
    stepOrder: number;
    status: string;
    assigneeId?: string;
    startedAt?: string;
    completedAt?: string;
    estimatedDurationMs: number;
    actualDurationMs?: number;
    errorMessage?: string;
  };
  isActive: boolean;
  isCompleted: boolean;
}

const WorkflowStepComponent: React.FC<WorkflowStepProps> = ({ step, isActive, isCompleted }) => {
  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircleIcon className="h-5 w-5 text-accent-600" />;
    } else if (isActive) {
      return <ArrowPathIcon className="h-5 w-5 text-primary-600 animate-spin" />;
    } else if (step.errorMessage) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
    } else {
      return <ClockIcon className="h-5 w-5 text-neutral-400" />;
    }
  };

  const getStatusColor = () => {
    if (isCompleted) return 'text-accent-600';
    if (isActive) return 'text-primary-600';
    if (step.errorMessage) return 'text-red-600';
    return 'text-neutral-400';
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
      isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''
    }`}>
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {step.stepName}
          </p>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Step {step.stepOrder}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          <span>
            {step.completedAt 
              ? `Completed ${new Date(step.completedAt).toLocaleDateString()}`
              : step.startedAt 
                ? `Started ${new Date(step.startedAt).toLocaleDateString()}`
                : 'Pending'
            }
          </span>
          
          {step.estimatedDurationMs && (
            <span>
              Est: {formatDuration(step.estimatedDurationMs)}
              {step.actualDurationMs && (
                <span className="ml-1">
                  (Actual: {formatDuration(step.actualDurationMs)})
                </span>
              )}
            </span>
          )}
        </div>

        {step.errorMessage && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Error: {step.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

const WorkflowCard: React.FC<{ 
  workflow: ContentWorkflow; 
  isCurrentArticle: boolean;
  onRefresh: () => void;
}> = ({ 
  workflow, 
  isCurrentArticle,
  onRefresh 
}) => {
  const [showDetails, setShowDetails] = useState(isCurrentArticle);

  const getWorkflowStatusColor = () => {
    switch (workflow.currentState) {
      case 'DRAFT': return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800';
      case 'IN_REVIEW': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'APPROVED': return 'text-accent-600 bg-accent-100 dark:bg-accent-900/20';
      case 'PUBLISHED': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'REJECTED': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800';
    }
  };

  const getPriorityColor = () => {
    switch (workflow.priority) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-orange-600';
      case 'LOW': return 'text-neutral-600';
      default: return 'text-neutral-600';
    }
  };

  const completedSteps = workflow.steps.filter(step => step.status === 'COMPLETED');
  const currentStepIndex = workflow.steps.findIndex(step => step.status === 'IN_PROGRESS');
  const progressPercentage = workflow.completionPercentage || (completedSteps.length / workflow.steps.length) * 100;

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg border-2 transition-colors ${
      isCurrentArticle 
        ? 'border-primary-500' 
        : 'border-neutral-200 dark:border-neutral-700'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              {workflow.article.title}
            </h3>
            <div className="flex items-center space-x-3 text-sm">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkflowStatusColor()}`}>
                {workflow.currentState.replace('_', ' ').toLowerCase()}
              </span>
              <span className={`font-medium ${getPriorityColor()}`}>
                {workflow.priority.toLowerCase()} priority
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">
                by {workflow.article.author.name}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title={showDetails ? 'Hide Details' : 'Show Details'}
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onRefresh}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-600 dark:text-neutral-400">
              Progress
            </span>
            <span className="text-neutral-900 dark:text-white font-medium">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Step {currentStepIndex + 1} of {workflow.steps.length}
          </div>
        </div>

        {/* Assigned reviewer */}
        {workflow.assignedReviewer && (
          <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            <UserIcon className="h-4 w-4" />
            <span>Assigned to: {workflow.assignedReviewer.name}</span>
          </div>
        )}

        {/* Timeline */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center justify-between">
            <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
            {workflow.estimatedCompletionAt && (
              <span>
                Est. completion: {new Date(workflow.estimatedCompletionAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed workflow steps */}
      {showDetails && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-6">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">
            Workflow Steps
          </h4>
          <div className="space-y-2">
            {workflow.steps
              .sort((a, b) => a.stepOrder - b.stepOrder)
              .map((step, index) => (
                <WorkflowStepComponent
                  key={step.id}
                  step={step}
                  isActive={step.status === 'IN_PROGRESS'}
                  isCompleted={step.status === 'COMPLETED'}
                />
              ))}
          </div>

          {/* Error message */}
          {workflow.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {workflow.errorMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const WorkflowStatusPanel: React.FC<WorkflowStatusPanelProps> = ({
  workflows,
  currentArticleId,
  user,
  onRefresh
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'progress'>('created');

  // Filter and sort workflows
  const filteredWorkflows = workflows
    .filter(workflow => {
      if (filterStatus === 'all') return true;
      return workflow.currentState === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'progress':
          return b.completionPercentage - a.completionPercentage;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getStatusCounts = () => {
    return workflows.reduce((acc, workflow) => {
      acc[workflow.currentState] = (acc[workflow.currentState] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  if (workflows.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
        <div className="text-center">
          <DocumentCheckIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Active Workflows
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Create your first article to see workflow status here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {statusCounts.DRAFT || 0}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Drafts</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="text-2xl font-bold text-orange-600">
            {statusCounts.IN_REVIEW || 0}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">In Review</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="text-2xl font-bold text-accent-600">
            {statusCounts.APPROVED || 0}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Approved</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="text-2xl font-bold text-green-600">
            {statusCounts.PUBLISHED || 0}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Published</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Drafts</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="created">Sort by Created</option>
              <option value="priority">Sort by Priority</option>
              <option value="progress">Sort by Progress</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Workflow Cards */}
      <div className="space-y-4" data-testid="workflow-progress">
        {filteredWorkflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            isCurrentArticle={workflow.articleId === currentArticleId}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};

export default WorkflowStatusPanel;