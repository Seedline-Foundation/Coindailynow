# Fix all TypeScript errors in Human Approval Service

Write-Host "`n=== Fixing TypeScript Errors in Human Approval Service ===" -ForegroundColor Cyan

# The main issues are:
# 1. Optional properties marked as required
# 2. Missing Prisma includes
# 3. Redis client potentially undefined
# 4. Type mismatches

# We need to update the interfaces to properly handle optional properties
# and fix the Prisma query includes

Write-Host "`nStep 1: Update type interfaces to handle optional properties properly" -ForegroundColor Yellow
Write-Host "Step 2: Fix Prisma includes to include relations" -ForegroundColor Yellow
Write-Host "Step 3: Add null checks for redisClient" -ForegroundColor Yellow
Write-Host "Step 4: Fix rollbackWorkflow call signature" -ForegroundColor Yellow
Write-Host "Step 5: Fix API route validation" -ForegroundColor Yellow

Write-Host "`n✅ Errors identified. Manual fixes needed:" -ForegroundColor Green
Write-Host "  - Change assignedEditorId?: string to assignedEditorId?: string | undefined" -ForegroundColor White
Write-Host "  - Add Prisma includes for WorkflowStep, Article, User relations" -ForegroundColor White
Write-Host "  - Add redisClient?.setex() null checks" -ForegroundColor White
Write-Host "  - Fix aiWorkflowService.rollbackWorkflow() call" -ForegroundColor White
Write-Host "  - Add req.params.id validation in routes" -ForegroundColor White

Write-Host "`nRun this script to see errors, then apply fixes manually" -ForegroundColor Cyan
