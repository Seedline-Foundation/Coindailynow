/**
 * Admin Reward Points Configuration Interface
 * Content Review & Reward Points Assignment
 * 
 * Allows admins to configure reward points for content before publication
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Eye, 
  Share2, 
  MessageCircle, 
  Heart,
  CheckCircle,
  X,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Settings,
  Save,
  Trash2
} from 'lucide-react';
import { RewardPointsConfig } from '../../types/content-sections';

// Types for admin interface
interface ContentItem {
  id: string;
  type: 'article' | 'analysis' | 'tutorial' | 'news' | 'interview' | 'opinion';
  title: string;
  preview: string;
  submittedBy: string;
  submittedAt: string;
  currentConfig?: RewardPointsConfig;
}

interface AdminRewardConfigProps {
  contentId: string;
  contentType: 'article' | 'analysis' | 'tutorial' | 'news' | 'interview' | 'opinion';
  contentTitle: string;
  contentPreview: string;
  submittedBy: string;
  submittedAt: string;
  currentConfig?: RewardPointsConfig;
  onSave: (contentId: string, config: RewardPointsConfig) => void;
  onApprove: (contentId: string, config: RewardPointsConfig) => void;
  onReject: (contentId: string, reason: string) => void;
}

export const AdminRewardConfig: React.FC<AdminRewardConfigProps> = ({
  contentId,
  contentType,
  contentTitle,
  contentPreview,
  submittedBy,
  submittedAt,
  currentConfig,
  onSave,
  onApprove,
  onReject
}) => {
  const [config, setConfig] = useState<RewardPointsConfig>({
    isRewardEnabled: false,
    pointsPerRead: 5,
    pointsPerShare: 10,
    pointsPerComment: 15,
    pointsPerReaction: 3,
    maxPointsPerDay: 100,
    rewardWindow: 24,
    multiplier: 1,
    adminConfigured: false,
    configuredBy: '',
    configuredAt: new Date(),
    requiresApproval: false
  });

  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
    // Calculate total points when config changes
    const total = config.pointsPerRead + config.pointsPerShare + config.pointsPerComment + 
                  config.pointsPerReaction;
    // Update maxPointsPerDay if needed
    if (total > config.maxPointsPerDay) {
      setConfig(prev => ({ ...prev, maxPointsPerDay: total }));
    }
  }, [currentConfig, config.pointsPerRead, config.pointsPerShare, config.pointsPerComment, 
      config.pointsPerReaction]);

  // Reward category options with default points
  const rewardCategories = {
    'general': { label: 'General Content', defaultPoints: { read: 5, share: 10, comment: 15, reaction: 3 } },
    'featured_news': { label: 'Featured News', defaultPoints: { read: 10, share: 15, comment: 20, reaction: 5 } },
    'upcoming_launches': { label: 'Upcoming Launches', defaultPoints: { read: 50, share: 25, comment: 30, reaction: 10 } },
    'market_analysis': { label: 'Market Analysis', defaultPoints: { read: 20, share: 15, comment: 25, reaction: 8 } },
    'educational': { label: 'Educational', defaultPoints: { read: 15, share: 20, comment: 25, reaction: 5 } },
    'memecoin_watch': { label: 'Memecoin Watch', defaultPoints: { read: 30, share: 20, comment: 35, reaction: 10 } },
    'community_insights': { label: 'Community Insights', defaultPoints: { read: 12, share: 18, comment: 22, reaction: 6 } },
    'premium_content': { label: 'Premium Content', defaultPoints: { read: 25, share: 30, comment: 40, reaction: 15 } }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('general');

  const handleCategorySelect = (category: string) => {
    const categoryConfig = rewardCategories[category as keyof typeof rewardCategories];
    if (categoryConfig) {
      setSelectedCategory(category);
      setConfig(prev => ({
        ...prev,
        isRewardEnabled: true,
        pointsPerRead: categoryConfig.defaultPoints.read,
        pointsPerShare: categoryConfig.defaultPoints.share,
        pointsPerComment: categoryConfig.defaultPoints.comment,
        pointsPerReaction: categoryConfig.defaultPoints.reaction
      }));
    }
  };

  const handleSave = async () => {
    const finalConfig: RewardPointsConfig = {
      ...config,
      adminConfigured: true,
      configuredBy: 'Admin User', // This should come from auth context
      configuredAt: new Date()
    };

    await onSave(contentId, finalConfig);
  };

  const handleApprove = async () => {
    const finalConfig: RewardPointsConfig = {
      ...config,
      adminConfigured: true,
      configuredBy: 'Admin User',
      configuredAt: new Date(),
      requiresApproval: false
    };

    await onApprove(contentId, finalConfig);
  };

  const handleReject = async () => {
    if (rejectReason.trim()) {
      await onReject(contentId, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{contentTitle}</h3>
              <Badge variant="outline" className="mt-1">
                {contentType}
              </Badge>
            </div>
            <p className="text-gray-600">{contentPreview}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {submittedBy}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Submitted: {new Date(submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Reward Points Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Enable Rewards Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Reward Points</label>
              <input
                type="checkbox"
                checked={config.isRewardEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, isRewardEnabled: e.target.checked }))}
                className="w-4 h-4"
              />
            </div>

            {config.isRewardEnabled && (
              <>
                {/* Category Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Content Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(rewardCategories).map(([category, info]) => (
                      <Button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        className="h-auto p-2 text-left"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-xs">
                            {selectedCategory === category ? '🎁' : '📄'}
                          </span>
                          <span className="text-xs font-medium">{info.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Points Configuration */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Read Points</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.pointsPerRead}
                        onChange={(e) => setConfig(prev => ({ ...prev, pointsPerRead: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">Share Points</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Share2 className="h-4 w-4 text-green-500" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.pointsPerShare}
                        onChange={(e) => setConfig(prev => ({ ...prev, pointsPerShare: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">Comment Points</label>
                    <div className="flex items-center gap-1 mt-1">
                      <MessageCircle className="h-4 w-4 text-purple-500" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.pointsPerComment}
                        onChange={(e) => setConfig(prev => ({ ...prev, pointsPerComment: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">Reaction Points</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.pointsPerReaction}
                        onChange={(e) => setConfig(prev => ({ ...prev, pointsPerReaction: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Bonus Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Reward Window (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={config.rewardWindow}
                      onChange={(e) => setConfig(prev => ({ ...prev, rewardWindow: parseInt(e.target.value) || 24 }))}
                      className="w-full px-2 py-1 border rounded text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">Multiplier</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={config.multiplier}
                      onChange={(e) => setConfig(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-2 py-1 border rounded text-sm mt-1"
                    />
                  </div>
                </div>

                {/* Total Points Display */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">
                      Maximum Points Per Day:
                    </span>
                    <Badge variant="default" className="bg-blue-600">
                      {config.maxPointsPerDay} points
                    </Badge>
                  </div>
                </div>
              </>
            )}

            {/* Admin Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this configuration..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setShowRejectDialog(true)}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Reject Content
        </Button>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>

          <Button
            onClick={handleApprove}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Approve & Publish
          </Button>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Reject Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Please provide a reason for rejecting this content:
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
                <div className="flex items-center justify-end gap-3">
                  <Button
                    onClick={() => setShowRejectDialog(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    disabled={!rejectReason.trim()}
                  >
                    Confirm Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Content Review Dashboard Component
interface AdminContentReviewDashboardProps {
  onConfigSave: (contentId: string, config: RewardPointsConfig) => void;
  onApprove: (contentId: string, config: RewardPointsConfig) => void;
  onReject: (contentId: string, reason: string) => void;
}

export const AdminContentReviewDashboard: React.FC<AdminContentReviewDashboardProps> = ({
  onConfigSave,
  onApprove,
  onReject
}) => {
  const [selectedContent, setSelectedContent] = useState<string | null>(null);

  // Mock data - replace with real data from API
  const pendingContent: ContentItem[] = [
    {
      id: '1',
      type: 'article',
      title: 'Bitcoin Reaches New All-Time High as Institutional Adoption Grows',
      preview: 'Major financial institutions are increasingly adopting Bitcoin as a store of value...',
      submittedBy: 'John Smith',
      submittedAt: new Date().toISOString(),
      currentConfig: {
        isRewardEnabled: false,
        pointsPerRead: 5,
        pointsPerShare: 10,
        pointsPerComment: 15,
        pointsPerReaction: 3,
        maxPointsPerDay: 100,
        rewardWindow: 24,
        multiplier: 1,
        adminConfigured: false,
        configuredBy: '',
        configuredAt: new Date(),
        requiresApproval: true
      }
    },
    {
      id: '2',
      type: 'analysis',
      title: 'Memecoin Market Analysis: What\'s Driving the Latest Surge?',
      preview: 'Recent memecoin activity shows interesting patterns in African markets...',
      submittedBy: 'Sarah Johnson',
      submittedAt: new Date().toISOString()
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Content List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Content Review</h2>
        {pendingContent.map((content) => (
          <Card 
            key={content.id} 
            className={`cursor-pointer transition-colors ${
              selectedContent === content.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedContent(content.id)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{content.type}</Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(content.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-medium text-sm line-clamp-2">{content.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2">{content.preview}</p>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{content.submittedBy}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Panel */}
      <div className="lg:col-span-2">
        {selectedContent ? (
          (() => {
            const content = pendingContent.find(c => c.id === selectedContent)!;
            return (
              <AdminRewardConfig
                contentId={content.id}
                contentType={content.type}
                contentTitle={content.title}
                contentPreview={content.preview}
                submittedBy={content.submittedBy}
                submittedAt={content.submittedAt}
                currentConfig={content.currentConfig}
                onSave={onConfigSave}
                onApprove={onApprove}
                onReject={onReject}
              />
            );
          })()
        ) : (
          <Card className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select content to configure reward points</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminRewardConfig;
