# CoinDaily AI Moderation Agent - Comprehensive Specification

## 📋 Overview

The AI Moderation Agent is a **background service** that continuously monitors all user activities, content, and comments across the entire CoinDaily platform. It enforces community guidelines, detects policy violations, and maintains a safe, professional environment focused on cryptocurrency, blockchain, and finance discussions.

**Status**: New Specification  
**Priority**: 🔴 CRITICAL  
**Implementation Phase**: Phase 10 (Security & Compliance)  
**Estimated Time**: 6-7 days

---

## 🎯 Core Responsibilities

### **1. Content Moderation**
- Monitor all user-generated content (articles, comments, posts)
- Detect and flag inappropriate content in real-time
- Moderate content based on user tier and priority
- Queue violations for super admin review

### **2. Policy Enforcement**
- Enforce strict content policies
- Detect religious discussions (BANNED)
- Identify hate speech and bigotry
- Flag harassment, bullying, and sexting
- Monitor for insults and negative attitudes

### **3. User Activity Monitoring**
- Track user behavior across the entire platform
- Identify patterns of violation
- Build user reputation scores
- Monitor for spam and promotional content

### **4. Recommendation System**
- Recommend appropriate punishments for violations
- Suggest penalty levels based on severity
- Track repeat offenders
- Provide evidence for super admin decisions

### **5. Reporting & Alerting**
- Alert super admin of critical violations
- Queue moderation reports for review
- Provide detailed violation evidence
- Track false positives for agent improvement

---

## 🚫 **STRICT CONTENT POLICIES**

### **BANNED TOPICS** (Zero Tolerance)

#### **Religious Content** ❌
- **NO religious discussions of any kind**
- **NO mention of religious figures**:
  - Jesus Christ ❌
  - Biblical figures ❌
  - Any religious prophets or deities ❌
- **NO references to religious texts**:
  - Bible (Old Testament, New Testament) ❌
  - Quran ❌
  - Torah ❌
  - Any religious scripture ❌
- **NO religious debates or arguments**
- **NO proselytizing or conversion attempts**
- **NO religious bigotry or intolerance**

**Penalty**: Immediate content removal + Warning → Shadow ban → Ban

#### **Hate Speech** ❌
- **NO racial slurs or discrimination**
- **NO ethnic hatred or intolerance**
- **NO sexist or misogynistic content**
- **NO homophobic or transphobic content**
- **NO ageism or discrimination based on age**
- **NO xenophobia or nationalism-based hatred**

**Penalty**: Immediate removal → Shadow ban → Official ban

#### **Harassment & Bullying** ❌
- **NO personal attacks or insults**
- **NO threatening language**
- **NO doxxing or privacy violations**
- **NO cyberbullying or targeted harassment**
- **NO stalking or unwanted contact**
- **NO revenge porn or intimate image sharing**

**Penalty**: Immediate removal → Shadow ban → Official ban

#### **Sexual Content** ❌
- **NO sexting or sexual advances**
- **NO explicit sexual content**
- **NO sexual harassment**
- **NO inappropriate comments or innuendo**
- **NO unsolicited sexual messages**

**Penalty**: Immediate removal → Official ban

#### **Negative Behavior** ❌
- **NO insulting other users**
- **NO toxic or abusive language**
- **NO trolling or baiting**
- **NO spreading negativity**
- **NO personal vendettas**

**Penalty**: Warning → Shadow ban → Ban

---

### **ALLOWED TOPICS** ✅

#### **Cryptocurrency & Blockchain** ✅
- Bitcoin, Ethereum, altcoins discussion
- Blockchain technology and development
- DeFi, NFTs, Web3, DAOs
- Mining, staking, trading
- Market analysis and predictions
- Token launches and ICOs
- Cryptocurrency regulations

#### **Finance & Money** ✅
- Personal finance discussions
- Investment strategies
- Financial markets
- Banking and payments
- Mobile money (M-Pesa, etc.)
- Economic analysis
- Trading strategies

#### **Technology** ✅
- Fintech innovations
- Payment systems
- Financial software
- Cryptocurrency wallets
- Exchange platforms
- Security and privacy

---

## 📊 **CONTENT PRIORITY HIERARCHY**

The moderation agent processes and prioritizes content based on user tier:

