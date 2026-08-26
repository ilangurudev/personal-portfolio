import React, { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties } from 'react';
import { getResizedPhotoUrl } from '../../utils/url-helper';
import { ViewfinderSVG } from './ViewfinderSVG';

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

interface InfinitePhotoGalleryProps {
  photos: Photo[];
  initialLoadCount?: number;
  loadMoreCount?: number;
  layoutMode?: 'grid' | 'editorial';
}

const GAP = 32; // 2rem
const MIN_COLUMN_WIDTH = 300;
const INITIAL_LOAD = 20;
const LOAD_MORE = 20;
const EDITORIAL_GROUP_SIZE = 8;

const STORY_LAYOUTS = [
  'duo-duo-duo-duo',
  'trio-trio-duo',
  'trio-duo-trio',
  'duo-trio-trio',
  'quad-duo-duo',
  'duo-duo-quad'
] as const;

type StoryLayout = typeof STORY_LAYOUTS[number];

interface StoryRow {
  indices: number[];
}

const STORY_ROW_CONFIGS: Record<StoryLayout, StoryRow[]> = {
  'duo-duo-duo-duo': [
    { indices: [0, 1] },
    { indices: [2, 3] },
    { indices: [4, 5] },
    { indices: [6, 7] }
  ],
  'trio-trio-duo': [
    { indices: [0, 1, 2] },
    { indices: [3, 4, 5] },
    { indices: [6, 7] }
  ],
  'trio-duo-trio': [
    { indices: [0, 1, 2] },
    { indices: [3, 4] },
    { indices: [5, 6, 7] }
  ],
  'duo-trio-trio': [
    { indices: [0, 1] },
    { indices: [2, 3, 4] },
    { indices: [5, 6, 7] }
  ],
  'quad-duo-duo': [
    { indices: [0, 1, 2, 3] },
    { indices: [4, 5] },
    { indices: [6, 7] }
  ],
  'duo-duo-quad': [
    { indices: [0, 1] },
    { indices: [2, 3] },
    { indices: [4, 5, 6, 7] }
  ]
};

function getEstimatedRatio(photo: Photo): number {
  const isPortrait = photo.data.tags?.some(tag => tag.trim().toLowerCase() === 'portrait orientation');
  return isPortrait ? 2 / 3 : 3 / 2;
}

function getRowsForGroup(layout: StoryLayout, groupLength: number): StoryRow[] {
  if (groupLength === EDITORIAL_GROUP_SIZE) return STORY_ROW_CONFIGS[layout];

  const layoutIndex = STORY_LAYOUTS.indexOf(layout);
  const partialRowSizes: Record<number, number[][]> = {
    1: [[1]],
    2: [[2]],
    3: [[3]],
    4: [[2, 2], [4]],
    5: [[2, 3], [3, 2]],
    6: [[2, 2, 2], [3, 3]],
    7: [[2, 2, 3], [2, 3, 2], [3, 2, 2]]
  };
  const candidates = partialRowSizes[groupLength] || [[groupLength]];
  const sizes = candidates[layoutIndex % candidates.length];
  let nextIndex = 0;

  return sizes.map(size => {
    const indices = Array.from({ length: size }, () => nextIndex++);
    return { indices };
  });
}

