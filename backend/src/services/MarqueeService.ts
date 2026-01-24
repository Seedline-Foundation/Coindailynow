import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface MarqueeData {
  id?: string;
  name: string;
  title?: string;
  type: 'token' | 'news' | 'custom';
  position: 'header' | 'footer' | 'content';
  isActive: boolean;
  isPublished: boolean;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  styles?: MarqueeStyleData;
  items?: MarqueeItemData[];
}

export interface MarqueeStyleData {
  speed: number;
  direction: 'left' | 'right';
  pauseOnHover: boolean;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  fontWeight: string;
  height: string;
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  shadowColor: string;
  shadowBlur: string;
  showIcons: boolean;
  iconColor: string;
  iconSize: string;
  itemSpacing: string;
  paddingVertical: string;
  paddingHorizontal: string;
  gradient?: string;
  customCSS?: string;
}

export interface MarqueeItemData {
  id?: string;
  type: 'token' | 'news' | 'custom' | 'link';
  title: string;
  subtitle?: string;
  description?: string;
  linkUrl?: string;
  linkTarget: '_self' | '_blank';
  symbol?: string;
  price?: number;
  change24h?: number;
  changePercent24h?: number;
  marketCap?: number;
  volume24h?: number;
  isHot: boolean;
  textColor?: string;
  bgColor?: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isVisible: boolean;
}

export interface MarqueeTemplateData {
  name: string;
  description?: string;
  category: string;
  styleConfig: MarqueeStyleData;
  itemsConfig?: MarqueeItemData[];
}

