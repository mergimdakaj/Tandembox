import { useState } from 'react';
import { Ruler, Maximize2, Minimize2, Layers, Box, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

interface AntaroFrontDrillingVisualizerProps {
  kaca: number; // cm (e.g. 60 or 90)
  boardThickness: number; // cm (e.g. 1.8 or 2.2)
  fst: number; // cm (front overlay at bottom, e.g. 1.8 or 0)
  antaroProfile: 'M' | 'K' | 'B' | 'C' | 'D';
  lw: number; // cm internal width
  llageri?: number; // cm (e.g. 50)
  sideGapMm?: number; // mm (e.g. 0 or 1.5 or 2.0)
  onSideGapChange?: (gap: number) => void;
  runnerHeightZeroMm?: number; // mm from side bottom in zero (default 58)
  onRunnerHeightChange?: (heightMm: number) => void;
}

export function AntaroFrontDrillingVisualizer({
  kaca,
  boardThickness,
  antaroProfile,
  lw,
  llageri = 50,
  sideGapMm: propSideGapMm,
  onSideGapChange,
  runnerHeightZeroMm: propRunnerHeightMm,
  onRunnerHeightChange,
}: AntaroFrontDrillingVisualizerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'front' | 'runners'>('front');
  const [unit, setUnit] = useState<'mm' | 'cm'>('mm');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // Big drawer with gallery rail (shipkë) toggle
  const [hasShipkë, setHasShipkë] = useState<boolean>(antaroProfile === 'D' || antaroProfile === 'C');

  // Runner Height from side bottom in zero (default 58 mm = 5.8 cm)
  const [localRunnerHeightMm, setLocalRunnerHeightMm] = useState<number>(58.0);
  const currentRunnerHeightMm = propRunnerHeightMm !== undefined ? propRunnerHeightMm : localRunnerHeightMm;

  const handleRunnerHeightUpdate = (newValMm: number) => {
    const clamped = Math.max(10, Math.min(300, Number(newValMm.toFixed(1))));
    setLocalRunnerHeightMm(clamped);
    if (onRunnerHeightChange) {
      onRunnerHeightChange(clamped);
    }
  };

  // Local side gap state if not controlled externally
  const [localSideGapMm, setLocalSideGapMm] = useState<number>(1.5);
  const currentSideGapMm = propSideGapMm !== undefined ? propSideGapMm : localSideGapMm;

  const handleGapSelect = (val: number) => {
    setLocalSideGapMm(val);
    if (onSideGapChange) {
      onSideGapChange(val);
    }
  };

  // Conversions & Dimensions
  const btMm = Math.round(boardThickness * 10);
  const lwMm = Math.round(lw * 10);
  const kacaMm = Math.round(kaca * 10);
  const llageriMm = Math.round(llageri * 10);

  // Front panel width based on side gap (e.g. 600mm - 2*1.5mm = 597mm)
  const totalGapWidthMm = Number((currentSideGapMm * 2).toFixed(1));
  const frontWidthMm = Number((kacaMm - totalGapWidthMm).toFixed(1));
  const frontWidthCm = Number((frontWidthMm / 10).toFixed(2));

  // Front overlay on side (FA): thickness of wall minus side gap (e.g. 18 - 1.5 = 16.5mm, or 18 - 0 = 18mm)
  const sideOverlayFaMm = Number((btMm - currentSideGapMm).toFixed(1));
  
  // Distance from outer edge of front panel to drill hole centerline: FA + 15.5mm (e.g. 16.5 + 15.5 = 32mm)
  const fromOuterEdgeMm = Number((sideOverlayFaMm + 15.5).toFixed(1));
  const fromOuterEdgeCm = Number((fromOuterEdgeMm / 10).toFixed(1));

  // RUNNER SIDE WALL DRILLING MEASUREMENTS:
  // - Runner height from side wall bottom in zero: user controlled (default 58.0 mm)
  // - Runner height inside cabinet above floor (mbi pos): runner - boardThickness (e.g. 58 - 18 = 40.0 mm)
  const runnerFromSideBottomMm = currentRunnerHeightMm;
  const runnerAboveFloorMm = Number((runnerFromSideBottomMm - btMm).toFixed(1));
  const runner1stHoleFromFrontMm = 37.0; // 37mm from front edge of cabinet side wall (Blum System 32)
  const runner2ndHoleFromFrontMm = 69.0; // 37mm + 32mm = 69mm
  const runner3rdHoleFromFrontMm = llageriMm >= 500 ? 229.0 : 165.0; // standard depth hole

  // FRONT VERTICAL DRILLING MEASUREMENTS (AUTOMATICALLY CALCULATED FROM RUNNER POSITION):
  // Formula based on Blum Tandembox Antaro geometry:
  // Hole 1 (Bottom): RunnerHeightInZero + 13.0 mm (e.g. 58 + 13 = 71.0 mm / 7.1 cm)
  // Hole 2 (Top): Hole 1 + 32.0 mm (e.g. 71 + 32 = 103.0 mm / 10.3 cm)
  // Hole 3 (Shipka / Gallery Rail for big drawer Antaro D): Hole 1 + 128.0 mm (e.g. 71 + 128 = 199.0 mm / 19.9 cm)
  // (Or for Antaro C: Hole 1 + 64.0 mm)
  const hole1FromBottomMm = Number((runnerFromSideBottomMm + 13.0).toFixed(1));
  const hole2FromBottomMm = Number((hole1FromBottomMm + 32.0).toFixed(1));
  
  const shipkaFromHole1Mm = antaroProfile === 'C' ? 64.0 : 128.0;
  const shipkaHoleFromBottomMm = Number((hole1FromBottomMm + shipkaFromHole1Mm).toFixed(1));

  const distanceBetweenLeftRightHolesMm = lwMm - 31; // Center-to-center: LW - 31mm

  // Helper formatting for mm / cm
  const fmt = (valMm: number) => {
    if (unit === 'cm') {
      return `${(valMm / 10).toFixed(1)} cm`;
    }
    return `${valMm} mm`;
  };

  return (
    <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl overflow-hidden shadow-2xl transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-5 text-white flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-inner">
            <Ruler className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                Skica Teknike e Shpimit
              </span>
              <span className="text-[10px] font-extrabold uppercase text-amber-400">
                Blum Antaro {antaroProfile} {hasShipkë ? '(Me Shipkë / Reling)' : ''}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              Sinkronizimi Automatik: Llagerat ({fmt(runnerFromSideBottomMm)}) &rarr; Ballina ({fmt(hole1FromBottomMm)} / {fmt(hole2FromBottomMm)})
            </h3>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Unit Toggle */}
          <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-700 flex items-center text-[10px] font-black">
            <button
              onClick={() => setUnit('mm')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                unit === 'mm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              MILIMETRA (MM)
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                unit === 'cm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              CENTIMETRA (CM)
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
            title={isExpanded ? 'Zvogëlo' : 'Zmadho Skicën'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* GLOBAL RUNNER POSITION MASTER CONTROLLER BAR */}
      <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Lartësia e Llagerit nga Zero:
            </span>
          </div>

          {/* Quick presets for runner */}
          <div className="flex items-center gap-1">
            {[
              { label: '5.8 cm (58 mm)', val: 58.0, isStd: true },
              { label: '5.0 cm (50 mm)', val: 50.0, isStd: false },
              { label: '6.0 cm (60 mm)', val: 60.0, isStd: false },
              { label: '6.4 cm (64 mm)', val: 64.0, isStd: false },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => handleRunnerHeightUpdate(p.val)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                  currentRunnerHeightMm === p.val
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {p.val / 10}cm {p.isStd ? '★' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Stepper / Input */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Ndrysho lirshëm:</span>
          <div className="flex items-center bg-slate-900 rounded-xl border border-slate-700 p-1">
            <button
              type="button"
              onClick={() => handleRunnerHeightUpdate(currentRunnerHeightMm - 1)}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="-1 mm"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            
            <div className="px-2.5 font-mono font-black text-amber-300 text-xs text-center min-w-[70px]">
              {fmt(currentRunnerHeightMm)}
            </div>

            <button
              type="button"
              onClick={() => handleRunnerHeightUpdate(currentRunnerHeightMm + 1)}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="+1 mm"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleRunnerHeightUpdate(58.0)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all text-xs flex items-center gap-1"
            title="Kthe në Standard (5.8 cm)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] font-bold">5.8cm Std</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: 1. Ballina (Front) vs 2. Anësorja (Llagerat) */}
      <div className="bg-slate-950 px-4 sm:px-6 pt-3 border-b border-slate-800 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('front')}
          className={`py-2.5 px-4 text-xs font-black uppercase rounded-t-xl transition-all flex items-center gap-2 border-t-2 ${
            activeSubTab === 'front'
              ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-300 border-transparent'
          }`}
        >
          <Box className="w-4 h-4" /> 1. Shpimi i Ballinës (Frontit: {fmt(hole1FromBottomMm)} + 3.2cm)
        </button>

        <button
          onClick={() => setActiveSubTab('runners')}
          className={`py-2.5 px-4 text-xs font-black uppercase rounded-t-xl transition-all flex items-center gap-2 border-t-2 ${
            activeSubTab === 'runners'
              ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-300 border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" /> 2. Shpimi i Mureve Anësore (Llagerat: {fmt(runnerFromSideBottomMm)} / mbi pos {fmt(runnerAboveFloorMm)})
        </button>
      </div>

      {/* Main Visualizer Content Area */}
      <div className="p-4 sm:p-6 space-y-6">
        
        {activeSubTab === 'front' ? (
          <>
            {/* Front Configuration Banner */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
              
              {/* Row 1: Drawer Size & Shipka Options */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Lloji i Fijokës:
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setHasShipkë(false)}
                      className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                        !hasShipkë ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fijokë Standarde (Pa Shipkë)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasShipkë(true)}
                      className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                        hasShipkë ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fijokë e Madhe (Me Shipkë / Reling)
                    </button>
                  </div>
                </div>

                <div className="text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800/60 font-bold flex items-center gap-1.5">
                  <span>✓ Llogaritur automatikisht nga Llageri ({fmt(runnerFromSideBottomMm)} + 1.3cm)</span>
                </div>
              </div>

              {/* Row 2: Front Width & Gap Selection */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Fuga e Frontit me Anësoret:
                  </span>
                  <span className="text-xs font-bold text-indigo-400">
                    {currentSideGapMm === 0 ? 'Rrafsh me elementin (0 mm)' : `${currentSideGapMm} mm anash (-${totalGapWidthMm} mm total)`}
                  </span>
                </div>
                <div className="text-xs font-mono font-black text-amber-300 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-700/60 shadow-sm">
                  Gjerësia e Prerjes së Frontit: {frontWidthMm} mm ({frontWidthCm} cm)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleGapSelect(0)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentSideGapMm === 0
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black text-white">0 mm (Rrafsh / Zero)</p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Elementi {kaca}cm &rarr; Fronti: <strong className="text-white font-mono">{kacaMm} mm ({kaca} cm)</strong>
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleGapSelect(1.5)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentSideGapMm === 1.5
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black text-white">1.5 mm Anash (-3 mm total)</p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Elementi {kaca}cm &rarr; Fronti: <strong className="text-amber-300 font-mono">{kacaMm - 3} mm ({((kacaMm - 3) / 10).toFixed(1)} cm)</strong>
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleGapSelect(2.0)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentSideGapMm === 2.0
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black text-white">2.0 mm Anash (-4 mm total)</p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Elementi {kaca}cm &rarr; Fronti: <strong className="text-amber-300 font-mono">{kacaMm - 4} mm ({((kacaMm - 4) / 10).toFixed(1)} cm)</strong>
                  </p>
                </button>
              </div>
            </div>

            {/* 2D SVG BLUEPRINT DIAGRAM FOR FRONT PANEL */}
            <div className={`relative bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 overflow-x-auto flex justify-center items-center shadow-inner ${isExpanded ? 'min-h-[520px]' : 'min-h-[380px]'}`}>
              <svg
                viewBox="0 0 900 460"
                className="w-full max-w-[860px] h-auto select-none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="blueprintGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
                  </pattern>
                  
                  <linearGradient id="frontSurfaceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="50%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>

                  <radialGradient id="holeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="70%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </radialGradient>
                </defs>

                {/* Background Grid */}
                <rect x="0" y="0" width="900" height="460" fill="url(#blueprintGrid)" />

                {/* FRONT PANEL RECTANGLE */}
                <rect
                  x="150"
                  y="50"
                  width="600"
                  height="320"
                  rx="8"
                  fill="url(#frontSurfaceGrad)"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                />
                
                {/* Header Labels */}
                <text x="450" y="80" fill="#94a3b8" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="0.1em">
                  BALLINA E SIRTARIT (PAMJA NGA BRENDA)
                </text>
                <text x="450" y="102" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
                  Gjerësia e Prerjes së Frontit: {frontWidthMm} mm ({frontWidthCm} cm)
                </text>

                {/* Reference lines for cabinet sides */}
                <line x1="182" y1="35" x2="182" y2="390" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
                <text x="182" y="26" fill="#fbbf24" fontSize="9" fontWeight="extrabold" textAnchor="middle">
                  Muri i Majtë ({btMm}mm)
                </text>

                <line x1="718" y1="35" x2="718" y2="390" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
                <text x="718" y="26" fill="#fbbf24" fontSize="9" fontWeight="extrabold" textAnchor="middle">
                  Muri i Djathtë ({btMm}mm)
                </text>

                {/* LEFT DRILL HOLES */}
                {/* Hole 1: automatically calculated from runner (y = 370 - 75 = 295) */}
                <g transform="translate(207, 295)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                </g>

                {/* Hole 2: +32mm higher (y = 295 - 45 = 250) */}
                <g transform="translate(207, 250)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                </g>

                {/* Hole 3: Shipka (Gallery Rail) for Big Drawer (y = 295 - 130 = 165) */}
                {hasShipkë && (
                  <g transform="translate(207, 165)">
                    <circle cx="0" cy="0" r="9" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                    <line x1="-13" y1="0" x2="13" y2="0" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="-13" x2="0" y2="13" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                    <text x="-16" y="4" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end">
                      Shipka (Shufra)
                    </text>
                  </g>
                )}

                {/* RIGHT DRILL HOLES */}
                {/* Hole 1 */}
                <g transform="translate(693, 295)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                </g>

                {/* Hole 2 */}
                <g transform="translate(693, 250)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                </g>

                {/* Hole 3: Shipka */}
                {hasShipkë && (
                  <g transform="translate(693, 165)">
                    <circle cx="0" cy="0" r="9" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                    <line x1="-13" y1="0" x2="13" y2="0" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="-13" x2="0" y2="13" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                    <text x="16" y="4" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="start">
                      Shipka (Shufra)
                    </text>
                  </g>
                )}

                {/* DIMENSION LINES */}
                {/* 1. Vertical from bottom edge to Hole 1 */}
                <line x1="60" y1="370" x2="207" y2="370" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="60" y1="295" x2="207" y2="295" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="80" y1="370" x2="80" y2="295" stroke="#34d399" strokeWidth="2.5" />
                <polygon points="80,370 76,362 84,362" fill="#34d399" />
                <polygon points="80,295 76,303 84,303" fill="#34d399" />
                <rect x="25" y="320" width="88" height="24" rx="6" fill="#064e3b" stroke="#059669" strokeWidth="1.5" />
                <text x="69" y="336" fill="#a7f3d0" fontSize="11" fontWeight="900" textAnchor="middle">
                  {fmt(hole1FromBottomMm)}
                </text>

                {/* 2. Vertical 32mm pitch between Hole 1 and Hole 2 */}
                <line x1="60" y1="250" x2="207" y2="250" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="80" y1="295" x2="80" y2="250" stroke="#38bdf8" strokeWidth="2.5" />
                <polygon points="80,295 76,287 84,287" fill="#38bdf8" />
                <polygon points="80,250 76,258 84,258" fill="#38bdf8" />
                <rect x="35" y="260" width="70" height="22" rx="5" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1.5" />
                <text x="70" y="275" fill="#bae6fd" fontSize="10" fontWeight="900" textAnchor="middle">
                  + {fmt(32)}
                </text>

                {/* 3. Dimension to Shipka if enabled */}
                {hasShipkë && (
                  <>
                    <line x1="60" y1="165" x2="207" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="80" y1="250" x2="80" y2="165" stroke="#fbbf24" strokeWidth="2" />
                    <polygon points="80,250 76,242 84,242" fill="#fbbf24" />
                    <polygon points="80,165 76,173 84,173" fill="#fbbf24" />
                    <rect x="25" y="195" width="90" height="24" rx="6" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
                    <text x="70" y="211" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
                      {fmt(shipkaHoleFromBottomMm)}
                    </text>
                  </>
                )}

                {/* 4. Horizontal from inner wall: 15.5mm */}
                <line x1="182" y1="205" x2="207" y2="205" stroke="#fbbf24" strokeWidth="1.8" />
                <rect x="155" y="178" width="80" height="22" rx="4" fill="#78350f" stroke="#d97706" strokeWidth="1" />
                <text x="195" y="193" fill="#fde68a" fontSize="9" fontWeight="900" textAnchor="middle">
                  15.5 mm (nga muri)
                </text>

                {/* 5. Horizontal from outer edge of front: e.g. 31-32mm */}
                <line x1="150" y1="395" x2="207" y2="395" stroke="#818cf8" strokeWidth="2.5" />
                <polygon points="150,395 158,391 158,399" fill="#818cf8" />
                <polygon points="207,395 199,391 199,399" fill="#818cf8" />
                
                <rect x="125" y="408" width="105" height="24" rx="6" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
                <text x="178" y="424" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                  {fmt(fromOuterEdgeMm)}
                </text>
                <text x="178" y="444" fill="#c7d2fe" fontSize="8.5" fontWeight="black" textAnchor="middle">
                  (VETËM KJO NGA SKAJI JASHTË)
                </text>

                {/* 6. Center-to-center horizontal distance: LW - 31mm */}
                <line x1="207" y1="125" x2="693" y2="125" stroke="#38bdf8" strokeWidth="2" />
                <polygon points="207,125 215,121 215,129" fill="#38bdf8" />
                <polygon points="693,125 685,121 685,129" fill="#38bdf8" />
                <rect x="365" y="112" width="170" height="26" rx="6" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="450" y="129" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                  Gjerësia mes Birave: {fmt(distanceBetweenLeftRightHolesMm)}
                </text>
              </svg>
            </div>

            {/* 4 Step Summary for Front */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Bira 1 (Poshtme)
                </span>
                <p className="text-xl font-black text-white">{fmt(hole1FromBottomMm)}</p>
                <p className="text-xs text-slate-300">
                  Llogaritur automatikisht: Llageri {fmt(runnerFromSideBottomMm)} + 13mm.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                  Bira 2 (Sipërme)
                </span>
                <p className="text-xl font-black text-white">{fmt(hole2FromBottomMm)}</p>
                <p className="text-xs text-slate-300">
                  Saktësisht <strong>+3.2 cm (32 mm)</strong> mbi birën 1.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  {hasShipkë ? 'Bira e Shipkës' : 'Anash (Pozicioni)'}
                </span>
                <p className="text-xl font-black text-white">
                  {hasShipkë ? fmt(shipkaHoleFromBottomMm) : `${fmt(15.5)} / ${fmt(fromOuterEdgeMm)}`}
                </p>
                <p className="text-xs text-slate-300">
                  {hasShipkë
                    ? `Bira e shufrës/shipkës për fijokë të madhe (+${shipkaFromHole1Mm}mm mbi birën 1).`
                    : `15.5mm nga muri brenda (${fmt(fromOuterEdgeMm)} nga skaji jashtë).`}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  Përmasa Frontit
                </span>
                <p className="text-xl font-black text-amber-300">{frontWidthMm} mm</p>
                <p className="text-xs text-slate-300">
                  Gjerësia neto e prerjes me fugë {currentSideGapMm}mm anash ({frontWidthCm} cm).
                </p>
              </div>
            </div>

            {/* CLARITY BANNER: 3.1 cm / 3.2 cm explanation */}
            <div className="p-3.5 bg-indigo-950/60 rounded-2xl border border-indigo-500/40 flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black shrink-0 mt-0.5">
                !
              </div>
              <div className="space-y-1 text-slate-200">
                <p className="font-extrabold text-amber-300 uppercase tracking-wide">
                  SQARIM I RËNDËSISHËM PËR SHPIMIN ANASH (MOS I MBLIDHNI BASHKË):
                </p>
                <p className="leading-relaxed text-slate-300">
                  Matja nga skaji i jashtëm i ballinës me metër bëhet <strong>VETËM {fromOuterEdgeMm} mm ({fromOuterEdgeCm} cm ose 3.1 cm sipas punishtes)</strong>. Distanca <strong>15.5 mm</strong> është matja e brendshme nga muri. <strong>Këto të dyja NUK mblidhen bashkë</strong> — ato tregojnë të njëjtën vrimë!
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 2. SHPIMI I MUREVE ANËSORE PËR LLAGERAT */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Standardi i Shpimit të Mureve Anësore (Llagerat Blum Antaro)
                  </span>
                </div>
                <div className="text-xs font-mono font-black text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800 shadow-sm">
                  Nga Zero Poshtë: <strong>{fmt(runnerFromSideBottomMm)}</strong> | Mbi Pos (Dysheme): <strong>{fmt(runnerAboveFloorMm)}</strong>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kur anësorja shkon në zero poshtë (me dysheme të mbyllur {btMm}mm): matja bëhet <strong>{fmt(runnerFromSideBottomMm)}</strong> nga fundi i anësores, e cila brenda elementit korrespondon saktësisht <strong>{fmt(runnerAboveFloorMm)}</strong> mbi sipërfaqen e posit/dyshemesë! Kur e ndryshoni këtë vlerë, birat e frontit azhurnohen automatikisht.
              </p>
            </div>

            {/* 2D SVG BLUEPRINT FOR CABINET SIDE WALL RUNNER DRILLING */}
            <div className={`relative bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 overflow-x-auto flex justify-center items-center shadow-inner ${isExpanded ? 'min-h-[500px]' : 'min-h-[360px]'}`}>
              <svg
                viewBox="0 0 880 440"
                className="w-full max-w-[840px] h-auto select-none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="runnerGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
                  </pattern>

                  <linearGradient id="woodSideGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  <linearGradient id="runnerMetalGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>

                {/* Grid */}
                <rect x="0" y="0" width="880" height="440" fill="url(#runnerGrid)" />

                {/* CABINET SIDE WALL PANEL (MURI ANËSOR I KORPUSIT) */}
                <rect
                  x="100"
                  y="50"
                  width="660"
                  height="310"
                  rx="6"
                  fill="url(#woodSideGrad)"
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* Front edge indicator */}
                <line x1="100" y1="50" x2="100" y2="360" stroke="#38bdf8" strokeWidth="4" />
                <text x="100" y="40" fill="#38bdf8" fontSize="11" fontWeight="black" textAnchor="middle">
                  BALLI I ANËSORES (PËRPARA)
                </text>

                {/* Back edge */}
                <text x="760" y="40" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">
                  MBRAPA (MUR)
                </text>

                {/* Bottom floor board (Posi / Dyshemeja e elementit) */}
                <rect
                  x="100"
                  y="335"
                  width="660"
                  height="25"
                  fill="#1e1b4b"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                />
                <text x="440" y="352" fill="#a5b4fc" fontSize="11" fontWeight="900" textAnchor="middle">
                  DYSHEMEJA E ELEMENTIT (POSI: {btMm}mm)
                </text>

                {/* Centerline of runner drilling */}
                <line x1="80" y1="275" x2="780" y2="275" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
                
                {/* RUNNER METAL PROFILE SILHOUETTE */}
                <rect
                  x="120"
                  y="260"
                  width="550"
                  height="30"
                  rx="4"
                  fill="url(#runnerMetalGrad)"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
                <text x="440" y="280" fill="#0f172a" fontSize="11" fontWeight="black" textAnchor="middle" letterSpacing="0.05em">
                  LLAGERI BLUM ANTARO (RUNNER {llageri}cm)
                </text>

                {/* RUNNER HOLE 1 (at 37mm from front edge) */}
                <g transform="translate(155, 275)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {/* RUNNER HOLE 2 (at 37+32 = 69mm from front edge) */}
                <g transform="translate(203, 275)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {/* RUNNER HOLE 3 (at depth) */}
                <g transform="translate(495, 275)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {/* CALLOUT ARROWS & DIMENSIONS */}
                {/* 1. Dimension from Floor Top to Hole (mbi pos) */}
                <line x1="790" y1="335" x2="790" y2="275" stroke="#34d399" strokeWidth="2.5" />
                <polygon points="790,335 786,327 794,327" fill="#34d399" />
                <polygon points="790,275 786,283 794,283" fill="#34d399" />
                
                <rect x="800" y="293" width="75" height="24" rx="6" fill="#064e3b" stroke="#059669" strokeWidth="1" />
                <text x="837" y="309" fill="#a7f3d0" fontSize="10.5" fontWeight="900" textAnchor="middle">
                  {fmt(runnerAboveFloorMm)}
                </text>
                <text x="837" y="328" fill="#34d399" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                  (Mbi Pos)
                </text>

                {/* 2. Dimension from Bottom in Zero */}
                <line x1="50" y1="360" x2="50" y2="275" stroke="#fbbf24" strokeWidth="2.5" />
                <polygon points="50,360 46,352 54,352" fill="#fbbf24" />
                <polygon points="50,275 46,283 54,283" fill="#fbbf24" />
                
                <rect x="5" y="305" width="85" height="25" rx="6" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
                <text x="47" y="321" fill="#fef08a" fontSize="11" fontWeight="900" textAnchor="middle">
                  {fmt(runnerFromSideBottomMm)}
                </text>
                <text x="47" y="342" fill="#fbbf24" fontSize="8.5" fontWeight="black" textAnchor="middle">
                  (Nga Zero Poshtë)
                </text>

                {/* 3. Horizontal from Front Edge to 1st Hole (37 mm / 3.7 cm) */}
                <line x1="100" y1="230" x2="155" y2="230" stroke="#38bdf8" strokeWidth="2" />
                <line x1="100" y1="223" x2="100" y2="237" stroke="#38bdf8" strokeWidth="2" />
                <line x1="155" y1="223" x2="155" y2="237" stroke="#38bdf8" strokeWidth="2" />
                
                <rect x="105" y="200" width="55" height="20" rx="5" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                <text x="132" y="214" fill="#ffffff" fontSize="9.5" fontWeight="900" textAnchor="middle">
                  {fmt(runner1stHoleFromFrontMm)}
                </text>

                {/* 4. Pitch 32mm between Hole 1 and Hole 2 */}
                <line x1="155" y1="230" x2="203" y2="230" stroke="#818cf8" strokeWidth="2" />
                <line x1="203" y1="223" x2="203" y2="237" stroke="#818cf8" strokeWidth="2" />
                <rect x="165" y="200" width="50" height="20" rx="5" fill="#312e81" stroke="#6366f1" strokeWidth="1" />
                <text x="190" y="214" fill="#e0e7ff" fontSize="9.5" fontWeight="900" textAnchor="middle">
                  {fmt(32)}
                </text>

                {/* Bottom line label */}
                <text x="440" y="380" fill="#94a3b8" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  ▼ SKAJI I POSHTËM I ANËSORES (ZERO NË DYSHEME) ▼
                </text>
              </svg>
            </div>

            {/* 3 Summary Cards for Side Wall Drilling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  Nga Zero Poshtë (Fundi)
                </span>
                <p className="text-xl font-black text-amber-300">{fmt(runnerFromSideBottomMm)}</p>
                <p className="text-xs text-slate-300">
                  Shëno saktësisht <strong>{fmt(runnerFromSideBottomMm)}</strong> nga fundi i faqes anësore për vijën e llagerit.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Mbi Pos (Dyshemeja)
                </span>
                <p className="text-xl font-black text-emerald-300">{fmt(runnerAboveFloorMm)}</p>
                <p className="text-xs text-slate-300">
                  Në brendësi të elementit, bira e llagerit vjen fiks <strong>{fmt(runnerAboveFloorMm)}</strong> mbi pos.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                  Nga Balli (Përpara)
                </span>
                <p className="text-xl font-black text-sky-300">{fmt(runner1stHoleFromFrontMm)}</p>
                <p className="text-xs text-slate-300">
                  Bira e parë: <strong>{fmt(runner1stHoleFromFrontMm)}</strong> nga balli i anësores; bira e dytë: <strong>+32mm ({fmt(runner2ndHoleFromFrontMm)})</strong>.
                </p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
