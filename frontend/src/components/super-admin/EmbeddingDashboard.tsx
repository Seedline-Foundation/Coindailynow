/**
 * Semantic Embedding & Vector Index Management Dashboard
 * Task 72: Super Admin interface for managing embeddings, entities, and search
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Refresh,
  Search,
  Build,
  Insights,
  Category,
  TrendingUp,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
} from '@mui/icons-material';

interface EmbeddingStats {
  embeddings: {
    total: number;
    active: number;
    byType: {
      article: number;
      chunk: number;
      other: number;
    };
    avgQualityScore: number;
  };
  entities: {
    total: number;
    verified: number;
    verificationRate: number;
  };
  queue: {
    pending: number;
    failed: number;
    healthStatus: string;
  };
}

interface Entity {
  id: string;
  name: string;
  entityType: string;
  category?: string;
  mentionCount: number;
  isVerified: boolean;
  confidence: number;
}

interface SearchAnalytics {
  totalSearches: number;
  avgQueryTimeMs: number;
  searchesByType: Array<{ type: string; count: number }>;
  topQueries: Array<{ query: string; count: number }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} style={{ paddingTop: 24 }}>
    {value === index && <Box>{children}</Box>}
  </div>
);

export default function EmbeddingDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityType, setEntityType] = useState('');
  const [rebuildDialog, setRebuildDialog] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, entitiesRes, analyticsRes] = await Promise.all([
        fetch('/api/embedding/stats'),
        fetch('/api/embedding/entities?limit=50'),
        fetch('/api/embedding/search-analytics?days=7'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (entitiesRes.ok) {
        const data = await entitiesRes.json();
        setEntities(data.entities || []);
      }
      if (analyticsRes.ok) setSearchAnalytics(await analyticsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessQueue = async () => {
    setProcessing(true);
    setAlert(null);
    try {
      const res = await fetch('/api/embedding/process-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      });

      if (res.ok) {
        const result = await res.json();
        setAlert({
          type: 'success',
          message: `Processed ${result.processed} items: ${result.successful} successful, ${result.failed} failed`,
        });
        loadData();
      } else {
        throw new Error('Failed to process queue');
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleRebuildIndex = async () => {
    setProcessing(true);
    setAlert(null);
    setRebuildDialog(false);
    try {
      const res = await fetch('/api/embedding/rebuild-index', {
        method: 'POST',
      });

      if (res.ok) {
        const result = await res.json();
        setAlert({
          type: 'success',
          message: `Index rebuilt: ${result.articlesQueued} articles queued in ${result.buildTimeMs}ms`,
        });
        loadData();
      } else {
        throw new Error('Failed to rebuild index');
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleSearchEntities = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (entityType) params.append('type', entityType);
      params.append('limit', '50');

      const res = await fetch(`/api/embedding/entities?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities || []);
      }
    } catch (error) {
      console.error('Error searching entities:', error);
    }
  };

  const handleTestSearch = async () => {
    if (!testSearchQuery.trim()) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/embedding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testSearchQuery,
          limit: 10,
          keywordWeight: 0.5,
          vectorWeight: 0.5,
        }),
      });

      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error testing search:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading embedding data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Semantic Embedding & Vector Search</Typography>
        <Box>
          <Button
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={processing}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Build />}
            onClick={() => setRebuildDialog(true)}
            disabled={processing}
          >
            Rebuild Index
          </Button>
        </Box>
      </Box>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Embeddings
            </Typography>
            <Typography variant="h4">{stats?.embeddings.total.toLocaleString()}</Typography>
            <Typography variant="body2" color="textSecondary">
              {stats?.embeddings.active} active
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Quality Score
            </Typography>
            <Typography variant="h4">{stats?.embeddings.avgQualityScore}/100</Typography>
            <LinearProgress
              variant="determinate"
              value={stats?.embeddings.avgQualityScore || 0}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Entities Recognized
            </Typography>
            <Typography variant="h4">{stats?.entities.total.toLocaleString()}</Typography>
            <Typography variant="body2" color="textSecondary">
              {stats?.entities.verificationRate}% verified
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Queue Status
            </Typography>
            <Typography variant="h4">{stats?.queue.pending}</Typography>
            <Chip
              label={stats?.queue.healthStatus}
              color={stats?.queue.healthStatus === 'healthy' ? 'success' : 'warning'}
              size="small"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<Category />} label="Overview" />
          <Tab icon={<Category />} label="Entities" />
          <Tab icon={<Search />} label="Test Search" />
          <Tab icon={<Insights />} label="Analytics" />
          <Tab icon={<Schedule />} label="Queue" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Embeddings by Type
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Articles</Typography>
                    <Typography fontWeight="bold">
                      {stats?.embeddings.byType.article.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Chunks</Typography>
                    <Typography fontWeight="bold">
                      {stats?.embeddings.byType.chunk.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Other</Typography>
                    <Typography fontWeight="bold">
                      {stats?.embeddings.byType.other.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Health
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {stats?.queue.healthStatus === 'healthy' ? (
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                    ) : (
                      <ErrorIcon color="warning" sx={{ mr: 1 }} />
                    )}
                    <Typography>
                      Queue Status: {stats?.queue.healthStatus}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Pending: {stats?.queue.pending} | Failed: {stats?.queue.failed}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleProcessQueue}
                    disabled={processing || stats?.queue.pending === 0}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Process Queue
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      {/* Entities Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Search entities"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchEntities()}
                fullWidth
              />
              <TextField
                label="Type"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                select
                SelectProps={{ native: true }}
                sx={{ minWidth: 200 }}
              >
                <option value="">All Types</option>
                <option value="coin">Coin</option>
                <option value="protocol">Protocol</option>
                <option value="project">Project</option>
                <option value="exchange">Exchange</option>
                <option value="person">Person</option>
              </TextField>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearchEntities}
              >
                Search
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Mentions</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Verified</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell>{entity.name}</TableCell>
                      <TableCell>
                        <Chip label={entity.entityType} size="small" />
                      </TableCell>
                      <TableCell>{entity.category || '-'}</TableCell>
                      <TableCell>{entity.mentionCount}</TableCell>
                      <TableCell>{Math.round(entity.confidence * 100)}%</TableCell>
                      <TableCell>
                        {entity.isVerified ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="disabled" fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Test Search Tab */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Hybrid Search
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Search query"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTestSearch()}
                fullWidth
                placeholder="e.g., Bitcoin price prediction"
              />
              <Button
                variant="contained"
                onClick={handleTestSearch}
                disabled={processing || !testSearchQuery.trim()}
              >
                Test Search
              </Button>
            </Box>

            {searchResults && (
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Found {searchResults.total} results in {searchResults.queryTimeMs}ms
                </Typography>
                <TableContainer sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Content ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Hybrid Score</TableCell>
                        <TableCell>Vector Score</TableCell>
                        <TableCell>Keyword Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.results.map((result: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{result.contentId.substring(0, 12)}...</TableCell>
                          <TableCell>
                            <Chip label={result.contentType} size="small" />
                          </TableCell>
                          <TableCell>{result.hybridScore?.toFixed(4) || '-'}</TableCell>
                          <TableCell>{result.vectorScore?.toFixed(4) || '-'}</TableCell>
                          <TableCell>{result.keywordScore?.toFixed(4) || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Search Statistics (7 days)
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h4">{searchAnalytics?.totalSearches}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total searches
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Avg query time: {searchAnalytics?.avgQueryTimeMs}ms
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Queries
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Query</TableCell>
                        <TableCell align="right">Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchAnalytics?.topQueries.map((q, i) => (
                        <TableRow key={i}>
                          <TableCell>{q.query}</TableCell>
                          <TableCell align="right">{q.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      {/* Queue Tab */}
      <TabPanel value={activeTab} index={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Embedding Update Queue</Typography>
              <Button
                variant="contained"
                onClick={handleProcessQueue}
                disabled={processing || stats?.queue.pending === 0}
              >
                Process Queue ({stats?.queue.pending})
              </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Pending Items
                </Typography>
                <Typography variant="h5">{stats?.queue.pending}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Failed Items
                </Typography>
                <Typography variant="h5" color="error">
                  {stats?.queue.failed}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Rebuild Index Dialog */}
      <Dialog open={rebuildDialog} onClose={() => setRebuildDialog(false)}>
        <DialogTitle>Rebuild Vector Index</DialogTitle>
        <DialogContent>
          <Typography>
            This will queue all published articles without embeddings for processing. 
            This operation may take several minutes depending on the number of articles.
          </Typography>
          <Typography sx={{ mt: 2 }} color="textSecondary">
            Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebuildDialog(false)}>Cancel</Button>
          <Button onClick={handleRebuildIndex} variant="contained" disabled={processing}>
            Rebuild
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



