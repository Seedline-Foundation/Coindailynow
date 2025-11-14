/**
 * Compliance Monitoring Dashboard (Super Admin)
 * Task 85: Compliance Monitoring Dashboard
 * 
 * Production-ready comprehensive compliance management interface with:
 * - 7 tabs (Overview, Rules, Checks, SEO Compliance, Scores, Notifications, Automation)
 * - Real-time statistics and scoring
 * - GDPR, CCPA, PCI DSS, Google Guidelines, E-E-A-T tracking
 * - Automated compliance checks
 * - Notification system
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckBox as CheckBoxIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Google as GoogleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ComplianceMonitoringDashboard() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // State
  const [statistics, setStatistics] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [seoRules, setSeoRules] = useState<any[]>([]);
  const [seoChecks, setSeoChecks] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Dialogs
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, rulesRes, checksRes, seoRulesRes, seoChecksRes, scoresRes, notifRes] = await Promise.all([
        fetch('/api/compliance/statistics'),
        fetch('/api/compliance/rules'),
        fetch('/api/compliance/checks'),
        fetch('/api/compliance/seo-rules'),
        fetch('/api/compliance/seo-checks'),
        fetch('/api/compliance/scores?days=30'),
        fetch('/api/compliance/notifications'),
      ]);

      const statsData = await statsRes.json();
      const rulesData = await rulesRes.json();
      const checksData = await checksRes.json();
      const seoRulesData = await seoRulesRes.json();
      const seoChecksData = await seoChecksRes.json();
      const scoresData = await scoresRes.json();
      const notifData = await notifRes.json();

      setStatistics(statsData.data || statsData);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setChecks(Array.isArray(checksData) ? checksData : []);
      setSeoRules(Array.isArray(seoRulesData) ? seoRulesData : []);
      setSeoChecks(Array.isArray(seoChecksData) ? seoChecksData : []);
      setScores(Array.isArray(scoresData) ? scoresData : []);
      setNotifications(Array.isArray(notifData) ? notifData : []);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRunAutomatedChecks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance/automation/run-checks', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success || result.data) {
        alert(`Automated checks completed!\nTotal: ${result.data.total}\nPassed: ${result.data.passed}\nFailed: ${result.data.failed}`);
        await fetchData();
      }
    } catch (error) {
      console.error('Error running automated checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateScore = async () => {
    try {
      setLoading(true);
      await fetch('/api/compliance/scores/calculate', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Error calculating score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'passed': return 'success';
      case 'non_compliant':
      case 'non_compliant': return 'error';
      case 'partial':
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

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

  const latestScore = scores[0] || statistics?.score || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Compliance Monitoring Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handleRunAutomatedChecks}
            disabled={loading}
          >
            Run Checks
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={handleCalculateScore}
            disabled={loading}
          >
            Calculate Score
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Overall Score Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Overall Score</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                  {latestScore.overallScore?.toFixed(1) || '0.0'}
                </Typography>
                {getTrendIcon(latestScore.scoreTrend)}
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                {latestScore.scoreChange > 0 ? '+' : ''}{latestScore.scoreChange?.toFixed(1) || '0.0'} from last check
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GavelIcon /> Regulatory
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getScoreColor(latestScore.regulatoryScore || 0) }}>
                {latestScore.regulatoryScore?.toFixed(1) || '0.0'}%
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">GDPR: {latestScore.gdprScore?.toFixed(0) || '0'}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.gdprScore || 0}
                  sx={{ mt: 0.5, mb: 1 }}
                />
                <Typography variant="caption">CCPA: {latestScore.ccpaScore?.toFixed(0) || '0'}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.ccpaScore || 0}
                  sx={{ mt: 0.5, mb: 1 }}
                />
                <Typography variant="caption">PCI DSS: {latestScore.pciDssScore?.toFixed(0) || '0'}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.pciDssScore || 0}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GoogleIcon /> SEO Compliance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getScoreColor(latestScore.seoScore || 0) }}>
                {latestScore.seoScore?.toFixed(1) || '0.0'}%
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">Google Guidelines: {latestScore.googleGuidelinesScore?.toFixed(0) || '0'}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.googleGuidelinesScore || 0}
                  sx={{ mt: 0.5, mb: 1 }}
                />
                <Typography variant="caption">E-E-A-T: {latestScore.eeatScore?.toFixed(0) || '0'}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.eeatScore || 0}
                  sx={{ mt: 0.5, mb: 1 }}
                />
                <Typography variant="caption">Core Web Vitals: {latestScore.coreWebVitalsScore?.toFixed(0) || '0'}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.coreWebVitalsScore || 0}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon /> Security
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getScoreColor(latestScore.securityScore || 0) }}>
                {latestScore.securityScore?.toFixed(1) || '0.0'}%
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">High Risk Issues</Typography>
                  <Chip
                    label={latestScore.highRiskIssues || 0}
                    size="small"
                    color="error"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Medium Risk Issues</Typography>
                  <Chip
                    label={latestScore.mediumRiskIssues || 0}
                    size="small"
                    color="warning"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Low Risk Issues</Typography>
                  <Chip
                    label={latestScore.lowRiskIssues || 0}
                    size="small"
                    color="info"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* E-E-A-T Component Scores */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>E-E-A-T Component Scores</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Experience</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.experienceScore || 0}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {latestScore.experienceScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Expertise</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.expertiseScore || 0}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {latestScore.expertiseScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Authoritativeness</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.authoritativenessScore || 0}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {latestScore.authoritativenessScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Trustworthiness</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={latestScore.trustworthinessScore || 0}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {latestScore.trustworthinessScore?.toFixed(0) || '0'}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ flex: '1 1 33%', minWidth: '300px', p: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Compliance Status</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Compliant</Typography>
                <Chip
                  label={statistics?.metrics?.compliantItems || 0}
                  size="small"
                  color="success"
                  icon={<CheckCircleIcon />}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Non-Compliant</Typography>
                <Chip
                  label={statistics?.metrics?.nonCompliantItems || 0}
                  size="small"
                  color="error"
                  icon={<ErrorIcon />}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Partial</Typography>
                <Chip
                  label={statistics?.metrics?.partialCompliant || 0}
                  size="small"
                  color="warning"
                  icon={<WarningIcon />}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Needs Review</Typography>
                <Chip
                  label={statistics?.metrics?.needsReview || 0}
                  size="small"
                  color="info"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 33%', minWidth: '300px', p: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Open Actions</Typography>
                <Typography variant="h6" sx={{ color: 'error.main' }}>
                  {latestScore.openActions || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Completed Actions</Typography>
                <Typography variant="h6" sx={{ color: 'success.main' }}>
                  {latestScore.completedActions || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Overdue Actions</Typography>
                <Typography variant="h6" sx={{ color: 'warning.main' }}>
                  {latestScore.overdueActions || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 33%', minWidth: '300px', p: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Activity</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Rules</Typography>
                <Typography variant="h6">{statistics?.metrics?.totalRules || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Checks Today</Typography>
                <Typography variant="h6">{statistics?.metrics?.checksToday || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Notifications</Typography>
                <Typography variant="h6">{statistics?.pendingNotifications || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label={`Rules (${rules.length})`} icon={<GavelIcon />} iconPosition="start" />
          <Tab label={`Checks (${checks.length})`} icon={<CheckBoxIcon />} iconPosition="start" />
          <Tab label={`SEO Compliance (${seoRules.length})`} icon={<GoogleIcon />} iconPosition="start" />
          <Tab label={`Scores (${scores.length})`} icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label={`Notifications (${notifications.length})`} icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="Automation" icon={<PlayArrowIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        {/* Overview already shown above */}
        <Alert severity="info" sx={{ mt: 2 }}>
          Compliance monitoring system is active. Auto-refresh every 30 seconds.
        </Alert>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Rules Tab */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Check</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.slice(0, 20).map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {rule.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {rule.regulatoryBody}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.ruleType} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.priority}
                      size="small"
                      color={getSeverityColor(rule.priority) as any}
                    />
                  </TableCell>
                  <TableCell>{rule.category || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={rule.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {rule.ComplianceCheck?.[0]
                      ? new Date(rule.ComplianceCheck[0].checkDate).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedItem(rule);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Checks Tab */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Check Date</TableCell>
                <TableCell>Rule</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Resolved</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.slice(0, 20).map((check) => (
                <TableRow key={check.id}>
                  <TableCell>
                    {new Date(check.checkDate).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {check.ComplianceRule?.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={check.status}
                      size="small"
                      color={getStatusColor(check.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={check.complianceScore}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption">
                        {check.complianceScore.toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{check.checkMethod}</TableCell>
                  <TableCell>
                    <Chip
                      label={check.isResolved ? 'Yes' : 'No'}
                      size="small"
                      color={check.isResolved ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedItem(check);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* SEO Compliance Tab */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ width: '100%', p: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>SEO Compliance Rules</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rule</TableCell>
                    <TableCell>Guideline Type</TableCell>
                    <TableCell>E-E-A-T Component</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Impact on Rankings</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seoRules.slice(0, 15).map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {rule.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {rule.source}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={rule.guidelineType} size="small" />
                      </TableCell>
                      <TableCell>
                        {rule.eeatComponent ? (
                          <Chip label={rule.eeatComponent} size="small" color="primary" />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.priority}
                          size="small"
                          color={getSeverityColor(rule.priority) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.impactOnRankings}
                          size="small"
                          color={getSeverityColor(rule.impactOnRankings) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={rule.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedItem(rule);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={4}>
        {/* Scores Tab */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ width: '100%', p: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Compliance Score History</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Overall</TableCell>
                    <TableCell>Regulatory</TableCell>
                    <TableCell>SEO</TableCell>
                    <TableCell>Security</TableCell>
                    <TableCell>E-E-A-T</TableCell>
                    <TableCell>Trend</TableCell>
                    <TableCell>Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scores.slice(0, 10).map((score: any) => (
                    <TableRow key={score.id}>
                      <TableCell>
                        {new Date(score.scoreDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="h6"
                          sx={{ color: getScoreColor(score.overallScore) }}
                        >
                          {score.overallScore.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>{score.regulatoryScore.toFixed(1)}%</TableCell>
                      <TableCell>{score.seoScore.toFixed(1)}%</TableCell>
                      <TableCell>{score.securityScore.toFixed(1)}%</TableCell>
                      <TableCell>{score.eeatScore.toFixed(1)}%</TableCell>
                      <TableCell>{getTrendIcon(score.scoreTrend)}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${score.scoreChange > 0 ? '+' : ''}${score.scoreChange.toFixed(1)}%`}
                          size="small"
                          color={score.scoreChange > 0 ? 'success' : score.scoreChange < 0 ? 'error' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={5}>
        {/* Notifications Tab */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {notifications.slice(0, 20).map((notification) => (
            <Box key={notification.id} sx={{ width: '100%', p: 1 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={notification.type}
                        size="small"
                        color={notification.priority === 'urgent' ? 'error' : 'default'}
                      />
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={getSeverityColor(notification.priority) as any}
                      />
                      {notification.isRead && (
                        <Chip label="Read" size="small" color="success" />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  {!notification.isRead && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={async () => {
                        await fetch(`/api/compliance/notifications/${notification.id}/read`, {
                          method: 'POST',
                        });
                        await fetchData();
                      }}
                    >
                      Mark Read
                    </Button>
                  )}
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={6}>
        {/* Automation Tab */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ width: '100%', p: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Automated Compliance Checks</Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  Run automated compliance checks across all active rules with auto-verification enabled.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleRunAutomatedChecks}
                  disabled={loading}
                  fullWidth
                >
                  Run All Automated Checks
                </Button>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: '100%', p: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Compliance Score Calculation</Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  Recalculate compliance scores based on recent checks and updates.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={handleCalculateScore}
                  disabled={loading}
                  fullWidth
                >
                  Recalculate Compliance Scores
                </Button>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: '100%', p: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Automated checks run daily at 3:00 AM UTC. Results are stored and used for compliance scoring.
              </Typography>
            </Alert>
          </Box>
        </Box>
      </TabPanel>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

