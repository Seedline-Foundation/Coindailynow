# Inter-Agent Workflow System - Complete Agent Interaction Documentation

## Overview

The Inter-Agent Workflow System enables seamless communication and coordination between AI agents in a structured pipeline. This system ensures that when a research agent finishes its work, it automatically passes the data to a reviewer, which then sends it to the writer, then to the translator, then to another reviewer, and finally to a human editor queue.

## 🔄 Agent Interaction Flow

### Standard News Workflow
```
Research Agent → Content Reviewer → Content Writer → Translator → Translation Reviewer → Human Editor Queue
```

### Breaking News Workflow
```
Research Agent → Fact Checker → Breaking Writer → Priority Translator → Quality Assurance → Fast Track Editor
```

### Memecoin Alert Workflow
```
Memecoin Research → Sentiment Reviewer → Alert Writer → Community Translator → Meme Reviewer → Social Media Queue
```

## 🤖 Agent Types and Responsibilities

### 1. Research Agents
- **Crypto Research Agent**: Comprehensive market analysis
- **Memecoin Research Agent**: Social sentiment and meme analysis
- **News Aggregation Agent**: Multi-source news collection

**Output**: Research data, market insights, source verification

### 2. Review Agents
- **Content Review Agent**: Research quality verification
- **Fact Check Agent**: Data accuracy validation
- **Sentiment Review Agent**: Social media sentiment validation
- **Translation Review Agent**: Translation quality assessment
- **Quality Assurance Agent**: Overall content quality check

**Input**: Agent outputs from previous stage
**Output**: Quality scores, validation results, approval/rejection

### 3. Content Generation Agents
- **Content Writing Agent**: Professional article creation
- **Breaking News Writer**: Urgent news content
- **Alert Content Creator**: Quick notification content

**Input**: Research data, review feedback
**Output**: Written articles, headlines, summaries

### 4. Translation Agents
- **Auto Translation Agent**: Standard multi-language translation
- **Priority Translation Agent**: Fast translation for urgent content
- **Community Translation Agent**: Community-focused language adaptation

**Input**: Content to translate, target languages
**Output**: Translated content in multiple African languages

### 5. Human Editor Queue
- **Editor Review**: Final human approval/rejection
- **Content Revision**: Feedback and revision instructions
- **Publication Ready**: Approved content for distribution

**Input**: Complete translated content package
**Output**: Publication approval, revision requests, or rejection

## 🔧 Implementation Details

### Workflow Creation
```typescript
// Create a new workflow
const workflowId = await interAgentWorkflowOrchestrator.createNewsWorkflow(
  'breaking_news',
  {
    topic: 'Bitcoin surges to new all-time high',
    targetLanguages: ['sw', 'fr', 'ar'],
    region: 'all_africa',
    urgency: 'breaking',
    qualityThreshold: 0.8,
    contentLength: 'medium',
    seoKeywords: ['bitcoin', 'africa', 'cryptocurrency']
  },
  'critical'
);
```

### Agent Communication
```typescript
// Each stage automatically receives output from previous stage
const stageResult = await executeWorkflowStage(workflow, currentStage);

// Output is passed to next stage
if (workflow.currentStageIndex + 1 < workflow.stages.length) {
  workflow.stages[workflow.currentStageIndex + 1].input = stageResult.result;
}
```

### Human Editor Interaction
```typescript
// Content is automatically queued for human review
await queueForHumanReview(workflow);

// Human editor makes decision
await processHumanEditorDecision(
  taskId,
  'approved', // or 'rejected' or 'revision_needed'
  'Great work! Content meets standards.',
  undefined,
  'editor@coindaily.africa'
);
```

## 📊 Quality Control System

### Automatic Quality Checks
- **Research Accuracy**: Fact verification and source checking
- **Content Quality**: Writing quality and SEO optimization
- **Translation Quality**: Language accuracy and cultural adaptation
- **Overall Score**: Combined quality assessment

### Quality Thresholds
- **Research Stage**: Minimum 0.75 accuracy score
- **Content Stage**: Minimum 0.70 writing quality
- **Translation Stage**: Minimum 0.80 accuracy
- **Overall**: Configurable threshold per workflow

### Failure Handling
- **Automatic Retry**: Failed stages retry up to 3 times
- **Quality Rejection**: Content below threshold returns to previous stage
- **Human Escalation**: Critical failures escalated to human review

## 🚦 Workflow Status Management

### Workflow States
- **Active**: Currently processing through stages
- **Awaiting Human Review**: Queued for human editor
- **Completed**: Successfully processed and approved
- **Failed**: Encountered unrecoverable error
- **Paused**: Temporarily suspended (manual intervention)

