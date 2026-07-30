import React, { useState } from 'react';
import { TvWallProject, TvWallMaterial, WallConfig } from '../../types/tvwall';
import { TV_WALL_MATERIALS } from '../../data/tvwallMaterials';
import { VisualMaterialPicker } from './VisualMaterialPicker';
import { Settings, Palette, Layers, Sun, Box, Plus, Wrench } from 'lucide-react';

interface Props {
  project: TvWallProject;
  onUpdateWall: (updatedWall: WallConfig) => void;
  selectedMaterialId: string | null;
  onSelectMaterial: (material: TvWallMaterial) => void;
  onAddElement?: (mod: any) => void;
}

export const TvWallLeftPanel: React.FC<Props> = ({
  project,
  onUpdateWall,
  selectedMaterialId,
  onSelectMaterial,
  onAddElement,
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'builder' | 'wall_settings'>('materials');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Custom Cabinet Builder state
  const [cabName, setCabName] = useState<string>('Kaça 60cm Custom');
  const [cabWidth, setCabWidth] = useState<number>(600);
  const [cabHeight, setCabHeight] = useState<number>(720);
  const [cabDepth, setCabDepth] = useState<number>(400);
  const [topMatId, setTopMatId] = useState<string>('mat-slat-walnut-dark'); // Tavani Kaft / Arrë
  const [botMatId, setBotMatId] = useState<string>('mat-egger-silk-white'); // Podi Bardh
  const [sideMatId, setSideMatId] = useState<string>('mat-egger-silk-white'); // Ansoret Bardh
  const [frontMatId, setFrontMatId] = useState<string>('mat-egger-cashmere'); // Fronti Cashmere
  const [hasAluminum, setHasAluminum] = useState<boolean>(true);
  const [aluminumColor, setAluminumColor] = useState<string>('#18181b'); // Black matte
  const [aluminumGap, setAluminumGap] = useState<number>(20); // 20mm gap (+2cm)

  const filteredMaterials = TV_WALL_MATERIALS.filter(m => {
    if (categoryFilter === 'all') return true;
    return m.category === categoryFilter;
  });

  const handleApplyPreset = (presetW: number, name: string) => {
    setCabWidth(presetW);
    setCabName(name);
  };

  const handleCreateAndAddCabinet = () => {
    if (!onAddElement) return;

    const customModule = {
      name: cabName || `Kaça ${cabWidth}mm Custom`,
      type: 'side_cabinet' as const,
      width: cabWidth,
      height: cabHeight,
      depth: cabDepth,
      materialId: sideMatId || 'mat-egger-silk-white',
      topMaterialId: topMatId,
      bottomMaterialId: botMatId,
      leftMaterialId: sideMatId,
      rightMaterialId: sideMatId,
      frontMaterialId: frontMatId,
      backMaterialId: sideMatId,
      hasAluminumProfile: hasAluminum,
      aluminumProfileColor: aluminumColor,
      aluminumProfileGapMm: aluminumGap,
      aluminumProfilePosition: 'top' as const,
      icon: '🗄️'
    };

    onAddElement(customModule);
  };

  return (
    <div className="w-full h-full bg-slate-950 p-4 rounded-2xl border border-indigo-900/60 shadow-xl flex flex-col justify-between space-y-4 overflow-y-auto scrollbar-thin">
      
      {/* Top Left Navigation Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Materialet
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'builder'
              ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-300" /> Krijo Kaçë
        </button>
        <button
          onClick={() => setActiveTab('wall_settings')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'wall_settings'
              ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Muri
        </button>
      </div>

      {/* TAB 1: MATERIALS & TEXTURES LIBRARY */}
      {activeTab === 'materials' && (
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4" /> Biblioteka e Materialeve me 1-Klikim
            </h3>
            <p className="text-[11px] text-slate-400">
              Klikoni një material për t'ia vendosur modulit të zgjedhur!
            </p>
          </div>

          {/* Category Filters */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
            {[
              { id: 'all', label: 'Të Gjitha' },
              { id: 'mdf_egger', label: 'MDF Egger' },
              { id: 'wood_slat', label: 'Sllata Druri' },
              { id: 'marble', label: 'Mermer & Gur' },
              { id: 'lacquer_mat', label: 'Smalto Mat' },
              { id: 'lacquer_gloss', label: 'Smalto Glossy' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`py-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-amber-400 text-slate-950 font-black border-amber-300'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ▪ {cat.label}
              </button>
            ))}
          </div>

          {/* Material Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {filteredMaterials.map((mat) => {
              const isSelected = mat.id === selectedMaterialId;
              return (
                <div
                  key={mat.id}
                  onClick={() => onSelectMaterial(mat)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-900/80 border-amber-400 shadow-lg scale-102'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Material Color Swatch */}
                  <div 
                    className="w-8 h-8 rounded-lg border border-white/20 shadow shrink-0" 
                    style={{ backgroundColor: mat.colorHex }}
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-[11px] font-black text-white truncate">{mat.name}</h4>
                    <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-400 mt-0.5">
                      <span>{mat.brand || 'Premium'}</span>
                      <span className="text-amber-300">{mat.pricePerM2} €/m²</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CABINET VISION & SKETCHUP CUSTOM BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-4 flex-1 text-xs font-bold">
          <div>
            <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4" /> Ndërtuesi i Kaçave Parametrik
            </h3>
            <p className="text-[11px] text-slate-400">
              Krijoni kaçë me material të veçantë për tavani, podi, ansoret dhe profil alumini!
            </p>
          </div>

          {/* Quick Presets (Kaça 60, Kaça 80, Kaça 100) */}
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-amber-300 font-mono font-black uppercase block">
              ▪ Zgjidh Shpejt Përmasën:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                onClick={() => handleApplyPreset(600, 'Kaça 60cm')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  cabWidth === 600
                    ? 'bg-amber-400 text-slate-950 font-black border-amber-300'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Kaça 60cm
              </button>
              <button
                onClick={() => handleApplyPreset(800, 'Kaça 80cm')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  cabWidth === 800
                    ? 'bg-amber-400 text-slate-950 font-black border-amber-300'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Kaça 80cm
              </button>
              <button
                onClick={() => handleApplyPreset(1000, 'Kaça 100cm')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  cabWidth === 1000
                    ? 'bg-amber-400 text-slate-950 font-black border-amber-300'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Kaça 100cm
              </button>
            </div>
          </div>

          {/* Dimensions Inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-indigo-300 mb-0.5">Gjerësia (W):</label>
              <input 
                type="number"
                value={cabWidth}
                onChange={(e) => setCabWidth(Number(e.target.value) || 600)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono font-black"
              />
            </div>
            <div>
              <label className="block text-[10px] text-indigo-300 mb-0.5">Lartësia (H):</label>
              <input 
                type="number"
                value={cabHeight}
                onChange={(e) => setCabHeight(Number(e.target.value) || 720)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-indigo-300 font-mono font-black"
              />
            </div>
            <div>
              <label className="block text-[10px] text-indigo-300 mb-0.5">Thellësia (D):</label>
              <input 
                type="number"
                value={cabDepth}
                onChange={(e) => setCabDepth(Number(e.target.value) || 400)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono font-black"
              />
            </div>
          </div>

          {/* Sub-Part Material Pickers */}
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-3">
            <span className="text-[10px] uppercase font-black text-amber-300 block border-b border-amber-500/20 pb-1">
              🎨 Materialet e Pjesëve të Kaçës (Fotografi / Swatches):
            </span>

            <VisualMaterialPicker
              label="Tavani (Kapaku i sipërm)"
              selectedMaterialId={topMatId}
              onSelect={(id) => setTopMatId(id)}
            />

            <VisualMaterialPicker
              label="Ansoret (Majtë & Djathtë)"
              selectedMaterialId={sideMatId}
              onSelect={(id) => setSideMatId(id)}
            />

            <VisualMaterialPicker
              label="Podi (Baza e poshtme)"
              selectedMaterialId={botMatId}
              onSelect={(id) => setBotMatId(id)}
            />

            <VisualMaterialPicker
              label="Fronti / Portat"
              selectedMaterialId={frontMatId}
              onSelect={(id) => setFrontMatId(id)}
            />
          </div>

          {/* Aluminum Gola / LED Profile */}
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase text-indigo-300 flex items-center gap-1">
                ✨ Profil Alumini Gola (+2cm)
              </span>
              <input 
                type="checkbox"
                checked={hasAluminum}
                onChange={(e) => setHasAluminum(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {hasAluminum && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-900/50">
                <div>
                  <label className="block text-[10px] text-slate-300 mb-0.5">Ngjyra Profilit:</label>
                  <select
                    value={aluminumColor}
                    onChange={(e) => setAluminumColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-[11px] text-white font-bold"
                  >
                    <option value="#18181b">Zezë Matte</option>
                    <option value="#cbd5e1">Argjend Saten</option>
                    <option value="#d4af37">Ar Luxury</option>
                    <option value="#451a03">Bronz Errët</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 mb-0.5">Hapësira (Gap):</label>
                  <input 
                    type="number"
                    value={aluminumGap}
                    onChange={(e) => setAluminumGap(Number(e.target.value) || 20)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-amber-300 font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add Cabinet Action Button */}
          <button
            onClick={handleCreateAndAddCabinet}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" /> + Vendos këtë Kaçë në Mur
          </button>
        </div>
      )}

      {/* TAB 3: WALL DIMENSIONS & LED LIGHTING */}
      {activeTab === 'wall_settings' && (
        <div className="space-y-4 flex-1 text-xs font-bold">
          
          <div>
            <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4" /> Përmasat e Murit TV
            </h3>
            <p className="text-[11px] text-slate-400">
              Vendosni dimensionet e plota të hapësirës së murit në milimetra (MM).
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-indigo-300 mb-1">Gjerësia e Murit (mm):</label>
              <input 
                type="number"
                value={project.wall.width}
                onChange={(e) => onUpdateWall({ ...project.wall, width: Number(e.target.value) || 3600 })}
                className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-black text-sm"
              />
            </div>

            <div>
              <label className="block text-indigo-300 mb-1">Lartësia e Murit (mm):</label>
              <input 
                type="number"
                value={project.wall.height}
                onChange={(e) => onUpdateWall({ ...project.wall, height: Number(e.target.value) || 2600 })}
                className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-3 py-2 text-indigo-300 font-mono font-black text-sm"
              />
            </div>

            <div>
              <label className="block text-indigo-300 mb-1">Ngjyra e Sfondit të Murit:</label>
              <div className="grid grid-cols-4 gap-2">
                {['#18181b', '#09090b', '#27272a', '#e4e4e7'].map((hex) => (
                  <button
                    key={hex}
                    onClick={() => onUpdateWall({ ...project.wall, wallColor: hex })}
                    className={`h-8 rounded-lg border-2 transition-all cursor-pointer ${
                      project.wall.wallColor === hex ? 'border-amber-400 scale-105' : 'border-slate-800'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-2">
              <Sun className="w-4 h-4" /> Ndriçimi LED i Murit (LED Profile)
            </h4>

            <div>
              <label className="block text-slate-300 mb-1.5">Nuanca e Dritës LED:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  { id: '3000K', label: 'Warm 3000K (E Ngrohtë)' },
                  { id: '4000K', label: 'Natural 4000K (Kristal)' },
                  { id: '6000K', label: 'Cool 6000K (E Ftohtë)' },
                  { id: 'Off', label: 'Fikur (Off)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onUpdateWall({ ...project.wall, ledTone: item.id as any })}
                    className={`py-2 px-2 rounded-xl border text-left font-black transition-all cursor-pointer ${
                      project.wall.ledTone === item.id
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    💡 {item.label}
                  </button>
                ))}
              </div>
            </div>

            {project.wall.ledTone !== 'Off' && (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                  <span>Intensiteti i Dritës LED:</span>
                  <span className="text-amber-300 font-mono">{project.wall.ledBrightness}%</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="100"
                  value={project.wall.ledBrightness}
                  onChange={(e) => onUpdateWall({ ...project.wall, ledBrightness: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
