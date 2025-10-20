# Interactive Onboarding Guide - CoinDaily AI System

## Complete Onboarding Flows for All User Roles

**Version**: 1.0.0  
**Last Updated**: October 20, 2025  
**Implementation**: React Components with Step Tracking

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Implementation](#technical-implementation)
3. [Super Admin Onboarding](#super-admin-onboarding)
4. [Editor Onboarding](#editor-onboarding)
5. [End User Onboarding](#end-user-onboarding)
6. [Progress Tracking System](#progress-tracking-system)
7. [UI Components & Mockups](#ui-components--mockups)
8. [Testing Checklist](#testing-checklist)

---

## Overview

### Purpose

Interactive onboarding guides new users through their first experience with CoinDaily, tailored to their specific role. Each onboarding flow:

- **Introduces key features** progressively
- **Provides hands-on practice** with guided tasks
- **Tracks completion progress** with visual indicators
- **Offers contextual help** at each step
- **Enables skip/resume** for flexibility

### Design Principles

1. **Progressive Disclosure**: Show only what's needed at each step
2. **Learning by Doing**: Users complete real tasks, not just read
3. **Clear Progress**: Visual indicators show completion status
4. **Contextual Help**: Tooltips and help text available on-demand
5. **Flexibility**: Users can skip, pause, and resume anytime

### User Roles Covered

| Role | Steps | Duration | Completion Reward |
|------|-------|----------|-------------------|
| **Super Admin** | 12 steps | 15-20 min | Badge + System Overview Report |
| **Editor** | 10 steps | 12-15 min | Badge + Quality Metrics Dashboard |
| **End User** | 8 steps | 8-10 min | Badge + 7-Day Free Premium Trial |

---

## Technical Implementation

### Technology Stack

```typescript
// Core onboarding library
import { Joyride, Step, CallBackProps } from 'react-joyride';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { api } from '@/services/api';

// Progress tracking
interface OnboardingProgress {
  userId: string;
  role: 'super_admin' | 'editor' | 'end_user';
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  startedAt: Date;
  lastUpdated: Date;
  completed: boolean;
  skipped: boolean;
}
```

### State Management

```typescript
// Zustand store for onboarding state
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingStore {
  progress: OnboardingProgress | null;
  isActive: boolean;
  currentStep: number;
  
  startOnboarding: (role: string) => void;
  completeStep: (stepId: string) => void;
  skipOnboarding: () => void;
  resumeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>(
  persist(
    (set, get) => ({
      progress: null,
      isActive: false,
      currentStep: 0,
      
      startOnboarding: async (role) => {
        const progress = await api.startOnboarding(role);
        set({ progress, isActive: true, currentStep: 0 });
      },
      
      completeStep: async (stepId) => {
        const { progress } = get();
        if (!progress) return;
        
        const updatedProgress = await api.updateOnboardingProgress({
          ...progress,
          completedSteps: [...progress.completedSteps, stepId],
          currentStep: progress.currentStep + 1,
          lastUpdated: new Date(),
        });
        
        set({ progress: updatedProgress, currentStep: updatedProgress.currentStep });
      },
      
      skipOnboarding: async () => {
        const { progress } = get();
        if (!progress) return;
        
        await api.skipOnboarding(progress.userId);
        set({ isActive: false, progress: { ...progress, skipped: true } });
      },
      
      resumeOnboarding: () => {
        set({ isActive: true });
      },
      
      resetOnboarding: async () => {
        const { progress } = get();
        if (!progress) return;
        
        await api.resetOnboarding(progress.userId);
        set({ progress: null, isActive: false, currentStep: 0 });
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
```

### Component Structure

```
components/
├── Onboarding/
│   ├── OnboardingProvider.tsx      # Wrapper component
│   ├── OnboardingStep.tsx          # Individual step component
│   ├── ProgressBar.tsx             # Visual progress indicator
│   ├── TooltipOverlay.tsx          # Highlight + tooltip
│   ├── CompletionModal.tsx         # Success celebration
│   └── flows/
│       ├── SuperAdminFlow.tsx      # Super Admin steps
│       ├── EditorFlow.tsx          # Editor steps
│       └── EndUserFlow.tsx         # End User steps
```

---

## Super Admin Onboarding

### Overview

**Total Steps**: 12  
**Estimated Time**: 15-20 minutes  
**Completion Reward**: "System Master" badge + comprehensive system report

### Step Flow

```
Welcome → Dashboard Tour → Agent Overview → Create Test Task → 
Monitor Task → Review Results → Set Budget → Configure Agent → 
View Moderation → Check Costs → Read Documentation → Complete!
```

### Detailed Steps

#### Step 1: Welcome & Introduction

**Goal**: Orient new Super Admin to their role and responsibilities

```typescript
{
  id: 'sa-welcome',
  title: 'Welcome, Super Admin!',
  target: '.dashboard-container',
  content: `
    You're now a Super Admin for CoinDaily's AI system! 
    
    Your responsibilities include:
    • Managing 8 AI agents that power our content
    • Monitoring system health and performance
    • Controlling budgets and costs
    • Overseeing content moderation
    • Approving AI-generated content
    
    This 15-minute tour will show you everything you need to know.
    Let's get started!
  `,
  placement: 'center',
  disableBeacon: true,
  hideCloseButton: true,
  showSkipButton: true,
  locale: {
    next: "Let's Begin!",
    skip: "I'll explore on my own"
  }
}
```

**Visual**: 
```
┌─────────────────────────────────────────────┐
│          🎉 Welcome to CoinDaily!           │
│                                             │
│     You're now a Super Admin!               │
│                                             │
│  👤 Your Role: AI System Manager            │
│  🎯 Mission: Keep quality high, costs low   │
│  ⚡ Power: Full system control              │
│                                             │
│  This tour takes 15 minutes.                │
│  You can skip or resume anytime.            │
│                                             │
│  [ Skip Tour ]        [ Let's Begin! → ]    │
└─────────────────────────────────────────────┘
```

#### Step 2: Dashboard Overview

**Goal**: Familiarize with main dashboard interface

```typescript
{
  id: 'sa-dashboard',
  title: 'Your Command Center',
  target: '.system-overview-panel',
  content: `
    This is your main dashboard—your command center.
    
    Key panels:
    • System Overview: Health status at a glance
    • Real-Time Metrics: Live performance data
    • Activity Feed: Recent system events
    • Quick Actions: Common tasks
    
    Everything updates in real-time via WebSocket.
    
    Try clicking "System Overview" to see detailed metrics.
  `,
  placement: 'bottom',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.system-overview-panel',
}
```

**Interactive Task**: Click "System Overview" to proceed

#### Step 3: Agent Overview

**Goal**: Understand the 8 AI agents and their functions

```typescript
{
  id: 'sa-agents',
  title: 'Meet Your AI Agents',
  target: '.agent-list',
  content: `
    CoinDaily uses 8 specialized AI agents:
    
    1. 🔍 Research Agent - Finds trending topics
    2. ✍️ Content Agent - Writes articles
    3. ✅ Quality Agent - Reviews content
    4. 🌍 Translation Agent - Translates to 13 languages
    5. 🎯 SEO Agent - Optimizes for search
    6. 🎨 Image Agent - Generates visuals
    7. 📊 Market Sentiment - Analyzes trends
    8. 🛡️ Moderation Agent - Detects violations
    
    Each agent has different costs and capabilities.
    
    Click on the "Content Generation Agent" to view its settings.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.agent-item[data-agent="content-generation"]',
}
```

**Interactive Task**: Click Content Generation Agent

#### Step 4: Create Test Task

**Goal**: Learn how to manually trigger AI content generation

```typescript
{
  id: 'sa-create-task',
  title: 'Create Your First AI Task',
  target: '.create-task-button',
  content: `
    Let's create your first AI task!
    
    We'll generate a test article to see the system in action.
    
    Click "Create Task" to open the task creation form.
  `,
  placement: 'bottom',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.create-task-button',
},
{
  id: 'sa-task-form',
  title: 'Fill in Task Details',
  target: '.task-creation-form',
  content: `
    Fill in the form:
    
    • Task Type: "Generate Article"
    • Topic: "Bitcoin price reaches $100K"
    • Priority: "Normal"
    • Target Length: "500 words"
    
    Leave other fields as default.
    
    Click "Submit Task" when ready.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'submit',
  actionTarget: '.task-creation-form',
}
```

**Interactive Task**: Create and submit a test task

#### Step 5: Monitor Task Progress

**Goal**: Learn to track task execution in real-time

```typescript
{
  id: 'sa-task-queue',
  title: 'Watch Your Task in Action',
  target: '.task-queue',
  content: `
    Your task is now in the queue!
    
    Watch as it progresses through stages:
    1. ⏳ Queued - Waiting for agent
    2. 🔄 Processing - Agent working
    3. ✅ Completed - Ready for review
    
    Tasks usually complete in 30-60 seconds.
    
    The status updates in real-time via WebSocket.
    
    Wait for your task to complete...
  `,
  placement: 'left',
  waitForElement: '.task-status[data-status="completed"]',
  timeout: 90000, // 90 seconds
}
```

**Interactive Task**: Wait for task completion (auto-advances)

#### Step 6: Review Generated Content

**Goal**: Learn the human approval workflow

```typescript
{
  id: 'sa-review-content',
  title: 'Review AI-Generated Content',
  target: '.approval-queue',
  content: `
    Great! Your article is ready for review.
    
    Notice the quality score: This shows the AI's confidence.
    • 0.90+: Auto-approved (high quality)
    • 0.70-0.89: Human review needed
    • Below 0.70: Rejected automatically
    
    Your test article scored 0.85—needs human review.
    
    Click "Review Now" to see the content.
  `,
  placement: 'bottom',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.approval-queue .review-button:first-child',
}
```

**Interactive Task**: Open article for review

#### Step 7: Approve or Reject Content

**Goal**: Understand approval decisions

```typescript
{
  id: 'sa-approval-decision',
  title: 'Make Your Approval Decision',
  target: '.approval-actions',
  content: `
    Review the article and its quality breakdown.
    
    Four options:
    • ✅ Approve: Publish immediately
    • ✏️ Edit & Approve: Quick fixes
    • 🔄 Request Revision: Ask AI to improve
    • ❌ Reject: Major issues
    
    For this tutorial, click "Approve" to publish.
    
    Real approvals require careful review!
  `,
  placement: 'top',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.approve-button',
}
```

**Interactive Task**: Approve the test article

#### Step 8: Set Daily Budget

**Goal**: Learn budget management to control costs

```typescript
{
  id: 'sa-set-budget',
  title: 'Control Your AI Costs',
  target: '.budget-settings-link',
  content: `
    AI costs add up quickly! Budget management is crucial.
    
    Navigate to Budget Settings to set daily limits.
    
    Click "Budget Settings" in the sidebar.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'navigate',
  actionTarget: '.budget-settings-link',
},
{
  id: 'sa-configure-budget',
  title: 'Configure Budget Limits',
  target: '.budget-form',
  content: `
    Set your budget parameters:
    
    • Daily Budget: $500 (recommended starting point)
    • Alert at 80%: Get warning when $400 spent
    • Alert at 90%: Urgent notification + throttling
    • Action at 100%: Pause all tasks
    
    For this tutorial, accept the default values.
    
    Click "Save Budget" to continue.
  `,
  placement: 'left',
  spotlightClicks: true,
  action: 'submit',
  actionTarget: '.budget-form',
}
```

**Interactive Task**: Configure budget settings

#### Step 9: Configure an Agent

**Goal**: Learn to adjust agent settings for optimization

```typescript
{
  id: 'sa-agent-config',
  title: 'Fine-Tune Agent Settings',
  target: '.agent-settings-link',
  content: `
    Each agent is configurable for your needs.
    
    Let's adjust the Content Generation Agent.
    
    Navigate to "Agents" → "Content Generation Agent".
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'navigate',
  actionTarget: '.agent-settings-link',
},
{
  id: 'sa-adjust-settings',
  title: 'Adjust Agent Parameters',
  target: '.agent-config-form',
  content: `
    Key settings to understand:
    
    • Temperature (0.7): Controls creativity
      - Lower = More factual
      - Higher = More creative
    
    • Quality Thresholds:
      - Auto-approve: 0.90
      - Human review: 0.70
      - Reject: 0.50
    
    • Cost Limits: Max spend per task
    
    For now, leave settings as-is. Just familiarize yourself.
    
    Click "Next" to continue.
  `,
  placement: 'left',
  disableInteraction: true,
}
```

**Interactive Task**: View agent configuration (no changes)

#### Step 10: View Moderation Queue

**Goal**: Understand content moderation capabilities

```typescript
{
  id: 'sa-moderation',
  title: 'Content Moderation System',
  target: '.moderation-queue-link',
  content: `
    The Moderation Agent detects policy violations:
    • Unlisted token mentions
    • Spam and scams
    • Misinformation
    • Inappropriate content
    
    Violations apply penalties to authors and commenters.
    
    Click "Moderation Queue" to see flagged content.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'navigate',
  actionTarget: '.moderation-queue-link',
}
```

**Interactive Task**: Navigate to moderation queue

#### Step 11: Check Cost Report

**Goal**: Learn to monitor and optimize spending

```typescript
{
  id: 'sa-cost-report',
  title: 'Monitor Your Spending',
  target: '.cost-dashboard-link',
  content: `
    Regular cost monitoring prevents budget overruns.
    
    The Cost Dashboard shows:
    • Daily/weekly/monthly spending
    • Breakdown by agent
    • Cost trends and forecasts
    • Optimization recommendations
    
    Click "Costs" to view your spending report.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'navigate',
  actionTarget: '.cost-dashboard-link',
}
```

**Interactive Task**: View cost dashboard

#### Step 12: Complete Onboarding

**Goal**: Celebrate completion and provide next steps

```typescript
{
  id: 'sa-complete',
  title: '🎉 Congratulations!',
  target: 'body',
  content: `
    You've completed Super Admin onboarding!
    
    You've learned:
    ✅ Dashboard navigation
    ✅ Agent management
    ✅ Task creation and monitoring
    ✅ Content approval workflow
    ✅ Budget configuration
    ✅ Cost monitoring
    ✅ Moderation oversight
    
    Next steps:
    1. Read the Super Admin Guide (detailed reference)
    2. Join the #super-admins Slack channel
    3. Review today's metrics daily
    4. Attend weekly optimization meeting
    
    Your "System Master" badge and system report
    have been added to your profile!
    
    Welcome to the team! 🚀
  `,
  placement: 'center',
  hideCloseButton: true,
  locale: {
    last: 'Go to Dashboard'
  }
}
```

**Interactive Task**: Click to complete and go to dashboard

---

## Editor Onboarding

### Overview

**Total Steps**: 10  
**Estimated Time**: 12-15 minutes  
**Completion Reward**: "Quality Guardian" badge + personalized quality metrics

### Step Flow

```
Welcome → Queue Overview → Open Article → Quality Check → 
Provide Feedback → Approve Content → Request Revision → 
Translation Review → Metrics Dashboard → Complete!
```

### Detailed Steps

#### Step 1: Welcome Editor

```typescript
{
  id: 'ed-welcome',
  title: 'Welcome, Editor!',
  target: '.editor-dashboard',
  content: `
    Welcome to your role as a Content Editor!
    
    Your mission: Ensure every article meets CoinDaily's
    high-quality standards.
    
    You'll review AI-generated content, provide feedback,
    and approve articles for publication.
    
    This 12-minute tour shows you everything you need.
    
    Ready to maintain world-class content quality?
  `,
  placement: 'center',
  disableBeacon: true,
}
```

#### Step 2: Review Queue Tour

```typescript
{
  id: 'ed-queue',
  title: 'Your Review Queue',
  target: '.review-queue',
  content: `
    This is your Review Queue—articles awaiting your approval.
    
    Articles are prioritized:
    • 🔴 HIGH: Breaking news (review in 30 min)
    • ⚪ NORMAL: Educational (review in 4 hours)
    • 🟢 LOW: Updates (review in 24 hours)
    
    You'll see:
    • Title and quality score
    • Time since generation
    • Priority level
    • Content category
    
    Click the first article to start reviewing.
  `,
  placement: 'left',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.queue-item:first-child .review-button',
}
```

#### Step 3: Article Interface

```typescript
{
  id: 'ed-article-interface',
  title: 'Review Interface Overview',
  target: '.article-review-container',
  content: `
    The review interface has three sections:
    
    📄 LEFT: Article content with formatting
    📊 RIGHT: Quality breakdown (7 metrics)
    🎛️ BOTTOM: Action buttons
    
    Your workflow:
    1. Read the full article
    2. Check quality metrics
    3. Verify facts and claims
    4. Decide: Approve, Edit, Revise, or Reject
    
    Let's review this article together.
  `,
  placement: 'top',
}
```

#### Step 4: Quality Assessment

```typescript
{
  id: 'ed-quality-check',
  title: 'Quality Breakdown',
  target: '.quality-metrics-panel',
  content: `
    The AI provides 7 quality scores:
    
    1. Grammar (0.92): Spelling, syntax, punctuation
    2. Accuracy (0.88): Factual correctness
    3. Readability (0.85): Clear, easy to understand
    4. SEO (0.78): Search optimization
    5. Completeness (0.90): Covers all key points
    6. Brand Voice: Matches CoinDaily style
    7. Visual Elements: Images, charts included
    
    Your job: Verify these scores are accurate.
    
    Read the article now, checking each criterion.
    
    Click "Next" when you've finished reading.
  `,
  placement: 'left',
  disableOverlay: true,
}
```

#### Step 5: Provide Feedback

```typescript
{
  id: 'ed-feedback',
  title: 'Give Constructive Feedback',
  target: '.feedback-textarea',
  content: `
    Feedback helps the AI learn and improve!
    
    Good feedback is:
    • Specific: Point to exact issues
    • Constructive: Explain what's good too
    • Actionable: Clear what needs changing
    
    Try writing feedback for this article:
    "The market analysis is strong and well-sourced.
    SEO could be improved by adding more relevant keywords
    in the first paragraph. Overall excellent quality."
    
    Type your feedback in the box below.
  `,
  placement: 'top',
  spotlightClicks: true,
  action: 'input',
  actionTarget: '.feedback-textarea',
}
```

#### Step 6: Approve Article

```typescript
{
  id: 'ed-approve',
  title: 'Approve for Publication',
  target: '.approve-button',
  content: `
    This article meets our quality standards!
    
    When you approve:
    • Article publishes immediately
    • Auto-translation begins (13 languages)
    • Quality score recorded for AI training
    • Your feedback stored for future reference
    
    Click "Approve" to publish this article.
  `,
  placement: 'top',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.approve-button',
}
```

#### Step 7: Request Revision (Demo)

```typescript
{
  id: 'ed-revision-demo',
  title: 'When to Request Revisions',
  target: '.revision-button',
  content: `
    Sometimes articles need improvements.
    
    Use "Request Revision" when:
    • Content is mostly good but needs specific fixes
    • SEO optimization is weak
    • Examples or data need updating
    • Structure needs reorganization
    
    The AI will regenerate based on your specific feedback.
    
    Typical revision turnaround: 5-10 minutes.
    
    Let's see how this works with the next article...
  `,
  placement: 'top',
}
```

#### Step 8: Translation Review

```typescript
{
  id: 'ed-translation',
  title: 'Review Translations',
  target: '.translation-panel',
  content: `
    After approval, articles auto-translate to 13 languages:
    
    African: Swahili, Hausa, Yoruba, Igbo, Amharic, Zulu, Somali
    European: Spanish, Portuguese, French, Italian, German, Russian
    
    The Translation Quality Agent reviews each version.
    
    You should spot-check translations in languages you know.
    
    Click "View Translations" to see all versions.
  `,
  placement: 'left',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.view-translations-button',
}
```

#### Step 9: Performance Metrics

```typescript
{
  id: 'ed-metrics',
  title: 'Track Your Performance',
  target: '.editor-metrics-link',
  content: `
    Monitor your review performance:
    
    Target Metrics:
    • Approval Rate: 70-80%
    • Revision Rate: 15-25%
    • Rejection Rate: Under 5%
    • Avg Review Time: 10-15 minutes
    • Feedback Quality Score: Above 0.85
    
    Your metrics appear on your dashboard.
    
    Click "My Metrics" to view your stats.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'navigate',
  actionTarget: '.editor-metrics-link',
}
```

#### Step 10: Complete Onboarding

```typescript
{
  id: 'ed-complete',
  title: '🎉 Onboarding Complete!',
  target: 'body',
  content: `
    Congratulations! You're now a certified CoinDaily Editor!
    
    You've learned:
    ✅ Navigating your review queue
    ✅ Assessing content quality (7 criteria)
    ✅ Providing effective feedback
    ✅ Approving and publishing articles
    ✅ Requesting revisions
    ✅ Reviewing translations
    ✅ Tracking your performance
    
    Next steps:
    1. Read the Editor Guide (detailed reference)
    2. Review your first 5 real articles
    3. Join #editors Slack for questions
    4. Attend weekly quality calibration meeting
    
    Your "Quality Guardian" badge has been awarded!
    
    Let's maintain world-class content! 📝
  `,
  placement: 'center',
  locale: {
    last: 'Start Reviewing'
  }
}
```

---

## End User Onboarding

### Overview

**Total Steps**: 8  
**Estimated Time**: 8-10 minutes  
**Completion Reward**: "CoinDaily Explorer" badge + 7-day free Premium trial

### Step Flow

```
Welcome → Set Interests → Choose Language → Explore Feed → 
Read Article → Personalize → Mobile App → Complete!
```

### Detailed Steps

#### Step 1: Welcome User

```typescript
{
  id: 'eu-welcome',
  title: 'Welcome to CoinDaily!',
  target: '.homepage',
  content: `
    Welcome to CoinDaily—Africa's premier AI-powered
    cryptocurrency news platform!
    
    Get personalized crypto news in your language,
    powered by advanced AI technology.
    
    This quick 8-minute tour will help you:
    • Set up your personalized news feed
    • Choose your preferred language
    • Discover AI-powered features
    • Join our vibrant community
    
    Let's get started!
  `,
  placement: 'center',
  disableBeacon: true,
}
```

#### Step 2: Select Interests

```typescript
{
  id: 'eu-interests',
  title: 'Tell Us What Interests You',
  target: '.interest-selector',
  content: `
    Choose 3-5 topics you want to follow:
    
    • Bitcoin & Major Cryptocurrencies
    • Altcoins & Emerging Tokens
    • DeFi (Decentralized Finance)
    • NFTs & Digital Collectibles
    • Blockchain Technology
    • Trading & Investment
    • Regulations & Policy
    • African Crypto Market
    
    Your selections personalize your news feed.
    
    The AI learns from your reading habits too!
    
    Select at least 3 topics to continue.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'select-multiple',
  actionTarget: '.interest-checkbox',
  minSelections: 3,
}
```

#### Step 3: Choose Language

```typescript
{
  id: 'eu-language',
  title: 'Select Your Language',
  target: '.language-selector',
  content: `
    CoinDaily supports 13 languages:
    
    🌍 African Languages:
    Swahili, Hausa, Yoruba, Igbo, Amharic, Zulu, Somali
    
    🌐 International:
    English, Spanish, Portuguese, French, Italian, German, Russian
    
    All content is AI-translated with human quality review.
    
    You can change language anytime, even per-article!
    
    Select your preferred language.
  `,
  placement: 'left',
  spotlightClicks: true,
  action: 'select',
  actionTarget: '.language-dropdown',
}
```

#### Step 4: Explore Personalized Feed

```typescript
{
  id: 'eu-feed',
  title: 'Your Personalized News Feed',
  target: '.news-feed',
  content: `
    Welcome to your personalized feed! 🎯
    
    The AI curates articles based on:
    • Your selected interests
    • Reading history
    • Trending topics
    • Regional relevance
    
    Each article shows:
    • Headline and featured image
    • Quick summary
    • Reading time
    • Category
    
    The more you read and rate, the smarter your feed becomes!
    
    Scroll through your feed now.
  `,
  placement: 'top',
  disableOverlay: true,
}
```

#### Step 5: Read an Article

```typescript
{
  id: 'eu-read-article',
  title: 'Read Your First Article',
  target: '.article-card:first-child',
  content: `
    Let's read an article together!
    
    Click any article card to open the full content.
    
    Try clicking this featured article about Bitcoin.
  `,
  placement: 'bottom',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.article-card:first-child',
},
{
  id: 'eu-article-features',
  title: 'Article Reading Features',
  target: '.article-toolbar',
  content: `
    Check out these AI-powered features:
    
    🔊 Listen: Text-to-speech for hands-free reading
    📝 Summarize: Get key points in 30 seconds
    🌐 Translate: Switch to any of 13 languages
    💾 Save: Add to your reading list
    📤 Share: Share on social media
    
    Try clicking "Quick Summary" to see the main points.
  `,
  placement: 'bottom',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.summary-button',
}
```

#### Step 6: Rate Content

```typescript
{
  id: 'eu-feedback',
  title: 'Help Personalize Your Feed',
  target: '.article-rating',
  content: `
    Found this article helpful? Let us know!
    
    👍 Thumbs Up: Show me more like this
    👎 Thumbs Down: Show me less like this
    
    Your ratings train the AI to show you content
    you'll love.
    
    Try rating this article now.
  `,
  placement: 'top',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.rating-button',
}
```

#### Step 7: Personalization Settings

```typescript
{
  id: 'eu-personalization',
  title: 'Fine-Tune Your Experience',
  target: '.settings-link',
  content: `
    Want more control? Customize your experience!
    
    Settings include:
    • Content preferences (topics, regions, experience level)
    • Language preferences
    • Notification settings
    • Reading preferences (font size, theme)
    • Privacy controls
    
    Click "Settings" to explore customization options.
  `,
  placement: 'right',
  spotlightClicks: true,
  action: 'navigate',
  actionTarget: '.settings-link',
}
```

#### Step 8: Mobile App Promotion

```typescript
{
  id: 'eu-mobile-app',
  title: 'Get the Mobile App',
  target: '.mobile-app-banner',
  content: `
    Take CoinDaily on the go! 📱
    
    Mobile app exclusive features:
    • 🎤 Voice commands ("What's Bitcoin's price?")
    • 📊 Home screen widgets
    • 📴 Offline reading mode
    • ⚡ Quick scan mode
    • 🔔 Real-time price alerts
    
    Available for iOS and Android.
    
    Download links sent to your email!
  `,
  placement: 'top',
  spotlightClicks: true,
  action: 'click',
  actionTarget: '.download-app-button',
}
```

#### Step 9: Complete Onboarding

```typescript
{
  id: 'eu-complete',
  title: '🎉 You're All Set!',
  target: 'body',
  content: `
    Congratulations! You're now a CoinDaily pro!
    
    You've learned:
    ✅ Personalizing your news feed
    ✅ Selecting your language
    ✅ Reading and rating articles
    ✅ Using AI-powered features
    ✅ Customizing your experience
    
    Special welcome gift:
    🎁 7-Day Free Premium Trial
    
    Premium includes:
    • Ad-free experience
    • Early access to breaking news
    • Advanced market analytics
    • Price alerts for 100+ coins
    • Exclusive webinars
    
    Your "CoinDaily Explorer" badge has been awarded!
    
    Enjoy exploring the world of cryptocurrency! 🚀
  `,
  placement: 'center',
  locale: {
    last: 'Start Exploring'
  }
}
```

---

## Progress Tracking System

### Database Schema

```sql
-- Onboarding progress table
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'super_admin' | 'editor' | 'end_user'
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completed_steps TEXT[] DEFAULT '{}',
  started_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL,
  skipped BOOLEAN DEFAULT FALSE,
  completion_time_seconds INTEGER NULL,
  
  CONSTRAINT unique_user_role UNIQUE(user_id, role),
  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'editor', 'end_user'))
);

-- Index for queries
CREATE INDEX idx_onboarding_user_role ON onboarding_progress(user_id, role);
CREATE INDEX idx_onboarding_completed ON onboarding_progress(completed_at) WHERE completed_at IS NOT NULL;

-- Onboarding badges
CREATE TABLE onboarding_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  role VARCHAR(50) NOT NULL,
  
  CONSTRAINT unique_user_badge UNIQUE(user_id, badge_type)
);
```

### API Endpoints

```typescript
// Start onboarding for a role
POST /api/onboarding/start
Request: { role: 'super_admin' | 'editor' | 'end_user' }
Response: { progress: OnboardingProgress }

// Update progress (complete a step)
POST /api/onboarding/progress
Request: { 
  stepId: string, 
  completedAt: Date,
  timeSpent: number 
}
Response: { progress: OnboardingProgress }

// Skip onboarding
POST /api/onboarding/skip
Request: { role: string }
Response: { success: boolean }

// Resume onboarding
POST /api/onboarding/resume
Request: { role: string }
Response: { progress: OnboardingProgress }

// Get onboarding status
GET /api/onboarding/status?role=super_admin
Response: { 
  progress: OnboardingProgress | null,
  hasCompleted: boolean,
  completionRate: number 
}

// Reset onboarding (for re-tutorial)
POST /api/onboarding/reset
Request: { role: string }
Response: { success: boolean }
```

### Analytics Tracking

```typescript
// Track onboarding events
interface OnboardingEvent {
  userId: string;
  role: string;
  eventType: 'started' | 'step_completed' | 'skipped' | 'completed' | 'resumed';
  stepId?: string;
  timestamp: Date;
  timeSpent?: number;
  metadata?: Record<string, any>;
}

// Analytics queries
const analytics = {
  // Completion rate by role
  completionRate: async (role: string) => {
    const total = await db.onboardingProgress.count({ where: { role } });
    const completed = await db.onboardingProgress.count({ 
      where: { role, completed: true } 
    });
    return (completed / total) * 100;
  },
  
  // Average completion time
  avgCompletionTime: async (role: string) => {
    const result = await db.onboardingProgress.aggregate({
      where: { role, completed: true },
      _avg: { completionTimeSeconds: true }
    });
    return result._avg.completionTimeSeconds;
  },
  
  // Drop-off points (which steps users quit at)
  dropOffAnalysis: async (role: string) => {
    const incompleteProgresses = await db.onboardingProgress.findMany({
      where: { role, completed: false, skipped: false }
    });
    
    const dropOffSteps = incompleteProgresses.reduce((acc, progress) => {
      const lastStep = progress.completedSteps[progress.completedSteps.length - 1];
      acc[lastStep] = (acc[lastStep] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return dropOffSteps;
  }
};
```

---

## UI Components & Mockups

### Progress Bar Component

```typescript
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep, 
  totalSteps, 
  completedSteps 
}) => {
  const progress = (completedSteps.length / totalSteps) * 100;
  
  return (
    <div className="onboarding-progress-bar">
      <div className="progress-info">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="step-indicators">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i}
            className={`step-dot ${
              completedSteps.length > i ? 'completed' : 
              currentStep === i ? 'active' : 'pending'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
```

**Visual Mockup**:
```
┌───────────────────────────────────────────────┐
│  Step 5 of 12                     42% Complete│
│  ━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░  │
│  ● ● ● ● ◉ ○ ○ ○ ○ ○ ○ ○                      │
│  └─ Completed  └─ Current  └─ Pending         │
└───────────────────────────────────────────────┘
```

### Tooltip Overlay Component

```typescript
interface TooltipOverlayProps {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  onNext: () => void;
  onSkip: () => void;
  showSkip: boolean;
  isLastStep: boolean;
}

const TooltipOverlay: React.FC<TooltipOverlayProps> = ({
  target,
  title,
  content,
  placement,
  onNext,
  onSkip,
  showSkip,
  isLastStep
}) => {
  return (
    <>
      {/* Dark overlay */}
      <div className="onboarding-overlay" />
      
      {/* Spotlight highlight */}
      <div className="spotlight-highlight" data-target={target} />
      
      {/* Tooltip */}
      <div className={`onboarding-tooltip ${placement}`}>
        <div className="tooltip-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onSkip}>×</button>
        </div>
        <div className="tooltip-content">
          {content}
        </div>
        <div className="tooltip-actions">
          {showSkip && (
            <button className="skip-button" onClick={onSkip}>
              Skip Tour
            </button>
          )}
          <button className="next-button" onClick={onNext}>
            {isLastStep ? 'Complete' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
};
```

**Visual Mockup**:
```
┌─────────────────────────────────────────┐
│  Dashboard Overview                   × │
├─────────────────────────────────────────┤
│                                         │
│  This is your main dashboard—your       │
│  command center.                        │
│                                         │
│  Key panels:                            │
│  • System Overview: Health at a glance  │
│  • Real-Time Metrics: Live data         │
│  • Activity Feed: Recent events         │
│  • Quick Actions: Common tasks          │
│                                         │
│  Everything updates in real-time via    │
│  WebSocket.                             │
│                                         │
├─────────────────────────────────────────┤
│  [ Skip Tour ]              [ Next → ]  │
└─────────────────────────────────────────┘
           ▼
    ╔═══════════════╗
    ║  HIGHLIGHTED  ║  ← Spotlight on target element
    ║   ELEMENT     ║
    ╚═══════════════╝
```

### Completion Modal

```typescript
interface CompletionModalProps {
  role: 'super_admin' | 'editor' | 'end_user';
  badge: string;
  reward: string;
  nextSteps: string[];
  onClose: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  role,
  badge,
  reward,
  nextSteps,
  onClose
}) => {
  return (
    <div className="completion-modal-overlay">
      <div className="completion-modal">
        <div className="celebration-animation">
          🎉 🎊 ✨
        </div>
        
        <h1>Congratulations!</h1>
        <p>You've completed {getRoleName(role)} onboarding!</p>
        
        <div className="badge-showcase">
          <div className="badge-icon">{badge}</div>
          <p className="badge-name">{getBadgeName(role)}</p>
        </div>
        
        <div className="reward-section">
          <h3>Your Reward:</h3>
          <p>{reward}</p>
        </div>
        
        <div className="next-steps">
          <h3>Next Steps:</h3>
          <ul>
            {nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
        
        <button className="cta-button" onClick={onClose}>
          Get Started!
        </button>
      </div>
    </div>
  );
};
```

**Visual Mockup**:
```
┌─────────────────────────────────────────┐
│                                         │
│          🎉  🎊  ✨                     │
│                                         │
│        Congratulations!                 │
│                                         │
│   You've completed Editor onboarding!   │
│                                         │
│         ┌─────────────┐                 │
│         │             │                 │
│         │   📝 🎖️     │                 │
│         │             │                 │
│         └─────────────┘                 │
│       "Quality Guardian"                │
│                                         │
│  Your Reward:                           │
│  Personalized quality metrics dashboard │
│                                         │
│  Next Steps:                            │
│  1. Read the Editor Guide               │
│  2. Review your first 5 articles        │
│  3. Join #editors Slack channel         │
│  4. Attend weekly calibration meeting   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Get Started!                 │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

### Functional Testing

- [ ] **Step Navigation**
  - [ ] Next button advances to next step
  - [ ] Previous button returns to previous step (if enabled)
  - [ ] Steps advance automatically when actions completed
  - [ ] Can skip individual steps
  - [ ] Can skip entire onboarding

- [ ] **Progress Tracking**
  - [ ] Progress bar updates correctly
  - [ ] Step indicators show completed/active/pending states
  - [ ] Progress saves to database
  - [ ] Can resume from last completed step
  - [ ] Completion status persists

- [ ] **Interactive Elements**
  - [ ] Clicks on target elements trigger next step
  - [ ] Form submissions advance onboarding
  - [ ] Navigation actions work correctly
  - [ ] Tooltips position correctly relative to targets
  - [ ] Spotlight highlights correct elements

- [ ] **Completion**
  - [ ] Completion modal displays correctly
  - [ ] Badge awarded to user profile
  - [ ] Rewards applied (Premium trial, reports, etc.)
  - [ ] Onboarding marked as complete in database
  - [ ] Can restart onboarding if desired

### UX Testing

- [ ] **Clarity**
  - [ ] Instructions are clear and concise
  - [ ] Technical jargon explained
  - [ ] Screenshots/visuals helpful
  - [ ] Examples provided where needed

- [ ] **Pacing**
  - [ ] Not too fast or too slow
  - [ ] Adequate time to read and act
  - [ ] No information overload
  - [ ] Logical step progression

- [ ] **Flexibility**
  - [ ] Can skip without penalty
  - [ ] Can pause and resume
  - [ ] Can restart if needed
  - [ ] Mobile-responsive

- [ ] **Engagement**
  - [ ] Interactive tasks keep attention
  - [ ] Celebrates progress
  - [ ] Clear value proposition
  - [ ] Motivating rewards

### Performance Testing

- [ ] **Load Times**
  - [ ] Onboarding loads in < 1 second
  - [ ] Step transitions are smooth
  - [ ] No lag with overlays
  - [ ] Database queries optimized

- [ ] **Browser Compatibility**
  - [ ] Works on Chrome, Firefox, Safari, Edge
  - [ ] Mobile browser support (iOS Safari, Chrome Mobile)
  - [ ] No console errors
  - [ ] Graceful degradation for older browsers

### Analytics Validation

- [ ] **Event Tracking**
  - [ ] Onboarding start tracked
  - [ ] Each step completion tracked
  - [ ] Skip events tracked
  - [ ] Completion tracked
  - [ ] Drop-off points identified

- [ ] **Metrics**
  - [ ] Completion rate calculated correctly
  - [ ] Average completion time accurate
  - [ ] Drop-off analysis identifies problem steps
  - [ ] Role-specific analytics work

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Set up onboarding library (react-joyride)
- Create database schema
- Build progress tracking system
- Implement state management

### Phase 2: Super Admin Flow (Week 2)
- Design all 12 steps
- Create interactive components
- Test workflow end-to-end
- Gather initial user feedback

### Phase 3: Editor Flow (Week 3)
- Design all 10 steps
- Implement review workflow
- Test quality assessment steps
- Validate against editor workflows

### Phase 4: End User Flow (Week 4)
- Design all 8 steps
- Create personalization steps
- Implement mobile app promotion
- Test on actual users

### Phase 5: Polish & Launch (Week 5)
- Fix bugs from testing
- Optimize performance
- Add analytics tracking
- Soft launch to beta users
- Gather feedback and iterate
- Full launch

---

**Document Version**: 1.0.0  
**Last Updated**: October 20, 2025  
**Total Onboarding Flows**: 3 roles (30 unique steps)  
**Status**: Ready for development
