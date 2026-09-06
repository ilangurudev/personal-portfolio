export const HERO_PHOTO = {
  id: 'tampa-2025/20251109-_AR51732.md',
  alt: 'An older woman in yellow pointing down from a balcony above the Gulf',
} as const;

/**
 * The edit is authored as visual movements, not inferred from album, date, or
 * image orientation. Feature groups reset the rhythm; pairs keep the desktop
 * composition aligned and balanced.
 */
export const CURATED_EDIT_GROUPS = [
  {
    kind: 'feature',
    chapter: { number: 'A', title: 'Beyond Measure', note: 'Figures against mountain, sea, and weather.' },
    ids: ['miami-2024/DJI_20241229174619_0019_D-Enhanced-NR.md'],
  },
  {
    kind: 'pair',
    ids: [
      'olympic-2025/20250706-_AR56992.md',
      'olympic-2025/20250708-_AR58026.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'puerto-rico-2025/20251214-_AR54596.md',
      'puerto-rico-2025/20251214-_AR54553.md',
    ],
  },
  {
    kind: 'feature',
    ids: ['rainier-2025/20250711-_AR58804.md'],
  },
  {
    kind: 'feature',
    chapter: { number: 'B', title: 'One Among Many', note: 'Individuals inside crowds, systems, and repeated forms.' },
    ids: ['new-york-2025/AR53141.md'],
  },
  {
    kind: 'pair',
    ids: [
      'new-york-2025/AR53856.md',
      'olympic-2025/20250708-_AR58023.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'dc-spring-2025/DSC00115.md',
      'puerto-rico-2025/20251214-_AR54253.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'tampa-2025/20251108-_AR51547.md',
      'tampa-2025/20251111-_AR52171.md',
    ],
  },
  {
    kind: 'feature',
    ids: ['puerto-rico-2025/20251213-_AR53645.md'],
  },
  {
    kind: 'feature',
    chapter: { number: 'C', title: 'At Human Distance', note: 'Gesture, work, play, and private attention.' },
    ids: ['tampa-2025/20251111-_AR52140.md'],
  },
  {
    kind: 'pair',
    ids: [
      'miami-2024/DSC04805.md',
      'cherry-blossoms-2025/DSC00949.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'puerto-rico-2025/20251214-_AR54764.md',
      'puerto-rico-2025/20251212-_AR53225.md',
    ],
  },
  {
    kind: 'pair',
    ids: [
      'puerto-rico-2025/20251214-_AR54842.md',
      'olympic-2025/20250708-_AR57853.md',
    ],
  },
  {
    kind: 'feature',
    ids: ['miami-2024/DSC08293.md'],
  },
] as const;

export const CURATED_EDIT_IDS = CURATED_EDIT_GROUPS.flatMap(group => group.ids);

/**
 * Intrinsic dimensions of the curated CDN derivatives. These reserve each
 * photograph's authored aspect ratio before lazy loading, keeping homepage
 * sections and hash-link destinations stable as images arrive.
 */
export const CURATED_PHOTO_DIMENSIONS = {
  'miami-2024/DJI_20241229174619_0019_D-Enhanced-NR.md': { width: 1600, height: 899 },
  'olympic-2025/20250706-_AR56992.md': { width: 1000, height: 666 },
  'olympic-2025/20250708-_AR58026.md': { width: 1000, height: 666 },
  'puerto-rico-2025/20251214-_AR54596.md': { width: 1000, height: 666 },
  'puerto-rico-2025/20251214-_AR54553.md': { width: 1000, height: 666 },
  'rainier-2025/20250711-_AR58804.md': { width: 1600, height: 1066 },
  'new-york-2025/AR53856.md': { width: 1000, height: 666 },
  'olympic-2025/20250708-_AR58023.md': { width: 1000, height: 666 },
  'dc-spring-2025/DSC00115.md': { width: 1000, height: 666 },
  'puerto-rico-2025/20251213-_AR53645.md': { width: 1600, height: 1066 },
  'tampa-2025/20251108-_AR51547.md': { width: 1000, height: 666 },
  'tampa-2025/20251111-_AR52171.md': { width: 1000, height: 666 },
  'new-york-2025/AR53141.md': { width: 1600, height: 1066 },
  'puerto-rico-2025/20251214-_AR54253.md': { width: 1000, height: 666 },
  'tampa-2025/20251111-_AR52140.md': { width: 1600, height: 1066 },
  'miami-2024/DSC04805.md': { width: 1000, height: 666 },
  'cherry-blossoms-2025/DSC00949.md': { width: 1000, height: 666 },
  'puerto-rico-2025/20251214-_AR54764.md': { width: 1000, height: 666 },
  'puerto-rico-2025/20251212-_AR53225.md': { width: 1000, height: 666 },
  'puerto-rico-2025/20251214-_AR54842.md': { width: 1000, height: 666 },
  'olympic-2025/20250708-_AR57853.md': { width: 1000, height: 666 },
  'miami-2024/DSC08293.md': { width: 1600, height: 1066 },
} as const satisfies Record<(typeof CURATED_EDIT_IDS)[number], { width: number; height: number }>;

export const FEATURED_STORIES = [
  { slug: 'las-vegas-2026', number: '01', kicker: 'Desert / Las Vegas', statement: 'Las Vegas and the desert beyond, in summer heat and warm earth tones.' },
  { slug: 'puerto-rico-2025', number: '02', kicker: 'Coast / Old San Juan', statement: 'Hard light, sea air, and the geometry of an old city at the edge of the Atlantic.' },
  { slug: 'new-york-2025', number: '03', kicker: 'Street / New York', statement: 'Crowds, interruptions, reflections, and brief alignments inside the restless city.' },
  { slug: 'olympic-2025', number: '04', kicker: 'Wild / Olympic', statement: 'Sea stacks, rainforests, beaches, and mountains across the Olympic Peninsula.' },
  { slug: 'rainier-2025', number: '05', kicker: 'Altitude / Rainier', statement: 'Snow, distance, and scale rendered in a quieter register.' },
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
