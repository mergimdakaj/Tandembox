import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Truck, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RefreshCw, 
  Copy, 
  Printer, 
  CheckCircle2, 
  PackageCheck, 
  Layers, 
  Box, 
  Info, 
  Sliders, 
  Sparkles, 
  ShieldAlert,
  Download,
  Share2,
  Database,
  Calculator,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

// Single Cabinet Element Template / Project Item
export interface KitchenElementItem {
  id: string;
  name: string;
  widthMm: number;  // e.g. 600
  heightMm: number; // e.g. 2225
  depthMm: number;  // e.g. 560
  carcaseMaterialId: string;
  numShelves: number;
  shelfMaterialId: string;
  numDoors: number;
  doorMaterialId: string;
  hasBacking: boolean;
  backingMaterialId: string;
  hardwareKg: number; // e.g. 3.5kg for hinges, slides, handles
  quantity: number;
  overrideTotalKg?: number; // Optional manual total override
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

// Initial Sample Kitchen Elements (15-20 typical kitchen units)
const DEFAULT_KITCHEN_ELEMENTS: KitchenElementItem[] = [
  {
    id: 'k-el-1',
    name: 'Kabinë e Lartë Shpajz / Frigorifer',
    widthMm: 600,
    heightMm: 2225,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 4,
    shelfMaterialId: 'mat-iv-18',
    numDoors: 2,
    doorMaterialId: 'mat-mdf-22',
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 4.5,
    quantity: 1
  },
  {
    id: 'k-el-2',
    name: 'Element Baza Lavapjatë 80',
    widthMm: 800,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 1,
    shelfMaterialId: 'mat-iv-18',
    numDoors: 2,
    doorMaterialId: 'mat-mdf-22',
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 2.5,
    quantity: 1
  },
  {
    id: 'k-el-3',
    name: 'Element Baza me 3 Fioka 90',
    widthMm: 900,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 0,
    shelfMaterialId: 'mat-iv-18',
    numDoors: 3, // 3 drawer fronts
    doorMaterialId: 'mat-mdf-22',
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 6.0, // 3 Tandembox drawer slides
    quantity: 1
  },
  {
    id: 'k-el-4',
    name: 'Element Baza Standard 60',
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
    hardwareKg: 1.8,
    quantity: 2
  },
  {
    id: 'k-el-5',
    name: 'Element Baza me Furrë 60',
    widthMm: 600,
    heightMm: 720,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 1,
    shelfMaterialId: 'mat-iv-18',
    numDoors: 0,
    doorMaterialId: 'mat-mdf-22',
    hasBacking: false,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 1.5,
    quantity: 1
  },
  {
    id: 'k-el-6',
    name: 'Element me Varje (Vise) 60',
    widthMm: 600,
    heightMm: 720,
    depthMm: 350,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 2,
    shelfMaterialId: 'mat-iv-18',
    numDoors: 1,
    doorMaterialId: 'mat-mdf-22',
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 1.8,
    quantity: 3
  },
  {
    id: 'k-el-7',
    name: 'Vitrinë Xhami me Varje 80',
    widthMm: 800,
    heightMm: 720,
    depthMm: 350,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 2,
    shelfMaterialId: 'mat-xham-4',
    numDoors: 2,
    doorMaterialId: 'mat-xham-4',
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 3.2,
    quantity: 1
  }
];

export function KitchenWeightCalculator() {
  const [activeTab, setActiveTab] = useState<'single' | 'kitchen-project' | 'materials-db'>('kitchen-project');

  // Materials Database State (Persisted in localStorage)
  const [materials, setMaterials] = useState<WeightMaterial[]>(() => {
    const saved = localStorage.getItem('mergim_weight_materials');
    return saved ? JSON.parse(saved) : DEFAULT_MATERIALS;
  });

  // Save materials to localStorage
  useEffect(() => {
    localStorage.setItem('mergim_weight_materials', JSON.stringify(materials));
  }, [materials]);

  // Kitchen Project Elements List (Persisted in localStorage)
  const [kitchenElements, setKitchenElements] = useState<KitchenElementItem[]>(() => {
    const saved = localStorage.getItem('mergim_kitchen_project_elements');
    return saved ? JSON.parse(saved) : DEFAULT_KITCHEN_ELEMENTS;
  });

  // Save kitchen elements to localStorage
  useEffect(() => {
    localStorage.setItem('mergim_kitchen_project_elements', JSON.stringify(kitchenElements));
  }, [kitchenElements]);

  // Single Element Builder Form State
  const [builderForm, setBuilderForm] = useState<KitchenElementItem>({
    id: 'temp-1',
    name: 'Kabinë e Lartë 600x2225',
    widthMm: 600,
    heightMm: 2225,
    depthMm: 560,
    carcaseMaterialId: 'mat-iv-18',
    numShelves: 3,
    shelfMaterialId: 'mat-iv-18',
    numDoors: 2,
    doorMaterialId: 'mat-mdf-22',
    hasBacking: true,
    backingMaterialId: 'mat-hdf-3',
    hardwareKg: 3.5,
    quantity: 1
  });

  // State for adding a new material
  const [newMatName, setNewMatName] = useState('');
  const [newMatThickness, setNewMatThickness] = useState<number>(18);
  const [newMatWeight, setNewMatWeight] = useState<number>(10);
  const [newMatCategory, setNewMatCategory] = useState<WeightMaterial['category']>('iverice');
  const [editingMatId, setEditingMatId] = useState<string | null>(null);

  // Helper to get material by ID
  const getMaterial = (id: string): WeightMaterial => {
    return materials.find(m => m.id === id) || materials[0] || {
      id: 'fallback',
      name: 'Ivericë 18 mm',
      thicknessMm: 18,
      weightPerM2: 10.5,
      category: 'iverice'
    };
  };

  // Calculate detailed component breakdown for any element
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

    // 1. 2 Anësore (Sides)
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

    // 2. Sipërme & Poshtme (Ceiling & Base)
    const innerWM = Math.max(0, wM - 2 * tM);
    const topBottomArea = 2 * (innerWM * dM);
    const topBottomKg = topBottomArea * carcaseMat.weightPerM2;
    components.push({
      partName: 'Sipërmja & Poshtmja (Tavani/Fundi)',
      count: 2,
      widthMm: Math.round(innerWM * 1000),
      heightMm: el.depthMm,
      areaM2: Number(topBottomArea.toFixed(3)),
      materialName: carcaseMat.name,
      weightPerM2: carcaseMat.weightPerM2,
      totalKg: Number(topBottomKg.toFixed(2))
    });

    // 3. Rafte (Shelves)
    if (el.numShelves > 0) {
      const shelfArea = el.numShelves * (innerWM * (dM - 0.02)); // slightly recessed
      const shelfKg = shelfArea * shelfMat.weightPerM2;
      components.push({
        partName: `${el.numShelves} Rafte`,
        count: el.numShelves,
        widthMm: Math.round(innerWM * 1000),
        heightMm: Math.round((dM - 0.02) * 1000),
        areaM2: Number(shelfArea.toFixed(3)),
        materialName: shelfMat.name,
        weightPerM2: shelfMat.weightPerM2,
        totalKg: Number(shelfKg.toFixed(2))
      });
    }

    // 4. Dyer / Frontet (Doors / Fronts)
    if (el.numDoors > 0) {
      const doorArea = wM * hM;
      const doorKg = doorArea * doorMat.weightPerM2;
      components.push({
        partName: `${el.numDoors} Dyer / Frontet`,
        count: el.numDoors,
        widthMm: Math.round((el.widthMm / el.numDoors) - 3),
        heightMm: el.heightMm - 3,
        areaM2: Number(doorArea.toFixed(3)),
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
        partName: 'Mekanizma, Panta & Dorëza',
        count: 1,
        widthMm: 0,
        heightMm: 0,
        areaM2: 0,
        materialName: 'Hardware Metalik',
        weightPerM2: 0,
        totalKg: el.hardwareKg
      });
    }

    // Calculated base weight
    const calculatedTotalKg = components.reduce((sum, c) => sum + c.totalKg, 0);

    // Use override total if user provided one manually, otherwise calculated
    const finalUnitKg = el.overrideTotalKg !== undefined && el.overrideTotalKg > 0 
      ? el.overrideTotalKg 
      : Number(calculatedTotalKg.toFixed(2));

    return {
      components,
      calculatedTotalKg: Number(calculatedTotalKg.toFixed(2)),
      finalUnitKg,
      totalLineKg: Number((finalUnitKg * el.quantity).toFixed(2))
    };
  };

