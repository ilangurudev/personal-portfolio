import React, { useMemo } from 'react';
import { Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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

interface PhotoGalleryProps {
  photos: Photo[];
  albumTitle?: string;
}

const GAP = 32; // 2rem
const MIN_COLUMN_WIDTH = 300;

// Cell component to render individual photo cards
const Cell = React.memo(({ columnIndex, rowIndex, style, cellProps }: any) => {
  const { photos, columnCount, gap } = cellProps || {};
  const index = rowIndex * columnCount + columnIndex;

  // If we're at a spot with no photo (last row might be incomplete), render nothing
  if (!photos || index >= photos.length) {
    return null;
  }

  const photo = photos[index];

  // Adjust style for gap
  const itemStyle = {
    ...style,
    width: Number(style.width) - gap,
    height: Number(style.height) - gap,
  };

  return (
    <div
      className="photo-card"
      data-photo-id={photo.id}
      style={itemStyle}
    >
      <div className="photo-image">
        <img
          src={photo.data.filename.startsWith('/') ? `/photos${photo.data.filename}` : `/photos/${photo.data.filename}`}
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
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.columnIndex === nextProps.columnIndex &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.cellProps?.photos === nextProps.cellProps?.photos &&
    prevProps.cellProps?.columnCount === nextProps.cellProps?.columnCount &&
    prevProps.cellProps?.gap === nextProps.cellProps?.gap
  );
});

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  if (!photos || photos.length === 0) {
    return <div>No photos to display</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', position: 'relative', overflow: 'hidden' }}> 
      <AutoSizer>
        {({ height, width }) => {
          if (!height || !width || height === 0 || width === 0) {
            return <div style={{ width: '100%', height: '100%' }}>Loading...</div>;
          }
          const availableWidth = width;
          let columnCount = Math.floor((availableWidth + GAP) / (MIN_COLUMN_WIDTH + GAP));
          if (columnCount < 1) columnCount = 1;

          const itemWidth = (availableWidth - (columnCount - 1) * GAP) / columnCount;
          const itemHeight = itemWidth / (3 / 2); // Aspect ratio 3:2
          const rowCount = Math.ceil(photos.length / columnCount);

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={itemWidth + GAP}
              height={height}
              rowCount={rowCount}
              rowHeight={itemHeight + GAP}
              width={width}
              cellComponent={Cell}
              cellProps={{
                photos,
                columnCount,
                gap: GAP
              }}
              overscanCount={2}
              style={{ overflowX: 'hidden' }}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
};
