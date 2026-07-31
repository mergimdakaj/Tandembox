import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  CheckCircle2, 
  Layers, 
  Box, 
  Info, 
  Sliders, 
  Share2, 
  Database, 
  Calculator, 
  CheckSquare, 
  Square, 
  FolderDown, 
  FolderOpen, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Copy, 
  RotateCcw,
  Tag,
  FileSpreadsheet,
  Truck,
  Zap,
  Sparkles,
  Layers3,
  Columns3,
  LayoutGrid,
  Eye,
  Lock,
  Unlock,
  Maximize2,
  X,
  MapPin,
  Check,
  Compass,
  Search,
  ChevronDown
} from 'lucide-react';

// Material Interface in the database
export interface WeightMaterial {
  id: string;
  name: string;
  thicknessMm: number;
  weightPerM2: number; // kg per 1 m²
  category: 'iverice' | 'mdf' | 'hdf' | 'xham' | 'gur_kuarce' | 'tjera';
  isCustom?: boolean;
}

// Single Cabinet Component breakdown calculation
export interface ComponentWeight {
  partName: string;
  count: number;
  widthMm: number;
  heightMm: number;
  areaM2: number;
  materialName: string;
  weightPerM2: number;
  totalKg: number;
}

// Door Dimensions interface
export interface DoorDimension {
  widthMm?: number;
  heightMm?: number;
}

// Shelf Dimensions interface
export interface ShelfDimension {
  widthMm?: number;
  depthMm?: number;
}

export type ElementPosition = 'lart' | 'posht' | 'kolone' | 'raft_lart' | 'raft_posht';
export type SideTag = 'majtas' | 'djathtas' | 'qender' | 'kend';

// Single Cabinet Element Item
export interface KitchenElementItem {
  id: string;
  name: string;
  position: ElementPosition; // Position: Wall, Base, Column, Wall Shelf, Base Shelf
  sideTag?: SideTag;         // Side Orientation: Majtas, Djathtas, Qendër, Kënd
  widthMm: number;  // e.g. 600
  heightMm: number; // e.g. 720
  depthMm: number;  // e.g. 560
  carcaseMaterialId: string;
  hasTopBottom?: boolean;
  
  // Shelves
  numShelves: number;
  shelfMaterialId: string;
  shelfWidthMm?: number;  // Custom shelf width in mm
  shelfDepthMm?: number;  // Custom shelf depth in mm
  customShelves?: ShelfDimension[]; // Dimensions for each shelf (Rafti 1, Rafti 2, etc.)

  // Doors
  numDoors: number;
  doorMaterialId: string;
  doorWidthMm?: number;   // Fallback / single door width in mm
  doorHeightMm?: number;  // Fallback / single door height in mm
  customDoors?: DoorDimension[]; // Dimensions for each door (Door 1, Door 2, etc.)

  // Backing & Hardware
  hasBacking: boolean;
  backingMaterialId: string;
  hardwareKg: number;
  quantity: number;

  // Production Status & Custom Override
  isCompleted?: boolean;
  overrideTotalKg?: number;

  // Pallet Logistics
  palletNumber?: number; // Paleta 1, Paleta 2, etc. (80x120 cm)
}

// Saved Kitchen Project structure
export interface SavedKitchenProject {
  id: string;
  code: string;
  name: string;
  updatedAt: string;
  elements: KitchenElementItem[];
  totalKg: number;
}

// Position Label Helper
export const getPositionLabel = (pos: ElementPosition): string => {
  switch (pos) {
    case 'lart': return 'Elementet Lart';
    case 'posht': return 'Elementet Poshtë';
    case 'kolone': return 'Kolonat (Shpajz/Tall)';
    case 'raft_lart': return 'Raftat Lart';
    case 'raft_posht': return 'Raftat Poshtë';
    default: return 'Element';
  }
};

export const getPositionShortLabel = (pos: ElementPosition): string => {
  switch (pos) {
    case 'lart': return 'Lart';
    case 'posht': return 'Poshtë';
    case 'kolone': return 'Kolonë';
    case 'raft_lart': return 'Raft Lart';
    case 'raft_posht': return 'Raft Poshtë';
    default: return 'Element';
  }
};

export const getPositionBadgeColor = (pos: ElementPosition): string => {
  switch (pos) {
    case 'lart': return 'bg-amber-950 text-amber-300 border-amber-800';
    case 'posht': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    case 'kolone': return 'bg-purple-950 text-purple-300 border-purple-800';
    case 'raft_lart': return 'bg-cyan-950 text-cyan-300 border-cyan-800';
    case 'raft_posht': return 'bg-blue-950 text-blue-300 border-blue-800';
    default: return 'bg-slate-900 text-slate-300 border-slate-700';
  }
};

// Initial Preset Materials Database
const DEFAULT_MATERIALS: WeightMaterial[] = [
  { id: 'mat-iv-18', name: 'Ivericë 18 mm', thicknessMm: 18, weightPerM2: 10.5, category: 'iverice' },
  { id: 'mat-iv-22', name: 'Ivericë 22 mm', thicknessMm: 22, weightPerM2: 12.8, category: 'iverice' },
  { id: 'mat-mdf-19', name: 'MDF 19 mm', thicknessMm: 19, weightPerM2: 14.2, category: 'mdf' },
  { id: 'mat-mdf-22', name: 'MDF 22 mm', thicknessMm: 22, weightPerM2: 16.5, category: 'mdf' },
  { id: 'mat-hdf-3', name: 'HDF / Lesenit 3 mm', thicknessMm: 3, weightPerM2: 2.4, category: 'hdf' },
  { id: 'mat-xham-4', name: 'Xham Vitrinë 4 mm', thicknessMm: 4, weightPerM2: 10.0, category: 'xham' },
  { id: 'mat-kuarce-20', name: 'Kuarce / Granit 20 mm', thicknessMm: 20, weightPerM2: 50.0, category: 'gur_kuarce' },
];

// Initial Preset Kitchen Elements
const DEFAULT_KITCHEN_ELEMENTS: KitchenElementItem[] = [
  {
    id: 'k-el-1',
    name: 'Kabinë e Lartë Shpajz / Frigorifer',
    position: 'kolone',
    widthMm: 600,
    heightMm: 2225,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 4,
    shelfMaterialId: 'mat-iv-18',
    shelfWidthMm: 564,
    shelfDepthMm: 540,
    numDoors: 2,
    doorMaterialId: 'mat-mdf-22',
    doorWidthMm: 597,
    doorHeightMm: 1100,
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 4.5,
    quantity: 1,
    isCompleted: false,
    palletNumber: 1
  },
  {
    id: 'k-el-2',
    name: 'Vitrinë me Varje 80 (Lart)',
    position: 'lart',
    widthMm: 800,
    heightMm: 720,
    depthMm: 350,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 2,
    shelfMaterialId: 'mat-xham-4',
    shelfWidthMm: 764,
    shelfDepthMm: 330,
    numDoors: 2,
    doorMaterialId: 'mat-xham-4',
    doorWidthMm: 397,
    doorHeightMm: 716,
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 3.2,
    quantity: 1,
    isCompleted: true,
    palletNumber: 1
  },
  {
    id: 'k-el-3',
    name: 'Element me Varje 60 (Lart)',
    position: 'lart',
    widthMm: 600,
    heightMm: 720,
    depthMm: 350,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 2,
    shelfMaterialId: 'mat-iv-18',
    shelfWidthMm: 564,
    shelfDepthMm: 330,
    numDoors: 1,
    doorMaterialId: 'mat-mdf-22',
    doorWidthMm: 597,
    doorHeightMm: 716,
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 1.8,
    quantity: 2,
    isCompleted: false,
    palletNumber: 1
  },
  {
    id: 'k-el-4',
    name: 'Element Baza Lavapjatë 80 (Poshtë)',
    position: 'posht',
    widthMm: 800,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 1,
    shelfMaterialId: 'mat-iv-18',
    shelfWidthMm: 764,
    shelfDepthMm: 540,
    numDoors: 2,
    doorMaterialId: 'mat-mdf-22',
    doorWidthMm: 397,
    doorHeightMm: 716,
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 2.5,
    quantity: 1,
    isCompleted: false,
    palletNumber: 2
  },
  {
    id: 'k-el-5',
    name: 'Element Baza 3 Fioka 90 (Poshtë)',
    position: 'posht',
    widthMm: 900,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 0,
    shelfMaterialId: 'mat-iv-18',
    numDoors: 3,
    doorMaterialId: 'mat-mdf-22',
    doorWidthMm: 897,
    doorHeightMm: 236,
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 6.0,
    quantity: 1,
    isCompleted: true,
    palletNumber: 2
  },
  {
    id: 'k-el-6',
    name: 'Raft i Hapur Lart 60',
    position: 'raft_lart',
    widthMm: 600,
    heightMm: 350,
    depthMm: 250,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 1,
    shelfMaterialId: 'mat-iv-18',
    shelfWidthMm: 564,
    shelfDepthMm: 230,
    numDoors: 0,
    doorMaterialId: 'mat-mdf-22',
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 0.8,
    quantity: 1,
    isCompleted: false,
    palletNumber: 1
  }
];

export const getAlbanianCategoryLabel = (pos: ElementPosition | string, customCatLabel?: string): string => {
  if (customCatLabel && !['Base Cabinets', 'Wall Cabinets', 'Tall Cabinets', 'Drawer Units'].includes(customCatLabel)) {
    return customCatLabel;
  }
  if (pos === 'kolone' || customCatLabel === 'Tall Cabinets') return 'Kolonë (Spajz)';
  if (pos === 'lart' || pos === 'raft_lart' || customCatLabel === 'Wall Cabinets') return 'Lart (Pezull)';
  if (pos === 'posht' || customCatLabel === 'Base Cabinets') return 'Poshtë (Baza)';
  if (customCatLabel === 'Drawer Units') return 'Fioka';
  return customCatLabel || 'Poshtë (Baza)';
};

export interface CatalogPresetItem {
  id: string;
  name: string;
  position: ElementPosition;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  carcaseMaterialId: string;
  hasTopBottom?: boolean;
  numShelves: number;
  shelfMaterialId: string;
  shelfWidthMm?: number;
  shelfDepthMm?: number;
  customShelves?: ShelfDimension[];
  numDoors: number;
  doorMaterialId: string;
  doorWidthMm?: number;
  doorHeightMm?: number;
  hasBacking: boolean;
  backingMaterialId: string;
  hardwareKg: number;
  quantity: number;
  approxKg: number;
  categoryLabel: string;
}

export const PRESET_CATALOG_ITEMS: CatalogPresetItem[] = [
  // Tall Cabinets (Kolonë / Spajz)
  {
    id: 'preset-kolone-60',
    name: 'Kolonë Shpajz 60x210 cm',
    position: 'kolone',
    widthMm: 600, heightMm: 2100, depthMm: 560,
    carcaseMaterialId: 'mat-iv-18', numShelves: 4, shelfMaterialId: 'mat-iv-18',
    numDoors: 2, doorMaterialId: 'mat-mdf-22', doorWidthMm: 597, doorHeightMm: 1040,
    hasBacking: true, backingMaterialId: 'mat-hdf-3', hardwareKg: 4.5, quantity: 1,
    approxKg: 65.0, categoryLabel: 'Kolonë (Spajz)'
  }
];

