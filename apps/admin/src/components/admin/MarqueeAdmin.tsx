'use client';

import React, { useState, useEffect } from 'react';
import { marqueeApi } from '@/lib/marqueeApi';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';

// Types
interface MarqueeStyle {
  speed: number;
  direction: 'left' | 'right';
  pauseOnHover: boolean;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  fontWeight: string;
  height: string;
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  shadowColor: string;
  shadowBlur: string;
  showIcons: boolean;
  iconColor: string;
  iconSize: string;
  itemSpacing: string;
  paddingVertical: string;
  paddingHorizontal: string;
  gradient?: string;
  customCSS?: string;
}

interface MarqueeItem {
  id: string;
  type: 'token' | 'news' | 'custom' | 'link';
  title: string;
  subtitle?: string;
  description?: string;
  linkUrl?: string;
  linkTarget: '_self' | '_blank';
  symbol?: string;
  price?: number;
  change24h?: number;
  changePercent24h?: number;
  marketCap?: number;
  volume24h?: number;
  isHot: boolean;
  textColor?: string;
  bgColor?: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isVisible: boolean;
  clicks: number;
}

interface MarqueeData {
  id: string;
  name: string;
  title?: string;
  type: 'token' | 'news' | 'custom';
  position: 'header' | 'footer' | 'content';
  isActive: boolean;
  isPublished: boolean;
  priority: number;
  styles: MarqueeStyle;
  items: MarqueeItem[];
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

interface MarqueeFormData {
  name: string;
  title?: string;
  type: 'token' | 'news' | 'custom';
  position: 'header' | 'footer' | 'content';
  isActive: boolean;
  isPublished: boolean;
  priority: number;
  styles: MarqueeStyle;
}

const defaultStyle: MarqueeStyle = {
  speed: 50,
  direction: 'left',
  pauseOnHover: true,
  backgroundColor: '#1f2937',
  textColor: '#ffffff',
  fontSize: '14px',
  fontWeight: 'normal',
  height: '48px',
  borderRadius: '0px',
  borderWidth: '0px',
  borderColor: 'transparent',
  shadowColor: 'transparent',
  shadowBlur: '0px',
  showIcons: true,
  iconColor: '#f59e0b',
  iconSize: '20px',
  itemSpacing: '32px',
  paddingVertical: '12px',
  paddingHorizontal: '16px',
};

const MarqueeAdmin: React.FC = () => {
  const [marquees, setMarquees] = useState<MarqueeData[]>([]);
  const [selectedMarquee, setSelectedMarquee] = useState<MarqueeData | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewMarquee, setPreviewMarquee] = useState<MarqueeData | null>(null);
  const [tempStyles, setTempStyles] = useState<MarqueeStyle | null>(null);

  // Form data
  const [formData, setFormData] = useState<MarqueeFormData>({
    name: '',
    title: '',
    type: 'token',
    position: 'header',
    isActive: true,
    isPublished: false,
    priority: 1,
    styles: { ...defaultStyle },
  });

  // Load marquees on component mount
  useEffect(() => {
    loadMarquees();
  }, []);

  const openStyleEditor = () => {
    setTempStyles({
      ...defaultStyle,
      ...formData.styles
    });
    setShowStyleEditor(true);
  };

  const handleStyleChange = (key: keyof MarqueeStyle, value: any) => {
    if (tempStyles) {
      setTempStyles({
        ...tempStyles,
        [key]: value
      });
    }
  };

  const saveStyles = () => {
    if (tempStyles) {
      setFormData({
        ...formData,
        styles: { ...tempStyles }
      });
    }
    setShowStyleEditor(false);
  };

  // Load all marquees
  const loadMarquees = async () => {
    try {
      setIsLoading(true);
      const result = await marqueeApi.list();
      if (result.success) {
        setMarquees(result.data as MarqueeData[]);
        setError(null);
      } else {
        setError('Failed to load marquees');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error loading marquees');
    } finally {
      setIsLoading(false);
    }
  };

  // Save marquee
  const saveMarquee = async () => {
    try {
      const result = selectedMarquee
        ? await marqueeApi.update(selectedMarquee.id, formData)
        : await marqueeApi.create(formData);

      if (result.success) {
        setSuccess(selectedMarquee ? 'Marquee updated successfully' : 'Marquee created successfully');
        setShowEditor(false);
        setSelectedMarquee(null);
        loadMarquees();
        resetForm();
      } else {
        setError(result.error || 'Failed to save marquee');
      }
    } catch (err) {
      setError('Network error saving marquee');
    }
  };

  // Delete marquee
  const deleteMarquee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marquee?')) return;
    
    try {
      const result = await marqueeApi.remove(id);

      if (result.success) {
        setSuccess('Marquee deleted successfully');
        loadMarquees();
      } else {
        setError(result.error || 'Failed to delete marquee');
      }
    } catch (err) {
      setError('Network error deleting marquee');
    }
  };

