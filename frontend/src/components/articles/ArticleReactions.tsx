/**
 * ArticleReactions - Like/React to Articles
 * Allows users to react and earn CE points
 */

'use client';

import React, { useState } from 'react';
import {
  HeartIcon,
  FireIcon,
  HandThumbUpIcon,
  FaceSmileIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  FireIcon as FireSolidIcon,
  HandThumbUpIcon as HandThumbUpSolidIcon,
} from '@heroicons/react/24/solid';

interface ArticleReactionsProps {
  articleId: string;
  userId?: string;
  isAuthenticated?: boolean;
  initialLikeCount?: number;
}

const REACTIONS = [
  { type: 'LIKE', icon: HandThumbUpIcon, solidIcon: HandThumbUpSolidIcon, label: 'Like', color: 'blue' },
  { type: 'LOVE', icon: HeartIcon, solidIcon: HeartSolidIcon, label: 'Love', color: 'red' },
  { type: 'FIRE', icon: FireIcon, solidIcon: FireSolidIcon, label: 'Bullish', color: 'orange' },
  { type: 'SMART', icon: LightBulbIcon, solidIcon: LightBulbIcon, label: 'Insightful', color: 'yellow' },
  { type: 'HAPPY', icon: FaceSmileIcon, solidIcon: FaceSmileIcon, label: 'Happy', color: 'green' },
];

export default function ArticleReactions({
  articleId,
  userId,
  isAuthenticated = false,
  initialLikeCount = 0,
}: ArticleReactionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  const handleReaction = async (reactionType: string) => {
    if (!isAuthenticated) {
      alert('Please log in to react');
      return;
    }

    if (processing) return;

    try {
      setProcessing(true);

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ReactToArticle($articleId: ID!, $reactionType: String!) {
              reactToArticle(articleId: $articleId, reactionType: $reactionType) {
                success
                pointsEarned
              }
            }
          `,
          variables: { articleId, reactionType },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const result = data.data?.reactToArticle;
      if (result?.success) {
        setUserReaction(reactionType);
        setLikeCount(prev => prev + 1);
        setPointsEarned(result.pointsEarned);
        
        // Clear points notification after 2 seconds
        setTimeout(() => setPointsEarned(null), 2000);
      }
    } catch (err: any) {
      console.error('Reaction failed:', err);
    } finally {
      setProcessing(false);
      setShowReactions(false);
    }
  };

  const getActiveReaction = () => {
    if (!userReaction) return null;
    return REACTIONS.find(r => r.type === userReaction);
  };

  const activeReaction = getActiveReaction();

  return (
    <div className="relative inline-block">
      {/* Points Earned Notification */}
      {pointsEarned && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            +{pointsEarned} CE
          </span>
        </div>
      )}

      {/* Main Reaction Button */}
      <div
        className="relative"
        onMouseEnter={() => !userReaction && setShowReactions(true)}
        onMouseLeave={() => setShowReactions(false)}
      >
        <button
          onClick={() => !userReaction && handleReaction('LIKE')}
          disabled={processing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            userReaction
              ? `bg-${activeReaction?.color || 'blue'}-100 text-${activeReaction?.color || 'blue'}-600`
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {activeReaction ? (
            <activeReaction.solidIcon className="w-5 h-5" />
          ) : (
            <HandThumbUpIcon className="w-5 h-5" />
          )}
          <span className="font-medium">{likeCount}</span>
          {userReaction && (
            <span className="text-sm">{activeReaction?.label}</span>
          )}
        </button>

        {/* Reactions Popup */}
        {showReactions && !userReaction && (
          <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white rounded-full shadow-lg p-2 border border-gray-200">
            {REACTIONS.map(reaction => (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className={`p-2 rounded-full hover:bg-${reaction.color}-100 transition transform hover:scale-110`}
                title={reaction.label}
              >
                <reaction.icon className={`w-6 h-6 text-${reaction.color}-500`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reward Info */}
      {!userReaction && isAuthenticated && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          React to earn 3 CE points
        </p>
      )}
    </div>
  );
}
