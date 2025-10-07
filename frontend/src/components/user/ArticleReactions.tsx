'use client';

import React, { useState } from 'react';
import { ArticleReactions, Post, User } from '../../types/user';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Coins,
  Eye,
  MessageCircle,
  Share2,
  Repeat,
  Flag,
  Copy,
  ExternalLink,
  Clock,
  TrendingUp,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  Bookmark,
  Send
} from 'lucide-react';

interface ArticleReactionsProps {
  post: Post;
  user: User;
  onReact: (reactionType: string) => void;
  onComment: () => void;
  onShare: (platform: string) => void;
  onRetweet: () => void;
  onPromote: () => void;
  onReport: (reason: string) => void;
  onBlock: () => void;
  onFollowTopic: () => void;
  onCopyLink: () => void;
}

export default function ArticleReactionsComponent({ 
  post, 
  user, 
  onReact, 
  onComment, 
  onShare, 
  onRetweet, 
  onPromote, 
  onReport, 
  onBlock, 
  onFollowTopic, 
  onCopyLink 
}: ArticleReactionsProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  const reactions = post.reactions;
  const timePosted = Math.floor((Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60));

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendingColor = (score: number): string => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* Post Header Info */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{timePosted}h ago</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{formatNumber(reactions.engagement.views)} views</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-4 h-4 ${getTrendingColor(reactions.engagement.trendingScore)}`} />
            <span className={getTrendingColor(reactions.engagement.trendingScore)}>
              {reactions.engagement.trendingScore}% trending
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onFollowTopic}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              reactions.advanced.followTopic.isFollowing
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {reactions.advanced.followTopic.isFollowing ? 'Following Topic' : 'Follow Topic'}
          </button>
        </div>
      </div>

      {/* Main Reactions Row */}
      <div className="flex items-center justify-between">
        {/* Left Side - Reactions */}
        <div className="flex items-center gap-1">
          {/* Love Reaction */}
          <button
            onClick={() => onReact('love')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              reactions.reactions.love.userReacted
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${reactions.reactions.love.userReacted ? 'fill-current' : ''}`} />
            <span className="text-sm">{formatNumber(reactions.reactions.love.count)}</span>
          </button>

          {/* Thumbs Up */}
          <button
            onClick={() => onReact('thumbsUp')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              reactions.reactions.thumbsUp.userReacted
                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${reactions.reactions.thumbsUp.userReacted ? 'fill-current' : ''}`} />
            <span className="text-sm">{formatNumber(reactions.reactions.thumbsUp.count)}</span>
          </button>

          {/* Thumbs Down */}
          <button
            onClick={() => onReact('thumbsDown')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              reactions.reactions.thumbsDown.userReacted
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <ThumbsDown className={`w-4 h-4 ${reactions.reactions.thumbsDown.userReacted ? 'fill-current' : ''}`} />
            <span className="text-sm">{formatNumber(reactions.reactions.thumbsDown.count)}</span>
          </button>

          {/* On Fire */}
          <button
            onClick={() => onReact('onFire')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              reactions.reactions.onFire.userReacted
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <Flame className={`w-4 h-4 ${reactions.reactions.onFire.userReacted ? 'fill-current' : ''}`} />
            <span className="text-sm">{formatNumber(reactions.reactions.onFire.count)}</span>
          </button>

          {/* Holding Token */}
          <button
            onClick={() => onReact('holding')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              reactions.reactions.holding.userReacted
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <Coins className={`w-4 h-4 ${reactions.reactions.holding.userReacted ? 'fill-current' : ''}`} />
            <span className="text-sm">{formatNumber(reactions.reactions.holding.count)}</span>
            <span className="text-xs opacity-75">HODL</span>
          </button>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-1">
          {/* Comments */}
          <button
            onClick={onComment}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            disabled={!reactions.social.comments.canComment}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{formatNumber(reactions.social.comments.count)}</span>
          </button>

          {/* Retweet */}
          <button
            onClick={onRetweet}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            disabled={!reactions.social.retweets.canRetweet}
          >
            <Repeat className="w-4 h-4" />
            <span className="text-sm">{formatNumber(reactions.social.retweets.count)}</span>
          </button>

          {/* Share Menu */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{formatNumber(reactions.social.shares.count)}</span>
            </button>

            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <button
                    onClick={() => {
                      onShare('twitter');
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => {
                      onShare('telegram');
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Share on Telegram
                  </button>
                  <button
                    onClick={() => {
                      onShare('whatsapp');
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Share on WhatsApp
                  </button>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      onCopyLink();
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  {/* Promote Post */}
                  {reactions.advanced.promotePost.canPromote && (
                    <button
                      onClick={() => {
                        setShowPromoteModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Promote Post ({reactions.advanced.promotePost.joyTokenCost} JOY)
                    </button>
                  )}
                  
                  {/* Bookmark */}
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    Bookmark
                  </button>

                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  
                  {/* Report */}
                  {reactions.advanced.reporting.canReport && (
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      Report Post
                    </button>
                  )}
                  
                  {/* Block User */}
                  {reactions.advanced.reporting.canBlock && (
                    <button
                      onClick={() => {
                        onBlock();
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      Block User
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Promotion Status */}
      {reactions.advanced.promotePost.currentPromotion && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Promoted ({reactions.advanced.promotePost.currentPromotion.level})
              </span>
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              Expires: {new Date(reactions.advanced.promotePost.currentPromotion.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report Post</h3>
            <div className="space-y-2">
              {reactions.advanced.reporting.reportReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    onReport(reason);
                    setShowReportModal(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Promote Post</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use your JOY tokens to promote this post and increase its visibility.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <div className="font-medium text-gray-900 dark:text-gray-100">Basic Promotion</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cost: {reactions.advanced.promotePost.joyTokenCost} JOY tokens</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Duration: 24 hours</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onPromote();
                  setShowPromoteModal(false);
                }}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                disabled={user.joyTokens < reactions.advanced.promotePost.joyTokenCost}
              >
                Promote ({reactions.advanced.promotePost.joyTokenCost} JOY)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}