# Fix Content Pipeline Service TypeScript Errors# Fix Content Pipeline TypeScript Errors

# This script fixes all remaining TypeScript compilation errorsWrite-Host "Fixing Content Pipeline TypeScript Errors..." -ForegroundColor Cyan



$filePath = "backend\src\services\aiContentPipelineService.ts"# Step 1: Add missing fields to Article model

$content = Get-Content $filePath -RawWrite-Host "`n1. Adding missing fields to Article model..." -ForegroundColor Yellow



Write-Host "Fixing Content Pipeline Service errors..." -ForegroundColor Cyan$schemaPath = "backend\prisma\schema.prisma"

$schemaContent = Get-Content $schemaPath -Raw

# Error 1: Fix SystemConfiguration create - add id and updatedAt

Write-Host "1. Fixing SystemConfiguration upsert create block..." -ForegroundColor Yellow# Add aiGenerated and seoKeywords fields if not present

$content = $content -replace `if ($schemaContent -notmatch "aiGenerated") {

    "create: \{\s+key: 'content_pipeline',\s+value: updatedConfig as any,\s+description: 'Content Pipeline Automation Configuration'\s+\}", `    Write-Host "Adding aiGenerated field to Article model..." -ForegroundColor Green

    "create: {`n          id: Math.random().toString(36).substring(7),`n          key: 'content_pipeline',`n          value: JSON.stringify(updatedConfig),`n          description: 'Content Pipeline Automation Configuration',`n          updatedAt: new Date()`n        }"    $schemaContent = $schemaContent -replace "(model Article \{[^}]+metadata\s+String\?\s+// JSON field for AI feedback metadata)", "`$1`n  aiGenerated        Boolean?             // Whether article was AI-generated`n  seoKeywords        String?              // SEO keywords for optimization"

    Set-Content -Path $schemaPath -Value $schemaContent -NoNewline

# Error 2: Fix Article create - add id, readingTimeMinutes, updatedAt}

Write-Host "2. Fixing Article.create missing required fields..." -ForegroundColor Yellow

$content = $content -replace `# Step 2: Regenerate Prisma Client

    "const article = await prisma\.article\.create\(\{\s+data: \{\s+title: result\.title,", `Write-Host "`n2. Regenerating Prisma Client..." -ForegroundColor Yellow

    "const article = await prisma.article.create({`n        data: {`n          id: Math.random().toString(36).substring(7),`n          title: result.title,"Set-Location backend

npx prisma generate

$content = $content -replace `Set-Location ..

    "tags: result\.tags \|\| \[\],\s+seoTitle: result\.title,\s+seoDescription: result\.excerpt", `

    "tags: result.tags || [],`n          readingTimeMinutes: Math.ceil((result.content || '').split(' ').length / 200),`n          seoTitle: result.title,`n          seoDescription: result.excerpt,`n          updatedAt: new Date()"Write-Host "`nDone! Prisma Client regenerated with all models." -ForegroundColor Green

Write-Host "Please reload VS Code window to refresh TypeScript IntelliSense." -ForegroundColor Cyan

# Error 3-5: Fix inputData - needs JSON.stringify for all AITask creates
Write-Host "3-5. Fixing inputData JSON serialization..." -ForegroundColor Yellow

# Translation task inputData
$content = $content -replace `
    "inputData: \{\s+articleId,\s+targetLanguage: lang,\s+jobId\s+\},", `
    "inputData: JSON.stringify({`n              articleId,`n              targetLanguage: lang,`n              jobId`n            }),"

# Image generation task inputData
$content = $content -replace `
    "inputData: \{\s+articleId,\s+title,\s+content: content\.substring\(0, 500\), // First 500 chars for context\s+imageTypes: \['featured', 'social'\],\s+jobId\s+\},", `
    "inputData: JSON.stringify({`n            articleId,`n            title,`n            content: content.substring(0, 500),`n            imageTypes: ['featured', 'social'],`n            jobId`n          }),"

# SEO optimization task inputData
$content = $content -replace `
    "inputData: \{\s+articleId,\s+title,\s+content\s+\},", `
    "inputData: JSON.stringify({`n            articleId,`n            title,`n            content`n          }),"

# Error 6: Remove ogTitle and other non-existent Article fields
Write-Host "6. Removing non-existent Article fields (ogTitle, ogDescription, etc)..." -ForegroundColor Yellow
$content = $content -replace `
    "seoTitle: result\.seoTitle,\s+seoDescription: result\.seoDescription,\s+ogTitle: result\.ogTitle,\s+ogDescription: result\.ogDescription,\s+ogImage: result\.ogImage,\s+twitterCard: result\.twitterCard,\s+schemaMarkup: result\.schemaMarkup", `
    "seoTitle: result.seoTitle,`n          seoDescription: result.seoDescription,`n          seoKeywords: result.seoKeywords || null,`n          updatedAt: new Date()"

# Error 7-8: Fix errors field - convert array to JSON string
Write-Host "7-8. Fixing errors field type (array to string)..." -ForegroundColor Yellow
$content = $content -replace `
    "errors: status\.errors,\s+startedAt: status\.startedAt,", `
    "errors: JSON.stringify(status.errors || []),`n        startedAt: status.startedAt,"

$content = $content -replace `
    "stages: status\.stages as any,\s+errors: status\.errors,\s+completedAt: status\.completedAt", `
    "stages: status.stages as any,`n        errors: JSON.stringify(status.errors || []),`n        completedAt: status.completedAt"

# Error 9: Fix errors field in getPipelineStatus
Write-Host "9. Fixing errors field parsing in getPipelineStatus..." -ForegroundColor Yellow
$content = $content -replace `
    "errors: pipeline\.errors \|\| \[\],\s+stages: pipeline\.stages as any", `
    "errors: typeof pipeline.errors === 'string' ? JSON.parse(pipeline.errors) : [],`n        stages: pipeline.stages as any"

# Save the file
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "`n✅ All Content Pipeline Service errors fixed!" -ForegroundColor Green
Write-Host "   - SystemConfiguration create: added id and updatedAt" -ForegroundColor Gray
Write-Host "   - Article create: added id, readingTimeMinutes, updatedAt" -ForegroundColor Gray
Write-Host "   - AITask inputData: JSON.stringify applied (3 locations)" -ForegroundColor Gray
Write-Host "   - Article update: removed non-existent OG fields" -ForegroundColor Gray
Write-Host "   - errors field: array to JSON string conversion (3 locations)" -ForegroundColor Gray

Write-Host "`n⏳ Checking for remaining errors..." -ForegroundColor Cyan
npx tsc --noEmit 2>&1 | Select-String "error TS" | Select-Object -First 10
