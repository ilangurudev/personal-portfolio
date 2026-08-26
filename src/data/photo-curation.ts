export const HERO_PHOTO = {
  id: 'tampa-2025/20251109-_AR51732.md',
  alt: 'A figure in yellow leaning across a balcony above blue water',
} as const;

/**
 * The edit is authored as visual movements, not inferred from album, date, or
 * image orientation. Feature groups reset the rhythm; pairs keep the desktop
 * composition aligned and balanced.
 */
export const CURATED_EDIT_GROUPS = [
  {
    kind: 'feature',
    chapter: { number: 'A', title: 'Motion', note: 'The city in transit.' },
    ids: ['new-york-2025/AR53824.md'],
  },
  {
    kind: 'pair',
    ids: [
      'georgetown-metro-2025/20250914-_AR50392.md',
      'dc-hot-summer/20250623-_AR55740.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'new-york-2025/AR54015.md',
      'new-york-2025/AR54108.md',
    ],
  },
  {
    kind: 'pair',
    chapter: { number: 'B', title: 'Structure', note: 'Frames found and crossed.' },
    ids: [
      'puerto-rico-2025/20251213-_AR53645.md',
      'glenstone-2024/DSC02462.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'seattle-2025/20250705-_AR56655.md',
      'dc-hot-summer/20250623-_AR55928.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'puerto-rico-2025/20251213-_AR53410.md',
      'tysons-foggy-2024/DSC03152.md',
    ],
  },
  {
    kind: 'feature',
    chapter: { number: 'C', title: 'Distance', note: 'Weather, horizon, and scale.' },
    ids: ['olympic-2025/20250708-_AR57915.md'],
  },
  {
    kind: 'pair',
    ids: [
      'rainier-2025/20250711-_AR58685.md',
      'cherry-blossoms-2025/DSC01700.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'miami-2024/DSC08657.md',
      'tampa-2025/20251109-_AR51599.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'puerto-rico-2025/20251213-_AR53972.md',
      'blackwater-2024/DSC01645.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'assateague-2024-06/DSC05873.md',
      'miami-2024/DSC08293.md',
    ],
  },
] as const;

export const CURATED_EDIT_IDS = CURATED_EDIT_GROUPS.flatMap(group => group.ids);

export const FEATURED_STORIES = [
  { slug: 'puerto-rico-2025', number: '01', kicker: 'Coast / Old San Juan', statement: 'Hard light, sea air, and the geometry of an old city at the edge of the Atlantic.' },
  { slug: 'new-york-2025', number: '02', kicker: 'Street / New York', statement: 'Crowds, interruptions, reflections, and brief alignments inside the restless city.' },
  { slug: 'georgetown-metro-2025', number: '03', kicker: 'Transit / Washington', statement: 'The choreography of platforms, passing trains, and people suspended between places.' },
  { slug: 'rainier-2025', number: '04', kicker: 'Altitude / Rainier', statement: 'Snow, distance, and scale rendered in a quieter register.' },
  { slug: 'tysons-foggy-2024', number: '05', kicker: 'Weather / Virginia', statement: 'A familiar suburb briefly made strange by winter fog.' },
  { slug: 'miami-2024', number: '06', kicker: 'Street / Miami', statement: 'Heat, color, ritual, and the private gestures of a public city.' },
] as const;

export const PUBLIC_THEMES = [
  { label: 'Street', tag: 'street photography', note: 'Unscripted gestures and passing alignments.' },
  { label: 'Thresholds', tag: 'frame within frame', note: 'Windows, arches, doors, and borrowed frames.' },
  { label: 'Solitude', tag: 'solitude', note: 'One figure holding a larger space.' },
  { label: 'In Motion', tag: 'walking', note: 'Movement, transit, and the energy between moments.' },
  { label: 'After Dark', tag: 'night', note: 'Artificial light and the city after sundown.' },
  { label: 'Weather', tag: 'rainy', note: 'Fog, rain, snow, and atmosphere as subject.' },
  { label: 'Monochrome', tag: 'black and white', note: 'Shape, contrast, and graphic reduction.' },
  { label: 'Wild Places', tag: 'landscape photography', note: 'Distance, terrain, coast, and scale.' },
] as const;
