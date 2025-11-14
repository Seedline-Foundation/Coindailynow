# Quick Start Guide - Continue Build Fixes

## 🚀 Getting Started (Each Session)

```powershell
# Navigate to project
cd C:\Users\onech\Desktop\news-platform\backend

# Check current error count
npm run type-check 2>&1 > errors.txt
$errorCount = (Get-Content errors.txt | Select-String "error TS").Count
Write-Host "Current errors: $errorCount"

# View first 50 errors
Get-Content errors.txt | Select-String "error TS" | Select-Object -First 50
```

---

## 📋 Next Priority Tasks (In Order)

### Task 1: Fix Optional Type Issues (Est: 1-2 hours, ~20 errors)

**Pattern to Fix**:
```typescript
// ❌ BEFORE (causes error)
const where = {
  id: req.params.id  // string | undefined
};

// ✅ AFTER (fixed)
const where = req.params.id ? { id: req.params.id } : undefined;
// OR
const id = req.params.id;
if (!id) throw new Error('ID required');
const where = { id };
```

**Files to Fix** (in order):
1. `src/api/ai-images.ts` (line 198, 216)
2. `src/api/imageOptimization.routes.ts` (line 159)
3. `src/api/linkBuilding.routes.ts` (lines 44, 110, 177, 231, 302)
4. `src/api/raoPerformance.routes.ts` (lines 15, 48)
5. `src/api/legal-routes.ts` (line 13)

**Command to identify these**:
```powershell
npm run type-check 2>&1 | Select-String "Type.*undefined.*not assignable"
```

---

### Task 2: Fix User Model Test Mocks (Est: 2 hours, ~30 errors)

**Pattern to Fix**:
```typescript
// ❌ BEFORE
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashedpassword',  // ❌ Wrong field name
  // Missing: role, twoFactorSecret
};

// ✅ AFTER
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashedpassword',  // ✅ Correct field name
  role: 'USER' as UserRole,        // ✅ Added
  twoFactorSecret: null,            // ✅ Added
  firstName: null,
  lastName: null,
  avatarUrl: null,
  bio: null,
  location: null,
  website: null,
  emailVerified: false,
  subscriptionTier: 'FREE',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null
};
```

**Files to Fix**:
1. `tests/integration/ai-system/api-integration.test.ts` (lines 39, 50)
2. `tests/integration/ai-system/e2e-workflows.test.ts` (line 41)
3. `tests/integration/ai-system/performance.test.ts` (line 36)
4. `tests/services/contentRecommendationService.test.ts` (lines 267, 361, 458, 670, 741)
5. `tests/middleware/auth-simple.test.ts` (line 53)
6. `tests/middleware/auth.test.ts` (multiple locations)

---

### Task 3: Fix Prisma Model References (Est: 1 hour, ~15 errors)

**Pattern to Fix**:
```typescript
// ❌ BEFORE
await prisma.aiWorkflow.findMany()  // ❌ Wrong casing
await prisma.aiTask.findMany()      // ❌ Wrong casing

// ✅ AFTER  
await prisma.aIWorkflow.findMany()  // ✅ Prisma auto-generated name
await prisma.aITask.findMany()      // ✅ Prisma auto-generated name
```

**Files to Fix**:
1. `tests/integration/ai-system/e2e-workflows.test.ts`
2. `tests/integration/ai-system/performance.test.ts`

---

### Task 4: Add Missing Prisma Models (Est: 3-4 hours, ~60 errors)

**Missing Models** (check schema):
```prisma
// Add to prisma/schema.prisma
model ModerationQueue {
  id String @id @default(uuid())
  // ... fields
}

model AdminAction {
  id String @id @default(uuid())
  // ... fields
}

model AdminAlert {
  id String @id @default(uuid())
  // ... fields
}
```

**After adding**:
```powershell
npm run db:generate
npm run type-check
```

---

## 🛠️ Useful Commands

### Check Specific Error Types
```powershell
# Optional type errors
npm run type-check 2>&1 | Select-String "exactOptionalPropertyTypes"

# Missing property errors
npm run type-check 2>&1 | Select-String "does not exist on type"

# User model errors
npm run type-check 2>&1 | Select-String "password.*passwordHash"

# Prisma model errors
npm run type-check 2>&1 | Select-String "aiWorkflow|aiTask"
```

### Count Errors by File
```powershell
npm run type-check 2>&1 | Select-String "^src/" | Group-Object | Sort-Object Count -Descending
```

### Run Specific Tests
```powershell
# Auth tests
npm test -- tests/api/auth-resolvers.test.ts

# Integration tests
npm run test:integration

# Load tests
npm run test:load
```

---

## 📝 Before Committing

```powershell
# 1. Run type-check
npm run type-check

# 2. Run tests
npm test

# 3. Check build
npm run build

# 4. Update progress tracker
# Edit: BUILD_FIX_PROGRESS.md
```

---

## 🔍 Debugging Tips

### Find Error in File
```powershell
# Get all errors for specific file
npm run type-check 2>&1 | Select-String "src/api/ai-moderation.ts"
```

### Understand Error Context
```typescript
// Read the file around the error line
# In PowerShell:
Get-Content src/api/ai-moderation.ts | Select-Object -Index (196..206)
```

### Check Prisma Models Available
```powershell
# List all Prisma models
Get-Content node_modules/.prisma/client/index.d.ts | Select-String "^  get "
```

---

## 📚 Reference Links

- **Prisma Docs**: https://www.prisma.io/docs/
- **TypeScript strictNullChecks**: https://www.typescriptlang.org/tsconfig#strictNullChecks
- **Jest Mocking**: https://jestjs.io/docs/mock-functions

---

## ⚡ Quick Wins Strategy

1. **Start with files having fewest errors** (2-5 errors)
2. **Fix one pattern at a time** (e.g., all optional types)
3. **Run type-check after each file**
4. **Track progress** in BUILD_FIX_PROGRESS.md
5. **Commit frequently** with clear messages

---

## 🎯 Daily Goals

- **Day 1** (Today): ✅ Infrastructure + 7 errors fixed
- **Day 2**: 60 errors (quick wins: optional types + user mocks)
- **Day 3**: 80 errors (AI Moderation service)
- **Day 4**: 70 errors (SEO + Joy Token + GraphQL)
- **Days 5-10**: Remaining errors + cleanup

---

**Remember**: One fix at a time, test frequently, track progress! 🚀
