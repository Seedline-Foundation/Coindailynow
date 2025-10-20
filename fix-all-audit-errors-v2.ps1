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

$content = Get-Content $serviceFile -Raw

# Replace all ?: undefined with ?? null for Prisma strict mode
$content = $content -replace '\? JSON\.stringify\(params\.(\w+)\) : undefined,', '? JSON.stringify(params.$1) : null,'
$content = $content -replace 'params\.(\w+),', 'params.$1 ?? null,'
$content = $content -replace 'data\.(\w+),', 'data.$1 ?? null,'

# Fix specific ones that shouldn't be nullish
$content = $content -replace 'params\.operationType ?? null,', 'params.operationType,'
$content = $content -replace 'params\.operationCategory ?? null,', 'params.operationCategory,'
$content = $content -replace 'params\.agentType ?? null,', 'params.agentType,'
$content = $content -replace 'params\.requestId ?? null,', 'params.requestId,'
$content = $content -replace 'params\.status ?? null,', 'params.status,'
$content = $content -replace 'params\.createdAt ?? null,', 'params.createdAt,'
$content = $content -replace 'params\.inputDataHash ?? null,', 'params.inputDataHash,'
$content = $content -replace 'params\.humanReviewed ?? null,', 'params.humanReviewed,'
$content = $content -replace 'params\.consentRequired ?? null,', 'params.consentRequired,'
$content = $content -replace 'params\.gdprCompliant ?? null,', 'params.gdprCompliant,'
$content = $content -replace 'params\.auditLogId ?? null,', 'params.auditLogId,'
$content = $content -replace 'params\.decisionPoint ?? null,', 'params.decisionPoint,'
$content = $content -replace 'params\.decisionType ?? null,', 'params.decisionType,'
$content = $content -replace 'params\.decisionOutcome ?? null,', 'params.decisionOutcome,'
$content = $content -replace 'params\.primaryReason ?? null,', 'params.primaryReason,'
$content = $content -replace 'params\.confidenceScore ?? null,', 'params.confidenceScore,'
$content = $content -replace 'params\.evidenceReferences ?? null,', 'params.evidenceReferences,'
$content = $content -replace 'params\.userImpact ?? null,', 'params.userImpact,'
$content = $content -replace 'params\.appealable ?? null,', 'params.appealable,'
$content = $content -replace 'params\.appealProcess ?? null,', 'params.appealProcess,'
$content = $content -replace 'params\.appealDeadline ?? null,', 'params.appealDeadline,'
$content = $content -replace 'params\.dataRetentionPeriod ?? null,', 'params.dataRetentionPeriod,'
$content = $content -replace 'params\.rightToExplanation ?? null,', 'params.rightToExplanation,'
$content = $content -replace 'params\.reportType ?? null,', 'params.reportType,'
$content = $content -replace 'params\.title ?? null,', 'params.title,'
$content = $content -replace 'params\.startDate ?? null,', 'params.startDate,'
$content = $content -replace 'params\.endDate ?? null,', 'params.endDate,'
$content = $content -replace 'params\.status ?? null,', 'params.status,'
$content = $content -replace 'params\.format ?? null,', 'params.format,'
$content = $content -replace 'params\.fileSize ?? null,', 'params.fileSize,'
$content = $content -replace 'params\.recordCount ?? null,', 'params.recordCount,'
$content = $content -replace 'params\.downloadCount ?? null,', 'params.downloadCount,'
$content = $content -replace 'params\.generatedAt ?? null,', 'params.generatedAt,'
$content = $content -replace 'params\.consentType ?? null,', 'params.consentType,'
$content = $content -replace 'params\.purpose ?? null,', 'params.purpose,'
$content = $content -replace 'params\.scope ?? null,', 'params.scope,'
$content = $content -replace 'params\.consented ?? null,', 'params.consented,'
$content = $content -replace 'params\.consentVersion ?? null,', 'params.consentVersion,'
$content = $content -replace 'params\.legalBasis ?? null,', 'params.legalBasis,'
$content = $content -replace 'params\.consentedAt ?? null,', 'params.consentedAt,'
$content = $content -replace 'params\.dataDeleted ?? null,', 'params.dataDeleted,'

