# Fix all AI Audit errors - comprehensive fix script

$ErrorActionPreference = "Stop"

Write-Host "Fixing AI Audit errors..." -ForegroundColor Cyan

# File paths
$serviceFile = "backend\src\services\aiAuditService.ts"
$routesFile = "backend\src\api\ai-audit.ts"
$resolversFile = "backend\src\api\aiAuditResolvers.ts"
$workerFile = "backend\src\workers\aiAuditWorker.ts"

# 1. Fix aiAuditService.ts - Change undefined to null for optional fields
Write-Host "`n1. Fixing aiAuditService.ts optional fields..." -ForegroundColor Yellow

# Read the file
$content = Get-Content $serviceFile -Raw

# Fix all undefined assignments to null for optional fields
$replacements = @{
    'agentId: params.agentId,' = 'agentId: params.agentId ?? null,'
    'userId: params.userId,' = 'userId: params.userId ?? null,'
    'endpoint: params.endpoint,' = 'endpoint: params.endpoint ?? null,'
    'httpMethod: params.httpMethod,' = 'httpMethod: params.httpMethod ?? null,'
    'userAgent: params.userAgent,' = 'userAgent: params.userAgent ?? null,'
    'ipAddress: params.ipAddress,' = 'ipAddress: params.ipAddress ?? null,'
    'sessionId: params.sessionId,' = 'sessionId: params.sessionId ?? null,'
    'correlationId: params.correlationId,' = 'correlationId: params.correlationId ?? null,'
    'parentOperationId: params.parentOperationId,' = 'parentOperationId: params.parentOperationId ?? null,'
    'batchId: params.batchId,' = 'batchId: params.batchId ?? null,'
    'estimatedCost: params.estimatedCost,' = 'estimatedCost: params.estimatedCost ?? null,'
    'tokenUsage: params.tokenUsage ? JSON.stringify(params.tokenUsage) : undefined,' = 'tokenUsage: params.tokenUsage ? JSON.stringify(params.tokenUsage) : null,'
    'qualityMetrics: params.qualityMetrics ? JSON.stringify(params.qualityMetrics) : undefined,' = 'qualityMetrics: params.qualityMetrics ? JSON.stringify(params.qualityMetrics) : null,'
    'errorType: params.errorType,' = 'errorType: params.errorType ?? null,'
    'errorMessage: params.errorMessage,' = 'errorMessage: params.errorMessage ?? null,'
    'errorStack: params.errorStack,' = 'errorStack: params.errorStack ?? null,'
    'retryCount: params.retryCount,' = 'retryCount: params.retryCount ?? null,'
    'reviewedBy: params.reviewedBy,' = 'reviewedBy: params.reviewedBy ?? null,'
    'reviewedAt: params.reviewedAt,' = 'reviewedAt: params.reviewedAt ?? null,'
    'humanDecision: params.humanDecision,' = 'humanDecision: params.humanDecision ?? null,'
    'overrideReason: params.overrideReason,' = 'overrideReason: params.overrideReason ?? null,'
    'feedbackToAI: params.feedbackToAI,' = 'feedbackToAI: params.feedbackToAI ?? null,'
    'complianceFlags: params.complianceFlags ? JSON.stringify(params.complianceFlags) : undefined,' = 'complianceFlags: params.complianceFlags ? JSON.stringify(params.complianceFlags) : null,'
    'tags: params.tags,' = 'tags: params.tags ?? null,'
    'contributingFactors: params.contributingFactors ? JSON.stringify(params.contributingFactors) : undefined,' = 'contributingFactors: params.contributingFactors ? JSON.stringify(params.contributingFactors) : null,'
    'alternativeOptions: params.alternativeOptions ? JSON.stringify(params.alternativeOptions) : undefined,' = 'alternativeOptions: params.alternativeOptions ? JSON.stringify(params.alternativeOptions) : null,'
    'rulesApplied: params.rulesApplied ? JSON.stringify(params.rulesApplied) : undefined,' = 'rulesApplied: params.rulesApplied ? JSON.stringify(params.rulesApplied) : null,'
    'policiesChecked: params.policiesChecked ? JSON.stringify(params.policiesChecked) : undefined,' = 'policiesChecked: params.policiesChecked ? JSON.stringify(params.policiesChecked) : null,'
    'biasCheckResults: params.biasCheckResults ? JSON.stringify(params.biasCheckResults) : undefined,' = 'biasCheckResults: params.biasCheckResults ? JSON.stringify(params.biasCheckResults) : null,'
    'fairnessMetrics: params.fairnessMetrics ? JSON.stringify(params.fairnessMetrics) : undefined,' = 'fairnessMetrics: params.fairnessMetrics ? JSON.stringify(params.fairnessMetrics) : null,'
    'humanExplanation: params.humanExplanation,' = 'humanExplanation: params.humanExplanation ?? null,'
    'technicalDetails: params.technicalDetails ? JSON.stringify(params.technicalDetails) : undefined,' = 'technicalDetails: params.technicalDetails ? JSON.stringify(params.technicalDetails) : null,'
    'contextData: params.contextData ? JSON.stringify(params.contextData) : undefined,' = 'contextData: params.contextData ? JSON.stringify(params.contextData) : null,'
    'overrideReason: data.overrideReason,' = 'overrideReason: data.overrideReason ?? null,'
    'feedbackToAI: data.feedbackToAI,' = 'feedbackToAI: data.feedbackToAI ?? null,'
    'description: params.description,' = 'description: params.description ?? null,'
    'userId: params.userId,' = 'userId: params.userId ?? null,'
    'requestedBy: params.requestedBy,' = 'requestedBy: params.requestedBy ?? null,'
    'filters: params.filters ? JSON.stringify(params.filters) : undefined,' = 'filters: params.filters ? JSON.stringify(params.filters) : null,'
    'summary: params.summary ? JSON.stringify(params.summary) : undefined,' = 'summary: params.summary ? JSON.stringify(params.summary) : null,'
    'breakdown: params.breakdown ? JSON.stringify(params.breakdown) : undefined,' = 'breakdown: params.breakdown ? JSON.stringify(params.breakdown) : null,'
    'downloadedBy: params.downloadedBy,' = 'downloadedBy: params.downloadedBy ?? null,'
    'consentMethod: params.consentMethod,' = 'consentMethod: params.consentMethod ?? null,'
    'ipAddress: params.ipAddress,' = 'ipAddress: params.ipAddress ?? null,'
    'userAgent: params.userAgent,' = 'userAgent: params.userAgent ?? null,'
    'expiresAt: params.expiresAt,' = 'expiresAt: params.expiresAt ?? null,'
    'withdrawalReason: params.withdrawalReason,' = 'withdrawalReason: params.withdrawalReason ?? null,'
    'deletedAt: params.deletedAt,' = 'deletedAt: params.deletedAt ?? null,'
}

