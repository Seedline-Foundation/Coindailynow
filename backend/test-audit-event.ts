import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuditEvent() {
  try {
    // Test creating an audit event
    const auditEvent = await prisma.auditEvent.create({
      data: {
        type: 'authentication',
        action: 'login',
        userId: 'test-user',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }
    });
    
    console.log('✅ AuditEvent created:', auditEvent.id);
    
    // Test querying audit events
    const events = await prisma.auditEvent.findMany({
      where: { userId: 'test-user' }
    });
    
    console.log('✅ AuditEvent query successful, found:', events.length);
    
    // Clean up
    await prisma.auditEvent.deleteMany({ where: { userId: 'test-user' } });
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuditEvent();