import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ArrowLeft, Plus, Trash2, Edit3, Layers, Box, Cpu, 
  FileText, ShoppingBag, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  Settings, Calculator, RefreshCw, Printer, Download, Share2, 
  Maximize2, ChevronRight, Wand2, ShieldCheck, Check, DollarSign,
  Grid, MoveHorizontal, HardDrive, PackageCheck
} from 'lucide-react';
import { LOGO_DATA_URL } from '../assets/logo';

export interface CabinetElement {
  id: string;
  name: string;
  type: 'base' | 'wall' | 'tall' | 'appliance' | 'corner';
  width: number;  // cm
  height: number; // cm
  depth: number;  // cm
  materialThickness: number; // mm (18, 25)
  drawerSystem: 'Tandembox' | 'Antaro' | 'Nova Pro' | 'Sistem Standard';
  drawerCount: number;
  frontMaterial: 'MDF' | 'Ivericë' | 'Dru' | 'Profile Alumini';
  applianceType?: 'lavapjate' | 'furre' | 'frigorifer' | 'lavastovilje' | 'kend' | 'standard';
  xPosition?: number; // cm along wall
  wallIndex: 'A' | 'B';
}

export interface CutPart {
  id: string;
  elementName: string;
  partName: string; // e.g. "2 Anësore", "1 Fund", "1 Kapak", "1 Shpinë", "Ballina", "Fijokë"
  width: number;  // mm
  height: number; // mm
  quantity: number;
  material: string;
  edgeBanding: string;
}

export interface ProjectData {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  date: string;
  projectType: 'Kuzhinë' | 'Garderobë' | 'Banjo' | 'TV Wall';
  wallAWidth: number; // cm (default 360)
  wallBWidth: number; // cm (default 220)
  roomHeight: number; // cm (default 270)
  roomDepth: number;  // cm (default 60)
  layoutShape: 'I-Shape' | 'L-Shape' | 'U-Shape';
  elements: CabinetElement[];
}

