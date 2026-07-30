import { TvWallMaterial } from '../types/tvwall';

export const TV_WALL_MATERIALS: TvWallMaterial[] = [
  // MDF EGGER Collection
  {
    id: 'mat-egger-cashmere',
    name: 'Egger Cashmere Grey (U702 ST9)',
    category: 'mdf_egger',
    colorHex: '#d8cfbe',
    roughness: 0.6,
    metalness: 0.05,
    pricePerM2: 28,
    brand: 'Egger'
  },
  {
    id: 'mat-egger-sage-green',
    name: 'Egger Sage Green (U636 ST9)',
    category: 'mdf_egger',
    colorHex: '#6a7e6e',
    roughness: 0.6,
    metalness: 0.05,
    pricePerM2: 30,
    brand: 'Egger'
  },
  {
    id: 'mat-egger-anthracite',
    name: 'Egger PerfectSense Anthracite (U963)',
    category: 'mdf_egger',
    colorHex: '#2b2d31',
    roughness: 0.3,
    metalness: 0.1,
    pricePerM2: 34,
    brand: 'Egger'
  },
  {
    id: 'mat-egger-silk-white',
    name: 'Egger Premium Silk White (W1000)',
    category: 'mdf_egger',
    colorHex: '#f5f5f2',
    roughness: 0.4,
    metalness: 0.05,
    pricePerM2: 26,
    brand: 'Egger'
  },

  // WOOD SLATS & TIMBER Collection
  {
    id: 'mat-slat-oak-natural',
    name: 'Sllata Lisi Natyral (Astra Oak)',
    category: 'wood_slat',
    colorHex: '#c29b68',
    roughness: 0.8,
    metalness: 0.05,
    pricePerM2: 45,
    brand: 'Kronospan'
  },
  {
    id: 'mat-slat-walnut-dark',
    name: 'Sllata Arre e Errët (Dark Walnut)',
    category: 'wood_slat',
    colorHex: '#523724',
    roughness: 0.75,
    metalness: 0.05,
    pricePerM2: 52,
    brand: 'Premium Wood'
  },
  {
    id: 'mat-slat-black-ash',
    name: 'Sllata Akustike të Zezë (Black Ash Slats)',
    category: 'wood_slat',
    colorHex: '#18181b',
    roughness: 0.9,
    metalness: 0.1,
    pricePerM2: 48,
    brand: 'Acoustic Panel'
  },

  // MARBLE & STONE SLABS
  {
    id: 'mat-marble-calacatta',
    name: 'Mermer Calacatta Gold (Porcelan)',
    category: 'marble',
    colorHex: '#f0ede6',
    roughness: 0.15,
    metalness: 0.2,
    pricePerM2: 85,
    brand: 'Laminam'
  },
  {
    id: 'mat-marble-marquina',
    name: 'Mermer Nero Marquina i Zi',
    category: 'marble',
    colorHex: '#121316',
    roughness: 0.1,
    metalness: 0.3,
    pricePerM2: 90,
    brand: 'Laminam'
  },
  {
    id: 'mat-marble-emperador',
    name: 'Mermer Emperador Kafe',
    category: 'marble',
    colorHex: '#3d2e24',
    roughness: 0.2,
    metalness: 0.2,
    pricePerM2: 82,
    brand: 'Graniti'
  },

  // LACQUER FINISHES
  {
    id: 'mat-lacquer-emerald-mat',
    name: 'Smalto Emerald Green Mat',
    category: 'lacquer_mat',
    colorHex: '#1e3d30',
    roughness: 0.7,
    metalness: 0.05,
    pricePerM2: 42
  },
  {
    id: 'mat-lacquer-navy-gloss',
    name: 'Smalto Navy Blue High Gloss',
    category: 'lacquer_gloss',
    colorHex: '#0d1f38',
    roughness: 0.05,
    metalness: 0.4,
    pricePerM2: 48
  }
];