  // Active builder calculations
  const builderCalculated = calculateElementBreakdown(builderForm);

  // Full Kitchen Project Totals Calculation
  const projectSummary = useMemo(() => {
    let grandTotalKg = 0;
    let totalItemsCount = 0;
    const materialWeightMap: Record<string, { materialName: string; totalKg: number; areaM2: number }> = {};

    kitchenElements.forEach(el => {
      const breakdown = calculateElementBreakdown(el);
      const qty = el.quantity || 1;
      
      grandTotalKg += breakdown.finalUnitKg * qty;
      totalItemsCount += qty;

      // Group weight by material
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
      materialBreakdownList
    };
  }, [kitchenElements, materials]);

  // Handle adding new custom material
  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    const newId = `mat-custom-${Date.now()}`;
    const newMat: WeightMaterial = {
      id: newId,
      name: newMatName.trim(),
      thicknessMm: Number(newMatThickness) || 18,
      weightPerM2: Number(newMatWeight) || 10,
      category: newMatCategory,
      isCustom: true
    };
    setMaterials(prev => [...prev, newMat]);
    setNewMatName('');
  };

  // Update existing material weight
  const handleUpdateMaterialWeight = (id: string, weight: number) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, weightPerM2: weight } : m));
  };

  // Delete material
  const handleDeleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // Add calculated element to Kitchen Project
  const handleAddBuilderToKitchen = () => {
    const newEl: KitchenElementItem = {
      ...builderForm,
      id: `k-el-${Date.now()}`
    };
    setKitchenElements(prev => [...prev, newEl]);
    setActiveTab('kitchen-project');
  };

  // Export Production Report to Viber / Clipboard
  const handleShareReport = () => {
    let msg = `⚖️ RAPORTI I PESHËS DHE LOGJISTIKËS SË KUZHINËS\n`;
    msg += `🏛 MergimGroup Pro Studio | Data: ${new Date().toLocaleDateString()}\n`;
    msg += `------------------------------------------\n`;
    msg += `📦 Numri i Elementeve: ${projectSummary.totalItemsCount} copë\n`;
    msg += `⚖️ PESHA TOTALE E KUZHINËS: ${projectSummary.grandTotalKg} KG\n`;
    msg += `------------------------------------------\n`;
    msg += `📊 NDARJA SIPAS MATERIALEVE:\n`;

    projectSummary.materialBreakdownList.forEach(m => {
      msg += `   • ${m.materialName}: ${m.totalKg} kg (${m.percentage}% | ~${m.areaM2} m²)\n`;
    });

    msg += `------------------------------------------\n`;
    msg += `🚚 REKOMANDIMI PËR TRANSPORT:\n`;
    msg += `   • Rekomandohen ${projectSummary.grandTotalKg > 400 ? '3-4' : '2'} punëtorë për ngarkim/shkarkim.\n`;
    msg += `   • Tipi i mjetit: ${projectSummary.grandTotalKg > 600 ? 'Kamion / Furgon i Madh' : 'Furgon Standard 3.5T'}.\n`;
    msg += `------------------------------------------\n`;
    msg += `✍ Zhvilluar nga Mergim Dakaj (@mergimd1)`;

    navigator.clipboard.writeText(msg);
    window.open(`viber://forward?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="w-full space-y-6 text-white font-sans">
      
      {/* HEADER BAR FOR KITCHEN WEIGHT CALCULATOR */}
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
                Llogaritësi i Peshës së Kuzhinës & Logjistika
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Sistemi profesional për llogaritjen e peshës totale, materialeve (kg/m²) dhe raportit të prodhimit.
            </p>
          </div>
        </div>

        {/* Top Navigation Tabs Switcher */}
        <div className="bg-slate-950 p-1.5 rounded-2xl border border-indigo-900/60 flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('kitchen-project')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'kitchen-project'
                ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-300" />
            <span>Pesha Totale e Kuzhinës ({kitchenElements.length})</span>
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
        </div>
      </div>

      {/* TAB 1: KITCHEN PROJECT TOTAL WEIGHT & PRODUCTION REPORT */}
      {activeTab === 'kitchen-project' && (
        <div className="space-y-6">
          
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
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
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Përllogaritur nga {projectSummary.totalItemsCount} elemente me të gjitha anësoret, dyer, rafte & shpina.
              </p>
            </div>

            {/* Transport & Handling Guidance Card */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                <span className="text-xs font-black uppercase text-indigo-300 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" /> Logjistika & Transporti
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Fuqia punëtore e nevojshme:</span>
                  <strong className="text-white font-black bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    {projectSummary.grandTotalKg > 500 ? '4 Punëtorë' : projectSummary.grandTotalKg > 300 ? '3 Punëtorë' : '2 Punëtorë'}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Mjeti i transportit:</span>
                  <strong className="text-emerald-400 font-bold">
                    {projectSummary.grandTotalKg > 600 ? 'Kamion i Madh / Furgon 5T' : 'Furgon Standard 3.5T'}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Kapaciteti i Varëseve te Muri:</span>
                  <strong className="text-amber-300 font-mono">
                    ~{Math.round(projectSummary.grandTotalKg * 0.45)} kg vise
                  </strong>
                </div>
              </div>
            </div>

            {/* Top Material Heavyweight Card */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                <span className="text-xs font-black uppercase text-indigo-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" /> Materiali Kryesor sipas Peshës
                </span>
              </div>
              {projectSummary.materialBreakdownList.length > 0 ? (
                <div>
                  <div className="text-xl font-black text-amber-300">
                    {projectSummary.materialBreakdownList[0].materialName}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Përbën <strong className="text-white font-mono">{projectSummary.materialBreakdownList[0].percentage}%</strong> të peshës totale ({projectSummary.materialBreakdownList[0].totalKg} kg).
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Asnjë material i regjistruar.</p>
              )}
            </div>

          </div>

          {/* Detailed Material Breakdown Chart / Cards Bar */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Ndarja e Peshës sipas Llojit të Materialit (Ivericë, MDF, Xham, HDF)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {projectSummary.materialBreakdownList.map((m, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-indigo-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-white">{m.materialName}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-amber-300 font-mono font-bold text-[10px] border border-indigo-800">
                      {m.percentage}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-lg font-black font-mono text-emerald-400">{m.totalKg} kg</span>
                    <span className="text-[10px] text-slate-400">~{m.areaM2} m²</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" 
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen Elements List Table */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-amber-400" /> Lista e Elementeve të Kuzhinës ({kitchenElements.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Çdo element përmban llogaritjen automatike të peshës bazuar në përmasat dhe materialet e zgjedhura.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Dërgo në Viber / Raport
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white font-black text-xs rounded-xl border border-indigo-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Printo
                </button>
              </div>
            </div>

            {kitchenElements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="bg-slate-950 text-indigo-300 font-black uppercase text-[10px] tracking-wider border-b border-indigo-900/60">
                      <th className="p-3">#</th>
                      <th className="p-3">Emri i Modulit</th>
                      <th className="p-3">Përmasat (mm)</th>
                      <th className="p-3">Materiali / Dyer / Rafte</th>
                      <th className="p-3 text-center">Sasi</th>
                      <th className="p-3 text-right">Pesha për Njësi (KG)</th>
                      <th className="p-3 text-right">Pesha Totale (KG)</th>
                      <th className="p-3 text-center">Veprime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-900/40 font-medium">
                    {kitchenElements.map((el, idx) => {
                      const breakdown = calculateElementBreakdown(el);
                      const unitKg = breakdown.finalUnitKg;
                      const lineKg = breakdown.totalLineKg;

                      return (
                        <tr key={el.id} className="hover:bg-indigo-950/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-500">{idx + 1}</td>
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
                          <td className="p-3 font-mono text-amber-300 font-bold">
                            {el.widthMm} x {el.heightMm} x {el.depthMm} mm
                          </td>
                          <td className="p-3 text-[11px] text-slate-400">
                            <div>Kaça: <strong className="text-indigo-300">{getMaterial(el.carcaseMaterialId).name}</strong></div>
                            <div>Dyer: <strong className="text-amber-300">{el.numDoors}x {getMaterial(el.doorMaterialId).name}</strong> | Rafte: {el.numShelves}</div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-indigo-900">
                              <button
                                onClick={() => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}
                                className="text-slate-400 hover:text-white font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono font-black text-white text-xs">{el.quantity}</span>
                              <button
                                onClick={() => setKitchenElements(prev => prev.map(x => x.id === el.id ? { ...x, quantity: x.quantity + 1 } : x))}
                                className="text-slate-400 hover:text-white font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          {/* Unit weight & manual override input */}
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
                                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-xs text-amber-300 font-black font-mono"
                                title="Klikoni për të ndryshuar peshën totale me dorë"
                              />
                              <span className="text-[10px] text-slate-400">kg</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                            {lineKg} kg
                          </td>
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
                      <td colSpan={6} className="p-4 text-right text-sm uppercase tracking-wider text-amber-300">
                        PESHA TOTALE E KUZHINËS:
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
                  Asnjë element në projekt. Klikoni "Krijo Element / Template" për të shtuar elementet tuaja!
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: SINGLE ELEMENT TEMPLATE BUILDER & DETAILED CALCULATOR */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-5 bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
              <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Përmasat & Konfigurimi i Modulit
              </h3>
            </div>

            {/* Element Name */}
            <div>
              <label className="block text-slate-300 mb-1 text-xs font-bold">Emri i Modulit / Template-it:</label>
              <input 
                type="text"
                value={builderForm.name}
                onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>

            {/* Dimensions (W x H x D mm) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Gjerësia (W):</label>
                <input 
                  type="number"
                  value={builderForm.widthMm}
                  onChange={(e) => setBuilderForm({ ...builderForm, widthMm: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-mono font-black text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Lartësia (H):</label>
                <input 
                  type="number"
                  value={builderForm.heightMm}
                  onChange={(e) => setBuilderForm({ ...builderForm, heightMm: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-mono font-black text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Thellësia (D):</label>
                <input 
                  type="number"
                  value={builderForm.depthMm}
                  onChange={(e) => setBuilderForm({ ...builderForm, depthMm: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-mono font-black text-xs text-center"
                />
              </div>
            </div>

            {/* Material selector for Carcase */}
            <div>
              <label className="block text-indigo-300 mb-1 text-xs font-bold">Materiali i Kaçës / Mureve:</label>
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

            {/* Shelves count & Material */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Numri i Rafteve:</label>
                <input 
                  type="number"
                  min={0}
                  value={builderForm.numShelves}
                  onChange={(e) => setBuilderForm({ ...builderForm, numShelves: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Materiali i Rafteve:</label>
                <select
                  value={builderForm.shelfMaterialId}
                  onChange={(e) => setBuilderForm({ ...builderForm, shelfMaterialId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white font-bold text-xs cursor-pointer"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Doors count & Material */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Numri i Dyerve / Frontet:</label>
                <input 
                  type="number"
                  min={0}
                  value={builderForm.numDoors}
                  onChange={(e) => setBuilderForm({ ...builderForm, numDoors: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 text-[10px] font-bold">Materiali i Dyerve:</label>
                <select
                  value={builderForm.doorMaterialId}
                  onChange={(e) => setBuilderForm({ ...builderForm, doorMaterialId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white font-bold text-xs cursor-pointer"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Backing HDF Checkbox & Material */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Shpina (Backing Panel)</span>
                <input 
                  type="checkbox"
                  checked={builderForm.hasBacking}
                  onChange={(e) => setBuilderForm({ ...builderForm, hasBacking: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              {builderForm.hasBacking && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Materiali i Shpinës:</label>
                  <select
                    value={builderForm.backingMaterialId}
                    onChange={(e) => setBuilderForm({ ...builderForm, backingMaterialId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold cursor-pointer"
                  >
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Hardware extra kg */}
            <div>
              <label className="block text-slate-400 mb-1 text-[10px] font-bold">
                Pesha e Mekanizmave / Hardware (KG):
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

          {/* Right Column: Calculations & Interactive 2D Schematic */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Element Calculated Total Badge */}
            <div className="bg-gradient-to-r from-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-900/60 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  REZULTATI I LLOGARITJES
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {builderForm.name}
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

            {/* Detailed Component Breakdown Cards */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
              <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> Llogaritja sipas Pjesëve (Components Breakdown)
              </h4>

              <div className="space-y-2.5 text-xs">
                {builderCalculated.components.map((comp, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-indigo-900/50 flex items-center justify-between">
                    <div>
                      <span className="font-black text-white block">{comp.partName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Materiali: <strong className="text-indigo-300">{comp.materialName}</strong> ({comp.weightPerM2} kg/m²)
                        {comp.areaM2 > 0 && ` | ~${comp.areaM2} m²`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-amber-300 text-sm">{comp.totalKg} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2D Visual Cabinet Schematic Diagram */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl flex flex-col items-center space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Diagrami Skematik i Modulit 2D (Front & Side)
              </span>

              <svg className="w-full max-w-[320px] h-[220px]" viewBox="0 0 320 220" fill="none">
                {/* Cabinet Outer Carcase Frame */}
                <rect x="60" y="20" width="120" height="180" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                
                {/* Internal Shelves lines */}
                {Array.from({ length: builderForm.numShelves }).map((_, i) => {
                  const yStep = 180 / (builderForm.numShelves + 1);
                  const yPos = 20 + yStep * (i + 1);
                  return (
                    <line key={i} x1="64" y1={yPos} x2="176" y2={yPos} stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" />
                  );
                })}

                {/* Doors outline */}
                {builderForm.numDoors > 0 && (
                  <rect x="62" y="22" width="116" height="176" rx="2" fill="rgba(251, 191, 36, 0.1)" stroke="#f59e0b" strokeWidth="1.5" />
                )}

                {/* Side Depth View */}
                <rect x="210" y="20" width="50" height="180" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                <text x="235" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 235 115)">
                  Thellësia {builderForm.depthMm}mm
                </text>

                {/* Labels */}
                <text x="120" y="15" fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  W: {builderForm.widthMm}mm
                </text>
                <text x="45" y="115" fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 45 115)">
                  H: {builderForm.heightMm}mm
                </text>
              </svg>
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
              <Plus className="w-4 h-4" /> Shto Material të Ri në Baze (pesha kg/m²)
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
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow transition-all cursor-pointer"
                >
                  + Ruaj Materialin
                </button>
              </div>
            </div>
          </div>

          {/* Existing Materials List Table */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
              <h3 className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" /> Baza e Materialeve Aktuale ({materials.length})
              </h3>

              <button
                onClick={() => {
                  setMaterials(DEFAULT_MATERIALS);
                  localStorage.removeItem('mergim_weight_materials');
                }}
                className="text-[10px] text-slate-400 hover:text-white underline font-bold"
              >
                Rikthe Materialet Standarde
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {materials.map(m => (
                <div key={m.id} className="p-4 bg-slate-950 rounded-2xl border border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-xs">{m.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.thicknessMm}mm</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Pesha për m²:</span>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        step="0.1"
                        value={m.weightPerM2}
                        onChange={(e) => handleUpdateMaterialWeight(m.id, Number(e.target.value) || 0)}
                        className="w-20 bg-slate-900 border border-amber-500/80 rounded px-2 py-1 text-right text-amber-300 font-mono font-black text-xs"
                      />
                      <span className="text-xs font-bold text-amber-400">kg/m²</span>
                    </div>
                  </div>

                  {m.isCustom && (
                    <button
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 pt-1 block font-bold"
                    >
                      Fshij Materialin
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
