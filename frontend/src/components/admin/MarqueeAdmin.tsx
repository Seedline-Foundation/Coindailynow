'use client';

import React, { useState, useEffect } from 'react';
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

  // Load all marquees
  const loadMarquees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/marquees');
      const result = await response.json();
      
      if (result.success) {
        setMarquees(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load marquees');
      }
    } catch (err) {
      setError('Network error loading marquees');
    } finally {
      setIsLoading(false);
    }
  };

  // Save marquee
  const saveMarquee = async () => {
    try {
      const url = selectedMarquee 
        ? `/api/admin/marquees/${selectedMarquee.id}`
        : '/api/admin/marquees';
      
      const method = selectedMarquee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
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
      const response = await fetch(`/api/admin/marquees/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
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
      
      const response = await fetch(`/api/admin/marquees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...marquee,
          [field]: !marquee[field],
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadMarquees();
      } else {
        setError(result.error || `Failed to toggle ${field}`);
      }
    } catch (err) {
      setError(`Network error toggling ${field}`);
    }
  };

  // Update priority
  const updatePriority = async (id: string, direction: 'up' | 'down') => {
    try {
      const marquee = marquees.find(m => m.id === id);
      if (!marquee) return;
      
      const newPriority = direction === 'up' ? marquee.priority - 1 : marquee.priority + 1;
      
      const response = await fetch(`/api/admin/marquees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...marquee,
          priority: Math.max(1, newPriority),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadMarquees();
      } else {
        setError(result.error || 'Failed to update priority');
      }
    } catch (err) {
      setError('Network error updating priority');
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
      
      const response = await fetch('/api/admin/marquees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedData),
      });
      
      const result = await response.json();
      
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
                    onClick={() => setShowStyleEditor(true)}
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
    </div>
  );
};

export default MarqueeAdmin;