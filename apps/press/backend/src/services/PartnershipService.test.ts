import { partnershipService } from './PartnershipService';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Mock Supabase client - using lazy evaluation arrow functions to prevent TDZ/hoisting errors
const mockSingle = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();

const mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    in: mockIn,
    insert: mockInsert,
});

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: (table: string) => mockFrom(table),
    })),
}));

// Mock Nodemailer - using lazy evaluation to prevent Jest hoisting initialization issues
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = jest.fn().mockReturnValue({
    sendMail: mockSendMail,
});

jest.mock('nodemailer', () => ({
    createTransport: jest.fn((...args: any[]) => mockCreateTransport(...args)),
}));

describe('PartnershipService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_KEY = 'service-key';
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'test-user';
        process.env.SMTP_PASSWORD = 'test-password';
    });

    describe('createPartnership', () => {
        it('should successfully create a partnership and send an email notification', async () => {
            const request = {
                originatingPublisherId: 'pub-123',
                distributingSiteId: 'site-456',
                type: 'paid' as const,
                terms: {
                    billing: 'monthly' as const,
                    monthlyFee: 100,
                },
            };

            const mockPublisher = {
                id: 'pub-123',
                status: 'active',
                company_name: 'Test Publisher',
                contact_email: 'pub@example.com',
            };

            const mockSite = {
                id: 'site-456',
                domain: 'testsite.com',
                status: 'verified',
                owner_email: 'owner@testsite.com',
            };

            const mockCreatedPartnership = {
                id: 'part-789',
                originating_publisher_id: 'pub-123',
                distributing_site_id: 'site-456',
                partnership_type: 'paid',
                terms: {
                    billing: 'monthly',
                    monthlyFee: 100,
                },
                status: 'pending',
                created_at: '2026-07-11T00:00:00Z',
                updated_at: '2026-07-11T00:00:00Z',
            };

            // Setup mock chain returns
            mockSingle
                .mockResolvedValueOnce({ data: mockPublisher, error: null }) // Publisher check
                .mockResolvedValueOnce({ data: mockSite, error: null })      // Site check
                .mockResolvedValueOnce({ data: null, error: null })          // Existing check (not found)
                .mockResolvedValueOnce({ data: mockCreatedPartnership, error: null }); // Insert partnership

            const result = await partnershipService.createPartnership(request);

            expect(result).toBeDefined();
            expect(result.id).toBe('part-789');
            expect(result.originatingPublisherId).toBe('pub-123');
            expect(result.distributingSiteId).toBe('site-456');

            // Verify email was sent
            expect(mockCreateTransport).toHaveBeenCalledWith({
                host: 'smtp.test.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'test-user',
                    pass: 'test-password',
                },
            });

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            const sendMailArgs = mockSendMail.mock.calls[0][0];
            expect(sendMailArgs.to).toBe('owner@testsite.com');
            expect(sendMailArgs.subject).toContain('testsite.com');
            expect(sendMailArgs.html).toContain('Test Publisher');
            expect(sendMailArgs.html).toContain('Monthly Fee:');
            expect(sendMailArgs.html).toContain('100 JOY');
        });

        it('should still succeed even if sending email notification fails', async () => {
            const request = {
                originatingPublisherId: 'pub-123',
                distributingSiteId: 'site-456',
                type: 'paid' as const,
                terms: {
                    billing: 'monthly' as const,
                    monthlyFee: 100,
                },
            };

            const mockPublisher = {
                id: 'pub-123',
                status: 'active',
                company_name: 'Test Publisher',
                contact_email: 'pub@example.com',
            };

            const mockSite = {
                id: 'site-456',
                domain: 'testsite.com',
                status: 'verified',
                owner_email: 'owner@testsite.com',
            };

            const mockCreatedPartnership = {
                id: 'part-789',
                originating_publisher_id: 'pub-123',
                distributing_site_id: 'site-456',
                partnership_type: 'paid',
                terms: {
                    billing: 'monthly',
                    monthlyFee: 100,
                },
                status: 'pending',
                created_at: '2026-07-11T00:00:00Z',
                updated_at: '2026-07-11T00:00:00Z',
            };

            mockSingle
                .mockResolvedValueOnce({ data: mockPublisher, error: null })
                .mockResolvedValueOnce({ data: mockSite, error: null })
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValueOnce({ data: mockCreatedPartnership, error: null });

            // Mock email sending failure
            mockSendMail.mockRejectedValueOnce(new Error('SMTP connection error'));

            const result = await partnershipService.createPartnership(request);

            // Partnership should still be created and returned successfully
            expect(result).toBeDefined();
            expect(result.id).toBe('part-789');
            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });
    });
});