```
┌─────────────────────────────────────────────────────────────┐
│              CONTENT MODERATION PRIORITY                    │
└─────────────────────────────────────────────────────────────┘

TIER 1: SUPER ADMIN (Highest Priority)
├─ Auto-approved (minimal checks)
├─ Published immediately
├─ Featured prominently
└─ No moderation delays

TIER 2: ADMIN
├─ Light moderation checks
├─ Fast-track approval
├─ Published within 1 minute
└─ High visibility

TIER 3: PREMIUM USERS (By Payment Tier)
├─ 3.1: Highest Paying Plan
│   ├─ Moderate checks
│   ├─ Approved within 2 minutes
│   └─ Priority visibility
│
├─ 3.2: Second Highest Paying Plan
│   ├─ Standard moderation
│   ├─ Approved within 5 minutes
│   └─ Good visibility
│
├─ 3.3: Third Highest Paying Plan
│   ├─ Standard moderation
│   ├─ Approved within 10 minutes
│   └─ Normal visibility
│
└─ 3.4: Least Paying Plan
    ├─ Thorough moderation
    ├─ Approved within 15 minutes
    └─ Standard visibility

TIER 4: FREE USERS (Lowest Priority)
├─ 4.1: Oldest Free User (1+ years)
│   ├─ Thorough moderation
│   ├─ Approved within 30 minutes
│   └─ Lower visibility
│
├─ 4.2: Older Free User (6+ months)
│   ├─ Extensive moderation
│   ├─ Approved within 45 minutes
│   └─ Low visibility
│
├─ 4.3: Old Free User (3+ months)
│   ├─ Extensive moderation
│   ├─ Approved within 60 minutes
│   └─ Minimal visibility
│
└─ 4.4: New Free User (< 3 months)
    ├─ MOST THOROUGH MODERATION
    ├─ Approved within 90 minutes
    ├─ Requires multiple AI checks
    └─ Very low visibility initially
```

### **Priority Score Calculation**

```typescript
interface UserTier {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PREMIUM' | 'FREE';
  subscriptionTier?: 'HIGHEST' | 'SECOND' | 'THIRD' | 'LEAST';
  accountAge: number; // days
  reputationScore: number; // 0-100
  violationHistory: number;
}

function calculatePriorityScore(user: UserTier): number {
  let baseScore = 0;
  
  // Role-based score (0-1000)
  if (user.role === 'SUPER_ADMIN') baseScore = 1000;
  else if (user.role === 'ADMIN') baseScore = 900;
  else if (user.role === 'PREMIUM') {
    switch (user.subscriptionTier) {
      case 'HIGHEST': baseScore = 800; break;
      case 'SECOND': baseScore = 700; break;
      case 'THIRD': baseScore = 600; break;
      case 'LEAST': baseScore = 500; break;
    }
  } else {
    // Free users scored by account age
    if (user.accountAge >= 365) baseScore = 400;
    else if (user.accountAge >= 180) baseScore = 300;
    else if (user.accountAge >= 90) baseScore = 200;
    else baseScore = 100;
  }
  
  // Reputation bonus (+0 to +100)
  baseScore += user.reputationScore;
  
  // Violation penalty (-10 per violation)
  baseScore -= (user.violationHistory * 10);
  
  return Math.max(0, baseScore);
}
```

---

## ⚠️ **PENALTY SYSTEM**

### **Three-Tier Penalty Structure**

#### **Level 1: Shadow Ban** 👻
**What it does**:
- User's content becomes invisible to others
- Profile hidden from search and discovery
- Content pushed to bottom of feeds
- Comments not displayed to other users
- User can still post (but nobody sees it)

**When applied**:
- First-time policy violations
- Mild inappropriate content
- Borderline violations
- Repeated minor infractions (3+ warnings)

**Duration**: 7-30 days (configurable)

**User notification**: ⚠️ "Your account is under review. Visibility temporarily limited."

#### **Level 2: Outright Ban** 🚫
**What it does**:
- All user content completely hidden
- Profile inaccessible to all users
- Cannot create new content
- Cannot comment or interact
- Account frozen but not deleted

**When applied**:
- Second violation after shadow ban
- Serious policy violations
- Hate speech or harassment
- Religious content violations
- Sexual content

**Duration**: 30-90 days or permanent (based on severity)

