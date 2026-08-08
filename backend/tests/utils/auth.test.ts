import jwt from 'jsonwebtoken';
import {
  generateJWT,
  generateRefreshToken,
  verifyJWT,
  verifyRefreshToken,
  generateRandomToken,
  generateResetToken,
  hashToken,
  decodeJWT,
  isTokenExpired
} from '../../src/utils/auth';

describe('Auth Utilities', () => {
  const testPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
    subscriptionTier: 'FREE'
  };

  describe('JWT Access Token Generation and Verification', () => {
    it('should generate a valid JWT and successfully verify it', () => {
      const token = generateJWT(testPayload);
      expect(typeof token).toBe('string');

      const decoded = verifyJWT(token);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.username).toBe(testPayload.username);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.subscriptionTier).toBe(testPayload.subscriptionTier);
      expect(decoded.iss).toBe('sygn-api');
      expect(decoded.aud).toBe('sygn-app');
    });

    it('should throw an error for a token with an invalid signature', () => {
      const token = generateJWT(testPayload);
      const invalidToken = token + 'manipulated';

      expect(() => {
        verifyJWT(invalidToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw an error for an expired token', () => {
      // Create a token that has already expired using standard jsonwebtoken
      const expiredToken = jwt.sign(
        testPayload,
        process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-prod',
        {
          expiresIn: '-10s',
          issuer: 'sygn-api',
          audience: 'sygn-app'
        }
      );

      expect(() => {
        verifyJWT(expiredToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw an error for a token with the wrong issuer', () => {
      const wrongIssuerToken = jwt.sign(
        testPayload,
        process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-prod',
        {
          expiresIn: '15m',
          issuer: 'wrong-issuer',
          audience: 'sygn-app'
        }
      );

      expect(() => {
        verifyJWT(wrongIssuerToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw an error for a token with the wrong audience', () => {
      const wrongAudienceToken = jwt.sign(
        testPayload,
        process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-prod',
        {
          expiresIn: '15m',
          issuer: 'sygn-api',
          audience: 'wrong-audience'
        }
      );

      expect(() => {
        verifyJWT(wrongAudienceToken);
      }).toThrow('Invalid or expired token');
    });
  });

  describe('JWT Refresh Token Generation and Verification', () => {
    it('should generate a valid refresh token and successfully verify it', () => {
      const token = generateRefreshToken(testPayload.sub);
      expect(typeof token).toBe('string');

      const decoded = verifyRefreshToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.type).toBe('refresh');
      expect(decoded.iss).toBe('sygn-api');
      expect(decoded.aud).toBe('sygn-app');
    });

    it('should throw an error for an invalid refresh token', () => {
      const invalidToken = 'not.a.valid.jwt';
      expect(() => {
        verifyRefreshToken(invalidToken);
      }).toThrow('Invalid or expired refresh token');
    });
  });

  describe('Random Token Generators', () => {
    it('should generate random token of given length', () => {
      const token = generateRandomToken(16);
      expect(typeof token).toBe('string');
      // Hex representation uses 2 chars per byte
      expect(token).toHaveLength(32);
    });

    it('should generate random token of default length 32', () => {
      const token = generateRandomToken();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
    });

    it('should generate reset token with length 64', () => {
      const token = generateResetToken();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
    });
  });

  describe('hashToken', () => {
    it('should correctly hash a token using SHA256', async () => {
      const token = 'my-secret-token';
      const hash = await hashToken(token);
      expect(hash).toHaveLength(64);
      // SHA256 of 'my-secret-token'
      const expectedHash = 'ea5add57437cbf20af59034d7ed17968dcc56767b41965fcc5b376d45db8b4a3';
      expect(hash).toBe(expectedHash);
    });
  });

  describe('decodeJWT', () => {
    it('should decode a token payload without verifying signature', () => {
      const token = generateJWT(testPayload);
      const decoded = decodeJWT(token);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.email).toBe(testPayload.email);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for a token with a future expiry', () => {
      const token = generateJWT(testPayload);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for an expired token', () => {
      const expiredToken = jwt.sign(
        testPayload,
        process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-prod',
        {
          expiresIn: '-1s',
          issuer: 'sygn-api',
          audience: 'sygn-app'
        }
      );
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true if the token is completely invalid', () => {
      expect(isTokenExpired('not-a-token')).toBe(true);
    });

    it('should return true if the token does not have an expiration field', () => {
      const tokenNoExp = jwt.sign(
        { sub: 'user-123' },
        process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-prod'
      );
      expect(isTokenExpired(tokenNoExp)).toBe(true);
    });
  });
});
