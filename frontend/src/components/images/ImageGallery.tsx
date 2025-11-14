/**
 * Image Gallery Component
 * TASK 8.2: AI-Generated Visuals
 * 
 * Features:
 * - Display multiple AI-generated images
 * - Lazy loading with intersection observer
 * - Lightbox for full-size viewing
 * - Chart visualizations
 * - Social media graphics
 * - Responsive grid layout
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ImageGalleryProps {
  articleId: string;
  imageTypes?: string[]; // Filter by specific types
  maxImages?: number;
  columns?: 2 | 3 | 4;
  showCharts?: boolean;
  className?: string;
}

interface GalleryImage {
  id: string;
  imageType: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText: string;
  width?: number;
  height?: number;
  webpUrl?: string;
  avifUrl?: string;
  chartType?: string;
  chartSymbol?: string;
  caption?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  articleId,
  imageTypes = ['gallery', 'chart', 'social', 'infographic'],
  maxImages = 12,
  columns = 3,
  showCharts = true,
  className = '',
}) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchGalleryImages();
    setupIntersectionObserver();

    return () => {
      observerRef.current?.disconnect();
    };
  }, [articleId]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/articles/${articleId}/images`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery images');
      }

      const data = await response.json();
      
      // Filter by image types
      const filtered = data.data.filter((img: GalleryImage) =>
        imageTypes.includes(img.imageType.toLowerCase())
      );

      // Apply max images limit
      setImages(filtered.slice(0, maxImages));
    } catch (err) {
      console.error('[ImageGallery] Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupIntersectionObserver = () => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imageId = entry.target.getAttribute('data-image-id');
            if (imageId) {
              setLoadedImages((prev) => new Set([...prev, imageId]));
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );
  };

  const observeImage = (element: HTMLDivElement | null, imageId: string) => {
    if (element && observerRef.current) {
      element.setAttribute('data-image-id', imageId);
      observerRef.current.observe(element);
    }
  };

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = ''; // Restore scroll
  };

  const getImageTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      gallery: 'Gallery',
      chart: 'Market Chart',
      social: 'Social Media',
      infographic: 'Infographic',
    };
    return labels[type.toLowerCase()] || type;
  };

  const getImageTypeIcon = (type: string): JSX.Element => {
    switch (type.toLowerCase()) {
      case 'chart':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'social':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={`image-gallery-skeleton ${className}`}>
        <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`image-gallery-empty ${className}`}>
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>No gallery images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`image-gallery ${className}`}>
        <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
          {images.map((image) => (
            <div
              key={image.id}
              ref={(el) => observeImage(el, image.id)}
              className="image-gallery-item relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              onClick={() => openLightbox(image)}
            >
              {/* Lazy loaded image */}
              {loadedImages.has(image.id) ? (
                <picture>
                  {image.avifUrl && (
                    <source srcSet={image.avifUrl} type="image/avif" />
                  )}
                  {image.webpUrl && (
                    <source srcSet={image.webpUrl} type="image/webp" />
                  )}
                  <img
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={image.altText}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                </picture>
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}

              {/* Overlay with image info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 text-white text-sm mb-2">
                    {getImageTypeIcon(image.imageType)}
                    <span>{getImageTypeLabel(image.imageType)}</span>
                  </div>
                  
                  {image.chartSymbol && (
                    <div className="text-white text-xs font-mono">
                      {image.chartSymbol}
                    </div>
                  )}
                  
                  {image.caption && (
                    <p className="text-white text-sm mt-2 line-clamp-2">
                      {image.caption}
                    </p>
                  )}
                </div>
              </div>

              {/* AI badge */}
              <div className="absolute top-2 right-2 z-10">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  AI
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Full-size image */}
            <picture>
              {selectedImage.avifUrl && (
                <source srcSet={selectedImage.avifUrl} type="image/avif" />
              )}
              {selectedImage.webpUrl && (
                <source srcSet={selectedImage.webpUrl} type="image/webp" />
              )}
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.altText}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            </picture>

            {/* Image info */}
            <div className="mt-4 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getImageTypeIcon(selectedImage.imageType)}
                <span>{getImageTypeLabel(selectedImage.imageType)}</span>
              </div>
              
              <p className="text-sm text-gray-300">{selectedImage.altText}</p>
              
              {selectedImage.chartSymbol && (
                <div className="mt-2 text-xs font-mono text-purple-300">
                  {selectedImage.chartSymbol} • {selectedImage.chartType}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;

