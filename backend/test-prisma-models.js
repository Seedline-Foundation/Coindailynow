const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const models = Object.keys(prisma).filter(k => 
  !k.startsWith('_') && 
  !k.startsWith('$')
);

console.log('Available Prisma Models:');
console.log(models.sort().join('\n'));

// Check for social media models
const socialMediaModels = models.filter(m => 
  m.toLowerCase().includes('social') || 
  m.toLowerCase().includes('community') ||
  m.toLowerCase().includes('influencer') ||
  m.toLowerCase().includes('engagement') ||
  m.toLowerCase().includes('automation')
);

console.log('\nSocial Media Related Models:');
console.log(socialMediaModels.join('\n'));

prisma.$disconnect();
