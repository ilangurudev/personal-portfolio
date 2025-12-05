import React, { useState, useEffect, useMemo } from 'react';
import { InfinitePhotoGallery } from './InfinitePhotoGallery';
import { getPhotoUrl } from '../../utils/url-helper';
import { normalizeTag } from '../../utils/client/tag-utils';

interface Photo {
  id: string;
  data: {
    title: string;
    filename: string;
    order_score?: number;
    album?: string;
    albumTitle?: string;
    tags?: string[];
    camera?: string;
    settings?: string;
    focalLength?: number;
    location?: string;
    date: string | Date;
    position?: 'top' | 'middle' | 'bottom';
  };
}

interface FilteredPhotoGalleryProps {
  allPhotos: Photo[];
  initialActiveTags: string[];
  initialTagLogic?: 'and' | 'or';
  onFilterChange?: (filteredPhotos: Photo[]) => void;
}

export const FilteredPhotoGallery: React.FC<FilteredPhotoGalleryProps> = ({
  allPhotos,
  initialActiveTags,
  initialTagLogic = 'or',
  onFilterChange
}) => {
  const [activeTags, setActiveTags] = useState<Set<string>>(
    new Set((initialActiveTags || []).map(normalizeTag))
  );
  const [tagLogic, setTagLogic] = useState<'and' | 'or'>(initialTagLogic);

  // Listen for tag filter changes from vanilla JS
  useEffect(() => {
    const handleTagFilterChange = (event: CustomEvent) => {
      const detail = event.detail || {};
      const newTags = new Set<string>(
        (detail.activeTags || []).map((t: string) => normalizeTag(t))
      );
      const nextLogic = detail.tagLogic === 'and' ? 'and' : 'or';

      setActiveTags(newTags);
      setTagLogic(nextLogic);
    };

    window.addEventListener('tagFilterChange', handleTagFilterChange as EventListener);
    return () => {
      window.removeEventListener('tagFilterChange', handleTagFilterChange as EventListener);
    };
  }, []);

  // Filter photos based on active tags and logic (AND or OR)
  // If no tags are selected, show all photos
  const filteredPhotos = useMemo(() => {
    if (activeTags.size === 0) {
      return allPhotos;
    }

    const tagComparator = Array.from(activeTags);

    return allPhotos.filter(photo => {
      const photoTags = (photo.data.tags || []).map(normalizeTag).filter(Boolean);

      if (tagLogic === 'and') {
        return tagComparator.every(tag => photoTags.includes(tag));
      }

      return tagComparator.some(tag => photoTags.includes(tag));
    });
  }, [allPhotos, activeTags, tagLogic]);

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
        order_score: typeof p.data.order_score === 'number' ? p.data.order_score : 0,
        date: typeof p.data.date === 'string' ? p.data.date : p.data.date.toISOString()
      }
    }));
  }, [filteredPhotos]);

  return <InfinitePhotoGallery photos={galleryPhotos} />;
};
