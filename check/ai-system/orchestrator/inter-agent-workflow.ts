// Inter-Agent Workflow System - Orchestrates complex multi-agent news creation workflows
// Handles Research → Reviewer → Writer → Translator → Reviewer → Human Editor Queue
// Optimized for CoinDaily Africa's requirements: <500ms response, single I/O, SEO-focused
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createAuditLog, AuditActions } from '../../lib/audit';
import { CentralAIOrchestrator, AIOrchestrationResult } from './central-ai-orchestrator';
import { AITask, AITaskType } from '../types/ai-types';

// Initialize orchestrator instance
const centralAIOrchestrator = new CentralAIOrchestrator();

// Workflow-specific types
export interface WorkflowStage {
  id: string;
  name: string;
  agentType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'human_review';
  input?: unknown;
  output?: unknown;
  processingTime?: number;
  error?: string;
  humanReviewRequired?: boolean;
  qualityScore?: number;
  metadata?: Record<string, unknown>;
}

export interface NewsWorkflow {
  id: string;
  type: 'breaking_news' | 'market_analysis' | 'memecoin_alert' | 'educational' | 'interview';
  status: 'active' | 'completed' | 'failed' | 'paused' | 'awaiting_human_review';
  priority: 'low' | 'medium' | 'high' | 'critical';
  stages: WorkflowStage[];
  currentStageIndex: number;
  createdAt: Date;
  completedAt?: Date;
  totalProcessingTime?: number;
  humanEditorQueue?: HumanEditorTask;
  metadata: {
    topic: string;
    targetLanguages: string[];
    region: 'nigeria' | 'kenya' | 'south_africa' | 'ghana' | 'all_africa';
    urgency: 'normal' | 'breaking' | 'urgent';
    qualityThreshold: number; // 0-1 scale
    contentLength: 'short' | 'medium' | 'long';
    seoKeywords: string[];
  };
}

export interface HumanEditorTask {
  id: string;
  workflowId: string;
  assignedEditor?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision_needed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  content: {
    title: string;
    article: string;
    summary: string;
    translations?: Record<string, string>;
    images?: string[];
    metadata: Record<string, unknown>;
  };
  feedback?: string;
  rejectionReason?: string;
  revisionInstructions?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  qualityScores: {
    research: number;
    writing: number;
    translation: number;
    overall: number;
  };
}

export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  finalStage: string;
  output?: unknown;
  humanEditorTaskId?: string;
  processingTime: number;
  error?: string;
  qualityMetrics: {
    researchAccuracy: number;
    writingQuality: number;
    translationQuality: number;
    seoOptimization: number;
    overallScore: number;
  };
}

// Predefined workflow templates
const WORKFLOW_TEMPLATES = {
  standard_news: [
    { name: 'Research', agentType: 'research.crypto', humanReviewRequired: false },
    { name: 'Research Review', agentType: 'review.research', humanReviewRequired: false },
    { name: 'Article Writing', agentType: 'content.generate', humanReviewRequired: false },
    { name: 'Content Review', agentType: 'review.content', humanReviewRequired: false },
    { name: 'Translation', agentType: 'translation.auto', humanReviewRequired: false },
    { name: 'Translation Review', agentType: 'review.translation', humanReviewRequired: false },
    { name: 'Human Editor Queue', agentType: 'human.editor', humanReviewRequired: true }
  ],
  breaking_news: [
    { name: 'Research', agentType: 'research.crypto', humanReviewRequired: false },
    { name: 'Fact Check Review', agentType: 'review.factcheck', humanReviewRequired: false },
    { name: 'Breaking News Writing', agentType: 'content.breaking', humanReviewRequired: false },
    { name: 'Content Review', agentType: 'review.content', humanReviewRequired: false },
    { name: 'Priority Translation', agentType: 'translation.priority', humanReviewRequired: false },
    { name: 'Translation Review', agentType: 'review.translation', humanReviewRequired: false },
    { name: 'Quality Assurance Review', agentType: 'review.quality', humanReviewRequired: false },
    { name: 'Editor Fast Track', agentType: 'human.fast_track', humanReviewRequired: true }
  ],
  memecoin_alert: [
    { name: 'Memecoin Research', agentType: 'research.memecoin', humanReviewRequired: false },
    { name: 'Sentiment Review', agentType: 'review.sentiment', humanReviewRequired: false },
    { name: 'Alert Content Creation', agentType: 'content.alert', humanReviewRequired: false },
    { name: 'Content Review', agentType: 'review.content', humanReviewRequired: false },
    { name: 'Community Translation', agentType: 'translation.community', humanReviewRequired: false },
    { name: 'Translation Review', agentType: 'review.translation', humanReviewRequired: false },
    { name: 'Final Review', agentType: 'review.quality', humanReviewRequired: false },
    { name: 'Social Media Queue', agentType: 'human.social', humanReviewRequired: true }
  ]
};

