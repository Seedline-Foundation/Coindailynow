import { NextRequest } from 'next/server';

export function checkAuth(request: NextRequest): boolean {
  // TODO: Implement proper JWT token validation
  // For now, just check for Bearer token presence
  const authHeader = request.headers.get('authorization');
  return !!(authHeader && authHeader.startsWith('Bearer '));
}

export function getAuthError() {
  return { error: 'Unauthorized' };
}