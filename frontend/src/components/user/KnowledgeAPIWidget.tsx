import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Link,
  Alert,
} from '@mui/material';
import {
  Code as CodeIcon,
  Description as DescriptionIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

export default function KnowledgeAPIWidget() {
  const [manifest, setManifest] = useState<any>(null);

  useEffect(() => {
    fetchManifest();
  }, []);

  const fetchManifest = async () => {
    try {
      const response = await fetch('/api/knowledge-api/manifest');
      if (response.ok) {
        const data = await response.json();
        setManifest(data);
      }
    } catch (error) {
      console.error('Error fetching manifest:', error);
    }
  };

  if (!manifest) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Developer API Access</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          Access our knowledge API for LLM integration, RAG feeds, and structured crypto data.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={`${manifest.data_types.length} Data Types`} size="small" />
          <Chip
            label={`${manifest.api_endpoints.length} Endpoints`}
            size="small"
            color="primary"
          />
          <Chip label="LLM-Optimized" size="small" color="success" />
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Popular Uses:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Train LLMs on crypto data</li>
            <li>Build RAG applications</li>
            <li>Integrate real-time news feeds</li>
            <li>Access structured knowledge</li>
          </ul>
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DescriptionIcon />}
            href="/api/knowledge-api/manifest"
            target="_blank"
          >
            View Manifest
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<OpenInNewIcon />}
            href="/docs/api"
            target="_blank"
          >
            API Docs
          </Button>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" component="div" gutterBottom>
            <strong>Quick Example:</strong>
          </Typography>
          <Typography
            variant="caption"
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`GET /api/knowledge-api/search
?query=bitcoin&limit=5

Headers:
X-API-Key: your_api_key`}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Need an API key?{' '}
          <Link href="/contact" underline="hover">
            Contact us
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
}

