/**
 * Platform Settings GraphQL Schema
 * Manages JOY Token (JY) exchange rates and platform configuration
 * 
 * SUPER ADMIN functionality
 */

import { gql } from 'apollo-server-express';

export const platformSettingsSchema = gql`
  # ============================================================================
  # TYPES
  # ============================================================================
  
  type PlatformSettings {
    id: ID!
    joyTokenUsdRate: Float!
    joyTokenSymbol: String!
    joyTokenName: String!
    lastRateUpdate: DateTime!
    rateUpdatedBy: ID
    rateUpdateReason: String
    previousRate: Float
    cePointsToJyRate: Int!
    cePointsEnabled: Boolean!
    defaultCurrency: String!
    supportedCurrencies: [String!]!
    platformName: String!
    platformUrl: String
    maintenanceMode: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type JoyTokenRate {
    currentRate: Float!
    symbol: String!
    name: String!
    lastUpdate: DateTime!
    updatedBy: ID
    cePointsRate: Int!
  }
  
  type CurrencyRateHistory {
    id: ID!
    currency: String!
    usdRate: Float!
    previousRate: Float
    changePercentage: Float
    updatedBy: ID!
    updatedByUser: User
    updateReason: String
    notes: String
    marketCap: Float
    volume24h: Float
    effectiveFrom: DateTime!
    effectiveTo: DateTime
    createdAt: DateTime!
  }
  
  type UpdateJoyTokenRateResult {
    success: Boolean!
    settings: PlatformSettings!
    previousRate: Float!
    newRate: Float!
    changePercentage: Float!
    historyId: ID!
    message: String!
  }
  
  type UpdateCEPointsRateResult {
    success: Boolean!
    newRate: Int!
    message: String!
  }
  
  type UpdatePlatformConfigResult {
    success: Boolean!
    settings: PlatformSettings!
  }
  
  type CurrencyConversionResult {
    amount: Float!
    fromCurrency: String!
    toCurrency: String!
    convertedAmount: Float!
    rate: Float!
  }
  
  # ============================================================================
  # INPUTS
  # ============================================================================
  
  input UpdateJoyTokenRateInput {
    newRate: Float!
    reason: String
    notes: String
  }
  
  input UpdateCEPointsRateInput {
    newRate: Int!
    reason: String
  }
  
  input UpdatePlatformConfigInput {
    platformName: String
    platformUrl: String
    maintenanceMode: Boolean
    supportedCurrencies: [String!]
  }
  
  input ConvertCurrencyInput {
    amount: Float!
    fromCurrency: String!
    toCurrency: String!
  }
  
  # ============================================================================
  # QUERIES
  # ============================================================================
  
  extend type Query {
    """
    Get current JOY Token (JY) exchange rate
    PUBLIC - Anyone can view current rate
    """
    joyTokenRate: JoyTokenRate!
    
    """
    Get complete platform settings
    SUPER ADMIN ONLY
    """
    platformSettings: PlatformSettings!
    
    """
    Get JOY Token rate history
    SUPER ADMIN or FINANCE_ADMIN
    """
    joyTokenRateHistory(limit: Int): [CurrencyRateHistory!]!
    
    """
    Convert amount between currencies
    PUBLIC - Used throughout platform
    """
    convertCurrency(input: ConvertCurrencyInput!): CurrencyConversionResult!
    
    """
    Convert CE Points to JY
    PUBLIC - Used in rewards system
    """
    convertCEPointsToJY(cePoints: Int!): Float!
  }
  
  # ============================================================================
  # MUTATIONS
  # ============================================================================
  
  extend type Mutation {
    """
    Update JOY Token (JY) exchange rate
    SUPER ADMIN ONLY - Critical financial operation
    """
    updateJoyTokenRate(input: UpdateJoyTokenRateInput!): UpdateJoyTokenRateResult!
    
    """
    Update CE Points to JY conversion rate
    SUPER ADMIN ONLY
    """
    updateCEPointsRate(input: UpdateCEPointsRateInput!): UpdateCEPointsRateResult!
    
    """
    Update platform configuration
    SUPER ADMIN ONLY
    """
    updatePlatformConfig(input: UpdatePlatformConfigInput!): UpdatePlatformConfigResult!
  }
`;