**User notification**: 🚫 "Your account has been banned due to policy violations."

#### **Level 3: Official Ban** 🔴
**What it does**:
- Account permanently deleted
- All content removed from platform
- Email and IP banned
- Cannot create new accounts
- Permanent platform exclusion

**When applied**:
- Extreme violations (e.g., threats of violence)
- Repeat offenders (2+ outright bans)
- Child safety violations
- Illegal activity
- Severe harassment or doxxing

**Duration**: PERMANENT

**User notification**: 🔴 "Your account has been permanently deleted for serious policy violations."

### **Violation Tracking**

```typescript
interface ViolationRecord {
  id: string;
  userId: string;
  violationType: ViolationType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  content: string;
  detectedAt: Date;
  aiConfidence: number; // 0-1
  evidenceUrls: string[];
  context: string;
  currentPenalty: PenaltyType;
  reviewStatus: 'PENDING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'APPEALED';
  reviewedBy?: string;
  reviewedAt?: Date;
  appealNotes?: string;
}

enum ViolationType {
  RELIGIOUS_CONTENT = 'RELIGIOUS_CONTENT',
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  SEXUAL_CONTENT = 'SEXUAL_CONTENT',
  BULLYING = 'BULLYING',
  INSULTS = 'INSULTS',
  SPAM = 'SPAM',
  OFF_TOPIC = 'OFF_TOPIC',
  UNLISTED_TOKEN = 'UNLISTED_TOKEN',
  MISINFORMATION = 'MISINFORMATION',
  OTHER = 'OTHER'
}

enum PenaltyType {
  WARNING = 'WARNING',
  SHADOW_BAN = 'SHADOW_BAN',
  OUTRIGHT_BAN = 'OUTRIGHT_BAN',
  OFFICIAL_BAN = 'OFFICIAL_BAN'
}
```

---

## 🤖 **AI MODERATION AGENT ARCHITECTURE**

### **Background Service Design**

