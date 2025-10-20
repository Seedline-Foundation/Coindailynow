# Final comprehensive fix for all AI Audit errors

$ErrorActionPreference = "Stop"

Write-Host "Applying final fixes to AI Audit files..." -ForegroundColor Cyan

# Fix 1: aiAuditService.ts - Fix all remaining create/update data objects
Write-Host "`n1. Fixing aiAuditService.ts Prisma calls..." -ForegroundColor Yellow

$file = "backend\src\services\aiAuditService.ts"
$content = Get-Content $file -Raw

# Fix line 227 - AIDecision create - change all undefined to null
$old227 = @"
    const decision = await prisma.aIDecision.create({
      data: {
        id: uuidv4(),
        auditLogId: input.auditLogId,
        decisionPoint: input.decisionPoint,
        decisionType: input.decisionType,
        decisionOutcome: input.decisionOutcome,
        primaryReason: input.primaryReason,
        contributingFactors: input.contributingFactors ? JSON.stringify(input.contributingFactors) : undefined,
        confidenceScore: input.confidenceScore,
        alternativeOptions: input.alternativeOptions ? JSON.stringify(input.alternativeOptions) : undefined,
        rulesApplied: input.rulesApplied ? JSON.stringify(input.rulesApplied) : undefined,
        policiesChecked: input.policiesChecked ? JSON.stringify(input.policiesChecked) : undefined,
        biasCheckResults: input.biasCheckResults ? JSON.stringify(input.biasCheckResults) : undefined,
        fairnessMetrics: input.fairnessMetrics ? JSON.stringify(input.fairnessMetrics) : undefined,
        evidenceReferences: input.evidenceReferences,
        userImpact: input.userImpact,
        appealable: input.appealable,
        appealProcess: input.appealProcess,
        appealDeadline: input.appealDeadline,
        humanExplanation: input.humanExplanation,
        technicalDetails: input.technicalDetails ? JSON.stringify(input.technicalDetails) : undefined,
        contextData: input.contextData ? JSON.stringify(input.contextData) : undefined,
        dataRetentionPeriod: input.dataRetentionPeriod,
        rightToExplanation: true,
      },
    });
"@

$new227 = @"
    const decision = await prisma.aIDecision.create({
      data: {
        id: uuidv4(),
        auditLogId: input.auditLogId,
        decisionPoint: input.decisionPoint,
        decisionType: input.decisionType,
        decisionOutcome: input.decisionOutcome,
        primaryReason: input.primaryReason,
        contributingFactors: input.contributingFactors ? JSON.stringify(input.contributingFactors) : null,
        confidenceScore: input.confidenceScore,
        alternativeOptions: input.alternativeOptions ? JSON.stringify(input.alternativeOptions) : null,
        rulesApplied: input.rulesApplied ? JSON.stringify(input.rulesApplied) : null,
        policiesChecked: input.policiesChecked ? JSON.stringify(input.policiesChecked) : null,
        biasCheckResults: input.biasCheckResults ? JSON.stringify(input.biasCheckResults) : null,
        fairnessMetrics: input.fairnessMetrics ? JSON.stringify(input.fairnessMetrics) : null,
        evidenceReferences: input.evidenceReferences,
        userImpact: input.userImpact,
        appealable: input.appealable,
        appealProcess: input.appealProcess,
        appealDeadline: input.appealDeadline ?? null,
        humanExplanation: input.humanExplanation ?? null,
        technicalDetails: input.technicalDetails ? JSON.stringify(input.technicalDetails) : null,
        contextData: input.contextData ? JSON.stringify(input.contextData) : null,
        dataRetentionPeriod: input.dataRetentionPeriod,
        rightToExplanation: true,
      },
    });
"@

$content = $content.Replace($old227, $new227)

# Fix line 440 - recordHumanReview update
$old440 = @"
    const updated = await prisma.aIOperationLog.update({
      where: { id },
      data: {
        humanReviewed: true,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
        humanDecision: data.humanDecision,
        overrideReason: data.overrideReason,
        feedbackToAI: data.feedbackToAI,
      },
    });
"@

$new440 = @"
    const updated = await prisma.aIOperationLog.update({
      where: { id },
      data: {
        humanReviewed: true,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
        humanDecision: data.humanDecision,
        overrideReason: data.overrideReason ?? null,
        feedbackToAI: data.feedbackToAI ?? null,
      },
    });
"@

$content = $content.Replace($old440, $new440)

# Fix line 581 - generateComplianceReport create
$old581 = @"
    const report = await prisma.complianceReport.create({
      data: {
        id: uuidv4(),
        reportType: input.reportType,
        title: input.title,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        userId: input.userId,
        requestedBy: input.requestedBy,
        status: 'completed',
        format: input.format,
        filePath: `/exports/compliance/${uuidv4()}.${input.format.toLowerCase()}`,
        fileSize: 0, // Will be updated after file generation
        recordCount: filteredLogs.length,
        filters: input.filters ? JSON.stringify(input.filters) : undefined,
        summary: input.summary ? JSON.stringify(input.summary) : undefined,
        breakdown: input.breakdown ? JSON.stringify(input.breakdown) : undefined,
        downloadCount: 0,
        downloadedBy: input.downloadedBy,
        generatedAt: new Date(),
      },
    });
"@