export function KitchenWeightCalculator() {
  const [activeTab, setActiveTab] = useState<'kitchen-project' | 'single' | 'materials-db' | 'saved-projects'>('kitchen-project');

  // Preset catalog state (persisted in localStorage, allowing standard created items to be saved into Kërko Elementet me Pesha)
  const [presetCatalog, setPresetCatalog] = useState<CatalogPresetItem[]>(() => {
    const saved = localStorage.getItem('mergim_preset_catalog_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error loading preset catalog:', e);
      }
    }
    return PRESET_CATALOG_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('mergim_preset_catalog_v6', JSON.stringify(presetCatalog));
  }, [presetCatalog]);

  // Quick Element Modal State
  const [isQuickElementModalOpen, setIsQuickElementModalOpen] = useState<boolean>(false);
  const [expandedElementId, setExpandedElementId] = useState<string | null>(null);
  const [quickForm, setQuickForm] = useState({
    name: 'Element i Shpejtë / Kolonë / Derë',
    position: 'posht' as ElementPosition,
    widthMm: 600,
    heightMm: 720,
    depthMm: 560,
    hasAnsores: true,
    ansoresThickness: 18 as 18 | 22,
    hasTopBottom: true,
    numShelves: 1, // 0 for Jo Raft, 1+ for Raft
    shelfWidthMm: 564,
    shelfDepthMm: 540,
    numDoors: 1, // 0 for Pa Derë, 1 for 1 Derë, 2 for 2 Dyer
    doorThickness: 22 as 19 | 22,
    door1WidthMm: 597,
    door1HeightMm: 716,
    door2WidthMm: 297,
    door2HeightMm: 716,
    hasBacking: true,
    saveToPresetCatalog: true,
    quantity: 1
  });

  // Modal to inspect Pallets overview
  const [isPalletModalOpen, setIsPalletModalOpen] = useState<boolean>(false);

  // Catalog search & filter state
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');

  // Pallet Studio 3D Interactive View State (Photo 3 matching)
  const [selectedStudioPallet, setSelectedStudioPallet] = useState<number>(1);
  const [studioPalletType, setStudioPalletType] = useState<'euro' | 'american'>('euro');
  const [studioViewMode, setStudioViewMode] = useState<'3D' | '2D'>('3D');
  const [studioRotateDeg, setStudioRotateDeg] = useState<number>(0);
  const [studioSnapOn, setStudioSnapOn] = useState<boolean>(true);

  // Kitchen Code & Name
  const [kitchenCode, setKitchenCode] = useState<string>(() => {
    return localStorage.getItem('mergim_kitchen_code') || 'KUZ-2026-001';
  });
  const [kitchenName, setKitchenName] = useState<string>(() => {
    return localStorage.getItem('mergim_kitchen_name') || 'Kuzhina Moderne Prishtinë';
  });

  // Save code & name to localStorage
  useEffect(() => {
    localStorage.setItem('mergim_kitchen_code', kitchenCode);
  }, [kitchenCode]);
  useEffect(() => {
    localStorage.setItem('mergim_kitchen_name', kitchenName);
  }, [kitchenName]);

  // Materials Database State (Persisted in localStorage)
  const [materials, setMaterials] = useState<WeightMaterial[]>(() => {
    const saved = localStorage.getItem('mergim_weight_materials');
    return saved ? JSON.parse(saved) : DEFAULT_MATERIALS;
  });

  useEffect(() => {
    localStorage.setItem('mergim_weight_materials', JSON.stringify(materials));
  }, [materials]);

  // Kitchen Project Elements List (Persisted in localStorage, defaults to empty list)
  const [kitchenElements, setKitchenElements] = useState<KitchenElementItem[]>(() => {
    const saved = localStorage.getItem('mergim_kitchen_project_elements_v6');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mergim_kitchen_project_elements_v6', JSON.stringify(kitchenElements));
  }, [kitchenElements]);

  // Saved Projects List (Persisted in localStorage)
  const [savedProjects, setSavedProjects] = useState<SavedKitchenProject[]>(() => {
    const saved = localStorage.getItem('mergim_saved_kitchen_projects');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mergim_saved_kitchen_projects', JSON.stringify(savedProjects));
  }, [savedProjects]);

  // Element List View Position Filter
  const [filterPosition, setFilterPosition] = useState<'all' | ElementPosition>('all');

  // Front Thickness Filter (19mm vs 22mm vs all)
  const [frontThicknessFilter, setFrontThicknessFilter] = useState<'all' | '19mm' | '22mm'>('all');

  // Explicit Pallets List State (e.g. Paleta 1, Paleta 2...)
  const [customPallets, setCustomPallets] = useState<number[]>(() => {
    const saved = localStorage.getItem('mergim_custom_pallets_list_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* fallback */ }
    }
    return [1];
  });

  useEffect(() => {
    localStorage.setItem('mergim_custom_pallets_list_v6', JSON.stringify(customPallets));
  }, [customPallets]);

  const handleRemovePallet = (palletNoToRemove: number) => {
    if (customPallets.length <= 1) return;
    setCustomPallets(prev => prev.filter(p => p !== palletNoToRemove));
    setKitchenElements(prev => prev.map(el => el.palletNumber === palletNoToRemove ? { ...el, palletNumber: 1 } : el));
    if (selectedActivePallet === palletNoToRemove) {
      setSelectedActivePallet(1);
    }
  };

  // Selected Active Pallet for Step-by-Step workflow
  const [selectedActivePallet, setSelectedActivePallet] = useState<number>(1);

  // Completed / Sealed Pallets List
  const [completedPallets, setCompletedPallets] = useState<number[]>(() => {
    const saved = localStorage.getItem('mergim_completed_pallets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('mergim_completed_pallets', JSON.stringify(completedPallets));
  }, [completedPallets]);

  // Step 1 Initial Wizard State - Always start from beginning screen when opening app
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // Selected element for visual selection & quick pallet assignment
  const [selectedVisualElementId, setSelectedVisualElementId] = useState<string | null>(null);

  // Pallet Type: 'euro' (1200x800) | 'american' (1200x1000)
  const [palletType, setPalletType] = useState<'euro' | 'american'>('euro');

  // Selected pallet ID for "Futem ne Paletë" detailed inspect modal/view
  const [activePalletModal, setActivePalletModal] = useState<number | null>(null);
  const [inspectModalTab, setInspectModalTab] = useState<'list' | 'map2d'>('list');

  // Single Element Builder Form State
  const [builderForm, setBuilderForm] = useState<KitchenElementItem>({
    id: 'temp-1',
    name: 'Kabinë / Element i Ri',
    position: 'posht',
    widthMm: 600,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    hasTopBottom: true,
    numShelves: 1,
    shelfMaterialId: 'mat-iv-18',
    shelfWidthMm: 564,
    shelfDepthMm: 540,
    numDoors: 1,
    doorMaterialId: 'mat-mdf-22',
    doorWidthMm: 597,
    doorHeightMm: 716,
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 2.0,
    quantity: 1,
    isCompleted: false,
    palletNumber: 1
  });

  // New custom material input state
  const [newMatName, setNewMatName] = useState('');
  const [newMatThickness, setNewMatThickness] = useState<number>(18);
  const [newMatWeight, setNewMatWeight] = useState<number>(10.5);
  const [newMatCategory, setNewMatCategory] = useState<WeightMaterial['category']>('iverice');

  // Clear list handler
  const handleClearKitchenElements = () => {
    setKitchenElements([]);
  };

  // Quick Element Submission Handler
  const handleAddQuickElementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doorMatId = quickForm.doorThickness === 22 ? 'mat-mdf-22' : 'mat-mdf-19';
    const carcaseMatId = quickForm.ansoresThickness === 22 ? 'mat-iv-22' : 'mat-iv-18';
    const newId = `quick-el-${Date.now()}`;

    // Custom doors array if 2 doors or custom door size
    const customDoors: DoorDimension[] = [];
    if (quickForm.numDoors >= 1) {
      customDoors.push({
        widthMm: quickForm.door1WidthMm || (quickForm.numDoors === 2 ? Math.floor(quickForm.widthMm / 2) - 3 : Math.max(100, quickForm.widthMm - 3)),
        heightMm: quickForm.door1HeightMm || Math.max(100, quickForm.heightMm - 4)
      });
    }
    if (quickForm.numDoors >= 2) {
      customDoors.push({
        widthMm: quickForm.door2WidthMm || Math.floor(quickForm.widthMm / 2) - 3,
        heightMm: quickForm.door2HeightMm || Math.max(100, quickForm.heightMm - 4)
      });
    }
    
    // Custom shelves array if numShelves > 0
    const defaultSW = quickForm.shelfWidthMm || Math.max(10, quickForm.widthMm - 36);
    const defaultSD = quickForm.shelfDepthMm || Math.max(10, quickForm.depthMm - 20);
    const customShelves: ShelfDimension[] = [];
    if (quickForm.numShelves > 0) {
      for (let i = 0; i < quickForm.numShelves; i++) {
        const existing = quickForm.customShelves && quickForm.customShelves[i];
        customShelves.push({
          widthMm: existing?.widthMm ?? defaultSW,
          depthMm: existing?.depthMm ?? defaultSD
        });
      }
    }

    const newItem: KitchenElementItem = {
      id: newId,
      name: quickForm.name || (quickForm.position === 'kolone' ? 'Kolonë / Shpajz' : 'Element i Shpejtë'),
      position: quickForm.position,
      widthMm: quickForm.widthMm,
      heightMm: quickForm.heightMm,
      depthMm: quickForm.depthMm,
      carcaseMaterialId: carcaseMatId,
      hasTopBottom: quickForm.hasTopBottom !== false,
      numShelves: quickForm.numShelves,
      shelfMaterialId: 'mat-iv-18',
      shelfWidthMm: defaultSW,
      shelfDepthMm: defaultSD,
      customShelves: customShelves.length > 0 ? customShelves : undefined,
      numDoors: quickForm.numDoors,
      doorMaterialId: doorMatId,
      doorWidthMm: customDoors[0]?.widthMm || Math.max(100, quickForm.widthMm - 3),
      doorHeightMm: customDoors[0]?.heightMm || Math.max(100, quickForm.heightMm - 4),
      customDoors: customDoors.length > 0 ? customDoors : undefined,
      hasBacking: quickForm.hasBacking,
      backingMaterialId: 'mat-hdf-3',
      hardwareKg: quickForm.numDoors > 0 ? (quickForm.position === 'kolone' ? 4.5 : 2.5) : 0.8,
      quantity: quickForm.quantity || 1,
      isCompleted: false,
      palletNumber: selectedActivePallet || 1
    };

    // Add to current active elements list
    setKitchenElements(prev => [...prev, newItem]);

    // Optionally save to presetCatalog so it appears permanently in Kërko Elementet me Pesha
    if (quickForm.saveToPresetCatalog) {
      const calc = calculateElementBreakdown(newItem);
      const catLabel = quickForm.position === 'lart' || quickForm.position === 'raft_lart' 
        ? 'Lart (Pezull)' 
        : quickForm.position === 'kolone' 
        ? 'Kolonë (Spajz)' 
        : 'Poshtë (Baza)';

      const newPreset: CatalogPresetItem = {
        id: `preset-custom-${Date.now()}`,
        name: newItem.name,
        position: newItem.position,
        widthMm: newItem.widthMm,
        heightMm: newItem.heightMm,
        depthMm: newItem.depthMm,
        carcaseMaterialId: newItem.carcaseMaterialId,
        numShelves: newItem.numShelves,
        shelfMaterialId: newItem.shelfMaterialId,
        shelfWidthMm: newItem.shelfWidthMm,
        shelfDepthMm: newItem.shelfDepthMm,
        customShelves: newItem.customShelves,
        numDoors: newItem.numDoors,
        doorMaterialId: newItem.doorMaterialId,
        doorWidthMm: newItem.doorWidthMm,
        doorHeightMm: newItem.doorHeightMm,
        hasBacking: newItem.hasBacking,
        backingMaterialId: newItem.backingMaterialId,
        hardwareKg: newItem.hardwareKg,
        quantity: 1,
        approxKg: parseFloat(calc.finalUnitKg.toFixed(1)),
        categoryLabel: catLabel
      };

      setPresetCatalog(prev => [newPreset, ...prev]);
    }

    setIsQuickElementModalOpen(false);
  };

  // Register from Single Module Builder into Preset Catalog
  const handleSaveBuilderToPresetCatalog = () => {
    const calc = calculateElementBreakdown(builderForm);
    const catLabel = builderForm.position === 'lart' || builderForm.position === 'raft_lart' 
      ? 'Lart (Pezull)' 
      : builderForm.position === 'kolone' 
      ? 'Kolonë (Spajz)' 
      : 'Poshtë (Baza)';

    const newPreset: CatalogPresetItem = {
      id: `preset-builder-${Date.now()}`,
      name: builderForm.name || 'Modul Standard i Ri',
      position: builderForm.position,
      widthMm: builderForm.widthMm,
      heightMm: builderForm.heightMm,
      depthMm: builderForm.depthMm,
      carcaseMaterialId: builderForm.carcaseMaterialId,
      hasTopBottom: builderForm.hasTopBottom !== false,
      numShelves: builderForm.numShelves,
      shelfMaterialId: builderForm.shelfMaterialId,
      shelfWidthMm: builderForm.shelfWidthMm,
      shelfDepthMm: builderForm.shelfDepthMm,
      customShelves: builderForm.customShelves,
      numDoors: builderForm.numDoors,
      doorMaterialId: builderForm.doorMaterialId,
      doorWidthMm: builderForm.doorWidthMm,
      doorHeightMm: builderForm.doorHeightMm,
      hasBacking: builderForm.hasBacking,
      backingMaterialId: builderForm.backingMaterialId,
      hardwareKg: builderForm.hardwareKg,
      quantity: 1,
      approxKg: parseFloat(calc.finalUnitKg.toFixed(1)),
      categoryLabel: catLabel
    };

    setPresetCatalog(prev => [newPreset, ...prev]);
    alert(`Moduli "${builderForm.name}" u regjistrua me sukses në Katalogun Standard ("Kërko Elementet me Pesha")!`);
  };

  // Add Preset item handler
  const handleAddPresetToKitchenElements = (preset: CatalogPresetItem, targetPalletNo?: number) => {
    const newId = `preset-el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const palletAssigned = targetPalletNo !== undefined ? targetPalletNo : (selectedActivePallet || 1);
    const newItem: KitchenElementItem = {
      id: newId,
      name: preset.name,
      position: preset.position,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      depthMm: preset.depthMm,
      carcaseMaterialId: preset.carcaseMaterialId,
      hasTopBottom: preset.hasTopBottom !== false,
      numShelves: preset.numShelves,
      shelfMaterialId: preset.shelfMaterialId,
      shelfWidthMm: preset.shelfWidthMm || Math.max(10, preset.widthMm - 36),
      shelfDepthMm: preset.shelfDepthMm || Math.max(10, preset.depthMm - 20),
      customShelves: preset.customShelves,
      numDoors: preset.numDoors,
      doorMaterialId: preset.doorMaterialId,
      doorWidthMm: preset.doorWidthMm,
      doorHeightMm: preset.doorHeightMm,
      hasBacking: preset.hasBacking,
      backingMaterialId: preset.backingMaterialId,
      hardwareKg: preset.hardwareKg,
      quantity: 1,
      isCompleted: false,
      palletNumber: palletAssigned
    };
    setKitchenElements(prev => [...prev, newItem]);
  };

  // Helper to get material object
  const getMaterial = (id: string): WeightMaterial => {
    return materials.find(m => m.id === id) || materials[0] || {
      id: 'fallback',
      name: 'Ivericë 18 mm',
      thicknessMm: 18,
      weightPerM2: 10.5,
      category: 'iverice'
    };
  };

  // Calculate detailed component breakdown for an element
  const calculateElementBreakdown = (el: KitchenElementItem) => {
    const carcaseMat = getMaterial(el.carcaseMaterialId);
    const shelfMat = getMaterial(el.shelfMaterialId);
    const doorMat = getMaterial(el.doorMaterialId);
    const backingMat = getMaterial(el.backingMaterialId);

    const wM = el.widthMm / 1000;
    const hM = el.heightMm / 1000;
    const dM = el.depthMm / 1000;
    const tM = carcaseMat.thicknessMm / 1000;

    const components: ComponentWeight[] = [];

    // 1. Anësoret (Left & Right Sides)
    const sidesArea = 2 * (hM * dM);
    const sidesKg = sidesArea * carcaseMat.weightPerM2;
    components.push({
      partName: 'Anësore (L+R)',
      count: 2,
      widthMm: el.depthMm,
      heightMm: el.heightMm,
      areaM2: Number(sidesArea.toFixed(3)),
      materialName: carcaseMat.name,
      weightPerM2: carcaseMat.weightPerM2,
      totalKg: Number(sidesKg.toFixed(2))
    });

    // 2. Tavan / Dysheme (Top & Bottom panels)
    let topBotKg = 0;
    if (el.hasTopBottom !== false) {
      const topBotWidthM = Math.max(0, wM - (2 * tM));
      const topBotArea = 2 * (topBotWidthM * dM);
      topBotKg = topBotArea * carcaseMat.weightPerM2;
      components.push({
        partName: 'Tavan & Dysheme',
        count: 2,
        widthMm: Math.round(topBotWidthM * 1000),
        heightMm: el.depthMm,
        areaM2: Number(topBotArea.toFixed(3)),
        materialName: carcaseMat.name,
        weightPerM2: carcaseMat.weightPerM2,
        totalKg: Number(topBotKg.toFixed(2))
      });
    }

    // 3. Raftet (Shelves) - custom per shelf or default
    if (el.numShelves > 0) {
      let totalShelfArea = 0;
      const defaultSW = (el.shelfWidthMm && el.shelfWidthMm > 0) ? el.shelfWidthMm : Math.round((wM - (2 * tM)) * 1000);
      const defaultSD = (el.shelfDepthMm && el.shelfDepthMm > 0) ? el.shelfDepthMm : Math.round((dM - 0.02) * 1000);
      const shelfListDesc: string[] = [];

      for (let i = 0; i < el.numShelves; i++) {
        const custom = el.customShelves && el.customShelves[i];
        const sW = (custom && custom.widthMm !== undefined && custom.widthMm > 0) ? custom.widthMm : defaultSW;
        const sD = (custom && custom.depthMm !== undefined && custom.depthMm > 0) ? custom.depthMm : defaultSD;
        totalShelfArea += (sW / 1000) * (sD / 1000);
        shelfListDesc.push(el.numShelves > 1 ? `R${i+1}:${sW}x${sD}` : `${sW}x${sD}mm`);
      }

      const shelfKg = totalShelfArea * shelfMat.weightPerM2;

      components.push({
        partName: `${el.numShelves} Raft(e) (${shelfListDesc.join(', ')})`,
        count: el.numShelves,
        widthMm: defaultSW,
        heightMm: defaultSD,
        areaM2: Number(totalShelfArea.toFixed(3)),
        materialName: shelfMat.name,
        weightPerM2: shelfMat.weightPerM2,
        totalKg: Number(shelfKg.toFixed(2))
      });
    }

    // 4. Dyer / Frontet (Doors) - custom per door or default
    if (el.numDoors > 0) {
      let totalDoorArea = 0;
      const doorListDesc: string[] = [];
      const defaultDW = (el.doorWidthMm && el.doorWidthMm > 0) ? el.doorWidthMm : Math.round((el.widthMm / el.numDoors) - 3);
      const defaultDH = (el.doorHeightMm && el.doorHeightMm > 0) ? el.doorHeightMm : (el.heightMm - 3);

      for (let i = 0; i < el.numDoors; i++) {
        const custom = el.customDoors && el.customDoors[i];
        const dW = (custom && custom.widthMm && custom.widthMm > 0) ? custom.widthMm : defaultDW;
        const dH = (custom && custom.heightMm && custom.heightMm > 0) ? custom.heightMm : defaultDH;
        totalDoorArea += (dW / 1000) * (dH / 1000);
        doorListDesc.push(el.numDoors > 1 ? `D${i+1}:${dW}x${dH}` : `${dW}x${dH}mm`);
      }

      const doorKg = totalDoorArea * doorMat.weightPerM2;

      components.push({
        partName: `${el.numDoors} Dyer/Front (${doorListDesc.join(', ')})`,
        count: el.numDoors,
        widthMm: defaultDW,
        heightMm: defaultDH,
        areaM2: Number(totalDoorArea.toFixed(3)),
        materialName: doorMat.name,
        weightPerM2: doorMat.weightPerM2,
        totalKg: Number(doorKg.toFixed(2))
      });
    }

    // 5. Kurrizi (Backing)
    if (el.hasBacking) {
      const backingArea = wM * hM;
      const backingKg = backingArea * backingMat.weightPerM2;
      components.push({
        partName: 'Kurrizi (Lesenit / HDF)',
        count: 1,
        widthMm: el.widthMm,
        heightMm: el.heightMm,
        areaM2: Number(backingArea.toFixed(3)),
        materialName: backingMat.name,
        weightPerM2: backingMat.weightPerM2,
        totalKg: Number(backingKg.toFixed(2))
      });
    }

    // 6. Mekanizmat & Pajisjet (Hardware)
    if (el.hardwareKg > 0) {
      components.push({
        partName: 'Mekanizma (Mentesha, Fioka, Doresa)',
        count: 1,
        widthMm: 0,
        heightMm: 0,
        areaM2: 0,
        materialName: 'Metal',
        weightPerM2: 0,
        totalKg: el.hardwareKg
      });
    }

    const calculatedTotalKg = components.reduce((sum, c) => sum + c.totalKg, 0);
    const finalUnitKg = (el.overrideTotalKg !== undefined && el.overrideTotalKg > 0) 
      ? el.overrideTotalKg 
      : Number(calculatedTotalKg.toFixed(2));

    const carcaseKg = sidesKg + topBotKg;
    const shelfKgVal = el.numShelves > 0 ? components.filter(c => c.partName.includes('Raft')).reduce((a,b) => a + b.totalKg, 0) : 0;
    const doorKgVal = el.numDoors > 0 ? components.filter(c => c.partName.includes('Dyer')).reduce((a,b) => a + b.totalKg, 0) : 0;
    const backingKgVal = el.hasBacking ? components.filter(c => c.partName.includes('Kurrizi')).reduce((a,b) => a + b.totalKg, 0) : 0;

    return {
      components,
      calculatedTotalKg: Number(calculatedTotalKg.toFixed(2)),
      finalUnitKg,
      totalLineKg: Number((finalUnitKg * el.quantity).toFixed(2)),
      carcaseKg: Number(carcaseKg.toFixed(2)),
      shelvesKg: Number(shelfKgVal.toFixed(2)),
      doorsKg: Number(doorKgVal.toFixed(2)),
      backingKg: Number(backingKgVal.toFixed(2)),
      hardwareKg: el.hardwareKg || 0
    };
  };

  // Builder calculation result
  const builderCalculated = calculateElementBreakdown(builderForm);

  // Full Project Totals & Category Filtered Lists
  const projectSummary = useMemo(() => {
    let grandTotalKg = 0;
    let totalItemsCount = 0;
    let completedItemsCount = 0;

    const materialWeightMap: Record<string, { materialName: string; totalKg: number; areaM2: number }> = {};

    const wallElements: KitchenElementItem[] = [];
    const baseElements: KitchenElementItem[] = [];
    const columnElements: KitchenElementItem[] = [];
    const wallShelfElements: KitchenElementItem[] = [];
    const baseShelfElements: KitchenElementItem[] = [];

    kitchenElements.forEach(el => {
      const breakdown = calculateElementBreakdown(el);
      const qty = el.quantity || 1;
      
      grandTotalKg += breakdown.finalUnitKg * qty;
      totalItemsCount += qty;
      if (el.isCompleted) {
        completedItemsCount += qty;
      }

      if (el.position === 'lart') wallElements.push(el);
      else if (el.position === 'posht') baseElements.push(el);
      else if (el.position === 'kolone') columnElements.push(el);
      else if (el.position === 'raft_lart') wallShelfElements.push(el);
      else if (el.position === 'raft_posht') baseShelfElements.push(el);

      breakdown.components.forEach(comp => {
        const matKey = comp.materialName;
        if (!materialWeightMap[matKey]) {
          materialWeightMap[matKey] = { materialName: matKey, totalKg: 0, areaM2: 0 };
        }
        materialWeightMap[matKey].totalKg += comp.totalKg * qty;
        materialWeightMap[matKey].areaM2 += comp.areaM2 * qty;
      });
    });

    const materialBreakdownList = Object.values(materialWeightMap).map(m => ({
      materialName: m.materialName,
      totalKg: Number(m.totalKg.toFixed(1)),
      areaM2: Number(m.areaM2.toFixed(2)),
      percentage: grandTotalKg > 0 ? Number(((m.totalKg / grandTotalKg) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.totalKg - a.totalKg);

    return {
      grandTotalKg: Number(grandTotalKg.toFixed(1)),
      totalItemsCount,
      completedItemsCount,
      materialBreakdownList,
      wallElements,
      baseElements,
      columnElements,
      wallShelfElements,
      baseShelfElements
    };
  }, [kitchenElements, materials]);

  // Pallet Distribution Calculation (Includes all created pallets in customPallets)
  const palletSummary = useMemo(() => {
    const palletsMap: Record<number, {
      palletNumber: number;
      totalKg: number;
      elements: { element: KitchenElementItem; lineKg: number; unitKg: number }[];
    }> = {};

    // Ensure all defined custom pallets exist in map
    customPallets.forEach(pNo => {
      palletsMap[pNo] = { palletNumber: pNo, totalKg: 0, elements: [] };
    });

    kitchenElements.forEach(el => {
      const palletNo = el.palletNumber || 1;
      if (!palletsMap[palletNo]) {
        palletsMap[palletNo] = { palletNumber: palletNo, totalKg: 0, elements: [] };
      }
      const breakdown = calculateElementBreakdown(el);
      const lineKg = breakdown.totalLineKg;
      palletsMap[palletNo].totalKg += lineKg;
      palletsMap[palletNo].elements.push({
        element: el,
        lineKg,
        unitKg: breakdown.finalUnitKg
      });
    });

    const list = Object.values(palletsMap).sort((a, b) => a.palletNumber - b.palletNumber);
    return list;
  }, [kitchenElements, materials, customPallets]);

  // Displayed elements according to selected position filter
  const displayedElements = useMemo(() => {
    return kitchenElements.filter(el => {
      // Filter by position
      if (filterPosition !== 'all' && el.position !== filterPosition) {
        return false;
      }
      return true;
    });
  }, [kitchenElements, filterPosition]);

  // Function to Add a New Pallet ("Shto Paletë")
  const handleAddNewPallet = () => {
    const maxNumber = customPallets.length > 0 ? Math.max(...customPallets) : 0;
    const newPalletNo = maxNumber + 1;
    setCustomPallets(prev => [...prev, newPalletNo]);
    setSelectedActivePallet(newPalletNo);
    alert(`U shtua me sukses "Paleta ${newPalletNo}"! Tani mund të vendosni elemente në të.`);
  };

  // Function to Mark a Pallet as Completed ("Përfundo Paletën 1") and move to Next
  const handleFinishPallet = (palletNo: number) => {
    if (!completedPallets.includes(palletNo)) {
      setCompletedPallets(prev => [...prev, palletNo]);
    }
    const nextPalletNo = palletNo + 1;
    if (!customPallets.includes(nextPalletNo)) {
      setCustomPallets(prev => [...prev, nextPalletNo]);
    }
    setSelectedActivePallet(nextPalletNo);
    alert(`✅ Paleta #${palletNo} u mbyll dhe u shënua si e PËRFUNDUAR për projektin ${kitchenCode} (${kitchenName})!\n\nTani po vazhdoni automatikisht me Paletën #${nextPalletNo}.`);
  };

  // Function to Re-open a Completed Pallet
  const handleReopenPallet = (palletNo: number) => {
    setCompletedPallets(prev => prev.filter(p => p !== palletNo));
    setSelectedActivePallet(palletNo);
  };

  // Add Element Directly into a specific Pallet
  const handleAddElementDirectlyToPallet = (palletNo: number) => {
    const id = `k-el-${Date.now()}`;
    const newEl: KitchenElementItem = {
      id,
      name: `Element i Ri në Paletën #${palletNo}`,
      position: 'posht',
      sideTag: 'majtas',
      widthMm: 600,
      heightMm: 720,
      depthMm: 560,
      carcaseMaterialId: 'mat-iv-18',
      numShelves: 1,
      shelfMaterialId: 'mat-iv-18',
      numDoors: 1,
      doorMaterialId: 'mat-mdf-22',
      hasBacking: true,
      backingMaterialId: 'mat-hdf-3',
      hardwareKg: 2.0,
      quantity: 1,
      palletNumber: palletNo
    };
    setKitchenElements(prev => [...prev, newEl]);
  };

  // Function to Delete a Pallet
  const handleDeletePallet = (palletNo: number) => {
    if (customPallets.length <= 1) {
      alert('Duhet të keni së paku 1 Paletë!');
      return;
    }
    // Reassign elements from deleted pallet to Paleta 1
    setKitchenElements(prev => prev.map(el => el.palletNumber === palletNo ? { ...el, palletNumber: 1 } : el));
    setCustomPallets(prev => prev.filter(p => p !== palletNo));
    if (activePalletModal === palletNo) setActivePalletModal(null);
  };

  // Function to batch switch all kitchen fronts to 19mm or 22mm
  const handleBatchChangeFrontThickness = (targetThickness: 19 | 22) => {
    const targetMatId = targetThickness === 22 ? 'mat-mdf-22' : 'mat-mdf-19';
    setKitchenElements(prev => prev.map(el => ({
      ...el,
      doorMaterialId: targetMatId
    })));
    alert(`Të gjitha frontet e kuzhinës u kthyen në ${targetThickness} mm!`);
  };

  // Function to add a custom new element ("Shtesë")
  const handleAddCustomElement = () => {
    const id = `k-el-${Date.now()}`;
    const newEl: KitchenElementItem = {
      id,
      name: 'Element i Ri / Shtesë',
      position: 'posht',
      widthMm: 600,
      heightMm: 720,
      depthMm: 560,
      carcaseMaterialId: 'mat-iv-18',
      numShelves: 1,
      shelfMaterialId: 'mat-iv-18',
      numDoors: 1,
      doorMaterialId: 'mat-mdf-22',
      hasBacking: true,
      backingMaterialId: 'mat-hdf-3',
      hardwareKg: 2.0,
      quantity: 1,
      palletNumber: 1
    };
    setKitchenElements(prev => [...prev, newEl]);
  };

  // Quick Preset Add Handler
  const handleAddPreset = (presetType: 'lart' | 'posht' | 'kolone' | 'raft_lart' | 'raft_posht' | 'fioka' | 'lavamani') => {
    const id = `k-el-${Date.now()}`;
    let newEl: KitchenElementItem;

    switch (presetType) {
      case 'lart':
        newEl = {
          id, name: 'Element me Varje 60 (Lart)', position: 'lart',
          widthMm: 600, heightMm: 720, depthMm: 350, carcaseMaterialId: 'mat-iv-18',
          numShelves: 2, shelfMaterialId: 'mat-iv-18', numDoors: 1, doorMaterialId: 'mat-mdf-22',
          hasBacking: true, backingMaterialId: 'mat-hdf-3', hardwareKg: 2.0, quantity: 1, palletNumber: 1
        };
        break;
      case 'posht':
        newEl = {
          id, name: 'Element Baza 60 (Poshtë)', position: 'posht',
          widthMm: 600, heightMm: 720, depthMm: 560, carcaseMaterialId: 'mat-iv-18',
          numShelves: 1, shelfMaterialId: 'mat-iv-18', numDoors: 1, doorMaterialId: 'mat-mdf-22',
          hasBacking: true, backingMaterialId: 'mat-hdf-3', hardwareKg: 2.5, quantity: 1, palletNumber: 1
        };
        break;
      case 'kolone':
        newEl = {
          id, name: 'Kolonë Shpajz 60 (Kolonë)', position: 'kolone',
          widthMm: 600, heightMm: 2225, depthMm: 560, carcaseMaterialId: 'mat-iv-18',
          numShelves: 4, shelfMaterialId: 'mat-iv-18', numDoors: 2, doorMaterialId: 'mat-mdf-22',
          hasBacking: true, backingMaterialId: 'mat-hdf-3', hardwareKg: 4.5, quantity: 1, palletNumber: 1
        };
        break;
      case 'raft_lart':
        newEl = {
          id, name: 'Raft i Hapur Lart 60', position: 'raft_lart',
          widthMm: 600, heightMm: 350, depthMm: 250, carcaseMaterialId: 'mat-iv-18',
          numShelves: 1, shelfMaterialId: 'mat-iv-18', numDoors: 0, doorMaterialId: 'mat-mdf-22',
          hasBacking: true, backingMaterialId: 'mat-hdf-3', hardwareKg: 0.8, quantity: 1, palletNumber: 1
        };
        break;
      case 'raft_posht':
        newEl = {
          id, name: 'Raft i Hapur Poshtë 60', position: 'raft_posht',
          widthMm: 600, heightMm: 720, depthMm: 540, carcaseMaterialId: 'mat-iv-18',
          numShelves: 2, shelfMaterialId: 'mat-iv-18', numDoors: 0, doorMaterialId: 'mat-mdf-22',
          hasBacking: false, backingMaterialId: 'mat-hdf-3', hardwareKg: 0.8, quantity: 1, palletNumber: 1
        };
        break;
      case 'fioka':
        newEl = {
          id, name: 'Fiokierë Poshtë 80 (3 Fioka)', position: 'posht',
          widthMm: 800, heightMm: 720, depthMm: 560, carcaseMaterialId: 'mat-iv-18',
          numShelves: 0, shelfMaterialId: 'mat-iv-18', numDoors: 3, doorMaterialId: 'mat-mdf-22',
          hasBacking: true, backingMaterialId: 'mat-hdf-3', hardwareKg: 6.0, quantity: 1, palletNumber: 1
        };
        break;
      case 'lavamani':
        newEl = {
          id, name: 'Element Lavamani 80', position: 'posht',
          widthMm: 800, heightMm: 720, depthMm: 560, carcaseMaterialId: 'mat-iv-18',
          numShelves: 0, shelfMaterialId: 'mat-iv-18', numDoors: 2, doorMaterialId: 'mat-mdf-22',
          hasBacking: false, backingMaterialId: 'mat-hdf-3', hardwareKg: 2.0, quantity: 1, palletNumber: 1
        };
        break;
    }

    setKitchenElements(prev => [...prev, newEl]);
  };

  // Auto-distribute elements into Euro Pallets (Max ~350kg per pallet)
  const handleAutoDistributePallets = (maxKgPerPallet = 350) => {
    let currentPallet = 1;
    let currentWeight = 0;

    const updated = kitchenElements.map(el => {
      const breakdown = calculateElementBreakdown(el);
      const lineKg = breakdown.totalLineKg;

      if (currentWeight > 0 && (currentWeight + lineKg > maxKgPerPallet)) {
        currentPallet += 1;
        currentWeight = 0;
      }

      currentWeight += lineKg;
      return { ...el, palletNumber: currentPallet };
    });

    setKitchenElements(updated);
    alert(`Elementet u shpërndanë automatikisht në ${currentPallet} Paleta (Max ~${maxKgPerPallet} kg/paletë)!`);
  };

  // Save current project state into Saved Projects
  const handleSaveCurrentProject = () => {
    const existingIdx = savedProjects.findIndex(p => p.code === kitchenCode);
    const newProj: SavedKitchenProject = {
      id: existingIdx >= 0 ? savedProjects[existingIdx].id : `proj-${Date.now()}`,
      code: kitchenCode || `KUZ-${Date.now()}`,
      name: kitchenName || 'Kuzhinë e Ruajtur',
      updatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      elements: JSON.parse(JSON.stringify(kitchenElements)),
      totalKg: projectSummary.grandTotalKg
    };

    if (existingIdx >= 0) {
      const updated = [...savedProjects];
      updated[existingIdx] = newProj;
      setSavedProjects(updated);
    } else {
      setSavedProjects([newProj, ...savedProjects]);
    }

    alert(`Projekti me Kod "${kitchenCode}" u ruajt me sukses!`);
  };

  // Load a saved project
  const handleLoadProject = (proj: SavedKitchenProject) => {
    setKitchenCode(proj.code);
    setKitchenName(proj.name);
    setKitchenElements(proj.elements);
    setActiveTab('kitchen-project');
  };

  // Delete a saved project
  const handleDeleteSavedProject = (id: string) => {
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  };

  // Add calculated builder element to active kitchen project
  const handleAddBuilderToKitchen = () => {
    const newEl: KitchenElementItem = {
      ...builderForm,
      id: `k-el-${Date.now()}`
    };
    setKitchenElements(prev => [...prev, newEl]);
    setActiveTab('kitchen-project');
  };

  // Handle adding new custom material
  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    const newId = `mat-custom-${Date.now()}`;
    const newMat: WeightMaterial = {
      id: newId,
      name: newMatName.trim(),
      thicknessMm: Number(newMatThickness) || 18,
      weightPerM2: Number(newMatWeight) || 10.5,
      category: newMatCategory,
      isCustom: true
    };
    setMaterials(prev => [...prev, newMat]);
    setNewMatName('');
  };

  // Delete material
  const handleDeleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // Toggle production completion status for all displayed elements
  const handleToggleSelectAll = (completed: boolean) => {
    setKitchenElements(prev => prev.map(el => {
      if (filterPosition === 'all' || el.position === filterPosition) {
        return { ...el, isCompleted: completed };
      }
      return el;
    }));
  };

  // Generate Viber Shareable Text
  const handleShareReport = () => {
    let text = `📦 *KUZHINA LOGJISTIKË & PESHA*\n`;
    text += `🔑 Kodi: ${kitchenCode}\n`;
    text += `👤 Klienti: ${kitchenName}\n`;
    text += `⚖️ Pesha Totale: *${projectSummary.grandTotalKg} KG*\n`;
    text += `🚚 Paleta Euro (80x120cm): *${palletSummary.length} Paleta*\n`;
    text += `----------------------------------------\n\n`;

    palletSummary.forEach(p => {
      text += `🚛 *PALETA ${p.palletNumber} (80x120 cm)* - *${p.totalKg.toFixed(1)} KG*\n`;
      p.elements.forEach(item => {
        text += ` • ${item.element.name} (${item.element.widthMm}x${item.element.heightMm}x${item.element.depthMm}mm) x${item.element.quantity} = ${item.lineKg} kg\n`;
      });
      text += `\n`;
    });

    if (navigator.share) {
      navigator.share({
        title: `Raporti i Peshës - ${kitchenCode}`,
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Raporti u kopjua! Mund ta dërgoni me Viber / WhatsApp.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      
      {/* 
        ===================================================================
        1. PRINT-ONLY CLEAN LOGISTICS & WEIGHT MANIFEST (HIDDEN ON SCREEN)
        ===================================================================
      */}
      <div className="hidden print:block font-sans text-black bg-white p-6 leading-tight space-y-6">
        
        {/* Header */}
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">FLETA E PAKETIMIT DHE LOGJISTIKËS SË KUZHINËS</h1>
            <p className="text-xs text-gray-600 mt-1 font-bold">Llogaritësi Zyrtar i Peshave, Moduleve dhe Paletave (Euro 80x120 cm)</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p className="font-bold">Data: {new Date().toLocaleDateString('sq-AL')}</p>
            <p className="text-sm font-black mt-1">Kodi: {kitchenCode}</p>
          </div>
        </div>

        {/* Project Info Bar */}
        <div className="grid grid-cols-3 gap-4 bg-gray-100 p-3 rounded border border-gray-300 text-xs font-mono">
          <div>
            <span className="text-gray-600 block text-[10px] uppercase font-bold">Klienti / Projekti:</span>
            <strong className="text-sm text-black">{kitchenName}</strong>
          </div>
          <div>
            <span className="text-gray-600 block text-[10px] uppercase font-bold">Gjithsej Elemente:</span>
            <strong className="text-sm text-black">{projectSummary.totalItemsCount} copë</strong>
          </div>
          <div className="text-right">
            <span className="text-gray-600 block text-[10px] uppercase font-bold">PESHA TOTALE:</span>
            <strong className="text-lg font-black text-black">{projectSummary.grandTotalKg} KG</strong>
          </div>
        </div>

        {/* Elements Main Table */}
        <div>
          <h2 className="text-xs font-black uppercase mb-2 border-b border-black pb-1">1. Lista e Moduleve dhe Peshave</h2>
          <table className="w-full text-left text-[11px] border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200 border-b border-gray-400 font-bold uppercase text-[9px]">
                <th className="border border-gray-400 p-1.5 text-center">#</th>
                <th className="border border-gray-400 p-1.5">Pozicioni</th>
                <th className="border border-gray-400 p-1.5">Emri i Modulit</th>
                <th className="border border-gray-400 p-1.5 text-center">WxHxD (mm)</th>
                <th className="border border-gray-400 p-1.5 text-center">Sasi</th>
                <th className="border border-gray-400 p-1.5 text-right">Pesha Njësi</th>
                <th className="border border-gray-400 p-1.5 text-right">Pesha Totale</th>
                <th className="border border-gray-400 p-1.5 text-center">Paleta (80x120)</th>
              </tr>
            </thead>
            <tbody>
              {kitchenElements.map((el, idx) => {
                const breakdown = calculateElementBreakdown(el);
                return (
                  <tr key={el.id} className="border-b border-gray-300">
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-gray-300 p-1.5 font-bold">{getPositionShortLabel(el.position)}</td>
                    <td className="border border-gray-300 p-1.5 font-bold">{el.name}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{el.widthMm}x{el.heightMm}x{el.depthMm}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-bold">{el.quantity}</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono">{breakdown.finalUnitKg} kg</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono font-bold">{breakdown.totalLineKg} kg</td>
                    <td className="border border-gray-300 p-1.5 text-center font-bold">Paleta #{el.palletNumber || 1}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pallets Breakdown Section */}
        <div>
          <h2 className="text-xs font-black uppercase mb-2 border-b border-black pb-1">2. Ndarja sipas Paletave (80 x 120 cm)</h2>
          <div className="grid grid-cols-2 gap-4">
            {palletSummary.map(p => (
              <div key={p.palletNumber} className="border border-gray-400 p-2.5 rounded bg-gray-50 text-[10px]">
                <div className="flex justify-between items-center font-bold border-b border-gray-300 pb-1 mb-1">
                  <span>PALETA #{p.palletNumber} (80x120 cm)</span>
                  <span className="font-mono text-xs">{p.totalKg.toFixed(1)} KG</span>
                </div>
                <ul className="space-y-0.5 font-mono text-gray-700">
                  {p.elements.map(item => (
                    <li key={item.element.id}>
                      • {item.element.name} ({item.element.quantity}x) - {item.lineKg} kg
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Material Breakdown Table */}
        <div>
          <h2 className="text-xs font-black uppercase mb-2 border-b border-black pb-1">3. Ndarja sipas Materialit dhe Përqindjes</h2>
          <table className="w-full text-left text-[10px] border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200 font-bold uppercase">
                <th className="border border-gray-400 p-1">Materiali</th>
                <th className="border border-gray-400 p-1 text-right">Sipërfaqja (m²)</th>
                <th className="border border-gray-400 p-1 text-right">Pesha (KG)</th>
                <th className="border border-gray-400 p-1 text-right">Përqindja</th>
              </tr>
            </thead>
            <tbody>
              {projectSummary.materialBreakdownList.map((m, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 p-1 font-bold">{m.materialName}</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">~{m.areaM2} m²</td>
                  <td className="border border-gray-300 p-1 text-right font-mono font-bold">{m.totalKg} kg</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{m.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 pt-6 text-[10px] text-center border-t border-gray-400">
          <div>
            <p className="border-b border-black mb-1 pb-4"></p>
            <p className="font-bold">Përgjegjësi i Prodhimat</p>
          </div>
          <div>
            <p className="border-b border-black mb-1 pb-4"></p>
            <p className="font-bold">Shoferi / Transporti</p>
          </div>
          <div>
            <p className="border-b border-black mb-1 pb-4"></p>
            <p className="font-bold">Pranoi Klienti</p>
          </div>
        </div>

      </div>

      {/* 
        ===================================================================
        2. INTERACTIVE SCREEN APP UI (HIDDEN ON PRINT)
        ===================================================================
      */}
      {!isStarted ? (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 print:hidden">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-10 rounded-3xl border-2 border-amber-500/80 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 border-b border-indigo-900/60 pb-6">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-2xl text-slate-950 font-black shadow-lg">
                <Scale className="w-10 h-10" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                  HAPI 1 • KODI & KLIENTI I KUZHINËS
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                  PESHA TOTALE PËR KUZHINA & PALETAT
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
                  Shënoni Kodin e Kuzhinës dhe Emrin e Klientit / Për Ku Është, më pas klikoni <strong>"VAZHDO TEK LISTA E ELEMENTEVE ➔"</strong> për të parë elementet me pesha automatike dhe shpërndarjen në paleta.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-amber-400" /> Kodi i Kuzhinës:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const randomCode = `KUZ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
                      setKitchenCode(randomCode);
                    }}
                    className="text-[11px] text-indigo-300 hover:text-white underline font-mono cursor-pointer"
                  >
                    🎲 Gjenero Kod Automatik
                  </button>
                </label>
                <input 
                  type="text"
                  value={kitchenCode}
                  onChange={(e) => setKitchenCode(e.target.value)}
                  placeholder="e.g. KUZ-2026-001"
                  className="w-full bg-slate-950 border-2 border-indigo-700/80 rounded-2xl px-4 py-3 text-amber-300 font-mono font-black text-base outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-200 mb-2">
                  Emri / Klienti / Për Ku Është Kuzhina:
                </label>
                <input 
                  type="text"
                  value={kitchenName}
                  onChange={(e) => setKitchenName(e.target.value)}
                  placeholder="e.g. Agim Hoxha - Prishtinë (Vllahi)"
                  className="w-full bg-slate-950 border-2 border-indigo-700/80 rounded-2xl px-4 py-3 text-white font-black text-base outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 shadow-inner"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                ⚡ Do të vazhdoni te lista e elementeve dhe llogaritja e peshës së kuzhinës.
              </div>

              <button
                type="button"
                onClick={() => setIsStarted(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" /> VAZHDO TEK LISTA E ELEMENTEVE ➔
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto space-y-6 print:hidden">
        
        {/* APP TITLE & TOP HEADER */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-2xl shadow-lg text-slate-950 font-black">
                <Scale className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  LLOGARITËSI I PESHOJAVE TË KUZHINËS & PALETAT
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Sistemi automatik i llogaritjes së peshave dhe organizimit në paleta.
                </p>
              </div>
            </div>

            {/* Quick Actions Header Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsPalletModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-105"
              >
                <Truck className="w-4 h-4 text-emerald-200" /> 📦 Shiko Paletat ({customPallets.length})
              </button>

              <button
                onClick={handleSaveCurrentProject}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-indigo-200" /> Ruaj Projektin
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" /> Printo Peshën
              </button>
            </div>
          </div>

          {/* PROJECT SUMMARY INFO BADGES */}
          <div className="pt-3 border-t border-indigo-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-slate-950 border border-indigo-900/80 rounded-xl text-slate-300 font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Kodi: <strong className="text-amber-300 font-mono font-bold">{kitchenCode}</strong>
              </span>

              <span className="px-3 py-1 bg-slate-950 border border-indigo-900/80 rounded-xl text-slate-300 font-medium flex items-center gap-1.5">
                👤 Klienti / Për Ku: <strong className="text-white font-bold">{kitchenName}</strong>
              </span>

              <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 font-medium flex items-center gap-1.5">
                ⚖️ Pesha Totale: <strong className="text-emerald-400 font-mono font-black">{projectSummary.grandTotalKg} KG</strong> ({projectSummary.totalItemsCount} elemente)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsStarted(false)}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center gap-1"
              title="Kthehu prapa për të ndryshuar Kodin ose Klientin"
            >
              ✏️ Ndrysho Kodin / Klientin
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS BAR */}
        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-indigo-900/60 shadow-xl overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            
            <button
              onClick={() => setActiveTab('kitchen-project')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'kitchen-project'
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-slate-950 shadow-lg scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Lista e Elementeve ({kitchenElements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-4 h-4 text-indigo-300" />
              <span>Ndërtuesi i Modulit</span>
            </button>

            <button
              onClick={() => setActiveTab('materials-db')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'materials-db'
                  ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 text-amber-300" />
              <span>Baza e Materialeve ({materials.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('saved-projects')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'saved-projects'
                  ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-cyan-200" />
              <span>Projekte të Ruajtura ({savedProjects.length})</span>
            </button>

          </div>
        </div>

        {/* TAB 1: KITCHEN ELEMENTS & WEIGHT SUMMARY */}
        {activeTab === 'kitchen-project' && (
          <div className="space-y-6">
            
            {/* Top Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Grand Total Weight Card */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 rounded-3xl border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                    ⚖️ PESHA TOTALE E KUZHINËS
                  </span>
                  <Scale className="w-6 h-6 text-amber-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono tracking-tight">
                    {projectSummary.grandTotalKg}
                  </span>
                  <span className="text-lg font-black text-amber-400">KG</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {projectSummary.totalItemsCount} copë gjithsej në kuzhinë
                </p>
              </div>

              {/* Euro Pallets Logistics Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-3xl border border-emerald-500/40 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> Paletat Euro (80x120 cm)
                  </span>
                  <button 
                    onClick={() => setIsPalletModalOpen(true)}
                    className="text-[10px] text-emerald-300 hover:underline font-bold"
                  >
                    Detajet &rarr;
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono">{palletSummary.length}</span>
                  <span className="text-xs text-emerald-300 font-bold">Paleta Euro</span>
                </div>
                <button
                  onClick={() => handleAutoDistributePallets(350)}
                  className="w-full py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" /> Auto-Shpërndaj në Paleta (Max 350kg)
                </button>
              </div>

              {/* Production Progress Card */}
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-300 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" /> Prodhimi i Kryer
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {projectSummary.completedItemsCount} / {projectSummary.totalItemsCount}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-indigo-900/80">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                    style={{ 
                      width: `${projectSummary.totalItemsCount > 0 ? (projectSummary.completedItemsCount / projectSummary.totalItemsCount) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Përqindja: <strong className="text-white font-mono">{projectSummary.totalItemsCount > 0 ? Math.round((projectSummary.completedItemsCount / projectSummary.totalItemsCount) * 100) : 0}%</strong></span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleSelectAll(true)} className="text-[10px] text-emerald-400 hover:underline font-bold">Kompleto</button>
                    <span>|</span>
                    <button onClick={() => handleToggleSelectAll(false)} className="text-[10px] text-amber-400 hover:underline font-bold">Reseto</button>
                  </div>
                </div>
              </div>

            </div>

            {/* CATEGORY FILTER & FRONT THICKNESS CONTROLS & KITCHEN ELEMENTS WORKSPACE */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-6">
              
              {/* Quick Workspace Actions */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-400" /> Lista e Elementeve të Projekti:
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Shtoni, ndryshoni përmasat apo trashësinë e fronteve (19mm / 22mm) për çdo modul.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Clear Empty List Button */}
                  <button
                    onClick={handleClearKitchenElements}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    title="Pastron listën për të filluar me listë të zbrazët"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Pastro Listën (Zbraz)
                  </button>
                </div>
              </div>

              {/* 2-COLUMN SPLIT: LEFT SEARCH & CATALOG DRAWER | RIGHT MAIN PROJECT ELEMENTS LIST */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* LEFT SIDEBAR: SEARCH & PRESET CATALOG WITH WEIGHTS */}
                <div className="xl:col-span-1 bg-slate-950 p-4 rounded-3xl border border-indigo-900/80 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-amber-400" /> Kërko Elementet me Pesha
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Katalogu standard i elementeve me pesha automatike.
                      </p>
                    </div>

                    {/* Quick Add Door / Element Button */}
                    <button
                      type="button"
                      onClick={() => setIsQuickElementModalOpen(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95"
                    >
                      <Zap className="w-4 h-4 text-slate-950" /> ⚡ Shto Derë / Element të Shpejtë
                    </button>

                    {/* Search Input Box */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        placeholder="Kërko (Baza 60, Pezull 80, Fioka...)"
                        value={catalogSearchQuery}
                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-indigo-900/80 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-all font-medium"
                      />
                      {catalogSearchQuery && (
                        <button 
                          onClick={() => setCatalogSearchQuery('')}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1">
                      {(['all', 'Poshtë (Baza)', 'Lart (Pezull)', 'Kolonë (Spajz)', 'Fioka'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCatalogCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                            catalogCategoryFilter === cat ? 'bg-amber-400 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-indigo-900/40'
                          }`}
                        >
                          {cat === 'all' ? 'Të Gjitha' : cat}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable Catalog Preset Items */}
                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {presetCatalog.filter(item => {
                        const itemCatLabel = getAlbanianCategoryLabel(item.position, item.categoryLabel);
                        const matchesQuery = item.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) || 
                          `${item.widthMm}x${item.heightMm}`.includes(catalogSearchQuery);
                        const matchesCat = catalogCategoryFilter === 'all' || itemCatLabel === catalogCategoryFilter;
                        return matchesQuery && matchesCat;
                      }).map(preset => {
                        const displayCat = getAlbanianCategoryLabel(preset.position, preset.categoryLabel);
                        return (
                          <div 
                            key={preset.id}
                            className="p-3 bg-slate-900/90 rounded-2xl border border-indigo-900/60 hover:border-amber-400/80 transition-all shadow-md space-y-2 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-xs text-white block group-hover:text-amber-300 transition-colors">
                                    {preset.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 text-[9px] font-black text-amber-300 bg-amber-950/80 border border-amber-800/60 rounded">
                                    {displayCat}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                  {preset.widthMm} × {preset.heightMm} × {preset.depthMm} mm
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-mono text-[10px] font-black">
                                  ~{preset.approxKg} kg
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPresetCatalog(prev => prev.filter(p => p.id !== preset.id));
                                  }}
                                  className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 bg-rose-950/60 rounded-lg border border-rose-800/80 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
                                  title="Fshij nga katalogu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Quick Add Buttons */}
                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-indigo-900/40">
                              <button
                                onClick={() => handleAddPresetToKitchenElements(preset)}
                                className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3 text-amber-400" /> Shto në Listë
                              </button>

                              {/* Direct Pallet Selector Buttons */}
                              <div className="flex items-center gap-1">
                                {customPallets.map(pNo => (
                                  <button
                                    key={pNo}
                                    onClick={() => handleAddPresetToKitchenElements(preset, pNo)}
                                    className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                                    title={`Shto drejtpërdrejt te Paleta #${pNo}`}
                                  >
                                  +P#{pNo}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-900/50 text-[10px] text-slate-500 font-medium text-center">
                    Gjithsej {presetCatalog.length} modele me pesha automatike
                  </div>
                </div>

                {/* RIGHT MAIN WORKSPACE: KITCHEN ELEMENTS LIST */}
                <div className="xl:col-span-3 space-y-4">
                  
                  {/* Table Header Controls & Filter Buttons */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-indigo-900/40 pb-4">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Box className="w-5 h-5 text-amber-400" /> Lista e Elementeve të këtij Projekti
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Kodi: <strong className="text-amber-300">{kitchenCode}</strong> | {kitchenElements.length} element(e) gjithsej
                      </p>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-indigo-900/80 w-full lg:w-auto">
                      <button
                        onClick={() => setFilterPosition('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                          filterPosition === 'all'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Të Gjitha ({kitchenElements.length})</span>
                      </button>

                      <button
                        onClick={() => setFilterPosition('lart')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                          filterPosition === 'lart'
                            ? 'bg-amber-500 text-slate-950 font-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span>Lart ({projectSummary.wallElements.length})</span>
                      </button>

                      <button
                        onClick={() => setFilterPosition('posht')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                          filterPosition === 'posht'
                            ? 'bg-emerald-500 text-white font-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Poshtë ({projectSummary.baseElements.length})</span>
                      </button>

                      <button
                        onClick={() => setFilterPosition('kolone')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                          filterPosition === 'kolone'
                            ? 'bg-purple-600 text-white font-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Columns3 className="w-3.5 h-3.5 text-purple-300" />
                        <span>Kolonat ({projectSummary.columnElements.length})</span>
                      </button>

                      <button
                        onClick={() => setFilterPosition('raft_lart')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                          filterPosition === 'raft_lart'
                            ? 'bg-cyan-600 text-white font-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Raftat ({projectSummary.wallShelfElements.length})</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShareReport}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Viber / Raport
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white font-black text-xs rounded-xl border border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Printo
                      </button>
                    </div>

                  </div>

                  {/* Elements Table OR Empty State */}
                  {displayedElements.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-indigo-900/60 bg-slate-950/40">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="bg-slate-950 text-indigo-300 font-black uppercase text-[10px] tracking-wider border-b border-indigo-900/60">
                            <th className="p-3 text-center">Prodhimi</th>
                            <th className="p-3">Kategoria</th>
                            <th className="p-3">Emri i Modulit</th>
                            <th className="p-3">Përmasat WxHxD (mm)</th>
                            <th className="p-3">Rafte & Dyer</th>
                            <th className="p-3 text-center">Fronti (19mm / 22mm)</th>
                            <th className="p-3 text-center">Paleta (Zgjidh Paletën 1, 2, 3)</th>
                            <th className="p-3 text-center">Sasi</th>
                            <th className="p-3 text-right">Pesha per Njësi</th>
                            <th className="p-3 text-right">Pesha Totale</th>
                            <th className="p-3 text-center">Veprime</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-900/40 font-medium">
                          {displayedElements.map((el) => {
                            const breakdown = calculateElementBreakdown(el);
                            const unitKg = breakdown.finalUnitKg;
                            const lineKg = breakdown.totalLineKg;
                            const palletNo = el.palletNumber || 1;

                            return (
                              <React.Fragment key={el.id}>
                                <tr 
                                  className={`transition-colors ${el.isCompleted ? 'bg-emerald-950/20' : 'hover:bg-indigo-950/40'}`}
                                >
                                {/* Checkbox for Production Status */}
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => {
                                      setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, isCompleted: !x.isCompleted } : x));
                                    }}
                                    className="cursor-pointer focus:outline-none"
                                    title={el.isCompleted ? 'Kompletuar në Prodhim' : 'Kliko për ta marrë në Prodhim'}
                                  >
                                    {el.isCompleted ? (
                                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-600 hover:text-amber-400" />
                                    )}
                                  </button>
                                </td>

                                {/* Position Switcher */}
                                <td className="p-3">
                                  <select
                                    value={el.position}
                                    onChange={(e) => {
                                      const val = e.target.value as ElementPosition;
                                      setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, position: val } : x));
                                    }}
                                    className={`text-[10px] font-black uppercase px-2 py-1 rounded border outline-none cursor-pointer ${getPositionBadgeColor(el.position)}`}
                                  >
                                    <option value="lart">Lart (Vise)</option>
                                    <option value="posht">Poshtë (Baza)</option>
                                    <option value="kolone">Kolonë (Shpajz)</option>
                                    <option value="raft_lart">Raft Lart</option>
                                    <option value="raft_posht">Raft Poshtë</option>
                                  </select>
                                </td>

                                {/* Element Name editable */}
                                <td className="p-3">
                                  <input 
                                    type="text"
                                    value={el.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, name: val } : x));
                                    }}
                                    className="bg-transparent text-white font-black text-xs outline-none focus:border-b focus:border-amber-400 w-full"
                                  />
                                </td>

                                {/* Element W x H x D (mm) editable */}
                                <td className="p-3 font-mono text-amber-300 font-bold">
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="number" 
                                      value={el.widthMm}
                                      onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, widthMm: Number(e.target.value) } : x))}
                                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[11px]"
                                    />
                                    <span>x</span>
                                    <input 
                                      type="number" 
                                      value={el.heightMm}
                                      onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, heightMm: Number(e.target.value) } : x))}
                                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[11px]"
                                    />
                                    <span>x</span>
                                    <input 
                                      type="number" 
                                      value={el.depthMm}
                                      onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, depthMm: Number(e.target.value) } : x))}
                                      className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[11px]"
                                    />
                                  </div>
                                </td>

                                {/* Shelves & Doors Summary */}
                                <td className="p-3 text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 font-mono">Rafte: <strong className="text-white">{el.numShelves}</strong></span>
                                    <span className="text-slate-400 font-mono">Dyer: <strong className="text-white">{el.numDoors}</strong></span>
                                  </div>
                                </td>

                                {/* Front Thickness Selector (19mm vs 22mm) */}
                                <td className="p-3 text-center">
                                  {el.numDoors > 0 ? (
                                    <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-900/80 shadow-inner">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, doorMaterialId: 'mat-mdf-19' } : x));
                                        }}
                                        className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                          el.doorMaterialId === 'mat-mdf-19' || el.doorMaterialId === 'mat-iv-18'
                                            ? 'bg-indigo-600 text-white font-black shadow border border-indigo-400'
                                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                        }`}
                                        title="Kalo frontin në 19mm"
                                      >
                                        19mm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, doorMaterialId: 'mat-mdf-22' } : x));
                                        }}
                                        className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                          el.doorMaterialId === 'mat-mdf-22' || el.doorMaterialId === 'mat-iv-22'
                                            ? 'bg-purple-600 text-white font-black shadow border border-purple-400'
                                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                        }`}
                                        title="Kalo frontin në 22mm"
                                      >
                                        22mm
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono italic">- Pa dyer</span>
                                  )}
                                </td>

                                {/* Pallet Selector Pill Group */}
                                <td className="p-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1">
                                      {customPallets.map(pNo => (
                                        <button
                                          key={pNo}
                                          onClick={() => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, palletNumber: pNo } : x))}
                                          className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                            (el.palletNumber || 1) === pNo
                                              ? 'bg-emerald-500 text-slate-950 font-black shadow border border-emerald-400'
                                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                          }`}
                                        >
                                          P#{pNo}
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => setActivePalletModal(el.palletNumber || 1)}
                                      className="text-[9px] text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
                                    >
                                      <Eye className="w-3 h-3" /> Futem ne Paletë #{el.palletNumber || 1}
                                    </button>
                                  </div>
                                </td>

                                {/* Quantity */}
                                <td className="p-3 text-center">
                                  <div className="inline-flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-indigo-900">
                                    <button
                                      onClick={() => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}
                                      className="text-slate-400 hover:text-white font-bold px-1"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono font-black text-white text-xs px-1">{el.quantity}</span>
                                    <button
                                      onClick={() => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, quantity: x.quantity + 1 } : x))}
                                      className="text-slate-400 hover:text-white font-bold px-1"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Calculated Unit Weight */}
                                <td className="p-3 text-right font-mono font-bold text-slate-200">
                                  {unitKg} kg
                                </td>

                                {/* Total Line Weight */}
                                <td className="p-3 text-right font-mono font-black text-amber-300 text-sm">
                                  {lineKg} kg
                                </td>

                                {/* Action Buttons */}
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setExpandedElementId(expandedElementId === el.id ? null : el.id)}
                                      className={`p-1 rounded transition-colors cursor-pointer ${expandedElementId === el.id ? 'bg-amber-400 text-slate-950 font-bold' : 'text-amber-400 hover:text-white hover:bg-slate-800'}`}
                                      title="Shiko detajet e modulit / anësoret, rafte, dyer & peshën"
                                    >
                                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedElementId === el.id ? 'rotate-180' : ''}`} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const copyEl = {
                                          ...el,
                                          id: `k-el-${Date.now()}`,
                                          name: `${el.name} (Kopje)`
                                        };
                                        setKitchenElements(prev => [...prev, copyEl]);
                                      }}
                                      className="p-1 text-indigo-400 hover:text-white cursor-pointer"
                                      title="Dupliko elementin"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setKitchenElements(prev => prev.filter(x => x.id !== el.id))}
                                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                                      title="Fshij elementin"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedElementId === el.id && (
                                <tr key={`${el.id}-details`} className="bg-slate-950/90 border-b border-indigo-900/60">
                                  <td colSpan={11} className="p-4">
                                    <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-3">
                                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                        <span className="font-black text-amber-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
                                          🔍 Specifikimi Teknik & Detajet e Modulit: <strong>{el.name}</strong>
                                        </span>
                                        <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded-full font-mono text-slate-300 border border-slate-800">
                                          ID: {el.id}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Kategoria e Modulit:</span>
                                          <strong className="text-white capitalize">
                                            {el.position === 'kolone' ? 'Kolonë (Shpajz / Tall)' : el.position === 'lart' ? 'Lart (Vise)' : el.position === 'posht' ? 'Poshtë (Baza)' : el.position}
                                          </strong>
                                        </div>

                                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Përmasat e Modulit:</span>
                                          <strong className="text-amber-300 font-mono">
                                            W: {el.widthMm}mm × H: {el.heightMm}mm × D: {el.depthMm}mm
                                          </strong>
                                        </div>

                                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Korpusi & Anësoret:</span>
                                          <strong className="text-white">
                                            {el.carcaseMaterialId === 'mat-iv-22' ? '22 mm (Ivericë)' : '18 mm (Ivericë Standarde)'}
                                          </strong>
                                        </div>

                                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Shpina HDF 3mm:</span>
                                          <strong className={el.hasBacking ? 'text-emerald-400' : 'text-slate-500'}>
                                            {el.hasBacking ? 'Po (HDF 3mm Shpinë)' : 'Jo (Pa Shpinë)'}
                                          </strong>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {/* Shelves detail */}
                                        <div className="bg-slate-950 p-3 rounded-xl border border-indigo-900/50">
                                          <span className="text-[10px] uppercase font-black text-indigo-300 block mb-1">📐 Raftat e Brendshëm:</span>
                                          <p className="text-slate-300 font-medium">
                                            {el.numShelves === 0 
                                              ? 'Jo Raft (Modul me hapësirë krejtësisht bosh)' 
                                              : el.customShelves && el.customShelves.length > 0
                                              ? `${el.numShelves} Raft/a: ${el.customShelves.map((s, idx) => `Rafti ${idx + 1}: ${s.widthMm ?? Math.max(10, el.widthMm - 36)} × ${s.depthMm ?? Math.max(10, el.depthMm - 20)} mm`).join(' | ')}`
                                              : `${el.numShelves} Raft/a me përmasa saktësisht ${el.shelfWidthMm || Math.max(10, el.widthMm - 36)} mm (gjerësi) × ${el.shelfDepthMm || Math.max(10, el.depthMm - 20)} mm (thellësi)`
                                            }
                                          </p>
                                        </div>

                                        {/* Doors detail */}
                                        <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30">
                                          <span className="text-[10px] uppercase font-black text-amber-300 block mb-1">🚪 Dyer dhe Frontat:</span>
                                          <p className="text-slate-300 font-medium">
                                            {el.numDoors === 0 ? (
                                              'Pa Derë (Modul me kornizë të hapur)'
                                            ) : el.numDoors === 1 ? (
                                              `1 Derë (${el.doorWidthMm || Math.max(100, el.widthMm - 3)} mm × ${el.doorHeightMm || Math.max(100, el.heightMm - 4)} mm) - Trashësia: ${el.doorMaterialId === 'mat-mdf-22' ? '22 mm' : '19 mm'}`
                                            ) : (
                                              `2 Dyer: Dera 1 (${el.customDoors?.[0]?.widthMm || Math.floor(el.widthMm/2)-3} × ${el.customDoors?.[0]?.heightMm || Math.max(100, el.heightMm-4)} mm) | Dera 2 (${el.customDoors?.[1]?.widthMm || Math.floor(el.widthMm/2)-3} × ${el.customDoors?.[1]?.heightMm || Math.max(100, el.heightMm-4)} mm)`
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Weight Calculation Formula Breakdown */}
                                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-slate-400 font-mono text-[11px]">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <span>Korpusi: <strong className="text-white">{breakdown.carcaseKg.toFixed(1)} kg</strong></span>
                                          <span>•</span>
                                          <span>Raftat: <strong className="text-white">{breakdown.shelvesKg.toFixed(1)} kg</strong></span>
                                          <span>•</span>
                                          <span>Dyer: <strong className="text-white">{breakdown.doorsKg.toFixed(1)} kg</strong></span>
                                          <span>•</span>
                                          <span>Shpina: <strong className="text-white">{breakdown.backingKg.toFixed(1)} kg</strong></span>
                                          <span>•</span>
                                          <span>Mekanizmat: <strong className="text-white">{breakdown.hardwareKg.toFixed(1)} kg</strong></span>
                                        </div>
                                        <div className="text-right font-black text-amber-300">
                                          Sasia: {el.quantity}x = <span className="text-sm font-black text-emerald-400">{lineKg} KG</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* EMPTY STATE WHEN LIST IS CLEARED OR EMPTY */
                    <div className="bg-slate-950/90 p-12 rounded-3xl border-2 border-dashed border-indigo-900/80 text-center space-y-4 shadow-2xl">
                      <div className="w-16 h-16 bg-indigo-950/80 rounded-2xl border border-indigo-700 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
                        <Box className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base sm:text-lg font-black text-white">
                          Lista e këtij projekti është e zbrazët!
                        </h4>
                        <p className="text-xs text-slate-400 max-w-lg mx-auto font-medium">
                          Kërkoni ose klikoni mbi elementet në katalogun anësor për t'i shtuar këtu me pesha automatike dhe për t'i ndarë lehtësisht në Paleta 1, 2, 3 sipas dëshirës.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        {PRESET_CATALOG_ITEMS.slice(0, 4).map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => handleAddPresetToKitchenElements(preset)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-950 border border-indigo-800 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-400" /> + {preset.name} (~{preset.approxKg}kg)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PALLETS LOGISTICS MANAGEMENT (PHOTO 3 STUDIO MATCHING VIEW) */}
        {activeTab === 'pallets-view' && (() => {
          const activePNo = selectedStudioPallet || 1;
          const palletEls = kitchenElements.filter(el => (el.palletNumber || 1) === activePNo);
          const totalPalletKg = palletEls.reduce((sum, el) => sum + calculateElementBreakdown(el).totalLineKg, 0);
          
          // Footprint math (Euro 1.2m x 0.8m = 0.96m², American 1.2m x 1.0m = 1.2m²)
          const floorAreaM2 = studioPalletType === 'euro' ? 0.96 : 1.20;
          const usedFloorM2 = palletEls.reduce((sum, el) => sum + ((el.widthMm / 1000) * (el.depthMm / 1000) * el.quantity), 0);
          const areaPercentage = Math.min(100, Math.round((usedFloorM2 / floorAreaM2) * 100));
          const remainingPercentage = Math.max(0, 100 - areaPercentage);

          return (
            <div className="space-y-6">
              
              {/* TOP HEADER BANNER (Photo 3 Header matching) */}
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-950 rounded-2xl border border-emerald-800 text-emerald-400">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      Pallet: <span className="text-amber-400 font-mono">
                        {studioPalletType === 'euro' ? 'EPAL 1200 × 800 mm' : 'American Pallet 1200 × 1000 mm'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Kodi: <strong className="text-amber-300">{kitchenCode}</strong> | Klienti: <strong className="text-white">{kitchenName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNewPallet}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> + Shto Paletë e Re
                  </button>
                  <button
                    onClick={() => handleAutoDistributePallets(350)}
                    className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" /> Auto-Shpërndaj (Max 350kg)
                  </button>
                </div>
              </div>

              {/* PHOTO 3: 3-COLUMN WORKSPACE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMN 1: PALLET TYPES & PALLET SELECTOR (Left 3 cols) */}
                <div className="lg:col-span-3 bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 space-y-5 shadow-2xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-indigo-900/40 pb-2">
                      Pallet Types
                    </h4>

                    {/* Card 1: Euro Pallet */}
                    <div 
                      onClick={() => setStudioPalletType('euro')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                        studioPalletType === 'euro' 
                          ? 'bg-indigo-950/70 border-amber-400 shadow-xl' 
                          : 'bg-slate-950 border-indigo-900/50 hover:border-indigo-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white">Euro Pallet</span>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">1200 × 800 mm</span>
                      </div>
                      
                      {/* Realistic 3D EPAL Wooden Pallet Graphic */}
                      <div className="h-20 bg-amber-950/30 rounded-xl border border-amber-900/40 flex items-center justify-center p-2 relative overflow-hidden">
                        <div className="w-full space-y-1">
                          <div className="h-2.5 bg-amber-800/80 rounded border border-amber-600/60 shadow-sm flex items-center justify-between px-2 text-[8px] font-black font-mono text-amber-200">
                            <span>EPAL</span> <span>1200mm</span>
                          </div>
                          <div className="h-2.5 bg-amber-800/80 rounded border border-amber-600/60 shadow-sm" />
                          <div className="h-2.5 bg-amber-800/80 rounded border border-amber-600/60 shadow-sm" />
                          <div className="flex justify-between px-2 pt-0.5">
                            <div className="w-4 h-2 bg-amber-900 rounded border border-amber-700" />
                            <div className="w-4 h-2 bg-amber-900 rounded border border-amber-700" />
                            <div className="w-4 h-2 bg-amber-900 rounded border border-amber-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: American Pallet */}
                    <div 
                      onClick={() => setStudioPalletType('american')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                        studioPalletType === 'american' 
                          ? 'bg-indigo-950/70 border-amber-400 shadow-xl' 
                          : 'bg-slate-950 border-indigo-900/50 hover:border-indigo-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white">American Pallet</span>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">1200 × 1000 mm</span>
                      </div>
                      
                      {/* Realistic 3D American Wooden Pallet Graphic */}
                      <div className="h-20 bg-amber-950/30 rounded-xl border border-amber-900/40 flex items-center justify-center p-2 relative overflow-hidden">
                        <div className="w-full space-y-1">
                          <div className="h-2.5 bg-amber-800/80 rounded border border-amber-600/60 shadow-sm flex items-center justify-between px-2 text-[8px] font-black font-mono text-amber-200">
                            <span>USA</span> <span>1200mm</span>
                          </div>
                          <div className="h-2.5 bg-amber-800/80 rounded border border-amber-600/60 shadow-sm" />
                          <div className="h-2.5 bg-amber-800/80 rounded border border-amber-600/60 shadow-sm" />
                          <div className="flex justify-between px-2 pt-0.5">
                            <div className="w-5 h-2 bg-amber-900 rounded border border-amber-700" />
                            <div className="w-5 h-2 bg-amber-900 rounded border border-amber-700" />
                            <div className="w-5 h-2 bg-amber-900 rounded border border-amber-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Pallet Selector List */}
                    <div className="space-y-2 pt-2 border-t border-indigo-900/40">
                      <span className="text-[11px] font-black uppercase text-indigo-300 block">
                        Zgjidh Paletën për me redaktu:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {customPallets.map(pNo => {
                          const pElsCount = kitchenElements.filter(x => (x.palletNumber || 1) === pNo).length;
                          return (
                            <button
                              key={pNo}
                              onClick={() => setSelectedStudioPallet(pNo)}
                              className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between border ${
                                selectedStudioPallet === pNo
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg'
                                  : 'bg-slate-950 text-slate-300 border-indigo-900/60 hover:border-amber-400'
                              }`}
                            >
                              <span>Paleta #{pNo}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/60 text-white font-bold">
                                {pElsCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-indigo-900/40">
                    <button
                      onClick={handleAddNewPallet}
                      className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4 text-amber-400" /> + Shto Paletë te Re
                    </button>
                  </div>
                </div>

                {/* COLUMN 2: PALLET VIEW STAGE & BOTTOM DRAWER (Center 6 cols) */}
                <div className="lg:col-span-6 bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 space-y-4 shadow-2xl flex flex-col justify-between">
                  
                  {/* Canvas View Controls Bar */}
                  <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Pallet View (Paleta #{activePNo})
                    </h4>

                    {/* View Controls: 2D View / 3D View / Fit */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-indigo-900/80">
                      <button
                        onClick={() => setStudioViewMode('2D')}
                        className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          studioViewMode === '2D' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        2D View
                      </button>
                      <button
                        onClick={() => setStudioViewMode('3D')}
                        className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          studioViewMode === '3D' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        3D View
                      </button>
                    </div>
                  </div>

                  {/* ISOMETRIC 3D WOODEN PALLET STAGE WITH GREY RECTANGULAR CABINET BOXES */}
                  <div className="relative min-h-[360px] bg-slate-950 rounded-2xl border border-indigo-900/80 flex items-center justify-center p-6 overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b15_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b15_1px,transparent_1px)] bg-[size:24px_24px]" />

                    {/* 3D Wooden Pallet & Placed Boxes Platform */}
                    <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-center">
                      
                      {/* Top Stacked Cabinet Boxes (Kaçat) */}
                      <div className="flex items-end justify-center gap-2 mb-[-8px] z-20">
                        {palletEls.length > 0 ? (
                          palletEls.map((el, idx) => {
                            // Dynamic height scaling for box visuals
                            const hPx = Math.min(130, Math.max(70, el.heightMm / 8));
                            const wPx = Math.min(120, Math.max(55, el.widthMm / 8));

                            return (
                              <div 
                                key={el.id}
                                style={{ height: `${hPx}px`, width: `${wPx}px` }}
                                className="bg-slate-700/90 border-2 border-slate-400 rounded-lg shadow-2xl flex flex-col items-center justify-center p-1 text-center relative group hover:border-amber-400 transition-all cursor-pointer"
                              >
                                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-300" />
                                <span className="text-[10px] font-black text-white leading-tight font-mono drop-shadow">
                                  {el.widthMm} × {el.heightMm}
                                </span>
                                <span className="text-[9px] font-bold text-amber-300 font-mono">
                                  {calculateElementBreakdown(el).totalLineKg} kg
                                </span>
                                <span className="text-[8px] text-slate-300 truncate max-w-full px-1">
                                  {el.name}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-8 text-center space-y-1">
                            <Box className="w-8 h-8 text-slate-600 mx-auto" />
                            <span className="text-xs text-slate-500 font-medium block">
                              Paleta #{activePNo} është bosh. Klikoni mbi elementet më poshtë për t'i shtuar!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* EPAL 3D Wooden Pallet Base Structure */}
                      <div className="w-full bg-amber-950/70 border-2 border-amber-700 rounded-xl p-3 shadow-2xl space-y-1.5">
                        <div className="h-4 bg-amber-800 rounded border border-amber-600 flex items-center justify-between px-3 text-[10px] font-black font-mono text-amber-200">
                          <span>EPAL 80x120 CM</span>
                          <span>MAX 1500 KG</span>
                        </div>
                        <div className="h-3 bg-amber-800 rounded border border-amber-600" />
                        <div className="h-3 bg-amber-800 rounded border border-amber-600" />
                        <div className="flex justify-between px-4 pt-1">
                          <div className="w-8 h-4 bg-amber-900 rounded border border-amber-700" />
                          <div className="w-8 h-4 bg-amber-900 rounded border border-amber-700" />
                          <div className="w-8 h-4 bg-amber-900 rounded border border-amber-700" />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Stage Toolbar (Rotate, Snap, Clear, Optimize) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-indigo-900/60">
                    <div className="flex items-center gap-2">
                      <select
                        value={studioRotateDeg}
                        onChange={(e) => setStudioRotateDeg(Number(e.target.value))}
                        className="bg-slate-900 border border-indigo-900/80 text-white text-xs font-bold rounded-xl px-2.5 py-1 outline-none cursor-pointer"
                      >
                        <option value={0}>Rotate: 0°</option>
                        <option value={90}>Rotate: 90°</option>
                        <option value={180}>Rotate: 180°</option>
                        <option value={270}>Rotate: 270°</option>
                      </select>

                      <button
                        onClick={() => setStudioSnapOn(prev => !prev)}
                        className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                          studioSnapOn ? 'bg-indigo-950 text-indigo-300 border-indigo-700' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        Snap: {studioSnapOn ? 'On' : 'Off'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setKitchenElements(prev => prev.map(x => (x.palletNumber || 1) === activePNo ? { ...x, palletNumber: 2 } : x));
                        }}
                        className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Clear Pallet
                      </button>

                      <button
                        onClick={() => handleAutoDistributePallets(350)}
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" /> Optimize Layout
                      </button>
                    </div>
                  </div>

                  {/* BOTTOM "ADD ELEMENTS" CAROUSEL DRAWER (Photo 3 matching) */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                        Add Elements to Pallet #{activePNo}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span>Zgjidh katin ose elementin më poshtë:</span>
                      </div>
                    </div>

                    {/* Horizontal Scroll Carousel of Cabinets */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-900">
                      {PRESET_CATALOG_ITEMS.map(preset => (
                        <div
                          key={preset.id}
                          onClick={() => handleAddPresetToKitchenElements(preset, activePNo)}
                          className="min-w-[140px] bg-slate-900 p-3 rounded-2xl border border-indigo-900/80 hover:border-amber-400 cursor-pointer transition-all shadow space-y-1.5 flex flex-col justify-between group"
                        >
                          <div className="w-full h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-1 group-hover:border-indigo-700">
                            <Box className="w-5 h-5 text-indigo-400 group-hover:text-amber-400 transition-colors" />
                          </div>
                          <div>
                            <span className="font-bold text-[11px] text-white block truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] font-mono text-amber-300 block">
                              {preset.widthMm} × {preset.depthMm} × {preset.heightMm}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-indigo-900/40 text-[10px]">
                            <span className="font-mono text-emerald-400 font-bold">{preset.approxKg} kg</span>
                            <span className="text-amber-400 font-black">+ Shto</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* COLUMN 3: PALLET INFORMATION & ELEMENT STACK (Right 3 cols) */}
                <div className="lg:col-span-3 bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 space-y-5 shadow-2xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-indigo-900/40 pb-2">
                      Pallet Information
                    </h4>

                    {/* Pallet Specs Table */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-900/60 text-xs space-y-2 font-medium">
                      <div className="flex justify-between border-b border-indigo-900/40 pb-1.5">
                        <span className="text-slate-400">Pallet Type:</span>
                        <strong className="text-white">{studioPalletType === 'euro' ? 'Euro Pallet' : 'American Pallet'}</strong>
                      </div>
                      <div className="flex justify-between border-b border-indigo-900/40 pb-1.5">
                        <span className="text-slate-400">Dimensions:</span>
                        <strong className="text-amber-300 font-mono">{studioPalletType === 'euro' ? '1200 × 800 mm' : '1200 × 1000 mm'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Load:</span>
                        <strong className="text-emerald-400 font-mono">1500 kg</strong>
                      </div>
                    </div>

                    {/* Current Status Section */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[11px] font-black uppercase text-indigo-300 block">
                        Current Status
                      </span>

                      {/* Area Usage Progress Bar */}
                      <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-indigo-900/60">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Occupied Area:</span>
                          <strong className="text-amber-300">{areaPercentage.toFixed(1)}%</strong>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-amber-400 h-full transition-all duration-500"
                            style={{ width: `${areaPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                          <span>Remaining Area: {remainingPercentage.toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Total Weight & Elements Count */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-900/60 text-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Weight</span>
                          <span className="text-lg font-black font-mono text-emerald-400 block mt-0.5">
                            {totalPalletKg.toFixed(1)} kg
                          </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-900/60 text-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Elements</span>
                          <span className="text-lg font-black font-mono text-white block mt-0.5">
                            {palletEls.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Element List on this Pallet */}
                    <div className="space-y-2 pt-2 border-t border-indigo-900/40">
                      <span className="text-[11px] font-black uppercase text-indigo-300 block">
                        Element List ({palletEls.length})
                      </span>

                      {palletEls.length > 0 ? (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {palletEls.map(el => (
                            <div 
                              key={el.id}
                              className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/60 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-900 rounded-xl text-indigo-400 border border-slate-800">
                                  <Box className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-bold text-white block">{el.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {el.widthMm} × {el.heightMm} × {el.depthMm} mm
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <span className="font-mono font-black text-emerald-400 text-xs">
                                  {calculateElementBreakdown(el).totalLineKg} kg
                                </span>
                                <button
                                  onClick={() => setKitchenElements(prev => prev.filter(x => x.id !== el.id))}
                                  className="text-slate-500 hover:text-rose-400 p-1"
                                  title="Fshij nga paleta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-slate-950/60 rounded-2xl border border-dashed border-indigo-900/50">
                          <span className="text-xs text-slate-500 font-medium">Kjo paletë është e zbrazët.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Complete / Seal Pallet Action Button */}
                  <div className="pt-3 border-t border-indigo-900/40">
                    {completedPallets.includes(activePNo) ? (
                      <button
                        onClick={() => handleReopenPallet(activePNo)}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-400" /> 🔓 Rihap Paletën #{activePNo}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFinishPallet(activePNo)}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> ✅ Përfundo Paletën #{activePNo}
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB 3: SINGLE CABINET BUILDER & DETAILED CALCULATOR */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Builder Controls Form */}
            <div className="lg:col-span-2 bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-400" /> Ndërtuesi & Regjistruesi i Modulit Standard
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ndërtoni modulin dhe regjistrojeni te "Kërko Elementet me Pesha" për përdorim të ardhshëm me 1 klik.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSaveBuilderToPresetCatalog}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-amber-500/60 text-amber-300 hover:text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Ruaj këtë modul si model standard te Kërko Elementet me Pesha"
                  >
                    <Save className="w-4 h-4 text-amber-400" /> 💾 Regjistro te Katalogu
                  </button>

                  <button
                    onClick={handleAddBuilderToKitchen}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" /> Shto në Projekt
                  </button>
                </div>
              </div>

              {/* Element Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-1">Emri i Modulit:</label>
                  <input 
                    type="text"
                    value={builderForm.name}
                    onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-1">Pozicioni i Modulit:</label>
                  <select
                    value={builderForm.position}
                    onChange={(e) => setBuilderForm({ ...builderForm, position: e.target.value as ElementPosition })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                  >
                    <option value="lart">Element Lart (Vise)</option>
                    <option value="posht">Element Poshtë (Baza)</option>
                    <option value="kolone">Kolonë (Shpajz / Tall)</option>
                    <option value="raft_lart">Raft Lart (I hapur)</option>
                    <option value="raft_posht">Raft Poshtë (I hapur)</option>
                  </select>
                </div>
              </div>

              {/* Element Dimensions (WxHxD) */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-300 block">
                  Përmasat e Kabinës / Modulit (mm):
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Gjerësia W (mm):</label>
                    <input 
                      type="number"
                      value={builderForm.widthMm}
                      onChange={(e) => setBuilderForm({ ...builderForm, widthMm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-black text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Lartësia H (mm):</label>
                    <input 
                      type="number"
                      value={builderForm.heightMm}
                      onChange={(e) => setBuilderForm({ ...builderForm, heightMm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-black text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Thellësia D (mm):</label>
                    <input 
                      type="number"
                      value={builderForm.depthMm}
                      onChange={(e) => setBuilderForm({ ...builderForm, depthMm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-black text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Carcase Material & Top/Bottom option */}
              <div className="space-y-2">
                <label className="block text-slate-400 text-[10px] font-bold">Materiali i Korpusit (Ivericë / MDF):</label>
                <select
                  value={builderForm.carcaseMaterialId}
                  onChange={(e) => setBuilderForm({ ...builderForm, carcaseMaterialId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.weightPerM2} kg/m²)</option>
                  ))}
                </select>

                <div className="flex items-center gap-2 pt-1 bg-slate-950/80 p-2.5 rounded-xl border border-indigo-900/60">
                  <input 
                    type="checkbox"
                    id="hasTopBottomCheck"
                    checked={builderForm.hasTopBottom !== false}
                    onChange={(e) => setBuilderForm({ ...builderForm, hasTopBottom: e.target.checked })}
                    className="w-4 h-4 accent-amber-400 cursor-pointer"
                  />
                  <label htmlFor="hasTopBottomCheck" className="text-white text-xs font-bold cursor-pointer">
                    Përfshij Tavan & Dysheme automatikisht (2 pllaka korpusi)
                  </label>
                </div>
              </div>

              {/* Shelves & Backing Section */}
              <div className="space-y-3 pt-2 border-t border-indigo-900/40">
                <span className="text-[10px] font-black uppercase text-amber-300 block">
                  Raftat dhe Shpina (HDF / Lesenit 3 mm):
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Numri i Rafteve të Brendshme:</label>
                    <input 
                      type="number"
                      min={0}
                      value={builderForm.numShelves}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        setBuilderForm(prev => {
                          const carcaseMat = getMaterial(prev.carcaseMaterialId);
                          const tMm = carcaseMat.thicknessMm || 18;
                          const autoW = Math.max(10, prev.widthMm - (2 * tMm));
                          const autoD = Math.max(10, prev.depthMm - 20);
                          return {
                            ...prev,
                            numShelves: num,
                            shelfWidthMm: prev.shelfWidthMm || autoW,
                            shelfDepthMm: prev.shelfDepthMm || autoD
                          };
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Materiali i Rafteve:</label>
                    <select
                      value={builderForm.shelfMaterialId}
                      onChange={(e) => setBuilderForm({ ...builderForm, shelfMaterialId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                    >
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.weightPerM2} kg/m²)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Shelf Dimensions */}
                {builderForm.numShelves > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/40 space-y-3 mt-2">
                    <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                      <span className="text-[10px] font-black uppercase text-amber-300">
                        Përmasat e Rafteve (Sipas dëshirës për secilin raft):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const carcaseMat = getMaterial(builderForm.carcaseMaterialId);
                          const tMm = carcaseMat.thicknessMm || 18;
                          const autoW = Math.max(10, builderForm.widthMm - (2 * tMm));
                          const autoD = Math.max(10, builderForm.depthMm - 20);
                          setBuilderForm(prev => ({
                            ...prev,
                            shelfWidthMm: autoW,
                            shelfDepthMm: autoD,
                            customShelves: Array.from({ length: prev.numShelves }).map(() => ({ widthMm: autoW, depthMm: autoD }))
                          }));
                        }}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                      >
                        Reset / Rekalkulo Auto
                      </button>
                    </div>

                    {/* Standard fallback defaults */}
                    <div className="grid grid-cols-2 gap-3 pb-1 border-b border-indigo-900/30">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Gjerësia Standarde (mm):</label>
                        <input 
                          type="number"
                          value={builderForm.shelfWidthMm ?? Math.max(10, builderForm.widthMm - 36)}
                          onChange={(e) => setBuilderForm({ ...builderForm, shelfWidthMm: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-amber-500/60 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-black text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Thellësia Standarde (mm):</label>
                        <input 
                          type="number"
                          value={builderForm.shelfDepthMm ?? Math.max(10, builderForm.depthMm - 20)}
                          onChange={(e) => setBuilderForm({ ...builderForm, shelfDepthMm: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-amber-500/60 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-black text-xs"
                        />
                      </div>
                    </div>

                    {/* Individual shelf dimension inputs */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Përmasat individuale për secilin raft (mm):
                      </span>
                      {Array.from({ length: builderForm.numShelves }).map((_, shelfIdx) => {
                        const shelfDim = (builderForm.customShelves && builderForm.customShelves[shelfIdx]) || {};
                        const defaultW = builderForm.shelfWidthMm ?? Math.max(10, builderForm.widthMm - 36);
                        const defaultD = builderForm.shelfDepthMm ?? Math.max(10, builderForm.depthMm - 20);
                        const currentW = shelfDim.widthMm !== undefined ? shelfDim.widthMm : defaultW;
                        const currentD = shelfDim.depthMm !== undefined ? shelfDim.depthMm : defaultD;

                        return (
                          <div key={shelfIdx} className="p-2.5 bg-slate-900/90 rounded-xl border border-indigo-900/50 space-y-1">
                            <span className="text-[10px] font-black text-amber-300 block">
                              {builderForm.numShelves === 1 ? 'Rafti:' : `Rafti ${shelfIdx + 1}:`}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-slate-400 text-[9px] mb-0.5 font-bold">Gjerësia W (mm):</label>
                                <input 
                                  type="number"
                                  value={currentW}
                                  onChange={(e) => {
                                    const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                    const newCustomShelves = [...(builderForm.customShelves || [])];
                                    while (newCustomShelves.length < builderForm.numShelves) {
                                      newCustomShelves.push({ widthMm: defaultW, depthMm: defaultD });
                                    }
                                    newCustomShelves[shelfIdx] = { ...newCustomShelves[shelfIdx], widthMm: val };
                                    setBuilderForm({ ...builderForm, customShelves: newCustomShelves });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 text-[9px] mb-0.5 font-bold">Thellësia D (mm):</label>
                                <input 
                                  type="number"
                                  value={currentD}
                                  onChange={(e) => {
                                    const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                    const newCustomShelves = [...(builderForm.customShelves || [])];
                                    while (newCustomShelves.length < builderForm.numShelves) {
                                      newCustomShelves.push({ widthMm: defaultW, depthMm: defaultD });
                                    }
                                    newCustomShelves[shelfIdx] = { ...newCustomShelves[shelfIdx], depthMm: val };
                                    setBuilderForm({ ...builderForm, customShelves: newCustomShelves });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="hasBackingCheck"
                      checked={builderForm.hasBacking}
                      onChange={(e) => setBuilderForm({ ...builderForm, hasBacking: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <label htmlFor="hasBackingCheck" className="text-white text-xs font-bold cursor-pointer">
                      Përmban Shpinë (HDF / Lesenit 3 mm)
                    </label>
                  </div>

                  {builderForm.hasBacking && (
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Materiali i Shpinës:</label>
                      <select
                        value={builderForm.backingMaterialId}
                        onChange={(e) => setBuilderForm({ ...builderForm, backingMaterialId: e.target.value })}
                        className="w-full bg-slate-950 border border-amber-500/80 rounded-xl px-3 py-2 text-amber-300 font-bold text-xs"
                      >
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.weightPerM2} kg/m²)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Doors Section */}
              <div className="space-y-3 pt-2 border-t border-indigo-900/40">
                <span className="text-[10px] font-black uppercase text-amber-300 block">
                  Dyer / Frontet:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Numri i Dyerve:</label>
                    <input 
                      type="number"
                      min={0}
                      value={builderForm.numDoors}
                      onChange={(e) => setBuilderForm({ ...builderForm, numDoors: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Materiali i Dyerve:</label>
                    <select
                      value={builderForm.doorMaterialId}
                      onChange={(e) => setBuilderForm({ ...builderForm, doorMaterialId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                    >
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.weightPerM2} kg/m²)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {builderForm.numDoors > 0 && (
                  <div className="space-y-2 pt-2 border-t border-indigo-900/40">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Përmasat individuale për çdo derë (mm):
                    </span>
                    {Array.from({ length: builderForm.numDoors }).map((_, doorIdx) => {
                      const doorDim = (builderForm.customDoors && builderForm.customDoors[doorIdx]) || {};
                      const currentW = doorDim.widthMm !== undefined ? doorDim.widthMm : (builderForm.doorWidthMm || '');
                      const currentH = doorDim.heightMm !== undefined ? doorDim.heightMm : (builderForm.doorHeightMm || '');

                      return (
                        <div key={doorIdx} className="p-2.5 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-1">
                          <span className="text-[10px] font-black text-amber-300 block">
                            {builderForm.numDoors === 1 ? 'Derë:' : `Derë ${doorIdx + 1}:`}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-400 text-[9px] mb-0.5 font-bold">Gjerësia W (mm):</label>
                              <input 
                                type="number"
                                placeholder="Auto width"
                                value={currentW}
                                onChange={(e) => {
                                  const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                  const newCustomDoors = [...(builderForm.customDoors || [])];
                                  while (newCustomDoors.length < builderForm.numDoors) {
                                    newCustomDoors.push({ widthMm: builderForm.doorWidthMm, heightMm: builderForm.doorHeightMm });
                                  }
                                  newCustomDoors[doorIdx] = { ...newCustomDoors[doorIdx], widthMm: val };
                                  setBuilderForm({ ...builderForm, customDoors: newCustomDoors });
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-[9px] mb-0.5 font-bold">Lartësia H (mm):</label>
                              <input 
                                type="number"
                                placeholder="Auto height"
                                value={currentH}
                                onChange={(e) => {
                                  const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                  const newCustomDoors = [...(builderForm.customDoors || [])];
                                  while (newCustomDoors.length < builderForm.numDoors) {
                                    newCustomDoors.push({ widthMm: builderForm.doorWidthMm, heightMm: builderForm.doorHeightMm });
                                  }
                                  newCustomDoors[doorIdx] = { ...newCustomDoors[doorIdx], heightMm: val };
                                  setBuilderForm({ ...builderForm, customDoors: newCustomDoors });
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Builder Live Calculation Summary */}
            <div className="space-y-6">
              
              <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
                <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4" /> Pesha e Llogaritur e Modulit
                </h3>

                <div className="text-center py-4 bg-slate-950 rounded-2xl border border-amber-500/40">
                  <span className="text-xs font-bold text-slate-400 block mb-1">PESHA TOTALE E NJËSISË:</span>
                  <span className="text-4xl font-black font-mono text-emerald-400">
                    {builderCalculated.calculatedTotalKg} KG
                  </span>
                </div>

                {/* Component list */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-black text-indigo-300 block">Ndarja sipas Komponentëve:</span>
                  {builderCalculated.components.map((comp, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-indigo-900/40 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{comp.partName}</span>
                        <span className="text-[10px] text-slate-400">
                          {comp.materialName} ({comp.weightPerM2} kg/m²)
                        </span>
                      </div>
                      <div className="font-mono font-black text-amber-300 text-xs">
                        {comp.totalKg} kg
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 4: CUSTOM MATERIALS DATABASE (KG/M²) */}
        {activeTab === 'materials-db' && (
          <div className="space-y-6">
            
            {/* Add New Material Form */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" /> Shto Material të Ri (Pesha në kg / 1 m²)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[10px] font-bold">Emri i Materialit:</label>
                  <input 
                    type="text"
                    placeholder="e.g. MDF 25 mm ose Lisi Masiv"
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[10px] font-bold">Trashësia (mm):</label>
                  <input 
                    type="number"
                    value={newMatThickness}
                    onChange={(e) => setNewMatThickness(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[10px] font-bold">Pesha për 1 m² (KG):</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={newMatWeight}
                    onChange={(e) => setNewMatWeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-amber-500/80 rounded-xl px-3 py-2 text-amber-300 font-mono font-black text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddMaterial}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Shto në Baze
                  </button>
                </div>
              </div>
            </div>

            {/* Materials Table */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4" /> Baza e Materialeve të Regjistruara ({materials.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="bg-slate-950 text-indigo-300 font-black uppercase text-[10px] border-b border-indigo-900/60">
                      <th className="p-3">Materiali</th>
                      <th className="p-3">Trashësia</th>
                      <th className="p-3">Pesha për 1 m² (KG)</th>
                      <th className="p-3 text-center">Veprime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-900/40 font-medium">
                    {materials.map(m => (
                      <tr key={m.id} className="hover:bg-indigo-950/40">
                        <td className="p-3 font-black text-white">{m.name}</td>
                        <td className="p-3 font-mono">{m.thicknessMm} mm</td>
                        <td className="p-3 font-mono font-black text-amber-300">
                          <input 
                            type="number"
                            step="0.1"
                            value={m.weightPerM2}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, weightPerM2: val } : x));
                            }}
                            className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-black"
                          /> kg / m²
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SAVED KITCHEN PROJECTS LIBRARY */}
        {activeTab === 'saved-projects' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-cyan-400" /> Biblioteka e Projekteve të Ruajtura ({savedProjects.length})
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Të gjitha kuzhinat e ruajtura me koder përkatës, elementet dhe peshën totale.
                  </p>
                </div>

                <button
                  onClick={handleSaveCurrentProject}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Ruaj Kuzhinën Aktuale ({kitchenCode})
                </button>
              </div>

              {savedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedProjects.map(proj => (
                    <div key={proj.id} className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 shadow-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                            {proj.code}
                          </span>
                          <h4 className="text-base font-black text-white mt-1">
                            {proj.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                            Ndryshuar më: {proj.updatedAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-indigo-900/40 text-xs">
                        <span className="text-slate-400">{proj.elements.length} elemente</span>
                        <span className="font-mono font-black text-emerald-400 text-base">{proj.totalKg} KG</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleLoadProject(proj)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" /> Hape Projekti
                        </button>
                        <button
                          onClick={() => handleDeleteSavedProject(proj.id)}
                          className="p-2 text-rose-400 hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                          title="Fshij nga biblioteka"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs font-medium">
                    Asnjë projekt i ruajtur në bibliotekë. Klikoni "Ruaj Projekti me Kod" për të ruajtur punën tuaj!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      )}

      {/* PALLET INSPECTION & 2D MAP MODAL OVERLAY */}
      {activePalletModal !== null && (() => {
        const palletNo = activePalletModal;
        const palletElements = kitchenElements.filter(el => (el.palletNumber || 1) === palletNo);
        const palletKg = palletElements.reduce((sum, el) => sum + (calculateElementBreakdown(el).totalLineKg), 0);
        const isDone = completedPallets.includes(palletNo);

        // Footprint calculation for Euro Pallet (800mm x 1200mm = 0.96 m²)
        const totalFloorM2 = 0.96;
        const usedFloorM2 = palletElements.reduce((sum, el) => {
          return sum + ((el.widthMm / 1000) * (el.depthMm / 1000) * el.quantity);
        }, 0);
        const floorPercentage = Math.min(100, Math.round((usedFloorM2 / totalFloorM2) * 100));

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-slate-950 border-b border-indigo-900/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-950 rounded-2xl border border-emerald-800 text-emerald-400">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white">
                        📦 Detajet & Inspektimi i Paletës #{palletNo}
                      </h3>
                      {isDone ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> E Mbyllur
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px]">
                          ⏳ Në Punë
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Kodi: <span className="text-amber-300 font-bold">{kitchenCode}</span> | Klienti: <span className="text-white font-bold">{kitchenName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Modal Tab Controls */}
                  <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-indigo-900">
                    <button
                      onClick={() => setInspectModalTab('list')}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        inspectModalTab === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📋 Lista & Ndryshimi
                    </button>
                    <button
                      onClick={() => setInspectModalTab('map2d')}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                        inspectModalTab === 'map2d' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> 🗺️ Harta 2D (80x120cm)
                    </button>
                  </div>

                  <button
                    onClick={() => setActivePalletModal(null)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
                
                {/* TAB 1: LIST & DIRECT EDIT */}
                {inspectModalTab === 'list' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-indigo-900/60">
                      <div>
                        <span className="text-xs font-black uppercase text-amber-300 block">
                          Përmbledhja e Paletës #{palletNo}:
                        </span>
                        <p className="text-xs text-slate-400">
                          {palletElements.length} element(e) në këtë paletë | Pesha: <strong className="text-emerald-400 font-mono text-sm">{palletKg.toFixed(1)} KG</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddElementDirectlyToPallet(palletNo)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> + Shto Element drejtpërdrejt këtu
                      </button>
                    </div>

                    {palletElements.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-indigo-900/60 bg-slate-950/60">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead>
                            <tr className="bg-slate-950 text-indigo-300 font-black uppercase text-[10px] tracking-wider border-b border-indigo-900/60">
                              <th className="p-3">Kategoria</th>
                              <th className="p-3">Emri i Modulit</th>
                              <th className="p-3">Përmasat WxHxD (mm)</th>
                              <th className="p-3 text-center">Fronti (19mm / 22mm)</th>
                              <th className="p-3 text-center">Sasi</th>
                              <th className="p-3 text-right">Pesha</th>
                              <th className="p-3 text-center">Veprime</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-900/40 font-medium">
                            {palletElements.map(el => {
                              const breakdown = calculateElementBreakdown(el);

                              return (
                                <tr key={el.id} className="hover:bg-indigo-950/40">
                                  <td className="p-3">
                                    <select
                                      value={el.position}
                                      onChange={(e) => {
                                        const val = e.target.value as ElementPosition;
                                        setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, position: val } : x));
                                      }}
                                      className={`text-[10px] font-black uppercase px-2 py-1 rounded border outline-none cursor-pointer ${getPositionBadgeColor(el.position)}`}
                                    >
                                      <option value="lart">Lart</option>
                                      <option value="posht">Poshtë</option>
                                      <option value="kolone">Kolonë</option>
                                      <option value="raft_lart">Raft Lart</option>
                                      <option value="raft_posht">Raft Poshtë</option>
                                    </select>
                                  </td>

                                  <td className="p-3">
                                    <input 
                                      type="text"
                                      value={el.name}
                                      onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, name: e.target.value } : x))}
                                      className="bg-transparent text-white font-black text-xs outline-none focus:border-b focus:border-amber-400 w-full"
                                    />
                                  </td>

                                  <td className="p-3 font-mono text-amber-300 font-bold">
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="number" 
                                        value={el.widthMm}
                                        onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, widthMm: Number(e.target.value) } : x))}
                                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[11px]"
                                      />
                                      <span>x</span>
                                      <input 
                                        type="number" 
                                        value={el.heightMm}
                                        onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, heightMm: Number(e.target.value) } : x))}
                                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[11px]"
                                      />
                                      <span>x</span>
                                      <input 
                                        type="number" 
                                        value={el.depthMm}
                                        onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, depthMm: Number(e.target.value) } : x))}
                                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[11px]"
                                      />
                                    </div>
                                  </td>

                                  <td className="p-3 text-center">
                                    {el.numDoors > 0 ? (
                                      <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-900/80 shadow-inner">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, doorMaterialId: 'mat-mdf-19' } : x));
                                          }}
                                          className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                            el.doorMaterialId === 'mat-mdf-19' || el.doorMaterialId === 'mat-iv-18'
                                              ? 'bg-indigo-600 text-white font-black shadow border border-indigo-400'
                                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                          }`}
                                          title="19mm"
                                        >
                                          19mm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, doorMaterialId: 'mat-mdf-22' } : x));
                                          }}
                                          className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                            el.doorMaterialId === 'mat-mdf-22' || el.doorMaterialId === 'mat-iv-22'
                                              ? 'bg-purple-600 text-white font-black shadow border border-purple-400'
                                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                          }`}
                                          title="22mm"
                                        >
                                          22mm
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 font-mono italic">- Pa dyer</span>
                                    )}
                                  </td>

                                  <td className="p-3 text-center">
                                    <input 
                                      type="number"
                                      min={1}
                                      value={el.quantity}
                                      onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))}
                                      className="w-12 bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white rounded px-1 py-0.5"
                                    />
                                  </td>

                                  <td className="p-3 text-right font-mono font-black text-amber-300">
                                    {breakdown.totalLineKg} kg
                                  </td>

                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => {
                                        // Reassign to default Paleta 1 or remove from this pallet
                                        const targetPallet = palletNo === 1 ? 2 : 1;
                                        setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, palletNumber: targetPallet } : x));
                                      }}
                                      className="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-[10px] font-bold cursor-pointer"
                                      title="Hiq nga kjo paletë"
                                    >
                                      Lëviz
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-dashed border-indigo-900/50 space-y-2">
                        <Box className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-slate-400 text-xs">Kjo paletë është tërësisht bosh.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: VISUAL 2D PALLET MAP */}
                {inspectModalTab === 'map2d' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-900/60">
                        <span className="text-[10px] uppercase font-black text-slate-400 block">Sipërfaqja e dyshemesë Euro Paletë:</span>
                        <span className="text-base font-mono font-black text-amber-300">
                          {usedFloorM2.toFixed(2)} / 0.96 m² ({floorPercentage}%)
                        </span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-900/60">
                        <span className="text-[10px] uppercase font-black text-slate-400 block">Pesha e Ngarkuar:</span>
                        <span className={`text-base font-mono font-black ${palletKg > 400 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {palletKg.toFixed(1)} / 400 kg
                        </span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-900/60">
                        <span className="text-[10px] uppercase font-black text-slate-400 block">Numri i Elementeve:</span>
                        <span className="text-base font-mono font-black text-white">
                          {palletElements.length} copë
                        </span>
                      </div>
                    </div>

                    {/* Realistic Wooden Pallet Render & Floor Plan Canvas (Matching Photo 2) */}
                    <div className="bg-slate-950 p-5 rounded-3xl border-2 border-amber-500/60 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-black text-amber-300 border-b border-indigo-900/40 pb-2">
                        <span className="flex items-center gap-1.5 text-sm">
                          <LayoutGrid className="w-5 h-5 text-amber-400" /> Harta Vizuale Reale e Paletës me Druri (120x80cm):
                        </span>

                        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-500/40">
                          <span className="text-[10px] text-slate-400 uppercase">Lloji i Paletës:</span>
                          <select
                            value={palletType}
                            onChange={(e) => setPalletType(e.target.value as 'euro' | 'american')}
                            className="bg-transparent text-amber-300 font-mono font-bold text-xs outline-none cursor-pointer"
                          >
                            <option value="euro" className="bg-slate-900 text-white">EUROPALETTEN (1200 x 800 mm)</option>
                            <option value="american" className="bg-slate-900 text-white">AMERICAN PALLET (1200 x 1000 mm)</option>
                          </select>
                        </div>
                      </div>

                      {/* Realistic 3D Pine Wooden Pallet Container */}
                      <div className="relative w-full max-w-lg mx-auto min-h-[460px] bg-gradient-to-b from-stone-900 via-amber-950/40 to-stone-950 rounded-3xl border-4 border-amber-800/80 p-5 flex flex-col justify-between shadow-2xl overflow-hidden space-y-3">
                        
                        {/* Realistic Wooden Planks Background Layer */}
                        <div className="absolute inset-0 grid grid-rows-5 gap-1.5 p-3 pointer-events-none opacity-40">
                          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 border-y border-amber-600 rounded-sm shadow-inner" />
                          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 border-y border-amber-600 rounded-sm shadow-inner" />
                          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 border-y border-amber-600 rounded-sm shadow-inner" />
                          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 border-y border-amber-600 rounded-sm shadow-inner" />
                          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 border-y border-amber-600 rounded-sm shadow-inner" />
                        </div>

                        {/* Pallet Stamp Branding (EPAL / EURO) */}
                        <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2 pointer-events-none opacity-80">
                          <div className="px-2 py-0.5 rounded border-2 border-amber-600/60 font-mono font-black text-[9px] text-amber-500 uppercase tracking-widest bg-slate-950/80">
                            EPAL 1200x800
                          </div>
                        </div>

                        {/* Stacked Cabinet Boxes ("Kaçat") Container */}
                        <div className="relative z-10 space-y-2.5 h-full overflow-y-auto pr-1">
                          {palletElements.length > 0 ? (
                            palletElements.map((el, idx) => {
                              const breakdown = calculateElementBreakdown(el);
                              const doorMat = getMaterial(el.doorMaterialId);
                              const is22 = doorMat.thicknessMm === 22 || doorMat.name.includes('22');

                              let badgeColor = 'bg-slate-900/95 border-amber-500 text-amber-200';
                              if (el.position === 'posht') badgeColor = 'bg-slate-900/95 border-emerald-500 text-emerald-200';
                              else if (el.position === 'kolone') badgeColor = 'bg-slate-900/95 border-purple-500 text-purple-200';
                              else if (el.position === 'raft_lart' || el.position === 'raft_posht') badgeColor = 'bg-slate-900/95 border-cyan-500 text-cyan-200';

                              return (
                                <div 
                                  key={el.id}
                                  className={`p-3.5 rounded-2xl border-2 shadow-xl transition-all flex items-center justify-between gap-3 ${badgeColor} hover:scale-[1.01]`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow">
                                      #{idx+1}
                                    </div>

                                    <div>
                                      <span className="font-black text-xs text-white block">{el.name}</span>
                                      <div className="flex items-center gap-1.5 text-[10px] font-mono mt-1 flex-wrap">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-950 font-bold border border-slate-700">
                                          {el.widthMm}x{el.depthMm}mm (L:{el.heightMm})
                                        </span>
                                        {el.sideTag && (
                                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase text-[9px]">
                                            {el.sideTag}
                                          </span>
                                        )}
                                        <span className={`px-1.5 py-0.5 rounded font-black ${is22 ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'}`}>
                                          {is22 ? 'Front 22mm' : 'Front 19mm'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-black text-sm text-amber-300 block">
                                      {breakdown.totalLineKg} kg
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400 font-bold">
                                      {el.quantity}x copë
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-amber-400/60 font-medium space-y-2">
                              <Box className="w-12 h-12 stroke-[1.5]" />
                              <p className="text-xs font-bold">Kjo paletë me druri është tërësisht bosh.</p>
                              <p className="text-[10px] text-slate-500">Përdorni butonin "Shto Element" më sipër për të ngarkuar kaçat e kuzhinës.</p>
                            </div>
                          )}
                        </div>

                        {/* Wooden Pallet Base Runner Legs */}
                        <div className="relative z-10 pt-2 border-t-2 border-amber-700/60 flex items-center justify-between text-[10px] font-mono font-bold text-amber-400">
                          <span>📦 Përmasa: {palletType === 'euro' ? '800 x 1200 mm' : '1000 x 1200 mm'}</span>
                          <span>Max Kapaciteti: 400 KG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-slate-950 border-t border-indigo-900/60 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-white">Paleta #{palletNo}</span>: {palletElements.length} elemente, {palletKg.toFixed(1)} kg totales.
                </div>

                <div className="flex items-center gap-2">
                  {isDone ? (
                    <button
                      onClick={() => handleReopenPallet(palletNo)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Unlock className="w-4 h-4 text-amber-400" /> 🔓 Rihap këtë Paletë
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleFinishPallet(palletNo);
                        setActivePalletModal(palletNo + 1);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> ✅ Përfundo Paletën #{palletNo} & Kalo te Paleta #{palletNo + 1} ➔
                    </button>
                  )}

                  <button
                    onClick={() => setActivePalletModal(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Mbyll
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL 1: ⚡ QUICK ELEMENT / DOOR ADDITION MODAL */}
      {isQuickElementModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-indigo-900/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-xl text-slate-950 font-black">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">⚡ Shto Derë apo Element të Shpejtë</h3>
                  <p className="text-[11px] text-slate-400">Përcaktoni dimensionet për t'i shtuar te lista e këtij projekti.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsQuickElementModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuickElementSubmit} className="space-y-4">
              {/* Element / Door Name */}
              <div>
                <label className="block text-xs font-black uppercase text-amber-300 mb-1">
                  Emri i Elementit apo Derës:
                </label>
                <input 
                  type="text"
                  required
                  value={quickForm.name}
                  onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                  placeholder="e.g. Derë MDF 60x72 ose Kabinë Baza 60"
                  className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none focus:border-amber-400"
                />
              </div>

              {/* Position & Category Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Pozicioni / Lloji:</label>
                  <select
                    value={quickForm.position}
                    onChange={(e) => {
                      const pos = e.target.value as ElementPosition;
                      let h = quickForm.heightMm;
                      let d = quickForm.depthMm;
                      if (pos === 'kolone') { h = 2100; d = 560; }
                      else if (pos === 'lart' || pos === 'raft_lart') { h = 720; d = 340; }
                      else { h = 720; d = 560; }
                      setQuickForm({ ...quickForm, position: pos, heightMm: h, depthMm: d });
                    }}
                    className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-amber-300 font-bold text-xs"
                  >
                    <option value="posht">Poshtë (Baza 72cm)</option>
                    <option value="lart">Lart (Vise 72cm)</option>
                    <option value="kolone">Kolonë / Shpajz (Tall 210cm)</option>
                    <option value="raft_lart">Raft Lart (I Hapur)</option>
                    <option value="raft_posht">Raft Poshtë (I Hapur)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Anësoret / Korpusi:</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickForm({ ...quickForm, ansoresThickness: 18 })}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                        quickForm.ansoresThickness === 18 ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      18 mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickForm({ ...quickForm, ansoresThickness: 22 })}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                        quickForm.ansoresThickness === 22 ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      22 mm
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox"
                      id="quickFormHasTopBottom"
                      checked={quickForm.hasTopBottom !== false}
                      onChange={(e) => setQuickForm({ ...quickForm, hasTopBottom: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <label htmlFor="quickFormHasTopBottom" className="text-white text-xs font-bold cursor-pointer">
                      Përfshij Tavan & Dysheme
                    </label>
                  </div>
                </div>
              </div>

              {/* Dimensions: W x H x D */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Gjerësia (W mm):</label>
                  <input 
                    type="number" 
                    min={100}
                    max={2500}
                    value={quickForm.widthMm}
                    onChange={(e) => {
                      const w = parseInt(e.target.value) || 600;
                      setQuickForm({ 
                        ...quickForm, 
                        widthMm: w,
                        door1WidthMm: Math.max(100, quickForm.numDoors === 2 ? Math.floor(w / 2) - 3 : w - 3),
                        door2WidthMm: Math.max(100, Math.floor(w / 2) - 3)
                      });
                    }}
                    className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Lartësia (H mm):</label>
                  <input 
                    type="number" 
                    min={100}
                    max={3000}
                    value={quickForm.heightMm}
                    onChange={(e) => {
                      const h = parseInt(e.target.value) || 720;
                      setQuickForm({ 
                        ...quickForm, 
                        heightMm: h,
                        door1HeightMm: Math.max(100, h - 4),
                        door2HeightMm: Math.max(100, h - 4)
                      });
                    }}
                    className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Thellësia (D mm):</label>
                  <input 
                    type="number" 
                    min={50}
                    max={1200}
                    value={quickForm.depthMm}
                    onChange={(e) => setQuickForm({ ...quickForm, depthMm: parseInt(e.target.value) || 560 })}
                    className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Raftat & Dyer Setup */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-2xl border border-indigo-900/60">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Raftat e Brendshëm:
                  </label>
                  <select
                    value={quickForm.numShelves}
                    onChange={(e) => {
                      const ns = parseInt(e.target.value) || 0;
                      setQuickForm({ 
                        ...quickForm, 
                        numShelves: ns,
                        shelfWidthMm: quickForm.shelfWidthMm || Math.max(10, quickForm.widthMm - 36),
                        shelfDepthMm: quickForm.shelfDepthMm || Math.max(10, quickForm.depthMm - 20)
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-bold text-xs"
                  >
                    <option value={0}>Jo Raft (Bosh)</option>
                    <option value={1}>1 Raft</option>
                    <option value={2}>2 Rafta</option>
                    <option value={3}>3 Rafta</option>
                    <option value={4}>4 Rafta (Kolonë)</option>
                    <option value={5}>5 Rafta (Kolonë Max)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Numri i Dyerve:
                  </label>
                  <select
                    value={quickForm.numDoors}
                    onChange={(e) => {
                      const n = parseInt(e.target.value) || 0;
                      const w = quickForm.widthMm;
                      setQuickForm({ 
                        ...quickForm, 
                        numDoors: n,
                        door1WidthMm: n === 2 ? Math.floor(w / 2) - 3 : Math.max(100, w - 3),
                        door2WidthMm: Math.floor(w / 2) - 3
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-bold text-xs"
                  >
                    <option value={0}>Pa Derë (Kornizë / Raft i Hapur)</option>
                    <option value={1}>1 Derë (Vetëm 1 Derë)</option>
                    <option value={2}>2 Dyer (Dera 1 & Dera 2)</option>
                  </select>
                </div>
              </div>

              {/* Shelf Custom Dimensions */}
              {quickForm.numShelves > 0 && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex justify-between items-center border-b border-indigo-900/40 pb-1.5">
                    <span className="text-[10px] font-black uppercase text-amber-300">Përmasat e Rafteve (mm):</span>
                    <button
                      type="button"
                      onClick={() => {
                        const autoW = Math.max(10, quickForm.widthMm - 36);
                        const autoD = Math.max(10, quickForm.depthMm - 20);
                        setQuickForm({
                          ...quickForm,
                          shelfWidthMm: autoW,
                          shelfDepthMm: autoD,
                          customShelves: Array.from({ length: quickForm.numShelves }).map(() => ({ widthMm: autoW, depthMm: autoD }))
                        });
                      }}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Rekalkulo Auto
                    </button>
                  </div>

                  {/* Individual shelf dimension inputs for Rafti 1, Rafti 2, Rafti 3, Rafti 4, etc. */}
                  <div className="space-y-2">
                    {Array.from({ length: quickForm.numShelves }).map((_, shelfIdx) => {
                      const shelfDim = (quickForm.customShelves && quickForm.customShelves[shelfIdx]) || {};
                      const defaultW = quickForm.shelfWidthMm ?? Math.max(10, quickForm.widthMm - 36);
                      const defaultD = quickForm.shelfDepthMm ?? Math.max(10, quickForm.depthMm - 20);
                      const currentW = shelfDim.widthMm !== undefined ? shelfDim.widthMm : defaultW;
                      const currentD = shelfDim.depthMm !== undefined ? shelfDim.depthMm : defaultD;

                      return (
                        <div key={shelfIdx} className="p-2 bg-slate-900/90 rounded-xl border border-indigo-900/50 space-y-1">
                          <span className="text-[10px] font-black text-amber-300 block">
                            {quickForm.numShelves === 1 ? 'Rafti 1:' : `Rafti ${shelfIdx + 1}:`}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Gjerësia W (mm):</label>
                              <input 
                                type="number"
                                value={currentW}
                                onChange={(e) => {
                                  const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                  const newCustomShelves = [...(quickForm.customShelves || [])];
                                  while (newCustomShelves.length < quickForm.numShelves) {
                                    newCustomShelves.push({ widthMm: defaultW, depthMm: defaultD });
                                  }
                                  newCustomShelves[shelfIdx] = { ...newCustomShelves[shelfIdx], widthMm: val };
                                  setQuickForm({ ...quickForm, customShelves: newCustomShelves });
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Thellësia D (mm):</label>
                              <input 
                                type="number"
                                value={currentD}
                                onChange={(e) => {
                                  const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                  const newCustomShelves = [...(quickForm.customShelves || [])];
                                  while (newCustomShelves.length < quickForm.numShelves) {
                                    newCustomShelves.push({ widthMm: defaultW, depthMm: defaultD });
                                  }
                                  newCustomShelves[shelfIdx] = { ...newCustomShelves[shelfIdx], depthMm: val };
                                  setQuickForm({ ...quickForm, customShelves: newCustomShelves });
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Door Details (If numDoors > 0) */}
              {quickForm.numDoors > 0 && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-300">Përmasat e Derës / Dyerve:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuickForm({ ...quickForm, doorThickness: 19 })}
                        className={`px-2 py-0.5 text-[10px] font-black rounded ${
                          quickForm.doorThickness === 19 ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        19 mm
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickForm({ ...quickForm, doorThickness: 22 })}
                        className={`px-2 py-0.5 text-[10px] font-black rounded ${
                          quickForm.doorThickness === 22 ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        22 mm
                      </button>
                    </div>
                  </div>

                  {quickForm.numDoors >= 1 && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400">Derë 1 - Gjerësia (W):</label>
                        <input
                          type="number"
                          value={quickForm.door1WidthMm}
                          onChange={(e) => setQuickForm({ ...quickForm, door1WidthMm: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400">Derë 1 - Lartësia (H):</label>
                        <input
                          type="number"
                          value={quickForm.door1HeightMm}
                          onChange={(e) => setQuickForm({ ...quickForm, door1HeightMm: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {quickForm.numDoors >= 2 && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400">Derë 2 - Gjerësia (W):</label>
                        <input
                          type="number"
                          value={quickForm.door2WidthMm}
                          onChange={(e) => setQuickForm({ ...quickForm, door2WidthMm: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400">Derë 2 - Lartësia (H):</label>
                        <input
                          type="number"
                          value={quickForm.door2HeightMm}
                          onChange={(e) => setQuickForm({ ...quickForm, door2HeightMm: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Backing & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-indigo-900/60 w-full text-xs text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={quickForm.hasBacking}
                      onChange={(e) => setQuickForm({ ...quickForm, hasBacking: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                    <span>Përmban Shpinë HDF 3mm</span>
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sasia (Cope):</label>
                  <input 
                    type="number" 
                    min={1}
                    max={50}
                    value={quickForm.quantity}
                    onChange={(e) => setQuickForm({ ...quickForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Save to Preset Catalog Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-2xl border border-indigo-900/60 text-xs text-slate-300 font-medium">
                  <input 
                    type="checkbox"
                    checked={quickForm.saveToPresetCatalog}
                    onChange={(e) => setQuickForm({ ...quickForm, saveToPresetCatalog: e.target.checked })}
                    className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  />
                  <span>Ruaj edhe te Katalogu Standard <strong>("Kërko Elementet me Pesha")</strong> për përdorim të mëvonshëm</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-indigo-900/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickElementModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Shto në Listë (1-Klik)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 📦 PALLET OVERVIEW MODAL */}
      {isPalletModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 max-w-3xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-indigo-900/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950 rounded-2xl border border-emerald-800 text-emerald-400">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">📦 Shpërndarja ne Paleta Logjistike</h3>
                  <p className="text-xs text-slate-400">Inspektoni elementet e ndara sipas Paletës 1, 2, 3 dhe shihni peshën totale për transport.</p>
                </div>
              </div>

              <button 
                onClick={() => setIsPalletModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-indigo-900/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNewPallet}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> + Shto Paletë e Re
                </button>

                <button
                  onClick={() => handleAutoDistributePallets(350)}
                  className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-black text-xs rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Auto-Shpërndaj (Max 350kg)
                </button>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Gjithsej <strong className="text-emerald-400">{customPallets.length} Paleta</strong> në sistem
              </div>
            </div>

            {/* Pallets List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customPallets.map(pNo => {
                const pEls = kitchenElements.filter(el => (el.palletNumber || 1) === pNo);
                const pKg = pEls.reduce((sum, el) => sum + calculateElementBreakdown(el).totalLineKg, 0);
                const isCompleted = completedPallets.includes(pNo);

                return (
                  <div 
                    key={pNo}
                    className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                      isCompleted 
                        ? 'bg-emerald-950/30 border-emerald-500/60' 
                        : 'bg-slate-950 border-indigo-900/80 hover:border-amber-400/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">Paleta #{pNo}</span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-mono font-black">
                            ✓ E kryer
                          </span>
                        )}
                      </div>

                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {pKg.toFixed(1)} KG
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {pEls.length} elemente të vendosura
                    </div>

                    {/* Progress Capacity Bar (Target ~350kg) */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-300 ${pKg > 400 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, Math.round((pKg / 350) * 100))}%` }}
                      />
                    </div>

                    <div className="pt-2 border-t border-indigo-900/40 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setIsPalletModalOpen(false);
                          setActivePalletModal(pNo);
                        }}
                        className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Shiko Hartën Vizuale
                      </button>

                      {customPallets.length > 1 && (
                        <button
                          onClick={() => handleRemovePallet(pNo)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                          title="Fshij këtë paletë"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-indigo-900/50 flex items-center justify-end">
              <button
                onClick={() => setIsPalletModalOpen(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Mbyll
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