```typescript
class ModerationAgent {
  private queue: Queue<ModerationTask>;
  private models: {
    toxicity: ToxicityClassifier;
    religious: ReligiousContentDetector;
    hate: HateSpeechDetector;
    harassment: HarassmentDetector;
    sexual: SexualContentDetector;
    spam: SpamDetector;
  };
  
  async start() {
    // Continuously monitor platform activity
    this.subscribeToContentStream();
    this.subscribeToCommentStream();
    this.subscribeToUserActions();
    this.processQueue();
  }
  
  async moderateContent(content: Content): Promise<ModerationResult> {
    // Run all checks in parallel
    const results = await Promise.all([
      this.checkReligiousContent(content),
      this.checkHateSpeech(content),
      this.checkHarassment(content),
      this.checkSexualContent(content),
      this.checkToxicity(content),
      this.checkSpam(content),
      this.checkOffTopic(content)
    ]);
    
    // Aggregate results
    const violations = results.filter(r => r.isViolation);
    
    if (violations.length === 0) {
      return { approved: true, confidence: 0.95 };
    }
    
    // Determine penalty based on severity
    const penalty = this.calculatePenalty(violations, content.author);
    
    // Create violation record
    await this.createViolationRecord(violations, penalty);
    
    // Alert super admin if critical
    if (penalty.severity === 'CRITICAL') {
      await this.alertSuperAdmin(violations);
    }
    
    return {
      approved: false,
      violations,
      penalty,
      requiresHumanReview: true
    };
  }
  
  private async checkReligiousContent(content: Content): Promise<CheckResult> {
    // Keywords to detect
    const religiousKeywords = [
      'jesus', 'christ', 'god', 'allah', 'prophet', 'bible',
      'quran', 'torah', 'scripture', 'pray', 'prayer', 'worship',
      'church', 'mosque', 'temple', 'synagogue', 'religion',
      'christian', 'muslim', 'jewish', 'hindu', 'buddhist',
      'apostle', 'disciple', 'saint', 'angel', 'demon', 'hell',
      'heaven', 'salvation', 'sin', 'faith', 'belief', 'blessed'
    ];
    
    const text = content.text.toLowerCase();
    
    // Check for exact matches
    for (const keyword of religiousKeywords) {
      if (text.includes(keyword)) {
        return {
          isViolation: true,
          type: 'RELIGIOUS_CONTENT',
          severity: 'HIGH',
          confidence: 0.9,
          evidence: `Contains prohibited religious term: "${keyword}"`,
          flaggedText: this.extractContext(text, keyword)
        };
      }
    }
    
    // Use AI model for contextual detection
    const aiResult = await this.models.religious.classify(text);
    
    if (aiResult.confidence > 0.75) {
      return {
        isViolation: true,
        type: 'RELIGIOUS_CONTENT',
        severity: 'HIGH',
        confidence: aiResult.confidence,
        evidence: 'AI detected religious discussion',
        flaggedText: aiResult.flaggedSentences
      };
    }
    
    return { isViolation: false };
  }
  
  private async checkHateSpeech(content: Content): Promise<CheckResult> {
    // Use Perspective API or similar
    const result = await this.models.hate.classify(content.text);
    
    if (result.toxicity > 0.8) {
      return {
        isViolation: true,
        type: 'HATE_SPEECH',
        severity: 'CRITICAL',
        confidence: result.confidence,
        evidence: 'Contains hate speech or discrimination',
        flaggedText: result.flaggedSegments
      };
    }
    
    return { isViolation: false };
  }
  
  private calculatePenalty(
    violations: CheckResult[],
    user: User
  ): PenaltyRecommendation {
    const maxSeverity = Math.max(...violations.map(v => 
      v.severity === 'CRITICAL' ? 4 :
      v.severity === 'HIGH' ? 3 :
      v.severity === 'MEDIUM' ? 2 : 1
    ));
    
    const userHistory = await this.getUserViolationHistory(user.id);
    const previousBans = userHistory.filter(v => 
      v.penalty === 'SHADOW_BAN' || 
      v.penalty === 'OUTRIGHT_BAN'
    ).length;
    
    // Determine penalty
    let penalty: PenaltyType;
    let duration: number;
    
    if (maxSeverity >= 4 || previousBans >= 2) {
      penalty = 'OFFICIAL_BAN';
      duration = Infinity; // Permanent
    } else if (maxSeverity >= 3 || previousBans >= 1) {
      penalty = 'OUTRIGHT_BAN';
      duration = 30; // days
    } else if (maxSeverity >= 2 || userHistory.length >= 3) {
      penalty = 'SHADOW_BAN';
      duration = 7; // days
    } else {
      penalty = 'WARNING';
      duration = 0;
    }
    
    return {
      recommendedPenalty: penalty,
      duration,
      reason: this.generatePenaltyReason(violations),
      confidence: 0.85,
      requiresHumanReview: maxSeverity >= 3
    };
  }
}
```

---

## 🎛️ **SUPER ADMIN MODERATION DASHBOARD**

### **New Page: Moderation Queue** (`/admin/moderation`)

#### **Dashboard Features**

