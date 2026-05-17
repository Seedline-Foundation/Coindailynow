/**
 * Seed launch publishing queue: 30 day-1 articles + 14 daily slots.
 * Sets publishScheduledAt on APPROVED/DRAFT articles without a schedule.
 *
 * Usage: npx ts-node backend/scripts/seed-launch-queue.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const author = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'] } },
  });
  if (!author) {
    throw new Error('No admin author found — create an admin user first');
  }

  const category = await prisma.category.findFirst();
  if (!category) {
    throw new Error('No category found — seed categories first');
  }

  const launchStart = process.env.LAUNCH_DATE
    ? new Date(process.env.LAUNCH_DATE)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const dayOneCount = parseInt(process.env.LAUNCH_DAY_ONE_COUNT || '30', 10);
  const dailyCount = parseInt(process.env.LAUNCH_DAILY_COUNT || '14', 10);
  const total = dayOneCount + dailyCount;

  const existing = await prisma.article.count({
    where: { publishScheduledAt: { not: null }, status: { in: ['APPROVED', 'DRAFT'] } },
  });

  if (existing >= total) {
    console.log(`Already have ${existing} scheduled articles (target ${total}). Skipping.`);
    return;
  }

  const toCreate = total - existing;
  const now = new Date();

  for (let i = 0; i < toCreate; i++) {
    let scheduledAt: Date;
    if (i < dayOneCount) {
      scheduledAt = new Date(launchStart.getTime() + (i % 24) * 60 * 60 * 1000);
    } else {
      const dayOffset = Math.floor((i - dayOneCount) / 2) + 1;
      const hourSlot = (i - dayOneCount) % 2 === 0 ? 8 : 14;
      scheduledAt = new Date(launchStart);
      scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
      scheduledAt.setHours(hourSlot, 0, 0, 0);
    }

    const slug = `launch-queue-${Date.now()}-${i}`;
    await prisma.article.create({
      data: {
        id: randomUUID(),
        title: `Launch queue slot ${i + 1}`,
        slug,
        excerpt: 'Scheduled for launch — replace with final copy.',
        content: '<p>Placeholder launch article. Replace before publish.</p>',
        authorId: author.id,
        categoryId: category.id,
        status: 'APPROVED',
        readingTimeMinutes: 3,
        publishScheduledAt: scheduledAt,
        aiGenerated: true,
        updatedAt: now,
      },
    });
  }

  console.log(`✅ Seeded ${toCreate} launch queue articles (${dayOneCount} day-1 + ${dailyCount} daily pattern).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
