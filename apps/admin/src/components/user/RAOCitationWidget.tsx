/**
 * RAO Citation Widget - User Dashboard
 * Task 74: AI Citation Enhancement
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Schema as SchemaIcon,
  Psychology as AIIcon,
  VerifiedUser as TrustIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';

export default function RAOCitationWidget() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/rao-citation/dashboard/stats');
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>AI Citation Status</Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  const optimizationScore = stats?.avgOptimizationScore || 0;
  const scoreColor = optimizationScore >= 80 ? 'success' : optimizationScore >= 60 ? 'warning' : 'error';

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">AI Citation Status</Typography>
        </Box>

        {/* Overall Score */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">LLM Optimization</Typography>
            <Chip 
              label={`${optimizationScore}%`} 
              color={scoreColor}
              size="small"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={optimizationScore} 
            color={scoreColor}
          />
        </Box>

        {/* Key Metrics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="h5" color="primary.main">
              {stats?.totalSchemaMarkups || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Schema Markups
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="h5" color="success.main">
              {stats?.totalCanonicalAnswers || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Canonical Answers
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="h5" color="warning.main">
              {stats?.totalCitations || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Citations
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="h5" color="error.main">
              {stats?.totalTrustSignals || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Trust Signals
            </Typography>
          </Box>
        </Box>

        {/* Features List */}
        <List dense>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SchemaIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="AI Schema Markup"
              secondary="Optimized for LLMs"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <TrustIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Trust Signals"
              secondary="Authoritative content"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <TrendingIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText 
              primary="Citation Tracking"
              secondary="Source attribution"
            />
          </ListItem>
        </List>

        {/* Status Message */}
        <Box 
          sx={{ 
            mt: 2, 
            p: 1.5, 
            bgcolor: scoreColor === 'success' ? 'success.light' : 'warning.light',
            borderRadius: 1,
            textAlign: 'center'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {scoreColor === 'success' 
              ? '✅ Excellent AI optimization' 
              : '⚠️ Optimization in progress'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