```
┌─────────────────────────────────────────────────────────────┐
│                    MODERATION QUEUE                         │
├─────────────────────────────────────────────────────────────┤
│  🔴 Critical (12)  |  🟡 High (34)  |  🟢 Medium (67)       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FILTERS:                                           │   │
│  │  [All] [Religious] [Hate Speech] [Harassment]      │   │
│  │  [Sexual] [Bullying] [Spam]                        │   │
│  │                                                     │   │
│  │  Status: [Pending] [Confirmed] [False Positive]    │   │
│  │  Priority: [All] [Critical] [High] [Medium] [Low]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  VIOLATION REPORTS (sorted by severity):                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 CRITICAL - Religious Content Detected            │   │
│  │ User: @john_crypto (Free User, 45 days old)        │   │
│  │ Detected: 2 minutes ago                             │   │
│  │ AI Confidence: 92%                                  │   │
│  │                                                     │   │
│  │ Flagged Text:                                       │   │
│  │ "I believe Jesus Christ is the only way to         │   │
│  │  salvation and Bitcoin is blessed..."              │   │
│  │                                                     │   │
│  │ Violations:                                         │   │
│  │ • Religious Content (Jesus Christ mentioned)        │   │
│  │ • Off-topic discussion                             │   │
│  │                                                     │   │
│  │ Recommended Action: SHADOW BAN (7 days)             │   │
│  │                                                     │   │
│  │ [✓ Confirm] [✗ False Positive] [View Full Content] │   │
│  │ [View User History] [Adjust Penalty ▼]             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 CRITICAL - Hate Speech Detected                  │   │
│  │ User: @crypto_trader99 (Free User, 12 days old)    │   │
│  │ Detected: 5 minutes ago                             │   │
│  │ AI Confidence: 95%                                  │   │
│  │                                                     │   │
│  │ Flagged Text:                                       │   │
│  │ "[Racial slur] people should not be allowed to     │   │
│  │  trade crypto..."                                   │   │
│  │                                                     │   │
│  │ Violations:                                         │   │
│  │ • Hate Speech (Racial discrimination)               │   │
│  │ • Severe toxicity                                   │   │
│  │                                                     │   │
│  │ Recommended Action: OFFICIAL BAN (Permanent)        │   │
│  │                                                     │   │
│  │ [✓ Confirm] [✗ False Positive] [View Full Content] │   │
│  │ [View User History] [Adjust Penalty ▼]             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 HIGH - Harassment Detected                       │   │
│  │ User: @angry_investor (Premium Tier 3, 120 days)   │   │
│  │ Detected: 15 minutes ago                            │   │
│  │ AI Confidence: 78%                                  │   │
│  │                                                     │   │
│  │ Flagged Text:                                       │   │
│  │ "@newbie_trader you're an idiot, stop spreading    │   │
│  │  FUD you moron..."                                  │   │
│  │                                                     │   │
│  │ Violations:                                         │   │
│  │ • Harassment (Personal insults)                     │   │
│  │ • Toxic behavior                                    │   │
│  │                                                     │   │
│  │ Recommended Action: WARNING (1st offense)           │   │
│  │                                                     │   │
│  │ [✓ Confirm] [✗ False Positive] [View Full Content] │   │
│  │ [View User History] [Adjust Penalty ▼]             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### **Detailed Violation View**

When super admin clicks "View Full Content":

```
┌─────────────────────────────────────────────────────────────┐
│                  VIOLATION DETAILS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Violation ID: MOD-2025-10-14-00123                        │
│  Detected: October 14, 2025 at 10:45 AM WAT                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  USER INFORMATION                                   │   │
│  │  Username: @john_crypto                             │   │
│  │  Email: john@example.com                            │   │
│  │  Account Type: Free User                            │   │
│  │  Account Age: 45 days                               │   │
│  │  Reputation Score: 65/100                           │   │
│  │  Previous Violations: 1 (Warning issued 30 days ago)│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FLAGGED CONTENT                                    │   │
│  │  Type: Comment                                      │   │
│  │  Posted: In response to "Bitcoin hits $100K"       │   │
│  │  Location: Article comments                         │   │
│  │                                                     │   │
│  │  Full Text:                                         │   │
│  │  "I believe Jesus Christ is the only way to        │   │
│  │   salvation and I think Bitcoin is blessed by God. │   │
│  │   The Bible says in Proverbs that wise people      │   │
│  │   invest wisely. Crypto is a gift from heaven."    │   │
│  │                                                     │   │
│  │  Context: Reply to user discussing BTC price       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI DETECTION ANALYSIS                              │   │
│  │                                                     │   │
│  │  Religious Content: 92% confidence                  │   │
│  │  Flagged Terms:                                     │   │
│  │  • "Jesus Christ" (explicit mention)                │   │
│  │  • "salvation" (religious concept)                  │   │
│  │  • "blessed by God" (religious claim)               │   │
│  │  • "Bible" (religious text)                         │   │
│  │  • "Proverbs" (biblical reference)                  │   │
│  │  • "gift from heaven" (religious attribution)       │   │
│  │                                                     │   │
│  │  Hate Speech: 0% confidence                         │   │
│  │  Harassment: 0% confidence                          │   │
│  │  Sexual Content: 0% confidence                      │   │
│  │  Toxicity: 15% (low)                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  RECOMMENDED PENALTY                                │   │
│  │                                                     │   │
│  │  Action: SHADOW BAN                                 │   │
│  │  Duration: 7 days                                   │   │
│  │  Reason: Religious content discussion (prohibited)  │   │
│  │                                                     │   │
│  │  Reasoning:                                         │   │
│  │  • Multiple explicit religious references           │   │
│  │  • First serious violation (previous warning)       │   │
│  │  • Free user with low reputation                    │   │
│  │  • Off-topic content (not crypto-focused)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SUPER ADMIN ACTIONS                                │   │
│  │                                                     │   │
│  │  ✓ Confirm AI Recommendation (Shadow Ban 7 days)   │   │
│  │  ✓ Adjust Penalty:                                  │   │
│  │    [ ] Warning Only                                 │   │
│  │    [•] Shadow Ban (7 days)                          │   │
│  │    [ ] Shadow Ban (30 days)                         │   │
│  │    [ ] Outright Ban                                 │   │
│  │    [ ] Official Ban (Permanent)                     │   │
│  │                                                     │   │
│  │  ✗ Mark as False Positive (train AI)               │   │
│  │                                                     │   │
│  │  Notes: [Optional admin notes]                      │   │
│  │                                                     │   │
│  │  [Apply Penalty] [Dismiss] [Request More Info]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 **FALSE POSITIVE HANDLING**

