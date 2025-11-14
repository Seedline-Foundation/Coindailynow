/**
 * Collaboration Panel Component - Real-time collaboration features for CMS
 * Features: Online users, comment threads, live cursors, activity feed
 */

'use client';

import React, { useState } from 'react';
import { 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ClockIcon,
  PlusIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { User } from '../../services/cmsService';

interface CollaborationPanelProps {
  collaborators: Array<{
    id: string;
    name: string;
    lastSeen: Date;
  }>;
  currentUser: User;
  articleId?: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies?: Comment[];
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
  details?: string;
}

const CollaboratorAvatar: React.FC<{
  collaborator: { id: string; name: string; lastSeen: Date };
  isOnline: boolean;
}> = ({ collaborator, isOnline }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
          {getInitials(collaborator.name)}
        </div>
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent-500 rounded-full border-2 border-white dark:border-neutral-800"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
          {collaborator.name}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {isOnline ? 'Online' : getTimeAgo(collaborator.lastSeen)}
        </p>
      </div>
    </div>
  );
};

const CommentThread: React.FC<{
  comments: Comment[];
  onAddComment: (content: string) => void;
  onResolveComment: (commentId: string) => void;
}> = ({ comments, onAddComment, onResolveComment }) => {
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
      setShowCommentForm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
          Comments ({comments.length})
        </h4>
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="p-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
          title="Add Comment"
          aria-label="Add comment"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Comment form */}
      {showCommentForm && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm resize-none"
          />
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCommentForm(false)}
              className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-3 w-3" />
              <span>Post Comment</span>
            </button>
          </div>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`p-3 rounded-md border ${
              comment.resolved 
                ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 opacity-75'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {comment.userName}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {comment.timestamp.toLocaleString()}
                  </span>
                </div>
                {!comment.resolved && (
                  <button
                    onClick={() => onResolveComment(comment.id)}
                    className="text-xs text-accent-600 hover:text-accent-800 dark:text-accent-400"
                  >
                    Resolve
                  </button>
                )}
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {comment.content}
              </p>
              {comment.resolved && (
                <span className="inline-block mt-2 text-xs text-accent-600 dark:text-accent-400 font-medium">
                  ✓ Resolved
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ActivityFeed: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'edit':
        return <EyeIcon className="h-3 w-3 text-primary-600" />;
      case 'comment':
        return <ChatBubbleLeftRightIcon className="h-3 w-3 text-secondary-600" />;
      default:
        return <ClockIcon className="h-3 w-3 text-neutral-400" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
        Recent Activity
      </h4>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-2">
            No recent activity
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-2 text-sm">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-neutral-900 dark:text-white">
                  {activity.userName}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400 ml-1">
                  {activity.action === 'edit' && 'edited the article'}
                  {activity.action === 'comment' && 'added a comment'}
                  {activity.details && `: ${activity.details}`}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400 text-xs ml-2">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  collaborators,
  currentUser,
  articleId
}) => {
  // Mock data - in a real app, this would come from props or API calls
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Jane Smith',
      content: 'This section needs revision. The information about Binance Africa seems outdated.',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      resolved: false
    },
    {
      id: '2',
      userId: '3',
      userName: 'Bob Johnson',
      content: 'Great analysis on the M-Pesa integration section!',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      resolved: true
    }
  ]);

  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Jane Smith',
      action: 'edit',
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
      details: 'Updated introduction paragraph'
    },
    {
      id: '2',
      userId: '3',
      userName: 'Bob Johnson',
      action: 'comment',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    }
  ]);

  const handleAddComment = (content: string) => {
    // In a real app, this would make an API call
    console.log('Adding comment:', content);
  };

  const handleResolveComment = (commentId: string) => {
    // In a real app, this would make an API call
    console.log('Resolving comment:', commentId);
  };

  // Check which collaborators are currently online (last seen within 5 minutes)
  const now = new Date();
  const onlineCollaborators = collaborators.filter(
    collaborator => now.getTime() - collaborator.lastSeen.getTime() < 300000
  );

  if (!articleId) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="text-center">
          <UserGroupIcon className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            Collaboration
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Save your article to enable collaboration features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="collaborators-list">
      {/* Online Collaborators */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-primary-600" />
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
              Collaborators
            </h3>
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {onlineCollaborators.length} online
          </span>
        </div>

        <div className="space-y-1">
          {collaborators.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-2">
              No other editors are currently working on this article.
            </p>
          ) : (
            collaborators.map((collaborator) => (
              <CollaboratorAvatar
                key={collaborator.id}
                collaborator={collaborator}
                isOnline={onlineCollaborators.some(oc => oc.id === collaborator.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Comment Thread */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <CommentThread
          comments={comments}
          onAddComment={handleAddComment}
          onResolveComment={handleResolveComment}
        />
      </div>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
};

export default CollaborationPanel;