interface KuzhinaProStudioProps {
  onBack: () => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export function KuzhinaProStudio({ onBack, showToast }: KuzhinaProStudioProps) {
  // Active Tab / Step Navigation
  const [activeStep, setActiveStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Project Information State
  const [project, setProject] = useState<ProjectData>({
    clientName: 'Mergim Rexhepi',
    clientPhone: '+383 49 123 456',
    clientAddress: 'Prishtinë, Rr. Agim Ramadani',
    date: new Date().toISOString().split('T')[0],
    projectType: 'Kuzhinë',
    wallAWidth: 360,
    wallBWidth: 220,
    roomHeight: 270,
    roomDepth: 60,
    layoutShape: 'L-Shape',
    elements: [
      {
        id: 'el-1',
        name: 'Frigorifer 60',
        type: 'tall',
        width: 60,
        height: 220,
        depth: 60,
        materialThickness: 18,
        drawerSystem: 'Tandembox',
        drawerCount: 0,
        frontMaterial: 'MDF',
        applianceType: 'frigorifer',
        xPosition: 0,
        wallIndex: 'A'
      },
      {
        id: 'el-2',
        name: 'Lavastovilje 60',
        type: 'base',
        width: 60,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: 'Tandembox',
        drawerCount: 0,
        frontMaterial: 'MDF',
        applianceType: 'lavastovilje',
        xPosition: 60,
        wallIndex: 'A'
      },
      {
        id: 'el-3',
        name: 'Lavapjatë 80',
        type: 'base',
        width: 80,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: 'Tandembox',
        drawerCount: 2,
        frontMaterial: 'MDF',
        applianceType: 'lavapjate',
        xPosition: 120,
        wallIndex: 'A'
      },
      {
        id: 'el-4',
        name: 'Furry 60',
        type: 'base',
        width: 60,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: 'Tandembox',
        drawerCount: 1,
        frontMaterial: 'MDF',
        applianceType: 'furre',
        xPosition: 200,
        wallIndex: 'A'
      },
      {
        id: 'el-5',
        name: 'Fioka 90',
        type: 'base',
        width: 90,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: 'Tandembox',
        drawerCount: 3,
        frontMaterial: 'MDF',
        applianceType: 'standard',
        xPosition: 260,
        wallIndex: 'A'
      }
    ]
  });

  // Selected Element for Inspector (Hapi 4)
  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-3');

  // AI Quick Generator Wizard State
  const [aiWizard, setAiWizard] = useState({
    wallLength: 360,
    hasFridge: true,
    hasDishwasher: true,
    hasOven: true,
    sinkWidth: 80,
    style: 'Modern' as 'Modern' | 'Klasik' | 'Handleless',
    drawerSystem: 'Tandembox' as 'Tandembox' | 'Antaro' | 'Nova Pro'
  });

  // Price & Stock Costing Settings
  const [boardUnitPrice, setBoardUnitPrice] = useState<number>(65); // € / pllakë 2800x2070
  const [edgeTapePrice, setEdgeTapePrice] = useState<number>(24);  // € / rol
  const [hardwareUnitPrice, setHardwareUnitPrice] = useState<number>(46); // € / set Tandembox
  const [screwsPrice, setScrewsPrice] = useState<number>(4);      // € / element
  const [laborCost, setLaborCost] = useState<number>(200);        // € punë
  const [stockBoardsAvailable, setStockBoardsAvailable] = useState<number>(2); // Current stock

  // Selected Element getter
  const selectedElement = project.elements.find(e => e.id === selectedElementId) || project.elements[0];

  // Helper: Calculate total elements width on Wall A
  const wallAUsedWidth = project.elements
    .filter(e => e.wallIndex === 'A')
    .reduce((sum, e) => sum + e.width, 0);

  // Helper: Auto AI Cutlist Part Generator (Hapi 5)
  const generateCutList = (): CutPart[] => {
    const list: CutPart[] = [];
    project.elements.forEach(el => {
      const hMm = el.height * 10;
      const wMm = el.width * 10;
      const dMm = el.depth * 10;
      const t = el.materialThickness;

      // 1. 2 Anësore
      list.push({
        id: `${el.id}-side`,
        elementName: el.name,
        partName: 'Anësore (2 copë)',
        width: dMm,
        height: hMm,
        quantity: 2,
        material: `Ivericë ${t}mm`,
        edgeBanding: 'ABS 1mm'
      });

      // 2. 1 Fund
      list.push({
        id: `${el.id}-bottom`,
        elementName: el.name,
        partName: 'Fund (1 copë)',
        width: wMm - 2 * t,
        height: dMm,
        quantity: 1,
        material: `Ivericë ${t}mm`,
        edgeBanding: 'ABS 1mm'
      });

      // 3. 1 Kapak / Traversë
      list.push({
        id: `${el.id}-top`,
        elementName: el.name,
        partName: 'Kapak / Traversë (1 copë)',
        width: wMm - 2 * t,
        height: dMm,
        quantity: 1,
        material: `Ivericë ${t}mm`,
        edgeBanding: 'ABS 1mm'
      });

      // 4. 1 Shpinë HDF
      list.push({
        id: `${el.id}-back`,
        elementName: el.name,
        partName: 'Shpinë HDF (1 copë)',
        width: wMm - 4,
        height: hMm - 4,
        quantity: 1,
        material: 'HDF 3mm i bardhë',
        edgeBanding: 'Pa shirit'
      });

      // 5. Ballinat (Fronts)
      if (el.applianceType !== 'furre' && el.applianceType !== 'frigorifer') {
        const frontHeight = el.drawerCount > 0 ? Math.floor(hMm / el.drawerCount) - 3 : hMm - 3;
        const frontQty = el.drawerCount > 0 ? el.drawerCount : 1;
        list.push({
          id: `${el.id}-front`,
          elementName: el.name,
          partName: `Ballinë ${el.frontMaterial} (${frontQty} copë)`,
          width: wMm - 3,
          height: frontHeight,
          quantity: frontQty,
          material: `${el.frontMaterial} 18mm`,
          edgeBanding: 'ABS 2mm me shkëlqim'
        });
      }

      // 6. Fijokat Tandembox/Antaro internal boxes
      if (el.drawerCount > 0) {
        list.push({
          id: `${el.id}-drawer-box`,
          elementName: el.name,
          partName: `Fijokë ${el.drawerSystem} (${el.drawerCount} meks)`,
          width: wMm - 75,
          height: 140,
          quantity: el.drawerCount,
          material: `Ivericë 16mm / Metall`,
          edgeBanding: 'ABS 1mm'
        });
      }
    });
    return list;
  };

  const cutList = generateCutList();

  // Helper: Estimate Board Count & Waste (Hapi 6)
  // Standard sheet size: 2800mm x 2070mm = 5,796,000 sq mm
  const totalAreaSqMm = cutList.reduce((sum, item) => sum + (item.width * item.height * item.quantity), 0);
  const sheetAreaSqMm = 2800 * 2070;
  const rawSheetsNeeded = Math.ceil(totalAreaSqMm / (sheetAreaSqMm * 0.82)); // accounting 18% kerf & margins
  const totalSheetsRequired = Math.max(2, rawSheetsNeeded);
  const wastePercentage = Math.round(100 - (totalAreaSqMm / (totalSheetsRequired * sheetAreaSqMm)) * 100);

  // Helper: Total Cost Breakdown (Hapi 7)
  const totalBoardsCost = totalSheetsRequired * boardUnitPrice;
  const totalTapeCost = edgeTapePrice;
  const totalTandemboxSets = project.elements.reduce((sum, e) => sum + e.drawerCount, 0);
  const totalHardwareCost = totalTandemboxSets * hardwareUnitPrice;
  const totalScrewsCost = project.elements.length * screwsPrice;
  const grandTotalCost = totalBoardsCost + totalTapeCost + totalHardwareCost + totalScrewsCost + laborCost;

  // Inventory Stock Alert (Hapi 9)
  const missingBoards = Math.max(0, totalSheetsRequired - stockBoardsAvailable);

  // Add new element function
  const handleAddElement = (width: number, applianceType: CabinetElement['applianceType'] = 'standard', customName?: string) => {
    const currentX = wallAUsedWidth;
    if (currentX + width > project.wallAWidth) {
      if (showToast) showToast(`Muri A ka gjerësi ${project.wallAWidth}cm. Nuk ka mjaftueshëm hapësirë te mbetur!`, 'warning');
      return;
    }

    const newId = `el-${Date.now()}`;
    const name = customName || (
      applianceType === 'lavapjate' ? `Lavapjatë ${width}` :
      applianceType === 'furre' ? `Furrë ${width}` :
      applianceType === 'frigorifer' ? `Frigorifer ${width}` :
      applianceType === 'lavastovilje' ? `Lavastovilje ${width}` :
      applianceType === 'kend' ? `Kënd ${width}` : `Element ${width}`
    );

    const newEl: CabinetElement = {
      id: newId,
      name,
      type: applianceType === 'frigorifer' ? 'tall' : 'base',
      width,
      height: applianceType === 'frigorifer' ? 220 : 72,
      depth: 56,
      materialThickness: 18,
      drawerSystem: 'Tandembox',
      drawerCount: applianceType === 'lavapjate' ? 2 : (applianceType === 'standard' ? 3 : 0),
      frontMaterial: 'MDF',
      applianceType,
      xPosition: currentX,
      wallIndex: 'A'
    };

    setProject(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedElementId(newId);
    if (showToast) showToast(`U shtua "${name}" në Canvas!`, 'success');
  };

  // Delete element function
  const handleDeleteElement = (id: string) => {
    setProject(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== id) }));
    if (selectedElementId === id) setSelectedElementId(null);
    if (showToast) showToast(`Elementi u fshi!`, 'info');
  };

