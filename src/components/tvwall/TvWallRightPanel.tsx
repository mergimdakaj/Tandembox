import React, { useState } from 'react';
import { TvWallProject, TvWallElement, TvWallMaterial, WallConfig } from '../../types/tvwall';
import { DEFAULT_TV_MODULES, TV_WALL_MATERIALS } from '../../data/tvwallMaterials';
import { VisualMaterialPicker } from './VisualMaterialPicker';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Move, 
  Sliders, 
  DoorClosed, 
  Maximize2, 
  Layers, 
  Sparkles,
  Wrench,
  CheckCircle2,
  Box,
  Compass
} from 'lucide-react';

interface Props {
  project: TvWallProject;
  selectedElementId: string | null;
  onAddElement: (module: any) => void;
  onUpdateElement: (updated: TvWallElement) => void;
  onDeleteElement: (id: string) => void;
  onSelectMaterial: (material: TvWallMaterial) => void;
  onUpdateWall?: (updatedWall: WallConfig) => void;
}

export const TvWallRightPanel: React.FC<Props> = ({
  project,
  selectedElementId,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onUpdateWall,
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'library'>('inspector');

  const selectedEl = project.elements.find(e => e.id === selectedElementId);

  // Helper calculation for hardware & board surface area
  const getElementSpecs = (el: TvWallElement) => {
    const wM = el.width / 1000;
    const hM = el.height / 1000;
    const dM = el.depth / 1000;

    // Approximate board surface area in m²
    const frontArea = wM * hM;
    const topBottomArea = 2 * (wM * dM);
    const sidesArea = 2 * (hM * dM);
    const backArea = wM * hM;
    const totalAreaM2 = Number((frontArea + topBottomArea + sidesArea + backArea).toFixed(2));

    // Hinges requirement based on height
    let recommendedHinges = 2;
    if (el.height > 1200) recommendedHinges = 3;
    if (el.height > 1800) recommendedHinges = 4;
    if (el.height > 2200) recommendedHinges = 5;

    return {
      areaM2: totalAreaM2,
      hingesCount: el.drawerCount ? el.drawerCount * 2 : recommendedHinges,
      drawerRunnersCount: el.drawerCount || 0,
      golaMeters: el.hasAluminumProfile ? Number(wM.toFixed(2)) : 0,
    };
  };

  const currentSpecs = selectedEl ? getElementSpecs(selectedEl) : null;

  return (
    <div className="w-full h-full bg-slate-950 p-4 rounded-2xl border border-indigo-900/60 shadow-xl flex flex-col justify-between space-y-4 overflow-y-auto scrollbar-thin text-white">
      
      {/* Navigation Switcher */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'inspector'
              ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Inspektori i Elementit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'library'
              ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Biblioteka e Moduleve
        </button>
      </div>

      {/* TAB 1: INSPECTOR PANEL */}
      {activeTab === 'inspector' && (
        <div className="space-y-4 flex-1 text-xs font-bold">
          {selectedEl ? (
            <div className="space-y-4">
              
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-indigo-900/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-900/80 rounded-lg text-amber-400 border border-amber-500/30">
                    {selectedEl.type === 'floating_console' && <Box className="w-4 h-4" />}
                    {selectedEl.type === 'side_cabinet' && <DoorClosed className="w-4 h-4" />}
                    {selectedEl.type === 'glass_vitrine' && <Sparkles className="w-4 h-4" />}
                    {selectedEl.type === 'tv_screen' && <Maximize2 className="w-4 h-4" />}
                    {selectedEl.type !== 'floating_console' && 
                     selectedEl.type !== 'side_cabinet' && 
                     selectedEl.type !== 'glass_vitrine' && 
                     selectedEl.type !== 'tv_screen' && <Layers className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider">
                      {selectedEl.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Lloji: <strong className="text-indigo-300 font-mono">{selectedEl.type}</strong>
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 text-[10px] font-mono font-bold">
                  ID: {selectedEl.id.slice(-6)}
                </span>
              </div>

              {/* Element Name */}
              <div>
                <label className="block text-indigo-300 mb-1 text-[11px]">Emri i Modulit:</label>
                <input 
                  type="text"
                  value={selectedEl.name}
                  onChange={(e) => onUpdateElement({ ...selectedEl, name: e.target.value })}
                  className="w-full bg-slate-900 border border-indigo-800/80 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              {/* 1. DOOR & FRONT MOUNTING OPTIONS (INSIDE VS OUTSIDE) */}
              {(selectedEl.type === 'floating_console' || selectedEl.type === 'side_cabinet' || selectedEl.type === 'glass_vitrine') && (
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                    <span className="text-[11px] font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                      🚪 Pozicionimi i Derës (Inside vs Outside Mounting)
                    </span>
                  </div>

                  {/* Placement Option: Full Overlay (Outside) vs Inset (Inside) */}
                  <div>
                    <label className="block text-[10px] text-amber-200 font-bold mb-1.5">
                      Lloji i Vendosjes së Derës në Kaçë:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, frontPlacement: 'overlay' })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex flex-col gap-1 ${
                          (selectedEl.frontPlacement || 'overlay') === 'overlay'
                            ? 'bg-amber-400 text-slate-950 border-white shadow-lg ring-2 ring-amber-300'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-400'
                        }`}
                      >
                        <span className="font-black text-[11px] flex items-center justify-between">
                          <span>🚪 Front i Jashtëm</span>
                          {(selectedEl.frontPlacement || 'overlay') === 'overlay' && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                        </span>
                        <span className="text-[9px] opacity-90 leading-tight">
                          Full Overlay: Dera mbulon kaçën plotësisht (0.2cm clearance).
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, frontPlacement: 'inset' })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex flex-col gap-1 ${
                          selectedEl.frontPlacement === 'inset'
                            ? 'bg-amber-400 text-slate-950 border-white shadow-lg ring-2 ring-amber-300'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-400'
                        }`}
                      >
                        <span className="font-black text-[11px] flex items-center justify-between">
                          <span>🖼️ Front i Brendshëm</span>
                          {selectedEl.frontPlacement === 'inset' && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                        </span>
                        <span className="text-[9px] opacity-90 leading-tight">
                          Inset Door: Dera futet brenda kuadrit (Shihet korniza e kaçës).
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Hardware & Handle Style Selection */}
                  <div>
                    <label className="block text-[10px] text-amber-200 font-bold mb-1">
                      Stili i Dorëzës / Mekanizmit të Hapjes:
                    </label>
                    <select
                      value={selectedEl.handleStyle || (selectedEl.hasAluminumProfile ? 'gola' : 'bar_gold')}
                      onChange={(e) => onUpdateElement({ ...selectedEl, handleStyle: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                    >
                      <option value="bar_gold">✨ Dorëz Bar Metalike Ari (Luxury Gold Bar)</option>
                      <option value="bar_black">🖤 Dorëz Bar Anodizuar E Zezë (Black Matte Bar)</option>
                      <option value="knob_gold">🔘 Pikëz / Button Ari (Gold Knob Handle)</option>
                      <option value="knob_black">⚫ Pikëz / Button E Zezë (Black Knob Handle)</option>
                      <option value="gola">⚡ Profil Alumini Gola (Integrated Gola Channel)</option>
                      <option value="push_open">👆 Push-To-Open (Shtypje pa Dorëz)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 2. CABINET DIMENSIONS & FAST STEPPER BUTTONS */}
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                    📐 Përmasat e Modulit (MM)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedEl.width}x{selectedEl.height}x{selectedEl.depth} mm
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Width Input */}
                  <div>
                    <label className="block text-slate-300 mb-1 text-[10px]">Gjerësia (W):</label>
                    <input 
                      type="number"
                      value={selectedEl.width}
                      onChange={(e) => onUpdateElement({ ...selectedEl, width: Number(e.target.value) || 100 })}
                      className="w-full bg-slate-950 border border-amber-500/80 rounded-xl px-2 py-1.5 text-amber-300 font-mono font-black text-center text-xs"
                    />
                    <div className="flex gap-1 mt-1 justify-center">
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, width: Math.max(100, selectedEl.width - 50) })}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, width: selectedEl.width + 50 })}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold"
                      >
                        +50
                      </button>
                    </div>
                  </div>

                  {/* Height Input */}
                  <div>
                    <label className="block text-slate-300 mb-1 text-[10px]">Lartësia (H):</label>
                    <input 
                      type="number"
                      value={selectedEl.height}
                      onChange={(e) => onUpdateElement({ ...selectedEl, height: Number(e.target.value) || 100 })}
                      className="w-full bg-slate-950 border border-amber-500/80 rounded-xl px-2 py-1.5 text-amber-300 font-mono font-black text-center text-xs"
                    />
                    <div className="flex gap-1 mt-1 justify-center">
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, height: Math.max(100, selectedEl.height - 50) })}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, height: selectedEl.height + 50 })}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold"
                      >
                        +50
                      </button>
                    </div>
                  </div>

                  {/* Depth Input */}
                  <div>
                    <label className="block text-slate-300 mb-1 text-[10px]">Thellësia (D):</label>
                    <input 
                      type="number"
                      value={selectedEl.depth}
                      onChange={(e) => onUpdateElement({ ...selectedEl, depth: Number(e.target.value) || 20 })}
                      className="w-full bg-slate-950 border border-amber-500/80 rounded-xl px-2 py-1.5 text-amber-300 font-mono font-black text-center text-xs"
                    />
                    <div className="flex gap-1 mt-1 justify-center">
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, depth: Math.max(20, selectedEl.depth - 20) })}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold"
                      >
                        -20
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...selectedEl, depth: selectedEl.depth + 20 })}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold"
                      >
                        +20
                      </button>
                    </div>
                  </div>
                </div>

                {/* Position Coordinates (X & Y in mm) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-indigo-300 mb-0.5 text-[10px]">Pozicioni X (mm):</label>
                    <input 
                      type="number"
                      value={selectedEl.x}
                      onChange={(e) => onUpdateElement({ ...selectedEl, x: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-2 py-1 text-amber-300 font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-indigo-300 mb-0.5 text-[10px]">Lartësia Tokë Y (mm):</label>
                    <input 
                      type="number"
                      value={selectedEl.y}
                      onChange={(e) => onUpdateElement({ ...selectedEl, y: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-2 py-1 text-indigo-300 font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. DRAWERS & SHELVES SPECIFIC SETTINGS */}
              {selectedEl.type === 'floating_console' && (
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-indigo-800/60 space-y-2">
                  <label className="block text-indigo-300 mb-1 text-[11px]">Numri i Fiokave (Tandembox / Drawers):</label>
                  <select
                    value={selectedEl.drawerCount || 3}
                    onChange={(e) => onUpdateElement({ ...selectedEl, drawerCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-white font-bold text-xs cursor-pointer"
                  >
                    <option value={1}>1 Fiokë e gjerë</option>
                    <option value={2}>2 Fioka Premium</option>
                    <option value={3}>3 Fioka Tandembox</option>
                    <option value={4}>4 Fioka Këndi</option>
                  </select>
                </div>
              )}

              {(selectedEl.type === 'glass_vitrine' || selectedEl.type === 'side_cabinet') && (
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-indigo-800/60 space-y-2">
                  <label className="block text-indigo-300 mb-1 text-[11px]">Numri i Raftave (Shelves Count):</label>
                  <select
                    value={selectedEl.shelfCount || 4}
                    onChange={(e) => onUpdateElement({ ...selectedEl, shelfCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-indigo-800 rounded-xl px-3 py-2 text-white font-bold text-xs cursor-pointer"
                  >
                    <option value={2}>2 Rafta Brenda</option>
                    <option value={3}>3 Rafta Brenda</option>
                    <option value={4}>4 Rafta Standarde</option>
                    <option value={5}>5 Rafta Të Larta</option>
                  </select>
                </div>
              )}

              {/* 4. ALUMINUM PROFILE & LED GOLA (+2CM OVERHANG) */}
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-indigo-300 flex items-center gap-1.5">
                    ✨ Profil Alumini & LED Gola (+2cm)
                  </span>
                  <input 
                    type="checkbox"
                    checked={!!selectedEl.hasAluminumProfile}
                    onChange={(e) => onUpdateElement({ 
                      ...selectedEl, 
                      hasAluminumProfile: e.target.checked,
                      aluminumProfileGapMm: selectedEl.aluminumProfileGapMm || 20,
                      aluminumProfileColor: selectedEl.aluminumProfileColor || '#18181b',
                      aluminumProfilePosition: selectedEl.aluminumProfilePosition || 'top'
                    })}
                    className="w-4 h-4 accent-amber-400 cursor-pointer"
                  />
                </div>

                {selectedEl.hasAluminumProfile && (
                  <div className="space-y-2 pt-2 border-t border-indigo-900/60">
                    <div>
                      <label className="block text-[10px] text-slate-300 mb-0.5">
                        Nuanca e Aluminit (Profile Finish):
                      </label>
                      <select
                        value={selectedEl.aluminumProfileColor || '#18181b'}
                        onChange={(e) => onUpdateElement({ ...selectedEl, aluminumProfileColor: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold cursor-pointer"
                      >
                        <option value="#18181b">E Zezë Anodizuar (Black Matte)</option>
                        <option value="#cbd5e1">Argjend Saten (Silver Satin)</option>
                        <option value="#d4af37">Ar / Brass Luxury (Gold)</option>
                        <option value="#451a03">Bronz i Errët (Dark Bronze)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-300 mb-0.5">
                          Hapësira / Gap (MM):
                        </label>
                        <input 
                          type="number"
                          value={selectedEl.aluminumProfileGapMm || 20}
                          onChange={(e) => onUpdateElement({ ...selectedEl, aluminumProfileGapMm: Number(e.target.value) || 20 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold"
                          placeholder="20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-300 mb-0.5">
                          Pozicioni i Profilit:
                        </label>
                        <select
                          value={selectedEl.aluminumProfilePosition || 'top'}
                          onChange={(e) => onUpdateElement({ ...selectedEl, aluminumProfilePosition: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold cursor-pointer"
                        >
                          <option value="top">Lart (Sipër Frontit)</option>
                          <option value="bottom">Poshtë</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. PARAMETRIC SUB-PARTS MATERIAL CUSTOMIZATION */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <VisualMaterialPicker
                  label="Materiali Bazë (I përgjithshëm)"
                  selectedMaterialId={selectedEl.materialId}
                  onSelect={(id) => onUpdateElement({ ...selectedEl, materialId: id })}
                />

                <div className="p-3 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                    <span className="text-[11px] font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                      📐 Materialet e Pjesëve (Cabinet Sub-Parts)
                    </span>
                  </div>

                  {/* Tavani / Kapaku i sipërm */}
                  <VisualMaterialPicker
                    label="Tavani / Kapaku i Sipërm (Ceiling)"
                    selectedMaterialId={selectedEl.topMaterialId}
                    allowDefaultOption={true}
                    defaultOptionLabel="Përdor Materialin Bazë"
                    onSelect={(id) => onUpdateElement({ ...selectedEl, topMaterialId: id })}
                  />

                  {/* Podi / Baza */}
                  <VisualMaterialPicker
                    label="Podi / Baza e Poshtme (Floor)"
                    selectedMaterialId={selectedEl.bottomMaterialId}
                    allowDefaultOption={true}
                    defaultOptionLabel="Përdor Materialin Bazë"
                    onSelect={(id) => onUpdateElement({ ...selectedEl, bottomMaterialId: id })}
                  />

                  {/* Anësoret */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <VisualMaterialPicker
                      label="Ansorja e Majtë"
                      selectedMaterialId={selectedEl.leftMaterialId}
                      allowDefaultOption={true}
                      defaultOptionLabel="Përdor Bazë"
                      onSelect={(id) => onUpdateElement({ ...selectedEl, leftMaterialId: id })}
                    />
                    <VisualMaterialPicker
                      label="Ansorja e Djathtë"
                      selectedMaterialId={selectedEl.rightMaterialId}
                      allowDefaultOption={true}
                      defaultOptionLabel="Përdor Bazë"
                      onSelect={(id) => onUpdateElement({ ...selectedEl, rightMaterialId: id })}
                    />
                  </div>

                  {/* Shpina & Frontet */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <VisualMaterialPicker
                      label="Shpina (Backing)"
                      selectedMaterialId={selectedEl.backMaterialId}
                      allowDefaultOption={true}
                      defaultOptionLabel="Përdor Bazë"
                      onSelect={(id) => onUpdateElement({ ...selectedEl, backMaterialId: id })}
                    />
                    <VisualMaterialPicker
                      label="Portat / Fiokat (Fronti)"
                      selectedMaterialId={selectedEl.frontMaterialId}
                      allowDefaultOption={true}
                      defaultOptionLabel="Përdor Bazë"
                      onSelect={(id) => onUpdateElement({ ...selectedEl, frontMaterialId: id })}
                    />
                  </div>
                </div>
              </div>

              {/* 6. TECHNICAL & HARDWARE RECAP CALCULATOR */}
              {currentSpecs && (
                <div className="p-3 bg-indigo-950/60 rounded-2xl border border-indigo-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-indigo-200 border-b border-indigo-800/60 pb-1">
                    <span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-amber-400" /> Specifikimet Teknike (CNC/Hardware)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Sipërfaqja e Panelit:</span>
                      <strong className="text-amber-300 text-xs font-mono">{currentSpecs.areaM2} m²</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Panta / Mekanizma:</span>
                      <strong className="text-indigo-300 text-xs font-mono">{currentSpecs.hingesCount} x Soft-Close</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cloned: TvWallElement = {
                      ...selectedEl,
                      id: `el-clone-${Date.now()}`,
                      x: selectedEl.x + 100,
                      y: selectedEl.y + 100
                    };
                    onUpdateElement(cloned);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Dupliko
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteElement(selectedEl.id)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Fshije
                </button>
              </div>

            </div>
          ) : (
            /* CONTEXTUAL ROOM & WALL INSPECTOR WHEN NO ELEMENT IS SELECTED */
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-indigo-800/80 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Compass className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-300">
                      Inspektori i Dhomës & Mureve
                    </h3>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Asnjë modul i zgjedhur. Rregulloni dimensionet dhe materialet e dhomës tuaj!
                    </p>
                  </div>
                </div>

                {onUpdateWall && (
                  <div className="space-y-3">
                    {/* Wall Dimensions */}
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-300 block mb-1">
                        Përmasat e Murit Kryesor (MM):
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-0.5 text-[10px]">Gjerësia (W):</label>
                          <input 
                            type="number"
                            value={project.wall.width}
                            onChange={(e) => onUpdateWall({ ...project.wall, width: Number(e.target.value) || 3000 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5 text-[10px]">Lartësia (H):</label>
                          <input 
                            type="number"
                            value={project.wall.height}
                            onChange={(e) => onUpdateWall({ ...project.wall, height: Number(e.target.value) || 2600 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Room Wall & Floor Finish */}
                    <div className="space-y-2">
                      <VisualMaterialPicker
                        label="Sfondi / Materiali i Murit"
                        selectedMaterialId={project.wall.wallColor}
                        onSelect={(matId) => onUpdateWall({ ...project.wall, wallColor: matId })}
                      />

                      <VisualMaterialPicker
                        label="Podeja / Parketi i Dhomës"
                        selectedMaterialId={project.wall.floorMaterial}
                        onSelect={(matId) => onUpdateWall({ ...project.wall, floorMaterial: matId })}
                      />
                    </div>

                    {/* LED Strip Lighting Tone & Brightness */}
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-black text-amber-300 block uppercase">
                        💡 Drita LED e Sfondit (Ambient Strip)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-400 mb-0.5">Nuanca LED:</label>
                          <select
                            value={project.wall.ledTone}
                            onChange={(e) => onUpdateWall({ ...project.wall, ledTone: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold cursor-pointer"
                          >
                            <option value="3000K">3000K (Warm Gold)</option>
                            <option value="4000K">4000K (Natural White)</option>
                            <option value="6000K">6000K (Cool Blue)</option>
                            <option value="Off">E Ndalur (Off)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400 mb-0.5">Intensiteti ({project.wall.ledBrightness}%):</label>
                          <input 
                            type="range"
                            min={0}
                            max={100}
                            value={project.wall.ledBrightness}
                            onChange={(e) => onUpdateWall({ ...project.wall, ledBrightness: Number(e.target.value) })}
                            className="w-full accent-amber-400 cursor-pointer mt-1"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              <div className="text-center py-4 space-y-2">
                <Move className="w-6 h-6 text-slate-600 mx-auto animate-bounce" />
                <p className="text-slate-400 text-xs">
                  Klikoni mbi ndonjë modul për t'i hapur opsionet e tij specifike!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODULE LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4" /> Biblioteka e Moduleve TV Wall
            </h3>
            <p className="text-[11px] text-slate-400">
              Shtoni me një klikim modulin tuaj të dëshiruar në projektin 3D/2D!
            </p>
          </div>

          <div className="space-y-2">
            {DEFAULT_TV_MODULES.map((mod, idx) => (
              <div
                key={idx}
                onClick={() => onAddElement(mod)}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/80 hover:bg-slate-850 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl bg-slate-950 p-2 rounded-lg border border-slate-800 group-hover:scale-110 transition-transform">
                    {mod.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-white">{mod.name}</h4>
                    <p className="text-[10px] text-amber-300 font-mono font-bold mt-0.5">
                      {mod.width} x {mod.height} x {mod.depth} mm
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg shadow group-hover:bg-amber-300 cursor-pointer"
                >
                  + Shto
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
