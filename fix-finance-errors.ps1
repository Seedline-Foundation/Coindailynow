# Fix all FinanceService errors
# This script systematically fixes all TypeScript errors in FinanceService.ts

Write-Host "🔧 Starting FinanceService error fixes..." -ForegroundColor Cyan

# File path
$file = "c:\Users\onech\Desktop\news-platform\backend\src\services\FinanceService.ts"

# Read content
$content = Get-Content $file -Raw

Write-Host "📝 Fixing operation key name errors..." -ForegroundColor Yellow

# Fix operation key names
$content = $content -replace 'DEPOSIT_EXTERNAL_WALLET', 'DEPOSIT_EXTERNAL'
$content = $content -replace 'WITHDRAW_EXTERNAL_WALLET', 'WITHDRAWAL_EXTERNAL'
$content = $content -replace 'WITHDRAW_MOBILE_MONEY', 'WITHDRAWAL_MOBILE_MONEY'
$content = $content -replace 'WITHDRAW_BANK', 'WITHDRAWAL_BANK'
$content = $content -replace 'TRANSFER_USER_TO_WE_WALLET', 'TRANSFER_USER_TO_WE'
$content = $content -replace 'TRANSFER_WE_WALLET_TO_USER', 'TRANSFER_WE_TO_USER'
$content = $content -replace 'TRANSFER_WE_WALLET_EXTERNAL', 'WITHDRAWAL_EXTERNAL'
$content = $content -replace 'TRANSFER_BATCH', 'BULK_TRANSFER'

Write-Host "📝 Fixing metadata type errors..." -ForegroundColor Yellow

# Fix metadata serialization - convert objects to JSON strings
$content = $content -replace 'metadata:\s*metadata\s*\|\|\s*\{\}', 'metadata: JSON.stringify(metadata || {})'
$content = $content -replace 'metadata:\s*\{\s*\.\.\.metadata,', 'metadata: JSON.stringify({ ...metadata,'
$content = $content -replace '\}\s*\n\s*\}\);', ' }) )\n      });'

Write-Host "📝 Fixing wallet type field errors..." -ForegroundColor Yellow

# Fix wallet type field name
$content = $content -replace 'where:\s*\{\s*type:\s*WalletType\.WE_WALLET\s*\}', 'where: { walletType: WalletType.WE_WALLET }'

Write-Host "📝 Fixing array access errors..." -ForegroundColor Yellow

# Fix array access with optional chaining
$content = $content -replace 'transfers\[0\]\.currency', "transfers[0]?.currency || 'USD'"

# Save content
$content | Set-Content $file -NoNewline

Write-Host "✅ FinanceService.ts errors fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next: Fix WalletService method calls..." -ForegroundColor Cyan
Write-Host "⚠️  Manual review required for WalletService API changes" -ForegroundColor Yellow
