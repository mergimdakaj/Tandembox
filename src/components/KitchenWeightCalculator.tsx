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
  LayoutGrid
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

export type ElementPosition = 'lart' | 'posht' | 'kolone' | 'raft_lart' | 'raft_posht';

// Single Cabinet Element Item
export interface KitchenElementItem {
  id: string;
  name: string;
  position: ElementPosition; // Position: Wall, Base, Column, Wall Shelf, Base Shelf
  widthMm: number;  // e.g. 600
  heightMm: number; // e.g. 720
  depthMm: number;  // e.g. 560
  carcaseMaterialId: string;
  
  // Shelves
  numShelves: number;
  shelfMaterialId: string;
  shelfWidthMm?: number;  // Custom shelf width in mm
  shelfDepthMm?: number;  // Custom shelf depth in mm

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

export function KitchenWeightCalculator() {
  const [activeTab, setActiveTab] = useState<'kitchen-project' | 'pallets-view' | 'single' | 'materials-db' | 'saved-projects'>('kitchen-project');

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

  // Kitchen Project Elements List (Persisted in localStorage)
  const [kitchenElements, setKitchenElements] = useState<KitchenElementItem[]>(() => {
    const saved = localStorage.getItem('mergim_kitchen_project_elements');
    return saved ? JSON.parse(saved) : DEFAULT_KITCHEN_ELEMENTS;
  });

  useEffect(() => {
    localStorage.setItem('mergim_kitchen_project_elements', JSON.stringify(kitchenElements));
  }, [kitchenElements]);

  // Saved Projects List (Persisted in localStorage)
  const [savedProjects, setSavedProjects] = useState<SavedKitchenProject[]>(() => {
    const saved = localStorage.getItem('mergim_saved_kitchen_projects');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mergim_saved_kitchen_projects', JSON.stringify(savedProjects));
  }, [savedProjects]);

  // Element List View Filter Mode: 'all' | 'lart' | 'posht' | 'kolone' | 'raft_lart' | 'raft_posht'
  const [filterPosition, setFilterPosition] = useState<'all' | ElementPosition>('all');

  // Single Element Builder Form State
  const [builderForm, setBuilderForm] = useState<KitchenElementItem>({
    id: 'temp-1',
    name: 'Kabinë / Element i Ri',
    position: 'posht',
    widthMm: 600,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
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
    const topBotWidthM = Math.max(0, wM - (2 * tM));
    const topBotArea = 2 * (topBotWidthM * dM);
    const topBotKg = topBotArea * carcaseMat.weightPerM2;
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

    // 3. Raftet (Shelves) - custom or calculated
    if (el.numShelves > 0) {
      const sW = (el.shelfWidthMm && el.shelfWidthMm > 0) ? el.shelfWidthMm : Math.round((wM - (2 * tM)) * 1000);
      const sD = (el.shelfDepthMm && el.shelfDepthMm > 0) ? el.shelfDepthMm : Math.round((dM - 0.02) * 1000);
      const shelfArea = el.numShelves * ((sW / 1000) * (sD / 1000));
      const shelfKg = shelfArea * shelfMat.weightPerM2;

      components.push({
        partName: `${el.numShelves} Raft(e) (${sW}x${sD}mm)`,
        count: el.numShelves,
        widthMm: sW,
        heightMm: sD,
        areaM2: Number(shelfArea.toFixed(3)),
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

    return {
      components,
      calculatedTotalKg: Number(calculatedTotalKg.toFixed(2)),
      finalUnitKg,
      totalLineKg: Number((finalUnitKg * el.quantity).toFixed(2))
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

  // Pallet Distribution Calculation
  const palletSummary = useMemo(() => {
    const palletsMap: Record<number, {
      palletNumber: number;
      totalKg: number;
      elements: { element: KitchenElementItem; lineKg: number; unitKg: number }[];
    }> = {};

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
  }, [kitchenElements, materials]);

  // Displayed elements according to selected filter
  const displayedElements = useMemo(() => {
    if (filterPosition === 'all') return kitchenElements;
    return kitchenElements.filter(el => el.position === filterPosition);
  }, [kitchenElements, filterPosition]);

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
      <div className="max-w-7xl mx-auto space-y-6 print:hidden">
        
        {/* APP TITLE & TOP HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-2xl shadow-lg text-slate-950 font-black">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                LLOGARITËSI I PESHOJAVE TË KUZHINËS & PALETAT
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Përmasat e elementeve (Lart, Poshtë, Kolona, Rafta) dhe shpërndarja në Paleta Euro (80x120 cm).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Printo Fletën e Logjistikës
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
                  ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-lg scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4 text-emerald-300" />
              <span>Paletat (80x120 cm) ({palletSummary.length})</span>
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

        {/* KITCHEN CODE & CLIENT INPUT HEADER */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-900/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <div className="w-full sm:w-48">
              <label className="block text-[10px] uppercase font-black tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Kodi i Kuzhinës:
              </label>
              <input 
                type="text"
                value={kitchenCode}
                onChange={(e) => setKitchenCode(e.target.value)}
                placeholder="e.g. KUZ-2026-001"
                className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-black text-xs outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="w-full flex-1">
              <label className="block text-[10px] uppercase font-black tracking-wider text-indigo-300 mb-1">
                Emri / Klienti i Kuzhinës:
              </label>
              <input 
                type="text"
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                placeholder="e.g. Kuzhina Lisi Villa Prishtinë"
                className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-1.5 text-white font-black text-xs outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleSaveCurrentProject}
              className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Ruaj Projekti me Kod
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

            {/* Quick 1-Click Preset Element Add Bar */}
            <div className="bg-slate-900/90 p-4 rounded-3xl border border-indigo-900/60 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Shto me 1-Klikim (Presete të Shpejta):
                </span>
                <span className="text-[10px] text-slate-400">Kliko mbi çfarëdo elementi për ta shtuar menjëherë te lista</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => handleAddPreset('lart')}
                  className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" /> + Element Lart 60
                </button>

                <button
                  onClick={() => handleAddPreset('posht')}
                  className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" /> + Element Poshtë 60
                </button>

                <button
                  onClick={() => handleAddPreset('kolone')}
                  className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" /> + Kolonë Shpajz 60
                </button>

                <button
                  onClick={() => handleAddPreset('raft_lart')}
                  className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" /> + Raft Lart 60
                </button>

                <button
                  onClick={() => handleAddPreset('raft_posht')}
                  className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" /> + Raft Poshtë 60
                </button>

                <button
                  onClick={() => handleAddPreset('fioka')}
                  className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" /> + Fiokierë Poshtë 80
                </button>

                <button
                  onClick={() => handleAddPreset('lavamani')}
                  className="px-3 py-1.5 bg-teal-950/80 hover:bg-teal-900 border border-teal-800 text-teal-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-400" /> + Element Lavamani 80
                </button>
              </div>
            </div>

            {/* Material Breakdown Bar */}
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-indigo-900/60 shadow-xl space-y-3">
              <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> Ndarja e Peshës sipas Materialit (kg / m²)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {projectSummary.materialBreakdownList.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-white">{m.materialName}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-amber-300 font-mono font-bold text-[10px] border border-indigo-800">
                        {m.percentage}%
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black font-mono text-emerald-400">{m.totalKg} kg</span>
                      <span className="text-[10px] text-slate-400">~{m.areaM2} m²</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORY FILTER TABS & KITCHEN ELEMENTS TABLE */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-4">
              
              {/* Table Header Controls & Filter Buttons */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-indigo-900/40 pb-4">
                
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Box className="w-5 h-5 text-amber-400" /> Lista e Elementeve të Kuzhinës
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Filtroni kategoritë ose ndryshoni përmasat dhe paletat drejtpërdrejt në tabelë.
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
                    <span>Raftat Lart ({projectSummary.wallShelfElements.length})</span>
                  </button>

                  <button
                    onClick={() => setFilterPosition('raft_posht')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                      filterPosition === 'raft_posht'
                        ? 'bg-blue-600 text-white font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Raftat Poshtë ({projectSummary.baseShelfElements.length})</span>
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

              {/* Elements Table */}
              {displayedElements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="bg-slate-950 text-indigo-300 font-black uppercase text-[10px] tracking-wider border-b border-indigo-900/60">
                        <th className="p-3 text-center">Prodhimi</th>
                        <th className="p-3">Kategoria</th>
                        <th className="p-3">Emri i Modulit</th>
                        <th className="p-3">Përmasat WxHxD (mm)</th>
                        <th className="p-3">Rafte (Numri & Përmasa)</th>
                        <th className="p-3">Dyer (Numri & Përmasa)</th>
                        <th className="p-3 text-center">Paleta (80x120)</th>
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

                        return (
                          <tr 
                            key={el.id} 
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

                            {/* Shelves Details */}
                            <td className="p-3 text-[11px]">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-slate-400">Rafte:</span>
                                <input 
                                  type="number"
                                  min={0}
                                  value={el.numShelves}
                                  onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, numShelves: Number(e.target.value) } : x))}
                                  className="w-10 bg-slate-950 border border-slate-700 rounded px-1 text-center font-bold text-white text-xs"
                                />
                              </div>
                              {el.numShelves > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
                                  <span>W:</span>
                                  <input 
                                    type="number" 
                                    placeholder="Auto"
                                    value={el.shelfWidthMm || ''}
                                    onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, shelfWidthMm: Number(e.target.value) || undefined } : x))}
                                    className="w-12 bg-slate-950 border border-indigo-900 rounded px-1 text-center text-amber-300"
                                    title="Gjerësia e raftit"
                                  />
                                  <span>D:</span>
                                  <input 
                                    type="number" 
                                    placeholder="Auto"
                                    value={el.shelfDepthMm || ''}
                                    onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, shelfDepthMm: Number(e.target.value) || undefined } : x))}
                                    className="w-12 bg-slate-950 border border-indigo-900 rounded px-1 text-center text-amber-300"
                                    title="Thellësia e raftit"
                                  />
                                </div>
                              )}
                            </td>

                            {/* Doors Details */}
                            <td className="p-3 text-[11px]">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-slate-400">Dyer:</span>
                                <input 
                                  type="number"
                                  min={0}
                                  value={el.numDoors}
                                  onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, numDoors: Number(e.target.value) } : x))}
                                  className="w-10 bg-slate-950 border border-slate-700 rounded px-1 text-center font-bold text-white text-xs"
                                />
                                <select
                                  value={el.doorMaterialId}
                                  onChange={(e) => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, doorMaterialId: e.target.value } : x))}
                                  className="bg-slate-950 border border-slate-700 text-indigo-300 text-[10px] rounded px-1 py-0.5 outline-none"
                                >
                                  {materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              </div>

                              {el.numDoors > 0 && (
                                <div className="space-y-1 mt-1">
                                  {Array.from({ length: el.numDoors }).map((_, doorIdx) => {
                                    const doorDim = (el.customDoors && el.customDoors[doorIdx]) || {};
                                    const currentW = doorDim.widthMm !== undefined ? doorDim.widthMm : (el.doorWidthMm || '');
                                    const currentH = doorDim.heightMm !== undefined ? doorDim.heightMm : (el.doorHeightMm || '');

                                    return (
                                      <div key={doorIdx} className="flex items-center gap-1 text-[10px] text-amber-300 font-mono">
                                        <span className="text-slate-400 font-bold text-[9px] min-w-[38px]">
                                          {el.numDoors === 1 ? 'Derë:' : `D${doorIdx + 1}:`}
                                        </span>
                                        <span>W:</span>
                                        <input 
                                          type="number" 
                                          placeholder="Auto"
                                          value={currentW}
                                          onChange={(e) => {
                                            const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                            setKitchenElements(prev => prev.map(x => {
                                              if (x.id !== el.id) return x;
                                              const newCustomDoors = [...(x.customDoors || [])];
                                              while (newCustomDoors.length < x.numDoors) {
                                                newCustomDoors.push({ widthMm: x.doorWidthMm, heightMm: x.doorHeightMm });
                                              }
                                              newCustomDoors[doorIdx] = { ...newCustomDoors[doorIdx], widthMm: val };
                                              return { ...x, customDoors: newCustomDoors };
                                            }));
                                          }}
                                          className="w-12 bg-slate-950 border border-amber-900 rounded px-1 text-center text-amber-300"
                                          title={`Gjerësia e derës ${doorIdx + 1}`}
                                        />
                                        <span>H:</span>
                                        <input 
                                          type="number" 
                                          placeholder="Auto"
                                          value={currentH}
                                          onChange={(e) => {
                                            const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                                            setKitchenElements(prev => prev.map(x => {
                                              if (x.id !== el.id) return x;
                                              const newCustomDoors = [...(x.customDoors || [])];
                                              while (newCustomDoors.length < x.numDoors) {
                                                newCustomDoors.push({ widthMm: x.doorWidthMm, heightMm: x.doorHeightMm });
                                              }
                                              newCustomDoors[doorIdx] = { ...newCustomDoors[doorIdx], heightMm: val };
                                              return { ...x, customDoors: newCustomDoors };
                                            }));
                                          }}
                                          className="w-12 bg-slate-950 border border-amber-900 rounded px-1 text-center text-amber-300"
                                          title={`Lartësia e derës ${doorIdx + 1}`}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Pallet Selector (80x120 cm) */}
                            <td className="p-3 text-center">
                              <select
                                value={el.palletNumber || 1}
                                onChange={(e) => {
                                  const pNum = Number(e.target.value);
                                  setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, palletNumber: pNum } : x));
                                }}
                                className="bg-slate-950 border border-emerald-800 text-emerald-300 font-mono font-bold text-xs rounded px-2 py-1 outline-none cursor-pointer"
                              >
                                <option value={1}>Paleta 1</option>
                                <option value={2}>Paleta 2</option>
                                <option value={3}>Paleta 3</option>
                                <option value={4}>Paleta 4</option>
                                <option value={5}>Paleta 5</option>
                                <option value={6}>Paleta 6</option>
                              </select>
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
                                  onClick={() => {
                                    setKitchenElements(prev => prev.filter(x => x.id !== el.id));
                                  }}
                                  className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                                  title="Fshij elementin"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <Box className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs font-medium">
                    Asnjë element në këtë kategori. Përdorni butonin "Shto me 1-klikim" ose ndërtoni modul të ri.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: PALLETS LOGISTICS MANAGEMENT (PALETA 80x120 CM) */}
        {activeTab === 'pallets-view' && (
          <div className="space-y-6">
            
            {/* Header & Controls Bar */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" /> Logjistika e Paletave (80 x 120 cm Euro Paletë)
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Pesha e plotë e kuzhinës është e ndarë sipas paletave për lehtësi gjatë transportit dhe paketimit.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAutoDistributePallets(350)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Auto-Shpërndaj (Max 350kg / Paletë)
                </button>
              </div>
            </div>

            {/* Pallet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {palletSummary.map(p => {
                const maxRecommendedKg = 400;
                const percentage = Math.min(100, Math.round((p.totalKg / maxRecommendedKg) * 100));

                return (
                  <div 
                    key={p.palletNumber} 
                    className="bg-slate-900/90 p-5 rounded-3xl border border-emerald-900/60 shadow-2xl space-y-4 relative overflow-hidden"
                  >
                    {/* Top Pallet Badge & Weight */}
                    <div className="flex items-start justify-between border-b border-indigo-900/40 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                          📦 PALETA #{p.palletNumber} (80x120 cm)
                        </span>
                        <h4 className="text-sm font-black text-white mt-2">
                          {p.elements.length} Element(e) të Ngarkuara
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-emerald-400 block">
                          {p.totalKg.toFixed(1)} KG
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Peshë e plotë</span>
                      </div>
                    </div>

                    {/* Pallet Capacity Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Lapaciteti i Paletës Euro:</span>
                        <span className={p.totalKg > 400 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {p.totalKg.toFixed(0)} / 400 kg ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            p.totalKg > 400 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned Elements List */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-black uppercase text-indigo-300 block">
                        Elementet në Paletën #{p.palletNumber}:
                      </span>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {p.elements.map(item => (
                          <div key={item.element.id} className="p-2 bg-slate-950 rounded-xl border border-indigo-900/40 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white block">{item.element.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.element.widthMm}x{item.element.heightMm}x{item.element.depthMm}mm (x{item.element.quantity})
                              </span>
                            </div>
                            <div className="text-right font-mono font-black text-amber-300 text-xs">
                              {item.lineKg} kg
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 3: SINGLE CABINET BUILDER & DETAILED CALCULATOR */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Builder Controls Form */}
            <div className="lg:col-span-2 bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-400" /> Ndërto Modul te Ri (Konfigurim i Detajuar)
                </h3>

                <button
                  onClick={handleAddBuilderToKitchen}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Shto këtë Element në Projekti
                </button>
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
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Materiali i Korpusit (Ivericë / MDF):</label>
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

    </div>
  );
}
