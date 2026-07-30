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
  FileSpreadsheet
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

// Single Cabinet Element Item
export interface DoorDimension {
  widthMm?: number;
  heightMm?: number;
}

export interface KitchenElementItem {
  id: string;
  name: string;
  position: 'lart' | 'posht'; // Position: Wall vs Base
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

// Initial Preset Kitchen Elements (Separated into Wall & Base elements)
const DEFAULT_KITCHEN_ELEMENTS: KitchenElementItem[] = [
  {
    id: 'k-el-1',
    name: 'Kabinë e Lartë Shpajz / Frigorifer',
    position: 'lart',
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
    isCompleted: false
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
    isCompleted: true
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
    isCompleted: false
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
    isCompleted: false
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
    isCompleted: true
  },
  {
    id: 'k-el-6',
    name: 'Element Baza Standard 60 (Poshtë)',
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
    hardwareKg: 1.8,
    quantity: 2,
    isCompleted: false
  }
];

export function KitchenWeightCalculator() {
  const [activeTab, setActiveTab] = useState<'single' | 'kitchen-project' | 'materials-db' | 'saved-projects'>('kitchen-project');

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

  // Element List View Filter Mode: 'all' | 'lart' | 'posht'
  const [filterPosition, setFilterPosition] = useState<'all' | 'lart' | 'posht'>('all');

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
    isCompleted: false
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

    // 1. 2 Anësore (Carcase Sides)
    const sidesArea = 2 * (hM * dM);
    const sidesKg = sidesArea * carcaseMat.weightPerM2;
    components.push({
      partName: '2 Anësore (Muret)',
      count: 2,
      widthMm: el.depthMm,
      heightMm: el.heightMm,
      areaM2: Number(sidesArea.toFixed(3)),
      materialName: carcaseMat.name,
      weightPerM2: carcaseMat.weightPerM2,
      totalKg: Number(sidesKg.toFixed(2))
    });

    // 2. Sipërme & Poshtme (Carcase Ceiling & Base)
    const innerWM = Math.max(0, wM - 2 * tM);
    const topBottomArea = 2 * (innerWM * dM);
    const topBottomKg = topBottomArea * carcaseMat.weightPerM2;
    components.push({
      partName: 'Sipërmja & Poshtmja (Tavani & Fundi)',
      count: 2,
      widthMm: Math.round(innerWM * 1000),
      heightMm: el.depthMm,
      areaM2: Number(topBottomArea.toFixed(3)),
      materialName: carcaseMat.name,
      weightPerM2: carcaseMat.weightPerM2,
      totalKg: Number(topBottomKg.toFixed(2))
    });

    // 3. Rafte (Shelves) - custom or calculated dimensions
    if (el.numShelves > 0) {
      const sW = (el.shelfWidthMm && el.shelfWidthMm > 0) ? el.shelfWidthMm : Math.round(innerWM * 1000);
      const sD = (el.shelfDepthMm && el.shelfDepthMm > 0) ? el.shelfDepthMm : Math.round((dM - 0.02) * 1000);
      
      const shelfArea = el.numShelves * ((sW / 1000) * (sD / 1000));
      const shelfKg = shelfArea * shelfMat.weightPerM2;

      components.push({
        partName: `${el.numShelves} Rafte (${sW}x${sD}mm)`,
        count: el.numShelves,
        widthMm: sW,
        heightMm: sD,
        areaM2: Number(shelfArea.toFixed(3)),
        materialName: shelfMat.name,
        weightPerM2: shelfMat.weightPerM2,
        totalKg: Number(shelfKg.toFixed(2))
      });
    }

    // 4. Dyer / Frontet (Doors) - custom or calculated dimensions per door
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

    // 5. Shpina HDF (Backing Panel)
    if (el.hasBacking) {
      const backArea = wM * hM;
      const backKg = backArea * backingMat.weightPerM2;
      components.push({
        partName: 'Shpina (Backing)',
        count: 1,
        widthMm: el.widthMm,
        heightMm: el.heightMm,
        areaM2: Number(backArea.toFixed(3)),
        materialName: backingMat.name,
        weightPerM2: backingMat.weightPerM2,
        totalKg: Number(backKg.toFixed(2))
      });
    }

    // 6. Hardware (Panta / Mekanizma / Dorëza)
    if (el.hardwareKg > 0) {
      components.push({
        partName: 'Mekanizma & Hardware',
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

  // Full Project Totals & Filtered Lists
  const projectSummary = useMemo(() => {
    let grandTotalKg = 0;
    let totalItemsCount = 0;
    let completedItemsCount = 0;

    const materialWeightMap: Record<string, { materialName: string; totalKg: number; areaM2: number }> = {};

    kitchenElements.forEach(el => {
      const breakdown = calculateElementBreakdown(el);
      const qty = el.quantity || 1;
      
      grandTotalKg += breakdown.finalUnitKg * qty;
      totalItemsCount += qty;
      if (el.isCompleted) {
        completedItemsCount += qty;
      }

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

    const wallElements = kitchenElements.filter(el => el.position === 'lart');
    const baseElements = kitchenElements.filter(el => el.position === 'posht');

    return {
      grandTotalKg: Number(grandTotalKg.toFixed(1)),
      totalItemsCount,
      completedItemsCount,
      materialBreakdownList,
      wallElements,
      baseElements
    };
  }, [kitchenElements, materials]);

  // Displayed elements according to selected filter ('all' | 'lart' | 'posht')
  const displayedElements = useMemo(() => {
    if (filterPosition === 'lart') return kitchenElements.filter(el => el.position === 'lart');
    if (filterPosition === 'posht') return kitchenElements.filter(el => el.position === 'posht');
    return kitchenElements;
  }, [kitchenElements, filterPosition]);

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

  // Share / Print Report
  const handleShareReport = () => {
    let msg = `⚖️ RAPORTI I PESHËS & PRODHIMIT TË KUZHINËS\n`;
    msg += `🏛 MergimGroup Pro Studio | Kodi: ${kitchenCode}\n`;
    msg += `📌 Emri: ${kitchenName}\n`;
    msg += `Data: ${new Date().toLocaleDateString()}\n`;
    msg += `------------------------------------------\n`;
    msg += `📦 Numri i Elementeve: ${projectSummary.totalItemsCount} copë (${projectSummary.completedItemsCount} Kompletuar në Prodhim)\n`;
    msg += `⚖️ PESHA TOTALE E KUZHINËS: ${projectSummary.grandTotalKg} KG\n`;
    msg += `------------------------------------------\n`;
    msg += `📊 NDARJA SIPAS MATERIALEVE:\n`;

    projectSummary.materialBreakdownList.forEach(m => {
      msg += `   • ${m.materialName}: ${m.totalKg} kg (${m.percentage}% | ~${m.areaM2} m²)\n`;
    });

    msg += `------------------------------------------\n`;
    msg += `✍ Zhvilluar nga Mergim Dakaj (@mergimd1)`;

    navigator.clipboard.writeText(msg);
    window.open(`viber://forward?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="w-full space-y-6 text-white font-sans">
      
      {/* HEADER BAR FOR KITCHEN WEIGHT & PRODUCTION MANAGEMENT */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl border border-indigo-900/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                PRO MODULE
              </span>
              <h2 className="text-lg font-black text-white tracking-tight">
                Llogaritësi i Peshës së Kuzhinës & Prodhimi
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Ndarja e elementeve Lart/Poshtë, kontrolli i kompletimit në prodhim dhe bazat e materialeve.
            </p>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="bg-slate-950 p-1.5 rounded-2xl border border-indigo-900/60 flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('kitchen-project')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'kitchen-project'
                ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4 text-emerald-300" />
            <span>Elementet e Kuzhinës ({kitchenElements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'single'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-300" />
            <span>Krijo Element / Template</span>
          </button>

          <button
            onClick={() => setActiveTab('materials-db')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'materials-db'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Baza e Materialeve ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved-projects')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'saved-projects'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-cyan-200" />
            <span>Projekte të Ruajtura ({savedProjects.length})</span>
          </button>
        </div>
      </div>

      {/* KITCHEN CODE & NAME PROJECT HEADER INPUTS */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Grand Total Weight Card */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 rounded-3xl border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                  ⚖️ PESHA TOTALE E KUZHINËS
                </span>
                <Scale className="w-6 h-6 text-amber-400" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white font-mono tracking-tight">
                  {projectSummary.grandTotalKg}
                </span>
                <span className="text-lg font-black text-amber-400">KG</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs font-medium text-slate-400">
                <span>📦 Gjithsej: <strong className="text-white font-mono">{projectSummary.totalItemsCount} elemente</strong></span>
                <span>• Lart: <strong className="text-indigo-300 font-mono">{projectSummary.wallElements.length}</strong></span>
                <span>• Poshtë: <strong className="text-emerald-300 font-mono">{projectSummary.baseElements.length}</strong></span>
              </div>
            </div>

            {/* Production Completion Status Card */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                <span className="text-xs font-black uppercase text-indigo-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Statusi i Prodhimit & Kompletimi
                </span>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {projectSummary.completedItemsCount} / {projectSummary.totalItemsCount} Kompletuar
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-indigo-900/60 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${projectSummary.totalItemsCount > 0 
                      ? (projectSummary.completedItemsCount / projectSummary.totalItemsCount) * 100 
                      : 0}%` 
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Përqindja e kryer: <strong className="text-white font-mono">{projectSummary.totalItemsCount > 0 ? Math.round((projectSummary.completedItemsCount / projectSummary.totalItemsCount) * 100) : 0}%</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSelectAll(true)}
                    className="text-[10px] text-emerald-400 hover:underline font-bold"
                  >
                    Kompleto të Gjitha
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => handleToggleSelectAll(false)}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    Reseto Statusin
                  </button>
                </div>
              </div>
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

          {/* FILTER TABS & KITCHEN ELEMENTS TABLE */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-4">
            
            {/* Table Header Controls & Filter Buttons */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-indigo-900/40 pb-4">
              
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-amber-400" /> Lista e Elementeve të Kuzhinës
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Zgjidhni kategorinë (Elementet Lart / Poshtë) ose selektoni statusin e prodhimit.
                </p>
              </div>

              {/* Category Filter Tabs (Të Gjitha / Elementet Lart / Elementet Poshtë) */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-indigo-900/80 w-full lg:w-auto">
                <button
                  onClick={() => setFilterPosition('all')}
                  className={`flex-1 lg:flex-none px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    filterPosition === 'all'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Të Gjitha ({kitchenElements.length})</span>
                </button>

                <button
                  onClick={() => setFilterPosition('lart')}
                  className={`flex-1 lg:flex-none px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    filterPosition === 'lart'
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Elementet Lart ({projectSummary.wallElements.length})</span>
                </button>

                <button
                  onClick={() => setFilterPosition('posht')}
                  className={`flex-1 lg:flex-none px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    filterPosition === 'posht'
                      ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Elementet Poshtë ({projectSummary.baseElements.length})</span>
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
                      <th className="p-3">Dyer (Numri, Mat & Përmasa)</th>
                      <th className="p-3 text-center">Sasi</th>
                      <th className="p-3 text-right">Pesha per Njësi (KG)</th>
                      <th className="p-3 text-right">Pesha Totale</th>
                      <th className="p-3 text-center">Veprime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-900/40 font-medium">
                    {displayedElements.map((el, idx) => {
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

                          {/* Position Switcher: Lart / Poshtë */}
                          <td className="p-3">
                            <select
                              value={el.position}
                              onChange={(e) => {
                                const val = e.target.value as 'lart' | 'posht';
                                setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, position: val } : x));
                              }}
                              className={`text-[10px] font-black uppercase px-2 py-1 rounded border outline-none cursor-pointer ${
                                el.position === 'lart' 
                                  ? 'bg-amber-950 text-amber-300 border-amber-800' 
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              }`}
                            >
                              <option value="lart">Lart (Vise)</option>
                              <option value="posht">Poshtë (Baza)</option>
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

                          {/* Shelves Details: Count & Custom Dimensions */}
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

                          {/* Doors Details: Count, Material & Custom Dimensions */}
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

                          {/* Unit Weight & Manual Override */}
                          <td className="p-3 text-right font-mono">
                            <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number"
                                step="0.1"
                                value={el.overrideTotalKg !== undefined ? el.overrideTotalKg : unitKg}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, overrideTotalKg: val } : x));
                                }}
                                className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-right text-xs text-amber-300 font-black font-mono"
                                title="Klikoni për të ndryshuar peshën me dorë"
                              />
                              <span className="text-[10px] text-slate-400">kg</span>
                            </div>
                          </td>

                          {/* Total Line Weight */}
                          <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                            {lineKg} kg
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setKitchenElements(prev => prev.filter(x => x.id !== el.id))}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Fshij elementin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950 font-black text-white border-t-2 border-amber-500/50">
                      <td colSpan={8} className="p-4 text-right text-sm uppercase tracking-wider text-amber-300">
                        PESHA TOTALE E KUZHINËS ({kitchenCode}):
                      </td>
                      <td className="p-4 text-right font-mono text-lg text-emerald-400 font-black">
                        {projectSummary.grandTotalKg} KG
                      </td>
                      <td className="p-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <Box className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-xs font-medium">
                  Asnjë element në kategorinë e zgjedhur. Klikoni "Krijo Element / Template" për të shtuar!
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: TEMPLATE BUILDER FOR SINGLE ELEMENT */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Controls */}
          <div className="lg:col-span-6 bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
              <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Konfigurimi i Modulit / Elementit
              </h3>
            </div>

            {/* Name & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 mb-1 text-xs font-bold">Emri i Elementit:</label>
                <input 
                  type="text"
                  value={builderForm.name}
                  onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-xs font-bold">Lloji i Elementit:</label>
                <select
                  value={builderForm.position}
                  onChange={(e) => setBuilderForm({ ...builderForm, position: e.target.value as 'lart' | 'posht' })}
                  className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-amber-300 font-bold text-xs outline-none cursor-pointer"
                >
                  <option value="lart">Lart (Vise)</option>
                  <option value="posht">Poshtë (Baza)</option>
                </select>
              </div>
            </div>

            {/* Cabinet Outer Dimensions W x H x D */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Gjerësia W (mm):</label>
                <input 
                  type="number"
                  value={builderForm.widthMm}
                  onChange={(e) => setBuilderForm({ ...builderForm, widthMm: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-mono font-black text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Lartësia H (mm):</label>
                <input 
                  type="number"
                  value={builderForm.heightMm}
                  onChange={(e) => setBuilderForm({ ...builderForm, heightMm: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-mono font-black text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Thellësia D (mm):</label>
                <input 
                  type="number"
                  value={builderForm.depthMm}
                  onChange={(e) => setBuilderForm({ ...builderForm, depthMm: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-mono font-black text-xs text-center"
                />
              </div>
            </div>

            {/* Carcase Material */}
            <div>
              <label className="block text-indigo-300 mb-1 text-xs font-bold">Materiali i Kaçës / Mureve (kg/m²):</label>
              <select
                value={builderForm.carcaseMaterialId}
                onChange={(e) => setBuilderForm({ ...builderForm, carcaseMaterialId: e.target.value })}
                className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none cursor-pointer"
              >
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.weightPerM2} kg/m²)
                  </option>
                ))}
              </select>
            </div>

            {/* Shelves Details */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/60 space-y-3">
              <span className="text-xs font-bold text-indigo-300 block">Konfigurimi i Rafteve</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1 font-bold">Numri i Rafteve:</label>
                  <input 
                    type="number"
                    min={0}
                    value={builderForm.numShelves}
                    onChange={(e) => setBuilderForm({ ...builderForm, numShelves: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1 font-bold">Materiali i Rafteve:</label>
                  <select
                    value={builderForm.shelfMaterialId}
                    onChange={(e) => setBuilderForm({ ...builderForm, shelfMaterialId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-bold text-xs cursor-pointer"
                  >
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {builderForm.numShelves > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Gjerësia e Raftit (W mm):</label>
                    <input 
                      type="number"
                      placeholder="Auto inner width"
                      value={builderForm.shelfWidthMm || ''}
                      onChange={(e) => setBuilderForm({ ...builderForm, shelfWidthMm: Number(e.target.value) || undefined })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-amber-300 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Thellësia e Raftit (D mm):</label>
                    <input 
                      type="number"
                      placeholder="Auto inner depth"
                      value={builderForm.shelfDepthMm || ''}
                      onChange={(e) => setBuilderForm({ ...builderForm, shelfDepthMm: Number(e.target.value) || undefined })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-amber-300 font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Doors Details */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/60 space-y-3">
              <span className="text-xs font-bold text-amber-300 block">Konfigurimi i Dyerve / Frontet</span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1 font-bold">Numri i Dyerve / Frontet:</label>
                  <input 
                    type="number"
                    min={0}
                    value={builderForm.numDoors}
                    onChange={(e) => setBuilderForm({ ...builderForm, numDoors: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1 font-bold">Materiali i Dyerve:</label>
                  <select
                    value={builderForm.doorMaterialId}
                    onChange={(e) => setBuilderForm({ ...builderForm, doorMaterialId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-bold text-xs cursor-pointer"
                  >
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
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
                      <div key={doorIdx} className="p-2.5 bg-slate-900 rounded-xl border border-indigo-900/50 space-y-1">
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
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs"
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
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Backing Panel HDF */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Shpina HDF (Backing Panel):</span>
              <input 
                type="checkbox"
                checked={builderForm.hasBacking}
                onChange={(e) => setBuilderForm({ ...builderForm, hasBacking: e.target.checked })}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Hardware extra weight */}
            <div>
              <label className="block text-slate-400 mb-1 text-[10px] font-bold">
                Pesha e Mekanizmave & Hardware (KG):
              </label>
              <input 
                type="number"
                step="0.5"
                value={builderForm.hardwareKg}
                onChange={(e) => setBuilderForm({ ...builderForm, hardwareKg: Number(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-xs"
              />
            </div>

            <button
              onClick={handleAddBuilderToKitchen}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Shto këtë Element në Kuzhinë
            </button>
          </div>

          {/* Component Breakdown & 2D Schematic Preview */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Total Badge */}
            <div className="bg-gradient-to-r from-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-900/60 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  REZULTATI I LLOGARITJES
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {builderForm.name} ({builderForm.position === 'lart' ? 'Lart' : 'Poshtë'})
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {builderForm.widthMm} x {builderForm.heightMm} x {builderForm.depthMm} mm
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">PESHA TOTALE:</span>
                <span className="text-3xl font-black font-mono text-emerald-400">
                  {builderCalculated.calculatedTotalKg} KG
                </span>
              </div>
            </div>

            {/* Component list */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-3">
              <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> Ndarja sipas Komponentëve
              </h4>

              <div className="space-y-2 text-xs">
                {builderCalculated.components.map((comp, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/50 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white block">{comp.partName}</span>
                      <span className="text-[10px] text-slate-400">
                        {comp.materialName} ({comp.weightPerM2} kg/m²) {comp.areaM2 > 0 && `| ~${comp.areaM2} m²`}
                      </span>
                    </div>

                    <div className="font-mono font-black text-amber-300 text-sm">
                      {comp.totalKg} kg
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: CUSTOM MATERIALS DATABASE (KG/M²) */}
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

      {/* TAB 4: SAVED KITCHEN PROJECTS LIBRARY */}
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
  );
}
