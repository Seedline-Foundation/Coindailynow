'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUserPreferences } from '@/components/user/UserPreferencesContext';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  slug: string;
  image?: string;
  showInteractions?: boolean; // Manual override
  isPaidContent?: boolean; // If true, treat as sensitive/paid content
}

// Helper for SEO alt text
function getAltText(title: string, category: string) {
  return `${title} - ${category} | Africa's Largest AI Crypto News Platform`;
}

export function NewsCard({
  title,
  excerpt,
  category,
  date,
  slug,
  image,
  showInteractions,
  isPaidContent = false,
}: NewsCardProps) {
  // Get user preferences with error handling for SSR
  let preferences = { showInteractionsOnPaidContent: false };
  try {
    const userPrefs = useUserPreferences();
    preferences = userPrefs.preferences;
  } catch {
    // Context not available during SSR, use defaults
  }
  // Interactive state
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 100) + 5);
  const [sharesCount, setSharesCount] = useState(Math.floor(Math.random() * 20) + 2);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    likes: number;
  }>>([
    {
      id: '1',
      author: 'CryptoFan',
      content: 'Great news update!',
      timestamp: '1 hour ago',
      likes: 2
    }
  ]);

  // Handlers
  const handleLike = () => {
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => isLiked ? prev - 1 : prev + 1);
  };
  const handleBookmark = () => setIsBookmarked((prev) => !prev);
  const handleShare = async () => {
    setSharesCount((prev) => prev + 1);
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url: typeof window !== 'undefined' ? window.location.href : '',
        });
      } catch {
        navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
      alert('Link copied to clipboard!');
    }
  };
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: 'Anonymous User',
        content: newComment,
        timestamp: 'Just now',
        likes: 0
      };
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
    }
  };

  // Determine if interactions should be shown
  let shouldShowInteractions = true;
  if (typeof showInteractions === 'boolean') {
    shouldShowInteractions = showInteractions;
  } else if (isPaidContent) {
    shouldShowInteractions = preferences.showInteractionsOnPaidContent;
  }

  return (
    <Card className="h-full transition-all hover:shadow-md overflow-hidden">
      <Link href={slug} className="block" aria-label={getAltText(title, category)}>
        {image && (
          <div className="w-full h-48 relative">
            <Image
              src={image}
              alt={getAltText(title, category)}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="w-full h-full object-cover"
              loading="lazy"
              priority={false}
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold line-clamp-2">{title}</h3>
            <Badge variant="outline" className="whitespace-nowrap">
              {category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
        </CardContent>
      </Link>
      {/* Interactive Bar */}
      {shouldShowInteractions && (
        <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition-colors ${isLiked ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-500'}`}
                aria-label="Like this news"
                type="button"
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} /> {likesCount}
              </button>
              <button
                onClick={() => setShowComments((prev) => !prev)}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm"
                aria-label="Comment on this news"
                type="button"
              >
                <MessageCircle className="h-4 w-4" /> {comments.length}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-gray-500 hover:text-green-600 text-sm"
                aria-label="Share this news"
                type="button"
              >
                <Share2 className="h-4 w-4" /> {sharesCount}
              </button>
            </div>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition-colors ${isBookmarked ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
              aria-label="Bookmark this news"
              type="button"
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
          {/* Comments Section */}
          {showComments && (
            <div className="bg-gray-50 rounded-lg p-3 mt-2 w-full">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Comments ({comments.length})</h4>
              <div className="mb-3 flex gap-2">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
                  rows={2}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs transition-colors"
                  type="button"
                >
                  Post
                </button>
              </div>
              <div className="space-y-2">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{comment.author.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-xs">{comment.author}</span>
                          <span className="text-xs text-gray-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-gray-700 text-xs">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1" type="button">
                          <Heart className="h-3 w-3" /> {comment.likes}
                        </button>
                        <button className="text-xs text-gray-500 hover:text-blue-600" type="button">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="w-full text-right text-[11px] text-gray-400 pt-1">{date}</div>
        </CardFooter>
      )}
      {!shouldShowInteractions && (
        <CardFooter className="w-full text-right text-[11px] text-gray-400 pt-1 border-t">
          {date}
        </CardFooter>
      )}
    </Card>
  );
}