# Fix aggregation orderBy errors
$content = $content -replace "orderBy: \{ _count: \{ _all: 'desc' \} \},", "orderBy: { _count: { id: 'desc' } },"

Set-Content $serviceFile -Value $content -NoNewline

Write-Host "   ✓ Fixed optional fields and aggregation" -ForegroundColor Green

# 2. Fix ai-audit.ts route handlers  
Write-Host "`n2. Fixing ai-audit.ts route handlers..." -ForegroundColor Yellow

$content = Get-Content $routesFile -Raw

# Fix requireAdmin missing return
$oldAdmin = @"
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
"@

$newAdmin = @"
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

$content = $content.Replace($oldAdmin, $newAdmin)

# Add return types to all route handlers
$content = $content -replace 'async \(req: Request, res: Response\) =>', 'async (req: Request, res: Response): Promise<void> =>'

# Fix undefined checks for req.params.id
$content = $content -replace '  try \{\s+const \{ id \} = req\.params;\s+const log = await aiAuditService\.getAuditLogById\(id\);', @"
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Log ID is required' } });
      return;
    }
    const log = await aiAuditService.getAuditLogById(id);
"@

# Fix startDate/endDate optional in getAuditLogs
$oldOptions = @"
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

    const result = await aiAuditService.getAuditLogs(options);
"@

$newOptions = @"
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

    const result = await aiAuditService.getAuditLogs(options);
"@

$content = $content.Replace($oldOptions, $newOptions)

# Fix ipAddress and userAgent defaults
$content = $content -replace "ipAddress: req\.ip,", "ipAddress: req.ip ?? '',"
$content = $content -replace "userAgent: req\.get\('user-agent'\),", "userAgent: req.get('user-agent') ?? '',"

Set-Content $routesFile -Value $content -NoNewline

Write-Host "   ✓ Fixed route handlers" -ForegroundColor Green

# 3. Fix aiAuditResolvers.ts subscription types
Write-Host "`n3. Fixing aiAuditResolvers.ts..." -ForegroundColor Yellow

$content = Get-Content $resolversFile -Raw

$oldIterator = @"
              async next() {
                const result = await iterator.next();
                if (result.done) {
                  return result;
                }
                const log = result.value.auditLogCreated;
"@

$newIterator = @"
              async next(): Promise<IteratorResult<any>> {
                const result = await iterator.next();
                if (result.done) {
                  return result;
                }
                const log = (result.value as any).auditLogCreated;
"@

$content = $content.Replace($oldIterator, $newIterator)

Set-Content $resolversFile -Value $content -NoNewline

Write-Host "   ✓ Fixed subscription types" -ForegroundColor Green

# 4. Fix aiAuditWorker.ts JSDoc error
Write-Host "`n4. Fixing aiAuditWorker.ts..." -ForegroundColor Yellow

$content = Get-Content $workerFile -Raw

# Fix JSDoc asterisk issue - use backticks
$content = $content.Replace(
    "   * @default '0 */6 * * *' (every 6 hours)",
    "   * @default '0 SLASH6 * * *' (every 6 hours)".Replace("SLASH", "*/")
)

Set-Content $workerFile -Value $content -NoNewline

Write-Host "   ✓ Fixed JSDoc" -ForegroundColor Green

Write-Host "`n✅ All fixes applied successfully!" -ForegroundColor Green
Write-Host "`nPlease restart the TypeScript server in VS Code:" -ForegroundColor Cyan
Write-Host "  1. Press Ctrl+Shift+P" -ForegroundColor White
Write-Host "  2. Type 'TypeScript: Restart TS Server'" -ForegroundColor White
Write-Host "  3. Press Enter" -ForegroundColor White
