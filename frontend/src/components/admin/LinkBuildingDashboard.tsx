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
  LinearProgress,
} from '@mui/material';
import {
  Link as LinkIcon,
  Campaign as CampaignIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Email as EmailIcon,
  Star as StarIcon,
  BarChart as BarChartIcon,
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
      id={`link-building-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LinkBuildingDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [velocity, setVelocity] = useState<any[]>([]);
  const [authority, setAuthority] = useState<any[]>([]);
  
  const [createCampaignDialog, setCreateCampaignDialog] = useState(false);
  const [createProspectDialog, setCreateProspectDialog] = useState(false);
  const [createInfluencerDialog, setCreateInfluencerDialog] = useState(false);
  const [createOutreachDialog, setCreateOutreachDialog] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    campaignType: 'INFLUENCER',
    region: 'GLOBAL',
    targetBacklinks: 50,
    targetDomainAuth: 40,
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    priority: 'MEDIUM',
  });

  const [prospectForm, setProspectForm] = useState({
    url: '',
    domain: '',
    contactName: '',
    contactEmail: '',
    prospectType: 'INFLUENCER',
    region: 'GLOBAL',
    category: 'CRYPTO',
    domainAuthority: 0,
    trafficEstimate: 0,
    priority: 'MEDIUM',
  });

  const [influencerForm, setInfluencerForm] = useState({
    influencerName: '',
    platform: 'TWITTER',
    handle: '',
    profileUrl: '',
    email: '',
    region: 'GLOBAL',
    category: 'CRYPTO',
    followerCount: 0,
    engagementRate: 0,
    partnershipType: 'CONTENT_COLLAB',
    budget: 0,
  });

  const [outreachForm, setOutreachForm] = useState({
    prospectId: '',
    activityType: 'EMAIL',
    channel: 'EMAIL',
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, backlinksRes, campaignsRes, prospectsRes, influencersRes, velocityRes, authorityRes] = await Promise.all([
        fetch('/api/link-building-proxy/statistics'),
        fetch('/api/link-building-proxy/backlinks?limit=20'),
        fetch('/api/link-building-proxy/campaigns'),
        fetch('/api/link-building-proxy/prospects'),
        fetch('/api/link-building-proxy/influencers'),
        fetch('/api/link-building-proxy/velocity?period=DAILY&limit=30'),
        fetch('/api/link-building-proxy/authority?limit=30'),
      ]);

      const [statsData, backlinksData, campaignsData, prospectsData, influencersData, velocityData, authorityData] = await Promise.all([
        statsRes.json(),
        backlinksRes.json(),
        campaignsRes.json(),
        prospectsRes.json(),
        influencersRes.json(),
        velocityRes.json(),
        authorityRes.json(),
      ]);

      if (statsData.success) setStatistics(statsData.data);
      if (backlinksData.success) setBacklinks(backlinksData.data);
      if (campaignsData.success) setCampaigns(campaignsData.data);
      if (prospectsData.success) setProspects(prospectsData.data);
      if (influencersData.success) setInfluencers(influencersData.data);
      if (velocityData.success) setVelocity(velocityData.data);
      if (authorityData.success) setAuthority(authorityData.data);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const res = await fetch('/api/link-building-proxy/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignForm,
          startDate: new Date(campaignForm.startDate),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Campaign created successfully!');
        setCreateCampaignDialog(false);
        fetchData();
        setCampaignForm({
          name: '',
          campaignType: 'INFLUENCER',
          region: 'GLOBAL',
          targetBacklinks: 50,
          targetDomainAuth: 40,
          budget: 0,
          startDate: new Date().toISOString().split('T')[0],
          description: '',
          priority: 'MEDIUM',
        });
      } else {
        setError(data.error || 'Failed to create campaign');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    }
  };

  const handleCreateProspect = async () => {
    try {
      const res = await fetch('/api/link-building-proxy/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospectForm),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Prospect added successfully!');
        setCreateProspectDialog(false);
        fetchData();
        setProspectForm({
          url: '',
          domain: '',
          contactName: '',
          contactEmail: '',
          prospectType: 'INFLUENCER',
          region: 'GLOBAL',
          category: 'CRYPTO',
          domainAuthority: 0,
          trafficEstimate: 0,
          priority: 'MEDIUM',
        });
      } else {
        setError(data.error || 'Failed to add prospect');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add prospect');
    }
  };

  const handleCreateInfluencer = async () => {
    try {
      const res = await fetch('/api/link-building-proxy/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(influencerForm),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Influencer added successfully!');
        setCreateInfluencerDialog(false);
        fetchData();
        setInfluencerForm({
          influencerName: '',
          platform: 'TWITTER',
          handle: '',
          profileUrl: '',
          email: '',
          region: 'GLOBAL',
          category: 'CRYPTO',
          followerCount: 0,
          engagementRate: 0,
          partnershipType: 'CONTENT_COLLAB',
          budget: 0,
        });
      } else {
        setError(data.error || 'Failed to add influencer');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add influencer');
    }
  };

  const handleVerifyBacklink = async (backlinkId: string) => {
    try {
      const res = await fetch(`/api/link-building-proxy/backlinks/${backlinkId}/verify`, {
        method: 'PUT',
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Backlink verified!');
        fetchData();
      } else {
        setError(data.error || 'Failed to verify backlink');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify backlink');
    }
  };

  const handleUpdateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const res = await fetch(`/api/link-building-proxy/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Campaign status updated!');
        fetchData();
      } else {
        setError(data.error || 'Failed to update campaign');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update campaign');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'success',
      PLANNING: 'info',
      PAUSED: 'warning',
      COMPLETED: 'default',
      CANCELLED: 'error',
      NEW: 'info',
      CONTACTED: 'primary',
      NEGOTIATING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      PROSPECT: 'info',
      PARTNERSHIP: 'success',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'default',
      MEDIUM: 'info',
      HIGH: 'warning',
      URGENT: 'error',
    };
    return colors[priority] || 'default';
  };

  if (loading && !statistics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Link Building & Authority Development
        </Typography>
        <IconButton onClick={fetchData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Active Backlinks
                  </Typography>
                  <Typography variant="h4">
                    {statistics?.overview?.activeBacklinks || 0}
                  </Typography>
                </Box>
                <LinkIcon fontSize="large" color="primary" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Total: {statistics?.overview?.totalBacklinks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Active Campaigns
                  </Typography>
                  <Typography variant="h4">
                    {statistics?.overview?.activeCampaigns || 0}
                  </Typography>
                </Box>
                <CampaignIcon fontSize="large" color="secondary" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Total: {statistics?.overview?.campaigns || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Avg Domain Authority
                  </Typography>
                  <Typography variant="h4">
                    {statistics?.overview?.avgDomainAuthority || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon fontSize="large" color="success" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Quality Score: {statistics?.overview?.avgQualityScore || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Influencers
                  </Typography>
                  <Typography variant="h4">
                    {statistics?.overview?.influencers || 0}
                  </Typography>
                </Box>
                <PersonIcon fontSize="large" color="info" />
              </Box>
              <Typography variant="caption" color="textSecondary">
                Prospects: {statistics?.overview?.prospects || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Velocity & Authority Metrics */}
      {statistics?.velocity && statistics?.authority && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Link Velocity (Last 24h)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">New</Typography>
                    <Typography variant="h6" color="success.main">+{statistics.velocity.newBacklinks}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Lost</Typography>
                    <Typography variant="h6" color="error.main">-{statistics.velocity.lostBacklinks}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Net Change</Typography>
                    <Typography variant="h6">{statistics.velocity.netChange > 0 ? '+' : ''}{statistics.velocity.netChange}</Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Velocity Score: {statistics.velocity.velocityScore}/100
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={statistics.velocity.velocityScore} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Chip 
                    label={statistics.velocity.velocityTrend} 
                    size="small" 
                    color={statistics.velocity.velocityTrend === 'GROWING' ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Authority Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Domain Authority</Typography>
                    <Typography variant="h6">{statistics.authority.domainAuthority}/100</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Trust Flow</Typography>
                    <Typography variant="h6">{statistics.authority.trustFlow}/100</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Referring Domains</Typography>
                    <Typography variant="h6">{statistics.authority.referringDomains}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Authority Score</Typography>
                    <Typography variant="h6" color="primary">{statistics.authority.authorityScore}/100</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Backlinks" icon={<LinkIcon />} iconPosition="start" />
          <Tab label="Campaigns" icon={<CampaignIcon />} iconPosition="start" />
          <Tab label="Prospects" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Influencers" icon={<StarIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<BarChartIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Backlinks */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Recent Backlinks</Typography>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Source Domain</TableCell>
                <TableCell>Target URL</TableCell>
                <TableCell>Link Type</TableCell>
                <TableCell>DA</TableCell>
                <TableCell>Quality</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backlinks.map((backlink) => (
                <TableRow key={backlink.id}>
                  <TableCell>
                    <Tooltip title={backlink.sourceUrl}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {backlink.sourceDomain}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {backlink.targetUrl}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={backlink.linkType} size="small" />
                  </TableCell>
                  <TableCell>{backlink.domainAuthority}</TableCell>
                  <TableCell>
                    <Chip 
                      label={backlink.qualityScore} 
                      size="small"
                      color={backlink.qualityScore >= 70 ? 'success' : backlink.qualityScore >= 40 ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={backlink.status} 
                      size="small"
                      color={getStatusColor(backlink.status) as any}
                    />
                  </TableCell>
                  <TableCell>{backlink.region || 'N/A'}</TableCell>
                  <TableCell>
                    {!backlink.isVerified && (
                      <IconButton
                        size="small"
                        onClick={() => handleVerifyBacklink(backlink.id)}
                        color="primary"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabPanel>

        {/* Tab 1: Campaigns */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Link Building Campaigns</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateCampaignDialog(true)}
            >
              New Campaign
            </Button>
          </Box>

          <Grid container spacing={2}>
            {campaigns.map((campaign) => (
              <Grid item xs={12} md={6} key={campaign.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6">{campaign.name}</Typography>
                        <Chip 
                          label={campaign.campaignType} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Chip 
                        label={campaign.status} 
                        color={getStatusColor(campaign.status) as any}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Target</Typography>
                        <Typography variant="body1">{campaign.targetBacklinks} backlinks</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Acquired</Typography>
                        <Typography variant="body1" color="primary">
                          {campaign.backlinksAcquired} ({Math.round(campaign.successRate * 100)}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Avg DA</Typography>
                        <Typography variant="body1">{Math.round(campaign.avgDomainAuthority)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Priority</Typography>
                        <Chip 
                          label={campaign.priority} 
                          size="small"
                          color={getPriorityColor(campaign.priority) as any}
                        />
                      </Grid>
                    </Grid>

                    <LinearProgress 
                      variant="determinate" 
                      value={campaign.successRate * 100} 
                      sx={{ mb: 1 }}
                    />

                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateCampaignStatus(campaign.id, 
                          campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
                        )}
                      >
                        {campaign.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </Button>
                      <Button size="small" variant="text">
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tab 2: Prospects */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Link Prospects</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateProspectDialog(true)}
            >
              Add Prospect
            </Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Domain</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>DA</TableCell>
                <TableCell>Link Potential</TableCell>
                <TableCell>Quality</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prospects.slice(0, 15).map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {prospect.domain}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={prospect.prospectType} size="small" />
                  </TableCell>
                  <TableCell>{prospect.domainAuthority}</TableCell>
                  <TableCell>
                    <Chip 
                      label={prospect.linkPotential} 
                      size="small"
                      color={prospect.linkPotential >= 70 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{prospect.qualityScore}</TableCell>
                  <TableCell>
                    <Chip 
                      label={prospect.status} 
                      size="small"
                      color={getStatusColor(prospect.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={prospect.priority} 
                      size="small"
                      color={getPriorityColor(prospect.priority) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {prospect.contactEmail && (
                      <IconButton size="small" color="primary">
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabPanel>

        {/* Tab 3: Influencers */}
        <TabPanel value={tabValue} index={3}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Influencer Partnerships</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateInfluencerDialog(true)}
            >
              Add Influencer
            </Button>
          </Box>

          <Grid container spacing={2}>
            {influencers.map((influencer) => (
              <Grid item xs={12} md={6} key={influencer.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6">{influencer.influencerName}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          @{influencer.handle} • {influencer.platform}
                        </Typography>
                      </Box>
                      <Chip 
                        label={influencer.status} 
                        color={getStatusColor(influencer.status) as any}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Followers</Typography>
                        <Typography variant="body1">{influencer.followerCount.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Engagement</Typography>
                        <Typography variant="body1">{(influencer.engagementRate * 100).toFixed(1)}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Backlinks</Typography>
                        <Typography variant="body1" color="primary">{influencer.backlinksGenerated}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Performance</Typography>
                        <Chip 
                          label={influencer.performanceScore} 
                          size="small"
                          color={influencer.performanceScore >= 70 ? 'success' : 'default'}
                        />
                      </Grid>
                    </Grid>

                    <Box display="flex" gap={1}>
                      <Chip label={influencer.partnershipType} size="small" />
                      <Chip label={influencer.region} size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tab 4: Analytics */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Link Building Analytics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Link Velocity Trend (Last 30 Days)
                  </Typography>
                  {velocity.length > 0 ? (
                    <Box>
                      {velocity.slice(0, 7).map((metric, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">
                              {new Date(metric.metricDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {metric.netChange > 0 ? '+' : ''}{metric.netChange}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={metric.velocityScore} 
                            color={metric.velocityScore >= 70 ? 'success' : 'warning'}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography color="textSecondary">No velocity data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Authority Development (Last 30 Days)
                  </Typography>
                  {authority.length > 0 ? (
                    <Box>
                      {authority.slice(0, 7).map((metric, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">
                              {new Date(metric.metricDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {metric.authorityScore}/100
                            </Typography>
                          </Box>
                          <Grid container spacing={1}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="textSecondary">DA: {metric.domainAuthority}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="textSecondary">TF: {metric.trustFlow}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="textSecondary">RD: {metric.referringDomains}</Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography color="textSecondary">No authority data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createCampaignDialog} onClose={() => setCreateCampaignDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Campaign</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  value={campaignForm.campaignType}
                  onChange={(e) => setCampaignForm({ ...campaignForm, campaignType: e.target.value })}
                  label="Campaign Type"
                >
                  <MenuItem value="INFLUENCER">Influencer Outreach</MenuItem>
                  <MenuItem value="GUEST_POST">Guest Posting</MenuItem>
                  <MenuItem value="RESOURCE_PAGE">Resource Page Links</MenuItem>
                  <MenuItem value="LOCAL_PARTNERSHIP">Local Partnerships</MenuItem>
                  <MenuItem value="SYNDICATION">Content Syndication</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  value={campaignForm.region}
                  onChange={(e) => setCampaignForm({ ...campaignForm, region: e.target.value })}
                  label="Region"
                >
                  <MenuItem value="GLOBAL">Global</MenuItem>
                  <MenuItem value="NIGERIA">Nigeria</MenuItem>
                  <MenuItem value="KENYA">Kenya</MenuItem>
                  <MenuItem value="SOUTH_AFRICA">South Africa</MenuItem>
                  <MenuItem value="GHANA">Ghana</MenuItem>
                  <MenuItem value="ETHIOPIA">Ethiopia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Target Backlinks"
                value={campaignForm.targetBacklinks}
                onChange={(e) => setCampaignForm({ ...campaignForm, targetBacklinks: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Domain Authority"
                value={campaignForm.targetDomainAuth}
                onChange={(e) => setCampaignForm({ ...campaignForm, targetDomainAuth: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={campaignForm.priority}
                  onChange={(e) => setCampaignForm({ ...campaignForm, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCampaignDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCampaign} variant="contained">Create Campaign</Button>
        </DialogActions>
      </Dialog>

      {/* Create Prospect Dialog */}
      <Dialog open={createProspectDialog} onClose={() => setCreateProspectDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Prospect</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL"
                value={prospectForm.url}
                onChange={(e) => setProspectForm({ ...prospectForm, url: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Domain"
                value={prospectForm.domain}
                onChange={(e) => setProspectForm({ ...prospectForm, domain: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Name"
                value={prospectForm.contactName}
                onChange={(e) => setProspectForm({ ...prospectForm, contactName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Contact Email"
                value={prospectForm.contactEmail}
                onChange={(e) => setProspectForm({ ...prospectForm, contactEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prospect Type</InputLabel>
                <Select
                  value={prospectForm.prospectType}
                  onChange={(e) => setProspectForm({ ...prospectForm, prospectType: e.target.value })}
                  label="Prospect Type"
                >
                  <MenuItem value="INFLUENCER">Influencer</MenuItem>
                  <MenuItem value="PUBLICATION">Publication</MenuItem>
                  <MenuItem value="RESOURCE_PAGE">Resource Page</MenuItem>
                  <MenuItem value="DIRECTORY">Directory</MenuItem>
                  <MenuItem value="PARTNER">Partner</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  value={prospectForm.region}
                  onChange={(e) => setProspectForm({ ...prospectForm, region: e.target.value })}
                  label="Region"
                >
                  <MenuItem value="GLOBAL">Global</MenuItem>
                  <MenuItem value="NIGERIA">Nigeria</MenuItem>
                  <MenuItem value="KENYA">Kenya</MenuItem>
                  <MenuItem value="SOUTH_AFRICA">South Africa</MenuItem>
                  <MenuItem value="GHANA">Ghana</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Domain Authority"
                value={prospectForm.domainAuthority}
                onChange={(e) => setProspectForm({ ...prospectForm, domainAuthority: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Traffic Estimate (monthly)"
                value={prospectForm.trafficEstimate}
                onChange={(e) => setProspectForm({ ...prospectForm, trafficEstimate: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProspectDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProspect} variant="contained">Add Prospect</Button>
        </DialogActions>
      </Dialog>

      {/* Create Influencer Dialog */}
      <Dialog open={createInfluencerDialog} onClose={() => setCreateInfluencerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Influencer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Influencer Name"
                value={influencerForm.influencerName}
                onChange={(e) => setInfluencerForm({ ...influencerForm, influencerName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={influencerForm.platform}
                  onChange={(e) => setInfluencerForm({ ...influencerForm, platform: e.target.value })}
                  label="Platform"
                >
                  <MenuItem value="TWITTER">Twitter/X</MenuItem>
                  <MenuItem value="YOUTUBE">YouTube</MenuItem>
                  <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                  <MenuItem value="TELEGRAM">Telegram</MenuItem>
                  <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Handle (@username)"
                value={influencerForm.handle}
                onChange={(e) => setInfluencerForm({ ...influencerForm, handle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Profile URL"
                value={influencerForm.profileUrl}
                onChange={(e) => setInfluencerForm({ ...influencerForm, profileUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={influencerForm.email}
                onChange={(e) => setInfluencerForm({ ...influencerForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  value={influencerForm.region}
                  onChange={(e) => setInfluencerForm({ ...influencerForm, region: e.target.value })}
                  label="Region"
                >
                  <MenuItem value="GLOBAL">Global</MenuItem>
                  <MenuItem value="NIGERIA">Nigeria</MenuItem>
                  <MenuItem value="KENYA">Kenya</MenuItem>
                  <MenuItem value="SOUTH_AFRICA">South Africa</MenuItem>
                  <MenuItem value="GHANA">Ghana</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Follower Count"
                value={influencerForm.followerCount}
                onChange={(e) => setInfluencerForm({ ...influencerForm, followerCount: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Engagement Rate (%)"
                value={influencerForm.engagementRate * 100}
                onChange={(e) => setInfluencerForm({ ...influencerForm, engagementRate: parseFloat(e.target.value) / 100 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Partnership Type</InputLabel>
                <Select
                  value={influencerForm.partnershipType}
                  onChange={(e) => setInfluencerForm({ ...influencerForm, partnershipType: e.target.value })}
                  label="Partnership Type"
                >
                  <MenuItem value="CONTENT_COLLAB">Content Collaboration</MenuItem>
                  <MenuItem value="BACKLINK">Backlink</MenuItem>
                  <MenuItem value="MENTION">Mention</MenuItem>
                  <MenuItem value="SPONSORED">Sponsored</MenuItem>
                  <MenuItem value="AMBASSADOR">Ambassador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Budget ($)"
                value={influencerForm.budget}
                onChange={(e) => setInfluencerForm({ ...influencerForm, budget: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateInfluencerDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateInfluencer} variant="contained">Add Influencer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
