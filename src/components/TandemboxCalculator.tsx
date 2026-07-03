import { useState, useMemo, ReactNode } from 'react';
import { Settings, Ruler, Box, Info, Calculator, Download, Printer, Layers, Maximize2, MoveRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Dimensions {
  ballorjaKomplet?: number;
  ballorjaMbrenda?: number;
  ansoret?: number;
  lesenitiWidth: number;
  lesenitiDepth: number;
  shpinaWidth?: number;
  shpinaHeight?: number;
  lw?: number;
  // Roboti fields
  shelfWidth?: number;
  shelfDepth?: number;
  shelfSpacing?: number;
  drillingPositions?: number[];
}

type CalculatorType = 'fijoka-druri' | 'antaro' | 'roboti';
type AntaroProfile = 'M' | 'K' | 'B' | 'C' | 'D';

const ANTARO_HEIGHTS: Record<AntaroProfile, number> = {
  'M': 8.2,
  'K': 10.0,
  'B': 13.2,
  'C': 16.4,
  'D': 20.0
};

export function TandemboxCalculator({ onBack }: { onBack: () => void }) {
  const [type, setType] = useState<CalculatorType>('fijoka-druri');
  const [kaca, setKaca] = useState<number>(90);
  const [llageri, setLlageri] = useState<number>(50);
  const [boardThickness, setBoardThickness] = useState<number>(1.8);
  const [antaroProfile, setAntaroProfile] = useState<AntaroProfile>('M');
  
  // Roboti specific state
  const [cabinetHeight, setCabinetHeight] = useState<number>(140);
  const [cabinetDepth, setCabinetDepth] = useState<number>(60);
  const [numShelves, setNumShelves] = useState<number>(5);
  const [recessDepth, setRecessDepth] = useState<number>(2);

  const results = useMemo((): Dimensions => {
    if (type === 'fijoka-druri') {
      const ballorjaKomplet = Number((kaca - (boardThickness * 2) - 1.8).toFixed(1));
      const ballorjaMbrenda = Number((ballorjaKomplet - 2.4).toFixed(1));
      const ansoret = llageri;
      const lesenitiWidth = Number((ballorjaKomplet - 1.2).toFixed(1));
      const lesenitiDepth = Number((llageri - 1.2).toFixed(1));

      return {
        ballorjaKomplet,
        ballorjaMbrenda,
        ansoret,
        lesenitiWidth,
        lesenitiDepth,
      };
    } else if (type === 'antaro') {
      const lw = Number((kaca - (boardThickness * 2)).toFixed(1));
      const lesenitiWidth = Number((lw - 7.5).toFixed(1));
      const lesenitiDepth = Number((llageri - 2.5).toFixed(1));
      const shpinaWidth = Number((lw - 8.7).toFixed(1));
      const shpinaHeight = ANTARO_HEIGHTS[antaroProfile];

      return {
        lw,
        lesenitiWidth,
        lesenitiDepth,
        shpinaWidth,
        shpinaHeight,
      };
    } else {
      const shelfWidth = Number((kaca - (boardThickness * 2)).toFixed(1));
      const shelfDepth = Number((cabinetDepth - recessDepth - 2).toFixed(1));
      const totalBoards = numShelves + 2;
      const totalThickness = totalBoards * boardThickness;
      const netHeight = cabinetHeight - totalThickness;
      const numGaps = numShelves + 1;
      const shelfSpacingRaw = netHeight / numGaps;
      const shelfSpacing = Number(shelfSpacingRaw.toFixed(1));
      
      const drillingPositions: number[] = [];
      for (let i = 1; i <= numShelves; i++) {
        const pos = boardThickness + (i * shelfSpacing) + ((i - 1) * boardThickness);
        drillingPositions.push(Number(pos.toFixed(1)));
      }

      return {
        lesenitiWidth: Number((kaca - 2.3).toFixed(1)),
        lesenitiDepth: Number((cabinetHeight - 2.3).toFixed(1)),
        shelfWidth,
        shelfDepth,
        shelfSpacing,
        drillingPositions,
      };
    }
  }, [type, kaca, llageri, boardThickness, antaroProfile, cabinetHeight, cabinetDepth, numShelves, recessDepth]);

  const downloadCuttingList = () => {
    const content = `
LISTA E PRERJES - ${type === 'roboti' ? 'RAFTA' : type.toUpperCase().replace('-', ' ')}
---------------------------
Data: ${new Date().toLocaleDateString()}
Konfigurimi:
${type === 'roboti' ? `
- Lartësia e Kaces: ${cabinetHeight} cm
- Gjerësia e Kaces: ${kaca} cm
- Thellësia e Kaces: ${cabinetDepth} cm
- Numri i Raftave: ${numShelves}
` : `
- Gjerësia e Kaces: ${kaca} cm
- Gjatësia e Llagerit: ${llageri} cm
`}
- Trashësia e Pllakës: ${boardThickness * 10} mm
${type === 'antaro' ? `- Profili Antaro: ${antaroProfile}` : ''}

DIMENSIONET PËR PRERJE:
${type === 'fijoka-druri' ? `
1. Ballorja Komplet: ${results.ballorjaKomplet} cm
2. Ballorja Mbrenda: ${results.ballorjaMbrenda} cm
3. Anësoret: ${results.ansoret} cm
4. Leseniti: ${results.lesenitiWidth} x ${results.lesenitiDepth} cm
` : type === 'antaro' ? `
1. Shpina (Gjerësia): ${results.shpinaWidth} cm
2. Shpina (Lartësia): ${results.shpinaHeight} cm
3. Podi (Gjerësia): ${results.lesenitiWidth} cm
4. Podi (Gjatësia): ${results.lesenitiDepth} cm
` : `
1. Raftat (${numShelves} copë): ${results.shelfWidth} x ${results.shelfDepth} cm
2. Leseniti (Mbas): ${results.lesenitiWidth} x ${results.lesenitiDepth} cm
3. Hapsira mes Raftave: ${results.shelfSpacing} cm
4. Birat (Lartësitë nga poshtë): ${results.drillingPositions?.join(', ')} cm
`}

Gjeneruar nga MergimGroup Tool
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fijoka_${kaca}cm.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-20 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            ← Shko Mbrapa
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Tandembox Pro</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Llogaritësi i masave</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Zgjidh Llojin</label>
              <div className="grid grid-cols-3 gap-2">
                {(['fijoka-druri', 'antaro', 'roboti'] as CalculatorType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      setBoardThickness(1.8);
                    }}
                    className={`py-3 text-[10px] font-black uppercase rounded-xl border transition-all ${
                      type === t 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                        : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {t === 'roboti' ? 'Rafta' : t === 'fijoka-druri' ? 'Fijoka Druri' : 'Antaro'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {type === 'roboti' ? (
                <>
                  <InputBox label="Lartësia Kaces" value={cabinetHeight} onChange={setCabinetHeight} unit="CM" />
                  <InputBox label="Gjerësia Kaces <--->" value={kaca} onChange={setKaca} unit="CM" />
                  <InputBox label="Thellësia Kaces <--->" value={cabinetDepth} onChange={setCabinetDepth} unit="CM" />
                  <InputBox label="Nr. Raftave" value={numShelves} onChange={setNumShelves} unit="COPE" />
                </>
              ) : (
                <>
                  <InputBox label="Gjerësia Kaces <--->" value={kaca} onChange={setKaca} unit="CM" />
                  <InputBox label="Gjatësia Llagerit <--->" value={llageri} onChange={setLlageri} unit="CM" />
                </>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trashësia Pllakës (mm)</label>
              <div className="flex gap-2">
                {(type === 'antaro' ? [1.8] : [1.6, 1.8, 1.9, 2.2]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBoardThickness(t)}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all ${
                      boardThickness === t 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {t * 10}mm
                  </button>
                ))}
              </div>
            </div>

            {type === 'antaro' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Profili Antaro</label>
                <div className="flex gap-2">
                  {(['M', 'K', 'B', 'C', 'D'] as AntaroProfile[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setAntaroProfile(p)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        antaroProfile === p 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-400 border-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <div className="flex gap-3 items-start">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-amber-800 font-medium">
                {type === 'fijoka-druri' ? (
                  <p><strong>Fijoka Druri:</strong> Ballorja = Kaca - (2 x {boardThickness}cm) - 1.8cm = {(kaca - boardThickness * 2 - 1.8).toFixed(1)}cm. Muret e sirtarit llogariten me trashësi 1.2cm. Leseniti = (Ballorja - 1.2) x (Llageri - 1.2).</p>
                ) : type === 'antaro' ? (
                  <p><strong>Antaro:</strong> Podi = LW - 7.5cm / Llageri - 2.5cm. Shpina = LW - 8.7cm / Lartësia {ANTARO_HEIGHTS[antaroProfile]}cm.</p>
                ) : (
                  <p><strong>Rafta:</strong> Raftat llogariten duke zbritur muret anësore dhe lënë vend për lesenitin mbarapa.</p>
                )}
              </div>
            </div>
          </div>

          <CabinetVisualizer type={type} kaca={kaca} boardThickness={boardThickness} results={results} />
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between print:hidden px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Dimensionet për Prerje</h2>
            <div className="flex gap-2">
               <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600"><Printer className="w-5 h-5" /></button>
               <button onClick={downloadCuttingList} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-indigo-600"><Download className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Përmbledhja</p>
                <h3 className="text-xl font-bold uppercase">{type === 'roboti' ? 'Rafta' : type.replace('-', ' ')}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase opacity-50 mb-1">Pllaka</p>
                <p className="text-lg font-bold">{boardThickness * 10}mm</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {type === 'fijoka-druri' ? (
                <>
                  <ResultItem label="Ballorja Komplet" value={`${results.ballorjaKomplet} cm`} subtitle="Gjerësia totale e jashtme" />
                  <ResultItem label="Ballorja Mbrenda" value={`${results.ballorjaMbrenda} cm`} subtitle="Mes faqeve anësore" />
                  <ResultItem label="Anësoret" value={`${results.ansoret} cm`} subtitle="E barabartë me llagerin" />
                  <ResultItem label="Podi (Leseniti)" value={`${results.lesenitiWidth} x ${results.lesenitiDepth} cm`} subtitle="Gjerësi x Gjatësi" highlight />
                </>
              ) : type === 'antaro' ? (
                <>
                  <ResultItem label="Shpina" value={`${results.shpinaWidth} x ${results.shpinaHeight} cm`} subtitle="Gjerësi x Lartësi" />
                  <ResultItem label="Podi" value={`${results.lesenitiWidth} x ${results.lesenitiDepth} cm`} subtitle="Gjerësi x Lartësi" highlight />
                  <div className="p-4 bg-indigo-50/50 text-center">
                    <p className="text-[10px] font-black uppercase text-indigo-400">LW (Internal Width): {results.lw} cm</p>
                  </div>
                </>
              ) : (
                <>
                  <ResultItem label={`Raftat (${numShelves} copë)`} value={`${results.shelfWidth} x ${results.shelfDepth} cm`} subtitle="Gjerësi x Thellësi" highlight />
                  <ResultItem label="Leseniti (Mbrapa)" value={`${results.lesenitiWidth} x ${results.lesenitiDepth} cm`} subtitle="Gjerësi x Lartësi" />
                  <ResultItem label="Hapsira mes Raftave" value={`${results.shelfSpacing} cm`} subtitle="Distanca neto mes tyre" />
                  <div className="p-6 bg-slate-50">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Pozicioni i birave (nga fundi)</p>
                    <div className="flex flex-wrap gap-2">
                      {results.drillingPositions?.map((pos, i) => (
                        <div key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm">
                          {pos} cm
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputBox({ label, value, onChange, unit }: { label: string, value: number, onChange: (v: number) => void, unit: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-indigo-400">
        {label}
      </label>
      <div className="flex items-end gap-2">
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="text-2xl font-bold bg-transparent outline-none w-full text-slate-800"
        />
        <span className="text-[10px] font-black text-slate-300 mb-1">{unit}</span>
      </div>
    </div>
  );
}

function ResultItem({ label, value, subtitle, highlight = false }: { label: string, value: string, subtitle: string, highlight?: boolean }) {
  return (
    <div className={`p-6 flex items-center justify-between transition-colors ${highlight ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
      <div>
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`text-2xl font-black ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}

function CabinetVisualizer({ 
  type, 
  kaca, 
  boardThickness, 
  results 
}: { 
  type: CalculatorType, 
  kaca: number, 
  boardThickness: number, 
  results: Dimensions 
}) {
  const lw = results.lw || Number((kaca - (boardThickness * 2)).toFixed(1));
  const btMm = Math.round(boardThickness * 10);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="w-5 h-5 text-indigo-500" />
        <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
          Vizualizimi i Trashësisë ({btMm}mm)
        </h3>
      </div>
      
      <div className="relative w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-center items-center overflow-hidden min-h-[220px]">
        {/* Render different dynamic SVG based on type */}
        {type === 'fijoka-druri' && (
          <svg className="w-full max-w-[340px] h-[200px]" viewBox="0 0 340 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Draw outer cabinet structure */}
            {/* Left Cabinet Wall */}
            <rect x="20" y="30" width="22" height="130" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <text x="31" y="95" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90, 31, 95)">
              Muri {btMm}mm
            </text>

            {/* Right Cabinet Wall */}
            <rect x="298" y="30" width="22" height="130" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <text x="309" y="95" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(90, 309, 95)">
              Muri {btMm}mm
            </text>

            {/* Cabinet Top/Bottom dashed boundary */}
            <line x1="42" y1="30" x2="298" y2="30" stroke="#94a3b8" strokeDasharray="3 3" />
            <line x1="42" y1="160" x2="298" y2="160" stroke="#94a3b8" strokeDasharray="3 3" />

            {/* Drawer Box */}
            {/* Left Drawer Side */}
            <rect x="62" y="55" width="12" height="85" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
            {/* Right Drawer Side */}
            <rect x="266" y="55" width="12" height="85" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
            {/* Drawer Bottom Panel (Podi / Leseniti) */}
            <rect x="74" y="125" width="192" height="12" rx="1" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            {/* Drawer Front Panel (Ballorja) */}
            <rect x="74" y="55" width="192" height="14" rx="2" fill="#c7d2fe" stroke="#818cf8" strokeWidth="1.5" />
            <text x="170" y="65" fill="#3730a3" fontSize="9" fontWeight="extrabold" textAnchor="middle">
              Ballorja ({results.ballorjaKomplet}cm)
            </text>

            {/* Slide clearances (9mm each side) */}
            <line x1="42" y1="95" x2="62" y2="95" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="278" y1="95" x2="298" y2="95" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
            <text x="52" y="88" fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">9mm</text>
            <text x="288" y="88" fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">9mm</text>

            {/* Dimension Lines */}
            {/* Kaca line at the top */}
            <line x1="20" y1="15" x2="320" y2="15" stroke="#4f46e5" strokeWidth="1.5" />
            <polygon points="20,15 26,11 26,19" fill="#4f46e5" />
            <polygon points="320,15 314,11 314,19" fill="#4f46e5" />
            <rect x="140" y="5" width="60" height="16" rx="4" fill="#6366f1" />
            <text x="170" y="16" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">KACA: {kaca}cm</text>

            {/* Clear Internal LW line */}
            <line x1="42" y1="180" x2="298" y2="180" stroke="#0ea5e9" strokeWidth="1.2" />
            <polygon points="42,180 48,177 48,183" fill="#0ea5e9" />
            <polygon points="298,180 292,177 292,183" fill="#0ea5e9" />
            <rect x="135" y="171" width="70" height="15" rx="3" fill="#0284c7" />
            <text x="170" y="181" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">LW: {lw}cm</text>

            {/* Explanatory text bubble for 18mm under-mount gap */}
            <circle cx="170" cy="110" r="4" fill="#818cf8" />
            <line x1="170" y1="110" x2="170" y2="125" stroke="#818cf8" strokeWidth="1" />
            <text x="170" y="104" fill="#4338ca" fontSize="8" fontWeight="semibold" textAnchor="middle">Muret e sirtarit: 12mm</text>
          </svg>
        )}

        {type === 'antaro' && (
          <svg className="w-full max-w-[340px] h-[200px]" viewBox="0 0 340 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cabinet Sides */}
            <rect x="20" y="30" width="22" height="130" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <text x="31" y="95" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90, 31, 95)">
              Muri {btMm}mm
            </text>

            <rect x="298" y="30" width="22" height="130" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <text x="309" y="95" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(90, 309, 95)">
              Muri {btMm}mm
            </text>

            {/* Cabinet Boundaries */}
            <line x1="42" y1="30" x2="298" y2="30" stroke="#94a3b8" strokeDasharray="3 3" />
            <line x1="42" y1="160" x2="298" y2="160" stroke="#94a3b8" strokeDasharray="3 3" />

            {/* Tandembox Metal Profiles on sides */}
            {/* Left Metal Profile */}
            <rect x="42" y="65" width="20" height="75" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <path d="M44 70 h16 v60 h-16 Z" fill="#f1f5f9" />
            <text x="52" y="105" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle" transform="rotate(-90, 52, 105)">Antaro</text>
            
            {/* Right Metal Profile */}
            <rect x="278" y="65" width="20" height="75" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <path d="M280 70 h16 v60 h-16 Z" fill="#f1f5f9" />
            <text x="288" y="105" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle" transform="rotate(90, 288, 105)">Antaro</text>

            {/* Base (Podi) */}
            <rect x="62" y="125" width="216" height="12" rx="1" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1" />
            <text x="170" y="134" fill="#9f1239" fontSize="8" fontWeight="bold" textAnchor="middle">
              Podi: {results.lesenitiWidth} cm
            </text>

            {/* Back (Shpina) */}
            <rect x="68" y="65" width="204" height="14" rx="2" fill="#c7d2fe" stroke="#818cf8" strokeWidth="1" />
            <text x="170" y="75" fill="#3730a3" fontSize="8" fontWeight="extrabold" textAnchor="middle">
              Shpina: {results.shpinaWidth} cm
            </text>

            {/* Dimensions */}
            {/* Kaca */}
            <line x1="20" y1="15" x2="320" y2="15" stroke="#4f46e5" strokeWidth="1.5" />
            <polygon points="20,15 26,11 26,19" fill="#4f46e5" />
            <polygon points="320,15 314,11 314,19" fill="#4f46e5" />
            <rect x="140" y="5" width="60" height="16" rx="4" fill="#6366f1" />
            <text x="170" y="16" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">KACA: {kaca}cm</text>

            {/* LW */}
            <line x1="42" y1="180" x2="298" y2="180" stroke="#0ea5e9" strokeWidth="1.2" />
            <polygon points="42,180 48,177 48,183" fill="#0ea5e9" />
            <polygon points="298,180 292,177 292,183" fill="#0ea5e9" />
            <rect x="135" y="171" width="70" height="15" rx="3" fill="#0284c7" />
            <text x="170" y="181" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">LW: {lw}cm</text>
          </svg>
        )}

        {type === 'roboti' && (
          <svg className="w-full max-w-[340px] h-[200px]" viewBox="0 0 340 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Cabinet Walls */}
            {/* Left Cabinet Wall */}
            <rect x="20" y="30" width="22" height="130" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <text x="31" y="95" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90, 31, 95)">
              Muri {btMm}mm
            </text>

            {/* Right Cabinet Wall */}
            <rect x="298" y="30" width="22" height="130" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <text x="309" y="95" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(90, 309, 95)">
              Muri {btMm}mm
            </text>

            {/* Cabinet Top/Bottom boundaries */}
            <line x1="42" y1="30" x2="298" y2="30" stroke="#94a3b8" strokeDasharray="3 3" />
            <line x1="42" y1="160" x2="298" y2="160" stroke="#94a3b8" strokeDasharray="3 3" />

            {/* Multiple Shelves (Raftat) */}
            {/* Shelf 1 */}
            <rect x="42" y="60" width="256" height="12" rx="1.5" fill="#fbcfe8" stroke="#ec4899" strokeWidth="1" />
            {/* Shelf 2 */}
            <rect x="42" y="110" width="256" height="12" rx="1.5" fill="#fbcfe8" stroke="#ec4899" strokeWidth="1" />
            <text x="170" y="119" fill="#be185d" fontSize="8" fontWeight="black" textAnchor="middle">
              Rafti: {results.shelfWidth} cm
            </text>

            {/* Spacing dimension line between shelves */}
            <line x1="170" y1="72" x2="170" y2="110" stroke="#d946ef" strokeWidth="1" />
            <polygon points="170,72 167,78 173,78" fill="#d946ef" />
            <polygon points="170,110 167,104 173,104" fill="#d946ef" />
            <text x="180" y="95" fill="#a21caf" fontSize="8" fontWeight="bold" textAnchor="start">
              Hapësira: {results.shelfSpacing}cm
            </text>

            {/* Dimensions */}
            {/* Kaca */}
            <line x1="20" y1="15" x2="320" y2="15" stroke="#4f46e5" strokeWidth="1.5" />
            <polygon points="20,15 26,11 26,19" fill="#4f46e5" />
            <polygon points="320,15 314,11 314,19" fill="#4f46e5" />
            <rect x="140" y="5" width="60" height="16" rx="4" fill="#6366f1" />
            <text x="170" y="16" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">KACA: {kaca}cm</text>

            {/* Drilling holes indications */}
            <circle cx="48" cy="85" r="2.5" fill="#94a3b8" />
            <circle cx="48" cy="95" r="2.5" fill="#94a3b8" />
            <circle cx="48" cy="135" r="2.5" fill="#94a3b8" />
            <circle cx="48" cy="145" r="2.5" fill="#94a3b8" />
            <circle cx="292" cy="85" r="2.5" fill="#94a3b8" />
            <circle cx="292" cy="95" r="2.5" fill="#94a3b8" />
            <circle cx="292" cy="135" r="2.5" fill="#94a3b8" />
            <circle cx="292" cy="145" r="2.5" fill="#94a3b8" />
            <text x="56" y="142" fill="#64748b" fontSize="7" fontWeight="bold">Shpimi</text>
          </svg>
        )}
      </div>
      <p className="text-[10px] text-slate-400 text-center font-medium">
        {type === 'fijoka-druri' 
          ? "Zhvendosja prej 1.8cm llogarit hapësirën teknike për mekanizmat Blum Tandem në të dy anët."
          : type === 'antaro'
          ? "Metalet anësore Antaro kërkojnë zbritje standarde prej 7.5cm për pod dhe 8.7cm për shpinë."
          : "Raftat priten saktësisht duke zbritur dyfishin e trashësisë së mureve anësore."}
      </p>
    </div>
  );
}
