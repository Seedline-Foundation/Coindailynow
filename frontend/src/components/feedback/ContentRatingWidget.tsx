/**
 * Content Rating Widget
 * 
 * Allows users to rate AI-generated content with 1-5 stars
 * and provide feedback on content quality
 * 
 * @module ContentRatingWidget
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import axios from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

interface ContentRatingWidgetProps {
  articleId: string;
  aiGenerated?: boolean;
  onFeedbackSubmitted?: () => void;
}

interface FeedbackStats {
  averageRating: number;
  totalFeedback: number;
  ratingDistribution: Record<number, number>;
  userFeedback?: {
    rating: number;
    feedbackCategory: string;
  };
}

// ============================================================================
// Component
// ============================================================================

export default function ContentRatingWidget({
  articleId,
  aiGenerated = true,
  onFeedbackSubmitted,
}: ContentRatingWidgetProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackType, setFeedbackType] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [error, setError] = useState<string>('');

  // Load existing feedback
  useEffect(() => {
    loadFeedbackStats();
  }, [articleId]);

  const loadFeedbackStats = async () => {
    try {
      const response = await axios.get(
        `/api/user/feedback/content/${articleId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
        
        // Set user's previous rating if exists
        if (response.data.data.userFeedback) {
          setRating(response.data.data.userFeedback.rating);
          setFeedbackType(response.data.data.userFeedback.feedbackCategory);
          setSubmitted(true);
        }
      }
    } catch (err: any) {
      console.error('Error loading feedback stats:', err);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
    setShowFeedbackForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!feedbackType) {
      setError('Please select a feedback type');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/user/feedback/content',
        {
          articleId,
          rating,
          feedbackType,
          comment,
          aiGenerated,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        setShowFeedbackForm(false);
        
        // Reload stats
        await loadFeedbackStats();
        
        // Notify parent
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }

        // Show success message
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (value: number): string => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return labels[value as keyof typeof labels] || '';
  };

  const feedbackTypes = [
    { value: 'helpful', label: '✓ Helpful' },
    { value: 'not_helpful', label: '✗ Not Helpful' },
    { value: 'inaccurate', label: '⚠ Inaccurate' },
    { value: 'well_written', label: '✍ Well Written' },
    { value: 'poor_quality', label: '⊘ Poor Quality' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rate this {aiGenerated ? 'AI-generated' : ''} content
          </h3>
          {stats && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Average: {stats.averageRating.toFixed(1)} ★ ({stats.totalFeedback} ratings)
            </p>
          )}
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingClick(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={isSubmitting}
            className="focus:outline-none transition-transform hover:scale-110"
            aria-label={`Rate ${value} stars`}
          >
            <Star
              className={`w-8 h-8 ${
                value <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
        {(hoverRating || rating) > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {getRatingLabel(hoverRating || rating)}
          </span>
        )}
      </div>

      {/* Rating Distribution */}
      {stats && stats.totalFeedback > 0 && (
        <div className="mb-4">
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingDistribution[star] || 0;
              const percentage = stats.totalFeedback > 0 
                ? (count / stats.totalFeedback) * 100 
                : 0;

              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-gray-600 dark:text-gray-400">{star}★</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-600 dark:text-gray-400">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {showFeedbackForm && !submitted && (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What did you think?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {feedbackTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    feedbackType === type.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Tell us more about your experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFeedbackForm(false);
                setRating(stats?.userFeedback?.rating || 0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Success Message */}
      {submitted && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-300">
            ✓ Thank you for your feedback! Your input helps us improve content quality.
          </p>
        </div>
      )}

      {/* AI Badge */}
      {aiGenerated && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              🤖 AI-Generated
            </span>
            <span>Your feedback helps improve our AI models</span>
          </div>
        </div>
      )}
    </div>
  );
}

