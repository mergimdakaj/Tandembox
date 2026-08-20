import { useState } from 'react';
import { Ruler, Maximize2, Minimize2, CheckCircle2, Layers, Box, Info } from 'lucide-react';

interface AntaroFrontDrillingVisualizerProps {
  kaca: number; // cm (e.g. 60 or 90)
  boardThickness: number; // cm (e.g. 1.8 or 2.2)
  fst: number; // cm (front overlay at bottom, e.g. 1.8 or 0)
  antaroProfile: 'M' | 'K' | 'B' | 'C' | 'D';
  lw: number; // cm internal width
  llageri?: number; // cm (e.g. 50)
  sideGapMm?: number; // mm (e.g. 0 or 1.5 or 2.0)
  onSideGapChange?: (gap: number) => void;
}

export function AntaroFrontDrillingVisualizer({
  kaca,
  boardThickness,
  fst,
  antaroProfile,
  lw,
  llageri = 50,
  sideGapMm: propSideGapMm,
  onSideGapChange,
}: AntaroFrontDrillingVisualizerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'front' | 'runners'>('front');
  const [unit, setUnit] = useState<'mm' | 'cm'>('mm');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
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
  const fstMm = Math.round(fst * 10);
  const lwMm = Math.round(lw * 10);
  const kacaMm = Math.round(kaca * 10);
  const llageriMm = Math.round(llageri * 10);

  // Front panel width based on side gap (e.g. 600mm - 2*1.5mm = 597mm)
  const totalGapWidthMm = Number((currentSideGapMm * 2).toFixed(1));
  const frontWidthMm = Number((kacaMm - totalGapWidthMm).toFixed(1));
  const frontWidthCm = Number((frontWidthMm / 10).toFixed(2));

  // Front overlay on side (FA): thickness of wall minus side gap (e.g. 18 - 1.5 = 16.5mm, or 18 - 0 = 18mm)
  const sideOverlayFaMm = Number((btMm - currentSideGapMm).toFixed(1));
  
  // Distance from the outer edge of front panel to the drill hole centerline: FA + 15.5mm
  const fromOuterEdgeMm = Number((sideOverlayFaMm + 15.5).toFixed(1));

  // Vertical front hole positions from the very bottom edge of front panel
  const hole1FromBottomMm = Number((47.5 + fstMm).toFixed(1));
  const hole2FromBottomMm = Number((47.5 + fstMm + 32).toFixed(1));
  
  // Gallery rail hole for C / D profiles
  const hasGalleryRail = antaroProfile === 'C' || antaroProfile === 'D';
  const relingHoleFromBottomMm = antaroProfile === 'D' 
    ? Number((47.5 + fstMm + 128).toFixed(1)) 
    : Number((47.5 + fstMm + 64).toFixed(1));

  const distanceBetweenLeftRightHolesMm = lwMm - 31; // Center-to-center: LW - 31mm

  // RUNNER SIDE WALL DRILLING MEASUREMENTS
  // Master carpenter workshop standard:
  // - Inside bottom floor is btMm (e.g. 18mm)
  // - Above inside floor (mbi pos): 40mm (4.0cm)
  // - From side wall bottom in zero: 40mm + btMm = 58mm (5.8cm for 18mm board)
  const runnerAboveFloorMm = 40.0;
  const runnerFromSideBottomMm = Number((runnerAboveFloorMm + btMm).toFixed(1));
  const runner1stHoleFromFrontMm = 37.0; // 37mm from front edge of cabinet side wall (Blum System 32)
  const runner2ndHoleFromFrontMm = 69.0; // 37mm + 32mm = 69mm
  const runner3rdHoleFromFrontMm = llageriMm >= 500 ? 229.0 : 165.0; // standard depth hole

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
                Skica Teknike Grafike
              </span>
              <span className="text-[10px] font-extrabold uppercase text-amber-400">
                Blum Antaro {antaroProfile}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              Skema e Plotë e Shpimit: Ballina & Anësoret
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

      {/* Sub Tabs: 1. Ballina (Front) vs 2. Anësorja (Llagerat) */}
      <div className="bg-slate-950 px-4 sm:px-6 pt-4 border-b border-slate-800 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('front')}
          className={`py-2.5 px-4 text-xs font-black uppercase rounded-t-xl transition-all flex items-center gap-2 border-t-2 ${
            activeSubTab === 'front'
              ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-300 border-transparent'
          }`}
        >
          <Box className="w-4 h-4" /> 1. Shpimi i Ballinës (Frontit)
        </button>

        <button
          onClick={() => setActiveSubTab('runners')}
          className={`py-2.5 px-4 text-xs font-black uppercase rounded-t-xl transition-all flex items-center gap-2 border-t-2 ${
            activeSubTab === 'runners'
              ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-300 border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" /> 2. Shpimi i Mureve Anësore (Llagerat / 5.8cm - 4cm)
        </button>
      </div>

      {/* Main Visualizer Content Area */}
      <div className="p-4 sm:p-6 space-y-6">
        
        {activeSubTab === 'front' ? (
          <>
            {/* Front Side Gap Selector Banner */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Fuga / Mbulesa e Frontit Anash:
                  </span>
                  <span className="text-xs font-bold text-indigo-400">
                    {currentSideGapMm === 0 ? 'Rrafsh me elementin (Zero)' : `${currentSideGapMm}mm anash (-${totalGapWidthMm}mm total)`}
                  </span>
                </div>
                <div className="text-[11px] font-mono font-black text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/60">
                  Përmasa Frontit: {frontWidthMm} mm ({frontWidthCm} cm)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleGapSelect(0)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    currentSideGapMm === 0
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black text-white">0 mm (Rrafsh / Zero)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Fronti: <strong>{kacaMm} mm ({kaca} cm)</strong> | FA = {btMm}mm
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleGapSelect(1.5)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    currentSideGapMm === 1.5
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black text-white">1.5 mm Anash (-3mm total)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    P.sh. Elementi 60cm &rarr; Fronti <strong>{kacaMm - 3} mm ({(kacaMm - 3)/10} cm)</strong>
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleGapSelect(2.0)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    currentSideGapMm === 2.0
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-black text-white">2.0 mm Anash (-4mm total)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    P.sh. Elementi 60cm &rarr; Fronti <strong>{kacaMm - 4} mm ({(kacaMm - 4)/10} cm)</strong>
                  </p>
                </button>
              </div>
            </div>

            {/* 2D SVG BLUEPRINT DIAGRAM FOR FRONT PANEL */}
            <div className={`relative bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 overflow-x-auto flex justify-center items-center shadow-inner ${isExpanded ? 'min-h-[500px]' : 'min-h-[360px]'}`}>
              <svg
                viewBox="0 0 880 440"
                className="w-full max-w-[840px] h-auto select-none"
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
                <rect x="0" y="0" width="880" height="440" fill="url(#blueprintGrid)" />

                {/* FRONT PANEL RECTANGLE */}
                <rect
                  x="140"
                  y="60"
                  width="600"
                  height="290"
                  rx="8"
                  fill="url(#frontSurfaceGrad)"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                />
                
                {/* Labels */}
                <text x="440" y="95" fill="#94a3b8" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="0.1em">
                  BALLINA E SIRTARIT (PAMJA NGA BRENDA)
                </text>
                <text x="440" y="115" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                  Përmasa e Frontit të Prerë: {frontWidthMm} mm ({frontWidthCm} cm)
                </text>

                {/* Reference lines for cabinet sides */}
                <line x1="172" y1="40" x2="172" y2="370" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
                <text x="172" y="32" fill="#fbbf24" fontSize="9" fontWeight="extrabold" textAnchor="middle">
                  Muri i Majtë ({btMm}mm)
                </text>

                <line x1="708" y1="40" x2="708" y2="370" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
                <text x="708" y="32" fill="#fbbf24" fontSize="9" fontWeight="extrabold" textAnchor="middle">
                  Muri i Djathtë ({btMm}mm)
                </text>

                {/* Cabinet Floor reference line */}
                {fstMm > 0 && (
                  <>
                    <line x1="120" y1="323" x2="760" y2="323" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
                    <text x="440" y="318" fill="#fb7185" fontSize="10" fontWeight="black" textAnchor="middle">
                      --- Vija e Dyshemesë së Elementit (Cabinet Floor) ---
                    </text>
                    <text x="110" y="340" fill="#fb7185" fontSize="9" fontWeight="extrabold" textAnchor="end">
                      FST: {fmt(fstMm)}
                    </text>
                  </>
                )}

                {/* LEFT DRILL HOLES */}
                <g transform="translate(197, 270)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                <g transform="translate(197, 225)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {hasGalleryRail && (
                  <g transform="translate(197, 155)">
                    <circle cx="0" cy="0" r="8" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="0" cy="0" r="2" fill="#ffffff" />
                    <text x="-16" y="4" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="end">Reling (Shufer)</text>
                  </g>
                )}

                {/* RIGHT DRILL HOLES */}
                <g transform="translate(683, 270)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                <g transform="translate(683, 225)">
                  <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {hasGalleryRail && (
                  <g transform="translate(683, 155)">
                    <circle cx="0" cy="0" r="8" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="0" cy="0" r="2" fill="#ffffff" />
                    <text x="16" y="4" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="start">Reling (Shufer)</text>
                  </g>
                )}

                {/* DIMENSION LINES */}
                {/* 1. Vertical from bottom edge to Hole 1 */}
                <line x1="60" y1="350" x2="197" y2="350" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="60" y1="270" x2="197" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="75" y1="350" x2="75" y2="270" stroke="#34d399" strokeWidth="2" />
                <polygon points="75,350 71,342 79,342" fill="#34d399" />
                <polygon points="75,270 71,278 79,278" fill="#34d399" />
                <rect x="25" y="298" width="85" height="22" rx="6" fill="#064e3b" stroke="#059669" strokeWidth="1" />
                <text x="67" y="313" fill="#a7f3d0" fontSize="10" fontWeight="900" textAnchor="middle">
                  {fmt(hole1FromBottomMm)}
                </text>

                {/* 2. Vertical 32mm pitch */}
                <line x1="60" y1="225" x2="197" y2="225" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="75" y1="270" x2="75" y2="225" stroke="#38bdf8" strokeWidth="2" />
                <polygon points="75,270 71,262 79,262" fill="#38bdf8" />
                <polygon points="75,225 71,233 79,233" fill="#38bdf8" />
                <rect x="35" y="236" width="65" height="20" rx="5" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1" />
                <text x="67" y="250" fill="#bae6fd" fontSize="9" fontWeight="900" textAnchor="middle">
                  {fmt(32)}
                </text>

                {/* 3. Horizontal from inner wall: 15.5mm */}
                <line x1="172" y1="185" x2="197" y2="185" stroke="#fbbf24" strokeWidth="1.8" />
                <rect x="155" y="160" width="60" height="18" rx="4" fill="#78350f" stroke="#d97706" strokeWidth="1" />
                <text x="185" y="172" fill="#fde68a" fontSize="8.5" fontWeight="900" textAnchor="middle">
                  {fmt(15.5)}
                </text>

                {/* 4. Horizontal from outer edge of front: FA + 15.5mm */}
                <line x1="140" y1="375" x2="197" y2="375" stroke="#818cf8" strokeWidth="1.8" />
                <rect x="130" y="388" width="75" height="20" rx="5" fill="#312e81" stroke="#6366f1" strokeWidth="1" />
                <text x="168" y="401" fill="#e0e7ff" fontSize="9" fontWeight="900" textAnchor="middle">
                  {fmt(fromOuterEdgeMm)}
                </text>
                <text x="168" y="418" fill="#818cf8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  (Nga Skaji Jashtë)
                </text>

                {/* 5. Center-to-center horizontal distance: LW - 31mm */}
                <line x1="197" y1="140" x2="683" y2="140" stroke="#38bdf8" strokeWidth="2" />
                <polygon points="197,140 205,136 205,144" fill="#38bdf8" />
                <polygon points="683,140 675,136 675,144" fill="#38bdf8" />
                <rect x="360" y="128" width="160" height="24" rx="6" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="440" y="144" fill="#ffffff" fontSize="10.5" fontWeight="900" textAnchor="middle">
                  Gjerësia mes Birave: {fmt(distanceBetweenLeftRightHolesMm)}
                </text>
              </svg>
            </div>

            {/* 4 Step Summary for Front */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Lartësia 1
                </span>
                <p className="text-lg font-black text-white">{fmt(hole1FromBottomMm)}</p>
                <p className="text-xs text-slate-300">Nga fundi i ballinës lart për birën e parë (47.5mm + FST {fmt(fstMm)}).</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                  Lartësia 2
                </span>
                <p className="text-lg font-black text-white">{fmt(hole2FromBottomMm)}</p>
                <p className="text-xs text-slate-300">Saktësisht <strong>32 mm</strong> më lart për birën e dytë të kapëses.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  Anash (Pozicioni)
                </span>
                <p className="text-lg font-black text-white">{fmt(15.5)} / {fmt(fromOuterEdgeMm)}</p>
                <p className="text-xs text-slate-300">15.5mm nga muri brenda, ose {fmt(fromOuterEdgeMm)} nga skaji i jashtëm.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  Përmasa Frontit
                </span>
                <p className="text-lg font-black text-white">{frontWidthMm} mm</p>
                <p className="text-xs text-slate-300">Gjerësia neto e prerjes me fugë {currentSideGapMm}mm anash ({frontWidthCm}cm).</p>
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
                    Standardi Zyrtar i Punishtes për Shpimin e Anësores
                  </span>
                </div>
                <div className="text-[11px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800">
                  Mbi Dysheme (Mbi Pos): <strong>{fmt(runnerAboveFloorMm)}</strong> | Nga Fundi në Zero: <strong>{fmt(runnerFromSideBottomMm)}</strong>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kur anësorja shkon në zero poshtë (me dysheme të mbyllur {btMm}mm): matja bëhet <strong>{fmt(runnerFromSideBottomMm)} ({fmt(runnerFromSideBottomMm)})</strong> nga fundi i anësores, e cila brenda elementit korrespondon saktësisht <strong>{fmt(runnerAboveFloorMm)} ({fmt(runnerAboveFloorMm)})</strong> mbi sipërfaqen e posit/dyshemesë!
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
                {/* x=100 to 760 (width 660, representing cabinet depth e.g. 56cm) */}
                {/* y=50 to 360 (height 310) */}
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

                {/* Front edge indicator (Faqja e përparme ku vjen dera) */}
                <line x1="100" y1="50" x2="100" y2="360" stroke="#38bdf8" strokeWidth="4" />
                <text x="100" y="40" fill="#38bdf8" fontSize="11" fontWeight="black" textAnchor="middle">
                  BALLI I ANËSORES (PËRPARA)
                </text>

                {/* Back edge */}
                <text x="760" y="40" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">
                  MBRAPA (MUR)
                </text>

                {/* Bottom floor board (Posi / Dyshemeja e elementit) */}
                {/* Height of floor = btMm (scaled: 25px). y=335 to 360 */}
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

                {/* Centerline of runner drilling:
                    From bottom in zero: y = 360 - 85 = 275 (representing 58mm)
                    From floor top (y=335): 335 - 275 = 60px (representing 40mm)
                */}
                <line x1="80" y1="275" x2="780" y2="275" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
                
                {/* RUNNER METAL PROFILE SILHOUETTE (LLAGERI BLUM) */}
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
                {/* x = 100 + 55 = 155 */}
                <g transform="translate(155, 275)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {/* RUNNER HOLE 2 (at 37+32 = 69mm from front edge) */}
                {/* x = 155 + 48 = 203 */}
                <g transform="translate(203, 275)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {/* RUNNER HOLE 3 (at depth) */}
                {/* x = 155 + 340 = 495 */}
                <g transform="translate(495, 275)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="0" cy="0" r="2" fill="#ffffff" />
                </g>

                {/* CALLOUT ARROWS & DIMENSIONS */}
                {/* 1. Dimension from Floor Top to Hole (4.0 cm / 40 mm) */}
                <line x1="790" y1="335" x2="790" y2="275" stroke="#34d399" strokeWidth="2.5" />
                <polygon points="790,335 786,327 794,327" fill="#34d399" />
                <polygon points="790,275 786,283 794,283" fill="#34d399" />
                
                <rect x="800" y="293" width="75" height="24" rx="6" fill="#064e3b" stroke="#059669" strokeWidth="1" />
                <text x="837" y="309" fill="#a7f3d0" fontSize="10.5" fontWeight="900" textAnchor="middle">
                  {fmt(runnerAboveFloorMm)}
                </text>
                <text x="837" y="328" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">
                  (Mbi Pos)
                </text>

                {/* 2. Dimension from Bottom in Zero (5.8 cm / 58 mm) */}
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
                  Shëno saktësisht <strong>{fmt(runnerFromSideBottomMm)} ({fmt(runnerFromSideBottomMm)})</strong> nga fundi i faqes anësore për vijën e llagerit.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Mbi Pos (Dyshemeja)
                </span>
                <p className="text-xl font-black text-emerald-300">{fmt(runnerAboveFloorMm)}</p>
                <p className="text-xs text-slate-300">
                  Në brendësi të elementit, bira e llagerit vjen fiks <strong>{fmt(runnerAboveFloorMm)} ({fmt(runnerAboveFloorMm)})</strong> mbi pos.
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
