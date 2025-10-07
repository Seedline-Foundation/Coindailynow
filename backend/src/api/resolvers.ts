import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './context';
import { authResolvers } from './auth-resolvers';
import { cmsResolvers } from './cms-resolvers';
import { translationResolvers } from './translationResolvers';
import { workflowResolvers } from './workflowResolvers';
import { analyticsResolvers } from './graphql/resolvers/analyticsResolvers';
import { legalResolvers } from './resolvers/legal.resolvers';

export const resolvers: IResolvers<any, GraphQLContext> = {
  Query: {
    // Health check
    health: () => ({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }),

    // User queries
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return await context.prisma.user.findUnique({
        where: { id },
        include: { UserProfile: true }
      });
    },

    users: async (_: any, { limit = 50, offset = 0 }: { limit?: number; offset?: number }, context: GraphQLContext) => {
      return await context.prisma.user.findMany({
        take: limit,
        skip: offset,
        include: { UserProfile: true },
        orderBy: { createdAt: 'desc' }
      });
    },

    // Article queries
    article: async (_: any, { id, slug }: { id?: string; slug?: string }, context: GraphQLContext) => {
      const where = id ? { id } : slug ? { slug } : { id: '' };
      return await context.prisma.article.findUnique({
        where,
        include: {
          User: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true } },
          Category: true,
          ArticleTranslation: true
        }
      });
    },

    articles: async (_: any, { limit = 20, offset = 0, categoryId, isPremium, status = 'PUBLISHED' }: { 
      limit?: number; offset?: number; categoryId?: string; isPremium?: boolean; status?: string 
    }, context: GraphQLContext) => {
      const where: any = { status };
      if (categoryId) where.categoryId = categoryId;
      if (isPremium !== undefined) where.isPremium = isPremium;

      return await context.prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          User: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true } },
          Category: true
        },
        orderBy: { publishedAt: 'desc' }
      });
    },

    // Category queries
    categories: async (_: any, { parentId }: { parentId?: string }, context: GraphQLContext) => {
      return await context.prisma.category.findMany({
        where: parentId ? { parentId } : { parentId: null },
        orderBy: { sortOrder: 'asc' }
      });
    },

    category: async (_: any, { id, slug }: { id?: string; slug?: string }, context: GraphQLContext) => {
      const where = id ? { id } : slug ? { slug } : { id: '' };
      return await context.prisma.category.findUnique({
        where,
        include: { Category: true }
      });
    },

    // Token queries
    token: async (_: any, { id, symbol, slug }: { id?: string; symbol?: string; slug?: string }, context: GraphQLContext) => {
      let where: any = {};
      if (id) where.id = id;
      else if (symbol) where.symbol = symbol;
      else if (slug) where.slug = slug;

      return await context.prisma.token.findFirst({
        where,
        include: {
          MarketData: { orderBy: { timestamp: 'desc' }, take: 1 }
        }
      });
    },

    tokens: async (_: any, { limit = 100, offset = 0, isListed = true }: { 
      limit?: number; offset?: number; isListed?: boolean; 
    }, context: GraphQLContext) => {
      return await context.prisma.token.findMany({
        where: { isListed },
        take: limit,
        skip: offset,
        include: {
          MarketData: { orderBy: { timestamp: 'desc' }, take: 1 }
        },
        orderBy: { marketCap: 'desc' }
      });
    },

    // Merge auth queries
    ...((authResolvers as any).Query || {}),

    // Merge CMS queries
    ...((cmsResolvers as any).Query || {}),

    // Merge translation queries
    ...((translationResolvers as any).Query || {}),

    // Merge workflow queries - Task 8
    ...((workflowResolvers as any).Query || {}),

    // Merge analytics queries - Task 18
    ...((analyticsResolvers as any).Query || {}),

    // Merge legal queries - Task 30
    ...((legalResolvers as any).Query || {})
  },

  Mutation: {
    // Merge auth mutations
    ...((authResolvers as any).Mutation || {}),

    // Merge CMS mutations
    ...((cmsResolvers as any).Mutation || {}),

    // Merge translation mutations
    ...((translationResolvers as any).Mutation || {}),

    // Merge workflow mutations - Task 8
    ...((workflowResolvers as any).Mutation || {}),

    // Merge analytics mutations - Task 18
    ...((analyticsResolvers as any).Mutation || {}),

    // Merge legal mutations - Task 30
    ...((legalResolvers as any).Mutation || {})
  },

  // Type resolvers
  User: {
    articles: async (parent: any, { limit = 10 }: { limit?: number }, context: GraphQLContext) => {
      return await context.prisma.article.findMany({
        where: { authorId: parent.id },
        take: limit,
        include: { Category: true },
        orderBy: { createdAt: 'desc' }
      });
    },

    subscription: async (parent: any, _: any, context: GraphQLContext) => {
      return await context.prisma.subscription.findUnique({
        where: { userId: parent.id }
      });
    }
  },

  Article: {
    author: async (parent: any, _: any, context: GraphQLContext) => {
      return await context.prisma.user.findUnique({
        where: { id: parent.authorId },
        select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
      });
    },

    category: async (parent: any, _: any, context: GraphQLContext) => {
      return await context.prisma.category.findUnique({
        where: { id: parent.categoryId }
      });
    },
    
    tags: (parent: any) => {
      try {
        return parent.tags ? JSON.parse(parent.tags) : [];
      } catch {
        return [];
      }
    },

    translations: async (parent: any, _: any, context: GraphQLContext) => {
      return await context.prisma.articleTranslation.findMany({
        where: { articleId: parent.id }
      });
    }
  },

  Category: {
    subcategories: async (parent: any, _: any, context: GraphQLContext) => {
      return await context.prisma.category.findMany({
        where: { parentId: parent.id },
        orderBy: { sortOrder: 'asc' }
      });
    }
  },

  // Task 8: Workflow field resolvers
  ...((workflowResolvers as any).ContentWorkflow ? { ContentWorkflow: (workflowResolvers as any).ContentWorkflow } : {}),
  ...((workflowResolvers as any).WorkflowStep ? { WorkflowStep: (workflowResolvers as any).WorkflowStep } : {}),
  ...((workflowResolvers as any).WorkflowNotification ? { WorkflowNotification: (workflowResolvers as any).WorkflowNotification } : {}),

  // Date scalar
  DateTime: {
    serialize: (date: any) => date instanceof Date ? date.toISOString() : date,
    parseValue: (value: any) => typeof value === 'string' ? new Date(value) : value,
    parseLiteral: (ast: any) => ast.kind === 'StringValue' ? new Date(ast.value) : null
  }
};
