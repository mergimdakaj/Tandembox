import { useState, useMemo, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Trash2, Plus, Info, Download, AlertTriangle, RefreshCw, Scissors, Grid, Layers, RotateCw, Check, Compass, HelpCircle, Printer, ArrowLeftRight } from 'lucide-react';

interface CutPart {
  id: string;
  name: string;
  width: number; // in cm
  height: number; // in cm
  quantity: number;
  allowRotation: boolean;
}

interface PlacedPart {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  originalW?: number;
  originalH?: number;
  rotated: boolean;
}

interface LeftoverSpace {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SheetLayout {
  sheetIndex: number;
  width: number;
  height: number;
  trimmedWidth: number;
  trimmedHeight: number;
  trimLeft: number;
  trimRight: number;
  trimTop: number;
  trimBottom: number;
  placedParts: PlacedPart[];
  leftovers: LeftoverSpace[];
  utilization: number; // percentage
  wasteArea: number; // cm²
  usedArea: number; // cm²
}

// Dynamically generate high-contrast pastel colors based on sorted dimension keys (dimension-invariant)
export const getPartColorForDimension = (w: number, h: number) => {
  const dMin = Math.min(w, h);
  const dMax = Math.max(w, h);
  const dimKey = `${dMin}x${dMax}`;

  let hash = 0;
  for (let i = 0; i < dimKey.length; i++) {
    hash = dimKey.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Beautiful highly-legible pastel colors that print wonderfully in B&W too
  const colors = [
    { fill: '#e0e7ff', stroke: '#4f46e5', text: '#1e1b4b', grain: '#4f46e5' }, // light indigo
    { fill: '#d1fae5', stroke: '#059669', text: '#064e3b', grain: '#059669' }, // light emerald
    { fill: '#fef3c7', stroke: '#d97706', text: '#451a03', grain: '#d97706' }, // light amber
    { fill: '#ecfeff', stroke: '#0891b2', text: '#083344', grain: '#0891b2' }, // light cyan
    { fill: '#f3e8ff', stroke: '#9333ea', text: '#3b0764', grain: '#9333ea' }, // light purple
    { fill: '#ffe4e6', stroke: '#e11d48', text: '#4c0519', grain: '#e11d48' }, // light rose
    { fill: '#f0fdf4', stroke: '#16a34a', text: '#14532d', grain: '#16a34a' }, // light green
    { fill: '#fff7ed', stroke: '#ea580c', text: '#7c2d12', grain: '#ea580c' }, // light orange
    { fill: '#f5f3ff', stroke: '#7c3aed', text: '#4c1d95', grain: '#7c3aed' }, // light violet
    { fill: '#fff1f2', stroke: '#f43f5e', text: '#4c0519', grain: '#f43f5e' }, // light pink
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function PanelCuttingOptimizer() {
  // Master Sheet size
  const [sheetWidth, setSheetWidth] = useState<number | ''>(280); // e.g. 280 cm
  const [sheetHeight, setSheetHeight] = useState<number | ''>(207);

  // Blade width (kerf) - default 0.4 cm (4 mm)
  const [bladeWidth, setBladeWidth] = useState<number | ''>(0.4);

  // Pre-milling / Edgebanding (+4mm automatic size adjustment) - default true
  const [addPreMilling, setAddPreMilling] = useState<boolean>(true);

  // Grain direction for wood texture simulation
  // 'none' (solid color/MDF), 'vertical' (grain runs up/down), 'horizontal' (grain runs left/right)
  const [grainDirection, setGrainDirection] = useState<'none' | 'vertical' | 'horizontal'>('vertical');

  // Edge trimming options
  const [trimLeft] = useState<number>(1);
  const [trimRight] = useState<number>(1);
  const [trimTop] = useState<number>(1);
  const [trimBottom] = useState<number>(1);

  // Quick trim helpers (e.g. damage clean up)
  const [damageLeft, setDamageLeft] = useState<boolean>(false);
  const [damageRight, setDamageRight] = useState<boolean>(false);
  const [damageTop, setDamageTop] = useState<boolean>(false);
  const [damageBottom, setDamageBottom] = useState<boolean>(false);
  const [cleaningAmount, setCleaningAmount] = useState<number>(5);

  // If damage checkbox is checked, use the chosen cleaningAmount. If not checked, use the standard 1cm trim.
  const activeTrimLeft = useMemo(() => (damageLeft ? cleaningAmount : trimLeft), [trimLeft, damageLeft, cleaningAmount]);
  const activeTrimRight = useMemo(() => (damageRight ? cleaningAmount : trimRight), [trimRight, damageRight, cleaningAmount]);
  const activeTrimTop = useMemo(() => (damageTop ? cleaningAmount : trimTop), [trimTop, damageTop, cleaningAmount]);
  const activeTrimBottom = useMemo(() => (damageBottom ? cleaningAmount : trimBottom), [trimBottom, damageBottom, cleaningAmount]);

  // Cut parts list
  const [parts, setParts] = useState<CutPart[]>([]);

  // Kitchen code / project name (e.g. 05/05)
  const [kitchenCode, setKitchenCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pc_kitchen_code') || '';
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pc_kitchen_code', kitchenCode);
    }
  }, [kitchenCode]);

  // New part entry inputs
  const [newPartName, setNewPartName] = useState<string>('');
  const [newPartWidth, setNewPartWidth] = useState<number | ''>(600);
  const [newPartHeight, setNewPartHeight] = useState<number | ''>(200);
  const [newPartQty, setNewPartQty] = useState<number | ''>(2);
  const [newPartRotate, setNewPartRotate] = useState<boolean>(true);

  // Calculated layout results state
  const [calculatedResults, setCalculatedResults] = useState<{
    sheets: SheetLayout[];
    unplacedItems: { part: CutPart; w: number; h: number }[];
  } | null>(null);

  // Indicator to show that details or sizes have changed and need regeneration
  const [isStale, setIsStale] = useState<boolean>(true);

  // Quick Preset buttons for sheet sizes
  const applySheetPreset = (w: number, h: number) => {
    setSheetWidth(w);
    setSheetHeight(h);
    setIsStale(true);
  };

  // Add Part
  const addPart = (e: FormEvent) => {
    e.preventDefault();
    const wMm = Number(newPartWidth);
    const hMm = Number(newPartHeight);
    const qty = Number(newPartQty);
    if (!newPartName.trim() || !wMm || wMm <= 0 || !hMm || hMm <= 0 || !qty || qty <= 0) return;
    
    // Convert mm inputs to internal cm values (divide by 10)
    const wCm = wMm / 10;
    const hCm = hMm / 10;
    
    setParts(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newPartName.trim(),
        width: wCm,
        height: hCm,
        quantity: qty,
        allowRotation: newPartRotate,
      }
    ]);
    setNewPartName('');
    setIsStale(true);
  };

  // Quick action to add a leftover space as a new part
  const addPartFromLeftover = (w: number, h: number) => {
    const name = `Raft ${(w * 10).toFixed(0)}x${(h * 10).toFixed(0)} mm`;
    const newPart: CutPart = {
      id: Date.now().toString(),
      name,
      width: w,
      height: h,
      quantity: 1,
      allowRotation: true
    };
    const updatedParts = [...parts, newPart];
    setParts(updatedParts);
    setIsStale(false);
    
    // Instantly optimize the layout with the new parts list
    setTimeout(() => {
      runOptimization(updatedParts);
    }, 50);
  };

  // Remove Part
  const removePart = (id: string) => {
    setParts(prev => prev.filter(p => p.id !== id));
    setIsStale(true);
  };