### **AI Learning System**

When a super admin marks a violation as a **False Positive**:

1. **Immediate Actions**:
   - Content is restored
   - User penalty removed
   - User notified of mistake

2. **AI Training**:
   - Flagged example stored in training dataset
   - AI model retrained with corrected label
   - Confidence thresholds adjusted
   - Similar patterns whitelisted

3. **Metrics Tracking**:
   - False positive rate monitored (target: <5%)
   - Agent accuracy improved over time
   - Regular model updates

```typescript
interface FalsePositiveRecord {
  violationId: string;
  originalClassification: ViolationType;
  aiConfidence: number;
  markedByAdmin: string;
  reason: string;
  correctClassification: 'SAFE' | ViolationType;
  timestamp: Date;
}

async function handleFalsePositive(
  violationId: string,
  adminId: string,
  reason: string
): Promise<void> {
  // 1. Restore content and remove penalty
  await restoreContent(violationId);
  await removePenalty(violationId);
  
  // 2. Record false positive
  await db.falsePositive.create({
    violationId,
    markedByAdmin: adminId,
    reason,
    timestamp: new Date()
  });
  
  // 3. Update AI training data
  await aiTrainingPipeline.addCorrectedExample(violationId, 'SAFE');
  
  // 4. Adjust confidence thresholds
  await moderationAgent.adjustThresholds(violationId);
  
  // 5. Notify user
  await notifyUser(violationId, 'MISTAKE_CORRECTED');
}
```

---

## 📡 **REAL-TIME MONITORING**

### **Activity Stream Monitoring**

```typescript
class RealTimeMonitor {
  async start() {
    // Subscribe to all content streams
    this.db.article.subscribe(this.onNewArticle);
    this.db.comment.subscribe(this.onNewComment);
    this.db.communityPost.subscribe(this.onNewPost);
    this.db.userMessage.subscribe(this.onNewMessage);
    
    // Monitor user actions
    this.eventBus.on('user.action', this.onUserAction);
  }
  
  async onNewComment(comment: Comment) {
    // Immediate moderation check
    const result = await moderationAgent.moderateContent({
      text: comment.content,
      author: comment.userId,
      type: 'COMMENT'
    });
    
    if (!result.approved) {
      // Block comment from being published
      await this.blockContent(comment.id);
      
      // Alert super admin if critical
      if (result.penalty.severity === 'CRITICAL') {
        await this.alertSuperAdmin(result);
      }
      
      // Queue for review
      await this.queueForReview(result);
    }
  }
  
  async onUserAction(action: UserAction) {
    // Track suspicious patterns
    const pattern = await this.analyzeUserPattern(action.userId);
    
    if (pattern.suspicious) {
      await this.flagUserForReview(action.userId, pattern);
    }
  }
}
```

---

## 📊 **MODERATION METRICS DASHBOARD**

Super admin can view moderation statistics:

