import { NextRequest } from 'next/server';
import { checkAuth, getAuthError } from '../auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Mock NextRequest to be safe across environments where global Request/NextRequest might not be fully instantiated in JSDOM
function createMockRequest(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
    },
  } as unknown as NextRequest;
}

describe('checkAuth and getAuthError', () => {
  it('should return false if authorization header is missing', () => {
    const req = createMockRequest({});
    expect(checkAuth(req)).toBe(false);
  });

  it('should return false if authorization header does not start with Bearer ', () => {
    const req = createMockRequest({ authorization: 'Basic abc' });
    expect(checkAuth(req)).toBe(false);
  });

  it('should return false if token is malformed or invalid signature', () => {
    const req = createMockRequest({ authorization: 'Bearer invalid-token-here' });
    expect(checkAuth(req)).toBe(false);
  });

  it('should return false if token has correct signature but lacks sub/id claims', () => {
    const token = jwt.sign({ email: 'user@sygn.live' }, JWT_SECRET);
    const req = createMockRequest({ authorization: `Bearer ${token}` });
    expect(checkAuth(req)).toBe(false);
  });

  it('should return true if token is valid with sub claim', () => {
    const token = jwt.sign({ sub: 'user_123', email: 'user@sygn.live' }, JWT_SECRET);
    const req = createMockRequest({ authorization: `Bearer ${token}` });
    expect(checkAuth(req)).toBe(true);
  });

  it('should return true if token is valid with id claim', () => {
    const token = jwt.sign({ id: 'user_123', email: 'user@sygn.live' }, JWT_SECRET);
    const req = createMockRequest({ authorization: `Bearer ${token}` });
    expect(checkAuth(req)).toBe(true);
  });

  it('should return false if token is expired', () => {
    const token = jwt.sign(
      { sub: 'user_123', email: 'user@sygn.live' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = createMockRequest({ authorization: `Bearer ${token}` });
    expect(checkAuth(req)).toBe(false);
  });

  it('should return false if token is signed with a different secret', () => {
    const token = jwt.sign({ sub: 'user_123' }, 'wrong-secret');
    const req = createMockRequest({ authorization: `Bearer ${token}` });
    expect(checkAuth(req)).toBe(false);
  });

  it('should return correct auth error structure', () => {
    expect(getAuthError()).toEqual({ error: 'Unauthorized' });
  });
});
