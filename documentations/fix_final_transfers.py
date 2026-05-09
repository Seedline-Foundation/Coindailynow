import re

print("🔧 Fixing all remaining transfer operations...")

with open('backend/src/services/FinanceService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Count occurrences before fixes
before_errors = content.count('transactionType: TransactionType.TRANSFER,\n          amount,\n          currency,\n          status:')
print(f"Found {before_errors} unfixed transaction creates")

# Fix ALL remaining TRANSFER creates - match multiple patterns
fixes = [
    # Pattern: COMPLETED with performedBy metadata
    (
        r'(const transaction = await prisma\.walletTransaction\.create\(\{\s+data: \{\s+fromWalletId,\s+toWalletId,\s+transactionType: TransactionType\.TRANSFER,\s+)amount,\s+currency,\s+status: TransactionStatus\.COMPLETED,\s+description: ([^,]+),\s+metadata: JSON\.stringify\(\{ performedBy: fromUserId \}\),',
        r'\1transactionHash: this.generateTransactionHash(),\n          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_ADMIN_TO_USER,\n          netAmount: amount,\n          purpose: \'Admin Transfer\',\n          amount,\n          currency,\n          status: TransactionStatus.COMPLETED,\n          description: \2,\n          metadata: JSON.stringify({ performedBy: fromUserId }),',
        'Admin Transfer (COMPLETED)'
    ),
    # Pattern: PENDING with description metadata
    (
        r'(const transaction = await prisma\.walletTransaction\.create\(\{\s+data: \{\s+fromWalletId,\s+toWalletId,\s+transactionType: TransactionType\.TRANSFER,\s+)amount,\s+currency,\s+status: TransactionStatus\.PENDING,\s+description: ([^,]+),\s+metadata: JSON\.stringify\(\{ from: fromUserId, to: toUserId \}\),',
        r'\1transactionHash: this.generateTransactionHash(),\n          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_USER,\n          netAmount: amount,\n          purpose: \'User Transfer\',\n          amount,\n          currency,\n          status: TransactionStatus.PENDING,\n          description: \2,\n          metadata: JSON.stringify({ from: fromUserId, to: toUserId }),',
        'User Transfer (PENDING)'
    ),
    # Pattern: COMPLETED with from/to metadata
    (
        r'(const transaction = await prisma\.walletTransaction\.create\(\{\s+data: \{\s+fromWalletId,\s+toWalletId,\s+transactionType: TransactionType\.TRANSFER,\s+)amount,\s+currency,\s+status: TransactionStatus\.COMPLETED,\s+description: ([^,]+),\s+metadata: JSON\.stringify\(\{ from: fromUserId, to: toUserId \}\),',
        r'\1transactionHash: this.generateTransactionHash(),\n          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_USER,\n          netAmount: amount,\n          purpose: \'User Transfer\',\n          amount,\n          currency,\n          status: TransactionStatus.COMPLETED,\n          description: \2,\n          metadata: JSON.stringify({ from: fromUserId, to: toUserId }),',
        'User Transfer (COMPLETED)'
    ),
    # Pattern: Bulk transfer inside loop
    (
        r'(const transaction = await prisma\.walletTransaction\.create\(\{\s+data: \{\s+fromWalletId: transfer\.fromWalletId,\s+toWalletId: transfer\.toWalletId,\s+transactionType: TransactionType\.TRANSFER,\s+)amount: transfer\.amount,\s+currency: transfer\.currency,\s+status: TransactionStatus\.COMPLETED,\s+description: ([^,]+),\s+metadata: JSON\.stringify\(transfer\.metadata \|\| \{\}\),',
        r'\1transactionHash: this.generateTransactionHash(),\n            operationType: ALL_FINANCE_OPERATIONS.BULK_TRANSFER,\n            netAmount: transfer.amount,\n            purpose: \'Bulk Transfer\',\n            amount: transfer.amount,\n            currency: transfer.currency,\n            status: TransactionStatus.COMPLETED,\n            description: \2,\n            metadata: JSON.stringify(transfer.metadata || {}),',
        'Bulk Transfer'
    ),
]

for pattern, replacement, name in fixes:
    matches = len(re.findall(pattern, content))
    if matches > 0:
        content = re.sub(pattern, replacement, content)
        print(f"✅ Fixed {matches}x {name}")
    else:
        print(f"⚠️  Pattern not found for {name}")

# Remove amount from remaining logFinanceOperation calls
content = re.sub(r'\s+amount,\s+transactionId:', '        transactionId:', content)
print("✅ Cleaned up logFinanceOperation calls")

with open('backend/src/services/FinanceService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✨ All transaction creates should now be fixed!")
print("📊 Verify with: get_errors")
