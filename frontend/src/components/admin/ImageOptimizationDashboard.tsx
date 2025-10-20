/**
 * Image Optimization Dashboard - Task 81
 * Super Admin dashboard for image optimization system
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload,
  Image as ImageIcon,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  Speed,
  Storage,
  Assessment,
  Collections, // Using Collections instead of Batch
  FormatShapes,
  Opacity, // Using Opacity instead of Watermark
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
export default function ImageOptimizationDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const [optimizationOptions, setOptimizationOptions] = useState({
    quality: 80,
    format: 'auto',
    generateThumbnails: true,
    preserveMetadata: false,
    smartCrop: true,
    watermarkId: '',
  });

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/image-optimization/statistics');
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleOptimizeImage = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('quality', optimizationOptions.quality.toString());
      formData.append('format', optimizationOptions.format);
      formData.append('generateThumbnails', optimizationOptions.generateThumbnails.toString());
      formData.append('preserveMetadata', optimizationOptions.preserveMetadata.toString());
      formData.append('smartCrop', optimizationOptions.smartCrop.toString());
      if (optimizationOptions.watermarkId) {
        formData.append('watermarkId', optimizationOptions.watermarkId);
      }

      const response = await fetch('/api/image-optimization/optimize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert('Image optimized successfully!');
        setUploadDialogOpen(false);
        setSelectedFile(null);
        fetchStatistics();
      } else {
        alert(`Optimization failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Failed to optimize image');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const overviewStats = statistics?.overview || {};
  const todayMetrics = statistics?.today || {};
  const recentBatches = statistics?.recentBatches || [];
  const formats = statistics?.formats || [];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <ImageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Image Optimization System
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Upload & Optimize
          </Button>
          <Button
            variant="outlined"
            startIcon={<Collections />}
            onClick={() => setBatchDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Batch Process
          </Button>
          <IconButton onClick={fetchStatistics}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Images
              </Typography>
              <Typography variant="h4">{overviewStats.totalImages || 0}</Typography>
              <Typography variant="caption" color="success.main">
                {todayMetrics.totalImagesProcessed || 0} today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4">{overviewStats.successRate?.toFixed(1) || 0}%</Typography>
              <Typography variant="caption" color="textSecondary">
                {overviewStats.failedImages || 0} failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Bytes Saved
              </Typography>
              <Typography variant="h4">
                {formatBytes(todayMetrics.totalBytesSaved || 0)}
              </Typography>
              <Typography variant="caption" color="success.main">
                {todayMetrics.avgCompressionRatio?.toFixed(1) || 0}% avg
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Processing
              </Typography>
              <Typography variant="h4">{overviewStats.processingImages || 0}</Typography>
              <Typography variant="caption" color="textSecondary">
                {todayMetrics.avgProcessingTime || 0}ms avg
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} aria-label="image optimization tabs">
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<ImageIcon />} label="Images" />
          <Tab icon={<Collections />} label="Batches" />
          <Tab icon={<FormatShapes />} label="Formats" />
          <Tab icon={<Opacity />} label="Watermarks" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Daily Processing Volume
                </Typography>
                {todayMetrics.totalImagesProcessed > 0 ? (
                  <Box>
                    <Typography variant="body1">
                      Images Processed Today: {todayMetrics.totalImagesProcessed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Chart visualization requires chart.js installation
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">No processing data for today</Alert>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Format Distribution
                </Typography>
                {formats.length > 0 ? (
                  <Box>
                    {formats.map((f: any) => (
                      <Box key={f.id} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          {f.format.toUpperCase()}: {f.usageCount} images
                        </Typography>
                      </Box>
                    ))}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Chart visualization requires chart.js installation
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">No format data available</Alert>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Optimization Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Original Size
                      </Typography>
                      <Typography variant="h5">
                        {formatBytes(todayMetrics.totalOriginalSize || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Optimized Size
                      </Typography>
                      <Typography variant="h5">
                        {formatBytes(todayMetrics.totalOptimizedSize || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Savings
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {formatBytes(todayMetrics.totalBytesSaved || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Images Tab */}
        <TabPanel value={tabValue} index={1}>
          <ImagesTable />
        </TabPanel>

        {/* Batches Tab */}
        <TabPanel value={tabValue} index={2}>
          <BatchesTable batches={recentBatches} />
        </TabPanel>

        {/* Formats Tab */}
        <TabPanel value={tabValue} index={3}>
          <FormatsTable formats={formats} />
        </TabPanel>

        {/* Watermarks Tab */}
        <TabPanel value={tabValue} index={4}>
          <WatermarksTable />
        </TabPanel>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Optimize Image</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
              Select Image
              <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
            </Button>
            {selectedFile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
              </Alert>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Quality</InputLabel>
              <Select
                value={optimizationOptions.quality}
                onChange={(e) => setOptimizationOptions({ ...optimizationOptions, quality: Number(e.target.value) })}
              >
                <MenuItem value={60}>Low (60)</MenuItem>
                <MenuItem value={80}>Medium (80)</MenuItem>
                <MenuItem value={90}>High (90)</MenuItem>
                <MenuItem value={100}>Maximum (100)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Output Format</InputLabel>
              <Select
                value={optimizationOptions.format}
                onChange={(e) => setOptimizationOptions({ ...optimizationOptions, format: e.target.value })}
              >
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="webp">WebP</MenuItem>
                <MenuItem value="avif">AVIF</MenuItem>
                <MenuItem value="jpeg">JPEG</MenuItem>
                <MenuItem value="png">PNG</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleOptimizeImage}
            disabled={!selectedFile || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {processing ? 'Processing...' : 'Optimize'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper Components
function ImagesTable() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/image-optimization/images?limit=50');
      const data = await response.json();
      if (data.success) {
        setImages(data.data.images);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Original Path</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Savings</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell>{image.originalPath.substring(image.originalPath.lastIndexOf('/') + 1)}</TableCell>
              <TableCell>{formatBytes(image.originalSize)}</TableCell>
              <TableCell>
                <Chip
                  label={`${image.savingsPercent.toFixed(1)}%`}
                  color="success"
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={image.status}
                  color={image.status === 'completed' ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell>{new Date(image.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function BatchesTable({ batches }: { batches: any[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Images</TableCell>
            <TableCell>Savings</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell>{batch.name}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress variant="determinate" value={batch.progressPercent} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {batch.progressPercent.toFixed(0)}%
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                {batch.processedImages} / {batch.totalImages}
              </TableCell>
              <TableCell>{formatBytes(batch.totalSizeSavings)}</TableCell>
              <TableCell>
                <Chip label={batch.status} color={batch.status === 'completed' ? 'success' : 'info'} size="small" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function FormatsTable({ formats }: { formats: any[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Format</TableCell>
            <TableCell>Usage Count</TableCell>
            <TableCell>Bytes Saved</TableCell>
            <TableCell>Avg Compression</TableCell>
            <TableCell>Browser Support</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {formats.map((format) => (
            <TableRow key={format.id}>
              <TableCell>
                <Chip label={format.format.toUpperCase()} size="small" />
              </TableCell>
              <TableCell>{format.usageCount}</TableCell>
              <TableCell>{formatBytes(format.totalBytesSaved)}</TableCell>
              <TableCell>{format.avgCompressionRatio.toFixed(1)}%</TableCell>
              <TableCell>
                <Typography variant="caption">{format.mimeType}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function WatermarksTable() {
  const [watermarks, setWatermarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatermarks();
  }, []);

  const fetchWatermarks = async () => {
    try {
      const response = await fetch('/api/image-optimization/watermarks');
      const data = await response.json();
      if (data.success) {
        setWatermarks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch watermarks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Opacity</TableCell>
            <TableCell>Usage Count</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {watermarks.map((watermark) => (
            <TableRow key={watermark.id}>
              <TableCell>{watermark.name}</TableCell>
              <TableCell>{watermark.defaultPosition}</TableCell>
              <TableCell>{(watermark.defaultOpacity * 100).toFixed(0)}%</TableCell>
              <TableCell>{watermark.usageCount}</TableCell>
              <TableCell>
                <Chip label={watermark.isActive ? 'Active' : 'Inactive'} color={watermark.isActive ? 'success' : 'default'} size="small" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
