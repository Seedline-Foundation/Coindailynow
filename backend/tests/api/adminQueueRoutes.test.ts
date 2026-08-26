import request from 'supertest';
import express from 'express';
import adminQueueRoutes from '../../src/api/admin/adminQueueRoutes';
import { AIReviewAgent } from '../../src/agents/review/aiReviewAgent';

jest.mock('../../src/middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'EDITOR' };
    next();
  },
  requireCapability: () => (req: any, res: any, next: any) => next(),
}));

jest.mock('../../src/lib/redis', () => {
  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    lrange: jest.fn(),
    lpush: jest.fn(),
    lrem: jest.fn(),
    llen: jest.fn(),
  };
  return {
    getRedis: () => mockRedis,
  };
});

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../src/agents/review/aiReviewAgent');

const app = express();
app.use(express.json());
app.use('/api/admin', adminQueueRoutes);

describe('Admin Queue Edit Request Endpoint', () => {
  let executeEditRequestSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    executeEditRequestSpy = jest.spyOn(AIReviewAgent.prototype, 'executeEditRequest').mockImplementation(
      async (id: string, editRequest: any) => {
        return {
          routing: {
            agent: editRequest.type === 'content' ? 'WriterAgent' : 'ResearchAgent',
            instructions: `Revise article: ${editRequest.instructions}`,
          },
          updatedItem: {
            id,
            article_id: 'art-1',
            status: 'pending_approval',
            submitted_at: new Date(),
            articles: {
              english: {
                id: 'art-1',
                title: 'Revised Title',
                content: 'Revised content',
                word_count: 200,
                keywords: ['crypto'],
                readability_score: 80,
                seo_score: 90,
                facts_preserved: true,
                message_consistent: true,
              },
              translations: [],
              image: {
                id: 'img-1',
                url: 'http://example.com/img.png',
                alt_text: 'Image alt text sample',
                theme_match_score: 90,
                quality_score: 90,
              },
              research: {
                id: 'res-1',
                topic: 'Crypto News',
                sources: [],
                facts: ['Fact 1'],
                core_message: 'Core message',
                word_count: 200,
                sentiment: 'neutral',
                urgency: 'low',
                trending_score: 80,
                timestamp: new Date(),
                raw_data: {},
              },
            },
          } as any,
        };
      }
    );
  });

  it('rejects invalid edit_type with 400', async () => {
    const res = await request(app)
      .post('/api/admin/queue/item-123/request-edit')
      .send({
        edit_type: 'invalid_type',
        instructions: 'Fix this',
        admin_id: 'admin-1',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid edit_type');
  });

  it('rejects translation edit without target_language with 400', async () => {
    const res = await request(app)
      .post('/api/admin/queue/item-123/request-edit')
      .send({
        edit_type: 'translation',
        instructions: 'Fix translation',
        admin_id: 'admin-1',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('target_language is required');
  });

  it('successfully executes content edit request and returns updated item', async () => {
    const res = await request(app)
      .post('/api/admin/queue/item-123/request-edit')
      .send({
        edit_type: 'content',
        instructions: 'Make the title catchier',
        admin_id: 'admin-1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('WriterAgent');
    expect(res.body.routing.agent).toBe('WriterAgent');
    expect(res.body.updated_item.articles.english.title).toBe('Revised Title');
    expect(executeEditRequestSpy).toHaveBeenCalledWith('item-123', expect.objectContaining({
      type: 'content',
      instructions: 'Make the title catchier',
      requested_by: 'admin-1',
    }));
  });
});
