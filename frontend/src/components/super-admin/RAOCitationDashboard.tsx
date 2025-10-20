/**
 * RAO Citation Optimization Dashboard - Super Admin
 * Task 74: AI Citation Enhancement
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Schema as SchemaIcon,
  Psychology as AIIcon,
  QuestionAnswer as AnswerIcon,
  FormatQuote as CitationIcon,
  VerifiedUser as TrustIcon
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

export default function RAOCitationDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('schema');

  // Form states
  const [contentId, setContentId] = useState('');
  const [schemaType, setSchemaType] = useState('DefinedTerm');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
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

  const handleGenerateSchema = async () => {
    try {
      const response = await fetch('/api/rao-citation/schema-markup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType: 'article',
          schemaType,
          content: 'Sample content for schema generation'
        })
      });
      
      if (response.ok) {
        alert('Schema markup generated successfully!');
        setCreateDialogOpen(false);
        loadStats();
      }
    } catch (error) {
      console.error('Error generating schema:', error);
    }
  };

  const handleGenerateCanonicalAnswer = async () => {
    try {
      const response = await fetch('/api/rao-citation/canonical-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          question,
          answer,
          answerType: 'definition'
        })
      });
      
      if (response.ok) {
        alert('Canonical answer created successfully!');
        setCreateDialogOpen(false);
        loadStats();
      }
    } catch (error) {
      console.error('Error creating canonical answer:', error);
    }
  };

  const handleAddCitation = async () => {
    try {
      const response = await fetch('/api/rao-citation/citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          sourceType: 'secondary',
          sourceTitle,
          sourceUrl
        })
      });
      
      if (response.ok) {
        alert('Citation added successfully!');
        setCreateDialogOpen(false);
        loadStats();
      }
    } catch (error) {
      console.error('Error adding citation:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>RAO Citation Optimization</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        RAO Citation Optimization Dashboard
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchemaIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Schema Markups</Typography>
              </Box>
              <Typography variant="h3">{stats?.totalSchemaMarkups || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                AI-optimized schema definitions
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AnswerIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Canonical Answers</Typography>
              </Box>
              <Typography variant="h3">{stats?.totalCanonicalAnswers || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                LLM-ready Q&A pairs
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CitationIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Citations</Typography>
              </Box>
              <Typography variant="h3">{stats?.totalCitations || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Verified source citations
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AIIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">LLM Metadata</Typography>
              </Box>
              <Typography variant="h3">{stats?.totalLLMMetadata || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                AI-optimized content pieces
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrustIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">Trust Signals</Typography>
              </Box>
              <Typography variant="h3">{stats?.totalTrustSignals || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Authority markers
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Avg Optimization</Typography>
              </Box>
              <Typography variant="h3">{stats?.avgOptimizationScore || 0}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats?.avgOptimizationScore || 0} 
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Overall LLM optimization score
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={() => {
            setSelectedType('schema');
            setCreateDialogOpen(true);
          }}
          sx={{ mr: 1 }}
        >
          Generate Schema
        </Button>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => {
            setSelectedType('answer');
            setCreateDialogOpen(true);
          }}
          sx={{ mr: 1 }}
        >
          Create Canonical Answer
        </Button>
        <Button 
          variant="contained" 
          color="warning"
          onClick={() => {
            setSelectedType('citation');
            setCreateDialogOpen(true);
          }}
        >
          Add Citation
        </Button>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Top Optimized" />
          <Tab label="Schema Markups" />
          <Tab label="Canonical Answers" />
          <Tab label="Citations" />
          <Tab label="Trust Signals" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Top 10 content pieces by LLM optimization score
          </Alert>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Content ID</TableCell>
                  <TableCell>Optimization Score</TableCell>
                  <TableCell>Schema Markups</TableCell>
                  <TableCell>Answers</TableCell>
                  <TableCell>Citations</TableCell>
                  <TableCell>Trust Signals</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.topOptimizedContent?.map((content: any) => (
                  <TableRow key={content.contentId}>
                    <TableCell>{content.contentId}</TableCell>
                    <TableCell>
                      <Chip 
                        label={content.llmOptimizationScore} 
                        color={content.llmOptimizationScore >= 80 ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{content.totalSchemaMarkups}</TableCell>
                    <TableCell>{content.totalCanonicalAnswers}</TableCell>
                    <TableCell>{content.totalCitations}</TableCell>
                    <TableCell>{content.totalTrustSignals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Schema Markups</Typography>
          <Typography variant="body2" color="text.secondary">
            AI-specific schema markup for definitions, facts, and quotes
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Canonical Answers</Typography>
          <Typography variant="body2" color="text.secondary">
            Clear, fact-based answers optimized for LLM retrieval
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Source Citations</Typography>
          <Typography variant="body2" color="text.secondary">
            Explicit source attributions with reliability scoring
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>Trust Signals</Typography>
          <Typography variant="body2" color="text.secondary">
            Authoritative content markers for enhanced credibility
          </Typography>
        </TabPanel>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedType === 'schema' && 'Generate Schema Markup'}
          {selectedType === 'answer' && 'Create Canonical Answer'}
          {selectedType === 'citation' && 'Add Citation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Content ID"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              sx={{ mb: 2 }}
            />

            {selectedType === 'schema' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Schema Type</InputLabel>
                <Select value={schemaType} onChange={(e) => setSchemaType(e.target.value)}>
                  <MenuItem value="DefinedTerm">Defined Term</MenuItem>
                  <MenuItem value="Claim">Claim</MenuItem>
                  <MenuItem value="Quotation">Quotation</MenuItem>
                  <MenuItem value="HowTo">How To</MenuItem>
                  <MenuItem value="FAQPage">FAQ Page</MenuItem>
                </Select>
              </FormControl>
            )}

            {selectedType === 'answer' && (
              <>
                <TextField
                  fullWidth
                  label="Question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  multiline
                  rows={4}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {selectedType === 'citation' && (
              <>
                <TextField
                  fullWidth
                  label="Source Title"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Source URL"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedType === 'schema') handleGenerateSchema();
              if (selectedType === 'answer') handleGenerateCanonicalAnswer();
              if (selectedType === 'citation') handleAddCitation();
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