export class InterAgentWorkflowOrchestrator {
  private activeWorkflows = new Map<string, NewsWorkflow>();
  private humanEditorQueue: HumanEditorTask[] = [];
  private isInitialized = false;
  private workflowMetrics = {
    totalWorkflows: 0,
    completedWorkflows: 0,
    averageProcessingTime: 0,
    humanApprovalRate: 0,
    qualityScoreAverage: 0
  };

  constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔄 Initializing Inter-Agent Workflow Orchestrator...');

    try {
      // Initialize core orchestrator
      await centralAIOrchestrator.initialize();

      // Start background processes
      this.startWorkflowMonitoring();
      this.startHumanEditorQueueManagement();

      this.isInitialized = true;

      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'inter_agent_workflow',
        resourceId: 'workflow_orchestrator',
        details: {
          initialized: true,
          supportedWorkflowTypes: Object.keys(WORKFLOW_TEMPLATES),
          capabilities: [
            'multi_agent_coordination',
            'quality_assurance_pipeline',
            'human_editor_queue_management',
            'automatic_workflow_routing',
            'real_time_progress_tracking',
            'error_recovery_mechanisms',
            'performance_optimization'
          ]
        }
      });

      console.log('✅ Inter-Agent Workflow Orchestrator initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Workflow orchestrator initialization failed';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'inter_agent_workflow',
        resourceId: 'workflow_orchestrator',
        details: { error: errorMessage, initialized: false }
      });

      throw new Error(`Workflow orchestrator initialization failed: ${errorMessage}`);
    }
  }

  // Main entry point for creating a new news workflow
  async createNewsWorkflow(
    type: NewsWorkflow['type'],
    metadata: NewsWorkflow['metadata'],
    priority: NewsWorkflow['priority'] = 'medium'
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const workflowId = `workflow_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const template = WORKFLOW_TEMPLATES[type === 'breaking_news' ? 'breaking_news' : 
                                      type === 'memecoin_alert' ? 'memecoin_alert' : 'standard_news'];

    // Create workflow stages from template
    const stages: WorkflowStage[] = template.map((stage, index) => ({
      id: `${workflowId}_stage_${index}`,
      name: stage.name,
      agentType: stage.agentType,
      status: index === 0 ? 'pending' : 'pending',
      humanReviewRequired: stage.humanReviewRequired
    }));

    const workflow: NewsWorkflow = {
      id: workflowId,
      type,
      status: 'active',
      priority,
      stages,
      currentStageIndex: 0,
      createdAt: new Date(),
      metadata
    };

    this.activeWorkflows.set(workflowId, workflow);

    // Log workflow creation
    await createAuditLog({
      action: AuditActions.ARTICLE_CREATE,
      resource: 'news_workflow',
      resourceId: workflowId,
      details: {
        type,
        priority,
        stageCount: stages.length,
        topic: metadata.topic,
        region: metadata.region,
        urgency: metadata.urgency
      }
    });

    // Start executing the workflow
    this.executeWorkflow(workflowId);

    console.log(`🚀 Created ${type} workflow: ${workflowId} with ${stages.length} stages`);
    return workflowId;
  }

  // Execute a workflow through all its stages
  private async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    console.log(`⚡ Executing workflow: ${workflowId} (${workflow.type})`);

    try {
      while (workflow.currentStageIndex < workflow.stages.length) {
        const currentStage = workflow.stages[workflow.currentStageIndex];
        
        // Skip if stage requires human review - it will be handled separately
        if (currentStage.humanReviewRequired) {
          await this.queueForHumanReview(workflow);
          return;
        }

        console.log(`📝 Processing stage: ${currentStage.name} (${currentStage.agentType})`);
        
        const stageResult = await this.executeWorkflowStage(workflow, currentStage);
        
        if (!stageResult.success) {
          workflow.status = 'failed';
          currentStage.status = 'failed';
          currentStage.error = stageResult.error;
          
          await this.handleWorkflowFailure(workflow, currentStage, stageResult.error || 'Stage execution failed');
          return;
        }

        // Update stage with results
        currentStage.status = 'completed';
        currentStage.output = stageResult.result;
        currentStage.processingTime = stageResult.processingTime;
        currentStage.qualityScore = this.extractQualityScore(stageResult.result);

        // Pass output to next stage
        if (workflow.currentStageIndex + 1 < workflow.stages.length) {
          workflow.stages[workflow.currentStageIndex + 1].input = stageResult.result;
        }

        workflow.currentStageIndex++;
        
        // Add delay between stages to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // All stages completed
      workflow.status = 'completed';
      workflow.completedAt = new Date();
      workflow.totalProcessingTime = workflow.stages.reduce((total, stage) => 
        total + (stage.processingTime || 0), 0);

      await this.logWorkflowCompletion(workflow);

    } catch (error) {
      await this.handleWorkflowFailure(workflow, workflow.stages[workflow.currentStageIndex], 
        error instanceof Error ? error.message : 'Unknown workflow error');
    }
  }

  // Execute a single workflow stage
  private async executeWorkflowStage(
    workflow: NewsWorkflow, 
    stage: WorkflowStage
  ): Promise<AIOrchestrationResult> {
    stage.status = 'processing';
    
    const taskData = this.buildTaskDataForStage(workflow, stage);
    
    try {
      const result = await centralAIOrchestrator.executeTask(taskData);
      
      // Additional validation based on stage type
      if (stage.agentType.includes('review') && result.success) {
        const reviewResult = this.validateReviewStage(result.result, workflow.metadata.qualityThreshold);
        if (!reviewResult.passed) {
          return {
            success: false,
            taskId: result.taskId,
            processingTime: result.processingTime,
            error: `Quality check failed: ${reviewResult.reason}`
          };
        }
      }

      return result;

    } catch (error) {
      return {
        success: false,
        taskId: `${stage.id}_failed`,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'Stage execution failed'
      };
    }
  }

  // Build task data for specific stage
  private buildTaskDataForStage(workflow: NewsWorkflow, stage: WorkflowStage): Omit<AITask, 'id' | 'status' | 'assignedAgent'> {
    const baseTask = {
      type: this.mapStageToTaskType(stage.agentType) as AITaskType,
      priority: workflow.priority,
      payload: {
        topic: workflow.metadata.topic,
        region: workflow.metadata.region,
        urgency: workflow.metadata.urgency,
        contentLength: workflow.metadata.contentLength,
        seoKeywords: workflow.metadata.seoKeywords,
        input: stage.input,
        workflowId: workflow.id,
        stageId: stage.id
      },
      metadata: {
        workflowType: workflow.type,
        stageName: stage.name,
        source: 'inter_agent_workflow'
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    // Customize task based on stage type
    switch (stage.agentType) {
      case 'research.crypto':
      case 'research.memecoin':
        return {
          ...baseTask,
          type: 'research.crypto' as AITaskType,
          payload: {
            ...baseTask.payload,
            symbols: this.extractCryptoSymbols(workflow.metadata.topic),
            analysisType: stage.agentType === 'research.memecoin' ? 'memecoin_focus' : 'comprehensive',
            includeAfricanMarkets: true
          }
        };

      case 'review.research':
      case 'review.content':
      case 'review.translation':
      case 'review.factcheck':
      case 'review.sentiment':
      case 'review.quality':
        return {
          ...baseTask,
          type: 'moderation.content' as AITaskType,
          payload: {
            reviewType: stage.agentType.split('.')[1], // Extract review type (research, content, etc.)
            content: stage.input,
            metadata: {
              originalLanguage: 'en',
              targetLanguage: workflow.metadata.targetLanguages?.[0] || 'en',
              expectedQuality: workflow.metadata.qualityThreshold,
              urgency: workflow.metadata.urgency,
              source: workflow.metadata.topic,
              keywords: workflow.metadata.seoKeywords,
              context: {
                workflowType: workflow.type,
                region: workflow.metadata.region,
                stage: stage.name
              }
            },
            qualityThreshold: workflow.metadata.qualityThreshold
          }
        };

      case 'content.generate':
      case 'content.breaking':
      case 'content.alert':
        return {
          ...baseTask,
          type: 'content.generate' as AITaskType,
          payload: {
            ...baseTask.payload,
            type: stage.agentType === 'content.breaking' ? 'breaking_news' : 'article',
            tone: stage.agentType === 'content.alert' ? 'urgent' : 'informative',
            targetWordCount: this.getWordCount(workflow.metadata.contentLength),
            researchData: stage.input
          }
        };

      case 'translation.auto':
      case 'translation.priority':
      case 'translation.community':
        return {
          ...baseTask,
          type: 'translation.auto' as AITaskType,
          payload: {
            ...baseTask.payload,
            targetLanguages: workflow.metadata.targetLanguages,
            priority: stage.agentType === 'translation.priority' ? 'high' : 'normal',
            content: stage.input
          }
        };

      default:
        return baseTask;
    }
  }

  // Queue workflow for human review
  private async queueForHumanReview(workflow: NewsWorkflow): Promise<void> {
    const previousStages = workflow.stages.slice(0, workflow.currentStageIndex);
    
    // Extract content from previous stages
    const researchOutput = previousStages.find(s => s.agentType.includes('research'))?.output;
    const contentOutput = previousStages.find(s => s.agentType.includes('content'))?.output;
    const translationOutput = previousStages.find(s => s.agentType.includes('translation'))?.output;

    const humanTask: HumanEditorTask = {
      id: `human_${workflow.id}_${Date.now()}`,
      workflowId: workflow.id,
      status: 'pending',
      priority: workflow.priority,
      content: {
        title: this.extractTitle(contentOutput),
        article: this.extractArticle(contentOutput),
        summary: this.extractSummary(contentOutput),
        translations: this.extractTranslations(translationOutput),
        images: this.extractImages(contentOutput),
        metadata: {
          research: researchOutput,
          workflow: {
            type: workflow.type,
            topic: workflow.metadata.topic,
            region: workflow.metadata.region
          }
        }
      },
      submittedAt: new Date(),
      qualityScores: {
        research: this.calculateQualityScore(researchOutput),
        writing: this.calculateQualityScore(contentOutput),
        translation: this.calculateQualityScore(translationOutput),
        overall: 0 // Will be calculated by human editor
      }
    };

    // Calculate overall quality score
    humanTask.qualityScores.overall = (
      humanTask.qualityScores.research +
      humanTask.qualityScores.writing +
      humanTask.qualityScores.translation
    ) / 3;

    this.humanEditorQueue.push(humanTask);
    workflow.status = 'awaiting_human_review';
    workflow.humanEditorQueue = humanTask;

    // Log human review queue addition
    await createAuditLog({
      action: AuditActions.ARTICLE_CREATE,
      resource: 'human_editor_queue',
      resourceId: humanTask.id,
      details: {
        workflowId: workflow.id,
        workflowType: workflow.type,
        priority: workflow.priority,
        qualityScores: humanTask.qualityScores,
        queuePosition: this.humanEditorQueue.length
      }
    });

    console.log(`📋 Queued workflow ${workflow.id} for human review (Task: ${humanTask.id})`);
  }

  // Human editor approves/rejects content
  async processHumanEditorDecision(
    taskId: string, 
    decision: 'approved' | 'rejected' | 'revision_needed',
    feedback?: string,
    revisionInstructions?: string,
    assignedEditor?: string
  ): Promise<void> {
    const task = this.humanEditorQueue.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Human editor task not found: ${taskId}`);
    }

    const workflow = this.activeWorkflows.get(task.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${task.workflowId}`);
    }

    task.status = decision;
    task.reviewedAt = new Date();
    task.feedback = feedback;
    task.assignedEditor = assignedEditor;

    if (decision === 'approved') {
      // Complete the workflow
      workflow.status = 'completed';
      workflow.completedAt = new Date();
      
      await this.logWorkflowCompletion(workflow);
      
      // Remove from human editor queue
      this.humanEditorQueue = this.humanEditorQueue.filter(t => t.id !== taskId);

    } else if (decision === 'revision_needed') {
      task.revisionInstructions = revisionInstructions;
      // Restart workflow from content generation stage
      await this.restartWorkflowFromStage(workflow, 'content.generate');

    } else if (decision === 'rejected') {
      task.rejectionReason = feedback;
      workflow.status = 'failed';
      
      // Remove from human editor queue
      this.humanEditorQueue = this.humanEditorQueue.filter(t => t.id !== taskId);
    }

    // Log human editor decision
    await createAuditLog({
      action: decision === 'approved' ? AuditActions.ARTICLE_PUBLISH : AuditActions.ARTICLE_DELETE,
      resource: 'human_editor_decision',
      resourceId: taskId,
      details: {
        decision,
        workflowId: workflow.id,
        feedback,
        revisionInstructions,
        assignedEditor,
        processingTime: task.reviewedAt ? task.reviewedAt.getTime() - task.submittedAt.getTime() : 0
      }
    });

    console.log(`👤 Human editor ${decision} task ${taskId} for workflow ${workflow.id}`);
  }

  // Get current workflow status
  getWorkflowStatus(workflowId: string): NewsWorkflow | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  // Get human editor queue
  getHumanEditorQueue(): HumanEditorTask[] {
    return [...this.humanEditorQueue].sort((a, b) => {
      // Sort by priority, then by submission time
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.submittedAt.getTime() - b.submittedAt.getTime();
    });
  }

  // Get workflow metrics
  getWorkflowMetrics() {
    return {
      ...this.workflowMetrics,
      activeWorkflows: this.activeWorkflows.size,
      humanEditorQueueLength: this.humanEditorQueue.length
    };
  }

  // Utility methods
  private mapStageToTaskType(agentType: string): AITaskType {
    const mapping: Record<string, AITaskType> = {
      'research.crypto': 'research.crypto',
      'research.memecoin': 'research.crypto',
      'review.research': 'moderation.content',
      'review.content': 'moderation.content',
      'review.factcheck': 'research.factcheck',
      'review.sentiment': 'analysis.sentiment',
      'review.translation': 'moderation.content',
      'review.quality': 'moderation.content',
      'review.meme': 'moderation.content',
      'content.generate': 'content.generate',
      'content.breaking': 'content.generate',
      'content.alert': 'content.generate',
      'translation.auto': 'translation.auto',
      'translation.priority': 'translation.auto',
      'translation.community': 'translation.auto'
    };
    return mapping[agentType] || 'analysis.market';
  }

  private extractCryptoSymbols(topic: string): string[] {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOGE', 'SHIB', 'PEPE'];
    return symbols.filter(symbol => 
      topic.toLowerCase().includes(symbol.toLowerCase()) ||
      topic.toLowerCase().includes(this.getSymbolName(symbol).toLowerCase())
    ).slice(0, 5); // Limit to 5 symbols
  }

  private getSymbolName(symbol: string): string {
    const names: Record<string, string> = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binance',
      'ADA': 'cardano', 'SOL': 'solana', 'DOGE': 'dogecoin',
      'SHIB': 'shiba', 'PEPE': 'pepe'
    };
    return names[symbol] || symbol;
  }

  private getWordCount(length: string): number {
    switch (length) {
      case 'short': return 400;
      case 'medium': return 800;
      case 'long': return 1200;
      default: return 800;
    }
  }

  private extractQualityScore(output: unknown): number {
    if (typeof output === 'object' && output && 'metadata' in output) {
      const metadata = (output as any).metadata;
      return metadata?.qualityScore || metadata?.seoScore || metadata?.accuracy || 0.75;
    }
    return 0.75; // Default score
  }

  private validateReviewStage(output: unknown, threshold: number): { passed: boolean; reason?: string } {
    // Handle Google Review Agent responses
    if (typeof output === 'object' && output && 'approved' in output) {
      const reviewResult = output as any;
      
      // Check if explicitly approved by Google review agent
      if (reviewResult.approved === false) {
        return { 
          passed: false, 
          reason: `Review rejected: ${reviewResult.feedback || 'Content did not meet quality standards'}` 
        };
      }
      
      // Check quality score against threshold
      const qualityScore = reviewResult.qualityScore || 0;
      if (qualityScore < threshold) {
        return { 
          passed: false, 
          reason: `Quality score ${qualityScore} below threshold ${threshold}` 
        };
      }
      
      // Check if next stage is approved
      if (reviewResult.nextStageApproved === false) {
        return { 
          passed: false, 
          reason: `Next stage not approved: ${reviewResult.feedback || 'Revisions needed'}` 
        };
      }
      
      return { passed: true };
    }
    
    // Fallback to legacy quality score extraction
    const score = this.extractQualityScore(output);
    if (score < threshold) {
      return { passed: false, reason: `Quality score ${score} below threshold ${threshold}` };
    }
    return { passed: true };
  }

  private calculateQualityScore(output: unknown): number {
    return this.extractQualityScore(output);
  }

  private extractTitle(output: unknown): string {
    if (typeof output === 'object' && output) {
      return (output as any).title || (output as any).headline || 'Untitled Article';
    }
    return 'Untitled Article';
  }

  private extractArticle(output: unknown): string {
    if (typeof output === 'object' && output) {
      return (output as any).article || (output as any).content || '';
    }
    return '';
  }

  private extractSummary(output: unknown): string {
    if (typeof output === 'object' && output) {
      return (output as any).summary || (output as any).description || '';
    }
    return '';
  }

  private extractTranslations(output: unknown): Record<string, string> {
    if (typeof output === 'object' && output && 'translations' in output) {
      return (output as any).translations || {};
    }
    return {};
  }

  private extractImages(output: unknown): string[] {
    if (typeof output === 'object' && output && 'images' in output) {
      return (output as any).images || [];
    }
    return [];
  }

  private async handleWorkflowFailure(workflow: NewsWorkflow, stage: WorkflowStage, error: string): Promise<void> {
    await createAuditLog({
      action: AuditActions.ARTICLE_DELETE,
      resource: 'workflow_failure',
      resourceId: workflow.id,
      details: {
        workflowType: workflow.type,
        failedStage: stage.name,
        error,
        stageIndex: workflow.currentStageIndex,
        totalStages: workflow.stages.length
      }
    });

    console.error(`❌ Workflow ${workflow.id} failed at stage ${stage.name}: ${error}`);
  }

  private async logWorkflowCompletion(workflow: NewsWorkflow): Promise<void> {
    this.workflowMetrics.totalWorkflows++;
    this.workflowMetrics.completedWorkflows++;
    
    if (workflow.totalProcessingTime) {
      this.workflowMetrics.averageProcessingTime = 
        (this.workflowMetrics.averageProcessingTime * (this.workflowMetrics.completedWorkflows - 1) + 
         workflow.totalProcessingTime) / this.workflowMetrics.completedWorkflows;
    }

    await createAuditLog({
      action: AuditActions.ARTICLE_PUBLISH,
      resource: 'workflow_completion',
      resourceId: workflow.id,
      details: {
        workflowType: workflow.type,
        totalProcessingTime: workflow.totalProcessingTime,
        stagesCompleted: workflow.stages.length,
        qualityScores: workflow.stages.map(s => s.qualityScore || 0),
        humanReviewRequired: workflow.humanEditorQueue ? true : false
      }
    });

    console.log(`✅ Workflow ${workflow.id} completed successfully in ${workflow.totalProcessingTime}ms`);
  }

  private async restartWorkflowFromStage(workflow: NewsWorkflow, stageAgentType: string): Promise<void> {
    const stageIndex = workflow.stages.findIndex(s => s.agentType === stageAgentType);
    if (stageIndex === -1) return;

    // Reset stages from the restart point
    for (let i = stageIndex; i < workflow.stages.length; i++) {
      workflow.stages[i].status = 'pending';
      workflow.stages[i].output = undefined;
      workflow.stages[i].error = undefined;
      workflow.stages[i].processingTime = undefined;
    }

    workflow.currentStageIndex = stageIndex;
    workflow.status = 'active';

    // Remove from human editor queue
    this.humanEditorQueue = this.humanEditorQueue.filter(t => t.workflowId !== workflow.id);

    // Restart execution
    this.executeWorkflow(workflow.id);

    console.log(`🔄 Restarted workflow ${workflow.id} from stage ${stageIndex}: ${stageAgentType}`);
  }

  private startWorkflowMonitoring(): void {
    // Monitor workflows every 30 seconds
    setInterval(() => {
      for (const [workflowId, workflow] of this.activeWorkflows) {
        // Check for stuck workflows (processing for more than 10 minutes)
        const now = Date.now();
        const workflowAge = now - workflow.createdAt.getTime();
        
        if (workflow.status === 'active' && workflowAge > 10 * 60 * 1000) {
          console.warn(`⚠️ Workflow ${workflowId} has been processing for ${workflowAge / 1000}s`);
          
          // Auto-fail workflows stuck for more than 20 minutes
          if (workflowAge > 20 * 60 * 1000) {
            workflow.status = 'failed';
            const currentStage = workflow.stages[workflow.currentStageIndex];
            currentStage.status = 'failed';
            currentStage.error = 'Workflow timeout - exceeded maximum processing time';
            
            this.handleWorkflowFailure(workflow, currentStage, 'Workflow timeout');
          }
        }

        // Clean up completed/failed workflows older than 24 hours
        if (['completed', 'failed'].includes(workflow.status) && workflowAge > 24 * 60 * 60 * 1000) {
          this.activeWorkflows.delete(workflowId);
          console.log(`🧹 Cleaned up old workflow: ${workflowId}`);
        }
      }
    }, 30 * 1000);
  }

  private startHumanEditorQueueManagement(): void {
    // Manage human editor queue every 2 minutes
    setInterval(() => {
      // Remove old pending tasks (older than 24 hours)
      const now = Date.now();
      const tasksToRemove = this.humanEditorQueue.filter(task => 
        task.status === 'pending' && 
        now - task.submittedAt.getTime() > 24 * 60 * 60 * 1000
      );

      for (const task of tasksToRemove) {
        this.humanEditorQueue = this.humanEditorQueue.filter(t => t.id !== task.id);
        console.log(`🧹 Removed expired human editor task: ${task.id}`);
      }

      // Log queue status
      if (this.humanEditorQueue.length > 0) {
        console.log(`📋 Human Editor Queue: ${this.humanEditorQueue.length} tasks pending`);
      }
    }, 2 * 60 * 1000);
  }
}

// Export singleton instance
export const interAgentWorkflowOrchestrator = new InterAgentWorkflowOrchestrator();