  // AI Unik Fast Auto Proposal Function (Funksioni i Kërkuar!)
  const handleExecuteAiMagicProposal = () => {
    const wallLen = aiWizard.wallLength;
    const newElements: CabinetElement[] = [];
    let currentX = 0;

    // 1. Tall Fridge if requested
    if (aiWizard.hasFridge && currentX + 60 <= wallLen) {
      newElements.push({
        id: `el-ai-${Date.now()}-1`,
        name: 'Frigorifer 60',
        type: 'tall',
        width: 60,
        height: 220,
        depth: 60,
        materialThickness: 18,
        drawerSystem: aiWizard.drawerSystem,
        drawerCount: 0,
        frontMaterial: aiWizard.style === 'Modern' ? 'MDF' : 'Ivericë',
        applianceType: 'frigorifer',
        xPosition: currentX,
        wallIndex: 'A'
      });
      currentX += 60;
    }

    // 2. Dishwasher if requested
    if (aiWizard.hasDishwasher && currentX + 60 <= wallLen) {
      newElements.push({
        id: `el-ai-${Date.now()}-2`,
        name: 'Lavastovilje 60',
        type: 'base',
        width: 60,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: aiWizard.drawerSystem,
        drawerCount: 0,
        frontMaterial: aiWizard.style === 'Modern' ? 'MDF' : 'Ivericë',
        applianceType: 'lavastovilje',
        xPosition: currentX,
        wallIndex: 'A'
      });
      currentX += 60;
    }

    // 3. Sink Module
    const sinkW = aiWizard.sinkWidth || 80;
    if (currentX + sinkW <= wallLen) {
      newElements.push({
        id: `el-ai-${Date.now()}-3`,
        name: `Lavapjatë ${sinkW}`,
        type: 'base',
        width: sinkW,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: aiWizard.drawerSystem,
        drawerCount: 2,
        frontMaterial: aiWizard.style === 'Modern' ? 'MDF' : 'Ivericë',
        applianceType: 'lavapjate',
        xPosition: currentX,
        wallIndex: 'A'
      });
      currentX += sinkW;
    }

    // 4. Oven Module
    if (aiWizard.hasOven && currentX + 60 <= wallLen) {
      newElements.push({
        id: `el-ai-${Date.now()}-4`,
        name: 'Furrë 60',
        type: 'base',
        width: 60,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: aiWizard.drawerSystem,
        drawerCount: 1,
        frontMaterial: aiWizard.style === 'Modern' ? 'MDF' : 'Ivericë',
        applianceType: 'furre',
        xPosition: currentX,
        wallIndex: 'A'
      });
      currentX += 60;
    }

    // 5. Fill remaining space with Tandembox Drawers module
    const remainingSpace = wallLen - currentX;
    if (remainingSpace >= 40) {
      newElements.push({
        id: `el-ai-${Date.now()}-5`,
        name: `Fioka Premium ${remainingSpace}`,
        type: 'base',
        width: remainingSpace,
        height: 72,
        depth: 56,
        materialThickness: 18,
        drawerSystem: aiWizard.drawerSystem,
        drawerCount: 3,
        frontMaterial: aiWizard.style === 'Modern' ? 'MDF' : 'Ivericë',
        applianceType: 'standard',
        xPosition: currentX,
        wallIndex: 'A'
      });
    }

    setProject(prev => ({
      ...prev,
      wallAWidth: wallLen,
      elements: newElements
    }));

    setShowAiModal(false);
    setActiveStep(3); // Jump to Canvas Step
    if (showToast) showToast('🚀 AI gjeneroi propozimin e plotë të kuzhinës me sukses!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-indigo-900/50 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 hover:text-white rounded-xl border border-indigo-800/60 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Kthehu Mbrapsht
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-slate-950 rounded-full overflow-hidden flex items-center justify-center">
                <img 
                  src={LOGO_DATA_URL} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  style={{ animation: 'spin 10s linear infinite' }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/50">
                  MODULI AI
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" /> KUZHINA PRO
                </span>
              </div>
              <h1 className="text-base font-black text-white tracking-tight">Studio e Gjenerimit Automatik</h1>
            </div>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-3">
          {/* AI Magic Generator Modal Trigger */}
          <button
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 hover:brightness-110 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all border border-amber-300/40"
          >
            <Wand2 className="w-4 h-4 animate-bounce" /> ✨ AI Magic Proposal
          </button>

          {/* 2D / 3D Toggle Button */}
          <div className="bg-slate-950 p-1 rounded-xl border border-indigo-900/60 flex items-center gap-1">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                viewMode === '2D' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Elevation
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                viewMode === '3D' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Render
            </button>
          </div>
        </div>
      </header>

      {/* STEP NAVIGATION BAR (Hapat 1-10) */}
      <nav className="bg-slate-900/60 border-b border-indigo-900/40 px-4 sm:px-8 py-2.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max mx-auto">
          {[
            { step: 1, label: 'Hapi 1: Projekti', icon: Edit3 },
            { step: 2, label: 'Hapi 2: Dhoma', icon: Grid },
            { step: 3, label: 'Hapi 3: Canvas (Muri)', icon: MoveHorizontal },
            { step: 4, label: 'Hapi 4: Inspector', icon: Settings },
            { step: 5, label: 'Hapi 5: AI Pjesët', icon: Cpu },
            { step: 6, label: 'Hapi 6: Optimizimi', icon: Layers },
            { step: 7, label: 'Hapi 7: Kosto', icon: DollarSign },
            { step: 8, label: 'Hapi 8: Oferta PDF', icon: FileText },
            { step: 9, label: 'Hapi 9: Magazina', icon: PackageCheck },
            { step: 10, label: 'Hapi 10: 3D Studio', icon: Box }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => setActiveStep(item.step)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/80 shadow-md shadow-indigo-500/20 scale-105'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN WORKSPACE BODY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        
        {/* STEP 1: KRIJO PROJEKT */}
        {activeStep === 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Hapi 1 – Të Dhënat e Projektit</h2>
                  <p className="text-xs text-slate-400 font-medium">Plotësoni të dhënat e klientit dhe zgjidhni llojin e mobiljes.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Emri i Klientit</label>
                  <input 
                    type="text" 
                    value={project.clientName}
                    onChange={(e) => setProject({ ...project, clientName: e.target.value })}
                    className="w-full bg-slate-950 border border-indigo-900/60 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Telefoni</label>
                  <input 
                    type="text" 
                    value={project.clientPhone}
                    onChange={(e) => setProject({ ...project, clientPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-indigo-900/60 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Adresa</label>
                  <input 
                    type="text" 
                    value={project.clientAddress}
                    onChange={(e) => setProject({ ...project, clientAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-indigo-900/60 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Data</label>
                  <input 
                    type="date" 
                    value={project.date}
                    onChange={(e) => setProject({ ...project, date: e.target.value })}
                    className="w-full bg-slate-950 border border-indigo-900/60 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Lloji i Projektit Radio Cards */}
              <div className="mt-8 pt-6 border-t border-indigo-900/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-4">Lloji i Projektit</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'Kuzhinë', label: '□ Kuzhinë', desc: 'Elemente bazë, varura & Tandembox' },
                    { id: 'Garderobë', label: '□ Garderobë', desc: 'Sisteme me rrëshqitje & rafte' },
                    { id: 'Banjo', label: '□ Banjo', desc: 'Elemente me rezistencë ndaj ujit' },
                    { id: 'TV Wall', label: '□ TV Wall', desc: 'Panele dekorative & ndriçim LED' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setProject({ ...project, projectType: item.id as any })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        project.projectType === item.id
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-black text-sm text-white mb-1">{item.label}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  Vazhdo te Hapi 2 (Dhoma) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: DHOMA & MURET */}
        {activeStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Grid className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Hapi 2 – Përmasat e Dhomës & Muret</h2>
                  <p className="text-xs text-slate-400 font-medium">Përcaktoni gjatësitë e mureve dhe lartësinë e dhomës.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/50">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Muri A (cm)</label>
                  <input 
                    type="number" 
                    value={project.wallAWidth}
                    onChange={(e) => setProject({ ...project, wallAWidth: Number(e.target.value) || 360 })}
                    className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-4 py-2.5 text-white font-black text-lg focus:outline-none focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Muri kryesor (default 360cm)</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/50">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Muri B (cm)</label>
                  <input 
                    type="number" 
                    value={project.wallBWidth}
                    onChange={(e) => setProject({ ...project, wallBWidth: Number(e.target.value) || 220 })}
                    className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-4 py-2.5 text-white font-black text-lg focus:outline-none focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Muri anësor për formë L/U</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/50">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Lartësia (cm)</label>
                  <input 
                    type="number" 
                    value={project.roomHeight}
                    onChange={(e) => setProject({ ...project, roomHeight: Number(e.target.value) || 270 })}
                    className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-4 py-2.5 text-white font-black text-lg focus:outline-none focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Tavani (default 270cm)</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/50">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Thellësia (cm)</label>
                  <input 
                    type="number" 
                    value={project.roomDepth}
                    onChange={(e) => setProject({ ...project, roomDepth: Number(e.target.value) || 60 })}
                    className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-4 py-2.5 text-white font-black text-lg focus:outline-none focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Standard 60cm</span>
                </div>
              </div>

              {/* Layout Shape picker */}
              <div className="mt-8 pt-6 border-t border-indigo-900/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-4">Forma e Kuzhinës</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'I-Shape', name: 'Formë Drejtë (I-Shape)', desc: 'Përgjatë një muri vetëm A' },
                    { id: 'L-Shape', name: 'Formë L (L-Shape)', desc: 'Muri A + Muri B në kënd 90°' },
                    { id: 'U-Shape', name: 'Formë U (U-Shape)', desc: 'Tre mure me ishull ose kënd të dytë' }
                  ].map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => setProject({ ...project, layoutShape: shape.id as any })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        project.layoutShape === shape.id
                          ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-black text-sm text-white mb-1">{shape.name}</span>
                      <span className="text-[11px] text-slate-400">{shape.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  Vazhdo te Canvas (Muri A) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3 & 10: CANVAS (Zemra e Sistemit) & 2D/3D VISUALIZER */}
        {(activeStep === 3 || activeStep === 10) && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            
            {/* CANVAS INTERACTIVE BOARD */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-indigo-900/60 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <MoveHorizontal className="w-5 h-5 text-indigo-400" />
                    Hapi 3 – Canvas (Muri A = {project.wallAWidth}cm)
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Vendosni elementet me klikim ose terhiqni. Hapësira e zënë: <span className="text-emerald-400 font-bold">{wallAUsedWidth}cm</span> / {project.wallAWidth}cm.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Pamja:</span>
                  <button
                    onClick={() => setViewMode('2D')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      viewMode === '2D' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    2D
                  </button>
                  <button
                    onClick={() => setViewMode('3D')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      viewMode === '3D' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    3D Perspective
                  </button>
                </div>
              </div>

              {/* VIEW 2D ELEVATION CANVAS */}
              {viewMode === '2D' && (
                <div className="bg-slate-950 rounded-2xl p-6 border border-indigo-900/40 relative overflow-x-auto min-h-[380px] flex flex-col justify-end">
                  
                  {/* Top Wall Scale Ruler */}
                  <div className="w-full flex justify-between border-b border-indigo-800/40 pb-2 mb-8 text-[11px] font-mono text-indigo-300">
                    <span>0 cm</span>
                    <span>MURI A ({project.wallAWidth} cm)</span>
                    <span>{project.wallAWidth} cm</span>
                  </div>

                  {/* Wall Grid Area */}
                  <div className="relative w-full h-[280px] bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] rounded-xl border border-dashed border-indigo-800/40 flex items-end p-2 gap-1 overflow-x-auto">
                    
                    {project.elements.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                        <Box className="w-10 h-10 mb-2 opacity-40 animate-bounce" />
                        <span>Muri është i zbrazët. Zgjidhni një element nga paneli poshtë për ta vendosur!</span>
                      </div>
                    ) : (
                      project.elements.map((el) => {
                        const isSelected = selectedElementId === el.id;
                        // Calculate relative width percentage for visualization
                        const widthPct = (el.width / project.wallAWidth) * 100;
                        const heightPx = el.type === 'tall' ? 240 : 130;

                        return (
                          <motion.div
                            key={el.id}
                            layout
                            onClick={() => {
                              setSelectedElementId(el.id);
                              setActiveStep(4); // Jump to Inspector
                            }}
                            style={{ width: `${Math.max(10, widthPct)}%`, height: `${heightPx}px` }}
                            className={`relative rounded-xl p-2 cursor-pointer transition-all border flex flex-col justify-between overflow-hidden group shadow-lg ${
                              isSelected
                                ? 'bg-gradient-to-b from-indigo-600/90 to-indigo-950/90 border-amber-400 shadow-amber-500/20 scale-[1.02] z-20'
                                : el.applianceType === 'frigorifer'
                                ? 'bg-slate-800/90 border-slate-600 text-slate-200'
                                : el.applianceType === 'furre'
                                ? 'bg-slate-900/90 border-amber-500/60 text-amber-300'
                                : el.applianceType === 'lavapjate'
                                ? 'bg-slate-900/90 border-blue-500/60 text-blue-300'
                                : 'bg-indigo-950/80 border-indigo-700/60 text-indigo-200'
                            }`}
                          >
                            {/* Dimension Header Overlay */}
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider border-b border-white/10 pb-1">
                              <span>{el.name}</span>
                              <span className="bg-black/40 px-1.5 py-0.5 rounded text-[9px]">{el.width}cm</span>
                            </div>

                            {/* Cabinet Front Drawers Lines Indicator */}
                            <div className="my-auto space-y-1">
                              {el.drawerCount > 0 && Array.from({ length: el.drawerCount }).map((_, idx) => (
                                <div key={idx} className="w-full h-3 border-t border-b border-white/20 bg-white/5 rounded flex items-center justify-center">
                                  <div className="w-6 h-0.5 bg-amber-400/80 rounded"></div>
                                </div>
                              ))}
                              {el.applianceType === 'furre' && (
                                <div className="w-full h-12 border border-amber-400/50 bg-black/50 rounded flex items-center justify-center text-[10px] font-bold text-amber-300">
                                  [ FURRË ]
                                </div>
                              )}
                              {el.applianceType === 'frigorifer' && (
                                <div className="w-full h-24 border border-slate-500/50 bg-slate-950/80 rounded flex items-center justify-center text-[10px] font-bold text-slate-300">
                                  [ FRIGORIFER ]
                                </div>
                              )}
                            </div>

                            {/* Footer Width Label | 60 | */}
                            <div className="text-center font-mono font-black text-[11px] text-white bg-black/60 py-0.5 rounded tracking-widest border border-white/10">
                              ──────────────<br />
                              | {el.width} |<br />
                              ──────────────
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 3D PERSPECTIVE CANVAS */}
              {viewMode === '3D' && (
                <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 border border-emerald-900/50 min-h-[380px] flex items-center justify-center relative overflow-hidden">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-2xl animate-pulse">
                      <Box className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Pamja 3D e Kuzhinës Pro</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Pamje tre-dimensionale e realizuar me hije dhe materiale MDF/Ivericë me shkëlqim.
                      </p>
                    </div>

                    {/* Stylized 3D Box Modules render */}
                    <div className="flex items-end justify-center gap-2 pt-6 max-w-2xl mx-auto border-t border-slate-800">
                      {project.elements.map((el) => (
                        <div 
                          key={el.id}
                          style={{ height: el.type === 'tall' ? '180px' : '90px', width: `${el.width * 1.5}px` }}
                          className="bg-gradient-to-tr from-indigo-900 via-slate-800 to-indigo-950 rounded-lg border-2 border-emerald-400/60 shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex flex-col justify-between p-1 text-[9px] font-bold text-emerald-300 transform -rotate-1 hover:rotate-0 transition-transform cursor-pointer"
                          onClick={() => {
                            setSelectedElementId(el.id);
                            setActiveStep(4);
                          }}
                        >
                          <span>{el.width}cm</span>
                          <div className="w-full h-1 bg-emerald-400/50 rounded"></div>
                          <span>{el.applianceType || 'MDF'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ELEMENT PALETTE BAR BELOW CANVAS (Hapi 3 - Poshtë janë elementet) */}
              <div className="mt-6 pt-6 border-t border-indigo-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" /> Shto Element në Canvas (Sipas gjerësisë apo pajisjes):
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Klikoni për të pozicionuar automatikisht</span>
                </div>

                {/* Width Buttons Bar [40] [45] [50] [60] [80] [90] [100] */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 mr-2">Gjerësitë (cm):</span>
                  {[40, 45, 50, 60, 80, 90, 100].map((w) => (
                    <button
                      key={w}
                      onClick={() => handleAddElement(w, 'standard')}
                      className="px-3 py-2 bg-indigo-950/80 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-xl border border-indigo-800 font-mono font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1"
                    >
                      [{w}]
                    </button>
                  ))}
                </div>

                {/* Special Appliance Buttons Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 mr-2">Pajisjet e Veçanta:</span>
                  {[
                    { type: 'lavapjate', width: 80, name: 'Lavapjatë (80cm)' },
                    { type: 'furre', width: 60, name: 'Furrë (60cm)' },
                    { type: 'frigorifer', width: 60, name: 'Frigorifer (60cm)' },
                    { type: 'kend', width: 90, name: 'Kënd (90cm)' },
                    { type: 'lavastovilje', width: 60, name: 'Lavastovilje (60cm)' }
                  ].map((app) => (
                    <button
                      key={app.type}
                      onClick={() => handleAddElement(app.width, app.type as any, app.name)}
                      className="px-3.5 py-2 bg-slate-950 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl border border-emerald-800/60 font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <span>+ {app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: INSPECTOR PANEL (Kliko Elementin) */}
        {activeStep === 4 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-2xl">
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Hapi 4 – Inspektori i Elementit: {selectedElement ? selectedElement.name : 'Nuk ka element të zgjedhur'}</h2>
                    <p className="text-xs text-slate-400">Modifikoni përmasat, materialin dhe sistemin e fijokave.</p>
                  </div>
                </div>

                {selectedElement && (
                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="px-3.5 py-2 bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl border border-red-500/40 font-bold text-xs transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Fshi Elementin
                  </button>
                )}
              </div>

              {selectedElement ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Gjerësia, Lartësia, Thellësia */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 border-b border-indigo-900/40 pb-2">Përmasat (cm)</h3>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Gjerësia (cm)</label>
                      <input 
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => {
                          const w = Number(e.target.value) || 60;
                          setProject(prev => ({
                            ...prev,
                            elements: prev.elements.map(el => el.id === selectedElement.id ? { ...el, width: w } : el)
                          }));
                        }}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-black text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Lartësia (cm)</label>
                      <input 
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => {
                          const h = Number(e.target.value) || 72;
                          setProject(prev => ({
                            ...prev,
                            elements: prev.elements.map(el => el.id === selectedElement.id ? { ...el, height: h } : el)
                          }));
                        }}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-black text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Thellësia (cm)</label>
                      <input 
                        type="number"
                        value={selectedElement.depth}
                        onChange={(e) => {
                          const d = Number(e.target.value) || 56;
                          setProject(prev => ({
                            ...prev,
                            elements: prev.elements.map(el => el.id === selectedElement.id ? { ...el, depth: d } : el)
                          }));
                        }}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-black text-sm"
                      />
                    </div>
                  </div>

                  {/* Materiali & Sistemi i Fijokave */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 border-b border-indigo-900/40 pb-2">Hardware & Fijokat</h3>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Materiali i Korpusit</label>
                      <select
                        value={selectedElement.materialThickness}
                        onChange={(e) => {
                          const t = Number(e.target.value);
                          setProject(prev => ({
                            ...prev,
                            elements: prev.elements.map(el => el.id === selectedElement.id ? { ...el, materialThickness: t } : el)
                          }));
                        }}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-bold text-sm"
                      >
                        <option value={18}>18 mm (Standard)</option>
                        <option value={25}>25 mm (E trashë)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-2">Sistemi i Fijokave</label>
                      <div className="space-y-1.5">
                        {['Tandembox', 'Antaro', 'Nova Pro'].map((sys) => (
                          <label key={sys} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white bg-slate-900 p-2 rounded-xl border border-slate-800">
                            <input 
                              type="radio" 
                              name="drawerSystem"
                              checked={selectedElement.drawerSystem === sys}
                              onChange={() => {
                                setProject(prev => ({
                                  ...prev,
                                  elements: prev.elements.map(el => el.id === selectedElement.id ? { ...el, drawerSystem: sys as any } : el)
                                }));
                              }}
                              className="accent-indigo-500"
                            />
                            <span>☑ {sys}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Numri i Fijokave ({selectedElement.drawerCount})</label>
                      <input 
                        type="range"
                        min={0}
                        max={5}
                        value={selectedElement.drawerCount}
                        onChange={(e) => {
                          const cnt = Number(e.target.value);
                          setProject(prev => ({
                            ...prev,
                            elements: prev.elements.map(el => el.id === selectedElement.id ? { ...el, drawerCount: cnt } : el)
                          }));
                        }}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Ballina (Front Finish) */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 border-b border-indigo-900/40 pb-2">Ballina (Materiali)</h3>

                    <div className="space-y-2">
                      {[
                        { id: 'MDF', label: '□ MDF (Mat / Me Shkëlqim)' },
                        { id: 'Ivericë', label: '□ Ivericë Dekor' },
                        { id: 'Dru', label: '□ Dru Natyral' },
                        { id: 'Profile Alumini', label: '□ Profile Alumini & Xham' }
                      ].map((mat) => (
                        <button
                          key={mat.id}
                          onClick={() => {
                            setProject(prev => ({
                              ...prev,
                              elements: prev.elements.map(el => el.id === selectedElement.id ? { ...el, frontMaterial: mat.id as any } : el)
                            }));
                          }}
                          className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                            selectedElement.frontMaterial === mat.id
                              ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {mat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Zgjidhni një element te Hapi 3 (Canvas) për të hapur inspektorin.
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStep(5)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  Shtyp "Gjenero Pjesët me AI" (Hapi 5) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: AI GJENERON PJESËT (Cutlist Table) */}
        {activeStep === 5 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Hapi 5 – AI Gjeneroi Automatike Lista e Prerjeve</h2>
                    <p className="text-xs text-slate-400">Gjenerimi automatik i të gjitha pjesëve (anësore, fund, kapak, shpinë, ballina, fijoka) pa hyrje manuale!</p>
                  </div>
                </div>

                <div className="px-4 py-2 bg-indigo-950 border border-indigo-800 rounded-xl text-xs font-bold text-indigo-300">
                  Gjithsej {cutList.length} Pozicione Pjesësh
                </div>
              </div>

              {/* Cutlist Table */}
              <div className="overflow-x-auto rounded-2xl border border-indigo-900/60 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-950/80 text-indigo-300 uppercase text-[10px] tracking-wider font-black border-b border-indigo-800/60">
                    <tr>
                      <th className="p-3.5">Elementi</th>
                      <th className="p-3.5">Pjesa Strukturore</th>
                      <th className="p-3.5">Gjerësia (mm)</th>
                      <th className="p-3.5">Lartësia (mm)</th>
                      <th className="p-3.5">Sasia</th>
                      <th className="p-3.5">Materiali</th>
                      <th className="p-3.5">Shiriti ABS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium text-slate-200">
                    {cutList.map((part) => (
                      <tr key={part.id} className="hover:bg-indigo-900/20 transition-colors">
                        <td className="p-3.5 font-bold text-indigo-200">{part.elementName}</td>
                        <td className="p-3.5 font-black text-white">{part.partName}</td>
                        <td className="p-3.5 font-mono text-emerald-400 font-bold">{part.width} mm</td>
                        <td className="p-3.5 font-mono text-emerald-400 font-bold">{part.height} mm</td>
                        <td className="p-3.5 font-black text-amber-300">{part.quantity}</td>
                        <td className="p-3.5 text-slate-300">{part.material}</td>
                        <td className="p-3.5 text-slate-400">{part.edgeBanding}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStep(6)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                >
                  Vazhdo te Optimizimi i Pllakave (Hapi 6) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 6: OPTIMIZIMI (Sheet Cutting Optimization Visualization) */}
        {activeStep === 6 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Hapi 6 – Optimizimi i Shfrytëzimit të Pllakave</h2>
                  <p className="text-xs text-slate-400">Optimizuesi automatik i renditjes së pjesëve në pllaka standarde 2800x2070mm.</p>
                </div>
              </div>

              {/* Optimization Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300">Dimensioni Pllakës</span>
                    <span className="text-lg font-black text-white">2800 x 2070 mm</span>
                  </div>
                  <HardDrive className="w-8 h-8 text-indigo-400 opacity-60" />
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300">Pllaka të Nevojshme</span>
                    <span className="text-2xl font-black text-emerald-400">{totalSheetsRequired} copë</span>
                  </div>
                  <Layers className="w-8 h-8 text-emerald-400 opacity-60" />
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-300">Mbetje (Scrap)</span>
                    <span className="text-2xl font-black text-amber-400">{wastePercentage}%</span>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-amber-400 opacity-60" />
                </div>
              </div>

              {/* Sheet Visualizer Boards (2800x2070 Layout Representation) */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">Diagrami i Vendosjes në Pllaka (2800x2070):</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: totalSheetsRequired }).map((_, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-indigo-800/60 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                        <span>Pllaka #{idx + 1} (2800x2070mm)</span>
                        <span className="text-emerald-400">Shfrytëzimi ~{100 - wastePercentage}%</span>
                      </div>

                      {/* Mocked Nested Layout Visual Canvas */}
                      <div className="w-full h-44 bg-slate-900 rounded-xl border border-slate-800 p-2 grid grid-cols-4 grid-rows-3 gap-1 overflow-hidden relative">
                        <div className="col-span-2 row-span-2 bg-indigo-600/40 border border-indigo-400/80 rounded p-1 text-[9px] font-bold text-indigo-200">
                          2x Anësore (720x560)
                        </div>
                        <div className="col-span-2 bg-emerald-600/40 border border-emerald-400/80 rounded p-1 text-[9px] font-bold text-emerald-200">
                          Ballinë (717x597)
                        </div>
                        <div className="col-span-1 row-span-2 bg-purple-600/40 border border-purple-400/80 rounded p-1 text-[9px] font-bold text-purple-200">
                          Fund
                        </div>
                        <div className="col-span-1 bg-amber-600/40 border border-amber-400/80 rounded p-1 text-[9px] font-bold text-amber-200">
                          Fijokë
                        </div>
                        <div className="col-span-2 bg-slate-800/80 border border-slate-700 rounded p-1 text-[9px] text-slate-500 font-mono">
                          [ Mbetje {wastePercentage}% ]
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStep(7)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  Vazhdo te Llogaritja e Kostos (Hapi 7) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 7: KOSTO (Cost Calculation Breakdown) */}
        {activeStep === 7 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Hapi 7 – Llogaritja e Plotë e Kostos së Prodhimit</h2>
                  <p className="text-xs text-slate-400">Përmbledhja e çmimeve për pllaka, shirit, Tandembox hardware, vida dhe punë me TOTAL-in përfundimtar.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Cost Settings Inputs */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-indigo-900/60 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 border-b border-indigo-900/40 pb-2">Ndrysho Çmimet për Njësi (€)</h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Çmimi i Pllakës (€/copë)</label>
                      <input 
                        type="number" 
                        value={boardUnitPrice}
                        onChange={(e) => setBoardUnitPrice(Number(e.target.value) || 65)}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Shiriti ABS (€/rol)</label>
                      <input 
                        type="number" 
                        value={edgeTapePrice}
                        onChange={(e) => setEdgeTapePrice(Number(e.target.value) || 24)}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Tandembox Hardware (€/set)</label>
                      <input 
                        type="number" 
                        value={hardwareUnitPrice}
                        onChange={(e) => setHardwareUnitPrice(Number(e.target.value) || 46)}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Vida & Pajisje (€/element)</label>
                      <input 
                        type="number" 
                        value={screwsPrice}
                        onChange={(e) => setScrewsPrice(Number(e.target.value) || 4)}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block font-bold text-slate-400 mb-1">Kosto e Punës / Prodhimit (€)</label>
                      <input 
                        type="number" 
                        value={laborCost}
                        onChange={(e) => setLaborCost(Number(e.target.value) || 200)}
                        className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-3 py-2 text-white font-bold text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Exact Breakdown Requested by User */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 rounded-2xl border-2 border-indigo-500/60 shadow-xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 border-b border-indigo-800/60 pb-2">Përmbledhja e Kostos (Shpenzimet):</h3>

                  <div className="space-y-3 text-sm font-bold text-white">
                    <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span>Pllaka ({totalSheetsRequired} copë x {boardUnitPrice}€)</span>
                      <span className="text-emerald-400 font-mono text-base">{totalBoardsCost}€</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span>Shiriti ABS</span>
                      <span className="text-emerald-400 font-mono text-base">{totalTapeCost}€</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span>Sisteme Fijokash Tandembox ({totalTandemboxSets} meks x {hardwareUnitPrice}€)</span>
                      <span className="text-emerald-400 font-mono text-base">{totalHardwareCost}€</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span>Vida & Aksesorë</span>
                      <span className="text-emerald-400 font-mono text-base">{totalScrewsCost}€</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span>Punë & Prodhim</span>
                      <span className="text-emerald-400 font-mono text-base">{laborCost}€</span>
                    </div>

                    <div className="pt-4 border-t-2 border-indigo-500 flex items-center justify-between text-xl font-black text-white">
                      <span className="uppercase tracking-wider text-indigo-300">TOTAL COST:</span>
                      <span className="text-amber-400 font-mono text-3xl drop-shadow-md">{grandTotalCost}€</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStep(8)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  Vazhdo te Oferta PDF (Hapi 8) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 8: OFERTA & PDF GENERATION */}
        {activeStep === 8 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Hapi 8 – Gjenerimi i Ofertës Zyrtare & PDF</h2>
                    <p className="text-xs text-slate-400">Dokumenti i gatshëm për printim apo dërgim te klienti.</p>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Printo / Shkarko PDF
                </button>
              </div>

              {/* PDF Preview Card Sheet */}
              <div id="printable-quote" className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-200">
                
                {/* Header Logo & Company Info */}
                <div className="flex items-center justify-between border-b border-slate-300 pb-6">
                  <div className="flex items-center gap-3">
                    <img src={LOGO_DATA_URL} alt="MergimGroup" className="w-12 h-12 rounded-full object-cover border border-slate-300" />
                    <div>
                      <h1 className="text-xl font-black text-indigo-900">MergimGroup Studio</h1>
                      <p className="text-xs text-slate-500 font-medium">Sistemi Profesional Kuzhina Pro & Mobilje</p>
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-600">
                    <span className="block font-black text-indigo-900 text-sm">OFERTË ZYRTARE</span>
                    <span>Data: {project.date}</span>
                  </div>
                </div>

                {/* Client Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Klienti:</span>
                    <span className="font-black text-slate-900 text-sm">{project.clientName}</span>
                    <p className="text-slate-600">{project.clientAddress}</p>
                    <p className="text-slate-600">{project.clientPhone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Detajet e Dhomës:</span>
                    <span className="font-bold text-slate-900">{project.projectType} ({project.layoutShape})</span>
                    <p className="text-slate-600">Muri A = {project.wallAWidth}cm | Muri B = {project.wallBWidth}cm</p>
                    <p className="text-slate-600">Lartësia = {project.roomHeight}cm | Depth = {project.roomDepth}cm</p>
                  </div>
                </div>

                {/* Included Features Checklist */}
                <div className="space-y-2 text-xs">
                  <h3 className="font-black text-indigo-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">Specifikimet e Ofertës:</h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                    <span>✔ Oferta e Plotë me Vizualizim</span>
                    <span>✔ Lista e Prerjeve me Optimizim ({totalSheetsRequired} pllaka)</span>
                    <span>✔ Sisteme Fijokash Tandembox të Përfshira</span>
                    <span>✔ Garancion i Prodhimit MergimGroup</span>
                  </div>
                </div>

                {/* Total Price Banner */}
                <div className="bg-indigo-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200">ÇMIMI TOTAL PËRFUNDIMTAR:</span>
                    <span className="text-xs text-indigo-300">Përfshin të gjitha materialet, punën & montimin</span>
                  </div>
                  <span className="text-3xl font-black text-amber-300 font-mono">{grandTotalCost} €</span>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStep(9)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                  Vazhdo te Magazina (Hapi 9) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 9: MAGAZINË & STOKU */}
        {activeStep === 9 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Hapi 9 – Kontrolli i Magazinës & Stokut</h2>
                  <p className="text-xs text-slate-400">Verifikimi automatik i stokut të pllakave dhe hardware-it për këtë projekt.</p>
                </div>
              </div>

              {/* Inventory Stock Warning Banner (User Requested Pattern) */}
              {missingBoards > 0 ? (
                <div className="bg-amber-500/20 border-2 border-amber-500/80 rounded-2xl p-5 text-amber-200 flex items-center justify-between shadow-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="font-black text-base text-white">⚠ DUHET TË POROSISNI SHPEJT!</h3>
                      <p className="text-xs font-bold text-amber-300 mt-0.5">
                        Projekti kërkon {totalSheetsRequired} pllaka ivericë, ndërsa në stok keni vetëm {stockBoardsAvailable} pllaka.
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg">
                    Mungojnë: {missingBoards} pllaka
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/20 border border-emerald-500/60 rounded-2xl p-5 text-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h3 className="font-black text-white text-base">Stoku është i mjaftueshëm!</h3>
                    <p className="text-xs text-emerald-300">Keni mjaftueshëm pllaka dhe aksesorë në magazinë për të filluar prodhimin menjëherë.</p>
                  </div>
                </div>
              )}

              {/* Stock Management Editor */}
              <div className="mt-6 bg-slate-950 p-6 rounded-2xl border border-indigo-900/60 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">Cilëso Stokun Aktual në Magazinë:</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Pllaka Ivericë 18mm në Stok (copë)</label>
                    <input 
                      type="number" 
                      value={stockBoardsAvailable}
                      onChange={(e) => setStockBoardsAvailable(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-4 py-3 text-white font-black text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Sete Tandembox në Stok</label>
                    <input 
                      type="number" 
                      defaultValue={10}
                      className="w-full bg-slate-900 border border-indigo-800/60 rounded-xl px-4 py-3 text-white font-black text-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStep(10)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                >
                  Vazhdo te Pamja 3D (Hapi 10) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* AI MAGIC FAST GENERATOR WIZARD MODAL (FUNKSIONI UNIK I KËRKUAR) */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-indigo-500/80 rounded-[32px] p-6 sm:p-8 max-w-xl w-full text-white shadow-2xl relative overflow-hidden space-y-6"
            >
              <div className="flex items-center justify-between border-b border-indigo-900/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Wand2 className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">AI Gjeneruesi Automatik i Kuzhinës</h3>
                    <p className="text-xs text-slate-400">Përzgjidhni parametrat bazë dhe sistemi do të ndërtojë propozimin e plotë instant!</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Wizard Form Options */}
              <div className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-indigo-300 mb-1">Gjatësia e Murit A (cm)</label>
                  <input 
                    type="number"
                    value={aiWizard.wallLength}
                    onChange={(e) => setAiWizard({ ...aiWizard, wallLength: Number(e.target.value) || 360 })}
                    className="w-full bg-slate-950 border border-indigo-800/60 rounded-xl px-4 py-2.5 text-white font-black text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-indigo-900/60 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={aiWizard.hasFridge}
                      onChange={(e) => setAiWizard({ ...aiWizard, hasFridge: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <span>Frigorifer = Po</span>
                  </label>

                  <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-indigo-900/60 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={aiWizard.hasDishwasher}
                      onChange={(e) => setAiWizard({ ...aiWizard, hasDishwasher: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <span>Lavastovilje = Po</span>
                  </label>

                  <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-indigo-900/60 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={aiWizard.hasOven}
                      onChange={(e) => setAiWizard({ ...aiWizard, hasOven: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <span>Furrë = Po</span>
                  </label>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-indigo-900/60 flex items-center justify-between">
                    <span className="text-slate-400">Lavapjatë:</span>
                    <select
                      value={aiWizard.sinkWidth}
                      onChange={(e) => setAiWizard({ ...aiWizard, sinkWidth: Number(e.target.value) })}
                      className="bg-slate-900 text-white font-bold rounded px-2 py-1 border border-indigo-800"
                    >
                      <option value={80}>80 cm</option>
                      <option value={60}>60 cm</option>
                      <option value={90}>90 cm</option>
                    </select>
                  </div>
                </div>

                {/* Stili */}
                <div>
                  <label className="block text-indigo-300 mb-1.5">Stili i Kuzhinës:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Modern', 'Klasik', 'Handleless'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setAiWizard({ ...aiWizard, style: st as any })}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          aiWizard.style === st ? 'bg-indigo-600 text-white border-indigo-400 shadow' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        □ {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-900/60 flex gap-3">
                <button
                  onClick={handleExecuteAiMagicProposal}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4 text-amber-300" /> Gjenero Propozimin e Plotë me AI
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
