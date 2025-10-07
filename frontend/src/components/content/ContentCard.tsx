/**
 * Base Content Card Component
 * Task 53: Content Sections Grid System
 * 
 * Reusable card component for all content sections
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye, Heart, MessageCircle, Share2, TrendingUp, TrendingDown, User, Calendar, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== Base Card Props ==========

export interface BaseCardProps {
  id: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  href: string;
  publishedAt?: Date;
  author?: {
    name: string;
    avatarUrl?: string;
  };
  category?: {
    name: string;
    colorHex?: string;
    slug: string;
  };
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'breaking';
  isPremium?: boolean;
  readingTimeMinutes?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
  showImage?: boolean;
  showExcerpt?: boolean;
  showMetadata?: boolean;
  showAuthor?: boolean;
  showStats?: boolean;
  isExternal?: boolean;
  onClick?: () => void;
}

// ========== Specialized Card Props ==========

export interface NewsCardProps extends BaseCardProps {
  type: 'news';
  isBreaking?: boolean;
  sourcePublication?: string;
}

export interface CoinCardProps extends Omit<BaseCardProps, 'excerpt' | 'author'> {
  type: 'coin';
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap?: number;
  volume24h?: number;
  rank?: number;
  logoUrl?: string;
  sparklineData?: number[];
}

export interface EventCardProps extends BaseCardProps {
  type: 'event';
  startDate: Date;
  endDate?: Date;
  location?: string;
  isVirtual: boolean;
  eventType: 'conference' | 'launch' | 'upgrade' | 'announcement' | 'other';
  daysUntil?: number;
}

export interface InterviewCardProps extends BaseCardProps {
  type: 'interview';
  guest: {
    name: string;
    title: string;
    company: string;
    avatarUrl?: string;
  };
  host?: {
    name: string;
    avatarUrl?: string;
  };
  duration?: number;
  viewCount?: number;
  hasVideo?: boolean;
  hasAudio?: boolean;
}

export interface ReviewCardProps extends BaseCardProps {
  type: 'review';
  tokenSymbol: string;
  tokenName: string;
  overallScore: number;
  reviewDate: Date;
  lastUpdated: Date;
  logoUrl?: string;
  blockchain: string;
}

export interface AlertCardProps extends BaseCardProps {
  type: 'alert';
  alertType: 'scam' | 'warning' | 'security' | 'regulatory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedTokens?: string[];
}

// Union type for all card props
export type ContentCardProps = 
  | NewsCardProps 
  | CoinCardProps 
  | EventCardProps 
  | InterviewCardProps 
  | ReviewCardProps 
  | AlertCardProps;

// ========== Base Content Card Component ==========

export const ContentCard: React.FC<BaseCardProps> = ({
  id,
  title,
  excerpt,
  imageUrl,
  href,
  publishedAt,
  author,
  category,
  tags = [],
  priority = 'normal',
  isPremium = false,
  readingTimeMinutes,
  viewCount,
  likeCount,
  commentCount,
  className = '',
  size = 'medium',
  layout = 'vertical',
  showImage = true,
  showExcerpt = true,
  showMetadata = true,
  showAuthor = true,
  showStats = true,
  isExternal = false,
  onClick,
}) => {
  const sizeClasses = {
    small: 'h-64',
    medium: 'h-80',
    large: 'h-96'
  };

  const priorityBadges = {
    breaking: 'bg-red-500 text-white animate-pulse',
    high: 'bg-orange-500 text-white',
    normal: 'bg-blue-500 text-white',
    low: 'bg-gray-500 text-white'
  };

  const cardContent = (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 cursor-pointer',
      'border-border/50 hover:border-border',
      sizeClasses[size],
      'flex flex-col',
      className
    )}>
        {/* Image Section */}
        {showImage && imageUrl && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Priority Badge */}
            {priority !== 'normal' && (
              <Badge className={cn(
                'absolute top-2 left-2 text-xs',
                priorityBadges[priority]
              )}>
                {priority === 'breaking' ? '🚨 BREAKING' : priority.toUpperCase()}
              </Badge>
            )}

            {/* Premium Badge */}
            {isPremium && (
              <Badge className="absolute top-2 right-2 bg-yellow-500 text-black text-xs">
                ⭐ PREMIUM
              </Badge>
            )}

            {/* External Link Icon */}
            {isExternal && (
              <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                <ExternalLink className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        )}

        <CardContent className="flex-1 p-4 flex flex-col">
          {/* Category & Tags */}
          {showMetadata && (category || tags.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {category && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: category.colorHex + '20', color: category.colorHex }}
                >
                  {category.name}
                </Badge>
              )}
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <CardTitle className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>

          {/* Excerpt */}
          {showExcerpt && excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
              {excerpt}
            </p>
          )}

          {/* Author & Date */}
          {showAuthor && (author || publishedAt) && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              {author && (
                <div className="flex items-center gap-1">
                  {author.avatarUrl ? (
                    <Image
                      src={author.avatarUrl}
                      alt={author.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  <span>{author.name}</span>
                </div>
              )}
              {publishedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(publishedAt).toLocaleDateString()}</span>
                </div>
              )}
              {readingTimeMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{readingTimeMinutes}m read</span>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {showStats && (viewCount || likeCount || commentCount) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
              {viewCount && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{viewCount.toLocaleString()}</span>
                </div>
              )}
              {likeCount && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{likeCount.toLocaleString()}</span>
                </div>
              )}
              {commentCount && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{commentCount}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  );

  return href ? (
    <Link href={href}>
      {cardContent}
    </Link>
  ) : (
    <div onClick={onClick}>
      {cardContent}
    </div>
  );
};

// ========== Specialized Card Components ==========

export const NewsCard: React.FC<NewsCardProps> = (props) => {
  const { isBreaking, sourcePublication, ...baseProps } = props;
  
  return (
    <ContentCard
      {...baseProps}
      priority={isBreaking ? 'breaking' : baseProps.priority}
      excerpt={sourcePublication ? `${sourcePublication} • ${baseProps.excerpt}` : baseProps.excerpt}
    />
  );
};

export const CoinCard: React.FC<CoinCardProps> = ({
  id,
  title,
  href,
  symbol,
  name,
  price,
  priceChange24h,
  priceChangePercent24h,
  marketCap,
  volume24h,
  rank,
  logoUrl,
  sparklineData,
  className = '',
  size = 'medium',
  onClick,
}) => {
  const isPositive = priceChange24h >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 cursor-pointer',
      'border-border/50 hover:border-border h-32',
      className
    )} onClick={onClick}>
      <CardContent className="p-4 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <div>
              <div className="font-semibold text-sm">{symbol}</div>
              <div className="text-xs text-muted-foreground">{name}</div>
            </div>
          </div>
          {rank && (
            <Badge variant="outline" className="text-xs">
              #{rank}
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">${price.toFixed(4)}</div>
            <div className={cn(
              'flex items-center gap-1 text-sm',
              isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              <TrendIcon className="w-3 h-3" />
              {isPositive ? '+' : ''}{priceChangePercent24h.toFixed(2)}%
            </div>
          </div>
          
          {/* Sparkline (simplified) */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="w-16 h-8 flex items-end gap-px">
              {sparklineData.slice(-10).map((value, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-1 bg-current opacity-60',
                    isPositive ? 'text-green-500' : 'text-red-500'
                  )}
                  style={{
                    height: `${Math.max(10, (value / Math.max(...sparklineData)) * 100)}%`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const EventCard: React.FC<EventCardProps> = ({
  startDate,
  endDate,
  location,
  isVirtual,
  eventType,
  daysUntil,
  ...baseProps
}) => {
  const eventTypeColors = {
    conference: 'bg-blue-500',
    launch: 'bg-green-500',
    upgrade: 'bg-purple-500',
    announcement: 'bg-orange-500',
    other: 'bg-gray-500'
  };

  return (
    <ContentCard
      {...baseProps}
      excerpt={`${location || (isVirtual ? 'Virtual Event' : 'TBA')} • ${eventType.replace('_', ' ').toUpperCase()}`}
      className={cn('relative', baseProps.className)}
    />
  );
};

export const InterviewCard: React.FC<InterviewCardProps> = ({
  guest,
  host,
  duration,
  hasVideo,
  hasAudio,
  ...baseProps
}) => {
  return (
    <ContentCard
      {...baseProps}
      author={{ name: guest.name, avatarUrl: guest.avatarUrl }}
      excerpt={`${guest.title} at ${guest.company} • ${duration ? `${duration}min` : 'Interview'}`}
      className={cn('relative', baseProps.className)}
    />
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({
  tokenSymbol,
  tokenName,
  overallScore,
  reviewDate,
  logoUrl,
  blockchain,
  ...baseProps
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <ContentCard
      {...baseProps}
      title={`${tokenName} (${tokenSymbol}) Review`}
      excerpt={`${blockchain} • Score: ${overallScore}/10`}
      imageUrl={logoUrl}
      className={cn('relative', baseProps.className)}
    />
  );
};

export const AlertCard: React.FC<AlertCardProps> = ({
  alertType,
  severity,
  affectedTokens = [],
  ...baseProps
}) => {
  const severityColors = {
    critical: 'bg-red-500 text-white animate-pulse',
    high: 'bg-red-400 text-white',
    medium: 'bg-orange-500 text-white',
    low: 'bg-yellow-500 text-black'
  };

  const alertIcons = {
    scam: '🚨',
    warning: '⚠️',
    security: '🔒',
    regulatory: '📜'
  };

  return (
    <ContentCard
      {...baseProps}
      priority={severity === 'critical' ? 'breaking' : 'high'}
      excerpt={affectedTokens.length > 0 ? `Affects: ${affectedTokens.slice(0, 3).join(', ')}` : baseProps.excerpt}
      className={cn('relative border-l-4 border-l-red-500', baseProps.className)}
    />
  );
};

// ========== Card Grid Container ==========

interface ContentCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export const ContentCardGrid: React.FC<ContentCardGridProps> = ({
  children,
  columns = 3,
  gap = 'medium',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  const gapClasses = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6'
  };

  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};