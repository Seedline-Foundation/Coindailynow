import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Key as KeyIcon,
  Assessment as AssessmentIcon,
  RssFeed as RssIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`knowledge-api-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function KnowledgeAPIDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [createKeyDialog, setCreateKeyDialog] = useState(false);
  const [createFeedDialog, setCreateFeedDialog] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [keyForm, setKeyForm] = useState({
    name: '',
    description: '',
    tier: 'free',
    rateLimit: 100,
  });

  const [feedForm, setFeedForm] = useState({
    name: '',
    description: '',
    feedType: 'json',
    category: '',
    language: 'en',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, feedsRes] = await Promise.all([
        fetch('/api/knowledge-api/admin/statistics'),
        fetch('/api/knowledge-api/admin/feeds'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }

      if (feedsRes.ok) {
        const feedsData = await feedsRes.json();
        setFeeds(feedsData.feeds || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/knowledge-api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      const data = await response.json();
      setNewKey(data.key);
      setSuccess('API key created successfully! Make sure to copy it now.');
      fetchData();
    } catch (err) {
      setError('Failed to create API key');
    }
  };

  const handleCreateFeed = async () => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/knowledge-api/admin/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create feed');
      }

      setSuccess('Feed created successfully!');
      setCreateFeedDialog(false);
      setFeedForm({
        name: '',
        description: '',
        feedType: 'json',
        category: '',
        language: 'en',
      });
      fetchData();
    } catch (err) {
      setError('Failed to create feed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Knowledge API & LLM Access
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Overview Cards */}
      {statistics && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active API Keys
                  </Typography>
                  <Typography variant="h4">
                    {statistics.overview.activeKeys}
                  </Typography>
                </Box>
                <KeyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total API Calls
                  </Typography>
                  <Typography variant="h4">
                    {statistics.overview.totalUsage.toLocaleString()}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    LLM Citations
                  </Typography>
                  <Typography variant="h4">
                    {statistics.overview.totalCitations.toLocaleString()}
                  </Typography>
                </Box>
                <LinkIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active Feeds
                  </Typography>
                  <Typography variant="h4">
                    {statistics.overview.feedCount}
                  </Typography>
                </Box>
                <RssIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Overview" />
            <Tab label="API Keys" />
            <Tab label="RAG Feeds" />
            <Tab label="Citations" />
            <Tab label="Documentation" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {/* Usage by Tier */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Usage by Tier
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tier</TableCell>
                    <TableCell align="right">Active Keys</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statistics?.usageByTier.map((item: any) => (
                    <TableRow key={item.tier}>
                      <TableCell>
                        <Chip
                          label={item.tier.toUpperCase()}
                          color={
                            item.tier === 'enterprise'
                              ? 'primary'
                              : item.tier === 'pro'
                              ? 'success'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Top Cited Content */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Top Cited Content
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Article</TableCell>
                    <TableCell align="right">Citations</TableCell>
                    <TableCell align="right">Quality</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statistics?.topCited.slice(0, 5).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.articleTitle}</TableCell>
                      <TableCell align="right">{item.citationCount}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${item.qualityScore.toFixed(0)}%`}
                          color={item.qualityScore >= 70 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </TabPanel>

        {/* API Keys Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">API Key Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateKeyDialog(true)}
            >
              Create API Key
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            API keys allow third-party developers to access your knowledge API. Each key has a
            tier-based rate limit and can be restricted to specific endpoints.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Total Keys: {statistics?.overview.totalKeys} | Active: {statistics?.overview.activeKeys}
          </Typography>
        </TabPanel>

        {/* RAG Feeds Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">RAG Feed Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateFeedDialog(true)}
            >
              Create Feed
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            RAG feeds provide LLM-optimized content feeds in RSS, JSON, or XML format. These feeds
            include structured data, summaries, and entity extractions.
          </Alert>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Access Count</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feeds.map((feed) => (
                <TableRow key={feed.id}>
                  <TableCell>{feed.name}</TableCell>
                  <TableCell>
                    <Chip label={feed.feedType.toUpperCase()} size="small" />
                  </TableCell>
                  <TableCell>{feed.category || 'All'}</TableCell>
                  <TableCell>{feed.language}</TableCell>
                  <TableCell>{feed.accessCount}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Copy Feed URL">
                      <IconButton
                        size="small"
                        onClick={() =>
                          copyToClipboard(
                            `https://coindaily.ai/api/knowledge-api/feeds/${feed.feedType}/${feed.id}`
                          )
                        }
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabPanel>

        {/* Citations Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Recent LLM Citations
          </Typography>

          <Alert severity="success" sx={{ mb: 2 }}>
            Track how LLMs like ChatGPT, Perplexity, and Claude cite your content. This helps
            understand your AI visibility and impact.
          </Alert>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Article</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statistics?.recentCitations.slice(0, 10).map((citation: any) => (
                <TableRow key={citation.id}>
                  <TableCell>{citation.articleTitle}</TableCell>
                  <TableCell>
                    <Chip label={citation.sourceName} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{citation.sourceType}</TableCell>
                  <TableCell>
                    {new Date(citation.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabPanel>

        {/* Documentation Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            API Documentation
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>AI Manifest:</strong>{' '}
            <a
              href="/api/knowledge-api/manifest"
              target="_blank"
              rel="noopener noreferrer"
            >
              /api/knowledge-api/manifest
            </a>
            <br />
            This endpoint provides LLMs with information about available APIs, capabilities, and
            usage examples.
          </Alert>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Public Endpoints
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Endpoint</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell><code>/api/knowledge-api/manifest</code></TableCell>
                <TableCell>GET</TableCell>
                <TableCell>AI manifest file for LLM discovery</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/api/knowledge-api/feeds/rss/:feedId</code></TableCell>
                <TableCell>GET</TableCell>
                <TableCell>RAG-friendly RSS feed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/api/knowledge-api/feeds/json/:feedId</code></TableCell>
                <TableCell>GET</TableCell>
                <TableCell>RAG-friendly JSON feed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/api/knowledge-api/citations/track</code></TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Track LLM citation (public)</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Authenticated Endpoints (Require API Key)
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Endpoint</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell><code>/api/knowledge-api/search</code></TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Search knowledge base</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/api/knowledge-api/:articleId</code></TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Get structured knowledge for article</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/api/knowledge-api/crypto-data/latest</code></TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Get latest crypto news and data</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabPanel>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={createKeyDialog} onClose={() => setCreateKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          {newKey ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                API key created successfully! Copy it now - you won't be able to see it again.
              </Alert>
              <TextField
                fullWidth
                value={newKey}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => copyToClipboard(newKey)}>
                      <CopyIcon />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Name"
                fullWidth
                value={keyForm.name}
                onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={keyForm.description}
                onChange={(e) => setKeyForm({ ...keyForm, description: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={keyForm.tier}
                  onChange={(e) => setKeyForm({ ...keyForm, tier: e.target.value })}
                >
                  <MenuItem value="free">Free (100/hour)</MenuItem>
                  <MenuItem value="basic">Basic (1000/hour)</MenuItem>
                  <MenuItem value="pro">Pro (10000/hour)</MenuItem>
                  <MenuItem value="enterprise">Enterprise (Unlimited)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Rate Limit (requests/hour)"
                type="number"
                fullWidth
                value={keyForm.rateLimit}
                onChange={(e) =>
                  setKeyForm({ ...keyForm, rateLimit: parseInt(e.target.value) })
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {newKey ? (
            <Button onClick={() => {
              setCreateKeyDialog(false);
              setNewKey('');
              setKeyForm({ name: '', description: '', tier: 'free', rateLimit: 100 });
            }}>
              Close
            </Button>
          ) : (
            <>
              <Button onClick={() => setCreateKeyDialog(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleCreateKey}>
                Create
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Feed Dialog */}
      <Dialog open={createFeedDialog} onClose={() => setCreateFeedDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create RAG Feed</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={feedForm.name}
              onChange={(e) => setFeedForm({ ...feedForm, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={feedForm.description}
              onChange={(e) => setFeedForm({ ...feedForm, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Feed Type</InputLabel>
              <Select
                value={feedForm.feedType}
                onChange={(e) => setFeedForm({ ...feedForm, feedType: e.target.value })}
              >
                <MenuItem value="rss">RSS</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="xml">XML</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Category (optional)"
              fullWidth
              value={feedForm.category}
              onChange={(e) => setFeedForm({ ...feedForm, category: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={feedForm.language}
                onChange={(e) => setFeedForm({ ...feedForm, language: e.target.value })}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="sw">Swahili</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="ar">Arabic</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFeedDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFeed}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

