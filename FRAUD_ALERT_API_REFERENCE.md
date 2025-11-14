# Admin Fraud Alert API - Quick Reference

## Authentication
All endpoints require:
- **Header**: `Authorization: Bearer <admin_token>`
- **Role**: `ADMIN`

---

## Endpoints

### 1. Get All Fraud Alerts
```http
GET /api/admin/fraud-alerts
```

**Query Parameters**:
- `severity` (optional): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `ALL`
- `resolved` (optional): `RESOLVED`, `UNRESOLVED`, `ALL`
- `alertType` (optional): Alert type name or `ALL`
- `page` (optional): Page number (default: `1`)
- `limit` (optional): Results per page (default: `50`)

**Response**:
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert-id",
      "walletId": "wallet-id",
      "userId": "user-id",
      "alertType": "RAPID_TRANSACTION",
      "severity": "CRITICAL",
      "fraudScore": 92.5,
      "description": "Suspicious rapid transaction pattern detected",
      "evidence": {
        "transactionIds": ["tx1", "tx2"],
        "ipAddresses": ["192.168.1.1"],
        "locations": ["Nigeria", "Kenya"],
        "amounts": [1000, 2000],
        "timestamps": ["2025-10-30T00:00:00Z"]
      },
      "autoFrozen": true,
      "resolved": false,
      "createdAt": "2025-10-30T00:00:00Z",
      "user": {
        "email": "user@example.com",
        "username": "testuser"
      },
      "wallet": {
        "walletAddress": "0x1234...",
        "status": "FROZEN"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

### 2. Get Fraud Statistics
```http
GET /api/admin/fraud-alerts/stats
```

**Response**:
```json
{
  "success": true,
  "totalAlerts": 150,
  "criticalAlerts": 25,
  "resolvedAlerts": 100,
  "walletsAutoFrozen": 15,
  "averageFraudScore": 45.7,
  "alertsByType": {
    "RAPID_TRANSACTION": 30,
    "LARGE_WITHDRAWAL": 20,
    "VELOCITY_PATTERN": 15,
    "GEOGRAPHIC_ANOMALY": 25,
    "TIME_BASED_ANOMALY": 10,
    "ROUND_AMOUNT": 20,
    "WHITELIST_CHANGE": 15,
    "DORMANT_ACCOUNT": 15
  },
  "alertsBySeverity": {
    "LOW": 50,
    "MEDIUM": 50,
    "HIGH": 25,
    "CRITICAL": 25
  }
}
```

---

### 3. Real-Time Alert Stream (SSE)
```http
GET /api/admin/fraud-alerts/stream
```

**Response** (Server-Sent Events):
```
data: {"type":"connected"}

data: {"id":"alert-id","walletId":"...","severity":"CRITICAL",...}

data: {"id":"alert-id-2","walletId":"...","severity":"HIGH",...}
```

**Frontend Usage**:
```typescript
const eventSource = new EventSource('/api/admin/fraud-alerts/stream');

eventSource.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  console.log('New fraud alert:', alert);
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
};
```

---

### 4. Get Specific Alert
```http
GET /api/admin/fraud-alerts/:id
```

**Response**:
```json
{
  "success": true,
  "alert": {
    "id": "alert-id",
    "walletId": "wallet-id",
    "userId": "user-id",
    "alertType": "RAPID_TRANSACTION",
    "severity": "CRITICAL",
    "fraudScore": 92.5,
    "description": "Suspicious rapid transaction pattern detected",
    "evidence": { /* full evidence object */ },
    "autoFrozen": true,
    "resolved": false,
    "resolvedBy": null,
    "resolvedAt": null,
    "resolution": null,
    "createdAt": "2025-10-30T00:00:00Z",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "testuser"
    },
    "wallet": {
      "id": "wallet-id",
      "walletAddress": "0x1234...",
      "status": "FROZEN",
      "balance": 5000
    }
  }
}
```

---

### 5. Resolve Fraud Alert
```http
POST /api/admin/fraud-alerts/:id/resolve
```

**Request Body**:
```json
{
  "resolution": "Investigated and confirmed false positive. User was traveling."
}
```

**Response**:
```json
{
  "success": true,
  "alert": {
    "id": "alert-id",
    "resolved": true,
    "resolvedBy": "admin-user-id",
    "resolvedAt": "2025-10-30T12:00:00Z",
    "resolution": "Investigated and confirmed false positive. User was traveling."
  }
}
```

---

### 6. Freeze Wallet
```http
POST /api/admin/wallets/:walletId/freeze
```

**Request Body**:
```json
{
  "reason": "Manual freeze due to suspicious activity detected in admin review"
}
```

**Response**:
```json
{
  "success": true,
  "wallet": {
    "id": "wallet-id",
    "walletAddress": "0x1234...",
    "status": "FROZEN",
    "freezeReason": "Manual freeze due to suspicious activity detected in admin review"
  }
}
```

---

### 7. Unfreeze Wallet
```http
POST /api/admin/wallets/:walletId/unfreeze
```

**Response**:
```json
{
  "success": true,
  "wallet": {
    "id": "wallet-id",
    "walletAddress": "0x1234...",
    "status": "ACTIVE",
    "freezeReason": null
  }
}
```

---

### 8. Export Alerts to CSV
```http
GET /api/admin/fraud-alerts/export
```

**Response**: CSV file download
```csv
ID,Type,Severity,Fraud Score,User,Wallet,Auto-Frozen,Resolved,Created At
alert-1,RAPID_TRANSACTION,CRITICAL,92.5,testuser,0x1234...,true,false,2025-10-30T00:00:00Z
alert-2,LARGE_WITHDRAWAL,HIGH,65.0,testuser2,0x5678...,false,true,2025-10-30T01:00:00Z
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Fraud alert not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch fraud alerts",
  "message": "Detailed error message"
}
```

---

## Alert Types

1. **RAPID_TRANSACTION**: Multiple transactions within short timeframe
2. **LARGE_WITHDRAWAL**: Withdrawal exceeds behavioral threshold
3. **VELOCITY_PATTERN**: Unusual transaction frequency (3+ in 10 min)
4. **GEOGRAPHIC_ANOMALY**: IP location changes across countries
5. **TIME_BASED_ANOMALY**: Transactions during unusual hours
6. **ROUND_AMOUNT**: Suspicious round-number transactions
7. **WHITELIST_CHANGE**: Frequent whitelist modifications (>3/year)
8. **DORMANT_ACCOUNT**: Sudden activity after 30+ days dormancy

---

## Severity Levels

- **LOW** (0-25): Informational, no immediate action required
- **MEDIUM** (26-50): Review recommended
- **HIGH** (51-75): Manual investigation required
- **CRITICAL** (76-100): Auto-freeze triggered at ≥85

---

## Redis Pub/Sub Events

### Subscribe to fraud alerts:
```typescript
const subscriber = redisClient.duplicate();
await subscriber.connect();

await subscriber.subscribe('fraud:alerts', (message) => {
  const alert = JSON.parse(message);
  console.log('New fraud alert:', alert);
});
```

### Subscribe to wallet status changes:
```typescript
await subscriber.subscribe('wallet:status', (message) => {
  const event = JSON.parse(message);
  console.log('Wallet status change:', event);
  // event.type: 'WALLET_FROZEN' | 'WALLET_UNFROZEN'
  // event.walletId: string
  // event.reason?: string
  // event.timestamp: Date
});
```

---

## Testing with cURL

### Get all alerts:
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3001/api/admin/fraud-alerts
```

### Resolve alert:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resolution":"False positive - user verified"}' \
  http://localhost:3001/api/admin/fraud-alerts/ALERT_ID/resolve
```

### Freeze wallet:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Suspected fraud"}' \
  http://localhost:3001/api/admin/wallets/WALLET_ID/freeze
```

---

## Frontend Integration Example

```typescript
// Fetch alerts with filtering
const fetchAlerts = async (filters: {
  severity?: string;
  resolved?: string;
  page?: number;
}) => {
  const params = new URLSearchParams({
    severity: filters.severity || 'ALL',
    resolved: filters.resolved || 'ALL',
    page: (filters.page || 1).toString(),
  });

  const response = await fetch(
    `/api/admin/fraud-alerts?${params}`,
    {
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
      },
    }
  );

  return response.json();
};

// Subscribe to real-time alerts
const subscribeToAlerts = () => {
  const eventSource = new EventSource('/api/admin/fraud-alerts/stream');
  
  eventSource.onmessage = (event) => {
    const alert = JSON.parse(event.data);
    if (alert.type === 'connected') return;
    
    // Update UI with new alert
    addAlertToList(alert);
    showNotification(`New ${alert.severity} fraud alert`);
  };
  
  return eventSource;
};

// Resolve alert
const resolveAlert = async (alertId: string, resolution: string) => {
  const response = await fetch(
    `/api/admin/fraud-alerts/${alertId}/resolve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify({ resolution }),
    }
  );

  return response.json();
};
```

---

**Last Updated**: 2025-10-30  
**API Version**: 1.0.0
