import { ROLE_RANK, hasMinimumRole, hasAnyRole, can, CAPABILITIES } from '../../src/lib/roles';

describe('roles hierarchy', () => {
  test('all editorial + admin roles have a rank', () => {
    for (const r of ['USER', 'CONTRIBUTOR', 'JOURNALIST', 'EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN'] as const) {
      expect(typeof ROLE_RANK[r]).toBe('number');
    }
  });

  test('SUPER_ADMIN ranks above CEO and ADMIN', () => {
    expect(ROLE_RANK.SUPER_ADMIN).toBeGreaterThan(ROLE_RANK.CEO);
    expect(ROLE_RANK.SUPER_ADMIN).toBeGreaterThan(ROLE_RANK.ADMIN);
  });

  describe('hasMinimumRole', () => {
    test('returns true when role ranks above the minimum', () => {
      expect(hasMinimumRole('JOURNALIST', 'CONTRIBUTOR')).toBe(true);
      expect(hasMinimumRole('SUPER_ADMIN', 'EDITOR')).toBe(true);
      expect(hasMinimumRole('CEO', 'JOURNALIST')).toBe(true);
    });

    test('returns true when role matches the minimum exactly', () => {
      expect(hasMinimumRole('USER', 'USER')).toBe(true);
      expect(hasMinimumRole('EDITOR', 'EDITOR')).toBe(true);
      expect(hasMinimumRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true);
    });

    test('returns false when role ranks below the minimum', () => {
      expect(hasMinimumRole('CONTRIBUTOR', 'JOURNALIST')).toBe(false);
      expect(hasMinimumRole('USER', 'SUPER_ADMIN')).toBe(false);
      expect(hasMinimumRole('EDITOR', 'CEO')).toBe(false);
    });

    test('returns false when role is an invalid string', () => {
      expect(hasMinimumRole('NOT_A_ROLE', 'USER')).toBe(false);
    });

    test('returns false when role is null or undefined', () => {
      expect(hasMinimumRole(null, 'USER')).toBe(false);
      expect(hasMinimumRole(undefined, 'USER')).toBe(false);
    });
  });

  test('hasAnyRole short-circuits on null/undefined', () => {
    expect(hasAnyRole(null, ['EDITOR'])).toBe(false);
    expect(hasAnyRole(undefined, ['EDITOR'])).toBe(false);
    expect(hasAnyRole('EDITOR', ['EDITOR'])).toBe(true);
  });

  describe('capabilities matrix', () => {
    test('CONTRIBUTOR cannot publish', () => {
      expect(can('CONTRIBUTOR', 'ARTICLE_PUBLISH')).toBe(false);
    });
    test('JOURNALIST can publish + push marquee', () => {
      expect(can('JOURNALIST', 'ARTICLE_PUBLISH')).toBe(true);
      expect(can('JOURNALIST', 'MARQUEE_PUSH')).toBe(true);
      expect(can('JOURNALIST', 'MARQUEE_MANAGE')).toBe(false);
    });
    test('EDITOR can manage marquee + approve', () => {
      expect(can('EDITOR', 'MARQUEE_MANAGE')).toBe(true);
      expect(can('EDITOR', 'ARTICLE_APPROVE')).toBe(true);
      expect(can('EDITOR', 'FINANCE_APPROVE')).toBe(false);
    });
    test('CEO can approve finance + read finance', () => {
      expect(can('CEO', 'FINANCE_APPROVE')).toBe(true);
      expect(can('CEO', 'FINANCE_READ')).toBe(true);
    });
    test('SUPER_ADMIN can manage IP whitelist', () => {
      expect(can('SUPER_ADMIN', 'IP_WHITELIST_MANAGE')).toBe(true);
      expect(can('EDITOR', 'IP_WHITELIST_MANAGE')).toBe(false);
    });
    test('every capability has at least one role', () => {
      for (const cap of Object.keys(CAPABILITIES)) {
        expect(((CAPABILITIES as any)[cap] as any[]).length).toBeGreaterThan(0);
      }
    });
  });
});
