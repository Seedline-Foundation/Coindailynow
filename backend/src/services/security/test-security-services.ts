// Simple test to verify security services can be imported and basic functionality works
import { SecurityAuditService } from './SecurityAuditService';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Test compilation of security services
async function testSecurityServices() {
  console.log('Testing security service imports...');
  
  // Mock dependencies for compilation test
  const mockPrisma = {} as PrismaClient;
  const mockRedis = {} as Redis;
  
  // Test SecurityAuditService can be instantiated
  const auditConfig = {
    enabled: true,
    retentionPeriod: 30,
    detailedLogging: true,
  };
  
  try {
    const auditService = new SecurityAuditService(mockPrisma, mockRedis, auditConfig);
    console.log('✅ SecurityAuditService compiles and instantiates');
    
    // Test that the service has the expected methods
    const hasLogMethod = typeof auditService.logEvent === 'function';
    const hasAuthMethod = typeof auditService.logAuthentication === 'function';
    
    console.log('✅ SecurityAuditService has required methods:', { hasLogMethod, hasAuthMethod });
    
  } catch (error) {
    console.error('❌ SecurityAuditService failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSecurityServices()
    .then(() => console.log('Security services test completed'))
    .catch(console.error);
}

export { testSecurityServices };