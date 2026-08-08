import { generateJWT, verifyJWT, decodeJWT } from '../../src/utils/auth';
import jwt from 'jsonwebtoken';

describe('auth util - generateJWT', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    // Note: Since JWT_SECRET is loaded statically at the top of backend/src/utils/auth.ts,
    // altering process.env.JWT_SECRET inside tests doesn't dynamically change JWT_SECRET in auth.ts.
    // Instead, getJwtSecret() returns JWT_SECRET (statically evaluated from process.env.JWT_SECRET when imported)
    // or DEV_SECRET if it was not set when imported.
    // To allow dynamic secret changing in tests, we can mock or work around it,
    // or simply verify that verifyJWT fails on a malformed signature.
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('should generate a valid JWT given a payload with id and role', () => {
    const payload = {
      id: 'test-user-id-abc-123',
      role: 'ADMIN',
    };

    // Note: The issue states the input payload type is:
    // { id: string; role: string; }
    // However, the actual function signature in backend/src/utils/auth.ts is:
    // { sub: string; email: string; username: string; role?: string; subscriptionTier?: string; [key: string]: any; }
    // Let's assert compatibility with both or cast it.
    const token = generateJWT(payload as any);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    // Verify token can be decoded without signature check
    const decoded = decodeJWT(token);
    expect(decoded).toBeDefined();
    expect(decoded).toMatchObject(payload);

    // Verify standard claims
    expect(decoded.iss).toBe('sygn-api');
    expect(decoded.aud).toBe('sygn-app');
    expect(decoded.exp).toBeDefined();

    // Verify token can be verified with standard verification method
    const verified = verifyJWT(token);
    expect(verified).toBeDefined();
    expect(verified).toMatchObject(payload);
  });

  it('should throw an error during verification if token is invalid or tampered with', () => {
    const payload = {
      id: 'test-user-id-abc-123',
      role: 'USER',
    };

    const token = generateJWT(payload as any);
    const tamperedToken = token + 'tampered';

    expect(() => verifyJWT(tamperedToken)).toThrow('Invalid or expired token');
  });
});
