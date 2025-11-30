import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface InfinitePhotoGalleryProps {
  photos: Photo[];
  initialLoadCount?: number;
  loadMoreCount?: number;
}

const GAP = 32; // 2rem
const MIN_COLUMN_WIDTH = 300;
const INITIAL_LOAD = 20;
const LOAD_MORE = 20;

export const InfinitePhotoGallery: React.FC<InfinitePhotoGalleryProps> = ({
  photos,
  initialLoadCount = INITIAL_LOAD,
  loadMoreCount = LOAD_MORE
}) => {
  const [visibleCount, setVisibleCount] = useState(initialLoadCount);
  const [columnCount, setColumnCount] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Calculate column count based on container width
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const cols = Math.floor((width + GAP) / (MIN_COLUMN_WIDTH + GAP));
      setColumnCount(Math.max(1, cols));
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
        if (entries[0].isIntersecting && visibleCount < photos.length) {
          setVisibleCount((prev) => Math.min(prev + loadMoreCount, photos.length));
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
  }, [visibleCount, photos.length, loadMoreCount]);

  const visiblePhotos = photos.slice(0, visibleCount);
  const itemWidth = containerRef.current
    ? (containerRef.current.offsetWidth - (columnCount - 1) * GAP) / columnCount
    : MIN_COLUMN_WIDTH;
  const itemHeight = itemWidth / (3 / 2); // Aspect ratio 3:2

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${GAP}px`,
        padding: '1rem 0'
      }}
    >
      {visiblePhotos.map((photo) => (
        <div
          key={photo.id}
          className="photo-card"
          data-photo-id={photo.id}
          style={{
            width: '100%',
            aspectRatio: '3/2',
            position: 'relative'
          }}
        >
          <div className="photo-image">
            <img
              src={getPhotoUrl(photo.data.filename)}
              alt={photo.data.title}
              loading="lazy"
              decoding="async"
            />
            <div className="viewfinder-overlay">
              <svg
                className="viewfinder-corners"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 15 L15 25 L25 25"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M85 15 L85 25 L75 25"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 85 L15 75 L25 75"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M85 85 L85 75 L75 75"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      ))}
      
      {/* Sentinel element for infinite scroll */}
      {visibleCount < photos.length && (
        <div
          ref={sentinelRef}
          style={{
            gridColumn: `1 / -1`,
            height: '100px',
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
