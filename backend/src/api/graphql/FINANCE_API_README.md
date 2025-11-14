# Finance GraphQL API Documentation

## Overview

The Finance GraphQL API provides comprehensive wallet and transaction management capabilities for the CoinDaily platform. It supports deposits, withdrawals, transfers, payments, refunds, staking, conversions, and gifts/donations.

## Table of Contents

- [Authentication](#authentication)
- [Deposit Operations](#deposit-operations)
- [Withdrawal Operations](#withdrawal-operations)
- [Transfer Operations](#transfer-operations)
- [Payment Operations](#payment-operations)
- [Refund Operations](#refund-operations)
- [Staking Operations](#staking-operations)
- [Conversion Operations](#conversion-operations)
- [Gift & Donation Operations](#gift--donation-operations)
- [Query Operations](#query-operations)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Authentication

All finance operations require authentication via JWT token in the request header:

```
Authorization: Bearer <your-jwt-token>
```

### Authorization Rules

- **Users** can only perform operations on their own wallets
- **Admins** can perform operations on any user's wallet
- **Super Admins** have full access to all operations

---

## Deposit Operations

### 1. Deposit from External Wallet

Deposit cryptocurrency from an external blockchain wallet.

**Mutation:**
```graphql
mutation DepositFromExternalWallet($input: DepositInput!) {
  depositFromExternalWallet(input: $input) {
    success
    transactionId
    error
    requiresOTP
    requiresApproval
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "walletId": "wallet-123",
    "amount": 100.0,
    "currency": "USD",
    "method": "CRYPTO",
    "externalReference": "0x1234...abcd",
    "metadata": {
      "blockchain": "Ethereum",
      "wallet": "MetaMask"
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "depositFromExternalWallet": {
      "success": true,
      "transactionId": "txn-123",
      "error": null,
      "requiresOTP": false,
      "requiresApproval": false
    }
  }
}
```

---

### 2. Deposit via Mobile Money

Deposit funds using African mobile money services (M-Pesa, Orange Money, MTN Money, EcoCash).

**Mutation:**
```graphql
mutation DepositViaMobileMoney($input: DepositInput!) {
  depositViaMobileMoney(input: $input) {
    success
    transactionId
    error
    requiresOTP
    requiresApproval
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "walletId": "wallet-123",
    "amount": 1000.0,
    "currency": "KES",
    "method": "MOBILE_MONEY",
    "externalReference": "MPESA-ABC123",
    "metadata": {
      "provider": "M-Pesa",
      "phoneNumber": "+254712345678"
    }
  }
}
```

**Supported Providers:**
- **M-Pesa** (Kenya, Tanzania, South Africa)
- **Orange Money** (Multiple African countries)
- **MTN Money** (Ghana, Uganda, Nigeria)
- **EcoCash** (Zimbabwe)

---

### 3. Deposit via Card

Deposit using credit/debit card via Stripe or PayPal.

**Mutation:**
```graphql
mutation DepositViaCard($input: DepositInput!) {
  depositViaCard(input: $input) {
    success
    transactionId
    error
    requiresOTP
    requiresApproval
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "walletId": "wallet-123",
    "amount": 50.0,
    "currency": "USD",
    "method": "CARD",
    "externalReference": "ch_stripe_123",
    "metadata": {
      "provider": "Stripe",
      "cardLast4": "4242",
      "cardBrand": "Visa"
    }
  }
}
```

---

### 4. Deposit via Bank Transfer

Deposit via direct bank transfer.

**Mutation:**
```graphql
mutation DepositViaBankTransfer($input: DepositInput!) {
  depositViaBankTransfer(input: $input) {
    success
    transactionId
    error
    requiresOTP
    requiresApproval
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "walletId": "wallet-123",
    "amount": 500.0,
    "currency": "ZAR",
    "method": "BANK_TRANSFER",
    "externalReference": "BANK-REF-123",
    "metadata": {
      "bankName": "Standard Bank",
      "accountNumber": "****1234",
      "referenceNumber": "REF123456"
    }
  }
}
```

---

## Query Operations

### Get Wallet

Retrieve wallet information by ID.

**Query:**
```graphql
query GetWallet($walletId: ID!) {
  getWallet(walletId: $walletId) {
    id
    userId
    walletType
    currency
    availableBalance
    lockedBalance
    stakedBalance
    totalBalance
    cePoints
    joyTokens
    status
    lastTransactionAt
    createdAt
    updatedAt
  }
}
```

---

### Get User Wallets

Retrieve all wallets for a specific user.

**Query:**
```graphql
query GetUserWallets($userId: ID!) {
  getUserWallets(userId: $userId) {
    id
    walletType
    currency
    availableBalance
    totalBalance
    status
  }
}
```

---

### Get Wallet Transactions

Retrieve transaction history for a wallet.

**Query:**
```graphql
query GetWalletTransactions(
  $walletId: ID!
  $limit: Int
  $offset: Int
  $status: TransactionStatus
) {
  getWalletTransactions(
    walletId: $walletId
    limit: $limit
    offset: $offset
    status: $status
  ) {
    id
    transactionHash
    transactionType
    operationType
    amount
    currency
    netAmount
    fee
    status
    paymentMethod
    externalReference
    purpose
    createdAt
  }
}
```

**Variables:**
```json
{
  "walletId": "wallet-123",
  "limit": 20,
  "offset": 0,
  "status": "COMPLETED"
}
```

---

### Get Transaction by ID

Retrieve specific transaction details.

**Query:**
```graphql
query GetTransaction($transactionId: ID!) {
  getTransaction(transactionId: $transactionId) {
    id
    transactionHash
    transactionType
    operationType
    fromWalletId
    toWalletId
    amount
    currency
    netAmount
    fee
    status
    paymentMethod
    externalReference
    purpose
    metadata
    createdAt
    updatedAt
  }
}
```

---

## Error Handling

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `UNAUTHENTICATED` | No valid authentication token | Login and provide valid JWT token |
| `FORBIDDEN` | Insufficient permissions | Check user role and permissions |
| `NOT_FOUND` | Wallet or transaction not found | Verify ID is correct |
| `INTERNAL_SERVER_ERROR` | Server error occurred | Retry or contact support |

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

---

## Examples

### Complete Deposit Flow

```graphql
# 1. Get user's wallets
query {
  getUserWallets(userId: "user-123") {
    id
    currency
    availableBalance
  }
}

# 2. Perform deposit
mutation {
  depositViaMobileMoney(input: {
    userId: "user-123"
    walletId: "wallet-123"
    amount: 1000
    currency: "KES"
    method: "MOBILE_MONEY"
    externalReference: "MPESA-ABC123"
    metadata: {
      provider: "M-Pesa"
      phoneNumber: "+254712345678"
    }
  }) {
    success
    transactionId
    error
  }
}

# 3. Check transaction status
query {
  getTransaction(transactionId: "txn-123") {
    status
    amount
    createdAt
  }
}

# 4. Verify updated balance
query {
  getWallet(walletId: "wallet-123") {
    availableBalance
    totalBalance
  }
}
```

---

## Best Practices

### 1. Amount Validation
- Always validate amounts are positive and within limits
- Handle decimal precision correctly for different currencies
- Check for minimum and maximum transaction amounts

### 2. Transaction Status Monitoring
- Poll transaction status for pending operations
- Implement webhooks for real-time updates
- Handle failed transactions gracefully

### 3. Security
- Always use HTTPS for API requests
- Store JWT tokens securely
- Implement rate limiting for deposit operations
- Use OTP verification for large amounts

### 4. Error Handling
- Implement retry logic for transient failures
- Show user-friendly error messages
- Log errors for debugging

### 5. Metadata Usage
- Include relevant metadata for audit trails
- Store external references for reconciliation
- Add context for customer support

---

## Rate Limits

| Operation | Rate Limit | Window |
|-----------|------------|--------|
| Deposits | 10 per hour | Per user |
| Withdrawals | 5 per hour | Per user |
| Transfers | 20 per hour | Per user |
| Queries | 100 per minute | Per user |

---

## Support

For issues or questions:
- **Documentation**: See main project README
- **Technical Support**: Open GitHub issue
- **Security Issues**: Contact security team directly

---

## Changelog

### Version 1.0.0 (2025-10-21)
- ✅ Initial release
- ✅ Deposit operations (4 types)
- ✅ Withdrawal operations (3 types)
- ✅ Transfer operations (6 types)
- ✅ Payment operations (5 types)
- ✅ Refund operations (4 types)
- ✅ Staking operations (3 types)
- ✅ Conversion operations (3 types)
- ✅ Gift/Donation operations (3 types)
- ✅ Query operations
- ✅ Authentication and authorization
- ✅ Comprehensive error handling
