/**
 * Seed Super Admin User
 * Creates initial super admin account for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  try {
    console.log('🌱 Seeding Super Admin user...');

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ Super Admin already exists:', existingAdmin.email);
      return;
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash('Admin@2024!', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        id: 'super_admin_001',
        email: 'admin@coindaily.africa',
        username: 'superadmin',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Administrator',
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false, // Set to true if you want to enable 2FA
        status: 'ACTIVE',
        subscriptionTier: 'PREMIUM',
        preferredLanguage: 'en',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Username:', superAdmin.username);
    console.log('🔐 Password: Admin@2024!');
    console.log('🔑 Role:', superAdmin.role);

    // Create some additional admin users for testing
    const contentAdmin = await prisma.user.create({
      data: {
        id: 'content_admin_001',
        email: 'content@coindaily.africa',
        username: 'contentadmin',
        passwordHash: await bcrypt.hash('Content@2024!', 10),
        role: 'CONTENT_ADMIN',
        firstName: 'Content',
        lastName: 'Administrator',
        emailVerified: true,
        status: 'ACTIVE',
        subscriptionTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const marketingAdmin = await prisma.user.create({
      data: {
        id: 'marketing_admin_001',
        email: 'marketing@coindaily.africa',
        username: 'marketingadmin',
        passwordHash: await bcrypt.hash('Marketing@2024!', 10),
        role: 'MARKETING_ADMIN',
        firstName: 'Marketing',
        lastName: 'Administrator',
        emailVerified: true,
        status: 'ACTIVE',
        subscriptionTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const techAdmin = await prisma.user.create({
      data: {
        id: 'tech_admin_001',
        email: 'tech@coindaily.africa',
        username: 'techadmin',
        passwordHash: await bcrypt.hash('Tech@2024!', 10),
        role: 'TECH_ADMIN',
        firstName: 'Tech',
        lastName: 'Administrator',
        emailVerified: true,
        status: 'ACTIVE',
        subscriptionTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('\n✅ Additional Admin Users Created:');
    console.log('📧 Content Admin:', contentAdmin.email, '- Password: Content@2024!');
    console.log('📧 Marketing Admin:', marketingAdmin.email, '- Password: Marketing@2024!');
    console.log('📧 Tech Admin:', techAdmin.email, '- Password: Tech@2024!');

    // Create initial audit log
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_init`,
        adminId: superAdmin.id,
        action: 'system_initialization',
        resource: 'system',
        details: JSON.stringify({
          message: 'Super Admin account created during system initialization',
          timestamp: new Date().toISOString()
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        status: 'success',
        timestamp: new Date()
      }
    });

    // Create default admin role templates
    await prisma.adminRole.createMany({
      data: [
        {
          id: 'role_super_admin',
          name: 'SUPER_ADMIN',
          displayName: 'Super Administrator',
          description: 'Full system access with all permissions',
          permissions: JSON.stringify({
            users: ['create', 'read', 'update', 'delete'],
            content: ['create', 'read', 'update', 'delete', 'publish'],
            admins: ['create', 'read', 'update', 'delete'],
            system: ['configure', 'monitor', 'backup'],
            analytics: ['view', 'export'],
            ai: ['configure', 'monitor', 'manage'],
            monetization: ['view', 'manage', 'configure'],
            security: ['view', 'configure', 'manage']
          }),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'role_content_admin',
          name: 'CONTENT_ADMIN',
          displayName: 'Content Administrator',
          description: 'Content management and moderation',
          permissions: JSON.stringify({
            content: ['create', 'read', 'update', 'delete', 'publish'],
            categories: ['create', 'read', 'update'],
            tags: ['create', 'read', 'update'],
            moderation: ['review', 'approve', 'reject']
          }),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'role_marketing_admin',
          name: 'MARKETING_ADMIN',
          displayName: 'Marketing Administrator',
          description: 'Marketing and distribution management',
          permissions: JSON.stringify({
            campaigns: ['create', 'read', 'update', 'delete'],
            email: ['create', 'send', 'view'],
            social: ['post', 'schedule', 'monitor'],
            analytics: ['view']
          }),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'role_tech_admin',
          name: 'TECH_ADMIN',
          displayName: 'Technical Administrator',
          description: 'Technical system management',
          permissions: JSON.stringify({
            system: ['monitor', 'configure'],
            api: ['view', 'configure'],
            database: ['view', 'backup'],
            security: ['view', 'monitor']
          }),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });

    console.log('\n✅ Admin role templates created');
    console.log('\n🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