$new581 = @"
    const report = await prisma.complianceReport.create({
      data: {
        id: uuidv4(),
        reportType: input.reportType,
        title: input.title,
        description: input.description ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        userId: input.userId ?? null,
        requestedBy: input.requestedBy ?? null,
        status: 'completed',
        format: input.format,
        filePath: `/exports/compliance/${uuidv4()}.${input.format.toLowerCase()}`,
        fileSize: 0, // Will be updated after file generation
        recordCount: filteredLogs.length,
        filters: input.filters ? JSON.stringify(input.filters) : null,
        summary: input.summary ? JSON.stringify(input.summary) : null,
        breakdown: input.breakdown ? JSON.stringify(input.breakdown) : null,
        downloadCount: 0,
        downloadedBy: input.downloadedBy ?? null,
        generatedAt: new Date(),
      },
    });
"@

$content = $content.Replace($old581, $new581)

# Fix line 761 - recordUserConsent create
$old761 = @"
    const consent = await prisma.userConsent.create({
      data: {
        id: uuidv4(),
        userId: input.userId,
        consentType: input.consentType,
        purpose: input.purpose,
        scope: input.scope,
        consented: input.consented,
        consentMethod: input.consentMethod,
        consentVersion: input.consentVersion,
        legalBasis: input.legalBasis,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        expiresAt: input.expiresAt,
        consentedAt: new Date(),
      },
    });
"@

$new761 = @"
    const consent = await prisma.userConsent.create({
      data: {
        id: uuidv4(),
        userId: input.userId,
        consentType: input.consentType,
        purpose: input.purpose,
        scope: input.scope,
        consented: input.consented,
        consentMethod: input.consentMethod ?? null,
        consentVersion: input.consentVersion,
        legalBasis: input.legalBasis,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        expiresAt: input.expiresAt ?? null,
        consentedAt: new Date(),
      },
    });
"@

$content = $content.Replace($old761, $new761)

# Fix line 828 - withdrawUserConsent update
$old828 = @"
    const updated = await prisma.userConsent.update({
      where: { id },
      data: {
        consented: false,
        withdrawnAt: new Date(),
        withdrawalReason: input.withdrawalReason,
        dataDeleted: input.dataDeleted || false,
        deletedAt: input.deletedAt,
      },
    });
"@

$new828 = @"
    const updated = await prisma.userConsent.update({
      where: { id },
      data: {
        consented: false,
        withdrawnAt: new Date(),
        withdrawalReason: input.withdrawalReason ?? null,
        dataDeleted: input.dataDeleted || false,
        deletedAt: input.deletedAt ?? null,
      },
    });
"@

$content = $content.Replace($old828, $new828)

Set-Content $file -Value $content -NoNewline
Write-Host "   ✓ Fixed all Prisma create/update calls" -ForegroundColor Green

# Fix 2: ai-audit.ts - Fix all route handler issues
Write-Host "`n2. Fixing ai-audit.ts route handlers..." -ForegroundColor Yellow

$file = "backend\src\api\ai-audit.ts"
$content = Get-Content $file -Raw

# All route parameter checks - add validation before each use
$patterns = @(
    @{
        Old = @"
router.get('/logs/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const log = await aiAuditService.getAuditLogById(id);
"@
        New = @"
router.get('/logs/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Log ID required' } });
      return;
    }
    const log = await aiAuditService.getAuditLogById(id);
"@
    },
    @{
        Old = @"
router.post('/logs/:id/review', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;
"@
        New = @"
router.post('/logs/:id/review', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Log ID required' } });
      return;
    }
    const data = req.body;
"@
    },
    @{
        Old = @"
router.get('/decisions/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const decision = await aiAuditService.getDecisionById(id);
"@
        New = @"
router.get('/decisions/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Decision ID required' } });
      return;
    }
    const decision = await aiAuditService.getDecisionById(id);
"@
    },
    @{
        Old = @"
router.get('/decisions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const auditLogId = req.query.auditLogId as string | undefined;
    const decisions = await aiAuditService.getDecisionLogs(auditLogId);
"@
        New = @"
router.get('/decisions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const auditLogId = req.query.auditLogId as string | undefined;
    if (!auditLogId) {
      res.status(400).json({ success: false, error: { code: 'MISSING_AUDIT_LOG_ID', message: 'Audit log ID required' } });
      return;
    }
    const decisions = await aiAuditService.getDecisionLogs(auditLogId);
"@
    },
    @{
        Old = @"
router.get('/export/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { format } = req.query;
"@
        New = @"
router.get('/export/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Report ID required' } });
      return;
    }
    const { format } = req.query;
"@
    },
    @{
        Old = @"
router.post('/consent/:id/withdraw', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;
"@
        New = @"
router.post('/consent/:id/withdraw', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Consent ID required' } });
      return;
    }
    const data = req.body;
"@
    }
)

foreach ($pattern in $patterns) {
    $content = $content.Replace($pattern.Old, $pattern.New)
}

Set-Content $file -Value $content -NoNewline
Write-Host "   ✓ Fixed all route parameter validations" -ForegroundColor Green

# Fix 3: aiAuditResolvers.ts - Already fixed in previous script
Write-Host "`n3. aiAuditResolvers.ts already fixed" -ForegroundColor Green

# Fix 4: aiAuditWorker.ts - Fix JSDoc cron expression
Write-Host "`n4. Fixing aiAuditWorker.ts JSDoc..." -ForegroundColor Yellow

$file = "backend\src\workers\aiAuditWorker.ts"
$content = Get-Content $file -Raw

# Change the problematic JSDoc comment
$content = $content -replace "@default '0 \*/6 \* \* \*'", "@default '0 STAR/6 STAR STAR STAR' (replace STAR with *)"

Set-Content $file -Value $content -NoNewline
Write-Host "   ✓ Fixed JSDoc comment" -ForegroundColor Green

Write-Host "`n✅ All comprehensive fixes applied!" -ForegroundColor Green
Write-Host "`nNext: Restart TypeScript server in VS Code" -ForegroundColor Cyan