export const DEFAULT_TV_MODULES = [
  {
    name: 'Kaça 60cm (Sub-Parts & Profil Alumini)',
    type: 'side_cabinet' as const,
    width: 600,
    height: 720,
    depth: 400,
    materialId: 'mat-egger-silk-white',
    topMaterialId: 'mat-slat-walnut-dark', // Tavani Kaft (Arrë)
    bottomMaterialId: 'mat-egger-silk-white', // Podi Bardh
    leftMaterialId: 'mat-egger-silk-white', // Ansorja e majtë Bardh
    rightMaterialId: 'mat-egger-silk-white', // Ansorja e djathtë Bardh
    frontMaterialId: 'mat-egger-cashmere', // Fronti Cashmere
    hasAluminumProfile: true,
    aluminumProfilePosition: 'top' as const,
    aluminumProfileColor: '#18181b', // E Zezë Anodizuar
    aluminumProfileGapMm: 20, // 20mm gap per LED / Gola handle
    icon: '🗄️'
  },
  {
    name: 'Kaça 80cm (Sub-Parts & Profil Alumini)',
    type: 'side_cabinet' as const,
    width: 800,
    height: 720,
    depth: 400,
    materialId: 'mat-egger-silk-white',
    topMaterialId: 'mat-slat-oak-natural', // Tavani Lisi Natyral
    bottomMaterialId: 'mat-egger-silk-white', // Podi Bardh
    leftMaterialId: 'mat-egger-silk-white', // Ansorja e majtë Bardh
    rightMaterialId: 'mat-egger-silk-white', // Ansorja e djathtë Bardh
    frontMaterialId: 'mat-egger-sage-green', // Fronti Sage Green
    hasAluminumProfile: true,
    aluminumProfilePosition: 'top' as const,
    aluminumProfileColor: '#18181b',
    aluminumProfileGapMm: 20,
    icon: '🗄️'
  },
  {
    name: 'Konsole TV e Pezulluar 200cm',
    type: 'floating_console' as const,
    width: 2000,
    height: 360,
    depth: 400,
    drawerCount: 3,
    materialId: 'mat-egger-sage-green',
    topMaterialId: 'mat-slat-oak-natural',
    bottomMaterialId: 'mat-egger-sage-green',
    leftMaterialId: 'mat-egger-sage-green',
    rightMaterialId: 'mat-egger-sage-green',
    frontMaterialId: 'mat-egger-cashmere',
    hasAluminumProfile: true,
    aluminumProfilePosition: 'top' as const,
    aluminumProfileColor: '#d4af37', // Gold Profile
    aluminumProfileGapMm: 20,
    icon: '📺'
  },
  {
    name: 'Konsole TV e Pezulluar 240cm',
    type: 'floating_console' as const,
    width: 2400,
    height: 400,
    depth: 420,
    drawerCount: 3,
    materialId: 'mat-slat-walnut-dark',
    icon: '📺'
  },
  {
    name: 'Panel Sllata Druri Lisi (120x240cm)',
    type: 'slat_panel' as const,
    width: 1200,
    height: 2400,
    depth: 35,
    materialId: 'mat-slat-oak-natural',
    icon: '🪵'
  },
  {
    name: 'Panel Mermer Calacatta (160x240cm)',
    type: 'marble_panel' as const,
    width: 1600,
    height: 2400,
    depth: 20,
    materialId: 'mat-marble-calacatta',
    icon: '🏛️'
  },
  {
    name: 'Vitrinë Xhami Vertikale me LED',
    type: 'glass_vitrine' as const,
    width: 600,
    height: 2000,
    depth: 380,
    shelfCount: 4,
    materialId: 'mat-egger-anthracite',
    icon: '🔲'
  },
  {
    name: 'Raft Muri i Pezulluar me LED',
    type: 'wall_shelf' as const,
    width: 1800,
    height: 60,
    depth: 250,
    materialId: 'mat-slat-oak-natural',
    icon: '📏'
  },
  {
    name: 'Dollap Anësor me Derë MDF',
    type: 'side_cabinet' as const,
    width: 500,
    height: 1800,
    depth: 380,
    materialId: 'mat-egger-cashmere',
    icon: '🚪'
  },
  {
    name: 'Televizor OLED 75" 4K',
    type: 'tv_screen' as const,
    width: 1680,
    height: 960,
    depth: 60,
    tvSizeInches: 75,
    materialId: 'mat-egger-anthracite',
    icon: '🖥️'
  },
  {
    name: 'Televizor OLED 85" 4K',
    type: 'tv_screen' as const,
    width: 1900,
    height: 1080,
    depth: 60,
    tvSizeInches: 85,
    materialId: 'mat-egger-anthracite',
    icon: '🖥️'
  },
  {
    name: 'Shirit LED Dekorativ me Profil Alumini',
    type: 'led_strip' as const,
    width: 2400,
    height: 20,
    depth: 15,
    ledColor: 'warm' as const,
    materialId: 'mat-egger-silk-white',
    icon: '💡'
  }
];