### Stage States
- **Pending**: Waiting to be processed
- **Processing**: Currently being handled by agent
- **Completed**: Successfully finished
- **Failed**: Encountered error
- **Human Review**: Requires human intervention

## 🔄 Content Revision Workflow

When human editors request revisions:

1. **Revision Request**: Editor provides specific feedback
2. **Workflow Restart**: System restarts from appropriate stage
3. **Improved Processing**: Revision instructions guide content generation
4. **Re-review**: Content goes through review stages again
5. **Final Approval**: Human editor reviews revised content

```typescript
// Human editor requests revision
await processHumanEditorDecision(
  taskId,
  'revision_needed',
  'Content needs more African-specific examples',
  'Please add 2-3 real African blockchain use cases',
  'senior_editor@coindaily.africa'
);
```

## 📈 Performance Metrics

### System Metrics
- **Total Workflows**: Number of workflows processed
- **Completion Rate**: Percentage of successfully completed workflows
- **Average Processing Time**: Time from creation to completion
- **Human Approval Rate**: Percentage of content approved by humans
- **Quality Score Average**: Average quality across all content

### Agent Performance
- **Processing Speed**: Time per stage completion
- **Success Rate**: Percentage of successful stage completions
- **Quality Scores**: Average quality output per agent type

## 🔧 Configuration Options

### Workflow Templates
Each workflow type has predefined stages:

```typescript
const WORKFLOW_TEMPLATES = {
  standard_news: [
    { name: 'Research', agentType: 'research.crypto' },
    { name: 'Content Review', agentType: 'review.research' },
    { name: 'Article Writing', agentType: 'content.generate' },
    { name: 'Translation', agentType: 'translation.auto' },
    { name: 'Translation Review', agentType: 'review.translation' },
    { name: 'Human Editor Queue', agentType: 'human.editor' }
  ]
};
```

### Customizable Parameters
- **Quality Thresholds**: Adjust minimum quality requirements
- **Timeout Settings**: Configure stage and workflow timeouts
- **Retry Logic**: Set retry attempts and failure handling
- **Language Support**: Define target languages for translation
- **Priority Levels**: Set workflow priority for processing order

## 🛡️ Error Handling and Recovery

### Automatic Recovery
- **Stage Retry**: Failed stages automatically retry with exponential backoff
- **Graceful Degradation**: System continues with reduced functionality
- **Error Isolation**: Single stage failures don't crash entire workflow

### Manual Intervention
- **Human Escalation**: Critical errors escalated to human operators
- **Manual Stage Skip**: Operators can skip problematic stages
- **Workflow Restart**: Complete workflow restart from any stage

## 🔄 Usage Examples

### Starting a News Workflow
```typescript
import { runAllWorkflowDemonstrations } from './examples/inter-agent-workflow-examples';

// Run complete demonstration
await runAllWorkflowDemonstrations();
```

### Monitoring Workflow Progress
```typescript
// Get workflow status
const workflow = interAgentWorkflowOrchestrator.getWorkflowStatus(workflowId);
console.log(`Current stage: ${workflow.stages[workflow.currentStageIndex].name}`);

// Get human editor queue
const editorQueue = interAgentWorkflowOrchestrator.getHumanEditorQueue();
console.log(`Tasks awaiting human review: ${editorQueue.length}`);
```

### Human Editor Operations
```typescript
// Get next task for review
const nextTask = editorQueue[0];

// Approve content
await interAgentWorkflowOrchestrator.processHumanEditorDecision(
  nextTask.id,
  'approved',
  'Content approved for publication'
);

// Request revision
await interAgentWorkflowOrchestrator.processHumanEditorDecision(
  nextTask.id,
  'revision_needed',
  'Needs more data',
  'Add recent market statistics'
);
```

## ✅ Confirmation: Agents CAN Interact

**YES**, the AI agents in our system are fully capable of interacting with each other according to your specified workflow:

1. **Research Agent finishes** → Automatically passes data to **Reviewer**
2. **Reviewer verifies data** → Sends validated data to **Writer**  
3. **Writer creates content** → Passes article to **Translator**
4. **Translator produces multilingual content** → Sends to **Translation Reviewer**
5. **Translation Reviewer validates** → Queues content for **Human Editor**
6. **Human Editor** → Approves, rejects, or requests revisions

The system includes:
- ✅ **Automatic stage progression**
- ✅ **Data passing between agents**
- ✅ **Quality control at each stage**
- ✅ **Human editor queue management**
- ✅ **Content revision workflows**
- ✅ **Error handling and recovery**
- ✅ **Performance monitoring**

This creates a complete, automated content creation pipeline with human oversight and quality control.
