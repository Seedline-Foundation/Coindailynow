/**
 * Image Optimization Widget - Task 81
 * User dashboard widget for image optimization status
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Image as ImageIcon,
  CheckCircle,
  Speed,
  TrendingUp,
} from '@mui/icons-material';

export default function ImageOptimizationWidget() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/image-optimization/statistics');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch image optimization stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress size={40} />
      </Paper>
    );
  }

  const overview = stats?.overview || {};
  const today = stats?.today || {};
  const successRate = overview.successRate || 0;
  const compressionRatio = today.avgCompressionRatio || 0;

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <ImageIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Image Optimization</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Total Images
            </Typography>
            <Typography variant="h5">{overview.totalImages || 0}</Typography>
            <Chip
              label={`${today.totalImagesProcessed || 0} today`}
              size="small"
              color="primary"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Success Rate
            </Typography>
            <Box display="flex" alignItems="center" mt={0.5}>
              <Typography variant="h5" sx={{ mr: 1 }}>
                {successRate.toFixed(1)}%
              </Typography>
              {successRate >= 90 ? (
                <CheckCircle color="success" />
              ) : (
                <Speed color="warning" />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={successRate}
              sx={{ mt: 1 }}
              color={successRate >= 90 ? 'success' : 'warning'}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Bytes Saved
            </Typography>
            <Typography variant="h6" color="success.main">
              {formatBytes(today.totalBytesSaved || 0)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Today
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Compression
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" color="primary.main">
                {compressionRatio.toFixed(1)}%
              </Typography>
              <TrendingUp color="success" sx={{ ml: 0.5 }} fontSize="small" />
            </Box>
            <Typography variant="caption" color="textSecondary">
              Avg Ratio
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {overview.processingImages > 0 && (
        <Box mt={2}>
          <Chip
            label={`${overview.processingImages} images processing`}
            size="small"
            color="info"
            icon={<CircularProgress size={16} />}
          />
        </Box>
      )}

      <Box mt={2}>
        <Typography variant="caption" color="textSecondary">
          Status: All systems operational
        </Typography>
      </Box>
    </Paper>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
