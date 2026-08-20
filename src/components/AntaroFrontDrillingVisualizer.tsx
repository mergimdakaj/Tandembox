import { useState } from 'react';
import { Ruler, Maximize2, Minimize2, CheckCircle2, HelpCircle, ArrowRight, Eye, Layers } from 'lucide-react';

interface AntaroFrontDrillingVisualizerProps {
  kaca: number; // cm (e.g. 60 or 90)
  boardThickness: number; // cm (e.g. 1.8 or 2.2)
  fst: number; // cm (front overlay at bottom, e.g. 1.8 or 0)
  antaroProfile: 'M' | 'K' | 'B' | 'C' | 'D';
  lw: number; // cm internal width
}

export function AntaroFrontDrillingVisualizer({
  kaca,
  boardThickness,
  fst,
  antaroProfile,
  lw,
}: AntaroFrontDrillingVisualizerProps) {
  const [unit, setUnit] = useState<'mm' | 'cm'>('mm');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showRelingHole, setShowRelingHole] = useState<boolean>(antaroProfile === 'C' || antaroProfile === 'D');

  // Calculations in mm
  const btMm = Math.round(boardThickness * 10);
  const fstMm = Math.round(fst * 10);
  const lwMm = Math.round(lw * 10);
  const kacaMm = Math.round(kaca * 10);

  // Front overlay on side (FA): usually cabinet wall thickness minus 1.5mm gap (or standard 16.5mm for 18mm wall)
  const sideOverlayFaMm = Math.max(0, btMm - 1.5);
  const fromOuterEdgeMm = Number((sideOverlayFaMm + 15.5).toFixed(1));

  // Vertical hole positions from the very bottom edge of front panel
  const hole1FromBottomMm = Number((47.5 + fstMm).toFixed(1));
  const hole2FromBottomMm = Number((47.5 + fstMm + 32).toFixed(1));
  
  // Gallery rail hole for C / D profiles if applicable
  const hasGalleryRail = antaroProfile === 'C' || antaroProfile === 'D';
  const relingHoleFromBottomMm = antaroProfile === 'D' 
    ? Number((47.5 + fstMm + 128).toFixed(1)) 
    : Number((47.5 + fstMm + 64).toFixed(1));

  const distanceBetweenLeftRightHolesMm = lwMm - 31; // LW - 31mm

  // Format display string helper
  const fmt = (valMm: number) => {
    if (unit === 'cm') {
      return `${(valMm / 10).toFixed(2)} cm`;
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
              Skema e Shpimit të Ballinës (Frontit)
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

      {/* Main Visualizer Canvas Area */}
      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Interactive Notice Banner */}
        <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">
              Pamja nga <strong>Brenda e Ballinës</strong> (Faqja e pasme e derës ku montohen krahët Antaro).
            </span>
          </div>
          <div className="text-[11px] font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-800/60">
            Mbulesa FST: <strong>{fmt(fstMm)}</strong> | Muri: <strong>{btMm}mm</strong>
          </div>
        </div>

        {/* 2D SVG BLUEPRINT DIAGRAM */}
        <div className={`relative bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 overflow-x-auto flex justify-center items-center shadow-inner ${isExpanded ? 'min-h-[500px]' : 'min-h-[360px]'}`}>
          
          <svg
            viewBox="0 0 880 440"
            className="w-full max-w-[840px] h-auto select-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Grid pattern for technical blueprint aesthetic */}
              <pattern id="blueprintGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
              
              {/* Front wood / mdf surface texture gradient */}
              <linearGradient id="frontSurfaceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Drill hole gradient */}
              <radialGradient id="holeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </radialGradient>

              {/* Marker for dimension arrows */}
              <marker id="arrowIndigo" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#818cf8" />
              </marker>
              <marker id="arrowEmerald" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
              </marker>
              <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
              </marker>
              <marker id="arrowSky" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Background Grid */}
            <rect x="0" y="0" width="880" height="440" fill="url(#blueprintGrid)" />

            {/* ---------------------------------------------------- */}
            {/* 1. FRONT PANEL RECTANGLE (BALLINA E SIRTARIT)       */}
            {/* ---------------------------------------------------- */}
            {/* Front Panel Bounds: x=140 to 740 (width 600), y=60 to 350 (height 290) */}
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
            
            {/* Label inside Front Panel */}
            <text x="440" y="100" fill="#94a3b8" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="0.1em">
              BALLINA E SIRTARIT (FRONT PANEL)
            </text>
            <text x="440" y="120" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">
              Gjerësia Totale: {kaca} cm ({kacaMm} mm)
            </text>

            {/* ---------------------------------------------------- */}
            {/* 2. GHOST / REFERENCE LINES FOR CABINET SIDES & FLOOR */}
            {/* ---------------------------------------------------- */}
            {/* Left Cabinet Wall inner edge line: x = 140 + 32 = 172 */}
            <line x1="172" y1="40" x2="172" y2="370" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
            <text x="172" y="32" fill="#fbbf24" fontSize="9" fontWeight="extrabold" textAnchor="middle">
              Muri i Majtë Anësor
            </text>

            {/* Right Cabinet Wall inner edge line: x = 740 - 32 = 708 */}
            <line x1="708" y1="40" x2="708" y2="370" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
            <text x="708" y="32" fill="#fbbf24" fontSize="9" fontWeight="extrabold" textAnchor="middle">
              Muri i Djathtë Anësor
            </text>

            {/* Cabinet Floor reference line: y = 350 - (fstMm * 1.5) e.g. y = 350 - 27 = 323 */}
            {fstMm > 0 && (
              <>
                <line x1="120" y1="323" x2="760" y2="323" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
                <text x="440" y="318" fill="#fb7185" fontSize="10" fontWeight="black" textAnchor="middle">
                  --- Vija e Dyshemesë së Elementit (Cabinet Bottom) ---
                </text>
                
                {/* FST Overlay bracket */}
                <line x1="125" y1="323" x2="125" y2="350" stroke="#f43f5e" strokeWidth="1.5" />
                <line x1="120" y1="323" x2="130" y2="323" stroke="#f43f5e" strokeWidth="1.5" />
                <line x1="120" y1="350" x2="130" y2="350" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="110" y="340" fill="#fb7185" fontSize="9" fontWeight="extrabold" textAnchor="end">
                  FST: {fmt(fstMm)}
                </text>
              </>
            )}

            {/* ---------------------------------------------------- */}
            {/* 3. DRILL HOLES (LEFT SIDE & RIGHT SIDE)              */}
            {/* ---------------------------------------------------- */}
            {/* Left Hole X: x = 172 + 25 = 197 */}
            {/* Right Hole X: x = 708 - 25 = 683 */}
            {/* Hole 1 Y (Bottom): y = 350 - 80 = 270 */}
            {/* Hole 2 Y (Top): y = 270 - 45 = 225 (32mm scale) */}
            {/* Hole 3 Y (Reling if D): y = 225 - 65 = 160 */}

            {/* LEFT DRILL HOLE 1 (BOTTOM) */}
            <g transform="translate(197, 270)">
              <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" />
            </g>

            {/* LEFT DRILL HOLE 2 (TOP - 32mm pitch) */}
            <g transform="translate(197, 225)">
              <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" />
            </g>

            {/* LEFT DRILL HOLE 3 (RELING / GALLERY RAIL IF C OR D) */}
            {hasGalleryRail && (
              <g transform="translate(197, 155)">
                <circle cx="0" cy="0" r="8" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="0" cy="0" r="2" fill="#ffffff" />
                <text x="-16" y="4" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="end">Reling (Shufer)</text>
              </g>
            )}

            {/* RIGHT DRILL HOLE 1 (BOTTOM) */}
            <g transform="translate(683, 270)">
              <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" />
            </g>

            {/* RIGHT DRILL HOLE 2 (TOP - 32mm pitch) */}
            <g transform="translate(683, 225)">
              <circle cx="0" cy="0" r="10" fill="url(#holeGlow)" stroke="#38bdf8" strokeWidth="2" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" />
            </g>

            {/* RIGHT DRILL HOLE 3 (RELING IF C OR D) */}
            {hasGalleryRail && (
              <g transform="translate(683, 155)">
                <circle cx="0" cy="0" r="8" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="0" cy="0" r="2" fill="#ffffff" />
                <text x="16" y="4" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="start">Reling (Shufer)</text>
              </g>
            )}

            {/* ---------------------------------------------------- */}
            {/* 4. DIMENSION LINES & ARROWS                          */}
            {/* ---------------------------------------------------- */}

            {/* VERTICAL DIMENSIONS (LEFT SIDE CALLOUT) */}
            {/* Dimension 1: Bottom edge of front to Hole 1 */}
            <line x1="60" y1="350" x2="197" y2="350" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="60" y1="270" x2="197" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
            
            <line x1="75" y1="350" x2="75" y2="270" stroke="#34d399" strokeWidth="2" />
            <polygon points="75,350 71,342 79,342" fill="#34d399" />
            <polygon points="75,270 71,278 79,278" fill="#34d399" />

            <rect x="25" y="298" width="85" height="22" rx="6" fill="#064e3b" stroke="#059669" strokeWidth="1" />
            <text x="67" y="313" fill="#a7f3d0" fontSize="10" fontWeight="900" textAnchor="middle">
              {fmt(hole1FromBottomMm)}
            </text>

            {/* Dimension 2: Hole 1 to Hole 2 (Fixed 32mm) */}
            <line x1="60" y1="225" x2="197" y2="225" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="75" y1="270" x2="75" y2="225" stroke="#38bdf8" strokeWidth="2" />
            <polygon points="75,270 71,262 79,262" fill="#38bdf8" />
            <polygon points="75,225 71,233 79,233" fill="#38bdf8" />

            <rect x="35" y="236" width="65" height="20" rx="5" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1" />
            <text x="67" y="250" fill="#bae6fd" fontSize="9" fontWeight="900" textAnchor="middle">
              {fmt(32)}
            </text>

            {/* Total height to top hole tag */}
            <text x="75" y="210" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">
              Totali: {fmt(hole2FromBottomMm)}
            </text>

            {/* HORIZONTAL DIMENSIONS (TOP OF HOLES) */}
            {/* Distance from inside cabinet wall to hole centerline: 15.5mm */}
            <line x1="172" y1="185" x2="197" y2="185" stroke="#fbbf24" strokeWidth="1.8" />
            <line x1="172" y1="180" x2="172" y2="190" stroke="#fbbf24" strokeWidth="1.8" />
            <line x1="197" y1="180" x2="197" y2="190" stroke="#fbbf24" strokeWidth="1.8" />
            <rect x="155" y="160" width="60" height="18" rx="4" fill="#78350f" stroke="#d97706" strokeWidth="1" />
            <text x="185" y="172" fill="#fde68a" fontSize="8.5" fontWeight="900" textAnchor="middle">
              {fmt(15.5)}
            </text>

            {/* Distance from outer front edge to hole centerline: FA + 15.5mm */}
            <line x1="140" y1="375" x2="197" y2="375" stroke="#818cf8" strokeWidth="1.8" />
            <line x1="140" y1="368" x2="140" y2="382" stroke="#818cf8" strokeWidth="1.8" />
            <line x1="197" y1="368" x2="197" y2="382" stroke="#818cf8" strokeWidth="1.8" />
            <rect x="130" y="388" width="75" height="20" rx="5" fill="#312e81" stroke="#6366f1" strokeWidth="1" />
            <text x="168" y="401" fill="#e0e7ff" fontSize="9" fontWeight="900" textAnchor="middle">
              {fmt(fromOuterEdgeMm)}
            </text>
            <text x="168" y="418" fill="#818cf8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              (Nga Skaji Jashtë)
            </text>

            {/* HORIZONTAL DISTANCE BETWEEN HOLES (CENTER TO CENTER): LW - 31mm */}
            <line x1="197" y1="225" x2="197" y2="140" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="683" y1="225" x2="683" y2="140" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="197" y1="140" x2="683" y2="140" stroke="#38bdf8" strokeWidth="2" />
            <polygon points="197,140 205,136 205,144" fill="#38bdf8" />
            <polygon points="683,140 675,136 675,144" fill="#38bdf8" />

            <rect x="360" y="128" width="160" height="24" rx="6" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="440" y="144" fill="#ffffff" fontSize="10.5" fontWeight="900" textAnchor="middle">
              Gjerësia mes Birave: {fmt(distanceBetweenLeftRightHolesMm)}
            </text>

            {/* Hole diameter indicator balloon */}
            <g transform="translate(710, 245)">
              <rect x="0" y="0" width="145" height="42" rx="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
              <text x="10" y="17" fill="#a5b4fc" fontSize="9.5" fontWeight="black">BURGI SHPIMI:</text>
              <text x="10" y="32" fill="#38bdf8" fontSize="10.5" fontWeight="extrabold">Ø10mm x thellësi 12mm</text>
              <line x1="0" y1="21" x2="-22" y2="0" stroke="#818cf8" strokeWidth="1.5" />
              <circle cx="-22" cy="0" r="3" fill="#818cf8" />
            </g>

            {/* Bottom edge indicator */}
            <text x="440" y="368" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
              ▼ FUNDI I BALLINËS SË SIRTARIT (SKAJI I POSHTËM) ▼
            </text>
          </svg>
        </div>

        {/* 4 CLEAR MASTER STEPS FOR THE CARPENTER (UDHËZUESI I SHPEJTË I SHPIMIT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Step 1 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                HAPI 1
              </span>
              <span className="text-xs font-black text-emerald-400">
                Lartësia e Parë
              </span>
            </div>
            <p className="text-lg font-black text-white">
              {fmt(hole1FromBottomMm)}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mat nga <strong>fundi i ballinës</strong> lart <strong className="text-emerald-300">{fmt(hole1FromBottomMm)}</strong> dhe tërhiq vijën horizontale për birën e parë.
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Formula: 47.5mm + FST ({fmt(fstMm)})
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/40 relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                HAPI 2
              </span>
              <span className="text-xs font-black text-sky-400">
                Bira e Dytë (32mm)
              </span>
            </div>
            <p className="text-lg font-black text-white">
              {fmt(hole2FromBottomMm)}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nga bira e parë, mat saktësisht <strong className="text-sky-300">32 mm (3.2 cm)</strong> më lart për birën e dytë të kapëses Antaro.
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Totali nga fundi: {fmt(hole2FromBottomMm)}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                HAPI 3
              </span>
              <span className="text-xs font-black text-amber-400">
                Anash (Pozicioni)
              </span>
            </div>
            <p className="text-lg font-black text-white">
              {fmt(15.5)} / {fmt(fromOuterEdgeMm)}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Shëno <strong className="text-amber-300">{fmt(15.5)}</strong> nga vija e brendshme e anësores (ose <strong className="text-amber-300">{fmt(fromOuterEdgeMm)}</strong> nga skaji i jashtëm i derës).
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Gjerësia mes birave: {fmt(distanceBetweenLeftRightHolesMm)}
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/40 relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                HAPI 4
              </span>
              <span className="text-xs font-black text-indigo-400">
                Shpimi (Burgia)
              </span>
            </div>
            <p className="text-lg font-black text-white">
              Ø10 mm × 12 mm
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Shpo me burgi <strong className="text-indigo-300">Ø10mm</strong> në thellësi <strong className="text-indigo-300">12mm</strong> (për INSERTA), ose vidhos direkt me vidha druri <strong className="text-indigo-300">Ø3.5×15mm</strong>.
            </p>
            <p className="text-[10px] text-emerald-400 font-bold">
              ✓ Montim i menjëhershëm me klik
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
