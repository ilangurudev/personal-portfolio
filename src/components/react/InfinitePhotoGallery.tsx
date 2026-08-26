import React, { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties } from 'react';
import { getPhotoUrl, getResizedPhotoUrl } from '../../utils/url-helper';
import type { StoryRow } from '../../utils/story-layout-plan';
import { ViewfinderSVG } from './ViewfinderSVG';

interface Photo {
  id: string;
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

interface InfinitePhotoGalleryProps {
  photos: Photo[];
  initialLoadCount?: number;
  loadMoreCount?: number;
  layoutMode?: 'grid' | 'editorial';
  storyRows?: StoryRow<Photo>[];
}

const GAP = 32; // 2rem
const MIN_COLUMN_WIDTH = 300;
const INITIAL_LOAD = 20;
const LOAD_MORE = 20;
const EDITORIAL_GROUP_SIZE = 8;
const EMPTY_STORY_ROWS: StoryRow<Photo>[] = [];

function getPlannedPhotoCount(rows: StoryRow<Photo>[], targetCount: number): number {
  let count = 0;
  for (const row of rows) {
    if (count >= targetCount) break;
    count += row.photos.length;
  }
  return count;
}

function getEstimatedRatio(photo: Photo): number {
  const isPortrait = photo.data.tags?.some(tag => tag.trim().toLowerCase() === 'portrait orientation');
  return isPortrait ? 2 / 3 : 3 / 2;
}

const PhotoCard: React.FC<{
  photo: Photo;
  editorial?: boolean;
  imageSource?: 'original' | 'resized';
  aspectRatio?: number;
  style?: CSSProperties;
  onRatio?: (photoId: string, ratio: number) => void;
}> = ({ photo, editorial = false, imageSource = 'resized', aspectRatio, style, onRatio }) => (
  <div
    className="photo-card"
    data-image-source={imageSource}
    data-photo-id={photo.id}
    data-featured={photo.data.featured ? 'true' : undefined}
    data-order-score={photo.data.order_score ?? 0}
    data-photo-date={
      typeof photo.data.date === 'string'
        ? photo.data.date
        : photo.data.date.toISOString()
    }
    style={{
      width: '100%',
      position: 'relative',
      alignSelf: 'start',
      ...style
    }}
  >
    <div
      className="photo-image"
      style={editorial ? {
        background: 'transparent',
        aspectRatio: aspectRatio ? String(aspectRatio) : undefined
      } : undefined}
    >
      <img
        src={imageSource === 'original'
          ? getPhotoUrl(photo.data.filename)
          : getResizedPhotoUrl(photo.data.filename, editorial ? 900 : 400)}
        alt={photo.data.title}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={(event) => {
          const image = event.currentTarget;
          if (image.naturalWidth > 0 && image.naturalHeight > 0) {
            onRatio?.(photo.id, image.naturalWidth / image.naturalHeight);
          }
        }}
        style={{
          objectPosition: `center ${photo.data.position || 'middle'}`,
          width: '100%',
          height: 'auto',
          objectFit: 'contain'
        }}
      />
      <div className="viewfinder-overlay">
        <ViewfinderSVG />
      </div>
    </div>
  </div>
);

export const InfinitePhotoGallery: React.FC<InfinitePhotoGalleryProps> = ({
  photos,
  initialLoadCount = INITIAL_LOAD,
  loadMoreCount = LOAD_MORE,
  layoutMode = 'grid',
  storyRows = EMPTY_STORY_ROWS
}) => {
  const editorialInitialCount = Math.min(
    Math.ceil(initialLoadCount / EDITORIAL_GROUP_SIZE) * EDITORIAL_GROUP_SIZE,
    photos.length
  );
  const editorialLoadMoreCount = Math.ceil(loadMoreCount / EDITORIAL_GROUP_SIZE) * EDITORIAL_GROUP_SIZE;
  const [visibleCount, setVisibleCount] = useState(
    layoutMode === 'editorial' ? editorialInitialCount : initialLoadCount
  );
  const [columnCount, setColumnCount] = useState(3);
  const [photoRatios, setPhotoRatios] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const ratioCacheRef = useRef<Map<string, number>>(new Map());
  const sourceRatioIdsRef = useRef<Set<string>>(new Set());
  const isLoadingBatchRef = useRef(false);
  const photoSignature = useMemo(() => photos.map(photo => photo.id).join('|'), [photos]);

  const recordPhotoRatio = useCallback((photoId: string, ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    sourceRatioIdsRef.current.add(photoId);
    if (ratioCacheRef.current.has(photoId)) return;
    ratioCacheRef.current.set(photoId, ratio);
    setPhotoRatios(current => Math.abs((current[photoId] || 0) - ratio) < 0.001
      ? current
      : { ...current, [photoId]: ratio });
  }, []);

  const preloadRatios = useCallback(async (batch: Photo[]) => {
    if (layoutMode !== 'editorial' || typeof Image === 'undefined') return;

    const entries = await Promise.all(batch.map(photo => new Promise<[string, number]>(resolve => {
      const cached = ratioCacheRef.current.get(photo.id);
      if (cached) {
        resolve([photo.id, cached]);
        return;
      }

      const image = new Image();
      image.onload = () => {
        const ratio = image.naturalWidth > 0 && image.naturalHeight > 0
          ? image.naturalWidth / image.naturalHeight
          : getEstimatedRatio(photo);
        if (!sourceRatioIdsRef.current.has(photo.id)) {
          ratioCacheRef.current.set(photo.id, ratio);
        }
        resolve([photo.id, ratioCacheRef.current.get(photo.id) || ratio]);
      };
      image.onerror = () => resolve([photo.id, getEstimatedRatio(photo)]);
      image.src = getResizedPhotoUrl(photo.data.filename, 512);
    })));

    setPhotoRatios(current => {
      const next = { ...current };
      for (const [photoId, probedRatio] of entries) {
        next[photoId] = ratioCacheRef.current.get(photoId) || probedRatio;
      }
      return next;
    });
  }, [layoutMode]);

  useEffect(() => {
    const plannedVisibleCount = layoutMode === 'editorial'
      ? getPlannedPhotoCount(storyRows, visibleCount)
      : visibleCount;
    void preloadRatios(photos.slice(0, Math.min(plannedVisibleCount, photos.length)));
  }, [layoutMode, photoSignature, photos, preloadRatios, storyRows, visibleCount]);

  // Calculate column count based on container width (max 3 columns)
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const cols = Math.floor((width + GAP) / (MIN_COLUMN_WIDTH + GAP));
      setColumnCount(Math.min(3, Math.max(1, cols)));
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < photos.length && !isLoadingBatchRef.current) {
          const increment = layoutMode === 'editorial' ? editorialLoadMoreCount : loadMoreCount;
          const nextVisibleCount = Math.min(visibleCount + increment, photos.length);
          const preloadStart = layoutMode === 'editorial'
            ? getPlannedPhotoCount(storyRows, visibleCount)
            : visibleCount;
          const preloadEnd = layoutMode === 'editorial'
            ? getPlannedPhotoCount(storyRows, nextVisibleCount)
            : nextVisibleCount;
          isLoadingBatchRef.current = true;
          void preloadRatios(photos.slice(preloadStart, preloadEnd)).finally(() => {
            setVisibleCount(nextVisibleCount);
            isLoadingBatchRef.current = false;
          });
        }
      },
      { rootMargin: '200px' }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleCount, photos, loadMoreCount, layoutMode, editorialLoadMoreCount, preloadRatios, storyRows]);

  const visiblePhotos = photos.slice(0, visibleCount);
  const useEditorialLayout = layoutMode === 'editorial' && columnCount === 3;
  const visibleStoryRows = useMemo(() => {
    if (!useEditorialLayout) return [];

    const rows: StoryRow<Photo>[] = [];
    let photoCount = 0;
    for (const row of storyRows) {
      if (photoCount >= visibleCount) break;
      rows.push(row);
      photoCount += row.photos.length;
    }
    return rows;
  }, [storyRows, useEditorialLayout, visibleCount]);
  const visibleStoryRatiosReady = visibleStoryRows.every(row =>
    row.photos.every(photo => Number.isFinite(photoRatios[photo.id]) && photoRatios[photo.id] > 0)
  );

  return (
    <div
      ref={containerRef}
      data-story-gallery={useEditorialLayout ? '' : undefined}
      data-story-ratios-ready={useEditorialLayout ? String(visibleStoryRatiosReady) : undefined}
      style={{
        width: '100%',
        display: useEditorialLayout ? 'block' : 'grid',
        ...(useEditorialLayout ? {} : {
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          alignItems: 'start',
          gap: `${GAP}px`
        }),
        padding: '1rem 0'
      }}
    >
      {useEditorialLayout
        ? visibleStoryRows.map((row, rowIndex) => {
            const isAnchor = row.kind === 'anchor';
            const isQuietSolo = row.kind === 'support' && row.photos.length === 1;
            const rowRatios = row.photos.map(photo =>
              photoRatios[photo.id] || getEstimatedRatio(photo)
            );

            return (
              <div
                key={`${row.kind}-${row.photos.map(photo => photo.id).join('|')}`}
                data-story-row={row.kind}
                data-story-anchor={isAnchor ? '' : undefined}
                data-quiet-solo={isQuietSolo ? '' : undefined}
                data-planned-layout={`${row.kind}-${row.photos.length}`}
                style={{
                  width: '100%',
                  display: isQuietSolo ? 'flex' : 'grid',
                  gridTemplateColumns: isQuietSolo
                    ? undefined
                    : isAnchor
                      ? '1fr'
                      : rowRatios.map(ratio => `${ratio}fr`).join(' '),
                  justifyContent: isQuietSolo ? (rowIndex % 2 === 0 ? 'flex-start' : 'flex-end') : undefined,
                  alignItems: 'start',
                  gap: `${GAP}px`,
                  marginBottom: `${GAP}px`
                }}
              >
                {row.photos.map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    editorial
                    imageSource={isAnchor ? 'original' : 'resized'}
                    aspectRatio={photoRatios[photo.id] || getEstimatedRatio(photo)}
                    onRatio={recordPhotoRatio}
                    style={{
                      width: isQuietSolo ? 'min(64%, 860px)' : '100%',
                      minWidth: 0,
                      alignSelf: 'start'
                    }}
                  />
                ))}
              </div>
            );
          })
        : visiblePhotos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
      
      {/* Sentinel element for infinite scroll */}
      {visibleCount < photos.length && (
        <div
          ref={sentinelRef}
          style={{
            gridColumn: '1 / -1',
            height: '100px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ color: 'var(--gray)', fontSize: '0.875rem' }}>
            Loading more photos...
          </div>
        </div>
      )}
    </div>
  );
};
