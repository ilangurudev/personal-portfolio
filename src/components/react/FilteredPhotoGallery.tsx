import React, { useState, useEffect, useMemo } from 'react';
import { InfinitePhotoGallery } from './InfinitePhotoGallery';
import { normalizeTag } from '../../utils/client/tag-utils';
import {
  transformForLightbox,
  type LightboxPhoto,
  toIsoDateString
} from '../../utils/lightbox-transform';
import { pushFilteredPhotosToLightbox } from '../../utils/client/lightbox-sync';
import { createStoryPlan } from '../../utils/story-layout-plan';

interface Photo {
  id: string;
  body?: string;
  data: {
    title: string;
    filename: string;
    order_score?: number;
    featured?: boolean;
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
  layoutMode?: 'grid' | 'editorial';
}

export const FilteredPhotoGallery: React.FC<FilteredPhotoGalleryProps> = ({
  allPhotos,
  initialActiveTags,
  initialTagLogic = 'or',
  onFilterChange,
  layoutMode = 'grid'
}) => {
  const [activeTags, setActiveTags] = useState<Set<string>>(
    new Set((initialActiveTags || []).map(normalizeTag))
  );
  const [tagLogic, setTagLogic] = useState<'and' | 'or'>(initialTagLogic);
  const [layoutSeed, setLayoutSeed] = useState(0);

  useEffect(() => {
    if (layoutMode === 'editorial') {
      setLayoutSeed(Math.floor(Math.random() * 2_147_483_647) || 1);
    }
  }, [layoutMode]);

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

  // Prepare photos for PhotoGallery (convert dates to strings)
  const galleryPhotos = useMemo(() => {
    return filteredPhotos.map(p => ({
      ...p,
      data: {
        ...p.data,
        order_score: typeof p.data.order_score === 'number' ? p.data.order_score : 0,
        date: toIsoDateString(p.data.date)
      }
    }));
  }, [filteredPhotos]);

  const storyPlan = useMemo(() => {
    if (layoutMode !== 'editorial') return null;

    let state = layoutSeed || 1;
    const random = () => {
      state = (state * 16807) % 2_147_483_647;
      return (state - 1) / 2_147_483_646;
    };

    return createStoryPlan(galleryPhotos, { random });
  }, [galleryPhotos, layoutMode, layoutSeed]);

  const plannedPhotos = storyPlan?.orderedPhotos ?? galleryPhotos;

  // Notify parent of filter changes and keep lightbox navigation aligned with the visible edit.
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredPhotos);
    }

    const lightboxPhotos: LightboxPhoto[] = plannedPhotos.map(p =>
      transformForLightbox({
        ...p,
        body: p.body,
        data: {
          ...p.data,
          album: p.data.album || '',
          tags: p.data.tags || [],
        },
      })
    );
    pushFilteredPhotosToLightbox(lightboxPhotos);
  }, [filteredPhotos, onFilterChange, plannedPhotos]);

  return (
    <InfinitePhotoGallery
      photos={plannedPhotos}
      layoutMode={layoutMode}
      storyRows={storyPlan?.rows}
    />
  );
};
