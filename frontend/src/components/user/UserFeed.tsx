'use client';

import React, { useState, useEffect } from 'react';
import { UserFeedSystem, Post, User, Topic, LivePodcast } from '../../types/user';
import ArticleReactionsComponent from './ArticleReactions';

interface UserFeedProps {
  user: User;
  feedSystem: UserFeedSystem;
}

export default function UserFeed({ user, feedSystem }: UserFeedProps) {
  const [activeTab, setActiveTab] = useState<'following' | 'topics' | 'trending' | 'live'>('following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedData();
  }, [activeTab]);

  const loadFeedData = async () => {
    setLoading(true);
    try {
      let feedPosts: Post[] = [];
      
      switch (activeTab) {
        case 'following':
          feedPosts = feedSystem.feedSources.followingPosts;
          break;
        case 'topics':
          feedPosts = feedSystem.feedSources.followingTopics;
          break;
        case 'trending':
          feedPosts = feedSystem.feedSources.trendingFeed;
          break;
        default:
          feedPosts = feedSystem.feedSources.generalFeed;
      }
      
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = (postId: string, reactionType: string) => {
    // Handle reaction logic
    console.log(`Reacting to post ${postId} with ${reactionType}`);
  };

  const handleComment = (postId: string) => {
    // Handle comment logic
    console.log(`Commenting on post ${postId}`);
  };

  const handleShare = (postId: string, platform: string) => {
    // Handle share logic
    console.log(`Sharing post ${postId} on ${platform}`);
  };

  const handleRetweet = (postId: string) => {
    // Handle retweet logic
    console.log(`Retweeting post ${postId}`);
  };

  const handlePromote = (postId: string) => {
    // Handle promote logic
    console.log(`Promoting post ${postId}`);
  };

  const handleReport = (postId: string, reason: string) => {
    // Handle report logic
    console.log(`Reporting post ${postId} for ${reason}`);
  };

  const handleBlock = (postId: string) => {
    // Handle block logic
    console.log(`Blocking user of post ${postId}`);
  };

  const handleFollowTopic = (postId: string) => {
    // Handle follow topic logic
    console.log(`Following topic from post ${postId}`);
  };

  const handleCopyLink = (postId: string) => {
    // Handle copy link logic
    console.log(`Copying link for post ${postId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Feed Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Your Feed</h1>
          
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'following', label: 'Following Users', count: feedSystem.feedSources.followingPosts.length },
                  { id: 'topics', label: 'Following Topics', count: feedSystem.feedSources.followingTopics.length },
                  { id: 'trending', label: 'Trending', count: feedSystem.feedSources.trendingFeed.length },
                  { id: 'live', label: 'Live', count: feedSystem.liveContent.livePodcasts.ongoing.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            {activeTab === 'live' ? (
              <LiveContent liveContent={feedSystem.liveContent} user={user} />
            ) : (
              <PostsFeed 
                posts={posts}
                loading={loading}
                user={user}
                onReaction={handleReaction}
                onComment={handleComment}
                onShare={handleShare}
                onRetweet={handleRetweet}
                onPromote={handlePromote}
                onReport={handleReport}
                onBlock={handleBlock}
                onFollowTopic={handleFollowTopic}
                onCopyLink={handleCopyLink}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FeedSidebar user={user} feedSystem={feedSystem} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Posts Feed Component
function PostsFeed({ 
  posts, 
  loading, 
  user,
  onReaction,
  onComment,
  onShare,
  onRetweet,
  onPromote,
  onReport,
  onBlock,
  onFollowTopic,
  onCopyLink
}: {
  posts: Post[];
  loading: boolean;
  user: User;
  onReaction: (postId: string, reactionType: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string, platform: string) => void;
  onRetweet: (postId: string) => void;
  onPromote: (postId: string) => void;
  onReport: (postId: string, reason: string) => void;
  onBlock: (postId: string) => void;
  onFollowTopic: (postId: string) => void;
  onCopyLink: (postId: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-medium mb-2">No posts to show</h3>
          <p>Follow some users or topics to see their posts in your feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Post Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={post.author.avatar || '/default-avatar.png'}
                alt={post.author.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {post.author.displayName}
                  {post.author.isVerified && (
                    <span className="ml-2 text-blue-500">✓</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </div>
              </div>
              {post.isPromoted && (
                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  Promoted
                </div>
              )}
            </div>

            {/* Post Content */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {post.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {post.excerpt}
            </p>
            
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reactions Component */}
          <ArticleReactionsComponent
            post={post}
            user={user}
            onReact={(reactionType) => onReaction(post.id, reactionType)}
            onComment={() => onComment(post.id)}
            onShare={(platform) => onShare(post.id, platform)}
            onRetweet={() => onRetweet(post.id)}
            onPromote={() => onPromote(post.id)}
            onReport={(reason) => onReport(post.id, reason)}
            onBlock={() => onBlock(post.id)}
            onFollowTopic={() => onFollowTopic(post.id)}
            onCopyLink={() => onCopyLink(post.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Live Content Component
function LiveContent({ liveContent, user }: { liveContent: any; user: User }) {
  return (
    <div className="space-y-6">
      {/* Ongoing Podcasts */}
      {liveContent.livePodcasts.ongoing.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🔴 Live Now
          </h3>
          <div className="space-y-4">
            {liveContent.livePodcasts.ongoing.map((podcast: LivePodcast) => (
              <div key={podcast.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{podcast.title}</h4>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{podcast.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {podcast.listeners.length} listeners
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                    Join Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Podcasts */}
      {liveContent.livePodcasts.scheduled.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📅 Scheduled Podcasts
          </h3>
          <div className="space-y-4">
            {liveContent.livePodcasts.scheduled.map((podcast: LivePodcast) => (
              <div key={podcast.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{podcast.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{podcast.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Starts: {new Date(podcast.startTime).toLocaleString()}
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Remind Me
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Host Podcast Option */}
      {liveContent.livePodcasts.canHostPodcast && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🎙️ Host a Podcast
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Share your insights with the community by hosting a live podcast.
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium">
            Start Live Podcast
          </button>
        </div>
      )}
    </div>
  );
}

// Feed Sidebar Component
function FeedSidebar({ user, feedSystem }: { user: User; feedSystem: UserFeedSystem }) {
  return (
    <div className="space-y-6">
      {/* Following Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Following</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Users:</span>
            <span className="font-medium">{feedSystem.feedSources.followingPosts.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Topics:</span>
            <span className="font-medium">{feedSystem.feedSources.followingTopics.length}</span>
          </div>
        </div>
      </div>

      {/* Feed Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Feed Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Algorithm:</label>
            <select className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
              <option value="relevance">Relevance</option>
              <option value="chronological">Chronological</option>
              <option value="engagement">Most Engaged</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show promoted posts</span>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Hide seen posts</span>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Trending Topics</h3>
        <div className="space-y-2">
          {['#Bitcoin', '#DeFi', '#NFTs', '#Altcoins', '#Trading'].map((topic) => (
            <button
              key={topic}
              className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}