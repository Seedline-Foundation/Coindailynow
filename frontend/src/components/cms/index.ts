/**
 * CMS Components Index - Export all Content Management System components
 * Task 24: Content Management Interface
 */

export { ContentManagementInterface } from './ContentManagementInterface';
export { ArticleEditor } from './ArticleEditor';
export { WorkflowStatusPanel } from './WorkflowStatusPanel';
export { LanguageManager } from './LanguageManager';
export { MediaGallery } from './MediaGallery';
export { CollaborationPanel } from './CollaborationPanel';
export { default as SEOEditor } from './SEOEditor';

// Export types
export type {
  User,
  Article,
  Category,
  ContentWorkflow,
  ArticleTranslation,
  MediaFile,
  CreateArticleInput,
  UpdateArticleInput
} from '../../services/cmsService';