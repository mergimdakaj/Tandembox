import { useState, useMemo } from 'react';
import {
  Ruler,
  Download,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Zap,
  Box,
  Layers
} from 'lucide-react';

interface GlassDoorItem {
  id: string;
  name: string;
  kacaHeight: number; // in mm
  kacaWidth: number;  // in mm
  kacaDepth: number;  // in mm
  quantity: number;
  doorType: 'single' | 'double';
  numShelves: number;
  hasLed: boolean;
  // Stored cut sizes
  doorHeight: number;
  doorWidth: number;
  glassDoorHeight: number;
  glassDoorWidth: number;
  shelfWidth: number;
  shelfDepth: number;
  verticalProfileCut: number;
  doorGlassCount: number;
  verticalProfileCount: number;
  totalShelfGlassCount: number;
}

export function GlassProfileCalculator() {
  // Primary Inputs in mm
  const [kacaHeight, setKacaHeight] = useState<number>(720);
  const [kacaWidth, setKacaWidth] = useState<number>(600);
  const [kacaDepth, setKacaDepth] = useState<number>(575);
  const [quantity, setQuantity] = useState<number>(1);
  const [doorType, setDoorType] = useState<'single' | 'double'>('single');
  const [cabinetName, setCabinetName] = useState<string>('Kacë Anësore / Dera e Xhamit');

  // Glass Shelves & LED options
  const [numShelves, setNumShelves] = useState<number>(0);
  const [hasLed, setHasLed] = useState<boolean>(false);

  // Custom deductions
  const [doorGapHeight, setDoorGapHeight] = useState<number>(3); // 3mm gap for door height
  const [doorGapWidth, setDoorGapWidth] = useState<number>(3); // 3mm gap for door width
  const [profileHeightTrim, setProfileHeightTrim] = useState<number>(13); // 13mm trim for vertical profile
  const [glassHeightDeduction, setGlassHeightDeduction] = useState<number>(6); // 6mm inner deduction from vertical profile cut (704 - 6 = 698mm glass height)
  const [glassWidthDeduction, setGlassWidthDeduction] = useState<number>(103); // W - 103mm for glass

  // Copy status
  const [copied, setCopied] = useState<boolean>(false);

  // Saved list of glass doors for current project
  const [doorList, setDoorList] = useState<GlassDoorItem[]>([]);

  // Calculate dimensions
  const calculations = useMemo(() => {
    // Effective width per door if double doors (e.g. 600mm / 2 = 300mm)
    const effKacaWidth = doorType === 'double' ? kacaWidth / 2 : kacaWidth;

    // Black Aluminum Vertical Profile Cut (e.g. 2640 - 3 gap - 13 trim = 2624mm or H - doorGapHeight - profileHeightTrim)
    const verticalProfileCut = Math.max(0, kacaHeight - doorGapHeight - profileHeightTrim);

    // Outer Door Dimensions (Masat e Jashtme të Derës me Alumin)
    // Outer door height = Cabinet height minus outer door vertical gap (H - doorGapHeight)
    const doorHeight = Math.max(0, kacaHeight - doorGapHeight);
    const doorWidth = Math.max(0, effKacaWidth - doorGapWidth);

    // Door Glass Dimensions (4mm thickness)
    // Glass height automatically adjusts when vertical profile cut / trim changes (verticalProfileCut - glassHeightDeduction)
    const glassDoorHeight = Math.max(0, verticalProfileCut - glassHeightDeduction);
    const glassDoorWidth = Math.max(0, effKacaWidth - glassWidthDeduction);

    // Glass Shelf Dimensions (6mm thickness)
    // Depth: 510mm when side panel (anësore) is 575mm (55mm nut behind side panel), otherwise kacaDepth - 45mm
    const shelfDepth = Math.max(0, kacaDepth === 575 ? 510 : kacaDepth - 45);
    // Width: Width - 37mm without LED (600 - 37 = 563mm), Width - 38mm with LED (600 - 38 = 562mm)
    const shelfWidthDeduction = hasLed ? 38 : 37;
    const shelfWidth = Math.max(0, kacaWidth - shelfWidthDeduction);

    // Total Door Glass count
    const doorGlassCount = quantity * (doorType === 'double' ? 2 : 1);
    // Total Vertical Profile count
    const verticalProfileCount = quantity * (doorType === 'double' ? 4 : 2);
    // Total Glass Shelf count
    const totalShelfGlassCount = numShelves * quantity;

    return {
      effKacaWidth,
      doorHeight,
      doorWidth,
      verticalProfileCut,
      glassDoorHeight,
      glassDoorWidth,
      shelfDepth,
      shelfWidth,
      doorGlassCount,
      verticalProfileCount,
      totalShelfGlassCount,
      shelfWidthDeduction
    };
  }, [
    kacaHeight,
    kacaWidth,
    kacaDepth,
    doorType,
    quantity,
    numShelves,
    hasLed,
    doorGapHeight,
    doorGapWidth,
    profileHeightTrim,
    glassHeightDeduction,
    glassWidthDeduction
  ]);

  // Add item to saved job list
  const addToList = () => {
    const newItem: GlassDoorItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: cabinetName || `Kacë ${kacaHeight}x${kacaWidth}x${kacaDepth} mm`,
      kacaHeight,
      kacaWidth,
      kacaDepth,
      quantity,
      doorType,
      numShelves,
      hasLed,
      doorHeight: calculations.doorHeight,
      doorWidth: calculations.doorWidth,
      glassDoorHeight: calculations.glassDoorHeight,
      glassDoorWidth: calculations.glassDoorWidth,
      shelfWidth: calculations.shelfWidth,
      shelfDepth: calculations.shelfDepth,
      verticalProfileCut: calculations.verticalProfileCut,
      doorGlassCount: calculations.doorGlassCount,
      verticalProfileCount: calculations.verticalProfileCount,
      totalShelfGlassCount: calculations.totalShelfGlassCount
    };
    setDoorList(prev => [...prev, newItem]);
  };

  const removeFromList = (id: string) => {
    setDoorList(prev => prev.filter(item => item.id !== id));
  };

  // Format clean share text for WhatsApp, Viber, or Copying (Single item)
  const getShareText = () => {
    let text = `📋 *SPECIFIKIMI I PRERJES: XHAM & PROFILE ALUMINI*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📍 *Elementi:* ${cabinetName || 'Kacë / Dera e Xhamit'}\n`;
    text += `📐 *Përmasat e Kacës (Totali):* ${kacaHeight} x ${kacaWidth} x ${kacaDepth} mm\n`;
    text += `   ↳ ${(kacaHeight / 10).toFixed(1)} x ${(kacaWidth / 10).toFixed(1)} x ${(kacaDepth / 10).toFixed(1)} cm\n`;
    text += `🚪 *Lloji i Derës:* ${doorType === 'double' ? 'Dyer Çift (2x)' : 'Derë Teke (1x)'} | *Sasia:* ${quantity} Element(e)\n`;
    text += `   ↳ Gjithsej: *${calculations.doorGlassCount} copë dyer*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `1️⃣ *MASA E JASHTME E DERËS ME ALUMIN*\n`;
    text += `👉 *${calculations.doorHeight} x ${calculations.doorWidth} mm*  (${(calculations.doorHeight / 10).toFixed(1)} x ${(calculations.doorWidth / 10).toFixed(1)} cm)\n`;
    text += `   • Formula: (H-${doorGapHeight}) x (W-${doorGapWidth}) mm\n`;
    text += `   • Sasia: *${calculations.doorGlassCount} copë derë*\n\n`;

    text += `2️⃣ *PROFILET E ZEZA TË ALUMINIT (Lartësia Vertikale)*\n`;
    text += `👉 *${calculations.verticalProfileCut} mm*  (${(calculations.verticalProfileCut / 10).toFixed(1)} cm)\n`;
    text += `   • Formula: H - ${doorGapHeight} (gap) - ${profileHeightTrim} (trim)\n`;
    text += `   • Sasia: *${calculations.verticalProfileCount} copë* profile vertikale\n\n`;

    text += `3️⃣ *XHAMI I DERËS I PRERË (Trashësia: 4mm)*\n`;
    text += `👉 *${calculations.glassDoorHeight} x ${calculations.glassDoorWidth} mm*  (${(calculations.glassDoorHeight / 10).toFixed(1)} x ${(calculations.glassDoorWidth / 10).toFixed(1)} cm)\n`;
    text += `   • Trashësia e Xhamit: *4 mm*\n`;
    text += `   • Sasia: *${calculations.doorGlassCount} copë xham derës*\n\n`;

    if (numShelves > 0) {
      text += `4️⃣ *RAFTAT E XHAMIT (Trashësia: 6mm)*\n`;
      text += `👉 *${calculations.shelfWidth} x ${calculations.shelfDepth} mm*  (${(calculations.shelfWidth / 10).toFixed(1)} x ${(calculations.shelfDepth / 10).toFixed(1)} cm)\n`;
      text += `   • Trashësia e Raftit: *6 mm* (Buza të lustruara)\n`;
      text += `   • Modeli: ${hasLed ? 'Me profil LED në mes (-38mm)' : 'Pa LED (-37mm)'}\n`;
      text += `   • Sasia: *${calculations.totalShelfGlassCount} copë rafta xhami*\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏭 _MergimGroup System — ${new Date().toLocaleDateString('sq-AL')}_`;

    return text;
  };

  // Format share text for all saved items in the project list
  const getAllSavedShareText = () => {
    if (doorList.length === 0) return getShareText();

    let text = `📋 *LISTA E PLOTË E PRERJES: XHAM & PROFILE (${doorList.length} Pozicione)*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏭 *MergimGroup System* | Datë: ${new Date().toLocaleDateString('sq-AL')}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    doorList.forEach((item, idx) => {
      text += `🔹 *${idx + 1}. ${item.name}* (${item.quantity} Element(e) - ${item.doorType === 'double' ? 'Dyer Çift' : 'Derë Teke'})\n`;
      text += `   • Kaca Totale: *${item.kacaHeight} x ${item.kacaWidth} x ${item.kacaDepth} mm* (${(item.kacaHeight/10).toFixed(1)} x ${(item.kacaWidth/10).toFixed(1)} x ${(item.kacaDepth/10).toFixed(1)} cm)\n`;
      text += `   • Masa Jashtme Derës: *${item.doorHeight} x ${item.doorWidth} mm* (${(item.doorHeight/10).toFixed(1)} x ${(item.doorWidth/10).toFixed(1)} cm) [${item.doorGlassCount}x dyer]\n`;
      text += `   • Profili Vertikal (i zi): *${item.verticalProfileCut} mm* [${item.verticalProfileCount}x copë]\n`;
      text += `   • Xhami Derës (4mm): *${item.glassDoorHeight} x ${item.glassDoorWidth} mm* [${item.doorGlassCount}x copë xham 4mm]\n`;
      if (item.numShelves > 0) {
        text += `   • Raftat Xhami (6mm): *${item.shelfWidth} x ${item.shelfDepth} mm* [${item.totalShelfGlassCount}x copë rafta 6mm ${item.hasLed ? 'me LED' : 'pa LED'}]\n`;
      }
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Kujtesë Prerjeje:* Xhami i derës 4mm | Raftat 6mm buza të lustruara.`;

    return text;
  };

  // Share Actions
  const handleCopyText = (allList = false) => {
    const text = allList ? getAllSavedShareText() : getShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = (allList = false) => {
    const text = allList ? getAllSavedShareText() : getShareText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareViber = (allList = false) => {
    const text = allList ? getAllSavedShareText() : getShareText();
    const url = `viber://forward?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Download Cutting Specs TXT File
  const downloadSpecs = () => {
    let content = `======================================================\n`;
    content += `     LISTA E PRERJES PËR PROFILE DHE XHAM\n`;
    content += `               MergimGroup System\n`;
    content += `======================================================\n`;
    content += `Data: ${new Date().toLocaleDateString('sq-AL')}\n\n`;

    content += getShareText();

    if (doorList.length > 0) {
      content += `\n\n======================================================\n`;
      content += `LISTA E TË GJITHA ELEMENTEVE TË RUAJTURA (${doorList.length}):\n`;
      content += `======================================================\n`;
      doorList.forEach((item, idx) => {
        content += `${idx + 1}. ${item.name} (${item.quantity} Element(e) - ${item.doorType === 'double' ? 'Dyer Çift' : 'Derë Teke'})\n`;
        content += `   - Përmasa Kace Totale: ${item.kacaHeight} x ${item.kacaWidth} x ${item.kacaDepth} mm (${(item.kacaHeight/10).toFixed(1)} x ${(item.kacaWidth/10).toFixed(1)} x ${(item.kacaDepth/10).toFixed(1)} cm)\n`;
        content += `   - MASA E JASHTME E DERËS: ${item.doorHeight} x ${item.doorWidth} mm (${(item.doorHeight/10).toFixed(1)} x ${(item.doorWidth/10).toFixed(1)} cm) | Sasia: ${item.doorGlassCount} dyer\n`;
        content += `   - PROFILI VERTIKAL (i zi): ${item.verticalProfileCut} mm (${(item.verticalProfileCut/10).toFixed(1)} cm) | Sasia: ${item.verticalProfileCount} copë\n`;
        content += `   - XHAMI I DERËS (Trashësia: 4mm): ${item.glassDoorHeight} x ${item.glassDoorWidth} mm (${(item.glassDoorHeight/10).toFixed(1)} x ${(item.glassDoorWidth/10).toFixed(1)} cm) | Sasia: ${item.doorGlassCount} copë xham 4mm\n`;
        if (item.numShelves > 0) {
          content += `   - RAFTAT E XHAMIT (Trashësia: 6mm): ${item.shelfWidth} x ${item.shelfDepth} mm (${(item.shelfWidth/10).toFixed(1)} x ${(item.shelfDepth/10).toFixed(1)} cm) | Sasia: ${item.totalShelfGlassCount} copë rafta 6mm ${item.hasLed ? '(Me LED)' : '(Pa LED)'}\n`;
        }
        content += `\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prerja_Xhami_${kacaHeight}x${kacaWidth}x${kacaDepth}mm.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* INTERACTIVE SCREEN VIEW (HIDDEN ON PRINT) */}
      <div className="space-y-8 print:hidden">
      {/* Header Banner */}
      <div className="bg-[#111827] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistemi i Derave të Xhamit
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Profila Xhami & Rafta Xhami
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-xl font-medium">
              Llogaritësi automatik i prerjes së profilit vertikal të zi, xhamit të derës (4mm) dhe raftave të xhamit (6mm) me/pa ndriçim LED.
            </p>
          </div>

          {/* Quick Share Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95"
              title="Dërgo me WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </button>

            <button
              onClick={handleShareViber}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95"
              title="Dërgo me Viber"
            >
              <Share2 className="w-3.5 h-3.5" /> Viber
            </button>

            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'U Kopjua!' : 'Kopjo'}
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Printo
            </button>

            <button
              onClick={downloadSpecs}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" /> TXT
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-emerald-600" /> Masat e Kacës / Elementit
              </h3>
              <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                Në milimetra (mm)
              </span>
            </div>

            {/* Cabinet Name */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
                Emri i Pozicionit / Elementit
              </label>
              <input
                type="text"
                value={cabinetName}
                onChange={(e) => setCabinetName(e.target.value)}
                placeholder="P.sh. Kacë Anësore me Rafta Xhami"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Cabinet Main Dimensions: Height, Width, Depth */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Lartësia (H)
                </label>
                <div className="flex items-end gap-1">
                  <input
                    type="number"
                    value={kacaHeight}
                    onChange={(e) => setKacaHeight(Number(e.target.value))}
                    className="text-xl font-black bg-transparent outline-none w-full text-slate-900"
                  />
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5">MM</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Gjerësia (W)
                </label>
                <div className="flex items-end gap-1">
                  <input
                    type="number"
                    value={kacaWidth}
                    onChange={(e) => setKacaWidth(Number(e.target.value))}
                    className="text-xl font-black bg-transparent outline-none w-full text-slate-900"
                  />
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5">MM</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Thellësia (D)
                </label>
                <div className="flex items-end gap-1">
                  <input
                    type="number"
                    value={kacaDepth}
                    onChange={(e) => setKacaDepth(Number(e.target.value))}
                    className="text-xl font-black bg-transparent outline-none w-full text-slate-900"
                  />
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5">MM</span>
                </div>
              </div>
            </div>

            {/* Glass Shelves & LED Controls */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" /> Raftat e Xhamit (Trashësia 6mm)
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Opsionale
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">
                    Sasia e Raftave
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNumShelves(Math.max(0, numShelves - 1))}
                      className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-base"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={numShelves}
                      onChange={(e) => setNumShelves(Math.max(0, Number(e.target.value)))}
                      className="text-center font-black text-slate-900 bg-white border border-slate-200 rounded-lg py-1 w-full outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setNumShelves(numShelves + 1)}
                      className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-base"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">
                    Ndriçim LED në mes?
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasLed(!hasLed)}
                    className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      hasLed
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${hasLed ? 'fill-white' : 'text-slate-400'}`} />
                    {hasLed ? 'Me LED (-38mm)' : 'Pa LED (-37mm)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Door Type and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                  Lloji i Derës
                </label>
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setDoorType('single')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                      doorType === 'single'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tek (1x)
                  </button>
                  <button
                    onClick={() => setDoorType('double')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                      doorType === 'double'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Çift (2x)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                  Sasia e Elementëve
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-lg"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="text-center font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-1.5 w-full outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Deductions Config */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Formulat e Zbritjes (Konfigurimi):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDoorGapHeight(3);
                    setDoorGapWidth(3);
                    setProfileHeightTrim(13);
                    setGlassHeightDeduction(6);
                    setGlassWidthDeduction(103);
                  }}
                  className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors"
                  title="Kthe vlerat standarde (Gap: 3mm, Trim: 13mm, Xham: 6mm, Gjerësi: 103mm)"
                >
                  Rivendos Standardet
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9.5px] font-bold text-slate-500 block mb-1">
                    Zbritja Xham nga Profili (H):
                  </span>
                  <div className="flex items-center gap-1 font-black text-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">Profili -</span>
                    <input
                      type="number"
                      value={glassHeightDeduction}
                      onChange={(e) => setGlassHeightDeduction(Number(e.target.value))}
                      className="w-11 bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-emerald-700 outline-none focus:border-emerald-500 font-bold"
                    />
                    <span className="text-[10px]">mm</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9.5px] font-bold text-slate-500 block mb-1">
                    Zbritja Xham Derës (W):
                  </span>
                  <div className="flex items-center gap-1 font-black text-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">W -</span>
                    <input
                      type="number"
                      value={glassWidthDeduction}
                      onChange={(e) => setGlassWidthDeduction(Number(e.target.value))}
                      className="w-11 bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-emerald-700 outline-none focus:border-emerald-500 font-bold"
                    />
                    <span className="text-[10px]">mm</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9.5px] font-bold text-slate-500 block mb-1">
                    Zbritja Profilit (Trim):
                  </span>
                  <div className="flex items-center gap-1 font-black text-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">Trim -</span>
                    <input
                      type="number"
                      value={profileHeightTrim}
                      onChange={(e) => setProfileHeightTrim(Number(e.target.value))}
                      className="w-11 bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-slate-800 outline-none focus:border-slate-500 font-bold"
                    />
                    <span className="text-[10px]">mm</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9.5px] font-bold text-slate-500 block mb-1">
                    Gap Dritë Lartësi (H):
                  </span>
                  <div className="flex items-center gap-1 font-black text-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">H -</span>
                    <input
                      type="number"
                      value={doorGapHeight}
                      onChange={(e) => setDoorGapHeight(Number(e.target.value))}
                      className="w-11 bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-indigo-700 outline-none focus:border-indigo-500 font-bold"
                    />
                    <span className="text-[10px]">mm</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9.5px] font-bold text-slate-500 block mb-1">
                    Gap Dritë Gjerësi (W):
                  </span>
                  <div className="flex items-center gap-1 font-black text-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">W -</span>
                    <input
                      type="number"
                      value={doorGapWidth}
                      onChange={(e) => setDoorGapWidth(Number(e.target.value))}
                      className="w-11 bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-indigo-700 outline-none focus:border-indigo-500 font-bold"
                    />
                    <span className="text-[10px]">mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Saved Project List Button */}
            <button
              type="button"
              onClick={addToList}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-400" /> Shto Këtë Kacë Në Listë
            </button>
          </div>

          {/* Formula Rule Card */}
          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Rregullat e Prerjes të Xhamit:
            </div>
            <ul className="text-[11px] text-emerald-950 space-y-1.5 font-medium leading-relaxed pl-1">
              <li>
                • <strong>Xhami i Derës (4mm):</strong> Lartësia: <strong>Profili Vertikal ({calculations.verticalProfileCut}mm) - {glassHeightDeduction}mm</strong> = <strong className="text-emerald-700 font-bold">{calculations.glassDoorHeight} mm</strong> (kacaHeight {kacaHeight} - {doorGapHeight} - {profileHeightTrim} - {glassHeightDeduction} = {calculations.glassDoorHeight}mm) | Gjerësia: <strong>W - {glassWidthDeduction} mm</strong> ({calculations.effKacaWidth}-{glassWidthDeduction} = <strong className="text-emerald-700 font-bold">{calculations.glassDoorWidth} mm</strong>).
              </li>
              <li>
                • <strong>Raftat e Xhamit (6mm):</strong> Thellësia: {kacaDepth === 575 ? <strong>510 mm (Nuti 55mm mbas anësores 575)</strong> : <><strong>D - 45 mm</strong> ({kacaDepth}-45 = <strong className="text-emerald-700 font-bold">{calculations.shelfDepth} mm</strong>)</>} | Gjerësia: <strong>W - {calculations.shelfWidthDeduction} mm</strong> ({kacaWidth}-{calculations.shelfWidthDeduction} = <strong className="text-emerald-700 font-bold">{calculations.shelfWidth} mm</strong>).
              </li>
              <li>
                • <strong>Profilet Vertikale të Zeza:</strong> Lartësia: <strong>H - {doorGapHeight} (gap) - {profileHeightTrim} (trim) mm</strong> ({kacaHeight} - {doorGapHeight} - {profileHeightTrim} = <strong className="text-emerald-700 font-bold">{calculations.verticalProfileCut} mm</strong>).
              </li>
              <li>
                • <strong>Masa e Jashtme e Derës me Alumin:</strong> Lartësia/Gjerësia: <strong>(H - {doorGapHeight}) x (W - {doorGapWidth}) mm</strong> = <strong className="text-indigo-700 font-bold">{calculations.doorHeight} x {calculations.doorWidth} mm</strong>.
              </li>
            </ul>
          </div>
        </div>

        {/* OUTPUT RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Calculation Result Panel */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                  Rezultati Përfundimtar I Prerjes
                </p>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  Kaca {kacaHeight} x {kacaWidth} x {kacaDepth} mm
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Sasia Totale
                </span>
                <span className="text-lg font-extrabold text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                  {quantity} {quantity === 1 ? 'Element' : 'Elemente'}
                </span>
              </div>
            </div>

            {/* Results Grid Cards */}
            <div className="p-6 space-y-6">
              
              {/* 1. GLASS DOOR CUT CARD */}
              <div className="bg-[#ecfdf5] border-2 border-emerald-500/80 rounded-2xl p-5 relative shadow-sm">
                <div className="absolute top-3 right-4 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                  Trashësia: 4mm
                </div>
                <p className="text-xs font-black uppercase text-emerald-900 tracking-wider mb-2">
                  1. DIMENSIONET E XHAMIT TË PRERË (GLASS CUT SIZE)
                </p>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-emerald-200 pb-3 mb-3">
                  <div>
                    <span className="text-3xl font-black text-emerald-700">
                      {calculations.glassDoorHeight} x {calculations.glassDoorWidth} mm
                    </span>
                    <span className="text-xs text-emerald-800 font-bold ml-2">
                      ({(calculations.glassDoorHeight / 10).toFixed(1)} x {(calculations.glassDoorWidth / 10).toFixed(1)} cm)
                    </span>
                  </div>
                  <div className="text-xs font-black text-emerald-900">
                    Sasia: <span className="text-emerald-700 font-extrabold">{calculations.doorGlassCount} copë xham</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-emerald-900">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Lartësia e Xhamit:</span>
                    <strong>{calculations.glassDoorHeight} mm</strong> 
                    <span className="block text-[10px] text-emerald-800/80 font-mono mt-0.5">
                      ({kacaHeight} - {doorGapHeight}gap - {profileHeightTrim}trim - {glassHeightDeduction}xham)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Gjerësia e Xhamit:</span>
                    <strong>{calculations.glassDoorWidth} mm</strong>
                    <span className="block text-[10px] text-emerald-800/80 font-mono mt-0.5">
                      ({calculations.effKacaWidth} - {glassWidthDeduction} zbritje)
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. GLASS SHELVES CARD (IF SHELVES > 0) */}
              {numShelves > 0 && (
                <div className="bg-amber-50/80 border-2 border-amber-400/80 rounded-2xl p-5 relative shadow-sm">
                  <div className="absolute top-3 right-4 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                    Trashësia: 6mm
                  </div>
                  <p className="text-xs font-black uppercase text-amber-950 tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" /> 2. DIMENSIONET E RAFTAVE TË XHAMIT
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-amber-200 pb-3 mb-3">
                    <div>
                      <span className="text-3xl font-black text-amber-800">
                        {calculations.shelfWidth} x {calculations.shelfDepth} mm
                      </span>
                      <span className="text-xs text-amber-900 font-bold ml-2">
                        ({(calculations.shelfWidth / 10).toFixed(1)} x {(calculations.shelfDepth / 10).toFixed(1)} cm)
                      </span>
                    </div>
                    <div className="text-xs font-black text-amber-950">
                      Sasia: <span className="text-amber-800 font-extrabold">{calculations.totalShelfGlassCount} copë rafta</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-amber-950">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Gjerësia e Raftit:</span>
                      <strong>{calculations.shelfWidth} mm</strong> (Formula: {kacaWidth} - {calculations.shelfWidthDeduction} {hasLed ? 'me LED' : 'pa LED'})
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Thellësia e Raftit:</span>
                      <strong>{calculations.shelfDepth} mm</strong> (Formula: {kacaDepth === 575 ? '510 mm (Nuti 55mm)' : `${kacaDepth} - 45`})
                    </div>
                  </div>
                </div>
              )}

              {/* 3. BLACK ALUMINUM VERTICAL PROFILES CARD */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 relative border border-slate-800 shadow-md">
                <div className="absolute top-3 right-4 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-700">
                  Vetëm Lartësia
                </div>
                <p className="text-xs font-black uppercase text-emerald-400 tracking-wider mb-2">
                  {numShelves > 0 ? '3' : '2'}. PROFILET E ZEZA TË ALUMININ (ALUMINUM FRAME CUTS)
                </p>

                <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                      Profilet Vertikale të Zeza (Lartësia)
                    </p>
                    <p className="text-3xl font-black text-white">
                      {calculations.verticalProfileCut} mm
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Formula: {kacaHeight} mm - {doorGapHeight} mm (gap) - {profileHeightTrim} mm (trim)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                      Sasia e Profileve
                    </span>
                    <span className="text-xl font-extrabold text-white bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700">
                      {calculations.verticalProfileCount} copë
                    </span>
                  </div>
                </div>
              </div>

              {/* OUTER DOOR DIMENSIONS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Masa e Jashtme e Derës me Alumin
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Hapësirë dritë H-{doorGapHeight}mm & W-{doorGapWidth}mm (Formula: (H-{doorGapHeight}) x (W-{doorGapWidth}))
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-900">
                    {calculations.doorHeight} x {calculations.doorWidth} mm
                  </p>
                </div>
              </div>

              {/* VISUAL SVG DIAGRAM */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-300">
                  <span className="uppercase tracking-wider text-[10px] text-slate-400">
                    Skema e Vizualizimit Grafik
                  </span>
                  <span className="text-emerald-400 text-[10px] font-extrabold">
                    Kaca {kacaHeight} x {kacaWidth} x {kacaDepth} mm
                  </span>
                </div>

                <div className="flex justify-center items-center py-2">
                  <svg
                    className="w-full max-w-[340px] h-[240px]"
                    viewBox="0 0 340 240"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Outer Cabinet (White Frame Box) */}
                    <rect
                      x="30"
                      y="25"
                      width="280"
                      height="190"
                      rx="4"
                      fill="#1e293b"
                      stroke="#94a3b8"
                      strokeWidth="2"
                    />
                    <text
                      x="170"
                      y="18"
                      fill="#cbd5e1"
                      fontSize="10"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      Kaca: {kacaWidth} x {kacaDepth} mm
                    </text>

                    {/* Left & Right Cabinet Wall thickness */}
                    <rect x="30" y="25" width="16" height="190" fill="#334155" stroke="#475569" strokeWidth="1" />
                    <rect x="294" y="25" width="16" height="190" fill="#334155" stroke="#475569" strokeWidth="1" />

                    {/* Black Aluminum Door Frame */}
                    <rect
                      x="50"
                      y="35"
                      width="240"
                      height="170"
                      rx="2"
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />

                    {/* Glass Door Panel inside */}
                    <rect
                      x="68"
                      y="48"
                      width="204"
                      height="144"
                      rx="1"
                      fill="#0284c7"
                      fillOpacity="0.3"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    {/* Glass Shelves if enabled */}
                    {numShelves > 0 && (
                      <line
                        x1="50"
                        y1="120"
                        x2="290"
                        y2="120"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Labels on SVG */}
                    <text
                      x="170"
                      y={numShelves > 0 ? "105" : "125"}
                      fill="#38bdf8"
                      fontSize="11"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      XHAMI: {calculations.glassDoorHeight} x {calculations.glassDoorWidth} mm (4mm)
                    </text>

                    {numShelves > 0 && (
                      <text
                        x="170"
                        y="140"
                        fill="#fbbf24"
                        fontSize="10"
                        fontWeight="black"
                        textAnchor="middle"
                      >
                        RAFTI ({numShelves}x): {calculations.shelfWidth} x {calculations.shelfDepth} mm (6mm)
                      </text>
                    )}

                    {/* Vertical profile label */}
                    <text
                      x="42"
                      y="120"
                      fill="#10b981"
                      fontSize="9"
                      fontWeight="extrabold"
                      textAnchor="middle"
                      transform="rotate(-90, 42, 120)"
                    >
                      Profili Vertikal: {calculations.verticalProfileCut} mm
                    </text>
                  </svg>
                </div>
              </div>

            </div>
          </div>

          {/* SAVED ITEMS LIST TABLE */}
          {doorList.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                  Lista e Të Gjitha Elementeve Të Ruajtura ({doorList.length})
                </h3>
                <button
                  onClick={() => setDoorList([])}
                  className="text-[10px] font-bold text-rose-600 hover:underline"
                >
                  Fshij të gjitha
                </button>
              </div>

              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-2">Pozicioni</th>
                      <th className="py-2">Kaca (H x W x D)</th>
                      <th className="py-2">Xhami i Derës (4mm)</th>
                      <th className="py-2">Raftat (6mm)</th>
                      <th className="py-2">Profili Vertikal</th>
                      <th className="py-2">Masa Jashtme Derës</th>
                      <th className="py-2 text-right">Veprime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {doorList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 font-bold text-slate-900">
                          {item.name} <span className="text-slate-400">({item.quantity}x)</span>
                        </td>
                        <td className="py-3 text-slate-600">
                          {item.kacaHeight} x {item.kacaWidth} x {item.kacaDepth} mm
                        </td>
                        <td className="py-3 font-black text-emerald-700">
                          {item.glassDoorHeight} x {item.glassDoorWidth} mm
                        </td>
                        <td className="py-3 text-amber-700 font-bold">
                          {item.numShelves > 0 ? `${item.shelfWidth} x ${item.shelfDepth} mm (${item.totalShelfGlassCount}x)` : '-'}
                        </td>
                        <td className="py-3 text-slate-700">
                          {item.verticalProfileCut} mm
                        </td>
                        <td className="py-3 font-bold text-slate-900">
                          {item.doorHeight} x {item.doorWidth} mm
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => removeFromList(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Fshij"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action bar for saved project list */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-bold text-slate-500">
                  Gjithsej {doorList.length} elemente të ruajtura për prerje
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleShareWhatsApp(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Dërgo Gjithë Listën në WhatsApp
                  </button>
                  <button
                    onClick={() => handleShareViber(true)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Viber
                  </button>
                  <button
                    onClick={() => handleCopyText(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" /> Kopjo Gjithë Listën
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

      {/* PRINT-ONLY CLEAN SINGLE-PAGE A4 CUT SPECIFICATIONS */}
      <div className="hidden print:block font-sans text-black p-4 space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
              SPECIFIKIMI I PRERJES: PROFILA XHAMI & RAFTA XHAMI
            </h1>
            <p className="text-xs font-bold text-slate-600">
              MergimGroup System — Datë: {new Date().toLocaleDateString('sq-AL')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-black uppercase border border-slate-800 px-2.5 py-1 rounded">
              Dokument Prerjeje
            </span>
          </div>
        </div>

        {/* Current Cabinet Overview */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-2 bg-slate-50">
          <div className="grid grid-cols-3 gap-2 text-xs border-b border-slate-200 pb-2">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 block">Pozicioni / Elementi</span>
              <span className="font-black text-slate-900">{cabinetName}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 block">Përmasat e Kacës</span>
              <span className="font-extrabold text-slate-800">{kacaHeight} x {kacaWidth} x {kacaDepth} mm</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Lloji & Sasia</span>
              <span className="font-extrabold text-slate-800">
                {doorType === 'double' ? 'Dyer Çift (2x)' : 'Derë Teke (1x)'} | {quantity} Element(e)
              </span>
            </div>
          </div>

          <p className="text-[11px] font-black uppercase tracking-wider text-slate-900 pt-1">
            REZULTATET PËRFUNDIMTARE TË PRERJES:
          </p>

          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-black uppercase text-[10px] border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Komponenti</th>
                <th className="p-2 border-r border-slate-300">Formula / Specifikimi</th>
                <th className="p-2 border-r border-slate-300">Dimensionet (mm)</th>
                <th className="p-2 border-r border-slate-300">Dimensionet (cm)</th>
                <th className="p-2">Sasia Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-semibold text-slate-900">
              {/* 1. Profilet e zeza */}
              <tr className="bg-slate-50/50">
                <td className="p-2 border-r border-slate-300 font-black">1. PROFILET E ZEZA TË ALUMININ</td>
                <td className="p-2 border-r border-slate-300 text-slate-700">H-{doorGapHeight}-{profileHeightTrim} mm (Vertikale)</td>
                <td className="p-2 border-r border-slate-300 font-black text-slate-900 text-sm">{calculations.verticalProfileCut} mm</td>
                <td className="p-2 border-r border-slate-300 font-bold">{(calculations.verticalProfileCut / 10).toFixed(1)} cm</td>
                <td className="p-2 font-black">{calculations.verticalProfileCount} copë profile</td>
              </tr>

              {/* 2. Xhami i deres */}
              <tr>
                <td className="p-2 border-r border-slate-300 font-black">2. XHAMI I DERËS (4mm)</td>
                <td className="p-2 border-r border-slate-300 text-slate-700">Profili ({calculations.verticalProfileCut}mm)-{glassHeightDeduction} x W-{glassWidthDeduction} mm</td>
                <td className="p-2 border-r border-slate-300 font-black text-emerald-800 text-sm">{calculations.glassDoorHeight} x {calculations.glassDoorWidth} mm</td>
                <td className="p-2 border-r border-slate-300 font-bold">{(calculations.glassDoorHeight / 10).toFixed(1)} x {(calculations.glassDoorWidth / 10).toFixed(1)} cm</td>
                <td className="p-2 font-black">{calculations.doorGlassCount} copë xham</td>
              </tr>

              {/* 3. Raftat e xhamit */}
              {numShelves > 0 && (
                <tr>
                  <td className="p-2 border-r border-slate-300 font-black">3. RAFTAT E XHAMIT (6mm)</td>
                  <td className="p-2 border-r border-slate-300 text-slate-700">W-{calculations.shelfWidthDeduction} x {kacaDepth === 575 ? '510 mm (nuti 55mm)' : 'D-45 mm'} ({hasLed ? 'Me LED' : 'Pa LED'})</td>
                  <td className="p-2 border-r border-slate-300 font-black text-amber-800 text-sm">{calculations.shelfWidth} x {calculations.shelfDepth} mm</td>
                  <td className="p-2 border-r border-slate-300 font-bold">{(calculations.shelfWidth / 10).toFixed(1)} x {(calculations.shelfDepth / 10).toFixed(1)} cm</td>
                  <td className="p-2 font-black">{calculations.totalShelfGlassCount} copë rafta</td>
                </tr>
              )}

              {/* 4. Masat e jashtme te deres */}
              <tr className="text-slate-600 font-normal">
                <td className="p-2 border-r border-slate-300 text-slate-600 font-medium">4. MASA E JASHTME E DERËS ME ALUMIN</td>
                <td className="p-2 border-r border-slate-300 text-slate-500">(H-{doorGapHeight}) x (W-{doorGapWidth}) mm</td>
                <td className="p-2 border-r border-slate-300 text-slate-800 font-semibold">{calculations.doorHeight} x {calculations.doorWidth} mm</td>
                <td className="p-2 border-r border-slate-300 text-slate-600">{(calculations.doorHeight / 10).toFixed(1)} x {(calculations.doorWidth / 10).toFixed(1)} cm</td>
                <td className="p-2 text-slate-700 font-medium">{calculations.doorGlassCount} copë derë</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Saved List Table for Print if doorList.length > 0 */}
        {doorList.length > 0 && (
          <div className="border border-slate-300 rounded-lg p-3 space-y-2">
            <p className="text-xs font-black uppercase text-slate-900 tracking-wider">
              LISTA E ELEMENTEVE TË RUAJTURA ({doorList.length})
            </p>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-black uppercase text-[9px]">
                  <th className="p-1.5 border border-slate-300">#</th>
                  <th className="p-1.5 border border-slate-300">Pozicioni</th>
                  <th className="p-1.5 border border-slate-300">Kaca (mm)</th>
                  <th className="p-1.5 border border-slate-300">Profili Vertikal</th>
                  <th className="p-1.5 border border-slate-300">Xhami Derës (4mm)</th>
                  <th className="p-1.5 border border-slate-300">Raftat (6mm)</th>
                  <th className="p-1.5 border border-slate-300">Masa Jashtme Derës</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-[11px] font-bold text-slate-900">
                {doorList.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-1.5 border border-slate-300">{idx + 1}</td>
                    <td className="p-1.5 border border-slate-300 font-black">{item.name} ({item.quantity}x)</td>
                    <td className="p-1.5 border border-slate-300">{item.kacaHeight}x{item.kacaWidth}x{item.kacaDepth}</td>
                    <td className="p-1.5 border border-slate-300 font-black text-slate-900">{item.verticalProfileCut} mm ({item.verticalProfileCount}x)</td>
                    <td className="p-1.5 border border-slate-300 font-black text-emerald-900">{item.glassDoorHeight} x {item.glassDoorWidth} mm ({item.doorGlassCount}x)</td>
                    <td className="p-1.5 border border-slate-300">{item.numShelves > 0 ? `${item.shelfWidth} x ${item.shelfDepth} mm (${item.totalShelfGlassCount}x)` : '-'}</td>
                    <td className="p-1.5 border border-slate-300 font-normal text-slate-600">{item.doorHeight} x {item.doorWidth} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-300">
          <span>Prerja e Xhamit: 4mm për derën, 6mm për raftat me buza të lustruara.</span>
          <span>Nënshkrimi: ______________________</span>
        </div>
      </div>
    </>
  );
}
