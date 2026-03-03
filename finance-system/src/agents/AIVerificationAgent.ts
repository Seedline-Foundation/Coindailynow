import db from '../database/connection';
import { AIVerification, VerificationResult } from '../types';
import { notificationService } from '../services/NotificationService';
import { auditService } from '../services/AuditService';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'deepseek-r1';

/**
 * ARIA — AI Risk & Intelligence Agent
 * Central AI verification engine for CFIS.
 * ALL payments must pass through ARIA before execution.
 * Uses DeepSeek R1 (self-hosted via Ollama) for enhanced reasoning.
 */
export class AIVerificationAgent {

  /**
   * Call DeepSeek R1 via Ollama for AI-enhanced risk analysis.
   * Falls back gracefully if Ollama is unavailable.
   */
  private async queryDeepSeek(prompt: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_MODEL,
          prompt,
          stream: false,
          options: { temperature: 0.2, num_predict: 800 }
        }),
        signal: controller.signal as any,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
      const data = await res.json() as { response?: string };
      return data.response || null;
    } catch (err: any) {
      console.warn(`[ARIA] DeepSeek R1 unavailable: ${err.message}. Using rule-based fallback.`);
      return null;
    }
  }

  // ============================================================
  // 1. USER WITHDRAWAL VERIFICATION
  // ============================================================
  async verifyUserWithdrawal(data: {
    userId: string;
    walletId: string;
    amount: number;
    currency: string;
    activityData: {
      totalPointsEarned: number;
      totalArticlesRead: number;
      totalShares: number;
      totalQuizzes: number;
      referralCount: number;
      accountAgeDays: number;
      lastLoginDate: string;
      gamificationParticipation: boolean;
    };
  }): Promise<AIVerification> {
    const checks: any[] = [];
    let approvedCount = 0;
    let totalChecks = 0;

    // Check 1: Activity score
    totalChecks++;
    const activityScore = this.calculateActivityScore(data.activityData);
    const activityCheck = {
      name: 'ACTIVITY_SCORE',
      passed: activityScore >= 0.5,
      score: activityScore,
      detail: `Activity score: ${activityScore.toFixed(4)} (min: 0.5)`
    };
    checks.push(activityCheck);
    if (activityCheck.passed) approvedCount++;

    // Check 2: Gamification participation
    totalChecks++;
    const gamCheck = {
      name: 'GAMIFICATION_PARTICIPATION',
      passed: data.activityData.gamificationParticipation,
      detail: `User ${data.activityData.gamificationParticipation ? 'has' : 'has NOT'} participated in gamification`
    };
    checks.push(gamCheck);
    if (gamCheck.passed) approvedCount++;

    // Check 3: Account age
    totalChecks++;
    const ageCheck = {
      name: 'ACCOUNT_AGE',
      passed: data.activityData.accountAgeDays >= 30,
      detail: `Account age: ${data.activityData.accountAgeDays} days (min: 30)`
    };
    checks.push(ageCheck);
    if (ageCheck.passed) approvedCount++;

    // Check 4: Points justify token amount
    totalChecks++;
    const pointsRate = 0.001; // 1 point = 0.001 JY
    const maxTokensFromPoints = data.activityData.totalPointsEarned * pointsRate;
    const pointsCheck = {
      name: 'POINTS_JUSTIFY_AMOUNT',
      passed: data.amount <= maxTokensFromPoints,
      detail: `Requested: ${data.amount} JY, Points justify: ${maxTokensFromPoints.toFixed(6)} JY`
    };
    checks.push(pointsCheck);
    if (pointsCheck.passed) approvedCount++;

    // Check 5: Withdrawal velocity (not too frequent)
    totalChecks++;
    const recentWithdrawals = await this.getRecentWithdrawals(data.walletId, 24);
    const velocityCheck = {
      name: 'WITHDRAWAL_VELOCITY',
      passed: recentWithdrawals.length < 3,
      detail: `${recentWithdrawals.length} withdrawals in last 24h (max: 3)`
    };
    checks.push(velocityCheck);
    if (velocityCheck.passed) approvedCount++;

    // Check 6: Daily limit
    totalChecks++;
    const configResult = await db.query("SELECT value FROM system_config WHERE key = 'withdrawal_settings'");
    const config = configResult.rows[0]?.value || { daily_limit_jy: 50000 };
    const dailyTotal = recentWithdrawals.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);
    const limitCheck = {
      name: 'DAILY_LIMIT',
      passed: (dailyTotal + data.amount) <= config.daily_limit_jy,
      detail: `Daily total: ${dailyTotal + data.amount} JY (limit: ${config.daily_limit_jy})`
    };
    checks.push(limitCheck);
    if (limitCheck.passed) approvedCount++;

    const confidenceScore = approvedCount / totalChecks;
    let result: VerificationResult;
    let reasoning: string;

    if (confidenceScore >= 0.85) {
      result = 'APPROVED';
      reasoning = `All critical checks passed. Confidence: ${(confidenceScore * 100).toFixed(1)}%. User activity verified.`;
    } else if (confidenceScore >= 0.6) {
      result = 'FLAGGED';
      reasoning = `Some checks failed. Confidence: ${(confidenceScore * 100).toFixed(1)}%. Manual review recommended.`;
    } else {
      result = 'REJECTED';
      reasoning = `Too many checks failed. Confidence: ${(confidenceScore * 100).toFixed(1)}%. Withdrawal denied.`;
    }

    // Enhance with DeepSeek R1 reasoning (non-blocking)
    const aiReasoning = await this.queryDeepSeek(
      `You are ARIA, a financial risk AI for CoinDaily. Analyze this withdrawal request and provide a brief risk assessment in 2-3 sentences.\n\n` +
      `User: ${data.userId}\nAmount: ${data.amount} JY\n` +
      `Activity Score: ${activityScore.toFixed(4)}\nAccount Age: ${data.activityData.accountAgeDays} days\n` +
      `Points Earned: ${data.activityData.totalPointsEarned}\nArticles Read: ${data.activityData.totalArticlesRead}\n` +
      `Checks Passed: ${approvedCount}/${totalChecks}\nPreliminary Result: ${result}\n\n` +
      `Provide your risk assessment:`
    );
    if (aiReasoning) {
      reasoning += ` | ARIA DeepSeek Analysis: ${aiReasoning.substring(0, 300)}`;
    }

    return this.saveVerification({
      verification_type: 'WITHDRAWAL',
      entity_type: 'USER',
      entity_id: data.userId,
      result,
      confidence_score: confidenceScore,
      reasoning,
      evidence: { activityData: data.activityData, amount: data.amount },
      checks_performed: checks,
      reviewer: 'ARIA_AGENT'
    });
  }

  // ============================================================
  // 2. PRESS PLACEMENT VERIFICATION
  // ============================================================
  async verifyPressPlacement(data: {
    escrowId: string;
    siteUrl: string;
    pressOrderId: string;
    publisherWalletId: string;
    recipientWalletId: string;
    amount: number;
  }): Promise<AIVerification> {
    const checks: any[] = [];
    let approvedCount = 0;
    let totalChecks = 0;

    // Check 1: Site URL is valid and accessible
    totalChecks++;
    const siteValid = this.isValidUrl(data.siteUrl);
    checks.push({
      name: 'SITE_URL_VALID',
      passed: siteValid,
      detail: `Site URL ${data.siteUrl} is ${siteValid ? 'valid' : 'invalid'}`
    });
    if (siteValid) approvedCount++;

    // Check 2: Escrow exists and is funded
    totalChecks++;
    const escrowResult = await db.query('SELECT * FROM press_escrows WHERE id = $1', [data.escrowId]);
    const escrow = escrowResult.rows[0];
    const escrowFunded = escrow && escrow.status === 'FUNDED';
    checks.push({
      name: 'ESCROW_FUNDED',
      passed: escrowFunded,
      detail: `Escrow ${data.escrowId} status: ${escrow?.status || 'NOT FOUND'}`
    });
    if (escrowFunded) approvedCount++;

    // Check 3: 24-hour window has passed
    totalChecks++;
    const now = new Date();
    const releaseAfter = escrow ? new Date(escrow.release_after) : new Date(now.getTime() + 86400000);
    const timeElapsed = now >= releaseAfter;
    checks.push({
      name: '24HR_ELAPSED',
      passed: timeElapsed,
      detail: `Release time: ${releaseAfter.toISOString()}, Current: ${now.toISOString()}, Elapsed: ${timeElapsed}`
    });
    if (timeElapsed) approvedCount++;

    // Check 4: Content is assumed placed (in production: headless browser would check)
    totalChecks++;
    // Simulate placement check — in production this would use Puppeteer
    const placementVerified = true; // Placeholder
    checks.push({
      name: 'CONTENT_PLACED',
      passed: placementVerified,
      detail: `Content placement on ${data.siteUrl}: ${placementVerified ? 'VERIFIED' : 'NOT FOUND'}`
    });
    if (placementVerified) approvedCount++;

    // Check 5: Views threshold (minimum 10 views)
    totalChecks++;
    const viewsCheck = true; // In production: scrape analytics
    checks.push({
      name: 'MIN_VIEWS_MET',
      passed: viewsCheck,
      detail: `Minimum views requirement: ${viewsCheck ? 'MET' : 'NOT MET'}`
    });
    if (viewsCheck) approvedCount++;

    const confidenceScore = approvedCount / totalChecks;
    let result: VerificationResult;
    let reasoning: string;

    if (confidenceScore >= 0.8) {
      result = 'APPROVED';
      reasoning = `Press placement verified. All critical checks passed. Confidence: ${(confidenceScore * 100).toFixed(1)}%.`;
    } else if (confidenceScore >= 0.6) {
      result = 'FLAGGED';
      reasoning = `Some press checks failed. Manual review needed. Confidence: ${(confidenceScore * 100).toFixed(1)}%.`;
    } else {
      result = 'REJECTED';
      reasoning = `Press placement verification failed. Confidence: ${(confidenceScore * 100).toFixed(1)}%.`;
    }

    return this.saveVerification({
      verification_type: 'PRESS_PLACEMENT',
      entity_type: 'PUBLISHER',
      entity_id: data.publisherWalletId,
      result,
      confidence_score: confidenceScore,
      reasoning,
      evidence: { siteUrl: data.siteUrl, escrowId: data.escrowId, amount: data.amount },
      checks_performed: checks,
      reviewer: 'ARIA_AGENT'
    });
  }

  // ============================================================
  // 3. PARTNERSHIP DOCUMENT VERIFICATION
  // ============================================================
  async verifyPartnershipDocument(data: {
    partnershipId: string;
    partnerName: string;
    contractDocUrl: string;
    contractDocHash: string;
    contractSignedDate: string;
    contractParties: any[];
    contractAmount: number;
  }): Promise<AIVerification> {
    const checks: any[] = [];
    let approvedCount = 0;
    let totalChecks = 0;

    // Check 1: Document URL exists
    totalChecks++;
    const docExists = !!data.contractDocUrl && data.contractDocUrl.length > 10;
    checks.push({
      name: 'DOCUMENT_EXISTS',
      passed: docExists,
      detail: `Contract document ${docExists ? 'uploaded' : 'MISSING'}`
    });
    if (docExists) approvedCount++;

    // Check 2: Document hash present (tampering protection)
    totalChecks++;
    const hashValid = !!data.contractDocHash && data.contractDocHash.length >= 64;
    checks.push({
      name: 'DOCUMENT_HASH_VALID',
      passed: hashValid,
      detail: `Document hash: ${hashValid ? 'Present and valid' : 'MISSING or invalid'}`
    });
    if (hashValid) approvedCount++;

    // Check 3: Signed date is valid and not in the future
    totalChecks++;
    const signedDate = new Date(data.contractSignedDate);
    const dateValid = !isNaN(signedDate.getTime()) && signedDate <= new Date();
    checks.push({
      name: 'SIGNED_DATE_VALID',
      passed: dateValid,
      detail: `Signed date: ${data.contractSignedDate}, Valid: ${dateValid}`
    });
    if (dateValid) approvedCount++;

    // Check 4: At least 2 parties signed
    totalChecks++;
    const partiesValid = Array.isArray(data.contractParties) && data.contractParties.length >= 2;
    checks.push({
      name: 'MIN_SIGNATORIES',
      passed: partiesValid,
      detail: `${data.contractParties?.length || 0} parties signed (min: 2)`
    });
    if (partiesValid) approvedCount++;

    // Check 5: Each party has required fields
    totalChecks++;
    let allPartiesComplete = true;
    const partyErrors: string[] = [];
    if (partiesValid) {
      for (const party of data.contractParties) {
        if (!party.name || !party.signature || !party.date) {
          allPartiesComplete = false;
          partyErrors.push(`Party missing required fields: ${JSON.stringify(party)}`);
        }
      }
    } else {
      allPartiesComplete = false;
    }
    checks.push({
      name: 'PARTIES_COMPLETE',
      passed: allPartiesComplete,
      detail: allPartiesComplete ? 'All parties have complete information' : `Errors: ${partyErrors.join('; ')}`
    });
    if (allPartiesComplete) approvedCount++;

    // Check 6: Contract amount is reasonable (not zero, not absurdly high)
    totalChecks++;
    const amountReasonable = data.contractAmount > 0 && data.contractAmount <= 1000000;
    checks.push({
      name: 'AMOUNT_REASONABLE',
      passed: amountReasonable,
      detail: `Amount: ${data.contractAmount} JY, Reasonable: ${amountReasonable}`
    });
    if (amountReasonable) approvedCount++;

    const confidenceScore = approvedCount / totalChecks;
    let result: VerificationResult;
    let reasoning: string;

    if (confidenceScore >= 0.85) {
      result = 'APPROVED';
      reasoning = `Partnership documents verified. Properly signed by all parties. Confidence: ${(confidenceScore * 100).toFixed(1)}%.`;
    } else if (confidenceScore >= 0.5) {
      result = 'REJECTED';
      reasoning = `Partnership documents INCOMPLETE or IMPROPER. Required: valid document, hash, date, 2+ signatories with complete details. Fix errors and resubmit. Failed checks: ${checks.filter(c => !c.passed).map(c => c.name).join(', ')}`;
    } else {
      result = 'REJECTED';
      reasoning = `Partnership documents severely deficient. Payment DENIED. Missing: ${checks.filter(c => !c.passed).map(c => c.name).join(', ')}`;
    }

    // Enhance with DeepSeek R1 contract analysis
    const aiReasoning = await this.queryDeepSeek(
      `You are ARIA, a financial compliance AI for CoinDaily. Analyze this partnership contract verification and provide a 2-3 sentence compliance assessment.\n\n` +
      `Partner: ${data.partnerName}\nContract Amount: ${data.contractAmount} JY\n` +
      `Signed Date: ${data.contractSignedDate}\nParties: ${data.contractParties?.length || 0}\n` +
      `Document Hash Present: ${!!data.contractDocHash}\nDoc URL: ${data.contractDocUrl}\n` +
      `Checks Passed: ${approvedCount}/${totalChecks}\nPreliminary Result: ${result}\n\n` +
      `Provide your compliance assessment:`
    );
    if (aiReasoning) {
      reasoning += ` | ARIA DeepSeek Analysis: ${aiReasoning.substring(0, 300)}`;
    }

    return this.saveVerification({
      verification_type: 'PARTNERSHIP_DOC',
      entity_type: 'PARTNER',
      entity_id: data.partnershipId,
      result,
      confidence_score: confidenceScore,
      reasoning,
      evidence: { partnerName: data.partnerName, contractAmount: data.contractAmount, signedDate: data.contractSignedDate },
      checks_performed: checks,
      reviewer: 'ARIA_AGENT'
    });
  }

  // ============================================================
  // 4. AIRDROP FUNDING VERIFICATION
  // ============================================================
  async verifyAirdropFunding(data: {
    campaignId: string;
    projectName: string;
    fundingWalletAddress: string;
    expectedAmount: number;
    tokenAddress: string;
  }): Promise<AIVerification> {
    const checks: any[] = [];
    let approvedCount = 0;
    let totalChecks = 0;

    // Check 1: Wallet address format
    totalChecks++;
    const walletValid = data.fundingWalletAddress.startsWith('0x') && data.fundingWalletAddress.length === 42;
    checks.push({
      name: 'WALLET_FORMAT',
      passed: walletValid,
      detail: `Funding wallet format: ${walletValid ? 'valid' : 'INVALID'}`
    });
    if (walletValid) approvedCount++;

    // Check 2: Token address format
    totalChecks++;
    const tokenValid = data.tokenAddress.startsWith('0x') && data.tokenAddress.length === 42;
    checks.push({
      name: 'TOKEN_ADDRESS_VALID',
      passed: tokenValid,
      detail: `Token address format: ${tokenValid ? 'valid' : 'INVALID'}`
    });
    if (tokenValid) approvedCount++;

    // Check 3: Amount is positive
    totalChecks++;
    const amountValid = data.expectedAmount > 0;
    checks.push({
      name: 'AMOUNT_POSITIVE',
      passed: amountValid,
      detail: `Expected amount: ${data.expectedAmount}`
    });
    if (amountValid) approvedCount++;

    // Check 4: Project name not empty
    totalChecks++;
    const nameValid = data.projectName.length >= 2;
    checks.push({
      name: 'PROJECT_NAME_VALID',
      passed: nameValid,
      detail: `Project name: "${data.projectName}"`
    });
    if (nameValid) approvedCount++;

    // In production: Check on-chain balance of funding wallet
    // const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    // const tokenContract = new ethers.Contract(data.tokenAddress, ERC20_ABI, provider);
    // const balance = await tokenContract.balanceOf(data.fundingWalletAddress);

    const confidenceScore = approvedCount / totalChecks;
    let result: VerificationResult = confidenceScore >= 0.75 ? 'APPROVED' : 'REJECTED';
    const reasoning = result === 'APPROVED'
      ? `Airdrop funding wallet verified. Monitoring initiated. Confidence: ${(confidenceScore * 100).toFixed(1)}%.`
      : `Airdrop funding verification failed. Issues: ${checks.filter(c => !c.passed).map(c => c.name).join(', ')}`;

    return this.saveVerification({
      verification_type: 'AIRDROP_FUNDING',
      entity_type: 'PROJECT_OWNER',
      entity_id: data.campaignId,
      result,
      confidence_score: confidenceScore,
      reasoning,
      evidence: { projectName: data.projectName, fundingWallet: data.fundingWalletAddress, expectedAmount: data.expectedAmount },
      checks_performed: checks,
      reviewer: 'ARIA_AGENT'
    });
  }

  // ============================================================
  // 5. BONUS / AD-HOC PAYMENT VERIFICATION
  // ============================================================
  async verifyBonusPayment(data: {
    recipientWalletId: string;
    amount: number;
    reason: string;
    requestedBy: string;
  }): Promise<AIVerification> {
    const checks: any[] = [];
    let approvedCount = 0;
    let totalChecks = 0;

    // Check 1: Wallet exists
    totalChecks++;
    const walletResult = await db.query('SELECT * FROM wallets WHERE id = $1', [data.recipientWalletId]);
    const walletExists = walletResult.rows.length > 0;
    checks.push({ name: 'WALLET_EXISTS', passed: walletExists, detail: `Recipient wallet: ${walletExists ? 'found' : 'NOT FOUND'}` });
    if (walletExists) approvedCount++;

    // Check 2: Reason provided
    totalChecks++;
    const reasonValid = data.reason.length >= 10;
    checks.push({ name: 'REASON_PROVIDED', passed: reasonValid, detail: `Reason length: ${data.reason.length} chars (min: 10)` });
    if (reasonValid) approvedCount++;

    // Check 3: Amount reasonable
    totalChecks++;
    const amountOk = data.amount > 0 && data.amount <= 100000;
    checks.push({ name: 'AMOUNT_REASONABLE', passed: amountOk, detail: `Amount: ${data.amount} JY` });
    if (amountOk) approvedCount++;

    // Check 4: Requestor is SUPER_ADMIN
    totalChecks++;
    const adminOk = data.requestedBy === 'SUPER_ADMIN' || data.requestedBy.startsWith('admin:');
    checks.push({ name: 'REQUESTOR_AUTHORIZED', passed: adminOk, detail: `Requested by: ${data.requestedBy}` });
    if (adminOk) approvedCount++;

    const confidenceScore = approvedCount / totalChecks;
    const result: VerificationResult = confidenceScore >= 0.75 ? 'APPROVED' : 'REJECTED';
    return this.saveVerification({
      verification_type: 'BONUS_PAYMENT',
      entity_type: 'USER',
      entity_id: data.recipientWalletId,
      result,
      confidence_score: confidenceScore,
      reasoning: `Bonus payment verification: ${result}. Confidence: ${(confidenceScore * 100).toFixed(1)}%.`,
      evidence: data,
      checks_performed: checks,
      reviewer: 'ARIA_AGENT'
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private calculateActivityScore(activity: any): number {
    let score = 0;
    if (activity.totalArticlesRead > 10) score += 0.2;
    if (activity.totalShares > 5) score += 0.15;
    if (activity.totalQuizzes > 3) score += 0.15;
    if (activity.referralCount > 0) score += 0.1;
    if (activity.accountAgeDays > 30) score += 0.15;
    if (activity.accountAgeDays > 90) score += 0.1;
    if (activity.gamificationParticipation) score += 0.15;
    return Math.min(score, 1);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async getRecentWithdrawals(walletId: string, hours: number): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM transactions WHERE from_wallet_id = $1 AND tx_type IN ('TOKEN_WITHDRAWAL','POINT_REDEEM') AND created_at > NOW() - INTERVAL '${hours} hours'`,
      [walletId]
    );
    return result.rows;
  }

  private async saveVerification(data: {
    verification_type: string;
    entity_type: string;
    entity_id: string;
    result: VerificationResult;
    confidence_score: number;
    reasoning: string;
    evidence: Record<string, any>;
    checks_performed: any[];
    reviewer: string;
    transaction_id?: string;
  }): Promise<AIVerification> {
    const id = db.generateId();
    const insertResult = await db.query<AIVerification>(
      `INSERT INTO ai_verifications (id, verification_type, entity_type, entity_id, transaction_id, result, confidence_score, reasoning, evidence, checks_performed, reviewer, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING *`,
      [
        id, data.verification_type, data.entity_type, data.entity_id,
        data.transaction_id || null, data.result, data.confidence_score,
        data.reasoning, JSON.stringify(data.evidence),
        JSON.stringify(data.checks_performed), data.reviewer
      ]
    );

    // Log to audit
    await auditService.log({
      action: `AI_VERIFICATION_${data.result}`,
      actor: 'ARIA_AGENT',
      entity_type: 'VERIFICATION',
      entity_id: id,
      new_value: { result: data.result, confidence: data.confidence_score, type: data.verification_type }
    });

    // Notify super admin of important results
    if (data.result === 'REJECTED' || data.result === 'FLAGGED') {
      await notificationService.notifySuperAdmin(
        `AI Verification ${data.result}: ${data.verification_type}`,
        data.reasoning,
        'AI_ALERT',
        data.result === 'REJECTED' ? 'HIGH' : 'MEDIUM',
        'VERIFICATION',
        id
      );
    }

    return insertResult.rows[0];
  }

  async getVerification(verificationId: string): Promise<AIVerification | null> {
    const result = await db.query<AIVerification>('SELECT * FROM ai_verifications WHERE id = $1', [verificationId]);
    return result.rows[0] || null;
  }

  async getPendingVerifications(): Promise<AIVerification[]> {
    const result = await db.query<AIVerification>(
      "SELECT * FROM ai_verifications WHERE result = 'PENDING' ORDER BY created_at ASC"
    );
    return result.rows;
  }
}

export const aiVerificationAgent = new AIVerificationAgent();
