import { useState, useEffect, ReactNode } from 'react';
import { Settings, Ruler, Box, ArrowRight, Info, Calculator, Download, Printer } from 'lucide-react';

// Global error handler to help debug blank page issues on GitHub Pages
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

interface Dimensions {
  ballorja: number;
  ansoret: number;
  lesenitiWidth: number;
  lesenitiDepth: number;
}

export default function App() {
  const [kaca, setKaca] = useState<number>(45);
  const [llageri, setLlageri] = useState<number>(35);
  const [results, setResults] = useState<Dimensions>({
    ballorja: 0,
    ansoret: 0,
    lesenitiWidth: 0,
    lesenitiDepth: 0,
  });

  useEffect(() => {
    setResults({
      ballorja: Number((kaca - 7.8).toFixed(1)),
      ansoret: llageri,
      lesenitiWidth: Number((kaca - 11.2).toFixed(1)),
      lesenitiDepth: Number((llageri + 1).toFixed(1)),
    });
  }, [kaca, llageri]);

  const downloadCuttingList = () => {
    const content = `
LISTA E PRERJES - TANDEMBOX
---------------------------
Kaca: ${kaca} cm
Llageri: ${llageri} cm

DIMENSIONET PËR PRERJE:
1. Ballorja (Mbrenda): ${results.ballorja} cm
2. Anësoret: ${results.ansoret} cm
3. Leseniti: ${results.lesenitiWidth} x ${results.lesenitiDepth} cm

Gjeneruar më: ${new Date().toLocaleString()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tandembox_prerja_${kaca}cm.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
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
            <h1 className="text-xl font-bold tracking-tight uppercase">Tandembox Calc</h1>
            <p className="text-[10px] font-mono opacity-60 uppercase tracking-widest">Precision Woodworking Tool v1.0</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono uppercase opacity-60">
          <span>System Ready</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 py-12">
        {/* Input Section */}
        <section className="lg:col-span-5 space-y-8 print:hidden">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 opacity-40" />
              <h2 className="font-serif italic text-sm uppercase tracking-wider opacity-60">Konfigurimi i Inputeve</h2>
            </div>
            
            {/* Kaca Input */}
            <div className="group border border-[#141414] p-6 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-300">
              <label className="block text-[11px] font-mono uppercase mb-4 tracking-widest opacity-60 group-hover:opacity-100">
                Gjerësia e Kaces (cm)
              </label>
              <div className="flex items-end gap-4">
                <input
                  type="number"
                  value={kaca}
                  onChange={(e) => setKaca(Number(e.target.value))}
                  className="text-5xl font-bold bg-transparent border-none outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xl font-mono mb-2">CM</span>
              </div>
              <div className="mt-4 h-[1px] bg-current opacity-20 w-full" />
            </div>

            {/* Llageri Input */}
            <div className="group border border-[#141414] p-6 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-300">
              <label className="block text-[11px] font-mono uppercase mb-4 tracking-widest opacity-60 group-hover:opacity-100">
                Gjatësia e Llagerit (cm)
              </label>
              <div className="flex items-end gap-4">
                <input
                  type="number"
                  value={llageri}
                  onChange={(e) => setLlageri(Number(e.target.value))}
                  className="text-5xl font-bold bg-transparent border-none outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xl font-mono mb-2">CM</span>
              </div>
              <div className="mt-4 h-[1px] bg-current opacity-20 w-full" />
            </div>
          </div>

          <div className="p-4 border border-dashed border-[#141414] opacity-60 text-[12px] leading-relaxed">
            <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Kalkulimet bazohen në standardet e Tandembox ku ballorja e brendshme është -7.8cm nga kaca, 
                dhe leseniti llogaritet me diferencë prej -11.2cm në gjerësi.
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
                onClick={handlePrint}
                className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                title="Printo Listën"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={downloadCuttingList}
                className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                title="Shkarko Listën"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cutting List Table */}
          <div className="border border-[#141414] bg-white shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] print:shadow-none">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 text-[12px] font-mono uppercase tracking-widest flex justify-between items-center">
              <span>Dimensionet për Prerje</span>
              <span className="text-[10px] opacity-60">Kaca: {kaca}cm | Llageri: {llageri}cm</span>
            </div>
            <div className="divide-y divide-[#141414]">
              <TableRow label="1. Ballorja (Mbrenda)" value={`${results.ballorja} cm`} />
              <TableRow label="2. Anësoret" value={`${results.ansoret} cm`} />
              <TableRow label="3. Leseniti (Gjerësia)" value={`${results.lesenitiWidth} cm`} />
              <TableRow label="4. Leseniti (Gjatësia)" value={`${results.lesenitiDepth} cm`} />
              <div className="p-6 bg-[#141414]/5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase opacity-40">Përmbledhje Leseniti</span>
                  <span className="text-xl font-bold font-mono">{results.lesenitiWidth} x {results.lesenitiDepth} cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Summary (Simplified) */}
          <div className="group border border-[#141414] p-8 bg-[#141414] text-[#E4E3E0] relative overflow-hidden print:hidden">
            <div className="relative z-10">
              <label className="block text-[11px] font-mono uppercase mb-6 tracking-widest opacity-60">
                Përmbledhje Vizuale (Leseniti)
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-bold tracking-tighter">{results.lesenitiWidth}</span>
                  <span className="text-2xl font-mono opacity-40">x</span>
                  <span className="text-6xl font-bold tracking-tighter">{results.lesenitiDepth}</span>
                </div>
                <span className="text-2xl font-mono opacity-60">CM</span>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-5">
              <Box className="w-64 h-64 rotate-12" />
            </div>
          </div>

          <div className="hidden print:block mt-8 text-[10px] font-mono uppercase opacity-40 text-center">
            Gjeneruar nga Tandembox Calculator - {new Date().toLocaleString()}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] p-8 mt-12 text-center print:hidden">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">
          Designed for Precision & Efficiency in Woodworking
        </p>
      </footer>
    </div>
  );
}

function TableRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between p-5 bg-white hover:bg-[#141414]/5 transition-colors">
      <span className="text-[12px] font-mono uppercase tracking-wider opacity-60">{label}</span>
      <span className="text-lg font-bold font-mono">{value}</span>
    </div>
  );
}
