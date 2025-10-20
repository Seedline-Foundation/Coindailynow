# Fix ai-approval.ts API route errors

$file = "backend\src\api\ai-approval.ts"
$content = Get-Content $file -Raw

Write-Host "Fixing ai-approval.ts..." -ForegroundColor Cyan

# Add validation for id parameter at the start of each route that uses it
# Pattern: after const { id } = req.params; add if (!id) return res.status(400).json({ error: 'Missing id' });

# Replace const details = await humanApprovalService.getContentReviewDetails(id);
# with validation first
$content = $content -replace '(const \{ id \} = req\.params;)\s+(const details = await humanApprovalService\.getContentReviewDetails\(id\);)', '$1
    if (!id) return res.status(400).json({ error: ''Missing workflow ID'' });
    $2'

# Add return statement pattern - find routes without returns in catch blocks
# Pattern: } catch (error) { ... } without return
$content = $content -replace '(\} catch \(error\) \{[^\}]+res\.status\(\d+\)\.json[^\}]+)\}(\s+\});', '$1}
    return;$2'

# Fix specific routes - add validation for id in workflowId assignments
$content = $content -replace '(const \{ id \} = req\.params;)\s+(const \{ feedback[^}]+\} = req\.body;)\s+(await humanApprovalService\.processApprovalDecision\(\{)\s+(workflowId: id,)', '$1
    if (!id) return res.status(400).json({ error: ''Missing workflow ID'' });
    $2
    $3
      workflowId: id,'

# Fix assignEditor call
$content = $content -replace '(const \{ id \} = req\.params;)\s+(const \{ editorId \} = req\.body;)\s+([^\n]*validation[^\n]*\n[^\n]*\n)?\s+(await humanApprovalService\.assignEditor\(id, editorId\);)', '$1
    if (!id) return res.status(400).json({ error: ''Missing workflow ID'' });
    $2
    $4'

# Fix getEditorPerformanceMetrics call
$content = $content -replace '(const \{ id \} = req\.params;)\s+(const metrics = await humanApprovalService\.getEditorPerformanceMetrics\(id\);)', '$1
    if (!id) return res.status(400).json({ error: ''Missing editor ID'' });
    $2'

Set-Content $file -Value $content -NoNewline

Write-Host "Done! Check ai-approval.ts errors now." -ForegroundColor Green
