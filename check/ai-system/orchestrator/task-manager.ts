// Task Manager - Handles AI task queuing, scheduling, and lifecycle management
// Optimized for high-performance task processing with <500ms response times

import { AITask } from '../types/ai-types';

export interface TaskQueue {
  pending: AITask[];
  processing: AITask[];
  completed: AITask[];
  failed: AITask[];
}

export interface TaskManagerMetrics {
  totalTasksProcessed: number;
  averageWaitTime: number;
  throughputPerMinute: number;
  failureRate: number;
}

export class TaskManager {
  private queues: TaskQueue;
  private isInitialized = false;
  private processingStartTimes = new Map<string, number>();
  private metrics: TaskManagerMetrics;

  constructor() {
    this.queues = {
      pending: [],
      processing: [],
      completed: [],
      failed: []
    };
    this.metrics = {
      totalTasksProcessed: 0,
      averageWaitTime: 0,
      throughputPerMinute: 0,
      failureRate: 0
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Start background cleanup process
    this.startCleanupProcess();
    this.isInitialized = true;
  }

  async addTask(task: AITask): Promise<void> {
    // Priority-based insertion
    const insertIndex = this.findInsertionIndex(task);
    this.queues.pending.splice(insertIndex, 0, task);
  }

  async updateTask(task: AITask): Promise<void> {
    // Remove from current queue
    this.removeTaskFromQueues(task.id);

    // Add to appropriate queue based on status
    switch (task.status) {
      case 'processing':
        this.queues.processing.push(task);
        this.processingStartTimes.set(task.id, Date.now());
        break;
      case 'completed':
        this.queues.completed.push(task);
        this.updateMetricsOnCompletion(task, true);
        break;
      case 'failed':
        this.queues.failed.push(task);
        this.updateMetricsOnCompletion(task, false);
        break;
      default:
        this.queues.pending.push(task);
    }
  }

  getQueueLength(): number {
    return this.queues.pending.length + this.queues.processing.length;
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && this.queues.pending.length < 1000; // Prevent queue overflow
  }

  getTasksByStatus(status: AITask['status']): AITask[] {
    switch (status) {
      case 'pending': return [...this.queues.pending];
      case 'processing': return [...this.queues.processing];
      case 'completed': return [...this.queues.completed];
      case 'failed': return [...this.queues.failed];
      default: return [];
    }
  }

  getMetrics(): TaskManagerMetrics {
    return { ...this.metrics };
  }

  private findInsertionIndex(task: AITask): number {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const taskPriority = priorityOrder[task.priority];

    for (let i = 0; i < this.queues.pending.length; i++) {
      const existingPriority = priorityOrder[this.queues.pending[i].priority];
      if (taskPriority < existingPriority) {
        return i;
      }
    }

    return this.queues.pending.length;
  }

  private removeTaskFromQueues(taskId: string): void {
    Object.values(this.queues).forEach(queue => {
      const index = queue.findIndex(task => task.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    });
    this.processingStartTimes.delete(taskId);
  }

  private updateMetricsOnCompletion(task: AITask, success: boolean): void {
    this.metrics.totalTasksProcessed++;
    
    if (!success) {
      this.metrics.failureRate = (this.metrics.failureRate * (this.metrics.totalTasksProcessed - 1) + 1) / this.metrics.totalTasksProcessed;
    } else {
      this.metrics.failureRate = (this.metrics.failureRate * (this.metrics.totalTasksProcessed - 1)) / this.metrics.totalTasksProcessed;
    }

    // Update wait time if we have processing start time
    const processingStartTime = this.processingStartTimes.get(task.id);
    if (processingStartTime && task.processingTime && task.metadata.requestedAt) {
      const waitTime = processingStartTime - task.metadata.requestedAt.getTime();
      this.metrics.averageWaitTime = (this.metrics.averageWaitTime * (this.metrics.totalTasksProcessed - 1) + waitTime) / this.metrics.totalTasksProcessed;
    }
  }

  private startCleanupProcess(): void {
    // Clean up completed/failed tasks every 5 minutes
    setInterval(() => {
      const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago

      this.queues.completed = this.queues.completed.filter(
        task => task.metadata.requestedAt && task.metadata.requestedAt.getTime() > cutoffTime
      );

      this.queues.failed = this.queues.failed.filter(
        task => task.metadata.requestedAt && task.metadata.requestedAt.getTime() > cutoffTime
      );
    }, 5 * 60 * 1000);
  }
}
