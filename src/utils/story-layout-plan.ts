export type StoryPhoto = {
  id: string;
  data: {
    featured?: boolean;
  };
};

export type StoryRow<T extends StoryPhoto> = {
  kind: 'anchor' | 'support';
  photos: T[];
};

export type StoryPlan<T extends StoryPhoto> = {
  orderedPhotos: T[];
  rows: StoryRow<T>[];
};

export type StoryPlanOptions = {
  random?: () => number;
};

export type StoryDateSortOrder = 'asc' | 'desc';

export function sortStoryPhotosByDate<
  T extends { data: { date: Date; filename?: string } }
>(photos: T[], dateSortOrder: StoryDateSortOrder = 'asc'): T[] {
  const direction = dateSortOrder === 'asc' ? 1 : -1;
  return [...photos].sort((first, second) =>
    direction * (
      (first.data.date.getTime() - second.data.date.getTime()) ||
      (first.data.filename?.split('/').pop() ?? '').localeCompare(
        second.data.filename?.split('/').pop() ?? '', 'en', { numeric: true }
      )
    )
  );
}

type Placement<T> = {
  kind: 'anchor' | 'support';
  photo: T;
};

export function createStoryPlan<T extends StoryPhoto>(
  photos: T[],
  options: StoryPlanOptions = {}
): StoryPlan<T> {
  const random = options.random ?? Math.random;
  const placements: Placement<T>[] = [];
  const anchors = photos.filter(photo => photo.data.featured);
  const supports = photos.filter(photo => !photo.data.featured);

  if (anchors.length === 0) {
    placements.push(...supports.map(photo => ({ kind: 'support' as const, photo })));
  } else if (supports.length < (anchors.length - 1) * 2) {
    // This metadata combination cannot satisfy both contracts. Preserve spacing
    // and chronology by anchoring as many featured photographs as possible.
    const maxAnchors = Math.floor(supports.length / 2) + 1;
    const anchoredIds = new Set(anchors.slice(0, maxAnchors).map(photo => photo.id));
    let supportSinceAnchor = 0;

    for (const photo of photos) {
      if (anchoredIds.has(photo.id) && (placements.every(item => item.kind !== 'anchor') || supportSinceAnchor >= 2)) {
        placements.push({ kind: 'anchor', photo });
        supportSinceAnchor = 0;
      } else {
        placements.push({ kind: 'support', photo });
        if (placements.some(item => item.kind === 'anchor')) supportSinceAnchor += 1;
      }
    }
  } else {
    let supportsSeen = 0;
    const originalSupportCounts = new Map<string, number>();
    for (const photo of photos) {
      if (photo.data.featured) {
        originalSupportCounts.set(photo.id, supportsSeen);
      } else {
        supportsSeen += 1;
      }
    }

    const targetSupportCounts: number[] = [];
    anchors.forEach((anchor, index) => {
      const lowerBound = index === 0 ? 0 : targetSupportCounts[index - 1] + 2;
      const upperBound = supports.length - ((anchors.length - 1 - index) * 2);
      const desired = originalSupportCounts.get(anchor.id) ?? lowerBound;
      targetSupportCounts.push(Math.min(upperBound, Math.max(lowerBound, desired)));
    });

    let supportIndex = 0;
    anchors.forEach((anchor, index) => {
      while (supportIndex < targetSupportCounts[index]) {
        placements.push({ kind: 'support', photo: supports[supportIndex++] });
      }
      placements.push({ kind: 'anchor', photo: anchor });
    });
    while (supportIndex < supports.length) {
      placements.push({ kind: 'support', photo: supports[supportIndex++] });
    }
  }

  const rows: StoryRow<T>[] = [];
  let supportBuffer: T[] = [];
  const flushSupport = () => {
    while (supportBuffer.length > 0) {
      if (supportBuffer.length === 1) {
        rows.push({ kind: 'support', photos: supportBuffer.splice(0) });
        continue;
      }

      const viableSizes = [2, 3, 4].filter(size => {
        const remainder = supportBuffer.length - size;
        return remainder === 0 || remainder >= 2;
      });
      const randomIndex = Math.min(
        viableSizes.length - 1,
        Math.max(0, Math.floor(random() * viableSizes.length))
      );
      rows.push({
        kind: 'support',
        photos: supportBuffer.splice(0, viableSizes[randomIndex])
      });
    }
  };

  for (const placement of placements) {
    if (placement.kind === 'anchor') {
      flushSupport();
      rows.push({ kind: 'anchor', photos: [placement.photo] });
    } else {
      supportBuffer.push(placement.photo);
    }
  }
  flushSupport();

  return {
    orderedPhotos: placements.map(placement => placement.photo),
    rows
  };
}