foreach ($key in $replacements.Keys) {
    $content = $content.Replace($key, $replacements[$key])
}

# Fix aggregation orderBy errors
$content = $content.Replace(
    "orderBy: { _count: { _all: 'desc' } },",
    "orderBy: { _count: { id: 'desc' } },"
)

# Write back
Set-Content $serviceFile -Value $content -NoNewline

Write-Host "   ✓ Fixed optional fields and aggregation" -ForegroundColor Green

# 2. Fix ai-audit.ts route handlers
Write-Host "`n2. Fixing ai-audit.ts route handlers..." -ForegroundColor Yellow

$content = Get-Content $routesFile -Raw

# Fix requireAdmin missing return
$content = $content.Replace(
    @"
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!(req as any).user || (req as any).user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
  next();
}
"@,
    @"
function requireAdmin(req: Request, res: Response, next: Function): void {
  if (!(req as any).user || (req as any).user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
    return;
  }
  next();
}
"@
)

# Fix getAuditLogs startDate/endDate undefined
$content = $content.Replace(
    @"
    const options = {
      operationType: req.query.operationType as string,
      operationCategory: req.query.operationCategory as string,
      agentType: req.query.agentType as string,
      userId: req.query.userId as string,
      status: req.query.status as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      humanReviewed: req.query.humanReviewed === 'true' ? true : req.query.humanReviewed === 'false' ? false : undefined,
      limit,
      offset,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
"@,
    @"
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const options: any = {
      operationType: req.query.operationType as string,
      operationCategory: req.query.operationCategory as string,
      agentType: req.query.agentType as string,
      userId: req.query.userId as string,
      status: req.query.status as string,
      humanReviewed: req.query.humanReviewed === 'true' ? true : req.query.humanReviewed === 'false' ? false : undefined,
      limit,
      offset,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
    
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
"@
)

# Fix getAuditLogById undefined id
$content = $content.Replace(
    @"
router.get('/logs/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = await aiAuditService.getAuditLogById(id);
"@,
    @"
router.get('/logs/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Log ID is required' } });
      return;
    }
    const log = await aiAuditService.getAuditLogById(id);
"@
)

