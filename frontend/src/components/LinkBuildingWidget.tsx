import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Link as LinkIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
} from '@mui/icons-material';

export default function LinkBuildingWidget() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/link-building-proxy/statistics');
      const data = await res.json();

      if (data.success) {
        setStatistics(data.data);
      } else {
        setError(data.error || 'Failed to fetch data');
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  if (loading && !statistics) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Link Building & Authority
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="error">
            Error loading link building data
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const authorityScore = statistics?.authority?.authorityScore || 0;
  const getAuthorityColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Link Building & Authority
          </Typography>
          <IconButton size="small" onClick={fetchData} disabled={loading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Authority Score Overview */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="textSecondary">
              Authority Score
            </Typography>
            <Typography variant="h5" color="primary">
              {authorityScore}/100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={authorityScore}
            color={getAuthorityColor(authorityScore) as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid  item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <LinkIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="textSecondary">
                  Backlinks
                </Typography>
              </Box>
              <Typography variant="h6">
                {statistics?.overview?.activeBacklinks || 0}
              </Typography>
              <Chip
                label={`DA: ${statistics?.overview?.avgDomainAuthority || 0}`}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Grid>

          <Grid  item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <TrendingUpIcon fontSize="small" color="success" />
                <Typography variant="body2" color="textSecondary">
                  Growth
                </Typography>
              </Box>
              <Typography variant="h6">
                {statistics?.velocity?.netChange > 0 ? '+' : ''}
                {statistics?.velocity?.netChange || 0}
              </Typography>
              <Chip
                label={statistics?.velocity?.velocityTrend || 'STABLE'}
                size="small"
                color={
                  statistics?.velocity?.velocityTrend === 'GROWING'
                    ? 'success'
                    : statistics?.velocity?.velocityTrend === 'DECLINING'
                    ? 'error'
                    : 'default'
                }
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Authority Metrics */}
        {statistics?.authority && (
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Authority Metrics
            </Typography>
            <Grid container spacing={1}>
              <Grid  item xs={4}>
                <Tooltip title="Domain Authority">
                  <Box textAlign="center">
                    <Typography variant="caption" color="textSecondary">
                      DA
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {statistics.authority.domainAuthority}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid  item xs={4}>
                <Tooltip title="Trust Flow">
                  <Box textAlign="center">
                    <Typography variant="caption" color="textSecondary">
                      TF
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {statistics.authority.trustFlow}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid  item xs={4}>
                <Tooltip title="Referring Domains">
                  <Box textAlign="center">
                    <Typography variant="caption" color="textSecondary">
                      RD
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {statistics.authority.referringDomains}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Campaigns & Influencers */}
        <Box display="flex" justifyContent="space-between" mt={2} pt={2} borderTop={1} borderColor="divider">
          <Box>
            <Typography variant="caption" color="textSecondary">
              Active Campaigns
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {statistics?.overview?.activeCampaigns || 0}
            </Typography>
          </Box>
          <Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <StarIcon fontSize="small" color="warning" />
              <Typography variant="caption" color="textSecondary">
                Influencers
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" textAlign="right">
              {statistics?.overview?.influencers || 0}
            </Typography>
          </Box>
        </Box>

        {/* Recent Backlinks Preview */}
        {statistics?.recentBacklinks && statistics.recentBacklinks.length > 0 && (
          <Box mt={2} pt={2} borderTop={1} borderColor="divider">
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Recent Backlinks
            </Typography>
            {statistics.recentBacklinks.slice(0, 3).map((backlink: any, index: number) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                py={0.5}
              >
                <Typography variant="caption" noWrap sx={{ maxWidth: '60%' }}>
                  {backlink.sourceDomain}
                </Typography>
                <Box display="flex" gap={0.5}>
                  <Chip
                    label={`DA ${backlink.domainAuthority}`}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                  <Chip
                    label={backlink.linkType}
                    size="small"
                    color={backlink.linkType === 'DOFOLLOW' ? 'success' : 'default'}
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Link Velocity Status */}
        {statistics?.velocity && (
          <Box mt={2} pt={2} borderTop={1} borderColor="divider">
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Link Velocity (24h)
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="success.main">
                  +{statistics.velocity.newBacklinks} new
                </Typography>
                {' • '}
                <Typography variant="caption" color="error.main">
                  -{statistics.velocity.lostBacklinks} lost
                </Typography>
              </Box>
              <Chip
                label={`${statistics.velocity.velocityScore}/100`}
                size="small"
                color={
                  statistics.velocity.velocityScore >= 70
                    ? 'success'
                    : statistics.velocity.velocityScore >= 40
                    ? 'warning'
                    : 'error'
                }
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}