function shuffleLayouts(layouts: StoryLayout[]): StoryLayout[] {
  const shuffled = [...layouts];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createEditorialPlan(groupCount: number, previousPlan: StoryLayout[] = []): StoryLayout[] {
  const plan: StoryLayout[] = [];

  while (plan.length < groupCount) {
    const bag = shuffleLayouts([...STORY_LAYOUTS]);
    if (plan.length > 0 && bag[0] === plan[plan.length - 1]) {
      [bag[0], bag[1]] = [bag[1], bag[0]];
    }
    plan.push(...bag);
  }

  const nextPlan = plan.slice(0, groupCount);
  const nextOpening = nextPlan.slice(0, 4);
  const previousOpening = previousPlan.slice(0, 4);
  const repeatsPreviousOpening = nextOpening.length > 1
    && nextOpening.join('|') === previousOpening.join('|');

  if (repeatsPreviousOpening) {
    [nextPlan[0], nextPlan[1]] = [nextPlan[1], nextPlan[0]];
  }

  return nextPlan;
}

const PhotoCard: React.FC<{
  photo: Photo;
  editorial?: boolean;
  style?: CSSProperties;
  onRatio?: (photoId: string, ratio: number) => void;
}> = ({ photo, editorial = false, style, onRatio }) => (
  <div
    className="photo-card"
    data-photo-id={photo.id}
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
    <div className="photo-image" style={editorial ? { background: 'transparent' } : undefined}>
      <img
        src={getResizedPhotoUrl(photo.data.filename, editorial ? 900 : 400)}
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
  layoutMode = 'grid'
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
  const groupCount = Math.ceil(photos.length / EDITORIAL_GROUP_SIZE);
  const defaultEditorialPlan = useMemo(
    () => Array.from({ length: groupCount }, (_, index) => STORY_LAYOUTS[index % STORY_LAYOUTS.length]),
    [groupCount]
  );
  const [editorialPlan, setEditorialPlan] = useState<StoryLayout[]>(defaultEditorialPlan);
  const photoSignature = useMemo(() => photos.map(photo => photo.id).join('|'), [photos]);

  const recordPhotoRatio = useCallback((photoId: string, ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    sourceRatioIdsRef.current.add(photoId);
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
    if (layoutMode !== 'editorial') return;

    const storageKey = `story-layout-plan:${photos[0]?.data.album || photoSignature}`;
    let previousPlan: StoryLayout[] = [];
    try {
      previousPlan = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    } catch {
      previousPlan = [];
    }

    const nextPlan = createEditorialPlan(groupCount, previousPlan);
    setEditorialPlan(nextPlan);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(nextPlan));
    } catch {
      // Storage may be unavailable; the in-memory plan still stays fixed for this page load.
    }
  }, [groupCount, layoutMode, photoSignature, photos]);

  useEffect(() => {
    void preloadRatios(photos.slice(0, Math.min(visibleCount, photos.length)));
  }, [photoSignature, photos, preloadRatios]);

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
          isLoadingBatchRef.current = true;
          void preloadRatios(photos.slice(visibleCount, nextVisibleCount)).finally(() => {
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
  }, [visibleCount, photos, loadMoreCount, layoutMode, editorialLoadMoreCount, preloadRatios]);

  const visiblePhotos = photos.slice(0, visibleCount);
  const useEditorialLayout = layoutMode === 'editorial' && columnCount === 3;
  const visibleGroups = useEditorialLayout
    ? Array.from({ length: Math.ceil(visiblePhotos.length / EDITORIAL_GROUP_SIZE) }, (_, groupIndex) =>
        visiblePhotos.slice(
          groupIndex * EDITORIAL_GROUP_SIZE,
          (groupIndex + 1) * EDITORIAL_GROUP_SIZE
        )
      )
    : [];

  return (
    <div
      ref={containerRef}
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
        ? visibleGroups.map((group, groupIndex) => {
            const layout = editorialPlan[groupIndex] || defaultEditorialPlan[groupIndex];
            const rows = getRowsForGroup(layout, group.length);
            return (
              <div
                key={group[0]?.id || `story-group-${groupIndex}`}
                data-story-layout-group
                data-layout={layout}
                data-planned-layout={editorialPlan[groupIndex] || defaultEditorialPlan[groupIndex]}
                style={{
                  width: '100%',
                  marginBottom: `${GAP}px`
                }}
              >
                {rows.map((row, rowIndex) => {
                  const rowRatios = row.indices.map(photoIndex =>
                    photoRatios[group[photoIndex].id] || getEstimatedRatio(group[photoIndex])
                  );
                  return (
                  <div
                    key={`${group[0]?.id}-row-${rowIndex}`}
                    data-story-row
                    style={{
                      display: 'grid',
                      gridTemplateColumns: rowRatios.map(ratio => `${ratio}fr`).join(' '),
                      alignItems: 'start',
                      gap: `${GAP}px`,
                      marginBottom: rowIndex === rows.length - 1 ? 0 : `${GAP}px`
                    }}
                  >
                    {row.indices.map(photoIndex => (
                      <PhotoCard
                        key={group[photoIndex].id}
                        photo={group[photoIndex]}
                        editorial
                        onRatio={recordPhotoRatio}
                        style={{
                          minWidth: 0,
                          alignSelf: 'start'
                        }}
                      />
                    ))}
                  </div>
                  );
                })}
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
