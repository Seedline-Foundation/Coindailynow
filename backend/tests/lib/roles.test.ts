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

  test('hasMinimumRole respects ordering', () => {
    expect(hasMinimumRole('JOURNALIST', 'CONTRIBUTOR')).toBe(true);
    expect(hasMinimumRole('CONTRIBUTOR', 'JOURNALIST')).toBe(false);
    expect(hasMinimumRole('SUPER_ADMIN', 'EDITOR')).toBe(true);
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
