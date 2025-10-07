/**
 * Avatar Upload Component
 * Task 25: User Profile & Settings
 * 
 * Component for uploading and managing user avatars
 */

'use client';

import React, { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { AvatarUploadProps } from '../../types/profile';

export function AvatarUpload({
  currentAvatar,
  onUpload,
  isUploading = false,
  size = 'medium'
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const handleFileSelect = (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image file must be smaller than 5MB');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Call upload handler
    onUpload(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const avatarSrc = previewUrl || currentAvatar;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Preview */}
      <div
        className={clsx(
          'relative rounded-full overflow-hidden border-4 border-neutral-200 bg-neutral-100 cursor-pointer transition-all duration-200',
          sizeClasses[size],
          dragOver && 'border-primary-500 bg-primary-50',
          isUploading && 'opacity-60'
        )}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Profile avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="text-white text-center">
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-xs">Change</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Instructions */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
        >
          {avatarSrc ? 'Change Avatar' : 'Upload Avatar'}
        </button>
        <p className="text-xs text-neutral-500 mt-1">
          PNG, JPG, GIF up to 5MB
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          Or drag and drop an image
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}