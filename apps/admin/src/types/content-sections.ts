/** Reward points configuration for admin content review. */
export interface RewardPointsConfig {
  isRewardEnabled: boolean;
  pointsPerRead: number;
  pointsPerShare: number;
  pointsPerComment: number;
  pointsPerReaction: number;
  maxPointsPerDay: number;
  rewardWindow: number;
  multiplier: number;
  adminConfigured: boolean;
  configuredBy: string;
  configuredAt: Date;
  configurationNotes?: string;
  requiresApproval: boolean;
}
