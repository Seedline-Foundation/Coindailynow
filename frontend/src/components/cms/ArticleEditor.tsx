/**
 * Article Editor Component - Rich text editor for article creation and editing
 * Features: WYSIWYG editing, media insertion, auto-save, collaboration cursors
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  LinkIcon,
  PhotoIcon,
  ListBulletIcon,
  EyeIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { 
  CreateArticleInput, 
  UpdateArticleInput, 
  Category 
} from '../../services/cmsService';

interface ArticleEditorProps {
  formData: Partial<CreateArticleInput | UpdateArticleInput>;
  onChange: (data: Partial<CreateArticleInput | UpdateArticleInput>) => void;
  validationErrors: { [key: string]: string };
  categories: Category[];
  readingTime: number;
  onMediaUpload: (file: File) => Promise<void>;
  onShowMediaGallery?: () => void;
  enableRealTimeCollaboration?: boolean;
}

interface EditorState {
  showPreview: boolean;
  isFullscreen: boolean;
  cursorPosition: number;
  selection: { start: number; end: number };
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  formData,
  onChange,
  validationErrors,
  categories,
  readingTime,
  onMediaUpload,
  onShowMediaGallery,
  enableRealTimeCollaboration = false
}) => {
  const [editorState, setEditorState] = useState<EditorState>({
    showPreview: false,
    isFullscreen: false,
    cursorPosition: 0,
    selection: { start: 0, end: 0 }
  });

  const titleRef = useRef<HTMLInputElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    onChange({
      ...formData,
      [field]: value
    });
  }, [formData, onChange]);

  // Handle tag input
  const handleTagsChange = useCallback((value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleFieldChange('tags', tags);
  }, [handleFieldChange]);

  // Text formatting functions
  const insertAtCursor = useCallback((text: string, wrapText: boolean = false) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content || '';
    
    let newContent;
    if (wrapText && start !== end) {
      // Wrap selected text
      const selectedText = currentContent.substring(start, end);
      newContent = currentContent.substring(0, start) + 
                  text + selectedText + text + 
                  currentContent.substring(end);
    } else {
      // Insert at cursor
      newContent = currentContent.substring(0, start) + 
                  text + 
                  currentContent.substring(end);
    }
    
    handleFieldChange('content', newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [formData.content, handleFieldChange]);

  // Formatting toolbar handlers
  const formatBold = () => insertAtCursor('**', true);
  const formatItalic = () => insertAtCursor('_', true);
  const formatLink = () => insertAtCursor('[Link Text](url)', false);
  const insertBulletList = () => insertAtCursor('\n- ', false);
  const insertCode = () => insertAtCursor('`', true);

  // Media upload handler
  const handleMediaClick = () => {
    if (onShowMediaGallery) {
      onShowMediaGallery();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onMediaUpload(file);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            formatBold();
            break;
          case 'i':
            e.preventDefault();
            formatItalic();
            break;
          case 'k':
            e.preventDefault();
            formatLink();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Preview mode toggle
  const togglePreview = () => {
    setEditorState(prev => ({
      ...prev,
      showPreview: !prev.showPreview
    }));
  };

  // Render markdown preview (simplified)
  const renderPreview = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n- (.*?)(?=\n|$)/g, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-6">
      {/* Article Metadata */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          Article Details
        </h3>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Title
            </label>
            <input
              ref={titleRef}
              id="title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter article title..."
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.title 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-neutral-300 dark:border-neutral-600'
              } bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white`}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.categoryId || ''}
              onChange={(e) => handleFieldChange('categoryId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.categoryId 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-neutral-300 dark:border-neutral-600'
              } bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {validationErrors.categoryId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.categoryId}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="crypto, africa, bitcoin (comma separated)"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.tags 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-neutral-300 dark:border-neutral-600'
              } bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white`}
            />
            {validationErrors.tags && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.tags}</p>
            )}
          </div>

          {/* Premium content toggle */}
          <div className="flex items-center">
            <input
              id="isPremium"
              type="checkbox"
              checked={formData.isPremium || false}
              onChange={(e) => handleFieldChange('isPremium', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="isPremium" className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
              Premium Content
            </label>
          </div>
        </div>
      </div>

      {/* Excerpt */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
            Excerpt
          </h3>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formData.excerpt?.length || 0}/500 characters
          </span>
        </div>
        
        <textarea
          ref={excerptRef}
          value={formData.excerpt || ''}
          onChange={(e) => handleFieldChange('excerpt', e.target.value)}
          placeholder="Write a compelling excerpt for your article..."
          rows={4}
          maxLength={500}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
            validationErrors.excerpt 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'border-neutral-300 dark:border-neutral-600'
          } bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white`}
        />
        {validationErrors.excerpt && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.excerpt}</p>
        )}
      </div>

      {/* Content Editor */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        {/* Editor Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
              Content
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Reading time: {readingTime} min
              </span>
              <button
                onClick={togglePreview}
                className={`p-2 rounded-md transition-colors ${
                  editorState.showPreview 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 p-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={formatBold}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Bold (Ctrl+B)"
            >
              <BoldIcon className="h-4 w-4" />
            </button>
            <button
              onClick={formatItalic}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Italic (Ctrl+I)"
            >
              <ItalicIcon className="h-4 w-4" />
            </button>
            <button
              onClick={formatLink}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Link (Ctrl+K)"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              onClick={insertBulletList}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Bullet List"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={insertCode}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Code"
            >
              <CodeBracketIcon className="h-4 w-4" />
            </button>
            <div className="border-l border-neutral-200 dark:border-neutral-600 mx-2 h-6" />
            <button
              onClick={handleMediaClick}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Insert Media"
              aria-label="Insert Media"
            >
              <PhotoIcon className="h-4 w-4" />
              <span className="sr-only">Insert Media</span>
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="p-6">
          {editorState.showPreview ? (
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: renderPreview(formData.content || 'Start writing your article...')
              }}
            />
          ) : (
            <textarea
              ref={contentRef}
              data-testid="content-editor"
              data-collaboration-enabled={enableRealTimeCollaboration}
              value={formData.content || ''}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="Start writing your article content here...

You can use markdown formatting:
**Bold text**
_Italic text_
`Code`
- Bullet points
[Links](url)"
              rows={20}
              className={`w-full px-0 py-0 border-0 focus:ring-0 resize-none font-mono text-sm leading-relaxed ${
                validationErrors.content 
                  ? 'bg-red-50 dark:bg-red-900/20' 
                  : ''
              } bg-transparent text-neutral-900 dark:text-white placeholder-neutral-500`}
            />
          )}
          
          {validationErrors.content && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.content}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <div>
              {formData.content?.length || 0} characters
            </div>
            <div>
              {formData.content ? formData.content.split(/\s+/).filter(word => word.length > 0).length : 0} words
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          Featured Image
        </h3>
        
        {formData.featuredImageUrl ? (
          <div className="space-y-4">
            <img
              src={formData.featuredImageUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Featured image selected
              </span>
              <button
                onClick={() => handleFieldChange('featuredImageUrl', '')}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleMediaClick}
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-md p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
          >
            <PhotoIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Click to upload featured image
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Featured Image"
      />
    </div>
  );
};

export default ArticleEditor;
