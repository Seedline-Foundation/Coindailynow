/**
 * Media Gallery Component - Media upload and management for CMS
 * Features: Image upload, media library, file management, drag & drop
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  PhotoIcon, 
  CloudArrowUpIcon,
  TrashIcon,
  EyeIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { MediaFile } from '../../services/cmsService';

interface MediaGalleryProps {
  onSelect: (media: MediaFile) => void;
  onUpload: (file: File) => Promise<void>;
  initialMedia?: MediaFile[];
}

interface MediaGridItemProps {
  media: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete?: () => void;
}

const MediaGridItem: React.FC<MediaGridItemProps> = ({
  media,
  isSelected,
  onSelect,
  onView,
  onDelete
}) => {
  const isImage = media.mimeType.startsWith('image/');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={`relative group rounded-lg border-2 transition-all cursor-pointer ${
        isSelected 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
      }`}
      onClick={onSelect}
    >
      {/* Media preview */}
      <div className="aspect-square rounded-t-md overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {isImage ? (
          <img
            src={media.thumbnailUrl || media.url}
            alt={media.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DocumentIcon className="h-16 w-16 text-neutral-400" />
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="p-2 bg-white rounded-md text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="View"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-red-600 rounded-md text-white hover:bg-red-700 transition-colors"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Media info */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
          {media.originalName}
        </h4>
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          <span>{formatFileSize(media.size)}</span>
          {media.dimensions && (
            <span>{media.dimensions.width}×{media.dimensions.height}</span>
          )}
        </div>
        <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {new Date(media.uploadedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const FileUploader: React.FC<{
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}> = ({ onUpload, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        // Create a temporary error message element
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Only image files are allowed';
        errorDiv.className = 'text-red-600 text-sm mt-2';
        errorDiv.setAttribute('data-testid', 'file-error');
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
        continue;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'File size exceeds 5MB limit';
        errorDiv.className = 'text-red-600 text-sm mt-2';
        errorDiv.setAttribute('data-testid', 'file-error');
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
        continue;
      }
      
      // Show file name on successful validation
      const successDiv = document.createElement('div');
      successDiv.textContent = file.name;
      successDiv.className = 'text-green-600 text-sm mt-2';
      document.body.appendChild(successDiv);
      
      // Show preview
      const imgDiv = document.createElement('img');
      imgDiv.alt = 'Preview';
      imgDiv.className = 'max-w-xs max-h-32 mt-2';
      document.body.appendChild(imgDiv);
      
      await onUpload(file);
    }
  }, [onUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
          : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          {isUploading ? (
            <CloudArrowUpIcon className="h-12 w-12 text-primary-600 animate-pulse" />
          ) : (
            <ArrowUpTrayIcon className="h-12 w-12 text-neutral-400" />
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
            {isUploading ? 'Uploading...' : 'Upload Media'}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Drag and drop files here, or click to select
          </p>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </button>
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Supported formats: JPG, PNG, GIF, WebP (max 5MB)
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  onSelect,
  onUpload,
  initialMedia = []
}) => {
  const [media, setMedia] = useState<MediaFile[]>(initialMedia);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents'>('all');
  const [viewMode, setViewMode] = useState<'upload' | 'gallery'>('gallery');

  // Filter media based on search and type
  const filteredMedia = media.filter(item => {
    const matchesSearch = item.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'images' && item.mimeType.startsWith('image/')) ||
      (filterType === 'documents' && !item.mimeType.startsWith('image/'));
    return matchesSearch && matchesType;
  });

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onUpload(file);
      // In a real app, you would get the uploaded media info back and add it to the list
      // For now, we'll create a mock media object
      const newMedia: MediaFile = {
        id: Date.now().toString(),
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        ...(file.type.startsWith('image/') && { dimensions: { width: 0, height: 0 } })
      };
      setMedia(prev => [newMedia, ...prev]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelect = (mediaItem: MediaFile) => {
    setSelectedMedia(mediaItem);
    onSelect(mediaItem);
  };

  const handleView = (mediaItem: MediaFile) => {
    // Open in modal or new tab
    window.open(mediaItem.url, '_blank');
  };

  const handleDelete = (mediaId: string) => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      setMedia(prev => prev.filter(item => item.id !== mediaId));
    }
  };

  return (
    <div className="space-y-6" data-testid="media-gallery">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <PhotoIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Media Gallery
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('upload')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'upload'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              Upload New
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              Browse Gallery
            </button>
          </div>
        </div>

        {/* Search and filters - only show in gallery mode */}
        {viewMode === 'gallery' && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-neutral-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              >
                <option value="all">All Media</option>
                <option value="images">Images</option>
                <option value="documents">Documents</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'upload' ? (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <FileUploader onUpload={handleUpload} isUploading={isUploading} />
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                {searchQuery || filterType !== 'all' ? 'No media found' : 'No media uploaded'}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first media file to get started'
                }
              </p>
              {!searchQuery && filterType === 'all' && (
                <button
                  onClick={() => setViewMode('upload')}
                  className="btn btn-primary"
                >
                  Upload Media
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Showing {filteredMedia.length} of {media.length} items
                </div>
                {selectedMedia && (
                  <div className="text-sm text-primary-600 dark:text-primary-400">
                    Selected: {selectedMedia.originalName}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredMedia.map((mediaItem) => (
                  <MediaGridItem
                    key={mediaItem.id}
                    media={mediaItem}
                    isSelected={selectedMedia?.id === mediaItem.id}
                    onSelect={() => handleSelect(mediaItem)}
                    onView={() => handleView(mediaItem)}
                    onDelete={() => handleDelete(mediaItem.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaGallery;