/**
 * Community Resolvers
 * Handles community posts, voting, and interactions
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from '../context';
import { v4 as uuidv4 } from 'uuid';

// Types
interface CreateCommunityPostInput {
  title?: string;
  content: string;
  postType?: 'TEXT' | 'LINK' | 'IMAGE' | 'VIDEO' | 'POLL';
  parentId?: string;
  tokenMentions?: string[];
  mediaUrls?: string[];
  articleId?: string; // For comments on articles
}

interface VoteType {
  UP: 'UP';
  DOWN: 'DOWN';
}

export const communityResolvers: IResolvers<any, GraphQLContext> = {
  Query: {
    // Get single community post by ID
    communityPost: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return await context.prisma.communityPost.findUnique({
        where: { id },
        include: {
          User: {
            select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
          },
          other_CommunityPost: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              User: {
                select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
              }
            }
          },
          Vote: true
        }
      });
    },

    // Get community posts with filters
    communityPosts: async (_: any, { 
      limit = 20, 
      offset = 0, 
      postType, 
      authorId,
      parentId,
      moderationStatus = 'APPROVED'
    }: { 
      limit?: number; 
      offset?: number; 
      postType?: string;
      authorId?: string;
      parentId?: string;
      moderationStatus?: string;
    }, context: GraphQLContext) => {
      const where: any = { 
        moderationStatus,
        deletedAt: null
      };
      
      if (postType) where.postType = postType;
      if (authorId) where.authorId = authorId;
      if (parentId !== undefined) where.parentId = parentId;

      return await context.prisma.communityPost.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
          },
          Vote: true
        }
      });
    },

    // Get article comments
    articleComments: async (_: any, { 
      articleId, 
      limit = 20, 
      offset = 0 
    }: { 
      articleId: string; 
      limit?: number; 
      offset?: number;
    }, context: GraphQLContext) => {
      // Comments are stored as CommunityPosts with parentId = null and linked to article via content
      return await context.prisma.communityPost.findMany({
        where: {
          content: { contains: `article:${articleId}` },
          parentId: null,
          moderationStatus: 'APPROVED',
          deletedAt: null
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
          },
          other_CommunityPost: {
            take: 5,
            where: { moderationStatus: 'APPROVED', deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
              User: {
                select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
              }
            }
          },
          Vote: true
        }
      });
    }
  },

  Mutation: {
    // Create a new community post
    createPost: async (_: any, { input }: { input: CreateCommunityPostInput }, context: GraphQLContext) => {
      // Require authentication
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const postId = uuidv4();
      
      // Check for unlisted token mentions (moderation)
      let moderationStatus = 'APPROVED';
      let violationReason: string | null = null;
      
      if (input.tokenMentions && input.tokenMentions.length > 0) {
        // Check if mentioned tokens are listed
        const tokens = await context.prisma.token.findMany({
          where: {
            symbol: { in: input.tokenMentions.map(t => t.toUpperCase()) }
          }
        });
        
        const listedTokens = tokens.filter(t => t.isListed).map(t => t.symbol);
        const unlistedMentions = input.tokenMentions.filter(
          t => !listedTokens.includes(t.toUpperCase())
        );
        
        if (unlistedMentions.length > 0) {
          moderationStatus = 'PENDING';
          violationReason = `Unlisted token mentions: ${unlistedMentions.join(', ')}`;
        }
      }

      const post = await context.prisma.communityPost.create({
        data: {
          id: postId,
          authorId: context.user.id,
          title: input.title,
          content: input.articleId ? `article:${input.articleId}\n${input.content}` : input.content,
          postType: input.postType || 'TEXT',
          parentId: input.parentId,
          tokenMentions: input.tokenMentions ? JSON.stringify(input.tokenMentions) : null,
          mediaUrls: input.mediaUrls ? JSON.stringify(input.mediaUrls) : null,
          moderationStatus,
          violationReason,
          updatedAt: new Date()
        },
        include: {
          User: {
            select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
          }
        }
      });

      // Update parent comment count if this is a reply
      if (input.parentId) {
        await context.prisma.communityPost.update({
          where: { id: input.parentId },
          data: { commentCount: { increment: 1 } }
        });
      }

      // Award CE points for creating a post (if approved)
      if (moderationStatus === 'APPROVED') {
        await awardCEPoints(context, context.user.id, 'COMMENT', 15, postId, 'Created community post');
      }

      return post;
    },

    // Update a community post
    updatePost: async (_: any, { id, content }: { id: string; content: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Check ownership
      const post = await context.prisma.communityPost.findUnique({
        where: { id }
      });

      if (!post || post.authorId !== context.user.id) {
        throw new Error('Unauthorized to update this post');
      }

      return await context.prisma.communityPost.update({
        where: { id },
        data: { content, updatedAt: new Date() },
        include: {
          User: {
            select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
          }
        }
      });
    },

    // Delete a community post
    deletePost: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const post = await context.prisma.communityPost.findUnique({
        where: { id }
      });

      if (!post || (post.authorId !== context.user.id && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Unauthorized to delete this post');
      }

      // Soft delete
      await context.prisma.communityPost.update({
        where: { id },
        data: { deletedAt: new Date(), updatedAt: new Date() }
      });

      return true;
    },

    // Vote on a post
    votePost: async (_: any, { postId, voteType }: { postId: string; voteType: 'UP' | 'DOWN' }, context: GraphQLContext) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const voteId = uuidv4();

      // Check for existing vote
      const existingVote = await context.prisma.vote.findFirst({
        where: {
          postId,
          userId: context.user.id
        }
      });

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // Remove vote (toggle off)
          await context.prisma.vote.delete({
            where: { id: existingVote.id }
          });
          
          // Update post counts
          await context.prisma.communityPost.update({
            where: { id: postId },
            data: {
              upvoteCount: voteType === 'UP' ? { decrement: 1 } : undefined,
              downvoteCount: voteType === 'DOWN' ? { decrement: 1 } : undefined
            }
          });

          return { id: existingVote.id, voteType, removed: true };
        } else {
          // Change vote
          await context.prisma.vote.update({
            where: { id: existingVote.id },
            data: { voteType }
          });

          // Update post counts
          await context.prisma.communityPost.update({
            where: { id: postId },
            data: {
              upvoteCount: voteType === 'UP' ? { increment: 1 } : { decrement: 1 },
              downvoteCount: voteType === 'DOWN' ? { increment: 1 } : { decrement: 1 }
            }
          });

          return { id: existingVote.id, voteType, changed: true };
        }
      }

      // Create new vote
      const vote = await context.prisma.vote.create({
        data: {
          id: voteId,
          postId,
          userId: context.user.id,
          voteType,
          createdAt: new Date()
        }
      });

      // Update post counts
      await context.prisma.communityPost.update({
        where: { id: postId },
        data: {
          upvoteCount: voteType === 'UP' ? { increment: 1 } : undefined,
          downvoteCount: voteType === 'DOWN' ? { increment: 1 } : undefined
        }
      });

      // Award CE points for voting
      await awardCEPoints(context, context.user.id, 'LIKE', 3, postId, 'Voted on post');

      return vote;
    },

    // Share an article (earn CE points)
    shareArticle: async (_: any, { articleId, platform }: { articleId: string; platform: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Track share
      await context.prisma.article.update({
        where: { id: articleId },
        data: { shareCount: { increment: 1 } }
      });

      // Award CE points for sharing
      await awardCEPoints(context, context.user.id, 'SHARE', 10, articleId, `Shared article on ${platform}`);

      return { success: true, pointsEarned: 10 };
    },

    // React to an article
    reactToArticle: async (_: any, { articleId, reactionType }: { articleId: string; reactionType: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Update article likes
      await context.prisma.article.update({
        where: { id: articleId },
        data: { likeCount: { increment: 1 } }
      });

      // Award CE points for reaction
      await awardCEPoints(context, context.user.id, 'LIKE', 3, articleId, `Reacted to article: ${reactionType}`);

      return { success: true, pointsEarned: 3 };
    }
  },

  // Type resolvers
  CommunityPost: {
    author: (parent: any) => parent.User,
    replies: (parent: any) => parent.other_CommunityPost || [],
    tokenMentions: (parent: any) => {
      try {
        return parent.tokenMentions ? JSON.parse(parent.tokenMentions) : [];
      } catch {
        return [];
      }
    },
    mediaUrls: (parent: any) => {
      try {
        return parent.mediaUrls ? JSON.parse(parent.mediaUrls) : [];
      } catch {
        return [];
      }
    },
    votes: (parent: any) => parent.Vote || []
  }
};

// Helper function to award CE points
async function awardCEPoints(
  context: GraphQLContext, 
  userId: string, 
  rewardType: string, 
  points: number, 
  sourceId: string,
  description: string
) {
  try {
    // Create reward record
    await context.prisma.userReward.create({
      data: {
        userId,
        rewardType,
        points,
        source: sourceId,
        sourceType: 'COMMUNITY',
        description,
        isProcessed: true,
        processedAt: new Date(),
        createdAt: new Date()
      }
    });

    // Update user's CE points balance (in User table or separate wallet)
    // This would connect to the wallet system
    console.log(`Awarded ${points} CE points to user ${userId} for ${rewardType}`);
    
    return true;
  } catch (error) {
    console.error('Failed to award CE points:', error);
    return false;
  }
}

export default communityResolvers;