export class MarqueeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new marquee
   */
  async createMarquee(data: MarqueeData, createdBy: string): Promise<any> {
    try {
      const createData: any = {
        name: data.name,
        title: data.title || null,
        type: data.type,
        position: data.position,
        isActive: data.isActive,
        isPublished: data.isPublished,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        priority: data.priority,
        createdBy
      };

      if (data.styles) {
        createData.styles = { create: data.styles };
      }

      if (data.items) {
        createData.items = { create: data.items };
      }

      const marquee = await this.prisma.marquee.create({
        data: createData,
        include: {
          styles: true,
          items: {
            orderBy: { order: 'asc' }
          }
        }
      });

      logger.info(`Marquee created: ${marquee.id}`);
      return marquee;
    } catch (error) {
      logger.error('Error creating marquee:', error);
      throw new Error('Failed to create marquee');
    }
  }

  /**
   * Get all marquees with optional filtering
   */
  async getMarquees(filters?: {
    isActive?: boolean;
    isPublished?: boolean;
    type?: string;
    position?: string;
  }): Promise<any[]> {
    try {
      const marquees = await this.prisma.marquee.findMany({
        where: filters || {},
        include: {
          styles: true,
          items: {
            where: { isVisible: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return marquees;
    } catch (error) {
      logger.error('Error fetching marquees:', error);
      throw new Error('Failed to fetch marquees');
    }
  }

  /**
   * Get all marquees (admin view)
   */
  async getAllMarquees(): Promise<any[]> {
    return this.getMarquees();
  }

  /**
   * Get published marquees for public consumption
   */
  async getPublishedMarquees(position?: string): Promise<any[]> {
    const filters: any = {
      isActive: true,
      isPublished: true
    };
    
    if (position) {
      filters.position = position;
    }
    
    return this.getMarquees(filters);
  }

  /**
   * Get active marquees for display
   */
  async getActiveMarquees(position?: string): Promise<any[]> {
    try {
      const now = new Date();
      
      const whereClause: any = {
        isActive: true,
        isPublished: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      };

      if (position) {
        whereClause.position = position;
      }
      
      const marquees = await this.prisma.marquee.findMany({
        where: whereClause,
        include: {
          styles: true,
          items: {
            where: { isVisible: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      // Update impressions
      if (marquees.length > 0) {
        await this.updateImpressions(marquees.map(m => m.id));
      }

      return marquees;
    } catch (error) {
      logger.error('Error fetching active marquees:', error);
      throw new Error('Failed to fetch active marquees');
    }
  }

  /**
   * Get marquee by ID
   */
  async getMarqueeById(id: string): Promise<any | null> {
    try {
      const marquee = await this.prisma.marquee.findUnique({
        where: { id },
        include: {
          styles: true,
          items: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return marquee;
    } catch (error) {
      logger.error('Error fetching marquee by ID:', error);
      throw new Error('Failed to fetch marquee');
    }
  }

  /**
   * Update marquee
   */
  async updateMarquee(id: string, data: Partial<MarqueeData>): Promise<any> {
    try {
      const updateData: any = {
        name: data.name,
        title: data.title,
        type: data.type,
        position: data.position,
        isActive: data.isActive,
        isPublished: data.isPublished,
        startDate: data.startDate,
        endDate: data.endDate,
        priority: data.priority,
      };

      // Handle styles update
      if (data.styles) {
        updateData.styles = {
          upsert: {
            create: data.styles,
            update: data.styles
          }
        };
      }

      const marquee = await this.prisma.marquee.update({
        where: { id },
        data: updateData,
        include: {
          styles: true,
          items: {
            orderBy: { order: 'asc' }
          }
        }
      });

      logger.info(`Marquee updated: ${id}`);
      return marquee;
    } catch (error) {
      logger.error('Error updating marquee:', error);
      throw new Error('Failed to update marquee');
    }
  }

  /**
   * Delete marquee
   */
  async deleteMarquee(id: string): Promise<void> {
    try {
      await this.prisma.marquee.delete({
        where: { id }
      });

      logger.info(`Marquee deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting marquee:', error);
      throw new Error('Failed to delete marquee');
    }
  }

  /**
   * Add item to marquee
   */
  async addMarqueeItem(marqueeId: string, itemData: MarqueeItemData): Promise<any> {
    try {
      const item = await this.prisma.marqueeItem.create({
        data: {
          ...itemData,
          marqueeId
        }
      });

      logger.info(`Marquee item added: ${item.id}`);
      return item;
    } catch (error) {
      logger.error('Error adding marquee item:', error);
      throw new Error('Failed to add marquee item');
    }
  }

  /**
   * Update marquee item
   */
  async updateMarqueeItem(itemId: string, itemData: Partial<MarqueeItemData>): Promise<any> {
    try {
      const item = await this.prisma.marqueeItem.update({
        where: { id: itemId },
        data: itemData
      });

      logger.info(`Marquee item updated: ${itemId}`);
      return item;
    } catch (error) {
      logger.error('Error updating marquee item:', error);
      throw new Error('Failed to update marquee item');
    }
  }

  /**
   * Delete marquee item
   */
  async deleteMarqueeItem(itemId: string): Promise<void> {
    try {
      await this.prisma.marqueeItem.delete({
        where: { id: itemId }
      });

      logger.info(`Marquee item deleted: ${itemId}`);
    } catch (error) {
      logger.error('Error deleting marquee item:', error);
      throw new Error('Failed to delete marquee item');
    }
  }

  /**
   * Reorder marquee items
   */
  async reorderMarqueeItems(marqueeId: string, itemOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const updatePromises = itemOrders.map(({ id, order }) =>
        this.prisma.marqueeItem.update({
          where: { id },
          data: { order }
        })
      );

      await Promise.all(updatePromises);
      logger.info(`Marquee items reordered for marquee: ${marqueeId}`);
    } catch (error) {
      logger.error('Error reordering marquee items:', error);
      throw new Error('Failed to reorder marquee items');
    }
  }

  /**
   * Bulk update items (for token prices, etc.)
   */
  async bulkUpdateItems(updates: { id: string; data: Partial<MarqueeItemData> }[]): Promise<void> {
    try {
      const updatePromises = updates.map(({ id, data }) =>
        this.prisma.marqueeItem.update({
          where: { id },
          data
        })
      );

      await Promise.all(updatePromises);
      logger.info(`Bulk updated ${updates.length} marquee items`);
    } catch (error) {
      logger.error('Error bulk updating marquee items:', error);
      throw new Error('Failed to bulk update marquee items');
    }
  }

  /**
   * Track click on marquee item
   */
  async trackClick(marqueeId: string, itemId?: string): Promise<void> {
    try {
      const promises: Promise<any>[] = [
        this.prisma.marquee.update({
          where: { id: marqueeId },
          data: { clicks: { increment: 1 } }
        })
      ];

      if (itemId) {
        promises.push(
          this.prisma.marqueeItem.update({
            where: { id: itemId },
            data: { clicks: { increment: 1 } }
          })
        );
      }

      await Promise.all(promises);
    } catch (error) {
      logger.error('Error tracking click:', error);
    }
  }

  /**
   * Update impressions for marquees
   */
  private async updateImpressions(marqueeIds: string[]): Promise<void> {
    try {
      const updatePromises = marqueeIds.map(id =>
        this.prisma.marquee.update({
          where: { id },
          data: { impressions: { increment: 1 } }
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      logger.error('Error updating impressions:', error);
    }
  }

  /**
   * Create marquee template
   */
  async createTemplate(data: MarqueeTemplateData): Promise<any> {
    try {
      const template = await this.prisma.marqueeTemplate.create({
        data: {
          name: data.name,
          description: data.description || null,
          category: data.category,
          styleConfig: JSON.stringify(data.styleConfig),
          itemsConfig: data.itemsConfig ? JSON.stringify(data.itemsConfig) : null
        }
      });

      logger.info(`Marquee template created: ${template.id}`);
      return template;
    } catch (error) {
      logger.error('Error creating marquee template:', error);
      throw new Error('Failed to create marquee template');
    }
  }

  /**
   * Get marquee templates
   */
  async getTemplates(category?: string): Promise<any[]> {
    try {
      const templates = await this.prisma.marqueeTemplate.findMany({
        where: category ? { category } : {},
        orderBy: [
          { isDefault: 'desc' },
          { usageCount: 'desc' },
          { name: 'asc' }
        ]
      });

      return templates.map(template => ({
        ...template,
        styleConfig: JSON.parse(template.styleConfig),
        itemsConfig: template.itemsConfig ? JSON.parse(template.itemsConfig) : null
      }));
    } catch (error) {
      logger.error('Error fetching marquee templates:', error);
      throw new Error('Failed to fetch marquee templates');
    }
  }

  /**
   * Use template (increment usage count)
   */
  async useTemplate(templateId: string): Promise<void> {
    try {
      await this.prisma.marqueeTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } }
      });
    } catch (error) {
      logger.error('Error updating template usage:', error);
    }
  }

  /**
   * Get marquee analytics
   */
  async getAnalytics(marqueeId?: string): Promise<any> {
    try {
      if (marqueeId) {
        // Analytics for specific marquee
        const marquee = await this.prisma.marquee.findUnique({
          where: { id: marqueeId },
          include: {
            items: {
              select: {
                id: true,
                title: true,
                clicks: true,
                type: true
              }
            }
          }
        });

        return {
          marquee: {
            id: marquee?.id,
            name: marquee?.name,
            impressions: marquee?.impressions || 0,
            clicks: marquee?.clicks || 0,
            ctr: marquee?.impressions ? (marquee.clicks / marquee.impressions * 100).toFixed(2) : '0.00'
          },
          items: marquee?.items.map(item => ({
            ...item,
            ctr: marquee?.impressions ? (item.clicks / marquee.impressions * 100).toFixed(2) : '0.00'
          })) || []
        };
      } else {
        // Overall analytics
        const stats = await this.prisma.marquee.aggregate({
          _sum: {
            impressions: true,
            clicks: true
          },
          _count: {
            id: true
          }
        });

        const activeCount = await this.prisma.marquee.count({
          where: { isActive: true, isPublished: true }
        });

        return {
          totalMarquees: stats._count.id || 0,
          activeMarquees: activeCount,
          totalImpressions: stats._sum.impressions || 0,
          totalClicks: stats._sum.clicks || 0,
          overallCtr: stats._sum.impressions ? 
            (stats._sum.clicks! / stats._sum.impressions * 100).toFixed(2) : '0.00'
        };
      }
    } catch (error) {
      logger.error('Error fetching marquee analytics:', error);
      throw new Error('Failed to fetch marquee analytics');
    }
  }
}

export default MarqueeService;