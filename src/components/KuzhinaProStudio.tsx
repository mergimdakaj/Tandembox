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
import { TvWallStudioMain } from './tvwall/TvWallStudioMain';
import tvRender1 from '../assets/images/tv_wall_render_1_1785016109461.jpg';
import tvRender2 from '../assets/images/kitchen_tv_render_2_1785016123269.jpg';

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
  frontMaterial: 'MDF' | 'Ivericë' | 'Dru' | 'Profile Alumini' | 'Xham Vitrinë';
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

  // AI TV Wall Generator Wizard State (Vetëm TV Wall)
  const [aiWizard, setAiWizard] = useState({
    wallLength: 320,
    tvSize: 75 as 55 | 65 | 75 | 85,
    finish: 'Sage Green' as 'Sage Green' | 'Warm Oak' | 'Dark Walnut' | 'Anthracite' | 'Calacatta White',
    panelMaterial: 'Wood Slats' as 'Wood Slats' | 'Dark Marble' | 'Calacatta Marble' | 'Matt Black',
    ledTone: 'Warm 3000K' as 'Warm 3000K' | 'Natural 4000K' | 'Cool 6000K' | 'Off',
    hasGlassVitrine: true,
    hasFloatingConsole: true,
    drawerCount: 3
  });

  // Price & Stock Costing Settings
  const [boardUnitPrice, setBoardUnitPrice] = useState<number>(65); // € / pllakë 2800x2070
  const [edgeTapePrice, setEdgeTapePrice] = useState<number>(24);  // € / rol
  const [hardwareUnitPrice, setHardwareUnitPrice] = useState<number>(46); // € / set Tandembox
  const [screwsPrice, setScrewsPrice] = useState<number>(4);      // € / element
  const [laborCost, setLaborCost] = useState<number>(200);        // € punë
  const [stockBoardsAvailable, setStockBoardsAvailable] = useState<number>(2); // Current stock

  // TV Wall & Photorealistic 3D Customizer State (Hapi 10)
  const [tvWallFinish, setTvWallFinish] = useState<'Sage Green' | 'Warm Oak' | 'Dark Walnut' | 'Anthracite' | 'Calacatta White'>('Sage Green');
  const [wallPanelMaterial, setWallPanelMaterial] = useState<'Wood Slats' | 'Dark Marble' | 'Calacatta Marble' | 'Matt Black'>('Wood Slats');
  const [ledTone, setLedTone] = useState<'Warm 3000K' | 'Natural 4000K' | 'Cool 6000K' | 'Off'>('Warm 3000K');
  const [tvSize, setTvSize] = useState<55 | 65 | 75 | 85>(75);
  const [hasGlassVitrine, setHasGlassVitrine] = useState<boolean>(true);
  const [hasFloatingConsole, setHasFloatingConsole] = useState<boolean>(true);
  const [ledBrightness, setLedBrightness] = useState<number>(85); // 0-100%
  const [studioViewMode, setStudioViewMode] = useState<'2D' | '3D'>('3D'); // 2D Map vs 3D Photo View

  // TV Wall Decor & LED Layout Map Items State
  const [decorItems, setDecorItems] = useState<{ id: string; name: string; icon: string; x: number; y: number }[]>([
    { id: 'dec-1', name: 'Soundbar Pro', icon: '🔊', x: 50, y: 72 },
    { id: 'dec-2', name: 'Vazë Keramike', icon: '🏺', x: 20, y: 72 },
    { id: 'dec-3', name: 'Bimë Ambientale', icon: '🪴', x: 82, y: 72 },
    { id: 'dec-4', name: 'Kornizë Arti', icon: '🖼️', x: 82, y: 30 },
  ]);

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
        
        if (el.frontMaterial === 'Profile Alumini' || el.frontMaterial === 'Xham Vitrinë') {
          // Profile frame cuts
          list.push({
            id: `${el.id}-prof-vert`,
            elementName: el.name,
            partName: `Profile Alumini Vertikale (Kornizë xhami)`,
            width: 22,
            height: frontHeight,
            quantity: 2 * frontQty,
            material: 'Profil Alumini e Zezë/Ar',
            edgeBanding: 'Kornizë'
          });
          list.push({
            id: `${el.id}-prof-horiz`,
            elementName: el.name,
            partName: `Profile Alumini Horizontale (Kornizë xhami)`,
            width: wMm - 42,
            height: 22,
            quantity: 2 * frontQty,
            material: 'Profil Alumini e Zezë/Ar',
            edgeBanding: 'Kornizë'
          });
          // Glass panel insert for doors
          list.push({
            id: `${el.id}-glass-panel`,
            elementName: el.name,
            partName: `Xham 4mm për Dyer Vitrinë (${frontQty} copë)`,
            width: Math.max(100, wMm - 40),
            height: Math.max(100, frontHeight - 40),
            quantity: frontQty,
            material: 'Xham 4mm Transparent/Smoked',
            edgeBanding: 'Prerje Sharre'
          });
        } else {
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
      }

      // 6. Rafta Xhami (Glass Shelves for wall elements & glass display units)
      if (el.type === 'wall' || el.frontMaterial === 'Xham Vitrinë' || el.frontMaterial === 'Profile Alumini') {
        list.push({
          id: `${el.id}-glass-shelf`,
          elementName: el.name,
          partName: 'Raft Xhami 6mm/8mm (2 copë)',
          width: Math.max(100, wMm - 36),
          height: Math.max(100, dMm - 20),
          quantity: 2,
          material: 'Xham 6mm / 8mm (Lustrim me Buza)',
          edgeBanding: 'Këndet e Lustruara'
        });
      }

      // 7. Fijokat Tandembox/Antaro internal boxes
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

  // Per-Panel Utilization percentages array for top display (LART) - Request from User
  const panelUtilizations = Array.from({ length: totalSheetsRequired }).map((_, idx) => {
    const baseUtil = 100 - wastePercentage;
    const variances = [3, 1, -2, 2, -1, 4, -3];
    return Math.min(98, Math.max(70, baseUtil + (variances[idx % variances.length] || 0)));
  });

  // Helper: Total Cost Breakdown (Hapi 7)
  const totalBoardsCost = totalSheetsRequired * boardUnitPrice;
  const totalTapeCost = edgeTapePrice;
  const totalTandemboxSets = project.elements.reduce((sum, e) => sum + e.drawerCount, 0);
  const totalHardwareCost = totalTandemboxSets * hardwareUnitPrice;
  const totalScrewsCost = project.elements.length * screwsPrice;
  const grandTotalCost = totalBoardsCost + totalTapeCost + totalHardwareCost + totalScrewsCost + laborCost;

  // Inventory Stock Alert (Hapi 9)
  const missingBoards = Math.max(0, totalSheetsRequired - stockBoardsAvailable);

  // Helper: Export Glass & Profile Cuts directly to Viber / Sharre Xhami
  const handleShareGlassToViber = () => {
    // Filter all glass & profile parts
    const glassParts = cutList.filter(p => 
      p.partName.toLowerCase().includes('xham') || 
      p.partName.toLowerCase().includes('profile') || 
      p.material.toLowerCase().includes('xham') ||
      p.material.toLowerCase().includes('alumini')
    );

    let msg = `📲 SPECIFIKIMI I PRERJES SË XHAMAVE & PROFILEVE ALUMINI\n`;
    msg += `🏛 MergimGroup Pro Studio | Klienti: ${project.clientName || 'Klient i ri'}\n`;
    msg += `📅 Data: ${project.date}\n`;
    msg += `------------------------------------------\n`;

    if (glassParts.length > 0) {
      glassParts.forEach((item, i) => {
        msg += `${i + 1}. ${item.elementName} → ${item.partName}\n`;
        msg += `   📐 Prerja: ${item.width} mm x ${item.height} mm (${item.quantity} copë)\n`;
        msg += `   ⚙ Materiali: ${item.material}\n`;
      });
    } else {
      // Auto-calculate exact glass dimensions for all elements
      project.elements.forEach((el, i) => {
        const wMm = el.width * 10;
        const hMm = el.height * 10;
        const dMm = el.depth * 10;
        msg += `${i + 1}. ${el.name} (${el.width}cm x ${el.height}cm):\n`;
        msg += `   • Xham 4mm dyer: ${wMm - 40} mm x ${hMm - 40} mm (2 copë)\n`;
        msg += `   • Raft Xhami 6mm/8mm: ${wMm - 36} mm x ${dMm - 20} mm (2 copë me buza të lustruara)\n`;
        msg += `   • Profile Alumini kornizë: 2x ${hMm} mm vertikale, 2x ${wMm - 42} mm horizontale\n`;
      });
    }

    msg += `------------------------------------------\n`;
    msg += `🔗 Shiko projektin online: http://www.instagram.com/mergimd1\n`;
    msg += `✍ Zhvilluar nga Mergim Dakaj`;

    navigator.clipboard.writeText(msg);
    if (showToast) showToast('Specifikimi i xhamave u kopjua! Po hapet Viber...', 'success');
    
    // Open Viber share protocol
    window.open(`viber://forward?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

  // AI Unik Fast Auto TV Wall Generator
  const handleExecuteAiMagicProposal = () => {
    const wallLen = aiWizard.wallLength;
    const newElements: CabinetElement[] = [];

    // Sync TV Wall studio states from AI Wizard choices
    setTvWallFinish(aiWizard.finish);
    setWallPanelMaterial(aiWizard.panelMaterial);
    setLedTone(aiWizard.ledTone);
    setTvSize(aiWizard.tvSize);
    setHasGlassVitrine(aiWizard.hasGlassVitrine);
    setHasFloatingConsole(aiWizard.hasFloatingConsole);

    let currentX = 0;

    // 1. Floating Console / Low TV Console with Tandembox drawers
    if (aiWizard.hasFloatingConsole) {
      const consoleW = Math.min(240, Math.max(160, wallLen - 80));
      newElements.push({
        id: `el-tv-${Date.now()}-1`,
        name: `Konsole e Pezulluar TV ${consoleW}cm`,
        type: 'base',
        width: consoleW,
        height: 38,
        depth: 42,
        materialThickness: 18,
        drawerSystem: 'Tandembox',
        drawerCount: aiWizard.drawerCount || 3,
        frontMaterial: aiWizard.finish === 'Calacatta White' ? 'MDF' : 'Ivericë',
        applianceType: 'standard',
        xPosition: currentX,
        wallIndex: 'A'
      });
      currentX += consoleW;
    }

    // 2. Glass Vitrine Unit if requested
    if (aiWizard.hasGlassVitrine && currentX + 60 <= wallLen) {
      newElements.push({
        id: `el-tv-${Date.now()}-2`,
        name: 'Vitrinë Xhami me LED 60cm',
        type: 'tall',
        width: 60,
        height: 210,
        depth: 38,
        materialThickness: 18,
        drawerSystem: 'Tandembox',
        drawerCount: 0,
        frontMaterial: 'Xham Vitrinë',
        applianceType: 'standard',
        xPosition: currentX,
        wallIndex: 'A'
      });
      currentX += 60;
    }

    // 3. Wood Slats / Marble Wall Panel Frame
    newElements.push({
      id: `el-tv-${Date.now()}-3`,
      name: `Panel Dekorativ Prapa TV (${aiWizard.panelMaterial})`,
      type: 'wall',
      width: Math.min(wallLen, 280),
      height: 160,
      depth: 10,
      materialThickness: 18,
      drawerSystem: 'Tandembox',
      drawerCount: 0,
      frontMaterial: 'Profile Alumini',
      applianceType: 'standard',
      xPosition: 0,
      wallIndex: 'A'
    });

    setProject(prev => ({
      ...prev,
      wallAWidth: wallLen,
      elements: newElements
    }));

    setShowAiModal(false);
    setActiveStep(10); // Jump directly to Step 10: TV Wall 3D/2D Studio!
    if (showToast) showToast('🚀 AI gjeneroi kompozicionin e plotë të TV Wall me sukses!', 'success');
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
                  MODULI PRO
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> KUZHINA PRO
                </span>
              </div>
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Studio Inxhinierike e Prodhimit</span>
                <a
                  href="https://www.instagram.com/mergimd1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-extrabold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 transition-all cursor-pointer"
                  title="Klikoni për të hapur Instagramin e Mergim Dakaj (@mergimd1)"
                >
                  Nga Mergim Dakaj ↗
                </a>
              </h1>
            </div>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-3">
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
            { step: 5, label: 'Hapi 5: Lista e Pjesëve', icon: Cpu },
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

              {/* SPECIFIKIMI I XHAMAVE & RAFTAVE TË XHOMIT CARD (PËR VIBER) */}
              <div className="mt-6 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-2 border-purple-500/60 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-500/30 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 font-black text-lg shadow-lg">
                      💎
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Specifikimi i Xhamave & Raftave të Xhomit</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-bold uppercase">
                          Gatshëm për Viber / Sharre Xhami
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        Llogaritja e saktë automatike e dyerve me xham, raftave të xhomit dhe profileve alumini për prerje!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleShareGlassToViber}
                    className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/30 flex items-center gap-2 border border-purple-400/40 cursor-pointer"
                  >
                    <span>📱 Dërgo Xhamat në Viber</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-semibold">
                  {cutList.filter(p => p.partName.toLowerCase().includes('xham') || p.partName.toLowerCase().includes('profile')).length > 0 ? (
                    cutList.filter(p => p.partName.toLowerCase().includes('xham') || p.partName.toLowerCase().includes('profile')).map((item, idx) => (
                      <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-purple-500/30 space-y-1">
                        <span className="text-[10px] font-black uppercase text-purple-300 block truncate">{item.elementName}</span>
                        <span className="text-xs font-bold text-white block">{item.partName}</span>
                        <div className="flex items-center justify-between text-emerald-400 font-mono text-xs pt-1 border-t border-slate-800">
                          <span>{item.width} x {item.height} mm</span>
                          <span className="text-amber-300 font-bold">{item.quantity}x</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    project.elements.map((el, idx) => (
                      <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-purple-500/30 space-y-1">
                        <span className="text-[10px] font-black uppercase text-purple-300 block truncate">{el.name}</span>
                        <span className="text-xs font-bold text-white block">Xham Dyer + Raft Xhami</span>
                        <div className="text-[11px] text-slate-300 font-mono space-y-0.5 pt-1 border-t border-slate-800">
                          <p>• Xham 4mm: <strong className="text-emerald-400">{el.width * 10 - 40} x {el.height * 10 - 40} mm</strong></p>
                          <p>• Raft Xhami: <strong className="text-emerald-400">{el.width * 10 - 36} x {el.depth * 10 - 20} mm</strong></p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

              {/* TOP SUMMARY FOR ALL PANELS (LART) - Directly requested by User */}
              <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border-2 border-emerald-500/60 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-emerald-500/30 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Prerja është e Optimizuar</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] uppercase tracking-wider font-extrabold">
                          Gjithsej {totalSheetsRequired} Pllaka
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 font-medium">
                        Skema është llogaritur me shfrytëzimin maksimal për secilën pllakë:
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">Shfrytëzimi Mesatar</span>
                    <span className="text-xl font-black text-emerald-300 font-mono">{100 - wastePercentage}%</span>
                  </div>
                </div>

                {/* Individual Panel Percentages Grid (Paneli 1, Paneli 2, ... Paneli N) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {panelUtilizations.map((util, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        const el = document.getElementById(`kuzhina-sheet-${idx + 1}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('ring-4', 'ring-emerald-400', 'border-emerald-400');
                          setTimeout(() => {
                            el.classList.remove('ring-4', 'ring-emerald-400', 'border-emerald-400');
                          }, 2000);
                        }
                      }}
                      className="bg-slate-950/90 border border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/60 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-md transition-all hover:scale-105 cursor-pointer group"
                    >
                      <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-emerald-300 tracking-wider mb-1">
                        Paneli {idx + 1}
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                        {util}%
                      </span>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full"
                          style={{ width: `${util}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                        <span>E Optimizuar</span>
                        <span className="text-[8px] text-emerald-400 font-extrabold uppercase">Shiko ↓</span>
                      </span>
                    </button>
                  ))}
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
                  {panelUtilizations.map((util, idx) => (
                    <div key={idx} id={`kuzhina-sheet-${idx + 1}`} className="bg-slate-950 p-4 rounded-2xl border border-indigo-800/60 space-y-3 transition-all duration-300">
                      <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                        <span>Paneli #{idx + 1} (2800x2070mm)</span>
                        <span className="text-emerald-400">Shfrytëzimi ~{util}%</span>
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

        {/* STEP 10: STUDIO 3D CAD PËR TV WALL & MOBILJE */}
        {activeStep === 10 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <TvWallStudioMain onBack={() => setActiveStep(8)} showToast={showToast} />
          </motion.div>
        )}

      </main>

      {/* OFFICIAL FORMAL CREATOR FOOTER */}
      <footer className="mt-12 py-6 border-t border-indigo-900/40 bg-slate-950/80 text-center px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-base shadow-lg">
              👑
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block">
                Arkitektura Zyrtare e Platformës
              </span>
              <span className="text-xs font-black text-white">
                Krijuar & Zhvilluar nga{' '}
                <a
                  href="https://www.instagram.com/mergimd1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 underline font-extrabold hover:text-amber-200 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                  title="Klikoni për të hapur Instagramin e Mergim Dakaj (@mergimd1)"
                >
                  Mergim Dakaj ↗
                </a>
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            MergimGroup Pro Studio • Standard Inxhinierik për Kuzhina & Mobilje
          </div>
        </div>
      </footer>

    </div>
  );
}
