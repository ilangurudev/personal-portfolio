import React, { useState, useEffect, useMemo } from 'react';
import { InfinitePhotoGallery } from './InfinitePhotoGallery';
import { getPhotoUrl } from '../../utils/url-helper';

interface Photo {
  id: string;
  data: {
    title: string;
    filename: string;
    album?: string;
    albumTitle?: string;
    tags?: string[];
    camera?: string;
    settings?: string;
    focalLength?: number;
    location?: string;
    date: string | Date;
  };
}

interface FilteredPhotoGalleryProps {
  allPhotos: Photo[];
  initialActiveTags: string[];
  onFilterChange?: (filteredPhotos: Photo[]) => void;
}

export const FilteredPhotoGallery: React.FC<FilteredPhotoGalleryProps> = ({
  allPhotos,
  initialActiveTags,
  onFilterChange
}) => {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set(initialActiveTags));

  // Listen for tag filter changes from vanilla JS
  useEffect(() => {
    const handleTagFilterChange = (event: CustomEvent) => {
      const newTags = new Set((event.detail?.activeTags || []).map((t: string) => t.toLowerCase()));
      setActiveTags(newTags);
    };

    window.addEventListener('tagFilterChange', handleTagFilterChange as EventListener);
    return () => {
      window.removeEventListener('tagFilterChange', handleTagFilterChange as EventListener);
    };
  }, []);

  // Filter photos based on active tags (AND logic - must have ALL active tags)
  const filteredPhotos = useMemo(() => {
    if (activeTags.size === 0) return [];
    
    return allPhotos.filter(photo => {
      const photoTags = (photo.data.tags || []).map(t => String(t).toLowerCase().trim());
      return Array.from(activeTags).every(tag => photoTags.includes(tag.toLowerCase()));
    }).sort((a, b) => {
      const dateA = typeof a.data.date === 'string' ? new Date(a.data.date) : a.data.date;
      const dateB = typeof b.data.date === 'string' ? new Date(b.data.date) : b.data.date;
      return dateB.getTime() - dateA.getTime();
    });
  }, [allPhotos, activeTags]);

  // Notify parent of filter changes and update lightbox
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredPhotos);
    }
    
    // Update lightbox via global function
    if (typeof window !== 'undefined' && (window as any).updateLightboxFromFilter) {
      // Convert to lightbox format
      const lightboxPhotos = filteredPhotos.map(p => {
        const url = getPhotoUrl(p.data.filename);
        return {
          id: p.id,
          url,
          data: {
          title: p.data.title,
          filename: p.data.filename,
          album: p.data.album,
          albumTitle: p.data.albumTitle,
          tags: p.data.tags || [],
          camera: p.data.camera,
          settings: p.data.settings,
          focalLength: p.data.focalLength,
          location: p.data.location
        }
      };
      });
      (window as any).updateLightboxFromFilter(lightboxPhotos);
    }
  }, [filteredPhotos, onFilterChange]);

  // Prepare photos for PhotoGallery (convert dates to strings)
  const galleryPhotos = useMemo(() => {
    return filteredPhotos.map(p => ({
      ...p,
      data: {
        ...p.data,
        date: typeof p.data.date === 'string' ? p.data.date : p.data.date.toISOString()
      }
    }));
  }, [filteredPhotos]);

  return <InfinitePhotoGallery photos={galleryPhotos} />;
};
