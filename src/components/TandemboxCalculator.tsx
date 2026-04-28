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
  const [kaca, setKaca] = useState<number>(45);
  const [llageri, setLlageri] = useState<number>(35);
  const [boardThickness, setBoardThickness] = useState<number>(1.8);
  const [antaroProfile, setAntaroProfile] = useState<AntaroProfile>('M');
  
  // Roboti specific state
  const [cabinetHeight, setCabinetHeight] = useState<number>(140);
  const [cabinetDepth, setCabinetDepth] = useState<number>(60);
  const [numShelves, setNumShelves] = useState<number>(5);
  const [recessDepth, setRecessDepth] = useState<number>(2);

  const results = useMemo((): Dimensions => {
    if (type === 'fijoka-druri') {
      const ballorjaKomplet = Number((kaca - (boardThickness * 3)).toFixed(1));
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
LISTA E PRERJES - ${type.toUpperCase().replace('-', ' ')}
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
                    {t.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {type === 'roboti' ? (
                <>
                  <InputBox label="Lartësia Kaces" value={cabinetHeight} onChange={setCabinetHeight} unit="CM" />
                  <InputBox label="Gjerësia Kaces" value={kaca} onChange={setKaca} unit="CM" />
                  <InputBox label="Thellësia Kaces" value={cabinetDepth} onChange={setCabinetDepth} unit="CM" />
                  <InputBox label="Nr. Raftave" value={numShelves} onChange={setNumShelves} unit="COPE" />
                </>
              ) : (
                <>
                  <InputBox label="Gjerësia Kaces" value={kaca} onChange={setKaca} unit="CM" />
                   <InputBox label="Gjatësia Llagerit" value={llageri} onChange={setLlageri} unit="CM" />
                </>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trashësia Pllakës (mm)</label>
              <div className="flex gap-2">
                {(type === 'antaro' ? [1.8] : [1.6, 1.8, 1.9]).map((t) => (
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
                  <p><strong>Fijoka Druri:</strong> Ballorja = Kaca - {(boardThickness * 3).toFixed(1)}cm. Leseniti = (Ballorja - 1.2) x (Llageri - 1.2).</p>
                ) : type === 'antaro' ? (
                  <p><strong>Antaro:</strong> Podi = LW - 7.5cm / Llageri - 2.5cm. Shpina = LW - 8.7cm / Lartësia {ANTARO_HEIGHTS[antaroProfile]}cm.</p>
                ) : (
                  <p><strong>Roboti:</strong> Raftat llogariten duke zbritur muret anësore dhe lënë vend për lesenitin mbarapa.</p>
                )}
              </div>
            </div>
          </div>
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
                <h3 className="text-xl font-bold uppercase">{type.replace('-', ' ')}</h3>
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