  // Update Part parameters
  const updatePartField = (id: string, field: keyof CutPart, value: any) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    setIsStale(true);
  };

  // High-performance multi-strategy nesting optimizer to achieve > 80% utilization
  const runOptimization = (overrideParts?: CutPart[]) => {
    const sw = Number(sheetWidth) || 280;
    const sh = Number(sheetHeight) || 207;
    const bw = Number(bladeWidth) ?? 0.4;

    const partsList = Array.isArray(overrideParts) ? overrideParts : parts;

    // Collect all requested parts into individual items
    const rawItemsList: { part: CutPart; originalW: number; originalH: number }[] = [];
    partsList.forEach(p => {
      const qty = Number(p.quantity) || 0;
      for (let i = 0; i < qty; i++) {
        rawItemsList.push({
          part: p,
          originalW: Number(p.width) || 0,
          originalH: Number(p.height) || 0
        });
      }
    });

    if (rawItemsList.length === 0) {
      const trimmedW = sw - activeTrimLeft - activeTrimRight;
      const trimmedH = sh - activeTrimTop - activeTrimBottom;
      const emptySheet: SheetLayout = {
        sheetIndex: 1,
        width: sw,
        height: sh,
        trimmedWidth: trimmedW,
        trimmedHeight: trimmedH,
        trimLeft: activeTrimLeft,
        trimRight: activeTrimRight,
        trimTop: activeTrimTop,
        trimBottom: activeTrimBottom,
        placedParts: [],
        leftovers: [
          { id: 'empty-1', x: activeTrimLeft, y: activeTrimTop, w: trimmedW, h: trimmedH }
        ],
        utilization: 0,
        wasteArea: sw * sh,
        usedArea: 0
      };
      setCalculatedResults({ sheets: [emptySheet], unplacedItems: [] });
      setIsStale(false);
      return;
    }

    // Try multiple sorting strategies and pick the one with highest average utilization!
    const sortingStrategies = [
      // 1. Area Descending (standard best-practice)
      (a: any, b: any) => (b.originalW * b.originalH) - (a.originalW * a.originalH),
      // 2. Max Dimension Descending (helps place long skinny pieces first)
      (a: any, b: any) => Math.max(b.originalW, b.originalH) - Math.max(a.originalW, a.originalH),
      // 3. Width Descending
      (a: any, b: any) => b.originalW - a.originalW,
      // 4. Height Descending
      (a: any, b: any) => b.originalH - a.originalH,
    ];

    interface CandidateResult {
      sheets: SheetLayout[];
      unplacedItems: { part: CutPart; w: number; h: number }[];
      avgUtilization: number;
    }

    const candidates: CandidateResult[] = [];

    sortingStrategies.forEach((sortFn) => {
      const sortedItems = [...rawItemsList].sort(sortFn);
      
      const sheets: SheetLayout[] = [];
      const unplacedItems: { part: CutPart; w: number; h: number }[] = [];

      const createNewSheet = (index: number): SheetLayout => {
        const trimmedW = sw - activeTrimLeft - activeTrimRight;
        const trimmedH = sh - activeTrimTop - activeTrimBottom;
        return {
          sheetIndex: index,
          width: sw,
          height: sh,
          trimmedWidth: trimmedW,
          trimmedHeight: trimmedH,
          trimLeft: activeTrimLeft,
          trimRight: activeTrimRight,
          trimTop: activeTrimTop,
          trimBottom: activeTrimBottom,
          placedParts: [],
          leftovers: [],
          utilization: 0,
          wasteArea: 0,
          usedArea: 0
        };
      };

      let currentSheetIndex = 1;
      let currentSheet = createNewSheet(currentSheetIndex);

      interface Shelf {
        y: number;
        h: number;
        usedX: number;
      }
      const sheetShelves: Record<number, Shelf[]> = { 1: [] };

      sortedItems.forEach(item => {
        const originalW = item.originalW;
        const originalH = item.originalH;
        if (originalW <= 0 || originalH <= 0) return;

        const effectiveW = addPreMilling ? originalW + 0.4 : originalW;
        const effectiveH = addPreMilling ? originalH + 0.4 : originalH;

        let placed = false;

        // Try placing in existing sheets
        for (let sIdx = 1; sIdx <= currentSheetIndex; sIdx++) {
          const targetSheet = sIdx === currentSheetIndex ? currentSheet : sheets.find(sh => sh.sheetIndex === sIdx);
          if (!targetSheet) continue;

          const maxW = targetSheet.trimmedWidth;
          const maxH = targetSheet.trimmedHeight;

          // Test both orientations to see which packs tighter!
          const orientations = item.part.allowRotation && effectiveW !== effectiveH 
            ? [{ w: effectiveW, h: effectiveH, rot: false }, { w: effectiveH, h: effectiveW, rot: true }]
            : [{ w: effectiveW, h: effectiveH, rot: false }];

          for (const orient of orientations) {
            const { w, h, rot } = orient;
            if (w > maxW || h > maxH) continue;

            let shelves = sheetShelves[sIdx];
            if (!shelves) {
              sheetShelves[sIdx] = [];
              shelves = sheetShelves[sIdx];
            }

            // Find first shelf that fits
            for (let shelf of shelves) {
              const neededX = shelf.usedX === 0 ? w : shelf.usedX + bw + w;
              
              if (neededX <= maxW && h <= shelf.h) {
                const posX = shelf.usedX === 0 ? 0 : shelf.usedX + bw;
                targetSheet.placedParts.push({
                  id: item.part.id + '_' + Math.random().toString(36).substr(2, 5),
                  name: item.part.name,
                  x: targetSheet.trimLeft + posX,
                  y: targetSheet.trimTop + shelf.y,
                  w,
                  h,
                  originalW,
                  originalH,
                  rotated: rot
                });

                shelf.usedX = posX + w;
                placed = true;
                break;
              }
            }

            if (placed) break;

            // If no existing shelf can take it, try spawning a new shelf on this sheet
            const currentShelvesHeight = shelves.reduce((sum, sh) => sum + sh.h + bw, 0);
            const neededY = currentShelvesHeight === 0 ? 0 : currentShelvesHeight;

            if (neededY + h <= maxH) {
              const newShelf: Shelf = {
                y: neededY,
                h: h,
                usedX: w
              };
              shelves.push(newShelf);

              targetSheet.placedParts.push({
                id: item.part.id + '_' + Math.random().toString(36).substr(2, 5),
                name: item.part.name,
                x: targetSheet.trimLeft + 0,
                y: targetSheet.trimTop + neededY,
                w,
                h,
                originalW,
                originalH,
                rotated: rot
              });

              placed = true;
              break;
            }
          }

          if (placed) break;
        }

        // If still not placed, make a brand new sheet
        if (!placed) {
          sheets.push(currentSheet);

          currentSheetIndex++;
          currentSheet = createNewSheet(currentSheetIndex);
          sheetShelves[currentSheetIndex] = [];

          const maxW = currentSheet.trimmedWidth;
          const maxH = currentSheet.trimmedHeight;

          const orientations = item.part.allowRotation && effectiveW !== effectiveH 
            ? [{ w: effectiveW, h: effectiveH, rot: false }, { w: effectiveH, h: effectiveW, rot: true }]
            : [{ w: effectiveW, h: effectiveH, rot: false }];

          for (const orient of orientations) {
            const { w, h, rot } = orient;
            if (w <= maxW && h <= maxH) {
              const newShelf: Shelf = {
                y: 0,
                h: h,
                usedX: w
              };
              sheetShelves[currentSheetIndex].push(newShelf);

              currentSheet.placedParts.push({
                id: item.part.id + '_' + Math.random().toString(36).substr(2, 5),
                name: item.part.name,
                x: currentSheet.trimLeft + 0,
                y: currentSheet.trimTop + 0,
                w,
                h,
                originalW,
                originalH,
                rotated: rot
              });
              placed = true;
              break;
            }
          }

          if (!placed) {
            unplacedItems.push({
              part: item.part,
              w: originalW,
              h: originalH
            });
          }
        }
      });

      if (currentSheet.placedParts.length > 0 || sheets.length === 0) {
        sheets.push(currentSheet);
      }

      // Compute leftovers and statistics for this candidate layout
      let totalUtilization = 0;
      const totalRawArea = sw * sh;

      sheets.forEach(shLayout => {
        const usedArea = shLayout.placedParts.reduce((sum, p) => sum + (p.w * p.h), 0);
        shLayout.usedArea = Number(usedArea.toFixed(1));
        shLayout.utilization = Number(((usedArea / totalRawArea) * 100).toFixed(1));
        shLayout.wasteArea = Number((totalRawArea - usedArea).toFixed(1));
        totalUtilization += shLayout.utilization;

        // Calculate actual leftovers (useful empty spaces) on shelves & remaining sheet space
        const shelves = sheetShelves[shLayout.sheetIndex] || [];
        
        // 1. Leftover space at the end of each shelf
        shelves.forEach(shelf => {
          const remW = shLayout.trimmedWidth - shelf.usedX;
          if (remW > 10 && shelf.h > 10) { // minimum useful size 10x10 cm
            shLayout.leftovers.push({
              id: `leftover_shelf_${shelf.y}`,
              x: shLayout.trimLeft + shelf.usedX,
              y: shLayout.trimTop + shelf.y,
              w: Number(remW.toFixed(1)),
              h: Number(shelf.h.toFixed(1))
            });
          }
        });

        // 2. Large leftover block at the top/bottom of the sheet if not fully height-packed
        const currentShelvesHeight = shelves.reduce((sum, sh) => sum + sh.h + bw, 0);
        const remH = shLayout.trimmedHeight - currentShelvesHeight;
        if (remH > 10) {
          shLayout.leftovers.push({
            id: 'leftover_top_block',
            x: shLayout.trimLeft,
            y: shLayout.trimTop + currentShelvesHeight,
            w: Number(shLayout.trimmedWidth.toFixed(1)),
            h: Number(remH.toFixed(1))
          });
        }
      });

      const avgUtilization = sheets.length > 0 ? (totalUtilization / sheets.length) : 0;

      candidates.push({
        sheets,
        unplacedItems,
        avgUtilization
      });
    });

    // Pick the absolute best candidate (prioritizes fewest sheets, then highest average utilization)
    candidates.sort((a, b) => {
      if (a.sheets.length !== b.sheets.length) {
        return a.sheets.length - b.sheets.length;
      }
      return b.avgUtilization - a.avgUtilization;
    });

    const bestResult = candidates[0];
    if (bestResult) {
      setCalculatedResults({
        sheets: bestResult.sheets,
        unplacedItems: bestResult.unplacedItems
      });
    }
    setIsStale(false);
  };

  // Run initial optimization on mount
  useEffect(() => {
    runOptimization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Export cutting details text
  const exportPlan = () => {
    if (!calculatedResults) return;
    const sw = Number(sheetWidth) || 280;
    const sh = Number(sheetHeight) || 207;
    const bw = Number(bladeWidth) ?? 0.4;

    let text = `RAPORTI I OPTIMIZIMIT TË PRERJES SË PANELEVE
------------------------------------------------------
Kodi i Kuzhinës: ${kitchenCode || 'I papërcaktuar'}
Paneli Master: ${sw * 10} x ${sh * 10} mm
Gjerësia e Sharrës (Kerf): ${bw * 10} mm
------------------------------------------------------
Pastrimi i Teheve (Trimming):
- Majtas: ${activeTrimLeft * 10} mm (Mbrojtje anësore ${damageLeft ? '+50mm' : 'normal'})
- Djathtas: ${activeTrimRight * 10} mm (Mbrojtje anësore ${damageRight ? '+50mm' : 'normal'})
- Sipër: ${activeTrimTop * 10} mm (Mbrojtje anësore ${damageTop ? '+50mm' : 'normal'})
- Poshtë: ${activeTrimBottom * 10} mm (Mbrojtje anësore ${damageBottom ? '+50mm' : 'normal'})
------------------------------------------------------

STATISTIKAT E PANELEVE TË PËRDORUR:
`;

    calculatedResults.sheets.forEach(shLayout => {
      text += `
PANELI MASTER #${shLayout.sheetIndex}:
- Shfrytëzimi: ${shLayout.utilization}%
- Sipërfaqja e përdorur: ${shLayout.usedArea} cm² (nga ${sw * sh} cm²)
- Pjesë të vendosura (${shLayout.placedParts.length}):
`;
      shLayout.placedParts.forEach((p, idx) => {
        text += `  [${idx + 1}] ${p.name} - ${(p.w * 10).toFixed(0)}x{(p.h * 10).toFixed(0)} mm (Pozicioni: X:${(p.x * 10).toFixed(0)}, Y:${(p.y * 10).toFixed(0)})${p.rotated ? ' [E rrotulluar]' : ''}\n`;
      });
      
      if (shLayout.leftovers.length > 0) {
        text += `\nHapësira të lira të pashfrytëzuara:\n`;
        shLayout.leftovers.forEach(l => {
          text += `  - ${(l.w * 10).toFixed(0)} x ${(l.h * 10).toFixed(0)} mm në pozicionin (X:${(l.x * 10).toFixed(0)}, Y:${(l.y * 10).toFixed(0)})\n`;
        });
      }

      text += `------------------------------------------------------`;
    });

    if (calculatedResults.unplacedItems.length > 0) {
      text += `\n\nPJESËT QË NUK NXËNË (Masa më e madhe se paneli):`;
      calculatedResults.unplacedItems.forEach(item => {
        text += `\n- ${item.part.name} (${(item.w * 10).toFixed(0)} x ${(item.h * 10).toFixed(0)} mm)`;
      });
    }

    text += `\n\nGjeneruar nga Tandembox Pro - MergimGroup`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skema_prerjes_paneleve.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wider flex items-center gap-2 flex-wrap">
              Optimizimi i Prerjes së Paneleve
              {kitchenCode && (
                <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 text-[10px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-normal">
                  Kuzhina: {kitchenCode}
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Llogarit shfrytëzimin maksimal të panelit me trashësi sharre {(Number(bladeWidth) || 0.4) * 10}mm
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportPlan}
            disabled={!calculatedResults}
            className="w-full md:w-auto py-2 px-4 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all border border-indigo-100 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Download className="w-4 h-4" /> Shkarko Skemën
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!calculatedResults}
            className="w-full md:w-auto py-2 px-4 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all border border-emerald-100 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" /> Printo në A4
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Setup & inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Master sheet custom specs */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-indigo-500" /> Dimensionet e Panelit (cm)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  Gjatësia e Panelit (W)
                </label>
                <input
                  type="number"
                  value={sheetWidth === '' ? '' : sheetWidth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSheetWidth(val === '' ? '' : Number(val));
                    setIsStale(true);
                  }}
                  className="w-full text-sm font-bold bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  placeholder="Gjatësia (W)"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  Gjerësia e Panelit (H)
                </label>
                <input
                  type="number"
                  value={sheetHeight === '' ? '' : sheetHeight}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSheetHeight(val === '' ? '' : Number(val));
                    setIsStale(true);
                  }}
                  className="w-full text-sm font-bold bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800"
                  placeholder="Gjerësia (H)"
                />
              </div>
            </div>

            {/* Quick Presets for standard panel sizes */}
            <div className="space-y-1.5">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest">
                Panele Standarde
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applySheetPreset(280, 207)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg transition-all"
                >
                  280 x 207 cm
                </button>
                <button
                  type="button"
                  onClick={() => applySheetPreset(376, 186)}
                  className="px-2.5 py-1 text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:border-indigo-400 hover:bg-white hover:text-indigo-600 rounded-lg transition-all"
                >
                  Bardh 22 (376x186 cm)
                </button>
                <button
                  type="button"
                  onClick={() => applySheetPreset(288, 122)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg transition-all"
                >
                  288 x 122 cm
                </button>
                <button
                  type="button"
                  onClick={() => applySheetPreset(244, 122)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg transition-all"
                >
                  244 x 122 cm
                </button>
              </div>
            </div>

            {/* Grain Direction Selector (Vija vertikale ose horizontale) */}
            <div className="pt-2 border-t border-slate-200/50 space-y-2">
              <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                Drejtimi i Vijave të Panelit (Wood Grain)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => { setGrainDirection('none'); setIsStale(true); }}
                  className={`py-1.5 text-[9px] font-bold uppercase rounded-lg border text-center transition-all ${
                    grainDirection === 'none'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  MDF / Pa Vija
                </button>
                <button
                  type="button"
                  onClick={() => { setGrainDirection('vertical'); setIsStale(true); }}
                  className={`py-1.5 text-[9px] font-bold uppercase rounded-lg border text-center transition-all ${
                    grainDirection === 'vertical'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Vertikale ↕
                </button>
                <button
                  type="button"
                  onClick={() => { setGrainDirection('horizontal'); setIsStale(true); }}
                  className={`py-1.5 text-[9px] font-bold uppercase rounded-lg border text-center transition-all ${
                    grainDirection === 'horizontal'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Horizontale ↔
                </button>
              </div>
            </div>

            {/* Blade width (Kerf) config - defaults to 4mm */}
            <div className="pt-2 border-t border-slate-200/50">
              <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                Trashësia e Sharrës (Kerf)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={bladeWidth === '' ? '' : bladeWidth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBladeWidth(val === '' ? '' : Number(val));
                    setIsStale(true);
                  }}
                  className="w-24 text-sm font-bold bg-white p-2 rounded-xl border border-slate-200 text-slate-800"
                  placeholder="Sharra (cm)"
                />
                <span className="text-[10px] text-slate-500 font-bold">
                  cm (standard: {Number(bladeWidth || 0) * 10}mm)
                </span>
              </div>
            </div>

            {/* Shto +4mm automatik per Kant (Edgebanding Pre-Milling) */}
            <div className="pt-2 border-t border-slate-200/50">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addPreMilling}
                  onChange={(e) => {
                    setAddPreMilling(e.target.checked);
                    setIsStale(true);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600"
                />
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wide">
                  Shto automatik +4mm për kant
                </span>
              </label>
              <p className="text-[9px] text-slate-400 mt-1 pl-6 leading-relaxed font-semibold">
                Shtohet automatikisht +4mm (0.4 cm) për prerje (për trak / kantim), por tregon dimensionet origjinale në hartë dhe printim për të shmangur ngatërresat.
              </p>
            </div>
          </div>

          {/* Damage Cleaning options (Trim side panels by chosen amount if damaged) */}
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/70 space-y-3.5">
            <h4 className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-amber-600" /> Pastrimi i Teheve ose Demtimet
            </h4>

            {/* Masa e Pastrimit Selector */}
            <div className="flex flex-col gap-1.5 pb-1">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                Zgjidh masën e pastrimit:
              </span>
              <div className="grid grid-cols-2 gap-2 bg-amber-100/40 p-1 rounded-xl border border-amber-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setCleaningAmount(2);
                    setIsStale(true);
                  }}
                  className={`py-1.5 px-3 text-xs font-black rounded-lg transition-all duration-200 ${
                    cleaningAmount === 2
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-800 hover:bg-white/50'
                  }`}
                >
                  20 mm (2 cm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCleaningAmount(5);
                    setIsStale(true);
                  }}
                  className={`py-1.5 px-3 text-xs font-black rounded-lg transition-all duration-200 ${
                    cleaningAmount === 5
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-800 hover:bg-white/50'
                  }`}
                >
                  50 mm (5 cm)
                </button>
              </div>
            </div>

            <p className="text-[10px] text-amber-700/80 leading-relaxed font-medium">
              Zgjidhni cilën anë të panelit dëshironi ta shkurtoni me <strong className="text-amber-900 font-black">{cleaningAmount * 10} mm</strong> për shkak të dëmtimeve ose pastrimit të makinës:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-100 hover:border-amber-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={damageLeft}
                  onChange={(e) => {
                    setDamageLeft(e.target.checked);
                    setIsStale(true);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-[10px] font-bold text-slate-700">Majtas ({cleaningAmount * 10} mm)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-100 hover:border-amber-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={damageRight}
                  onChange={(e) => {
                    setDamageRight(e.target.checked);
                    setIsStale(true);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-[10px] font-bold text-slate-700">Djathtas ({cleaningAmount * 10} mm)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-100 hover:border-amber-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={damageTop}
                  onChange={(e) => {
                    setDamageTop(e.target.checked);
                    setIsStale(true);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-[10px] font-bold text-slate-700">Sipër ({cleaningAmount * 10} mm)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-100 hover:border-amber-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={damageBottom}
                  onChange={(e) => {
                    setDamageBottom(e.target.checked);
                    setIsStale(true);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-[10px] font-bold text-slate-700">Poshtë ({cleaningAmount * 10} mm)</span>
              </label>
            </div>

            {/* Showing current total margins deducted */}
            <div className="text-[9px] text-slate-500 font-bold pt-2 border-t border-amber-100">
              Masa e pastër shfrytëzuese e panelit: <span className="text-indigo-600">{((Number(sheetWidth || 280) - activeTrimLeft - activeTrimRight) * 10).toFixed(0)} x {((Number(sheetHeight || 207) - activeTrimTop - activeTrimBottom) * 10).toFixed(0)} mm</span>
            </div>
          </div>

          {/* Form to add a new cut part */}
          <form onSubmit={addPart} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3.5">
            <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Shto Pjesë për Prerje
            </h4>

            <div className="space-y-1">
              <label className="block text-[8px] font-black uppercase text-indigo-500 tracking-wider">
                Kodi / Emri i Kuzhinës (p.sh. 05/05)
              </label>
              <input
                type="text"
                placeholder="Shkruaj kodin e kuzhinës..."
                value={kitchenCode}
                onChange={(e) => setKitchenCode(e.target.value)}
                className="w-full text-xs font-bold bg-white p-2 rounded-xl border border-indigo-100 text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                Emri i Pjesës (p.sh. Pod, Shpinë, Faqe)
              </label>
              <input
                type="text"
                placeholder="Emri i detajit..."
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="w-full text-xs font-semibold bg-white p-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-0.5">
                  Gjatësi (mm)
                </label>
                <input
                  type="number"
                  value={newPartWidth === '' ? '' : newPartWidth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPartWidth(val === '' ? '' : Number(val));
                  }}
                  className="w-full text-xs font-bold bg-white p-2 rounded-xl border border-slate-200 text-slate-800 text-center"
                  placeholder="mm"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-0.5">
                  Gjerësi (mm)
                </label>
                <input
                  type="number"
                  value={newPartHeight === '' ? '' : newPartHeight}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPartHeight(val === '' ? '' : Number(val));
                  }}
                  className="w-full text-xs font-bold bg-white p-2 rounded-xl border border-slate-200 text-slate-800 text-center"
                  placeholder="mm"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-0.5">
                  Sasia (copë)
                </label>
                <input
                  type="number"
                  value={newPartQty === '' ? '' : newPartQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPartQty(val === '' ? '' : Number(val));
                  }}
                  className="w-full text-xs font-bold bg-white p-2 rounded-xl border border-slate-200 text-slate-800 text-center"
                  placeholder="Cope"
                />
              </div>
            </div>

            <div className="flex justify-end pr-1 -mt-1.5">
              <button
                type="button"
                onClick={() => {
                  const w = newPartWidth;
                  const h = newPartHeight;
                  setNewPartWidth(h);
                  setNewPartHeight(w);
                }}
                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50/50 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 transition-all cursor-pointer"
              >
                <ArrowLeftRight className="w-2.5 h-2.5" /> Ndërro Gjatësi ↔ Gjerësi
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newPartRotate}
                  onChange={(e) => setNewPartRotate(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-[10px] font-bold text-slate-500">Lejo Rrotullimin</span>
              </label>
              
              <button
                type="submit"
                className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Shto Detaj
              </button>
            </div>
          </form>

          {/* List of current parts in layout with inline editing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Lista e Detajeve ({parts.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  setParts([]);
                  setIsStale(true);
                }}
                className="text-[9px] font-bold text-red-500 hover:underline"
              >
                Fshi të Gjitha
              </button>
            </div>

            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {parts.map(p => {
                const badgeColor = getPartColorForDimension(p.width, p.height);
                return (
                  <div key={p.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Color indicator badge representing part dimension */}
                      <div
                        className="w-2.5 h-8 rounded-full shrink-0 border"
                        style={{
                          backgroundColor: badgeColor.fill,
                          borderColor: badgeColor.stroke
                        }}
                        title={`Dimensioni: ${Math.min(p.width * 10, p.height * 10).toFixed(0)}x${Math.max(p.width * 10, p.height * 10).toFixed(0)} mm`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-extrabold text-slate-800 truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {(p.width * 10).toFixed(0)} x {(p.height * 10).toFixed(0)} mm | Sasia: {p.quantity} copë
                        </span>
                      </div>
                    </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Ndërro Gjatësi ↔ Gjerësi"
                      onClick={() => {
                        const currentW = p.width;
                        const currentH = p.height;
                        setParts(prev => prev.map(item => item.id === p.id ? { ...item, width: currentH, height: currentW } : item));
                        setIsStale(true);
                      }}
                      className="p-1 rounded-lg border bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3 h-3 rotate-90" />
                    </button>
                    <button
                      type="button"
                      title="Ndrysho lejen e rrotullimit"
                      onClick={() => updatePartField(p.id, 'allowRotation', !p.allowRotation)}
                      className={`p-1 rounded-lg border transition-all ${
                        p.allowRotation ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePart(p.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Right column: Optimization results & visual rendering */}
        <div className="lg:col-span-7 space-y-6">
          {/* Generation Trigger Panel */}
          <div className="bg-gradient-to-r from-indigo-50 to-slate-50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isStale ? (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
                )}
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                  {isStale ? "Keni Ndryshime të Reja" : "Prerja është e Optimizuar"}
                </h4>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {isStale 
                  ? "Klikoni butonin për të renditur masat në panel" 
                  : "Skema është llogaritur me shfrytëzimin maksimal"}
              </p>
            </div>

            <button
              type="button"
              onClick={runOptimization}
              className={`py-3 px-5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isStale
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 scale-102 hover:scale-105 active:scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              Gjenero Skemën
            </button>
          </div>

          {/* Warn about unplaced parts */}
          {calculatedResults && calculatedResults.unplacedItems.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4" /> Kujdes: Disa pjesë janë shumë të mëdha!
              </div>
              <p className="text-[11px] text-rose-600 leading-relaxed font-medium">
                Pjesët e mëposhtme kalojnë dimensionet maksimale të panelit të pastër ose nuk nxënë në asnjë mënyrë:
              </p>
              <ul className="list-disc pl-4 text-[10px] font-bold text-rose-600 space-y-0.5">
                {calculatedResults.unplacedItems.map((item, idx) => (
                  <li key={idx}>{item.part.name} ({(item.w * 10).toFixed(0)} x {(item.h * 10).toFixed(0)} mm)</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick summary of required sheets */}
          {calculatedResults && (
            <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                    Panele Master të Nevojshëm
                  </p>
                  <p className="text-lg font-black text-slate-800">
                    {calculatedResults.sheets.length} Copë
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-bold space-y-0.5">
                <p>Sharramania (Kerf): <span className="text-indigo-600">{(Number(bladeWidth) || 0.4)} cm ({(Number(bladeWidth) || 0.4) * 10} mm)</span></p>
                <p>Margjinat: L:{activeTrimLeft} R:{activeTrimRight} T:{activeTrimTop} B:{activeTrimBottom} cm</p>
                {addPreMilling && (
                  <p className="text-emerald-700 text-[9px] font-black leading-tight max-w-sm ml-auto">
                    * Harta bën hesap automatikisht +4 mm për kataric (shton panelin 0.4 cm më të madh dhe zbret çdo prerje përveç sharres, por tregon dimensionet origjinale në vizatim).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Visual Rendering for each sheet */}
          <div className="space-y-8">
            {calculatedResults ? (
              calculatedResults.sheets.map((sheet) => {
                const paddingLeft = 35;
                const paddingTop = 35;
                const viewWidth = sheet.width + paddingLeft * 2;
                const viewHeight = sheet.height + paddingTop * 2;

                return (
                  <div key={sheet.sheetIndex} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">
                        Paneli #{sheet.sheetIndex} ({sheet.width}x{sheet.height}cm)
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Shfrytëzimi: <strong className="text-emerald-600 text-sm font-black">{sheet.utilization}%</strong>
                      </span>
                    </div>

                    {/* SVG Container representing the board with dimensions outside */}
                    <div className="relative bg-slate-900 rounded-2xl p-4 overflow-hidden shadow-sm flex items-center justify-center">
                      <svg
                        viewBox={`-${paddingLeft} -${paddingTop} ${viewWidth} ${viewHeight}`}
                        className="w-full h-auto max-h-[450px]"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Define Patterns */}
                        <defs>
                          {/* Grid Background */}
                          <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#334155" strokeWidth="0.15" />
                          </pattern>

                          {/* CAD warning hatch pattern for trim margins */}
                          <pattern id="trimHatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="6" stroke="#f43f5e" strokeWidth="1.5" opacity="0.5" />
                          </pattern>

                          {/* Vertical Wood Grain Pattern (Walnut / Dru Arre) */}
                          <pattern id="grainVertical" width="12" height="120" patternUnits="userSpaceOnUse">
                            {/* Dark rich walnut wood background */}
                            <rect width="12" height="120" fill="#4d3319" />
                            {/* Prominent walnut wood grain lines every 12 cm */}
                            <path d="M 0 0 C 2.5 30, -1.5 90, 0 120" fill="none" stroke="#1d0e03" strokeWidth="1.2" opacity="0.9" />
                            <path d="M 6 0 C 4.5 40, 7.5 80, 6 120" fill="none" stroke="#251305" strokeWidth="0.6" opacity="0.8" />
                            <path d="M 12 0 C 14.5 30, 10.5 90, 12 120" fill="none" stroke="#1d0e03" strokeWidth="1.2" opacity="0.9" />
                            {/* Light wood rays / fibers */}
                            <path d="M 3 0 C 1 25, 4 95, 3 120" fill="none" stroke="#6b4c2e" strokeWidth="0.8" opacity="0.5" />
                            <path d="M 9 0 C 11 35, 7 85, 9 120" fill="none" stroke="#6b4c2e" strokeWidth="0.8" opacity="0.5" />
                            {/* Elegant organic growth ring wave */}
                            <path d="M 2 20 Q 8 60 2 100" fill="none" stroke="#1d0e03" strokeWidth="0.5" opacity="0.4" />
                            <path d="M 10 10 Q 4 50 10 90" fill="none" stroke="#1d0e03" strokeWidth="0.5" opacity="0.4" />
                          </pattern>

                          {/* Horizontal Wood Grain Pattern (Walnut / Dru Arre) */}
                          <pattern id="grainHorizontal" width="120" height="12" patternUnits="userSpaceOnUse">
                            {/* Dark rich walnut wood background */}
                            <rect width="120" height="12" fill="#4d3319" />
                            {/* Prominent walnut wood grain lines every 12 cm */}
                            <path d="M 0 0 C 30 2.5, 90 -1.5, 120 0" fill="none" stroke="#1d0e03" strokeWidth="1.2" opacity="0.9" />
                            <path d="M 0 6 C 40 4.5, 80 7.5, 120 6" fill="none" stroke="#251305" strokeWidth="0.6" opacity="0.8" />
                            <path d="M 0 12 C 30 14.5, 90 10.5, 120 12" fill="none" stroke="#1d0e03" strokeWidth="1.2" opacity="0.9" />
                            {/* Light wood rays / fibers */}
                            <path d="M 0 3 C 25 1, 95 4, 120 3" fill="none" stroke="#6b4c2e" strokeWidth="0.8" opacity="0.5" />
                            <path d="M 0 9 C 35 11, 85 7, 120 9" fill="none" stroke="#6b4c2e" strokeWidth="0.8" opacity="0.5" />
                            {/* Elegant organic growth ring wave */}
                            <path d="M 20 2 Q 60 8 100 2" fill="none" stroke="#1d0e03" strokeWidth="0.5" opacity="0.4" />
                            <path d="M 10 10 Q 50 4 90 10" fill="none" stroke="#1d0e03" strokeWidth="0.5" opacity="0.4" />
                          </pattern>
                        </defs>

                        {/* Base Board background with grid */}
                        <rect width={sheet.width} height={sheet.height} fill="url(#gridPattern)" />
                        <rect width={sheet.width} height={sheet.height} fill="#1e293b" opacity="0.8" />

                        {/* Render active Master wood grain direction texture if selected */}
                        {grainDirection === 'vertical' && (
                          <rect width={sheet.width} height={sheet.height} fill="url(#grainVertical)" />
                        )}
                        {grainDirection === 'horizontal' && (
                          <rect width={sheet.width} height={sheet.height} fill="url(#grainHorizontal)" />
                        )}

                        {/* Edge trims (Damaged/clean-up zones highlighted in red overlay) */}
                        {sheet.trimLeft > 0 && (
                          <g>
                            <rect width={sheet.trimLeft} height={sheet.height} fill="#fee2e2" opacity="0.3" />
                            <rect width={sheet.trimLeft} height={sheet.height} fill="url(#trimHatch)" />
                            <rect width={sheet.trimLeft} height={sheet.height} stroke="#ef4444" strokeWidth="0.4" strokeDasharray="1 1" fill="none" />
                            <text
                              x={sheet.trimLeft / 2}
                              y={sheet.height / 2}
                              fill="#ef4444"
                              fontSize="6"
                              fontWeight="black"
                              textAnchor="middle"
                              transform={`rotate(-90, ${sheet.trimLeft / 2}, ${sheet.height / 2})`}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              paintOrder="stroke fill"
                              className="font-mono"
                            >
                              -{(sheet.trimLeft * 10).toFixed(0)} mm
                            </text>
                          </g>
                        )}
                        {sheet.trimRight > 0 && (
                          <g>
                            <rect x={sheet.width - sheet.trimRight} width={sheet.trimRight} height={sheet.height} fill="#fee2e2" opacity="0.3" />
                            <rect x={sheet.width - sheet.trimRight} width={sheet.trimRight} height={sheet.height} fill="url(#trimHatch)" />
                            <rect x={sheet.width - sheet.trimRight} width={sheet.trimRight} height={sheet.height} stroke="#ef4444" strokeWidth="0.4" strokeDasharray="1 1" fill="none" />
                            <text
                              x={sheet.width - sheet.trimRight / 2}
                              y={sheet.height / 2}
                              fill="#ef4444"
                              fontSize="6"
                              fontWeight="black"
                              textAnchor="middle"
                              transform={`rotate(-90, ${sheet.width - sheet.trimRight / 2}, ${sheet.height / 2})`}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              paintOrder="stroke fill"
                              className="font-mono"
                            >
                              -{(sheet.trimRight * 10).toFixed(0)} mm
                            </text>
                          </g>
                        )}
                        {sheet.trimTop > 0 && (
                          <g>
                            <rect x={sheet.trimLeft} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimTop} fill="#fee2e2" opacity="0.3" />
                            <rect x={sheet.trimLeft} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimTop} fill="url(#trimHatch)" />
                            <rect x={sheet.trimLeft} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimTop} stroke="#ef4444" strokeWidth="0.4" strokeDasharray="1 1" fill="none" />
                            <text
                              x={sheet.width / 2}
                              y={sheet.trimTop / 2 + 2}
                              fill="#ef4444"
                              fontSize="6"
                              fontWeight="black"
                              textAnchor="middle"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              paintOrder="stroke fill"
                              className="font-mono"
                            >
                              -{(sheet.trimTop * 10).toFixed(0)} mm
                            </text>
                          </g>
                        )}
                        {sheet.trimBottom > 0 && (
                          <g>
                            <rect x={sheet.trimLeft} y={sheet.height - sheet.trimBottom} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimBottom} fill="#fee2e2" opacity="0.3" />
                            <rect x={sheet.trimLeft} y={sheet.height - sheet.trimBottom} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimBottom} fill="url(#trimHatch)" />
                            <rect x={sheet.trimLeft} y={sheet.height - sheet.trimBottom} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimBottom} stroke="#ef4444" strokeWidth="0.4" strokeDasharray="1 1" fill="none" />
                            <text
                              x={sheet.width / 2}
                              y={sheet.height - sheet.trimBottom / 2 + 2}
                              fill="#ef4444"
                              fontSize="6"
                              fontWeight="black"
                              textAnchor="middle"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              paintOrder="stroke fill"
                              className="font-mono"
                            >
                              -{(sheet.trimBottom * 10).toFixed(0)} mm
                            </text>
                          </g>
                        )}

                        {/* Dashed line representing clean cutting frame inside margins */}
                        <rect
                          x={sheet.trimLeft}
                          y={sheet.trimTop}
                          width={sheet.trimmedWidth}
                          height={sheet.trimmedHeight}
                          stroke="#64748b"
                          strokeWidth="0.6"
                          strokeDasharray="2 1.5"
                        />

                        {/* Horizontal top dimension indicator */}
                        <g stroke="#ffffff" strokeWidth="0.8">
                          <line x1="0" y1="-12" x2={sheet.width} y2="-12" />
                          <line x1="0" y1="-16" x2="0" y2="-8" />
                          <line x1={sheet.width} y1="-16" x2={sheet.width} y2="-8" />
                        </g>
                        <text
                          x={sheet.width / 2}
                          y="-16"
                          fill="#f8fafc"
                          fontSize="9"
                          fontWeight="black"
                          textAnchor="middle"
                          className="font-mono"
                        >
                          HORIZONTAL: {sheet.width * 10} mm
                        </text>

                        {/* Vertical left dimension indicator */}
                        <g stroke="#ffffff" strokeWidth="0.8">
                          <line x1="-12" y1="0" x2="-12" y2={sheet.height} />
                          <line x1="-16" y1="0" x2="-8" y2="0" />
                          <line x1="-16" y1={sheet.height} x2="-8" y2={sheet.height} />
                        </g>
                        <text
                          x="-16"
                          y={sheet.height / 2}
                          fill="#f8fafc"
                          fontSize="9"
                          fontWeight="black"
                          textAnchor="middle"
                          className="font-mono"
                          transform={`rotate(-90, -16, ${sheet.height / 2})`}
                        >
                          VERTIKAL: {sheet.height * 10} mm
                        </text>

                        {/* Render placed parts */}
                        {sheet.placedParts.map((part, idx) => {
                          const c = getPartColorForDimension(part.w, part.h);
                          const dispW = part.rotated ? (part.originalH ?? part.h) : (part.originalW ?? part.w);
                          const dispH = part.rotated ? (part.originalW ?? part.w) : (part.originalH ?? part.h);

                          // Determine grain texture overlay for individual part (rotates if part is rotated relative to master)
                          const useVerticalGrain = (grainDirection === 'vertical' && !part.rotated) || (grainDirection === 'horizontal' && part.rotated);
                          const useHorizontalGrain = (grainDirection === 'horizontal' && !part.rotated) || (grainDirection === 'vertical' && part.rotated);

                          return (
                            <g key={part.id}>
                              {/* Background Part */}
                              <rect
                                x={part.x}
                                y={part.y}
                                width={part.w}
                                height={part.h}
                                fill={c.fill}
                                stroke="#1e293b"
                                strokeWidth="0.8"
                              />

                              {/* Part texture wood pattern simulation */}
                              {useVerticalGrain && (
                                <rect
                                  x={part.x}
                                  y={part.y}
                                  width={part.w}
                                  height={part.h}
                                  fill="url(#grainVertical)"
                                  opacity="0.5"
                                  pointerEvents="none"
                                />
                              )}
                              {useHorizontalGrain && (
                                <rect
                                  x={part.x}
                                  y={part.y}
                                  width={part.w}
                                  height={part.h}
                                  fill="url(#grainHorizontal)"
                                  opacity="0.5"
                                  pointerEvents="none"
                                />
                              )}

                              {/* Inner labels (Part name + size) */}
                              {part.w > 12 && part.h > 10 ? (
                                <>
                                  <text
                                    x={part.x + part.w / 2}
                                    y={part.y + part.h / 2 - 2}
                                    fill={c.text}
                                    fontSize="6"
                                    fontWeight="black"
                                    textAnchor="middle"
                                    className="select-none font-bold"
                                  >
                                    {idx + 1}. {part.name}
                                  </text>
                                  <text
                                    x={part.x + part.w / 2}
                                    y={part.y + part.h / 2 + 5}
                                    fill={c.text}
                                    fontSize="5"
                                    fontWeight="black"
                                    textAnchor="middle"
                                    className="font-mono select-none"
                                  >
                                    {(dispW * 10).toFixed(0)}x{(dispH * 10).toFixed(0)}mm
                                  </text>
                                </>
                              ) : (
                                <text
                                  x={part.x + part.w / 2}
                                  y={part.y + part.h / 2 + 1}
                                  fill={c.text}
                                  fontSize="4.5"
                                  fontWeight="black"
                                  textAnchor="middle"
                                  className="font-mono select-none"
                                >
                                  {(dispW * 10).toFixed(0)}x{(dispH * 10).toFixed(0)}
                                </text>
                              )}

                              {/* Draw cut-line border dimensions inside or surrounding the part */}
                              {/* Horizontal cutting lines (Black line with indicator dimensions) */}
                              <line
                                x1={part.x}
                                y1={part.y}
                                x2={part.x + part.w}
                                y2={part.y}
                                stroke="#000000"
                                strokeWidth="0.8"
                              />
                              {/* Vertical cutting lines */}
                              <line
                                x1={part.x}
                                y1={part.y}
                                x2={part.x}
                                y2={part.y + part.h}
                                stroke="#000000"
                                strokeWidth="0.8"
                              />

                              {/* Draw explicit cutting dimensions indicators on boundaries with high-contrast CAD-style arrow lines */}
                              {part.w > 18 ? (
                                <g>
                                  <line
                                    x1={part.x + 1.5}
                                    y1={part.y + 3.5}
                                    x2={part.x + part.w - 1.5}
                                    y2={part.y + 3.5}
                                    stroke={c.stroke}
                                    strokeWidth="0.6"
                                  />
                                  <polygon
                                    points={`${part.x + 1.5},${part.y + 3.5} ${part.x + 4.5},${part.y + 2.3} ${part.x + 4.5},${part.y + 4.7}`}
                                    fill={c.stroke}
                                  />
                                  <polygon
                                    points={`${part.x + part.w - 1.5},${part.y + 3.5} ${part.x + part.w - 4.5},${part.y + 2.3} ${part.x + part.w - 4.5},${part.y + 4.7}`}
                                    fill={c.stroke}
                                  />
                                  <rect
                                    x={part.x + part.w / 2 - 11}
                                    y={part.y + 1.3}
                                    width="22"
                                    height="4.4"
                                    rx="1"
                                    fill="#000000"
                                  />
                                  <text
                                    x={part.x + part.w / 2}
                                    y={part.y + 4.6}
                                    fill="#ffffff"
                                    fontSize="3.8"
                                    fontWeight="black"
                                    textAnchor="middle"
                                    className="font-mono"
                                  >
                                    {(dispW * 10).toFixed(0)} mm
                                  </text>
                                </g>
                              ) : (
                                part.w > 8 && (
                                  <g>
                                    <rect
                                      x={part.x + part.w / 2 - 8}
                                      y={part.y + 1.3}
                                      width="16"
                                      height="4.4"
                                      rx="1"
                                      fill="#000000"
                                    />
                                    <text
                                      x={part.x + part.w / 2}
                                      y={part.y + 4.6}
                                      fill="#ffffff"
                                      fontSize="3.5"
                                      fontWeight="black"
                                      textAnchor="middle"
                                      className="font-mono"
                                    >
                                      {(dispW * 10).toFixed(0)}
                                    </text>
                                  </g>
                                )
                              )}

                              {part.h > 15 ? (
                                <g>
                                  <line
                                    x1={part.x + 3.5}
                                    y1={part.y + 1.5}
                                    x2={part.x + 3.5}
                                    y2={part.y + part.h - 1.5}
                                    stroke={c.stroke}
                                    strokeWidth="0.6"
                                  />
                                  <polygon
                                    points={`${part.x + 3.5},${part.y + 1.5} ${part.x + 2.3},${part.y + 4.5} ${part.x + 4.7},${part.y + 4.5}`}
                                    fill={c.stroke}
                                  />
                                  <polygon
                                    points={`${part.x + 3.5},${part.y + part.h - 1.5} ${part.x + 2.3},${part.y + part.h - 4.5} ${part.x + 4.7},${part.y + part.h - 4.5}`}
                                    fill={c.stroke}
                                  />
                                  <rect
                                    x={part.x + 1}
                                    y={part.y + part.h / 2 - 2.2}
                                    width="18"
                                    height="4.4"
                                    rx="1"
                                    fill="#000000"
                                  />
                                  <text
                                    x={part.x + 10}
                                    y={part.y + part.h / 2 + 1.1}
                                    fill="#ffffff"
                                    fontSize="3.8"
                                    fontWeight="black"
                                    textAnchor="middle"
                                    className="font-mono"
                                  >
                                    {(dispH * 10).toFixed(0)} mm
                                  </text>
                                </g>
                              ) : (
                                part.h > 8 && (
                                  <g>
                                    <rect
                                      x={part.x + 1}
                                      y={part.y + part.h / 2 - 2.2}
                                      width="11"
                                      height="4.4"
                                      rx="1"
                                      fill="#000000"
                                    />
                                    <text
                                      x={part.x + 6.5}
                                      y={part.y + part.h / 2 + 1.1}
                                      fill="#ffffff"
                                      fontSize="3.5"
                                      fontWeight="black"
                                      textAnchor="middle"
                                      className="font-mono"
                                    >
                                      {(dispH * 10).toFixed(0)}
                                    </text>
                                  </g>
                                )
                              )}
                            </g>
                          );
                        })}

                        {/* Render Leftover/Wasted space (Dashed golden rectangles) with dynamic add button option */}
                        {sheet.leftovers.map((leftover) => {
                          const isSubstantial = leftover.w >= 15 && leftover.h >= 15;
                          return (
                            <g key={leftover.id}>
                              <rect
                                x={leftover.x}
                                y={leftover.y}
                                width={leftover.w}
                                height={leftover.h}
                                fill="#fbbf24"
                                fillOpacity="0.06"
                                stroke="#f59e0b"
                                strokeWidth="0.8"
                                strokeDasharray="3 2"
                              />
                              {/* Display remaining space size dimensions directly on map */}
                              {leftover.w > 18 && leftover.h > 15 ? (
                                <g>
                                  <rect
                                    x={leftover.x + leftover.w / 2 - 25}
                                    y={leftover.y + leftover.h / 2 - 10}
                                    width="50"
                                    height="20"
                                    rx="2"
                                    fill="#1e293b"
                                    stroke="#f59e0b"
                                    strokeWidth="0.5"
                                  />
                                  <text
                                    x={leftover.x + leftover.w / 2}
                                    y={leftover.y + leftover.h / 2 - 3}
                                    fill="#fbbf24"
                                    fontSize="5"
                                    fontWeight="black"
                                    textAnchor="middle"
                                  >
                                    Tepricë e Lirë
                                  </text>
                                  <text
                                    x={leftover.x + leftover.w / 2}
                                    y={leftover.y + leftover.h / 2 + 3}
                                    fill="#ffffff"
                                    fontSize="5"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    className="font-mono"
                                  >
                                    {leftover.w}x{leftover.h} cm
                                  </text>
                                  {isSubstantial && (
                                    <g
                                      className="cursor-pointer group"
                                      onClick={() => addPartFromLeftover(leftover.w, leftover.h)}
                                    >
                                      {/* Invisible background rectangle to capture touch clicks easily */}
                                      <rect
                                        x={leftover.x + leftover.w / 2 - 20}
                                        y={leftover.y + leftover.h / 2 + 5}
                                        width="40"
                                        height="6"
                                        fill="transparent"
                                      />
                                      <text
                                        x={leftover.x + leftover.w / 2}
                                        y={leftover.y + leftover.h / 2 + 9}
                                        fill="#34d399"
                                        fontSize="4.5"
                                        fontWeight="black"
                                        textAnchor="middle"
                                        className="animate-pulse group-hover:fill-emerald-400 select-none transition-all"
                                      >
                                        + Shto si Raft
                                      </text>
                                    </g>
                                  )}
                                </g>
                              ) : (
                                <text
                                  x={leftover.x + leftover.w / 2}
                                  y={leftover.y + leftover.h / 2 + 1}
                                  fill="#fbbf24"
                                  fontSize="4"
                                  fontWeight="black"
                                  textAnchor="middle"
                                  className="font-mono"
                                >
                                  {leftover.w}x{leftover.h}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>

                      {/* Legends */}
                      <div className="absolute top-2 left-2 flex gap-3 text-[8px] font-black uppercase text-white tracking-wider bg-slate-900/90 py-1 px-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-indigo-400 rounded-sm"></span> Detajet
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-rose-500/20 rounded-xs border border-rose-500/60 flex items-center justify-center overflow-hidden relative">
                            <span className="absolute inset-0 bg-[linear-gradient(45deg,rgba(244,63,94,0.5)_25%,transparent_25%,transparent_50%,rgba(244,63,94,0.5)_50%,rgba(244,63,94,0.5)_75%,transparent_75%,transparent)] bg-[length:3px_3px]"></span>
                          </span>
                          <span>Pastrimi i Teheve (Dëmtimi)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-amber-500/20 border border-dashed border-amber-500 rounded-sm"></span> Tepricë e Lirë
                        </div>
                      </div>
                    </div>

                    {/* Suggestions Box to easily fill leftover space with a shelf */}
                    {sheet.leftovers.filter(l => l.w >= 15 && l.h >= 15).length > 0 && (
                      <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-xl space-y-2">
                        <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-emerald-600" /> Shfrytëzo Hapësirën e Lirë!
                        </p>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                          Keni hapësira të tepërta në panel që mund të shfrytëzohen për të prerë rafte të tjerë shtesë për elementin tuaj:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sheet.leftovers.filter(l => l.w >= 15 && l.h >= 15).map((leftover, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => addPartFromLeftover(leftover.w, leftover.h)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 text-emerald-700 shadow-xs"
                            >
                              + Shto Raft shtesë ({(leftover.w * 10).toFixed(0)} x {(leftover.h * 10).toFixed(0)} mm)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Placed Parts list underneath */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(() => {
                        const groups: {
                          name: string;
                          origW: number;
                          origH: number;
                          count: number;
                          rotated: boolean;
                          partIndices: number[];
                        }[] = [];

                        sheet.placedParts.forEach((p, idx) => {
                          const origW = p.originalW ?? p.w;
                          const origH = p.originalH ?? p.h;
                          const existing = groups.find(g => g.name === p.name && g.origW === origW && g.origH === origH);
                          if (existing) {
                            existing.count += 1;
                            existing.partIndices.push(idx + 1);
                            if (p.rotated) {
                              existing.rotated = true;
                            }
                          } else {
                            groups.push({
                              name: p.name,
                              origW,
                              origH,
                              count: 1,
                              rotated: p.rotated,
                              partIndices: [idx + 1]
                            });
                          }
                        });

                        return groups.map((g, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[12px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 min-w-[24px] text-center inline-block shrink-0 shadow-sm">
                                {g.count}x
                              </span>
                              <div className="min-w-0">
                                <span className="block text-[11px] font-extrabold text-slate-900 truncate leading-tight">{g.name}</span>
                                <span className="text-[10px] text-indigo-600 font-extrabold block leading-tight">
                                  {(g.origW * 10).toFixed(0)} x {(g.origH * 10).toFixed(0)} mm
                                </span>
                                <span className="text-[8px] text-slate-400 font-bold block leading-none mt-0.5">
                                  Pjesët: {g.partIndices.join(', ')}
                                </span>
                              </div>
                            </div>
                            {g.rotated && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded shrink-0">
                                ↻
                              </span>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  Shtoni ose modifikoni detajet dhe klikoni &quot;Gjenero Skemën&quot; për të krijuar prerjet optimale të panelit.
                </p>
              </div>
            )}
          </div>

          {/* Quick Info details */}
          <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 flex gap-3 items-start">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-600 leading-relaxed">
              <p>
                <strong>Si funksionon optimizimi?</strong> Algoritmi i shpërndarjes së detajeve (Nesting 2D) përdor renditjen nga më e madhja tek më e vogla dhe i ruan hapësirat mes çdo prerjeje fiks <strong>{Number(bladeWidth || 0.4)} cm (sharra {Number(bladeWidth || 0.4) * 10}mm)</strong>.
              </p>
              <p className="mt-1">
                Kjo do të thotë që fleta juaj do të shfrytëzohet maksimalisht, duke llogaritur gjithashtu shkurtimet anësore që dëshironi të bëni për pastrimin e panelit të dëmtuar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Elegant A4 Landscape Printable Area */}
    {typeof document !== 'undefined' && createPortal(
      <div className="hidden print:block bg-white text-black p-2 space-y-4" id="print-area">
        {calculatedResults?.sheets.map((sheet) => {
          const paddingLeft = 35;
          const paddingTop = 35;
          const viewWidth = sheet.width + paddingLeft * 2;
          const viewHeight = sheet.height + paddingTop * 2;

          return (
            <div
              key={sheet.sheetIndex}
              className={`h-[180mm] max-h-[180mm] border border-slate-300 p-3 rounded-xl bg-white flex flex-col justify-between page-break-inside-avoid ${
                sheet.sheetIndex < (calculatedResults?.sheets.length || 0) ? 'page-break-after-always' : ''
              }`}
              style={{ boxSizing: 'border-box' }}
            >
              {/* Sheet Page Header */}
              <div className="border-b-2 border-slate-300 pb-1.5 flex justify-between items-end">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    Skema e Optimizimit të Prerjes së Panelit (A4)
                    {kitchenCode && (
                      <span className="text-indigo-600 bg-indigo-50 border border-indigo-200 text-[10px] px-2 py-0.5 rounded font-black uppercase ml-2 tracking-normal">
                        Kuzhina: {kitchenCode}
                      </span>
                    )}
                  </h2>
                  <p className="text-[9px] font-medium text-slate-500 mt-0.5">
                    Tandembox Pro — MergimGroup | Data: {new Date().toLocaleDateString('sq-AL')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-slate-900 text-white text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                    PANELI {sheet.sheetIndex} nga {calculatedResults?.sheets.length}
                  </span>
                </div>
              </div>

              {/* Compact Metadata Row */}
              <div className="grid grid-cols-5 gap-2 text-[9px] border border-slate-200 p-1.5 rounded-lg bg-slate-50">
                <div>
                  <span className="text-slate-500">Panel Master:</span> <strong className="text-slate-900">{(Number(sheetWidth) * 10).toFixed(0)} x {(Number(sheetHeight) * 10).toFixed(0)} mm</strong>
                </div>
                <div>
                  <span className="text-slate-500">Sharra (Kerf):</span> <strong className="text-slate-900">{(Number(bladeWidth) * 10).toFixed(0)} mm</strong>
                </div>
                <div>
                  <span className="text-slate-500">Kataric (Kant):</span> <strong className="text-emerald-700">{addPreMilling ? "+4 mm" : "Jo"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Margjinat:</span> <strong className="text-slate-900">L:{activeTrimLeft * 10} R:{activeTrimRight * 10} T:{activeTrimTop * 10} B:{activeTrimBottom * 10} mm</strong>
                </div>
                <div>
                  <span className="text-slate-500">Shfrytëzimi:</span> <strong className="text-emerald-700 font-bold">{sheet.utilization}%</strong>
                </div>
              </div>

              {addPreMilling && (
                <div className="text-[8px] leading-snug font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 mt-0.5">
                  * Vërejtje: Harta e prerjes e bën hesap dhe e zbret çdo prerje duke shtuar automatikisht +4 mm (+0.4 cm) për kataric (pjesë/panel më i madh për kantim), por tregon dimensionet e pastra origjinale në vizatim për të shmangur ngatërresat.
                </div>
              )}

              {/* Render the exact same SVG but styled beautifully for printing */}
              <div className="flex-1 flex items-center justify-center border border-slate-200 p-1 rounded-lg bg-white overflow-hidden">
                <svg
                  viewBox={`-${paddingLeft} -${paddingTop} ${viewWidth} ${viewHeight}`}
                  className="w-full h-full max-h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="printGridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.2" />
                    </pattern>

                    {/* CAD warning hatch pattern for print trim margins */}
                    <pattern id="printTrimHatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="1.2" opacity="0.4" />
                    </pattern>

                    {/* Print Vertical Grain */}
                    <pattern id="printGrainVertical" width="15" height="120" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="120" stroke="#cccccc" strokeWidth="0.8" opacity="0.6" />
                      <line x1="7.5" y1="0" x2="7.5" y2="120" stroke="#e2e8f0" strokeWidth="0.4" opacity="0.5" />
                      <path d="M 3 20 Q 12 60 3 100" fill="none" stroke="#dddddd" strokeWidth="0.5" opacity="0.4" />
                    </pattern>

                    {/* Print Horizontal Grain */}
                    <pattern id="printGrainHorizontal" width="120" height="15" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="120" y2="0" stroke="#cccccc" strokeWidth="0.8" opacity="0.6" />
                      <line x1="0" y1="7.5" x2="120" y2="7.5" stroke="#e2e8f0" strokeWidth="0.4" opacity="0.5" />
                      <path d="M 20 3 Q 60 12 100 3" fill="none" stroke="#dddddd" strokeWidth="0.5" opacity="0.4" />
                    </pattern>
                  </defs>

                  {/* White background and clean grid for printing */}
                  <rect width={sheet.width} height={sheet.height} fill="url(#printGridPattern)" />
                  <rect width={sheet.width} height={sheet.height} stroke="#000000" strokeWidth="1" fill="none" />

                  {/* Print grain texture on sheet if selected */}
                  {grainDirection === 'vertical' && (
                    <rect width={sheet.width} height={sheet.height} fill="url(#printGrainVertical)" />
                  )}
                  {grainDirection === 'horizontal' && (
                    <rect width={sheet.width} height={sheet.height} fill="url(#printGrainHorizontal)" />
                  )}

                  {/* Trim margins */}
                  {sheet.trimLeft > 0 && (
                    <g>
                      <rect width={sheet.trimLeft} height={sheet.height} fill="#fee2e2" opacity="0.3" />
                      <rect width={sheet.trimLeft} height={sheet.height} fill="url(#printTrimHatch)" />
                      <rect width={sheet.trimLeft} height={sheet.height} stroke="#ef4444" strokeWidth="0.3" strokeDasharray="1 1" fill="none" />
                      <text
                        x={sheet.trimLeft / 2}
                        y={sheet.height / 2}
                        fill="#ef4444"
                        fontSize="6"
                        fontWeight="black"
                        textAnchor="middle"
                        transform={`rotate(-90, ${sheet.trimLeft / 2}, ${sheet.height / 2})`}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        paintOrder="stroke fill"
                        className="font-mono"
                      >
                        -{(sheet.trimLeft * 10).toFixed(0)} mm
                      </text>
                    </g>
                  )}
                  {sheet.trimRight > 0 && (
                    <g>
                      <rect x={sheet.width - sheet.trimRight} width={sheet.trimRight} height={sheet.height} fill="#fee2e2" opacity="0.3" />
                      <rect x={sheet.width - sheet.trimRight} width={sheet.trimRight} height={sheet.height} fill="url(#printTrimHatch)" />
                      <rect x={sheet.width - sheet.trimRight} width={sheet.trimRight} height={sheet.height} stroke="#ef4444" strokeWidth="0.3" strokeDasharray="1 1" fill="none" />
                      <text
                        x={sheet.width - sheet.trimRight / 2}
                        y={sheet.height / 2}
                        fill="#ef4444"
                        fontSize="6"
                        fontWeight="black"
                        textAnchor="middle"
                        transform={`rotate(-90, ${sheet.width - sheet.trimRight / 2}, ${sheet.height / 2})`}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        paintOrder="stroke fill"
                        className="font-mono"
                      >
                        -{(sheet.trimRight * 10).toFixed(0)} mm
                      </text>
                    </g>
                  )}
                  {sheet.trimTop > 0 && (
                    <g>
                      <rect x={sheet.trimLeft} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimTop} fill="#fee2e2" opacity="0.3" />
                      <rect x={sheet.trimLeft} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimTop} fill="url(#printTrimHatch)" />
                      <rect x={sheet.trimLeft} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimTop} stroke="#ef4444" strokeWidth="0.3" strokeDasharray="1 1" fill="none" />
                      <text
                        x={sheet.width / 2}
                        y={sheet.trimTop / 2 + 2}
                        fill="#ef4444"
                        fontSize="6"
                        fontWeight="black"
                        textAnchor="middle"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        paintOrder="stroke fill"
                        className="font-mono"
                      >
                        -{(sheet.trimTop * 10).toFixed(0)} mm
                      </text>
                    </g>
                  )}
                  {sheet.trimBottom > 0 && (
                    <g>
                      <rect x={sheet.trimLeft} y={sheet.height - sheet.trimBottom} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimBottom} fill="#fee2e2" opacity="0.3" />
                      <rect x={sheet.trimLeft} y={sheet.height - sheet.trimBottom} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimBottom} fill="url(#printTrimHatch)" />
                      <rect x={sheet.trimLeft} y={sheet.height - sheet.trimBottom} width={sheet.width - sheet.trimLeft - sheet.trimRight} height={sheet.trimBottom} stroke="#ef4444" strokeWidth="0.3" strokeDasharray="1 1" fill="none" />
                      <text
                        x={sheet.width / 2}
                        y={sheet.height - sheet.trimBottom / 2 + 2}
                        fill="#ef4444"
                        fontSize="6"
                        fontWeight="black"
                        textAnchor="middle"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        paintOrder="stroke fill"
                        className="font-mono"
                      >
                        -{(sheet.trimBottom * 10).toFixed(0)} mm
                      </text>
                    </g>
                  )}

                  {/* Dashed line representing cutting boundary */}
                  <rect
                    x={sheet.trimLeft}
                    y={sheet.trimTop}
                    width={sheet.trimmedWidth}
                    height={sheet.trimmedHeight}
                    stroke="#475569"
                    strokeWidth="0.5"
                    strokeDasharray="1.5 1.5"
                    fill="none"
                  />

                  {/* Horizontal top dimension indicator */}
                  <g stroke="#000000" strokeWidth="0.8">
                    <line x1="0" y1="-12" x2={sheet.width} y2="-12" />
                    <line x1="0" y1="-16" x2="0" y2="-8" />
                    <line x1={sheet.width} y1="-16" x2={sheet.width} y2="-8" />
                  </g>
                  <text
                    x={sheet.width / 2}
                    y="-18"
                    fill="#000000"
                    fontSize="10"
                    fontWeight="black"
                    textAnchor="middle"
                    className="font-mono font-bold"
                  >
                    HORIZONTAL: {sheet.width * 10} mm
                  </text>

                  {/* Vertical left dimension indicator */}
                  <g stroke="#000000" strokeWidth="0.8">
                    <line x1="-12" y1="0" x2="-12" y2={sheet.height} />
                    <line x1="-16" y1="0" x2="-8" y2="0" />
                    <line x1="-16" y1={sheet.height} x2="-8" y2={sheet.height} />
                  </g>
                  <text
                    x="-18"
                    y={sheet.height / 2}
                    fill="#000000"
                    fontSize="10"
                    fontWeight="black"
                    textAnchor="middle"
                    className="font-mono font-bold"
                    transform={`rotate(-90, -18, ${sheet.height / 2})`}
                  >
                    VERTIKAL: {sheet.height * 10} mm
                  </text>

                  {/* Placed Parts */}
                  {sheet.placedParts.map((part, idx) => {
                    const useVerticalGrain = (grainDirection === 'vertical' && !part.rotated) || (grainDirection === 'horizontal' && part.rotated);
                    const useHorizontalGrain = (grainDirection === 'horizontal' && !part.rotated) || (grainDirection === 'vertical' && part.rotated);
                    const pc = getPartColorForDimension(part.w, part.h);
                    const dispW = part.rotated ? (part.originalH ?? part.h) : (part.originalW ?? part.w);
                    const dispH = part.rotated ? (part.originalW ?? part.w) : (part.originalH ?? part.h);

                    return (
                      <g key={part.id}>
                        <rect
                          x={part.x}
                          y={part.y}
                          width={part.w}
                          height={part.h}
                          fill={pc.fill}
                          stroke="#000000"
                          strokeWidth="0.8"
                        />

                        {useVerticalGrain && (
                          <rect
                            x={part.x}
                            y={part.y}
                            width={part.w}
                            height={part.h}
                            fill="url(#printGrainVertical)"
                            opacity="0.5"
                            pointerEvents="none"
                          />
                        )}
                        {useHorizontalGrain && (
                          <rect
                            x={part.x}
                            y={part.y}
                            width={part.w}
                            height={part.h}
                            fill="url(#printGrainHorizontal)"
                            opacity="0.5"
                            pointerEvents="none"
                          />
                        )}

                        {/* Name with White Halo for maximum contrast in black & white printing */}
                        <text
                          x={part.x + part.w / 2}
                          y={part.y + part.h / 2 - 2}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fontSize="7"
                          fontWeight="black"
                          textAnchor="middle"
                        >
                          {idx + 1}. {part.name}
                        </text>
                        <text
                          x={part.x + part.w / 2}
                          y={part.y + part.h / 2 - 2}
                          fill="#000000"
                          fontSize="7"
                          fontWeight="black"
                          textAnchor="middle"
                          className="font-bold"
                        >
                          {idx + 1}. {part.name}
                        </text>

                        {/* Size with White Halo */}
                        <text
                          x={part.x + part.w / 2}
                          y={part.y + part.h / 2 + 5}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fontSize="6"
                          fontWeight="black"
                          textAnchor="middle"
                        >
                          {(dispW * 10).toFixed(0)} x {(dispH * 10).toFixed(0)} mm
                        </text>
                        <text
                          x={part.x + part.w / 2}
                          y={part.y + part.h / 2 + 5}
                          fill="#000000"
                          fontSize="6"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="font-mono"
                        >
                          {(dispW * 10).toFixed(0)} x {(dispH * 10).toFixed(0)} mm
                        </text>

                        {/* Explicit cut dimensions on part borders with high-contrast CAD-style arrow lines */}
                        {part.w > 18 ? (
                          <g>
                            {/* Horizontal line with arrows */}
                            <line
                              x1={part.x + 1.5}
                              y1={part.y + 3.5}
                              x2={part.x + part.w - 1.5}
                              y2={part.y + 3.5}
                              stroke="#000000"
                              strokeWidth="0.5"
                            />
                            {/* Left Arrowhead */}
                            <polygon
                              points={`${part.x + 1.5},${part.y + 3.5} ${part.x + 4.5},${part.y + 2.3} ${part.x + 4.5},${part.y + 4.7}`}
                              fill="#000000"
                            />
                            {/* Right Arrowhead */}
                            <polygon
                              points={`${part.x + part.w - 1.5},${part.y + 3.5} ${part.x + part.w - 4.5},${part.y + 2.3} ${part.x + part.w - 4.5},${part.y + 4.7}`}
                              fill="#000000"
                            />
                            {/* Text background white mask */}
                            <rect
                              x={part.x + part.w / 2 - 10}
                              y={part.y + 1.5}
                              width="20"
                              height="4"
                              rx="0.5"
                              fill="#ffffff"
                              stroke="#000000"
                              strokeWidth="0.3"
                            />
                            <text
                              x={part.x + part.w / 2}
                              y={part.y + 4.6}
                              fill="#000000"
                              fontSize="3.8"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="font-mono"
                            >
                              {(dispW * 10).toFixed(0)} mm
                            </text>
                          </g>
                        ) : (
                          part.w > 8 && (
                            <g>
                              <rect
                                x={part.x + part.w / 2 - 8}
                                y={part.y + 1.5}
                                width="16"
                                height="4"
                                rx="0.5"
                                fill="#ffffff"
                                stroke="#000000"
                                strokeWidth="0.3"
                              />
                              <text
                                x={part.x + part.w / 2}
                                y={part.y + 4.6}
                                fill="#000000"
                                fontSize="3.5"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="font-mono"
                              >
                                {(dispW * 10).toFixed(0)}
                              </text>
                            </g>
                          )
                        )}

                        {part.h > 15 ? (
                          <g>
                            {/* Vertical line with arrows */}
                            <line
                              x1={part.x + 3.5}
                              y1={part.y + 1.5}
                              x2={part.x + 3.5}
                              y2={part.y + part.h - 1.5}
                              stroke="#000000"
                              strokeWidth="0.5"
                            />
                            {/* Top Arrowhead */}
                            <polygon
                              points={`${part.x + 3.5},${part.y + 1.5} ${part.x + 2.3},${part.y + 4.5} ${part.x + 4.7},${part.y + 4.5}`}
                              fill="#000000"
                            />
                            {/* Bottom Arrowhead */}
                            <polygon
                              points={`${part.x + 3.5},${part.y + part.h - 1.5} ${part.x + 2.3},${part.y + part.h - 4.5} ${part.x + 4.7},${part.y + part.h - 4.5}`}
                              fill="#000000"
                            />
                            {/* Text background white mask */}
                            <rect
                              x={part.x + 1}
                              y={part.y + part.h / 2 - 2}
                              width="18"
                              height="4"
                              rx="0.5"
                              fill="#ffffff"
                              stroke="#000000"
                              strokeWidth="0.3"
                            />
                            <text
                              x={part.x + 10}
                              y={part.y + part.h / 2 + 1.1}
                              fill="#000000"
                              fontSize="3.8"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="font-mono"
                            >
                              {(dispH * 10).toFixed(0)} mm
                            </text>
                          </g>
                        ) : (
                          part.h > 8 && (
                            <g>
                              <rect
                                x={part.x + 1}
                                y={part.y + part.h / 2 - 2}
                                width="11"
                                height="4"
                                rx="0.5"
                                fill="#ffffff"
                                stroke="#000000"
                                strokeWidth="0.3"
                              />
                              <text
                                x={part.x + 6.5}
                                y={part.y + part.h / 2 + 1.1}
                                fill="#000000"
                                fontSize="3.5"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="font-mono"
                              >
                                {(dispH * 10).toFixed(0)}
                              </text>
                            </g>
                          )
                        )}
                      </g>
                    );
                  })}

                  {/* Leftovers in dotted patterns */}
                  {sheet.leftovers.map((leftover) => (
                    <g key={leftover.id}>
                      <rect
                        x={leftover.x}
                        y={leftover.y}
                        width={leftover.w}
                        height={leftover.h}
                        fill="#fef3c7"
                        fillOpacity="0.2"
                        stroke="#000000"
                        strokeWidth="0.6"
                        strokeDasharray="2 2"
                      />
                      {leftover.w > 18 && leftover.h > 15 && (
                        <text
                          x={leftover.x + leftover.w / 2}
                          y={leftover.y + leftover.h / 2 + 1}
                          fill="#78350f"
                          fontSize="5.5"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Tepricë {(leftover.w * 10).toFixed(0)}x{(leftover.h * 10).toFixed(0)} mm
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* List of cuts with dimensions right next to the names */}
              <div className="space-y-1 mt-1">
                <p className="text-[9px] font-black uppercase text-slate-800">Pjesët e vendosura në këtë panel:</p>
                <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-[10px]">
                  {(() => {
                    const groups: {
                      name: string;
                      origW: number;
                      origH: number;
                      count: number;
                      rotated: boolean;
                      partIndices: number[];
                    }[] = [];

                    sheet.placedParts.forEach((p, idx) => {
                      const origW = p.originalW ?? p.w;
                      const origH = p.originalH ?? p.h;
                      const existing = groups.find(g => g.name === p.name && g.origW === origW && g.origH === origH);
                      if (existing) {
                        existing.count += 1;
                        existing.partIndices.push(idx + 1);
                        if (p.rotated) {
                          existing.rotated = true;
                        }
                      } else {
                        groups.push({
                          name: p.name,
                          origW,
                          origH,
                          count: 1,
                          rotated: p.rotated,
                          partIndices: [idx + 1]
                        });
                      }
                    });

                    return groups.map((g, idx) => (
                      <div key={idx} className="flex items-center border-b border-slate-300 pb-0.5 pr-0.5 font-bold text-slate-900">
                        <span className="truncate mr-1 flex items-center gap-1 min-w-0">
                          <span className="text-[9px] font-black text-white bg-black px-1.5 py-0.5 rounded min-w-[18px] text-center inline-block shrink-0 print:border print:border-black print:bg-black">
                            {g.count}x
                          </span>
                          <strong className="text-black font-black text-[10px] truncate">{g.name}</strong>
                          <span className="text-[7px] text-slate-500 font-semibold truncate ml-0.5">({g.partIndices.join(',')})</span>
                        </span>
                        <span className="font-mono text-black font-extrabold shrink-0 text-[9px] ml-auto">
                          ({(g.origW * 10).toFixed(0)}x{(g.origH * 10).toFixed(0)}){g.rotated ? ' ↻' : ''}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>,
      document.body
    )}

    <style dangerouslySetInnerHTML={{ __html: `
      @media print {
        body {
          background: white !important;
          color: black !important;
        }
        /* Hide all outer content when printing */
        #root,
        .print\\:hidden {
          display: none !important;
        }
        #print-area {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
          color: black !important;
        }
        .page-break-inside-avoid {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .page-break-after-always {
          page-break-after: always !important;
          break-after: page !important;
        }
        @page {
          size: A4 landscape;
          margin: 5mm;
        }
      }
    `}} />
  </>
);
}
