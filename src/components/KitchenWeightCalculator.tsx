import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Trash2, 
  Save, 
  Edit,
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
  ChevronDown,
  FileText
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
  const [activeTab, setActiveTab] = useState<'kitchen-project' | 'pallets-view' | 'single' | 'elements-edit' | 'materials-db' | 'saved-projects'>('kitchen-project');

  // Inline element editor state for direct modifications inside Elementet e Ruajtura / Ndryshime tab
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditForm, setInlineEditForm] = useState<KitchenElementItem | null>(null);

  // Width slider state for "Emri i Modulit" column
  const [moduleColumnWidth, setModuleColumnWidth] = useState<number>(260);

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

  // Explicit Pallets List State (e.g. Paleta 1, Paleta 2, Paleta 3, Paleta 4...)
  const [customPallets, setCustomPallets] = useState<number[]>(() => {
    const saved = localStorage.getItem('mergim_custom_pallets_list_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* fallback */ }
    }
    return [1, 2, 3, 4];
  });

  useEffect(() => {
    localStorage.setItem('mergim_custom_pallets_list_v6', JSON.stringify(customPallets));
  }, [customPallets]);

  // Drag and Drop States for Packing List / Pallets View
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOverPalletNo, setDragOverPalletNo] = useState<number | null>(null);
  const [palletSearchQuery, setPalletSearchQuery] = useState<string>('');
  const [palletSubView, setPalletSubView] = useState<'manifest' | 'board'>('manifest');

  // Function to reassign an element to a target pallet
  const handleAssignElementToPallet = (elementId: string, targetPalletNo: number) => {
    setKitchenElements(prev => prev.map(el => el.id === elementId ? { ...el, palletNumber: targetPalletNo } : el));
    if (!customPallets.includes(targetPalletNo)) {
      setCustomPallets(prev => [...prev, targetPalletNo].sort((a, b) => a - b));
    }
  };

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

  // Single Element Builder Form State & Editing Selection
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const [builderForm, setBuilderForm] = useState<KitchenElementItem>({
    id: 'temp-1',
    name: 'Kabinë / Element i Ri',
    position: 'posht',
    widthMm: 600,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    hasTopBottom: false,
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

  // Load an element from created elements into builder form for editing
  const handleSelectElementForEditing = (el: KitchenElementItem) => {
    setEditingElementId(el.id);
    setBuilderForm({ ...el });
    setActiveTab('single');
  };

  // Cancel editing mode and reset builder form to blank template
  const handleCancelEditing = () => {
    setEditingElementId(null);
    setBuilderForm({
      id: `temp-${Date.now()}`,
      name: 'Kabinë / Element i Ri',
      position: 'posht',
      widthMm: 600,
      heightMm: 720,
      depthMm: 560,
      carcaseMaterialId: 'mat-iv-18',
      hasTopBottom: false,
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
  };

  // Save or Update builder form item in kitchenElements
  const handleAddBuilderToKitchen = () => {
    if (editingElementId) {
      setKitchenElements(prev => prev.map(item => item.id === editingElementId ? { ...builderForm, id: editingElementId } : item));
      alert(`Moduli "${builderForm.name}" u përditësua me sukses!`);
      setEditingElementId(null);
    } else {
      const newId = `builder-el-${Date.now()}`;
      const newItem: KitchenElementItem = {
        ...builderForm,
        id: newId,
        palletNumber: selectedActivePallet || 1
      };
      setKitchenElements(prev => [...prev, newItem]);
      alert(`Moduli "${newItem.name}" u shtua me sukses në Projekt!`);
    }
  };

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
              onClick={() => setActiveTab('pallets-view')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pallets-view'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg scale-[1.02]'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-800/60 border border-emerald-500/30'
              }`}
            >
              <Truck className="w-4 h-4 text-emerald-300" />
              <span>📦 Packing List & Paletat ({customPallets.length})</span>
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
              onClick={() => setActiveTab('elements-edit')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'elements-edit'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg scale-[1.02]'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-slate-800/60 border border-amber-500/30'
              }`}
            >
              <Edit className="w-4 h-4 text-slate-950" />
              <span>Elementet e Ruajtura / Ndryshime ({kitchenElements.length})</span>
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
                    onClick={() => setActiveTab('pallets-view')}
                    className="text-[10px] text-emerald-300 hover:underline font-bold cursor-pointer"
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

                  {/* Column Width Slider & Controls for "Emri i Modulit" */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-3 rounded-2xl border border-amber-500/40 shadow-md text-xs">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-amber-300 font-black">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span>Shiriti i Gjerësisë ("Emri i Modulit"):</span>
                      </div>
                      <input 
                        type="range" 
                        min={140} 
                        max={600} 
                        step={10}
                        value={moduleColumnWidth}
                        onChange={(e) => setModuleColumnWidth(Number(e.target.value))}
                        className="w-40 sm:w-56 accent-amber-400 cursor-pointer"
                        title="Lëviz shiritin për të ngushtuar ose zgjeruar kolonën e Emrit të Modulit"
                      />
                      <span className="font-mono font-black text-amber-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-amber-500/30 text-xs shadow-inner">
                        {moduleColumnWidth} px
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Përshtatje e shpejtë:</span>
                      <button 
                        type="button"
                        onClick={() => setModuleColumnWidth(160)} 
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-xl border cursor-pointer transition-all ${
                          moduleColumnWidth === 160 ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Ngushto (160px)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModuleColumnWidth(260)} 
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-xl border cursor-pointer transition-all ${
                          moduleColumnWidth === 260 ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Mesatare (260px)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModuleColumnWidth(420)} 
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-xl border cursor-pointer transition-all ${
                          moduleColumnWidth === 420 ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Zgjero (420px)
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
                            <th 
                              className="p-3 text-amber-300 font-black"
                              style={{ width: `${moduleColumnWidth}px`, minWidth: `${moduleColumnWidth}px` }}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Emri i Modulit</span>
                                <Sliders className="w-3.5 h-3.5 text-amber-400 opacity-90" />
                              </div>
                            </th>
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

                                {/* Element Name editable with resizable width */}
                                <td 
                                  className="p-3"
                                  style={{ width: `${moduleColumnWidth}px`, minWidth: `${moduleColumnWidth}px` }}
                                >
                                  <input 
                                    type="text"
                                    value={el.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, name: val } : x));
                                    }}
                                    className="bg-slate-900/60 border border-slate-700/80 rounded-lg px-2 py-1 text-white font-black text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 w-full transition-all"
                                    style={{ minWidth: `${Math.max(100, moduleColumnWidth - 24)}px` }}
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

                                {/* Pallet Dropdown Selector & Quick Add */}
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <select
                                      value={el.palletNumber || 1}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'add_new') {
                                          handleAddNewPallet();
                                        } else {
                                          handleAssignElementToPallet(el.id, Number(val));
                                        }
                                      }}
                                      className="bg-slate-950 border border-emerald-500/70 text-emerald-300 font-black text-xs rounded-xl px-2 py-1 outline-none focus:border-amber-400 cursor-pointer shadow-sm"
                                    >
                                      {customPallets.map(pNo => (
                                        <option key={pNo} value={pNo} className="bg-slate-900 text-white font-bold">
                                          📦 Paleta #{pNo}
                                        </option>
                                      ))}
                                      <option value="add_new" className="bg-indigo-950 text-amber-300 font-black">
                                        ➕ Shto Paletë...
                                      </option>
                                    </select>
                                    <button
                                      onClick={handleAddNewPallet}
                                      className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                                      title="Shto Paletë të Re (Paleta 1, 2, 3, 4...)"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
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

        {/* TAB 2: PACKING LIST & DRAG-AND-DROP PALLETS BOARD */}
        {activeTab === 'pallets-view' && (
          <div className="space-y-6">
            
            {/* TOP WARM STUDIO TOOLBAR & HEADER */}
            <div className="bg-stone-900/95 p-5 rounded-3xl border border-amber-900/50 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-950/80 rounded-2xl border border-amber-700/60 text-amber-400 shadow-md">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-100 flex items-center gap-2 tracking-wide">
                      📦 Lista e Paketimit & Shpërndarja në Paleta
                    </h3>
                    <p className="text-xs text-stone-300 mt-0.5 font-medium">
                      Projekt: <strong className="text-amber-400 font-bold">{kitchenName || 'Projekti i Kuzhinës'}</strong> | Kodi: <strong className="text-amber-300 font-mono">{kitchenCode}</strong>
                    </p>
                  </div>
                </div>

                {/* VIEW MODE TOGGLE BUTTONS */}
                <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-2xl border border-amber-900/60">
                  <button
                    onClick={() => setPalletSubView('manifest')}
                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      palletSubView === 'manifest'
                        ? 'bg-amber-500 text-stone-950 shadow-lg'
                        : 'text-stone-300 hover:text-white hover:bg-stone-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> 📋 Lista e Plotë (Manifest)
                  </button>
                  <button
                    onClick={() => setPalletSubView('board')}
                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      palletSubView === 'board'
                        ? 'bg-amber-500 text-stone-950 shadow-lg'
                        : 'text-stone-300 hover:text-white hover:bg-stone-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> 🧱 Board Interaktiv (Drag & Drop)
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAddNewPallet}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-stone-950" /> ➕ Shto Paletë
                  </button>

                  <button
                    onClick={() => handleAutoDistributePallets(350)}
                    className="px-3.5 py-2 bg-stone-950 hover:bg-amber-950/60 border border-amber-800/60 text-amber-300 font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                    title="Shpërndan automatikisht peshën barabartë te paletat p.sh. max 350kg"
                  >
                    <Zap className="w-4 h-4 text-amber-400" /> Auto-Shpërndaj
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-amber-950 hover:bg-amber-900 border border-amber-700/60 text-amber-200 font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-amber-400" /> Printo Packing List
                  </button>
                </div>
              </div>

              {/* SEARCH & REALTIME STATS BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-amber-900/40">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Kërko modul, dimension ose material..."
                    value={palletSearchQuery}
                    onChange={(e) => setPalletSearchQuery(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-900/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 outline-none focus:border-amber-400 font-medium"
                  />
                  {palletSearchQuery && (
                    <button onClick={() => setPalletSearchQuery('')} className="absolute right-3 top-2 text-stone-400 hover:text-stone-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-300 bg-stone-950 px-4 py-1.5 rounded-xl border border-amber-900/60">
                  <span>Paleta Aktive: <strong className="text-amber-400 font-bold">{customPallets.length}</strong></span>
                  <span>|</span>
                  <span>Modulë Gjithsej: <strong className="text-emerald-400 font-bold">{kitchenElements.length} copë</strong></span>
                  <span>|</span>
                  <span>Pesha Totale: <strong className="text-amber-300 font-bold">{projectSummary.grandTotalKg} KG</strong></span>
                </div>
              </div>
            </div>

            {/* SUB-VIEW 1: PRINTABLE / EXECUTIVE PACKING LIST MANIFEST TABLE */}
            {palletSubView === 'manifest' && (
              <div className="space-y-8">
                {customPallets.map(pNo => {
                  const pElements = kitchenElements.filter(el => {
                    const matchPallet = (el.palletNumber || 1) === pNo;
                    const matchSearch = !palletSearchQuery || 
                      el.name.toLowerCase().includes(palletSearchQuery.toLowerCase()) ||
                      `${el.widthMm}x${el.heightMm}`.includes(palletSearchQuery);
                    return matchPallet && matchSearch;
                  });
                  const pKg = kitchenElements
                    .filter(el => (el.palletNumber || 1) === pNo)
                    .reduce((sum, el) => sum + calculateElementBreakdown(el).totalLineKg, 0);
                  const isCompleted = completedPallets.includes(pNo);

                  return (
                    <div key={pNo} className="bg-stone-900/90 rounded-3xl border border-amber-900/50 overflow-hidden shadow-2xl">
                      {/* PALLET HEADER BAR */}
                      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-4 border-b border-amber-900/50 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-950 border border-amber-700/60 text-amber-400 rounded-xl font-mono font-black text-sm flex items-center gap-2">
                            <Box className="w-4 h-4" /> PALETA #{pNo}
                          </div>
                          <span className="text-xs font-mono text-stone-300">
                            Përmasa Standarde: <strong className="text-amber-400">{palletType === 'euro' ? '1200 × 800 mm (EURO)' : '1200 × 1000 mm (US)'}</strong>
                          </span>
                          {isCompleted ? (
                            <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                              ✓ E Kryer & E Mbyllur
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800/80 text-xs font-bold rounded-full">
                              ● Në Proces Paketimi
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <span className="text-xs text-stone-400 block">Pesha Bruto e Paletës:</span>
                            <strong className={`text-base font-black ${pKg > 350 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {pKg.toFixed(1)} KG <span className="text-xs font-normal text-stone-400">/ 350 max</span>
                            </strong>
                          </div>

                          {isCompleted ? (
                            <button
                              onClick={() => handleReopenPallet(pNo)}
                              className="px-3 py-1.5 bg-stone-950 text-stone-300 hover:text-white border border-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Unlock className="w-3.5 h-3.5 text-amber-400" /> Rihap
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFinishPallet(pNo)}
                              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Mbyll Paletën
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ELEMENTS TABLE */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-stone-950/80 text-amber-400/90 font-mono uppercase tracking-wider border-b border-amber-900/40 text-[11px]">
                              <th className="py-3 px-4">#</th>
                              <th className="py-3 px-4">Moduli / Kabina</th>
                              <th className="py-3 px-4">Pozicioni</th>
                              <th className="py-3 px-4">Përmasat (W×H×D mm)</th>
                              <th className="py-3 px-4 text-center">Sasia</th>
                              <th className="py-3 px-4 text-right">Pesha (KG)</th>
                              <th className="py-3 px-4 text-center">Ndrysho Paletën</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-900/20 text-stone-200">
                            {pElements.length > 0 ? (
                              pElements.map((el, idx) => {
                                const breakdown = calculateElementBreakdown(el);
                                return (
                                  <tr key={el.id} className="hover:bg-stone-950/40 transition-colors">
                                    <td className="py-3 px-4 font-mono text-stone-400 font-bold">{idx + 1}</td>
                                    <td className="py-3 px-4 font-bold text-stone-100">{el.name}</td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getPositionBadgeColor(el.position)}`}>
                                        {getPositionShortLabel(el.position)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-stone-300">
                                      {el.widthMm} × {el.heightMm} × {el.depthMm} mm
                                    </td>
                                    <td className="py-3 px-4 text-center font-bold font-mono text-amber-300">
                                      {el.quantity}x
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-black text-amber-400">
                                      {breakdown.totalLineKg} kg
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <select
                                        value={el.palletNumber || 1}
                                        onChange={(e) => handleAssignElementToPallet(el.id, Number(e.target.value))}
                                        className="bg-stone-950 border border-amber-700/60 text-amber-300 font-bold text-xs rounded-xl px-2 py-1 outline-none cursor-pointer"
                                      >
                                        {customPallets.map(num => (
                                          <option key={num} value={num} className="bg-stone-900 text-white font-bold">
                                            📦 Paleta #{num}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-stone-500 font-medium">
                                  Nuk ka modula të caktuara në Paletën #{pNo}.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {/* SIGN-OFF & PRINT SLIP SUMMARY */}
                <div className="bg-stone-900/90 p-6 rounded-3xl border border-amber-900/50 shadow-xl space-y-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-amber-900/40">
                    <div>
                      <h4 className="text-base font-black text-amber-200">
                        📄 Nënshkrimi & Pranim-Dorëzimi i Transportit
                      </h4>
                      <p className="text-xs text-stone-400 mt-1">
                        Kjo fletë paketimi shoqëron transportin fizikisht te klienti. Verifikoni peshat para ngarkimit.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-stone-950 px-4 py-2 rounded-2xl border border-amber-800/40 font-mono text-xs">
                      <span className="text-stone-400">Gjithsej Paleta: <strong className="text-amber-400">{customPallets.length}</strong></span>
                      <span className="text-stone-600">|</span>
                      <span className="text-stone-400">Pesha Totale: <strong className="text-emerald-400">{projectSummary.grandTotalKg} KG</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="p-4 bg-stone-950 rounded-2xl border border-amber-900/40 space-y-3">
                      <span className="text-xs font-bold text-amber-300 block uppercase tracking-wider">
                        🚛 Nënshkrimi i Transportuesit / Driver Sign:
                      </span>
                      <div className="h-16 border-2 border-dashed border-stone-800 rounded-xl flex items-center justify-center text-stone-600 text-xs italic font-mono">
                        (Nënshkruaj fizikisht pas printimit)
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono">
                        Mori në dorëzim: ______________________
                      </div>
                    </div>

                    <div className="p-4 bg-stone-950 rounded-2xl border border-amber-900/40 space-y-3">
                      <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
                        🏠 Pranimi nga Klienti / Client Sign-off:
                      </span>
                      <div className="h-16 border-2 border-dashed border-stone-800 rounded-xl flex items-center justify-center text-stone-600 text-xs italic font-mono">
                        (Nënshkruaj fizikisht në dorëzim)
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono">
                        Pranoi pa vërejtje: ______________________
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: VISUAL DRAG-AND-DROP BOARD VIEW */}
            {palletSubView === 'board' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {customPallets.map(pNo => {
                  const pElements = kitchenElements.filter(el => {
                    const matchPallet = (el.palletNumber || 1) === pNo;
                    const matchSearch = !palletSearchQuery || el.name.toLowerCase().includes(palletSearchQuery.toLowerCase());
                    return matchPallet && matchSearch;
                  });
                  const pKg = kitchenElements
                    .filter(el => (el.palletNumber || 1) === pNo)
                    .reduce((sum, el) => sum + calculateElementBreakdown(el).totalLineKg, 0);
                  const isOver = dragOverPalletNo === pNo;
                  const isCompleted = completedPallets.includes(pNo);

                  return (
                    <div
                      key={pNo}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverPalletNo !== pNo) setDragOverPalletNo(pNo);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (dragOverPalletNo === pNo) setDragOverPalletNo(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const elId = e.dataTransfer.getData('text/plain') || draggedElementId;
                        if (elId) {
                          handleAssignElementToPallet(elId, pNo);
                        }
                        setDragOverPalletNo(null);
                        setDraggedElementId(null);
                      }}
                      className={`rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between p-4 space-y-3 shadow-xl ${
                        isOver 
                          ? 'bg-emerald-950/60 border-emerald-400 ring-4 ring-emerald-500/30 scale-[1.02]' 
                          : isCompleted
                          ? 'bg-stone-950/90 border-emerald-600/50'
                          : 'bg-stone-900/90 border-amber-900/60 hover:border-amber-500/80'
                      }`}
                    >
                      {/* PALLET CARD HEADER */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-900/50">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-stone-950 rounded-xl border border-amber-500/40 text-amber-400 font-mono font-black text-xs">
                              📦 PALETA #{pNo}
                            </span>
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold rounded-full">
                                ✓ E Kryer
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {customPallets.length > 1 && (
                              <button
                                onClick={() => handleRemovePallet(pNo)}
                                className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Fshij këtë paletë"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* WEIGHT & LOAD STATUS */}
                        <div className="flex items-baseline justify-between text-xs font-mono pt-1">
                          <span className="text-stone-400">Pesha:</span>
                          <strong className={`text-sm ${pKg > 350 ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}`}>
                            {pKg.toFixed(1)} <span className="text-xs text-stone-400">/ 350 kg</span>
                          </strong>
                        </div>

                        {/* WEIGHT CAPACITY BAR */}
                        <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              pKg > 350 ? 'bg-rose-500' : pKg > 280 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((pKg / 350) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* DROP TARGET ZONE & ELEMENTS LIST */}
                      <div className="flex-1 min-h-[180px] space-y-2 py-1">
                        {isOver && (
                          <div className="p-3 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-500/20 text-center text-emerald-300 text-xs font-bold animate-pulse">
                            🎯 Lësho këtu për të vendosur te Paleta #{pNo}!
                          </div>
                        )}

                        {pElements.length > 0 ? (
                          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-900">
                            {pElements.map(el => {
                              const breakdown = calculateElementBreakdown(el);
                              return (
                                <div
                                  key={el.id}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', el.id);
                                    setDraggedElementId(el.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedElementId(null);
                                    setDragOverPalletNo(null);
                                  }}
                                  className={`p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing space-y-2 group ${
                                    draggedElementId === el.id
                                      ? 'opacity-40 border-amber-400 bg-stone-950'
                                      : 'bg-stone-950 border-amber-900/50 hover:border-amber-400/80 shadow'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-stone-500 group-hover:text-amber-400 transition-colors shrink-0 font-bold text-xs select-none">
                                        ⋮⋮
                                      </span>
                                      <div>
                                        <span className="font-black text-xs text-stone-100 block truncate">
                                          {el.name}
                                        </span>
                                        <span className="text-[10px] text-stone-400 font-mono block">
                                          {el.widthMm} × {el.heightMm} × {el.depthMm} mm
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-black text-amber-300 text-xs block">
                                        {breakdown.totalLineKg} kg
                                      </span>
                                      <span className="text-[10px] text-stone-400 font-bold">
                                        {el.quantity}x
                                      </span>
                                    </div>
                                  </div>

                                  {/* PALLET SELECT DROPDOWN FOR INSTANT REASSIGNMENT */}
                                  <div className="flex items-center justify-between pt-1 border-t border-amber-900/40 text-[10px]">
                                    <span className="text-stone-400 font-bold">Ndrysho Paletën:</span>
                                    <select
                                      value={el.palletNumber || 1}
                                      onChange={(e) => handleAssignElementToPallet(el.id, Number(e.target.value))}
                                      className="bg-stone-900 border border-emerald-500/60 text-emerald-300 font-bold text-[10px] rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                                    >
                                      {customPallets.map(num => (
                                        <option key={num} value={num} className="bg-stone-900 text-white font-bold">
                                          📦 Paleta #{num}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          !isOver && (
                            <div className="h-full min-h-[150px] flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-amber-900/40 bg-stone-950/40 text-center space-y-2">
                              <Box className="w-7 h-7 text-amber-700 opacity-60" />
                              <p className="text-xs text-stone-500 font-medium max-w-[170px]">
                                Paleta #{pNo} është e zbrazët. Tërhiq modulat këtu ose zgjidh nga meny.
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      {/* CARD FOOTER ACTIONS */}
                      <div className="pt-2 border-t border-amber-900/50 flex items-center justify-between gap-1 text-xs">
                        <button
                          onClick={() => handleAddElementDirectlyToPallet(pNo)}
                          className="px-2.5 py-1 bg-stone-950 hover:bg-amber-950 text-amber-300 hover:text-white border border-amber-800 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-amber-400" /> Shto Modul
                        </button>

                        {isCompleted ? (
                          <button
                            onClick={() => handleReopenPallet(pNo)}
                            className="px-2.5 py-1 bg-stone-950 text-stone-400 hover:text-white border border-stone-800 rounded-xl text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Unlock className="w-3-3 text-amber-400" /> Rihap
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFinishPallet(pNo)}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mbyll #{pNo}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SINGLE CABINET BUILDER & DETAILED CALCULATOR */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Builder Controls Form */}
            <div className="lg:col-span-2 bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-5">
              
              {/* Editing Status Banner */}
              {editingElementId && (
                <div className="bg-amber-500/15 border border-amber-500/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <Edit className="w-4 h-4 text-amber-400" />
                    <span>Po ndryshoni me radhë modulin: <strong className="text-white underline font-black">{builderForm.name}</strong></span>
                  </div>
                  <button
                    onClick={handleCancelEditing}
                    className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-white text-xs font-black rounded-xl border border-amber-500/40 cursor-pointer shadow-sm transition-all flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Anulo (Krijo Modul të Ri)
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-400" /> Ndërtuesi & Regjistruesi i Modulit Standard
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ndërtoni modulin dhe regjistrojeni te "Kërko Elementet me Pesha" ose ndryshoni elementet ekzistuese.
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
                    className={`px-4 py-2 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      editingElementId 
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300/50' 
                        : 'bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950'
                    }`}
                  >
                    {editingElementId ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950" /> Ruaj Ndryshimet te Moduli
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-slate-950" /> Shto në Projekt
                      </>
                    )}
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

              {/* Carcase Material */}
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

                    {/* Individual shelf dimension inputs */}
                    <div className="space-y-2 pt-1">
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

            {/* SECTION: ELEMENTET E KRIJUARA NË KËTË PROJEKT */}
            <div className="lg:col-span-3 bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/40 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" /> Elementet e Krijuara me Radhë ({kitchenElements.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Këtu janë të gjitha elementet tuaja. Klikoni "Edito / Ndrysho" në cilindo element për ta ngarkuar te Ndërtuesi i Modulit dhe për ta modifikuar sipas dëshirës.
                  </p>
                </div>
                {kitchenElements.length > 0 && (
                  <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/30">
                    Pesha Totale Projektit: {projectSummary.grandTotalKg} KG
                  </span>
                )}
              </div>

              {kitchenElements.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Nuk keni asnjë element të krijuar ende në këtë projekt.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Përdorni formularin më sipër për të ndërtuar elemente dhe ato do të shfaqen këtu me radhë.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {kitchenElements.map((el, index) => {
                    const breakDown = calculateElementBreakdown(el);
                    const isEditingThis = editingElementId === el.id;

                    return (
                      <div 
                        key={el.id} 
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isEditingThis 
                            ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg' 
                            : 'bg-slate-950 border-indigo-900/50 hover:border-indigo-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                              #{index + 1} • {el.position === 'lart' ? 'Lart' : el.position === 'posht' ? 'Poshtë' : el.position === 'kolone' ? 'Kolonë' : 'Raft'}
                            </span>
                            <h4 className="text-sm font-black text-white leading-tight mt-0.5">{el.name}</h4>
                          </div>
                          <span className="text-xs font-mono font-black text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                            {breakDown.finalUnitKg} kg
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono">
                          <div>
                            <span className="text-slate-500 block text-[9px]">Përmasat:</span>
                            <span className="font-bold text-amber-300">{el.widthMm} × {el.heightMm} × {el.depthMm} mm</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px]">Sasia / Paleta:</span>
                            <span className="font-bold text-slate-200">{el.quantity || 1} copë (Pal: #{el.palletNumber || 1})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px]">Raftat:</span>
                            <span className="font-bold text-indigo-300">{el.numShelves} raft(e)</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px]">Dyer:</span>
                            <span className="font-bold text-indigo-300">{el.numDoors} derë(a)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleSelectElementForEditing(el)}
                            className={`flex-1 py-1.5 px-2 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isEditingThis 
                                ? 'bg-amber-400 text-slate-950 font-black' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            <Edit className="w-3.5 h-3.5" /> {isEditingThis ? 'Në Editim...' : 'Edito / Ndrysho'}
                          </button>

                          <button
                            onClick={() => {
                              const cloned: KitchenElementItem = {
                                ...el,
                                id: `cloned-el-${Date.now()}`,
                                name: `${el.name} (Kopje)`
                              };
                              setKitchenElements(prev => [...prev, cloned]);
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer"
                            title="Dupliko këtë element"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (editingElementId === el.id) handleCancelEditing();
                              setKitchenElements(prev => prev.filter(x => x.id !== el.id));
                            }}
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-xl border border-rose-900/60 cursor-pointer"
                            title="Fshij elementin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: ELEMENTET E RUAJTURA / NDRYSHIME DHE MODIFIKIME */}
        {activeTab === 'elements-edit' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Edit className="w-5 h-5 text-amber-400" /> Elementet e Ruajtura / Ndërhyrje & Ndryshime ({kitchenElements.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Këtu mund të modifikoni drejtpërdrejt përmasat, sasinë, raftat, dyer-t, materialet ose paletën për çdo element të krijuar, ose ta hapni atë te Ndërtuesi i Modulit.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleCancelEditing();
                      setActiveTab('single');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" /> Shto Modul të Ri te Ndërtuesi
                  </button>
                </div>
              </div>

              {kitchenElements.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                  <Edit className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 font-bold">Nuk keni asnjë element të ruajtur në projekt.</p>
                  <p className="text-xs text-slate-500 mt-1">Shtoni ose ndërtoni elemente të reja te "Ndërtuesi i Modulit" dhe ato do të shfaqen këtu për modifikim.</p>
                  <button
                    onClick={() => setActiveTab('single')}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Kalo te Ndërtuesi i Modulit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {kitchenElements.map((el, index) => {
                    const breakdown = calculateElementBreakdown(el);
                    const isInlineEditing = inlineEditId === el.id;
                    const isBuilderEditing = editingElementId === el.id;

                    return (
                      <div 
                        key={el.id} 
                        className={`p-5 rounded-3xl border transition-all ${
                          isInlineEditing 
                            ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-2xl' 
                            : isBuilderEditing
                            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-400 shadow-xl'
                            : 'bg-slate-950 border-indigo-900/60 hover:border-indigo-700'
                        }`}
                      >
                        {/* Header of Item Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-900/40">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-black font-mono text-xs flex items-center justify-center">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-white">{el.name}</h4>
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-800">
                                  {el.position === 'lart' ? 'Kabinë Lart' : el.position === 'posht' ? 'Kabinë Poshtë' : el.position === 'kolone' ? 'Kolonë' : 'Raft'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Përmasat: <strong className="text-amber-300">{el.widthMm} × {el.heightMm} × {el.depthMm} mm</strong> | Paleta: #{el.palletNumber || 1}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                              {breakdown.finalUnitKg} kg / copë (Gjithsej: {breakdown.totalLineKg} kg)
                            </span>

                            {/* Main Action Buttons */}
                            <button
                              onClick={() => handleSelectElementForEditing(el)}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                              title="Ngarko me të gjitha detajet te Ndërtuesi i Modulit"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edito te Ndërtuesi
                            </button>

                            <button
                              onClick={() => {
                                if (isInlineEditing) {
                                  setInlineEditId(null);
                                  setInlineEditForm(null);
                                } else {
                                  setInlineEditId(el.id);
                                  setInlineEditForm({ ...el });
                                }
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer border ${
                                isInlineEditing 
                                  ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' 
                                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <Sliders className="w-3.5 h-3.5" /> {isInlineEditing ? 'Mbyll Ndryshimin' : 'Ndrysho Këtu'}
                            </button>

                            <button
                              onClick={() => {
                                const cloneItem: KitchenElementItem = {
                                  ...el,
                                  id: `cloned-el-${Date.now()}`,
                                  name: `${el.name} (Kopje)`
                                };
                                setKitchenElements(prev => [...prev, cloneItem]);
                              }}
                              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer"
                              title="Dupliko elementin"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (editingElementId === el.id) handleCancelEditing();
                                if (inlineEditId === el.id) {
                                  setInlineEditId(null);
                                  setInlineEditForm(null);
                                }
                                setKitchenElements(prev => prev.filter(x => x.id !== el.id));
                              }}
                              className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-xl border border-rose-900/60 cursor-pointer"
                              title="Fshij elementin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Quick Editor Form (When activated for this item) */}
                        {isInlineEditing && inlineEditForm && (
                          <div className="mt-4 p-4 bg-slate-900/90 rounded-2xl border border-amber-500/50 space-y-4 shadow-inner">
                            <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                                <Edit className="w-4 h-4" /> Ndërhyrje / Modifiko Këtë Element: {el.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setKitchenElements(prev => prev.map(item => item.id === inlineEditForm.id ? inlineEditForm : item));
                                    setInlineEditId(null);
                                    setInlineEditForm(null);
                                  }}
                                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Ruaj Ndryshimet
                                </button>
                                <button
                                  onClick={() => {
                                    setInlineEditId(null);
                                    setInlineEditForm(null);
                                  }}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                                >
                                  Anulo
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {/* Name */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Emri i Modulit:</label>
                                <input
                                  type="text"
                                  value={inlineEditForm.name}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, name: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-xs"
                                />
                              </div>

                              {/* Width */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Gjerësia W (mm):</label>
                                <input
                                  type="number"
                                  value={inlineEditForm.widthMm}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, widthMm: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-bold text-xs"
                                />
                              </div>

                              {/* Height */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Lartësia H (mm):</label>
                                <input
                                  type="number"
                                  value={inlineEditForm.heightMm}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, heightMm: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-bold text-xs"
                                />
                              </div>

                              {/* Depth */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Thellësia D (mm):</label>
                                <input
                                  type="number"
                                  value={inlineEditForm.depthMm}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, depthMm: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-bold text-xs"
                                />
                              </div>

                              {/* Position */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Pozicioni:</label>
                                <select
                                  value={inlineEditForm.position}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, position: e.target.value as any })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-bold"
                                >
                                  <option value="posht">Kabinë Poshtë</option>
                                  <option value="lart">Kabinë Lart</option>
                                  <option value="kolone">Kolonë (High cabinet)</option>
                                  <option value="raft">Raft / Tjetër</option>
                                </select>
                              </div>

                              {/* Carcase Material */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Materiali i Korpusit:</label>
                                <select
                                  value={inlineEditForm.carcaseMaterialId}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, carcaseMaterialId: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-bold"
                                >
                                  {materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.weightPerM2} kg/m²)</option>
                                  ))}
                                </select>
                              </div>

                              {/* Num Shelves */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Numri i Rafteve:</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={12}
                                  value={inlineEditForm.numShelves}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, numShelves: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-1.5 text-indigo-300 font-mono font-bold text-xs"
                                />
                              </div>

                              {/* Num Doors */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Numri i Dyerve:</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={8}
                                  value={inlineEditForm.numDoors}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, numDoors: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-1.5 text-indigo-300 font-mono font-bold text-xs"
                                />
                              </div>

                              {/* Quantity */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Sasia (Copë):</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={inlineEditForm.quantity || 1}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, quantity: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-1.5 text-emerald-300 font-mono font-bold text-xs"
                                />
                              </div>

                              {/* Pallet Number */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Nr. Paletës:</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={inlineEditForm.palletNumber || 1}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, palletNumber: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs"
                                />
                              </div>

                              {/* Hardware weight */}
                              <div>
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">Oskuri / Hardware (kg):</label>
                                <input
                                  type="number"
                                  step={0.1}
                                  value={inlineEditForm.hardwareKg}
                                  onChange={(e) => setInlineEditForm({ ...inlineEditForm, hardwareKg: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Read-Only Specs Breakdown */}
                        {!isInlineEditing && (
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] bg-slate-900/60 p-3 rounded-2xl border border-indigo-900/40 font-mono">
                            <div>
                              <span className="text-slate-500 block text-[9px]">Materiali Korpusit:</span>
                              <span className="font-bold text-slate-200">{materials.find(m=>m.id===el.carcaseMaterialId)?.name || 'Ivericë 18mm'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px]">Raftet ({el.numShelves}):</span>
                              <span className="font-bold text-indigo-300">
                                {el.numShelves === 0 
                                  ? 'Mos përfshij raft' 
                                  : `${el.numShelves} copë (${materials.find(m=>m.id===(el.shelfMaterialId||el.carcaseMaterialId))?.name || '18mm'})`
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px]">Dyert ({el.numDoors}):</span>
                              <span className="font-bold text-amber-300">
                                {el.numDoors === 0 
                                  ? 'Pa dyer' 
                                  : `${el.numDoors} derë (${materials.find(m=>m.id===el.doorMaterialId)?.name || 'MDF'})`
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px]">Shpina & Oskurët:</span>
                              <span className="font-bold text-slate-300">
                                {el.hasBacking ? 'HDF 3mm' : 'Pa shpinë'} + {el.hardwareKg} kg hardver
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                              <th 
                                className="p-3 text-amber-300 font-black"
                                style={{ width: `${moduleColumnWidth}px`, minWidth: `${moduleColumnWidth}px` }}
                              >
                                Emri i Modulit
                              </th>
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

                                  <td 
                                    className="p-3"
                                    style={{ width: `${moduleColumnWidth}px`, minWidth: `${moduleColumnWidth}px` }}
                                  >
                                    <input 
                                      type="text"
                                      value={el.name}
                                      onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, name: e.target.value } : x))}
                                      className="bg-slate-900/60 border border-slate-700/80 rounded-lg px-2 py-1 text-white font-black text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 w-full transition-all"
                                      style={{ minWidth: `${Math.max(100, moduleColumnWidth - 24)}px` }}
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
