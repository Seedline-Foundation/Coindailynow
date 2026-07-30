import { verifyAndPersist, verifyInfluencer, SocialHandleInput } from '../../src/services/influencerVerificationService';

describe('influencerVerificationService', () => {
  const mockHandles: SocialHandleInput[] = [
    {
      platform: 'youtube',
      handle: 'test_yt',
      profileUrl: 'https://youtube.com/test_yt',
      followers: 50_000,
      avgViews: 120_000,
      watchHours: 6_000,
      engagementRate: 5.2,
    },
    {
      platform: 'tiktok',
      handle: 'test_tt',
      profileUrl: 'https://tiktok.com/@test_tt',
      followers: 30_000,
      avgViews: 150_000,
      watchHours: 0,
      engagementRate: 4.8,
    }
  ];

  describe('verifyInfluencer', () => {
    it('should correctly score and qualify a valid influencer', () => {
      const report = verifyInfluencer(mockHandles);
      expect(report.qualified).toBe(true);
      expect(report.overallScore).toBeGreaterThanOrEqual(60);
      expect(report.results).toHaveLength(5);
    });

    it('should return disqualified for empty handles', () => {
      const report = verifyInfluencer([]);
      expect(report.qualified).toBe(false);
      expect(report.overallScore).toBe(0);
      expect(report.results).toHaveLength(0);
    });
  });

  describe('verifyAndPersist', () => {
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        influencerSocialHandle: {
          upsert: jest.fn().mockResolvedValue({}),
        },
        influencerVerification: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          create: jest.fn().mockResolvedValue({}),
          createMany: jest.fn().mockResolvedValue({ count: 5 }),
        },
        influencerPartnerProfile: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
    });

    it('should successfully persist results to the database', async () => {
      const profileId = 'profile-123';
      const report = await verifyAndPersist(mockPrisma, profileId, mockHandles);

      expect(report.qualified).toBe(true);
      expect(mockPrisma.influencerSocialHandle.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrisma.influencerVerification.deleteMany).toHaveBeenCalledWith({
        where: { profileId },
      });
      expect(mockPrisma.influencerPartnerProfile.update).toHaveBeenCalledWith({
        where: { id: profileId },
        data: expect.objectContaining({
          overallScore: report.overallScore,
          status: 'approved',
        }),
      });
    });
  });
});
