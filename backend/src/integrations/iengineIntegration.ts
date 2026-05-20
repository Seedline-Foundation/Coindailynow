/**
 * Iengine Integration
 * Mounts the AI Visual Journalism Intelligence Engine routes
 * into the CoinDaily backend Express app.
 */

import { Express } from 'express';

export function integrateIengineRoutes(app: Express): void {
  try {
    const { default: iengineRouter } = require('../../Iengine/api/routes');

    app.use('/api/iengine', iengineRouter);

    console.log('[Backend] Iengine routes mounted at /api/iengine');
  } catch (error: any) {
    console.warn('[Backend] Iengine integration skipped:', error.message);
  }
}

export default integrateIengineRoutes;
