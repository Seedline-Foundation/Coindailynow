# Fix FinanceService.ts properly - removes broken regex artifacts and fixes errors
Write-Host "🔧 Fixing FinanceService.ts syntax errors..." -ForegroundColor Cyan

$file = "c:\Users\onech\Desktop\news-platform\backend\src\services\FinanceService.ts"
$content = Get-Content $file -Raw

Write-Host "📝 Step 1: Removing broken regex artifacts..." -ForegroundColor Yellow

# Remove the broken `) )\n      });` artifacts
$content = $content -replace '\s*\}\s*\)\s*\)\s*\\n\s*\}\);', ' }'

# Fix metadata field closures that got broken
$content = $content -replace 'metadata:\s*\{\s*([^}]+)\s*\}\s*\)\s*\)\s*\\n\s*\}\);', 'metadata: { $1 }'

Write-Host "📝 Step 2: Fixing operation key names..." -ForegroundColor Yellow

# Fix operation key names (carefully)
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.DEPOSIT_EXTERNAL_WALLET', 'ALL_FINANCE_OPERATIONS.DEPOSIT_EXTERNAL'
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.WITHDRAW_EXTERNAL_WALLET', 'ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL'
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.WITHDRAW_MOBILE_MONEY', 'ALL_FINANCE_OPERATIONS.WITHDRAWAL_MOBILE_MONEY'
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.WITHDRAW_BANK', 'ALL_FINANCE_OPERATIONS.WITHDRAWAL_BANK'
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.TRANSFER_USER_TO_WE_WALLET', 'ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_WE'
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.TRANSFER_WE_WALLET_TO_USER', 'ALL_FINANCE_OPERATIONS.TRANSFER_WE_TO_USER'
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.TRANSFER_WE_WALLET_EXTERNAL', 'ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL'
$content = $content -replace 'ALL_FINANCE_OPERATIONS\.TRANSFER_BATCH', 'ALL_FINANCE_OPERATIONS.BULK_TRANSFER'

Write-Host "📝 Step 3: Fixing wallet type field..." -ForegroundColor Yellow

# Fix wallet type field
$content = $content -replace 'where:\s*\{\s*type:\s*WalletType\.WE_WALLET\s*\}', 'where: { walletType: WalletType.WE_WALLET }'

Write-Host "📝 Step 4: Fixing array access..." -ForegroundColor Yellow

# Fix array access with safety
$content = $content -replace 'transfers\[0\]\.currency', "transfers[0]?.currency || 'USD'"

Write-Host "📝 Step 5: Fixing metadata serialization..." -ForegroundColor Yellow

# Fix metadata to be JSON strings (but more carefully this time)
# Only fix simple metadata assignments, not complex ones
$content = $content -replace 'metadata:\s*metadata\s*\|\|\s*\{\}(\s*\n\s*\})', 'metadata: JSON.stringify(metadata || {})$1'

$content | Set-Content $file -NoNewline

Write-Host "✅ FinanceService.ts syntax fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Please review the file manually for any remaining issues" -ForegroundColor Yellow