```
┌─────────────────────────────────────────────────────────────┐
│              MODERATION METRICS (Last 30 Days)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Total Content Moderated: 45,673                           │
│  Violations Detected: 1,234 (2.7%)                         │
│  False Positives: 45 (3.6% of violations)                  │
│  Average Response Time: 0.8 seconds                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  VIOLATION BREAKDOWN                                │   │
│  │  Religious Content:    456 (37%)                    │   │
│  │  Hate Speech:          234 (19%)                    │   │
│  │  Harassment:           189 (15%)                    │   │
│  │  Sexual Content:       145 (12%)                    │   │
│  │  Bullying:             123 (10%)                    │   │
│  │  Spam:                  87 (7%)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PENALTIES APPLIED                                  │   │
│  │  Warnings:             567 (46%)                    │   │
│  │  Shadow Bans:          445 (36%)                    │   │
│  │  Outright Bans:        189 (15%)                    │   │
│  │  Official Bans:         33 (3%)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI PERFORMANCE                                     │   │
│  │  Accuracy:             96.4%                        │   │
│  │  False Positive Rate:  3.6%                         │   │
│  │  False Negative Est:   ~2%                          │   │
│  │  Avg Confidence:       89%                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 **API ENDPOINTS**

### **Moderation API**

```typescript
// Get moderation queue
GET /api/admin/moderation/queue
Query Params:
  - status: 'pending' | 'confirmed' | 'false_positive'
  - type: ViolationType
  - severity: 'low' | 'medium' | 'high' | 'critical'
  - limit: number
  - offset: number

// Get violation details
GET /api/admin/moderation/violations/:id

// Confirm violation and apply penalty
POST /api/admin/moderation/violations/:id/confirm
Body: {
  penalty: PenaltyType,
  duration?: number,
  notes?: string
}

// Mark as false positive
POST /api/admin/moderation/violations/:id/false-positive
Body: {
  reason: string,
  correctClassification: string
}

// Get user violation history
GET /api/admin/moderation/users/:userId/violations

// Get moderation metrics
GET /api/admin/moderation/metrics
Query Params:
  - dateRange: '7d' | '30d' | '90d' | 'all'

// Manual content moderation request
POST /api/admin/moderation/check
Body: {
  content: string,
  contentType: 'article' | 'comment' | 'post',
  userId: string
}

// Update moderation settings
PUT /api/admin/moderation/settings
Body: {
  confidenceThresholds: {
    religious: number,
    hate: number,
    harassment: number,
    sexual: number
  },
  autoApplyPenalties: boolean,
  alertThreshold: 'all' | 'critical' | 'high'
}
```

---

## 🗄️ **DATABASE SCHEMA**

### **New Tables Required**

```prisma
model ViolationReport {
  id                String        @id @default(uuid())
  userId            String
  contentId         String
  contentType       ContentType   // ARTICLE, COMMENT, POST, MESSAGE
  violationType     ViolationType
  severity          Severity
  aiConfidence      Float
  flaggedText       String
  fullContent       String
  context           String?
  evidenceUrls      String[]
  
  recommendedPenalty  PenaltyType
  penaltyDuration     Int?
  penaltyReason       String
  
  status            ReviewStatus  @default(PENDING)
  reviewedBy        String?
  reviewedAt        DateTime?
  adminNotes        String?
  isFalsePositive   Boolean       @default(false)
  
  appliedPenalty    UserPenalty?
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  User              User          @relation(fields: [userId], references: [id])
  ReviewedByAdmin   User?         @relation("ReviewedBy", fields: [reviewedBy], references: [id])
  
  @@index([status, severity, createdAt])
  @@index([userId, createdAt])
  @@index([violationType, createdAt])
}

model UserPenalty {
  id                String         @id @default(uuid())
  userId            String
  violationReportId String         @unique
  penaltyType       PenaltyType
  duration          Int?           // days, null for permanent
  reason            String
  appliedBy         String
  appliedAt         DateTime       @default(now())
  expiresAt         DateTime?
  isActive          Boolean        @default(true)
  
  User              User           @relation(fields: [userId], references: [id])
  ViolationReport   ViolationReport @relation(fields: [violationReportId], references: [id])
  AppliedByAdmin    User           @relation("AppliedBy", fields: [appliedBy], references: [id])
  
  @@index([userId, isActive])
  @@index([expiresAt])
}

model UserReputation {
  id                String   @id @default(uuid())
  userId            String   @unique
  reputationScore   Int      @default(50)  // 0-100
  violationCount    Int      @default(0)
  warningCount      Int      @default(0)
  shadowBanCount    Int      @default(0)
  banCount          Int      @default(0)
  accountAge        Int      // days
  lastViolation     DateTime?
  
  User              User     @relation(fields: [userId], references: [id])
  
  @@index([reputationScore])
}

