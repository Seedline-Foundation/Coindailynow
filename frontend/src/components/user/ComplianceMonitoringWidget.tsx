/**
 * Compliance Monitoring Widget (User Dashboard)
 * Task 85: Compliance Monitoring Dashboard
 * 
 * Production-ready simplified compliance status widget for users.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  Google as GoogleIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

export default function ComplianceMonitoringWidget() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/compliance/statistics');
        const data = await response.json();
        setStatistics(data.data || data);
      } catch (error) {
        console.error('Error fetching compliance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Compliance Status</Typography>
        <LinearProgress />
      </Paper>
    );
  }

  const latestScore = statistics?.score || {};
  const metrics = statistics?.metrics || {};

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 75) return '#8bc34a';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'declining': return <TrendingDownIcon fontSize="small" sx={{ color: 'error.main' }} />;
      default: return <RemoveIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
    }
  };

  const getStatusText = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  };

  const overallScore = latestScore.overallScore || 0;

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Compliance Status</Typography>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Overall Score */}
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                Overall Compliance Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                  {overallScore.toFixed(1)}%
                </Typography>
                {getTrendIcon(latestScore.scoreTrend)}
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {getStatusText(overallScore)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Change
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {latestScore.scoreChange > 0 ? '+' : ''}
                {latestScore.scoreChange?.toFixed(1) || '0.0'}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ flex: '1 1 33%', minWidth: '120px', p: 0.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <GavelIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {latestScore.regulatoryScore?.toFixed(0) || '0'}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Regulatory
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: '1 1 33%', minWidth: '120px', p: 0.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <GoogleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {latestScore.seoScore?.toFixed(0) || '0'}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              SEO
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: '1 1 33%', minWidth: '120px', p: 0.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <SecurityIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {latestScore.securityScore?.toFixed(0) || '0'}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Security
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Status Summary */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip
          icon={<CheckCircleIcon />}
          label={`${metrics.compliantItems || 0} Compliant`}
          size="small"
          color="success"
          variant="outlined"
        />
        <Chip
          icon={<ErrorIcon />}
          label={`${metrics.nonCompliantItems || 0} Issues`}
          size="small"
          color="error"
          variant="outlined"
        />
        <Chip
          icon={<WarningIcon />}
          label={`${latestScore.openActions || 0} Actions`}
          size="small"
          color="warning"
          variant="outlined"
        />
      </Box>

      {/* Expanded Details */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          {/* E-E-A-T Scores */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            E-E-A-T Components
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">Experience</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.experienceScore || 0}
                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 35 }}>
                  {latestScore.experienceScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">Expertise</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.expertiseScore || 0}
                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 35 }}>
                  {latestScore.expertiseScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">Authoritativeness</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.authoritativenessScore || 0}
                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 35 }}>
                  {latestScore.authoritativenessScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">Trustworthiness</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.trustworthinessScore || 0}
                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 35 }}>
                  {latestScore.trustworthinessScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Detailed Scores */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Detailed Scores
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">GDPR</Typography>
              <LinearProgress
                variant="determinate"
                value={latestScore.gdprScore || 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">CCPA</Typography>
              <LinearProgress
                variant="determinate"
                value={latestScore.ccpaScore || 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">PCI DSS</Typography>
              <LinearProgress
                variant="determinate"
                value={latestScore.pciDssScore || 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">Google Guidelines</Typography>
              <LinearProgress
                variant="determinate"
                value={latestScore.googleGuidelinesScore || 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">Core Web Vitals</Typography>
              <LinearProgress
                variant="determinate"
                value={latestScore.coreWebVitalsScore || 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '150px', p: 1 }}>
              <Typography variant="caption">Schema Markup</Typography>
              <LinearProgress
                variant="determinate"
                value={latestScore.schemaMarkupScore || 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          </Box>

          {/* Risk Issues */}
          {(latestScore.highRiskIssues > 0 || latestScore.mediumRiskIssues > 0) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Attention Required
              </Typography>
              {latestScore.highRiskIssues > 0 && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  • {latestScore.highRiskIssues} high-risk issue(s)
                </Typography>
              )}
              {latestScore.mediumRiskIssues > 0 && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  • {latestScore.mediumRiskIssues} medium-risk issue(s)
                </Typography>
              )}
            </Alert>
          )}

          {/* Notifications */}
          {statistics?.pendingNotifications > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You have {statistics.pendingNotifications} pending compliance notification(s)
              </Typography>
            </Alert>
          )}
        </Box>
      </Collapse>

      {/* Footer */}
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2, textAlign: 'center' }}>
        Last updated: {new Date().toLocaleTimeString()} • Auto-refresh every minute
      </Typography>
    </Paper>
  );
}
