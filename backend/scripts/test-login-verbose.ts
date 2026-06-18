import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing verbose login flow...');
  try {
    console.log('1. Calling findUnique...');
    const user = await prisma.user.findUnique({ 
      where: { email: 'admin@sygn.live' },
      include: { Subscription: true }
    });
    console.log('2. User found:', !!user);
    
    if (user) {
      console.log('3. Comparing password...');
      const isPasswordValid = await bcrypt.compare('Admin@2024!', user.passwordHash);
      console.log('4. Password valid:', isPasswordValid);
      
      console.log('5. Signing JWT...');
      const token = jwt.sign(
        { sub: user.id, email: user.email, username: user.username }, 
        process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production_123456789'
      );
      console.log('6. Hashing refresh token...');
      const hashed = await bcrypt.hash('refreshtoken_val', 12);
      console.log('7. Creating refreshToken record...');
      
      const rt = await prisma.refreshToken.create({
        data: {
          id: 'test-rt-' + Date.now(),
          userId: user.id,
          token: 'refreshtoken_val',
          hashedToken: hashed,
          expiresAt: new Date(Date.now() + 60000)
        }
      });
      console.log('8. Refresh token record created:', rt.id);
      
      console.log('9. Hashing session token...');
      const sessHashed = await bcrypt.hash('session_token_val', 12);
      console.log('10. Creating session record...');
      const sess = await prisma.session.create({
        data: {
          id: 'test-sess-' + Date.now(),
          userId: user.id,
          sessionToken: 'session_token_val',
          hashedSessionToken: sessHashed,
          expiresAt: new Date(Date.now() + 60000),
          lastActivityAt: new Date()
        }
      });
      console.log('11. Session record created:', sess.id);
    }
  } catch (error) {
    console.error('Error during verbose login test:', error);
  } finally {
    // Cleanup created test records
    try {
      await prisma.refreshToken.deleteMany({ where: { id: { startsWith: 'test-rt-' } } });
      await prisma.session.deleteMany({ where: { id: { startsWith: 'test-sess-' } } });
      console.log('Cleanup successful');
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
    await prisma.$disconnect();
  }
}

main();
