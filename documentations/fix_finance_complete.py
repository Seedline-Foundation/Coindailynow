import re

print("🔧 Fixing all remaining FinanceService errors...")

with open('backend/src/services/FinanceService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Bank Transfer Withdrawal  
bank_withdraw_pattern = r'''      const transaction = await prisma\.walletTransaction\.create\(\{
        data: \{
          fromWalletId: walletId,
          transactionType: TransactionType\.WITHDRAWAL,
          amount,
          currency,
          status: TransactionStatus\.PENDING,
          paymentMethod: PaymentMethod\.BANK_TRANSFER,
          externalReference: destinationAddress,
          metadata: JSON\.stringify\(metadata \|\| \{\}\),
        \},
      \}\);'''

bank_withdraw_replacement = '''      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          transactionType: TransactionType.WITHDRAWAL,
          transactionHash: this.generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.WITHDRAWAL_BANK,
          netAmount: amount,
          purpose: 'Bank Transfer Withdrawal',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          externalReference: destinationAddress,
          metadata: JSON.stringify(metadata || {}),
        },
      });'''

content = re.sub(bank_withdraw_pattern, bank_withdraw_replacement, content)
print("✅ Fixed Bank Withdrawal")

# Fix Internal Transfer PENDING
internal_transfer_pattern = r'''      const transaction = await prisma\.walletTransaction\.create\(\{
        data: \{
          fromWalletId,
          toWalletId,
          transactionType: TransactionType\.TRANSFER,
          amount,
          currency,
          status: TransactionStatus\.PENDING,
          description: description \|\| null,
          metadata: JSON\.stringify\(\{ description \}\),
        \},
      \}\);'''

internal_transfer_replacement = '''      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: this.generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_INTERNAL,
          netAmount: amount,
          purpose: 'Internal Transfer',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          description: description || null,
          metadata: JSON.stringify({ description }),
        },
      });'''

content = re.sub(internal_transfer_pattern, internal_transfer_replacement, content, count=1)
print("✅ Fixed Internal Transfer (PENDING)")

# Fix Admin Transfer COMPLETED
admin_transfer_pattern = r'''      const transaction = await prisma\.walletTransaction\.create\(\{
        data: \{
          fromWalletId,
          toWalletId,
          transactionType: TransactionType\.TRANSFER,
          amount,
          currency,
          status: TransactionStatus\.COMPLETED,
          description: description \|\| null,
          metadata: JSON\.stringify\(\{ performedBy: fromUserId \}\),
        \},
      \}\);'''

admin_transfer_replacement = '''      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: this.generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_ADMIN,
          netAmount: amount,
          purpose: 'Admin Transfer',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          description: description || null,
          metadata: JSON.stringify({ performedBy: fromUserId }),
        },
      });'''

content = re.sub(admin_transfer_pattern, admin_transfer_replacement, content, count=1)
print("✅ Fixed Admin Transfer (COMPLETED)")

# Fix User Transfer PENDING (second occurrence)
user_transfer_pending_pattern = r'''      const transaction = await prisma\.walletTransaction\.create\(\{
        data: \{
          fromWalletId,
          toWalletId,
          transactionType: TransactionType\.TRANSFER,
          amount,
          currency,
          status: TransactionStatus\.PENDING,
          description: description \|\| null,
          metadata: JSON\.stringify\(\{ from: fromUserId, to: toUserId \}\),
        \},
      \}\);'''

user_transfer_pending_replacement = '''      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: this.generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_USER,
          netAmount: amount,
          purpose: 'User-to-User Transfer',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          description: description || null,
          metadata: JSON.stringify({ from: fromUserId, to: toUserId }),
        },
      });'''

content = re.sub(user_transfer_pending_pattern, user_transfer_pending_replacement, content, count=1)
print("✅ Fixed User Transfer (PENDING)")

# Fix User Transfer COMPLETED
user_transfer_completed_pattern = r'''      const transaction = await prisma\.walletTransaction\.create\(\{
        data: \{
          fromWalletId,
          toWalletId,
          transactionType: TransactionType\.TRANSFER,
          amount,
          currency,
          status: TransactionStatus\.COMPLETED,
          description: description \|\| null,
          metadata: JSON\.stringify\(\{ from: fromUserId, to: toUserId \}\),
        \},
      \}\);'''

user_transfer_completed_replacement = '''      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: this.generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_USER,
          netAmount: amount,
          purpose: 'User Transfer',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          description: description || null,
          metadata: JSON.stringify({ from: fromUserId, to: toUserId }),
        },
      });'''

content = re.sub(user_transfer_completed_pattern, user_transfer_completed_replacement, content, count=1)
print("✅ Fixed User Transfer (COMPLETED)")

# Fix Bulk Transfer
bulk_transfer_pattern = r'''          const transaction = await prisma\.walletTransaction\.create\(\{
            data: \{
              fromWalletId: transfer\.fromWalletId,
              toWalletId: transfer\.toWalletId,
              transactionType: TransactionType\.TRANSFER,
              amount: transfer\.amount,
              currency: transfer\.currency,
              status: TransactionStatus\.COMPLETED,
              description: transfer\.description \|\| null,
              metadata: JSON\.stringify\(transfer\.metadata \|\| \{\}\),
            \},
          \}\);'''

bulk_transfer_replacement = '''          const transaction = await prisma.walletTransaction.create({
            data: {
              fromWalletId: transfer.fromWalletId,
              toWalletId: transfer.toWalletId,
              transactionType: TransactionType.TRANSFER,
              transactionHash: this.generateTransactionHash(),
              operationType: ALL_FINANCE_OPERATIONS.BULK_TRANSFER,
              netAmount: transfer.amount,
              purpose: 'Bulk Transfer',
              amount: transfer.amount,
              currency: transfer.currency,
              status: TransactionStatus.COMPLETED,
              description: transfer.description || null,
              metadata: JSON.stringify(transfer.metadata || {}),
            },
          });'''

content = re.sub(bulk_transfer_pattern, bulk_transfer_replacement, content, count=1)
print("✅ Fixed Bulk Transfer")

# Remove amount from logFinanceOperation calls
content = re.sub(r'\s+amount,\s+transactionId:', '        transactionId:', content)
print("✅ Removed amount from logFinanceOperation calls")

with open('backend/src/services/FinanceService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✨ All remaining FinanceService.ts errors should be fixed!")
print("📊 Run: npx tsc --noEmit to verify")
