import { useState, useEffect } from 'react';
import { Document, DocumentContent } from '../types';

interface PreloadedImage {
  url: string;
  loaded: boolean;
  element: HTMLImageElement;
}

export const useImagePreloader = (
  documents: Document[],
  documentContent: Record<string, Record<number, DocumentContent>>
) => {
  const [preloadedImages, setPreloadedImages] = useState<Record<string, PreloadedImage>>({});
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  const preloadAllImages = async () => {
    if (Object.keys(documentContent).length === 0) return;

    setIsPreloading(true);
    const allImageUrls: string[] = [];
    
    // Collect all image URLs
    Object.values(documentContent).forEach(docPages => {
      Object.values(docPages).forEach(pageContent => {
        allImageUrls.push(pageContent.imageUrl);
      });
    });

    if (allImageUrls.length === 0) {
      setIsPreloading(false);
      setAllImagesLoaded(true);
      return;
    }

    const preloadPromises = allImageUrls.map((url, index) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        
        const handleLoad = () => {
          setPreloadedImages(prev => ({
            ...prev,
            [url]: { url, loaded: true, element: img }
          }));
          
          // Update progress
          const loadedCount = index + 1;
          const progress = (loadedCount / allImageUrls.length) * 100;
          setPreloadProgress(progress);
          
          resolve();
        };

        const handleError = () => {
          console.warn(`Failed to preload image: ${url}`);
          setPreloadedImages(prev => ({
            ...prev,
            [url]: { url, loaded: false, element: img }
          }));
          resolve();
        };

        img.onload = handleLoad;
        img.onerror = handleError;
        img.src = url;
      });
    });

    await Promise.all(preloadPromises);
    setIsPreloading(false);
    setAllImagesLoaded(true);
  };

  // Start preloading when document content is available
  useEffect(() => {
    if (Object.keys(documentContent).length > 0) {
      preloadAllImages();
    }
  }, [documentContent]);

  const isImagePreloaded = (url: string): boolean => {
    return preloadedImages[url]?.loaded || false;
  };

  const getPreloadedImage = (url: string): HTMLImageElement | null => {
    return preloadedImages[url]?.element || null;
  };

  return {
    preloadedImages,
    preloadProgress,
    isPreloading,
    allImagesLoaded,
    isImagePreloaded,
    getPreloadedImage,
    preloadAllImages
  };
};