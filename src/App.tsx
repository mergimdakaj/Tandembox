import { useState, useEffect, useMemo, ReactNode } from 'react';
import { Settings, Ruler, Box, Info, Calculator, Download, Printer, Layers, Maximize2, MoveRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Global error handler to help debug blank page issues
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `<strong>Error:</strong> ${message} <br/> <small>${source}:${lineno}</small>`;
    document.body.appendChild(errorDiv);
    return false;
  };
}

type DrawerType = 'standard' | 'internal';
type DrawerHeight = 'M' | 'K' | 'B' | 'C' | 'D';

interface Dimensions {
  backWidth: number;
  backHeight: number;
  bottomWidth: number;
  bottomLength: number;
  frontWidth?: number;
  frontHeight?: number;
}

const HEIGHT_MAP: Record<DrawerHeight, number> = {
  'M': 8.4,
  'K': 11.6,
  'B': 14.8,
  'C': 18.0,
  'D': 21.2
};

export default function App() {
  const [kaca, setKaca] = useState<number>(45);
  const [llageri, setLlageri] = useState<number>(45);
  const [boardThickness, setBoardThickness] = useState<number>(1.8);
  const [drawerType, setDrawerType] = useState<DrawerType>('standard');
  const [drawerHeight, setDrawerHeight] = useState<DrawerHeight>('M');

  const results = useMemo((): Dimensions => {
    // Internal Width (LW)
    const lw = kaca - (2 * boardThickness);
    
    // Bottom (Leseniti)
    const bottomWidth = Number((lw - 7.5).toFixed(1));
    const bottomLength = Number((llageri - 2.4).toFixed(1));
    
    // Back (Shpina)
    const backWidth = Number((lw - 8.7).toFixed(1));
    const backHeight = HEIGHT_MAP[drawerHeight];
    
    const dims: Dimensions = {
      backWidth,
      backHeight,
      bottomWidth,
      bottomLength,
    };

    if (drawerType === 'internal') {
      // Front (Ballina e brendshme)
      dims.frontWidth = Number((lw - 6.2).toFixed(1));
      dims.frontHeight = drawerHeight === 'M' ? 11.0 : 13.5;
    }

    return dims;
  }, [kaca, llageri, boardThickness, drawerType, drawerHeight]);

  const downloadCuttingList = () => {
    const content = `
LISTA E PRERJES - TANDEMBOX
---------------------------
Data: ${new Date().toLocaleDateString()}
Konfigurimi:
- Gjerësia e Kaces: ${kaca} cm
- Gjatësia e Llagerit: ${llageri} cm
- Trashësia e Pllakës: ${boardThickness * 10} mm
- Lloji: ${drawerType === 'standard' ? 'Standard' : 'Mbrendshëm'}
- Lartësia: ${drawerHeight}

DIMENSIONET PËR PRERJE:
1. Leseniti (Fundi): ${results.bottomWidth} x ${results.bottomLength} cm
2. Shpina (Ballorja): ${results.backWidth} x ${results.backHeight} cm
${results.frontWidth ? `3. Ballina e Brendshme: ${results.frontWidth} x ${results.frontHeight} cm` : ''}

Gjeneruar nga Tandembox Calculator
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tandembox_${kaca}cm_${drawerType}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-[#141414] p-2 rounded-sm">
            <Calculator className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">Tandembox Pro</h1>
            <p className="text-[10px] font-mono opacity-60 uppercase tracking-widest">Advanced Woodworking Tool v2.0</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono uppercase opacity-60">
          <span>System Active</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 py-12">
        {/* Input Section */}
        <section className="lg:col-span-5 space-y-6 print:hidden">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 opacity-40" />
            <h2 className="font-serif italic text-sm uppercase tracking-wider opacity-60">Parametrat e Konstruksionit</h2>
          </div>

          <div className="space-y-4">
            {/* Kaca & Llageri Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InputCard 
                label="Gjerësia e Kaces" 
                value={kaca} 
                onChange={setKaca} 
                unit="CM" 
              />
              <InputCard 
                label="Gjatësia e Llagerit" 
                value={llageri} 
                onChange={setLlageri} 
                unit="CM" 
              />
            </div>

            {/* Board Thickness */}
            <div className="border border-[#141414] p-4 bg-white">
              <label className="block text-[10px] font-mono uppercase mb-3 opacity-40">Trashësia e Pllakës (mm)</label>
              <div className="flex gap-2">
                {[1.6, 1.8, 1.9].map((t) => (
                  <button
                    key={t}
                    onClick={() => setBoardThickness(t)}
                    className={`flex-1 py-2 text-xs font-mono border border-[#141414] transition-colors ${boardThickness === t ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
                  >
                    {t * 10}mm
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Type */}
            <div className="border border-[#141414] p-4 bg-white">
              <label className="block text-[10px] font-mono uppercase mb-3 opacity-40">Lloji i Fijokës</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDrawerType('standard')}
                  className={`flex-1 py-2 text-xs font-mono border border-[#141414] transition-colors flex items-center justify-center gap-2 ${drawerType === 'standard' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
                >
                  <Box className="w-3 h-3" /> Standard
                </button>
                <button
                  onClick={() => setDrawerType('internal')}
                  className={`flex-1 py-2 text-xs font-mono border border-[#141414] transition-colors flex items-center justify-center gap-2 ${drawerType === 'internal' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
                >
                  <Layers className="w-3 h-3" /> Mbrendshëm
                </button>
              </div>
            </div>

            {/* Height Selection */}
            <div className="border border-[#141414] p-4 bg-white">
              <label className="block text-[10px] font-mono uppercase mb-3 opacity-40">Lartësia (Profile)</label>
              <div className="grid grid-cols-5 gap-2">
                {(['M', 'K', 'B', 'C', 'D'] as DrawerHeight[]).map((h) => (
                  <button
                    key={h}
                    onClick={() => setDrawerHeight(h)}
                    className={`py-2 text-xs font-mono border border-[#141414] transition-colors ${drawerHeight === h ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border border-dashed border-[#141414] opacity-60 text-[11px] leading-relaxed bg-[#141414]/5">
            <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Kalkulimet bazohen në standardet Blum Tandembox. 
                Fundi: LW - 75mm. Shpina: LW - 87mm. 
                LW (Gjerësia e brendshme) llogaritet automatikisht bazuar në trashësinë e zgjedhur të pllakës.
              </p>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2 print:hidden">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 opacity-40" />
              <h2 className="font-serif italic text-sm uppercase tracking-wider opacity-60">Lista e Prerjes (Cutting List)</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                title="Printo"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={downloadCuttingList}
                className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                title="Shkarko"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cutting List Table */}
          <motion.div 
            layout
            className="border border-[#141414] bg-white shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] print:shadow-none overflow-hidden"
          >
            <div className="bg-[#141414] text-[#E4E3E0] p-4 text-[12px] font-mono uppercase tracking-widest flex justify-between items-center">
              <span>Dimensionet për Prerje</span>
              <span className="text-[10px] opacity-60">{drawerType.toUpperCase()} | {drawerHeight} | {boardThickness * 10}MM</span>
            </div>
            <div className="divide-y divide-[#141414]">
              <ResultRow 
                label="1. Leseniti (Fundi)" 
                value={`${results.bottomWidth} x ${results.bottomLength} cm`} 
                icon={<Box className="w-4 h-4" />}
              />
              <ResultRow 
                label="2. Shpina (Ballorja)" 
                value={`${results.backWidth} x ${results.backHeight} cm`} 
                icon={<Layers className="w-4 h-4" />}
              />
              <AnimatePresence mode="wait">
                {drawerType === 'internal' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ResultRow 
                      label="3. Ballina e Brendshme" 
                      value={`${results.frontWidth} x ${results.frontHeight} cm`} 
                      icon={<Maximize2 className="w-4 h-4" />}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="p-6 bg-[#141414]/5 flex justify-between items-center">
                <div className="flex items-center gap-2 opacity-40">
                  <MoveRight className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase">Përmbledhje Fundi</span>
                </div>
                <span className="text-2xl font-bold font-mono">{results.bottomWidth} x {results.bottomLength} cm</span>
              </div>
            </div>
          </motion.div>

          {/* Visual Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            <VisualCard 
              title="Leseniti" 
              w={results.bottomWidth} 
              h={results.bottomLength} 
              color="bg-[#141414]" 
            />
            <VisualCard 
              title="Shpina" 
              w={results.backWidth} 
              h={results.backHeight} 
              color="bg-white" 
              textColor="text-[#141414]"
              border="border-[#141414]"
            />
          </div>

          <div className="hidden print:block mt-8 text-[10px] font-mono uppercase opacity-40 text-center">
            Gjeneruar nga Tandembox Pro Calculator - {new Date().toLocaleString()}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] p-8 mt-12 text-center print:hidden">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">
          Precision Engineering for Modern Cabinetry
        </p>
      </footer>
    </div>
  );
}

function InputCard({ label, value, onChange, unit }: { label: string, value: number, onChange: (v: number) => void, unit: string }) {
  return (
    <div className="group border border-[#141414] p-4 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-300">
      <label className="block text-[10px] font-mono uppercase mb-2 tracking-widest opacity-40 group-hover:opacity-100">
        {label}
      </label>
      <div className="flex items-end gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="text-3xl font-bold bg-transparent border-none outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm font-mono mb-1 opacity-40">{unit}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, icon }: { label: string, value: string, icon: ReactNode }) {
  return (
    <div className="flex justify-between items-center p-5 bg-white hover:bg-[#141414]/5 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="opacity-20 group-hover:opacity-100 transition-opacity">{icon}</div>
        <span className="text-[12px] font-mono uppercase tracking-wider opacity-60">{label}</span>
      </div>
      <span className="text-lg font-bold font-mono">{value}</span>
    </div>
  );
}

function VisualCard({ title, w, h, color, textColor = "text-[#E4E3E0]", border = "" }: { title: string, w: number, h: number, color: string, textColor?: string, border?: string }) {
  return (
    <div className={`border border-[#141414] p-6 ${color} ${textColor} ${border} relative overflow-hidden group`}>
      <div className="relative z-10">
        <label className="block text-[10px] font-mono uppercase mb-4 tracking-widest opacity-40">
          {title}
        </label>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tighter">{w}</span>
          <span className="text-xl font-mono opacity-20">x</span>
          <span className="text-4xl font-bold tracking-tighter">{h}</span>
          <span className="text-sm font-mono opacity-40 ml-2">CM</span>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <Maximize2 className="w-24 h-24" />
      </div>
    </div>
  );
}

