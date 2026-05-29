import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/authService';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

async function main() {
  console.log('Testing direct login for superadmin...');
  try {
    const result = await authService.login({
      email: 'admin@coindaily.africa',
      password: 'Admin@2024!',
    });
    console.log('Login succeeded! Result user:', result.user);
  } catch (error) {
    console.error('Login failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
