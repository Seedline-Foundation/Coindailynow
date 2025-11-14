/**
 * Platform Settings Service
 * Manages JOY Token (JY) exchange rates and platform configuration
 * 
 * SUPER ADMIN ONLY - Critical platform settings
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { PermissionService } from './PermissionService';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

export interface PlatformSettings {
  id: string;
  joyTokenUsdRate: number;
  joyTokenSymbol: string;
  joyTokenName: string;
  lastRateUpdate: Date;
  rateUpdatedBy: string | null;
  rateUpdateReason: string | null;
  previousRate: number | null;
  cePointsToJyRate: number;
  cePointsEnabled: boolean;
  defaultCurrency: string;
  supportedCurrencies: string;
  platformName: string;
  platformUrl: string | null;
  maintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateJoyTokenRateInput {
  adminUserId: string;
  newRate: number;
  reason?: string;
  notes?: string;
}

export interface UpdateJoyTokenRateResult {
  success: boolean;
  settings: PlatformSettings;
  previousRate: number;
  newRate: number;
  changePercentage: number;
  historyId: string;
  message: string;
}

export interface GetJoyTokenRateResult {
  currentRate: number;
  symbol: string;
  name: string;
  lastUpdate: Date;
  updatedBy: string | null;
  cePointsRate: number;
}

export interface CurrencyRateHistory {
  id: string;
  currency: string;
  usdRate: number;
  previousRate: number | null;
  changePercentage: number | null;
  updatedBy: string;
  updateReason: string | null;
  notes: string | null;
  marketCap: number | null;
  volume24h: number | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
}

export interface UpdateCEPointsRateInput {
  adminUserId: string;
  newRate: number; // How many CE Points = 1 JY
  reason?: string;
}

export interface UpdatePlatformConfigInput {
  adminUserId: string;
  platformName?: string;
  platformUrl?: string;
  maintenanceMode?: boolean;
  supportedCurrencies?: string[];
}

// ============================================================================
// PLATFORM SETTINGS SERVICE
// ============================================================================

export class PlatformSettingsService {
  
  /**
   * Get current JOY Token (JY) exchange rate
   * PUBLIC - Anyone can view the current rate
   */
  static async getJoyTokenRate(): Promise<GetJoyTokenRateResult> {
    try {
      const settings = await this.getOrCreateSettings();
      
      return {
        currentRate: settings.joyTokenUsdRate,
        symbol: settings.joyTokenSymbol,
        name: settings.joyTokenName,
        lastUpdate: settings.lastRateUpdate,
        updatedBy: settings.rateUpdatedBy,
        cePointsRate: settings.cePointsToJyRate
      };
    } catch (error) {
      console.error('Error getting JOY Token rate:', error);
      throw new Error('Failed to retrieve JOY Token exchange rate');
    }
  }
  
  /**
   * Update JOY Token (JY) exchange rate
   * SUPER ADMIN ONLY - Critical financial operation
   */
  static async updateJoyTokenRate(
    input: UpdateJoyTokenRateInput
  ): Promise<UpdateJoyTokenRateResult> {
    try {
      // 1. Verify super admin permissions
      const isSuperAdmin = await PermissionService.isSuperAdmin(input.adminUserId as any);
      if (!isSuperAdmin) {
        throw new Error('Only super admins can update JOY Token exchange rate');
      }
      
      // 2. Validate rate
      if (input.newRate <= 0) {
        throw new Error('Exchange rate must be greater than 0');
      }
      
      if (input.newRate > 1000000) {
        throw new Error('Exchange rate seems unreasonably high');
      }
      
      // 3. Get current settings
      const currentSettings = await this.getOrCreateSettings();
      const previousRate = currentSettings.joyTokenUsdRate;
      
      // 4. Calculate change percentage
      const changePercentage = ((input.newRate - previousRate) / previousRate) * 100;
      
      // 5. Update settings
      const updatedSettings = await prisma.platformSettings.update({
        where: { id: currentSettings.id },
        data: {
          joyTokenUsdRate: input.newRate,
          previousRate: previousRate,
          lastRateUpdate: new Date(),
          rateUpdatedBy: input.adminUserId,
          rateUpdateReason: input.reason || 'Rate adjustment',
          updatedAt: new Date()
        }
      });
      
      // 6. Create history record
      const historyRecord = await prisma.currencyRateHistory.create({
        data: {
          currency: 'JY',
          usdRate: input.newRate,
          previousRate: previousRate,
          changePercentage: changePercentage,
          updatedBy: input.adminUserId,
          updateReason: input.reason || 'Rate adjustment',
          notes: input.notes || null,
          effectiveFrom: new Date()
        }
      });
      
      // 7. Mark previous history record as expired
      await prisma.currencyRateHistory.updateMany({
        where: {
          currency: 'JY',
          effectiveTo: null,
          id: { not: historyRecord.id }
        },
        data: {
          effectiveTo: new Date()
        }
      });
      
      return {
        success: true,
        settings: updatedSettings as PlatformSettings,
        previousRate,
        newRate: input.newRate,
        changePercentage,
        historyId: historyRecord.id,
        message: `JOY Token rate updated from $${previousRate.toFixed(4)} to $${input.newRate.toFixed(4)} USD (${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(2)}%)`
      };
      
    } catch (error) {
      console.error('Error updating JOY Token rate:', error);
      throw error;
    }
  }
  
  /**
   * Update CE Points to JY conversion rate
   * SUPER ADMIN ONLY
   */
  static async updateCEPointsRate(
    input: UpdateCEPointsRateInput
  ): Promise<{ success: boolean; newRate: number; message: string }> {
    try {
      // Verify super admin
      const isSuperAdmin = await PermissionService.isSuperAdmin(input.adminUserId as any);
      if (!isSuperAdmin) {
        throw new Error('Only super admins can update CE Points conversion rate');
      }
      
      // Validate rate
      if (input.newRate <= 0 || input.newRate > 10000) {
        throw new Error('CE Points rate must be between 1 and 10,000');
      }
      
      const settings = await this.getOrCreateSettings();
      
      await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          cePointsToJyRate: input.newRate,
          updatedAt: new Date()
        }
      });
      
      return {
        success: true,
        newRate: input.newRate,
        message: `CE Points conversion rate updated: ${input.newRate} CE Points = 1 JY`
      };
      
    } catch (error) {
      console.error('Error updating CE Points rate:', error);
      throw error;
    }
  }
  
  /**
   * Get rate history for JOY Token
   * SUPER ADMIN or FINANCE_ADMIN
   */
  static async getJoyTokenRateHistory(
    adminUserId: string,
    limit: number = 50
  ): Promise<CurrencyRateHistory[]> {
    try {
      // Verify admin permissions
      const hasPermission = await PermissionService.isSuperAdmin(adminUserId as any);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to view rate history');
      }
      
      const history = await prisma.currencyRateHistory.findMany({
        where: { currency: 'JY' },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      return history as CurrencyRateHistory[];
      
    } catch (error) {
      console.error('Error fetching rate history:', error);
      throw error;
    }
  }
  
  /**
   * Get or create platform settings (singleton pattern)
   * INTERNAL USE
   */
  private static async getOrCreateSettings(): Promise<PlatformSettings> {
    try {
      // Try to find existing settings
      let settings = await prisma.platformSettings.findFirst();
      
      // Create default settings if none exist
      if (!settings) {
        settings = await prisma.platformSettings.create({
          data: {
            joyTokenUsdRate: 1.0,
            joyTokenSymbol: 'JY',
            joyTokenName: 'JOY Token',
            cePointsToJyRate: 100,
            cePointsEnabled: true,
            defaultCurrency: 'JY',
            supportedCurrencies: 'JY,USD,EUR,KES,NGN,GHS,ZAR',
            platformName: 'CoinDaily',
            maintenanceMode: false
          }
        });
      }
      
      return settings as PlatformSettings;
      
    } catch (error) {
      console.error('Error getting/creating platform settings:', error);
      throw error;
    }
  }
  
  /**
   * Get all platform settings
   * SUPER ADMIN ONLY
   */
  static async getPlatformSettings(adminUserId: string): Promise<PlatformSettings> {
    try {
      const isSuperAdmin = await PermissionService.isSuperAdmin(adminUserId as any);
      if (!isSuperAdmin) {
        throw new Error('Only super admins can view platform settings');
      }
      
      return await this.getOrCreateSettings();
      
    } catch (error) {
      console.error('Error getting platform settings:', error);
      throw error;
    }
  }
  
  /**
   * Update platform configuration
   * SUPER ADMIN ONLY
   */
  static async updatePlatformConfig(
    input: UpdatePlatformConfigInput
  ): Promise<{ success: boolean; settings: PlatformSettings }> {
    try {
      const isSuperAdmin = await PermissionService.isSuperAdmin(input.adminUserId as any);
      if (!isSuperAdmin) {
        throw new Error('Only super admins can update platform configuration');
      }
      
      const settings = await this.getOrCreateSettings();
      
      const updateData: any = { updatedAt: new Date() };
      
      if (input.platformName !== undefined) {
        updateData.platformName = input.platformName;
      }
      
      if (input.platformUrl !== undefined) {
        updateData.platformUrl = input.platformUrl;
      }
      
      if (input.maintenanceMode !== undefined) {
        updateData.maintenanceMode = input.maintenanceMode;
      }
      
      if (input.supportedCurrencies !== undefined) {
        updateData.supportedCurrencies = input.supportedCurrencies.join(',');
      }
      
      const updatedSettings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: updateData
      });
      
      return {
        success: true,
        settings: updatedSettings as PlatformSettings
      };
      
    } catch (error) {
      console.error('Error updating platform config:', error);
      throw error;
    }
  }
  
  /**
   * Convert amount between currencies using current rates
   * PUBLIC - Used throughout the platform
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      // If same currency, no conversion needed
      if (fromCurrency === toCurrency) {
        return amount;
      }
      
      const settings = await this.getOrCreateSettings();
      
      // Convert JY to USD
      if (fromCurrency === 'JY' && toCurrency === 'USD') {
        return amount * settings.joyTokenUsdRate;
      }
      
      // Convert USD to JY
      if (fromCurrency === 'USD' && toCurrency === 'JY') {
        return amount / settings.joyTokenUsdRate;
      }
      
      // For other currencies, you would fetch live exchange rates
      // This is a simplified version
      throw new Error(`Conversion from ${fromCurrency} to ${toCurrency} not yet implemented`);
      
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }
  
  /**
   * Convert CE Points to JY
   * PUBLIC - Used in rewards system
   */
  static async convertCEPointsToJY(cePoints: number): Promise<number> {
    try {
      const settings = await this.getOrCreateSettings();
      
      if (!settings.cePointsEnabled) {
        throw new Error('CE Points conversion is currently disabled');
      }
      
      // CE Points to JY conversion
      return cePoints / settings.cePointsToJyRate;
      
    } catch (error) {
      console.error('Error converting CE Points:', error);
      throw error;
    }
  }
}
