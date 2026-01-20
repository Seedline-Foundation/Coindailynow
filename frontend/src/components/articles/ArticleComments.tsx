/**
 * ArticleComments - Comment System for Articles
 * Allows users to comment, vote, and earn CE points
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpSolidIcon,
  HandThumbDownIcon as HandThumbDownSolidIcon,
} from '@heroicons/react/24/solid';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
  replies?: Comment[];
  userVote?: 'UP' | 'DOWN' | null;
}

interface ArticleCommentsProps {
  articleId: string;
  userId?: string;
  isAuthenticated?: boolean;
}

export default function ArticleComments({
  articleId,
  userId,
  isAuthenticated = false,
}: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetArticleComments($articleId: ID!, $limit: Int) {
              articleComments(articleId: $articleId, limit: $limit) {
                id
                content
                author {
                  id
                  username
                  firstName
                  lastName
                  avatarUrl
                }
                upvoteCount
                downvoteCount
                createdAt
                replies {
                  id
                  content
                  author {
                    id
                    username
                    firstName
                    lastName
                    avatarUrl
                  }
                  upvoteCount
                  downvoteCount
                  createdAt
                }
              }
            }
          `,
          variables: { articleId, limit: 20 },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      setComments(data.data?.articleComments || []);
    } catch (err: any) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateComment($input: CreateCommunityPostInput!) {
              createPost(input: $input) {
                id
                content
                author {
                  id
                  username
                  firstName
                  lastName
                  avatarUrl
                }
                upvoteCount
                downvoteCount
                createdAt
              }
            }
          `,
          variables: {
            input: {
              content: newComment,
              articleId,
              parentId: replyTo,
              postType: 'TEXT',
            },
          },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      // Add new comment to list
      const newCommentData = data.data?.createPost;
      if (replyTo) {
        // Add as reply
        setComments(prev =>
          prev.map(comment =>
            comment.id === replyTo
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), newCommentData],
                }
              : comment
          )
        );
      } else {
        // Add as top-level comment
        setComments(prev => [newCommentData, ...prev]);
      }

      setNewComment('');
      setReplyTo(null);
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId: string, voteType: 'UP' | 'DOWN') => {
    if (!isAuthenticated) {
      setError('Please log in to vote');
      return;
    }

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation VoteOnComment($postId: ID!, $voteType: VoteType!) {
              votePost(postId: $postId, voteType: $voteType) {
                id
                voteType
                removed
                changed
              }
            }
          `,
          variables: { postId: commentId, voteType },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      // Refresh comments to get updated counts
      await fetchComments();
    } catch (err: any) {
      console.error('Vote failed:', err);
      setError('Failed to vote');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''} mb-4`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.username}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <UserCircleIcon className="w-10 h-10 text-gray-400" />
        )}

        {/* Comment Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {comment.author.firstName && comment.author.lastName
                ? `${comment.author.firstName} ${comment.author.lastName}`
                : comment.author.username}
            </span>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>

          <p className="text-gray-700 mb-2">{comment.content.replace(/^article:[^\\n]+\\n?/, '')}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm">
            {/* Upvote */}
            <button
              onClick={() => handleVote(comment.id, 'UP')}
              className={`flex items-center gap-1 ${
                comment.userVote === 'UP'
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-green-600'
              }`}
            >
              {comment.userVote === 'UP' ? (
                <HandThumbUpSolidIcon className="w-4 h-4" />
              ) : (
                <HandThumbUpIcon className="w-4 h-4" />
              )}
              <span>{comment.upvoteCount}</span>
            </button>

            {/* Downvote */}
            <button
              onClick={() => handleVote(comment.id, 'DOWN')}
              className={`flex items-center gap-1 ${
                comment.userVote === 'DOWN'
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              {comment.userVote === 'DOWN' ? (
                <HandThumbDownSolidIcon className="w-4 h-4" />
              ) : (
                <HandThumbDownIcon className="w-4 h-4" />
              )}
              <span>{comment.downvoteCount}</span>
            </button>

            {/* Reply */}
            {!isReply && isAuthenticated && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setNewComment('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ChatBubbleLeftIcon className="w-6 h-6" />
        Comments ({comments.length})
      </h3>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* New Comment Input */}
      {isAuthenticated ? (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={replyTo ? '' : newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Share your thoughts... (Earn 15 CE points!)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!!replyTo}
          />
          <button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim() || !!replyTo}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            Post
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            <a href="/auth/login" className="text-blue-600 hover:underline">
              Log in
            </a>{' '}
            to join the conversation and earn CE points!
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
