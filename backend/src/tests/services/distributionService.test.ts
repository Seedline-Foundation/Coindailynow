import { getDistributionCampaigns } from '../../services/distributionService';
import prisma from '../../lib/prisma';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    distributionCampaign: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('distributionService', () => {
  describe('getDistributionCampaigns', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should retrieve campaigns without filters', async () => {
      const mockCampaigns = [
        { id: '1', name: 'Campaign 1' },
        { id: '2', name: 'Campaign 2' },
      ];
      (prisma.distributionCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
      (prisma.distributionCampaign.count as jest.Mock).mockResolvedValue(2);

      const result = await getDistributionCampaigns();

      expect(prisma.distributionCampaign.findMany).toHaveBeenCalledWith({
        where: {},
        take: 20,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        include: {
          distributions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(prisma.distributionCampaign.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({ campaigns: mockCampaigns, total: 2 });
    });

    it('should retrieve campaigns with status filter', async () => {
      const mockCampaigns = [{ id: '1', name: 'Campaign 1', status: 'ACTIVE' }];
      (prisma.distributionCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
      (prisma.distributionCampaign.count as jest.Mock).mockResolvedValue(1);

      const result = await getDistributionCampaigns({ status: 'ACTIVE' });

      expect(prisma.distributionCampaign.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: 'ACTIVE' },
      }));
      expect(prisma.distributionCampaign.count).toHaveBeenCalledWith({ where: { status: 'ACTIVE' } });
      expect(result).toEqual({ campaigns: mockCampaigns, total: 1 });
    });

    it('should retrieve campaigns with type filter', async () => {
      const mockCampaigns = [{ id: '1', name: 'Campaign 1', type: 'AUTO_SHARE' }];
      (prisma.distributionCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
      (prisma.distributionCampaign.count as jest.Mock).mockResolvedValue(1);

      const result = await getDistributionCampaigns({ type: 'AUTO_SHARE' });

      expect(prisma.distributionCampaign.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { type: 'AUTO_SHARE' },
      }));
      expect(prisma.distributionCampaign.count).toHaveBeenCalledWith({ where: { type: 'AUTO_SHARE' } });
      expect(result).toEqual({ campaigns: mockCampaigns, total: 1 });
    });

    it('should retrieve campaigns with pagination filters', async () => {
      const mockCampaigns = [{ id: '1', name: 'Campaign 1' }];
      (prisma.distributionCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
      (prisma.distributionCampaign.count as jest.Mock).mockResolvedValue(10);

      const result = await getDistributionCampaigns({ limit: 5, offset: 10 });

      expect(prisma.distributionCampaign.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 5,
        skip: 10,
      }));
      expect(result).toEqual({ campaigns: mockCampaigns, total: 10 });
    });
  });
});