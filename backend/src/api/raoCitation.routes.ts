/**
 * RAO Metadata, Schema & AI Citation Optimization Routes
 * Task 74: AI Citation Enhancement
 */

import express from 'express';
import * as raoCitationService from '../services/raoCitationService';

const router = express.Router();

// Schema Markup Routes
router.post('/schema-markup', async (req, res) => {
  try {
    const result = await raoCitationService.generateSchemaMarkup(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// LLM Metadata Routes
router.post('/llm-metadata', async (req, res) => {
  try {
    const result = await raoCitationService.generateLLMMetadata(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Canonical Answer Routes
router.post('/canonical-answer', async (req, res) => {
  try {
    const result = await raoCitationService.createCanonicalAnswer(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Source Citation Routes
router.post('/citation', async (req, res) => {
  try {
    const result = await raoCitationService.createSourceCitation(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trust Signal Routes
router.post('/trust-signal', async (req, res) => {
  try {
    const result = await raoCitationService.addTrustSignal(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// RAO Metrics Routes
router.get('/metrics/:contentId', async (req, res) => {
  try {
    const metrics = await raoCitationService.getRAOCitationMetrics(req.params.contentId);
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/metrics/:contentId/update', async (req, res) => {
  try {
    const result = await raoCitationService.updateRAOCitationMetrics(req.params.contentId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await raoCitationService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
