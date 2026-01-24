-- CreateTable
CREATE TABLE "email_subscribers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "resendContactId" TEXT,
    "resendAudienceId" TEXT,
    "subscribedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribedAt" DATETIME,
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- CreateTable
CREATE TABLE "scheduled_emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "emailSequence" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resendEmailId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scheduled_emails_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "email_subscribers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT NOT NULL,
    "scheduledEmailId" TEXT,
    "eventType" TEXT NOT NULL,
    "resendEmailId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "email_events_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "email_subscribers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_events_scheduledEmailId_fkey" FOREIGN KEY ("scheduledEmailId") REFERENCES "scheduled_emails" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "email_subscribers_email_key" ON "email_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscribers_verificationToken_key" ON "email_subscribers"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscribers_resendContactId_key" ON "email_subscribers"("resendContactId");

-- CreateIndex
CREATE INDEX "email_subscribers_email_idx" ON "email_subscribers"("email");

-- CreateIndex
CREATE INDEX "email_subscribers_verified_idx" ON "email_subscribers"("verified");

-- CreateIndex
CREATE INDEX "email_subscribers_verificationToken_idx" ON "email_subscribers"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_emails_resendEmailId_key" ON "scheduled_emails"("resendEmailId");

-- CreateIndex
CREATE INDEX "scheduled_emails_subscriberId_idx" ON "scheduled_emails"("subscriberId");

-- CreateIndex
CREATE INDEX "scheduled_emails_status_scheduledFor_idx" ON "scheduled_emails"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "scheduled_emails_emailType_idx" ON "scheduled_emails"("emailType");

-- CreateIndex
CREATE INDEX "email_events_subscriberId_idx" ON "email_events"("subscriberId");

-- CreateIndex
CREATE INDEX "email_events_eventType_idx" ON "email_events"("eventType");

-- CreateIndex
CREATE INDEX "email_events_resendEmailId_idx" ON "email_events"("resendEmailId");
