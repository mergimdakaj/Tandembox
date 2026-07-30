export type ElementType = 
  | 'tv_screen'
  | 'floating_console'
  | 'slat_panel'
  | 'marble_panel'
  | 'glass_vitrine'
  | 'wall_shelf'
  | 'side_cabinet'
  | 'led_strip'
  | 'accessory';

export interface TvWallMaterial {
  id: string;
  name: string;
  category: 'mdf_egger' | 'mdf_kronospan' | 'wood_slat' | 'marble' | 'lacquer_mat' | 'lacquer_gloss';
  colorHex: string;
  textureUrl?: string;
  roughness: number;
  metalness: number;
  pricePerM2: number;
  brand?: string;
}

export interface TvWallElement {
  id: string;
  name: string;
  type: ElementType;
  x: number; // position in mm from wall left bottom
  y: number; // position in mm from wall floor
  z: number; // depth offset in mm from wall
  width: number; // in mm
  height: number; // in mm
  depth: number; // in mm
  materialId: string; // default / main material

  // Parametric Sub-Part Materials (Cabinet Vision & SketchUp)
  topMaterialId?: string;     // Tavani / Kapaku i sipërm (Ceiling)
  bottomMaterialId?: string;  // Podi / Baza (Floor)
  leftMaterialId?: string;    // Ansorja e majtë (Left Side)
  rightMaterialId?: string;   // Ansorja e djathtë (Right Side)
  backMaterialId?: string;    // Shpina / Sfondi i pasmë (Backing)
  frontMaterialId?: string;   // Portat / Fiokat / Frontet (Doors)

  // Door / Front Placement & Style Options
  frontPlacement?: 'overlay' | 'inset'; // 'overlay' = E mbulon kaçën plotësisht (sa madhësia e kaçës), 'inset' = I brendshëm
  frontStyle?: 'flat' | 'shaker' | 'grooved' | 'glass';
  handleStyle?: 'gola' | 'bar_gold' | 'bar_black' | 'knob_gold' | 'knob_black' | 'push_open';

  // Aluminum Gola / LED Profile Channel Configuration
  hasAluminumProfile?: boolean;
  aluminumProfilePosition?: 'top' | 'middle' | 'bottom';
  aluminumProfileColor?: string; // e.g. '#18181b', '#d4af37', '#cbd5e1'
  aluminumProfileGapMm?: number; // Gap clearance e.g. 20mm (+2cm overhang)

  drawerCount?: number;
  shelfCount?: number;
  tvSizeInches?: number;
  ledColor?: 'warm' | 'natural' | 'cool';
  ledPowerWatts?: number;
  rotationY?: number;
  icon?: string;
  priceEstimate?: number;
}

export interface WallConfig {
  width: number; // mm (e.g., 3600)
  height: number; // mm (e.g., 2600)
  depth: number; // mm wall thickness / room depth (e.g., 200)
  wallColor: string;
  floorMaterial: string;
  ledTone: '3000K' | '4000K' | '6000K' | 'Off';
  ledBrightness: number; // 0 - 100
  ledPricePerMeter: number;
}

export interface TvWallProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  wall: WallConfig;
  elements: TvWallElement[];
  laborCost: number; // Euro
  hardwareCost: number; // Euro
  customDiscountPercent: number;
}