# Fix recordHumanReview undefined id
$content = $content.Replace(
    @"
router.post('/logs/:id/review', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
"@,
    @"
router.post('/logs/:id/review', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Log ID is required' } });
      return;
    }
"@
)

# Fix getDecisionById undefined id
$content = $content.Replace(
    @"
router.get('/decisions/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decision = await aiAuditService.getDecisionById(id);
"@,
    @"
router.get('/decisions/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Decision ID is required' } });
      return;
    }
    const decision = await aiAuditService.getDecisionById(id);
"@
)

# Fix getDecisionLogs undefined auditLogId
$content = $content.Replace(
    @"
router.get('/decisions', authenticate, async (req: Request, res: Response) => {
  try {
    const { auditLogId } = req.query;
    const decisions = await aiAuditService.getDecisionLogs(auditLogId);
"@,
    @"
router.get('/decisions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const auditLogId = req.query.auditLogId as string | undefined;
    if (!auditLogId) {
      res.status(400).json({ success: false, error: { code: 'MISSING_AUDIT_LOG_ID', message: 'Audit log ID is required' } });
      return;
    }
    const decisions = await aiAuditService.getDecisionLogs(auditLogId);
"@
)

# Fix generateComplianceReport return type
$content = $content.Replace(
    @"
router.post('/export', authenticate, requireAdmin, async (req: Request, res: Response) => {
"@,
    @"
router.post('/export', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
"@
)

# Fix exportComplianceReport return type and undefined id
$content = $content.Replace(
    @"
router.get('/export/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
"@,
    @"
router.get('/export/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Report ID is required' } });
      return;
    }
"@
)

# Fix recordUserConsent return type and ipAddress/userAgent undefined
$content = $content.Replace(
    @"
router.post('/consent', authenticate, async (req: Request, res: Response) => {
"@,
    @"
router.post('/consent', authenticate, async (req: Request, res: Response): Promise<void> => {
"@
)

$content = $content.Replace(
    @"
    const consent = await aiAuditService.recordUserConsent({
      userId: user.id,
      consentType,
      purpose,
      scope,
      consented,
      consentMethod,
      consentVersion,
      legalBasis,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
"@,
    @"
    const consent = await aiAuditService.recordUserConsent({
      userId: user.id,
      consentType,
      purpose,
      scope,
      consented,
      consentMethod,
      consentVersion,
      legalBasis,
      ipAddress: req.ip ?? '',
      userAgent: req.get('user-agent') ?? '',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
"@
)

# Fix withdrawUserConsent undefined id
$content = $content.Replace(
    @"
router.post('/consent/:id/withdraw', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
"@,
    @"
router.post('/consent/:id/withdraw', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Consent ID is required' } });
      return;
    }
"@
)

Set-Content $routesFile -Value $content -NoNewline

Write-Host "   ✓ Fixed route handlers" -ForegroundColor Green

# 3. Fix aiAuditResolvers.ts subscription types
Write-Host "`n3. Fixing aiAuditResolvers.ts..." -ForegroundColor Yellow

$content = Get-Content $resolversFile -Raw

$content = $content.Replace(
    @"
              async next() {
                const result = await iterator.next();
                if (result.done) {
                  return result;
                }
                const log = result.value.auditLogCreated;
"@,
    @"
              async next(): Promise<IteratorResult<any>> {
                const result = await iterator.next();
                if (result.done) {
                  return result;
                }
                const log = (result.value as any).auditLogCreated;
"@
)

Set-Content $resolversFile -Value $content -NoNewline

Write-Host "   ✓ Fixed subscription types" -ForegroundColor Green

# 4. Fix aiAuditWorker.ts JSDoc error
Write-Host "`n4. Fixing aiAuditWorker.ts..." -ForegroundColor Yellow

$content = Get-Content $workerFile -Raw

# Fix JSDoc asterisk issue
$content = $content.Replace(
    "   * @default '0 */6 * * *' (every 6 hours)",
    "   * @default '0 STAR/6 * * *' (every 6 hours)".Replace("STAR", "*")
)

Set-Content $workerFile -Value $content -NoNewline

Write-Host "   ✓ Fixed JSDoc" -ForegroundColor Green

Write-Host "`n✅ All fixes applied successfully!" -ForegroundColor Green
Write-Host "`nPlease restart the TypeScript server in VS Code:" -ForegroundColor Cyan
Write-Host "  1. Press Ctrl+Shift+P" -ForegroundColor White
Write-Host "  2. Type 'TypeScript: Restart TS Server'" -ForegroundColor White
Write-Host "  3. Press Enter" -ForegroundColor White