model FalsePositive {
  id                    String         @id @default(uuid())
  violationReportId     String
  originalClassification ViolationType
  aiConfidence          Float
  markedByAdmin         String
  reason                String
  correctClassification String
  
  createdAt             DateTime       @default(now())
  
  ViolationReport       ViolationReport @relation(fields: [violationReportId], references: [id])
  MarkedByAdmin         User           @relation(fields: [markedByAdmin], references: [id])
  
  @@index([createdAt])
}

enum ContentType {
  ARTICLE
  COMMENT
  POST
  MESSAGE
}

enum ViolationType {
  RELIGIOUS_CONTENT
  HATE_SPEECH
  HARASSMENT
  SEXUAL_CONTENT
  BULLYING
  INSULTS
  SPAM
  OFF_TOPIC
  UNLISTED_TOKEN
  MISINFORMATION
  OTHER
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum PenaltyType {
  WARNING
  SHADOW_BAN
  OUTRIGHT_BAN
  OFFICIAL_BAN
}

enum ReviewStatus {
  PENDING
  CONFIRMED
  FALSE_POSITIVE
  APPEALED
  DISMISSED
}
```

---

## 🚀 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Core Moderation Agent** (3-4 days)
- [ ] Create ModerationAgent class with background service
- [ ] Implement toxicity detection (Perspective API)
- [ ] Implement religious content detector
- [ ] Implement hate speech detector
- [ ] Implement harassment detector
- [ ] Implement sexual content detector
- [ ] Implement spam detector
- [ ] Create priority calculation system
- [ ] Build penalty recommendation engine

### **Phase 2: Database & Backend** (2-3 days)
- [ ] Create database tables (ViolationReport, UserPenalty, etc.)
- [ ] Implement API endpoints for moderation
- [ ] Create WebSocket alerts for super admin
- [ ] Build user reputation tracking system
- [ ] Implement false positive handling

### **Phase 3: Super Admin Dashboard** (2-3 days)
- [ ] Create `/admin/moderation` page
- [ ] Build moderation queue UI
- [ ] Create violation detail modal
- [ ] Implement batch actions
- [ ] Add metrics dashboard
- [ ] Create user violation history view

### **Phase 4: Integration & Testing** (1-2 days)
- [ ] Integrate with content creation pipeline
- [ ] Add real-time monitoring to all content streams
- [ ] Test penalty application system
- [ ] Validate false positive workflow
- [ ] Load test with 1000+ simultaneous checks

### **Phase 5: AI Training & Optimization** (Ongoing)
- [ ] Collect training data from false positives
- [ ] Retrain models weekly
- [ ] Monitor accuracy metrics
- [ ] Adjust confidence thresholds
- [ ] Improve detection algorithms

---

## 📈 **SUCCESS METRICS**

### **Performance Targets**
- [ ] Moderation check < 1 second per item
- [ ] False positive rate < 5%
- [ ] False negative rate < 2%
- [ ] 95%+ accuracy on religious content detection
- [ ] 98%+ accuracy on hate speech detection

### **Operational Targets**
- [ ] All violations reviewed within 1 hour
- [ ] Critical violations reviewed within 5 minutes
- [ ] 100% of content moderated before publication (free users)
- [ ] Zero tolerance violations (religious, hate) blocked immediately

### **User Impact**
- [ ] Improved platform safety
- [ ] Reduced toxic interactions
- [ ] Professional cryptocurrency-focused discussions
- [ ] Increased user trust and engagement

---

## ⚠️ **IMPORTANT NOTES**

1. **Zero Tolerance**: Religious content and hate speech have ZERO tolerance
2. **Priority System**: Content moderation speed based on user tier is critical
3. **Human Review**: Super admin MUST review all critical violations
4. **False Positives**: Track and learn from mistakes to improve AI
5. **Transparency**: Users should understand why they were penalized
6. **Appeals**: Consider implementing appeal system in future
7. **Regular Updates**: AI models must be retrained regularly
8. **Privacy**: Handle user data responsibly and securely

---

**Document Version**: 1.0  
**Created**: December 2024  
**Status**: Ready for Implementation  
**Priority**: 🔴 CRITICAL  
**Implementation Phase**: Phase 10 (Security & Compliance)  
**Estimated Duration**: 6-7 days

---

**End of AI Moderation Agent Specification**
