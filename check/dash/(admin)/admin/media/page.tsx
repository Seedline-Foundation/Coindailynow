'use client';

/**
 * Admin Media Management Page
 * Main page for managing all media files in the admin dashboard
 */

import { MediaLibrary } from '@/components/admin/MediaLibrary';

export default function MediaPage() {
  return (
    <div className="container mx-auto py-6">
      <MediaLibrary />
    </div>
  );
}
