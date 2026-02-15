/**
 * SENDPRESS Backend API Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import sitesRouter from './routes/sites';
import distributionsRouter from './routes/distributions';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['https://press.coindaily.online'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sendpress-api', version: '1.0.0' });
});

// API Routes
app.use('/api/sites', sitesRouter);
app.use('/api/distributions', distributionsRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`[SENDPRESS API] Running on port ${PORT}`);
});

export default app;
