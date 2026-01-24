/**
 * AI-Powered Search Widget for User Dashboard
 * Task 72: User-facing semantic search interface
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  Article as ArticleIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

interface SearchResult {
  id: string;
  contentId: string;
  contentType: string;
  score: number;
  metadata?: {
    title?: string;
    excerpt?: string;
    category?: string;
  };
}

export default function AISearchWidget() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/embedding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          limit: 5,
          keywordWeight: 0.5,
          vectorWeight: 0.5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSearchTime(data.queryTimeMs || 0);
        setExpanded(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1 }} />
            AI-Powered Search
          </Typography>
          <Chip
            label="Vector + Keyword"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <TextField
          fullWidth
          placeholder="Search articles with AI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {results.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Found {results.length} results in {searchTime}ms
              </Typography>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={expanded}>
              <List dense>
                {results.map((result, index) => (
                  <ListItem
                    key={result.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ArticleIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary={result.metadata?.title || `Result ${index + 1}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {result.metadata?.excerpt || 'No description'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={result.contentType}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`Score: ${(result.score * 100).toFixed(1)}%`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {!loading && query && results.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
            No results found. Try a different query.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