  // Toggle marquee status
  const toggleMarqueeStatus = async (id: string, field: 'isActive' | 'isPublished') => {
    try {
      const marquee = marquees.find(m => m.id === id);
      if (!marquee) return;
      
      const result = await marqueeApi.update(id, {
        ...marquee,
        [field]: !marquee[field],
      });

      if (result.success) {
        loadMarquees();
      } else {
        setError(`Failed to toggle ${field}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Network error toggling ${field}`);
    }
  };

  // Update priority
  const updatePriority = async (id: string, direction: 'up' | 'down') => {
    try {
      const marquee = marquees.find(m => m.id === id);
      if (!marquee) return;
      
      const newPriority = direction === 'up' ? marquee.priority - 1 : marquee.priority + 1;
      
      const result = await marqueeApi.update(id, {
        ...marquee,
        priority: Math.max(1, newPriority),
      });

      if (result.success) {
        loadMarquees();
      } else {
        setError('Failed to update priority');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error updating priority');
    }
  };

  // Duplicate marquee
  const duplicateMarquee = async (id: string) => {
    try {
      const marquee = marquees.find(m => m.id === id);
      if (!marquee) return;
      
      const duplicatedData = {
        ...marquee,
        name: `${marquee.name} (Copy)`,
        isActive: false,
        isPublished: false,
        priority: Math.max(...marquees.map(m => m.priority)) + 1,
      };
      
      const result = await marqueeApi.create(duplicatedData);
      
      if (result.success) {
        setSuccess('Marquee duplicated successfully');
        loadMarquees();
      } else {
        setError(result.error || 'Failed to duplicate marquee');
      }
    } catch (err) {
      setError('Network error duplicating marquee');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      type: 'token',
      position: 'header',
      isActive: true,
      isPublished: false,
      priority: 1,
      styles: { ...defaultStyle },
    });
  };

  // Open editor for new marquee
  const createNewMarquee = () => {
    setSelectedMarquee(null);
    resetForm();
    setShowEditor(true);
  };

  // Open editor for existing marquee
  const editMarquee = (marquee: MarqueeData) => {
    setSelectedMarquee(marquee);
    setFormData({
      name: marquee.name,
      title: marquee.title || '',
      type: marquee.type,
      position: marquee.position,
      isActive: marquee.isActive,
      isPublished: marquee.isPublished,
      priority: marquee.priority,
      styles: { ...marquee.styles },
    });
    setShowEditor(true);
  };

  // Clear notifications
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marquee Management</h1>
          <p className="text-gray-600 mt-1">Create and manage scrolling marquees for your platform</p>
        </div>
        <button
          onClick={createNewMarquee}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Marquee
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading marquees...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Marquees List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">All Marquees ({marquees.length})</h2>
            </div>
            
            {marquees.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No marquees created yet</p>
                <button
                  onClick={createNewMarquee}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Create your first marquee
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {marquees.map((marquee) => (
                  <div key={marquee.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{marquee.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            marquee.position === 'header' ? 'bg-blue-100 text-blue-700' :
                            marquee.position === 'footer' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {marquee.position}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            marquee.type === 'token' ? 'bg-yellow-100 text-yellow-700' :
                            marquee.type === 'news' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {marquee.type}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Priority: {marquee.priority}</span>
                          <span>Items: {marquee.items?.length || 0}</span>
                          <span>Impressions: {marquee.impressions?.toLocaleString() || 0}</span>
                          <span>Clicks: {marquee.clicks?.toLocaleString() || 0}</span>
                          <span>Updated: {new Date(marquee.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Status Toggles */}
                        <button
                          onClick={() => toggleMarqueeStatus(marquee.id, 'isActive')}
                          className={`p-2 rounded ${
                            marquee.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title={marquee.isActive ? 'Active' : 'Inactive'}
                        >
                          {marquee.isActive ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => toggleMarqueeStatus(marquee.id, 'isPublished')}
                          className={`p-2 rounded ${
                            marquee.isPublished ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title={marquee.isPublished ? 'Published' : 'Unpublished'}
                        >
                          {marquee.isPublished ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                        </button>
                        
                        {/* Priority Controls */}
                        <button
                          onClick={() => updatePriority(marquee.id, 'up')}
                          className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Increase Priority"
                          disabled={marquee.priority === 1}
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => updatePriority(marquee.id, 'down')}
                          className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Decrease Priority"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                        
                        {/* Action Buttons */}
                        <button
                          onClick={() => duplicateMarquee(marquee.id)}
                          className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => editMarquee(marquee)}
                          className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setPreviewMarquee(marquee)}
                          className="p-2 rounded bg-green-100 text-green-600 hover:bg-green-200"
                          title="Preview"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteMarquee(marquee.id)}
                          className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedMarquee ? 'Edit Marquee' : 'Create New Marquee'}
                </h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); saveMarquee(); }} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="token">Token/Crypto</option>
                      <option value="news">News</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="header">Header</option>
                      <option value="footer">Footer</option>
                      <option value="content">Content</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    Active
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="mr-2"
                    />
                    Published
                  </label>
                </div>

                {/* Style Editor Button */}
                <div>
                  <button
                    type="button"
                    onClick={openStyleEditor}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    Configure Styles
                  </button>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedMarquee ? 'Update' : 'Create'} Marquee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMarquee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Preview: {previewMarquee.name}</h2>
                <button
                  onClick={() => setPreviewMarquee(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Preview Content */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Live Preview</h3>
                  {/* Here you would render the actual marquee component */}
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm text-gray-600 mb-2">
                      Marquee would appear here with current configuration
                    </p>
                    <div className="h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-center px-4">
                      <span className="animate-pulse">Simulated marquee content...</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Type:</strong> {previewMarquee.type}
                  </div>
                  <div>
                    <strong>Position:</strong> {previewMarquee.position}
                  </div>
                  <div>
                    <strong>Items:</strong> {previewMarquee.items?.length || 0}
                  </div>
                  <div>
                    <strong>Status:</strong> {previewMarquee.isActive ? 'Active' : 'Inactive'} / {previewMarquee.isPublished ? 'Published' : 'Draft'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Style Editor Modal */}
      {showStyleEditor && tempStyles && (
        <div className="fixed inset-0 bg-black bg-opacity-65 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Configure Marquee Styles</h2>
                  <p className="text-sm text-gray-500 mt-1">Customize visual styles and animation parameters</p>
                </div>
                <button
                  onClick={() => setShowStyleEditor(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Visual Preview Banner */}
                <div className="p-4 rounded border mb-6" style={{
                  backgroundColor: tempStyles.backgroundColor || '#1f2937',
                  color: tempStyles.textColor || '#ffffff',
                  fontSize: tempStyles.fontSize || '14px',
                  fontWeight: tempStyles.fontWeight || 'normal',
                  height: tempStyles.height || '48px',
                  borderRadius: tempStyles.borderRadius || '0px',
                  borderWidth: tempStyles.borderWidth || '0px',
                  borderColor: tempStyles.borderColor || 'transparent',
                  borderStyle: 'solid',
                  boxShadow: tempStyles.shadowColor && tempStyles.shadowBlur ? `0 0 ${tempStyles.shadowBlur} ${tempStyles.shadowColor}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: tempStyles.paddingHorizontal || '16px',
                  paddingRight: tempStyles.paddingHorizontal || '16px',
                  paddingTop: tempStyles.paddingVertical || '12px',
                  paddingBottom: tempStyles.paddingVertical || '12px',
                  background: tempStyles.gradient || undefined,
                }}>
                  <div className="flex items-center gap-2">
                    {tempStyles.showIcons && (
                      <span style={{ color: tempStyles.iconColor || '#f59e0b', fontSize: tempStyles.iconSize || '20px' }}>★</span>
                    )}
                    <span>Sample Marquee Item</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ marginLeft: tempStyles.itemSpacing || '32px' }}>
                    {tempStyles.showIcons && (
                      <span style={{ color: tempStyles.iconColor || '#f59e0b', fontSize: tempStyles.iconSize || '20px' }}>🔥</span>
                    )}
                    <span>BTC $68,540 (+2.4%)</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ marginLeft: tempStyles.itemSpacing || '32px' }}>
                    {tempStyles.showIcons && (
                      <span style={{ color: tempStyles.iconColor || '#f59e0b', fontSize: tempStyles.iconSize || '20px' }}>⚡</span>
                    )}
                    <span>Breaking News: CoinDaily AI Launch!</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Animation & Dimensions */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Animation & Spacing</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Speed (pixels/sec): {tempStyles.speed}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={tempStyles.speed}
                        onChange={(e) => handleStyleChange('speed', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Direction
                        </label>
                        <select
                          value={tempStyles.direction}
                          onChange={(e) => handleStyleChange('direction', e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        >
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempStyles.pauseOnHover}
                            onChange={(e) => handleStyleChange('pauseOnHover', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">Pause on Hover</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Height
                        </label>
                        <input
                          type="text"
                          value={tempStyles.height}
                          onChange={(e) => handleStyleChange('height', e.target.value)}
                          placeholder="48px"
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Spacing
                        </label>
                        <input
                          type="text"
                          value={tempStyles.itemSpacing}
                          onChange={(e) => handleStyleChange('itemSpacing', e.target.value)}
                          placeholder="32px"
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Padding Vertical
                        </label>
                        <input
                          type="text"
                          value={tempStyles.paddingVertical}
                          onChange={(e) => handleStyleChange('paddingVertical', e.target.value)}
                          placeholder="12px"
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Padding Horizontal
                        </label>
                        <input
                          type="text"
                          value={tempStyles.paddingHorizontal}
                          onChange={(e) => handleStyleChange('paddingHorizontal', e.target.value)}
                          placeholder="16px"
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Colors & Typography */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Colors & Typography</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Background Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={tempStyles.backgroundColor?.startsWith('#') && tempStyles.backgroundColor.length === 7 ? tempStyles.backgroundColor : '#1f2937'}
                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                            className="p-1 w-10 h-10 border rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={tempStyles.backgroundColor}
                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={tempStyles.textColor?.startsWith('#') && tempStyles.textColor.length === 7 ? tempStyles.textColor : '#ffffff'}
                            onChange={(e) => handleStyleChange('textColor', e.target.value)}
                            className="p-1 w-10 h-10 border rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={tempStyles.textColor}
                            onChange={(e) => handleStyleChange('textColor', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Font Size
                        </label>
                        <select
                          value={tempStyles.fontSize}
                          onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        >
                          <option value="12px">12px (Small)</option>
                          <option value="14px">14px (Medium)</option>
                          <option value="16px">16px (Large)</option>
                          <option value="18px">18px (Extra Large)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Font Weight
                        </label>
                        <select
                          value={tempStyles.fontWeight}
                          onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="semibold">Semibold</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div className="flex items-center pt-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempStyles.showIcons}
                            onChange={(e) => handleStyleChange('showIcons', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">Show Icons</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Icon Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={tempStyles.iconColor?.startsWith('#') && tempStyles.iconColor.length === 7 ? tempStyles.iconColor : '#f59e0b'}
                            onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                            className="p-1 w-10 h-10 border rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={tempStyles.iconColor}
                            onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Icon Size
                        </label>
                        <input
                          type="text"
                          value={tempStyles.iconSize}
                          onChange={(e) => handleStyleChange('iconSize', e.target.value)}
                          placeholder="20px"
                          className="w-full p-2.5 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Borders & Shadows & Custom CSS */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Borders, Shadows & Advanced CSS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Border Width
                      </label>
                      <select
                        value={tempStyles.borderWidth}
                        onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg"
                      >
                        <option value="0px">0px</option>
                        <option value="1px">1px</option>
                        <option value="2px">2px</option>
                        <option value="3px">3px</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Border Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={tempStyles.borderColor?.startsWith('#') && tempStyles.borderColor.length === 7 ? tempStyles.borderColor : '#ffffff'}
                          onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                          className="p-1 w-10 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={tempStyles.borderColor}
                          onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Border Radius
                      </label>
                      <input
                        type="text"
                        value={tempStyles.borderRadius}
                        onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                        placeholder="0px"
                        className="w-full p-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shadow Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={tempStyles.shadowColor?.startsWith('#') && tempStyles.shadowColor.length === 7 ? tempStyles.shadowColor : '#000000'}
                          onChange={(e) => handleStyleChange('shadowColor', e.target.value)}
                          className="p-1 w-10 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={tempStyles.shadowColor}
                          onChange={(e) => handleStyleChange('shadowColor', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shadow Blur
                      </label>
                      <input
                        type="text"
                        value={tempStyles.shadowBlur}
                        onChange={(e) => handleStyleChange('shadowBlur', e.target.value)}
                        placeholder="0px"
                        className="w-full p-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gradient (e.g. `linear-gradient(90deg, #1f2937, #111827)`)
                      </label>
                      <input
                        type="text"
                        value={tempStyles.gradient || ''}
                        onChange={(e) => handleStyleChange('gradient', e.target.value)}
                        placeholder="linear-gradient(...)"
                        className="w-full p-2.5 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom CSS
                      </label>
                      <textarea
                        value={tempStyles.customCSS || ''}
                        onChange={(e) => handleStyleChange('customCSS', e.target.value)}
                        placeholder="e.g. text-transform: uppercase;"
                        className="w-full p-2.5 border border-gray-300 rounded-lg h-12"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-4 mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowStyleEditor(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveStyles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Apply Styles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarqueeAdmin;
