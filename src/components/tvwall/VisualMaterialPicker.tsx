import React, { useState } from 'react';
import { TvWallMaterial } from '../../types/tvwall';
import { TV_WALL_MATERIALS } from '../../data/tvwallMaterials';
import { Check, ChevronDown, Grid, Image as ImageIcon, X } from 'lucide-react';

interface VisualMaterialPickerProps {
  label: string;
  selectedMaterialId?: string;
  onSelect: (materialId: string) => void;
  allowDefaultOption?: boolean;
  defaultOptionLabel?: string;
}

export const VisualMaterialPicker: React.FC<VisualMaterialPickerProps> = ({
  label,
  selectedMaterialId,
  onSelect,
  allowDefaultOption = false,
  defaultOptionLabel = 'Përdor Materialin Bazë',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const selectedMaterial = TV_WALL_MATERIALS.find(m => m.id === selectedMaterialId);

  const filteredMaterials = TV_WALL_MATERIALS.filter(m => {
    if (activeCategory === 'all') return true;
    return m.category === activeCategory;
  });

  // Helper for rendering realistic CSS texture patterns on swatch cards
  const getSwatchStyle = (mat?: TvWallMaterial) => {
    if (!mat) return { backgroundColor: '#334155' };
    const hex = mat.colorHex || '#d8cfbe';

    if (mat.category === 'wood_slat' || mat.category === 'mdf_egger' || mat.category === 'mdf_kronospan') {
      return {
        backgroundColor: hex,
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 8px), linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.15) 100%)`,
      };
    }
    if (mat.category === 'marble') {
      return {
        backgroundColor: hex,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%), linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.2) 100%)`,
      };
    }
    if (mat.category === 'lacquer_gloss') {
      return {
        backgroundColor: hex,
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)`,
      };
    }
    return { backgroundColor: hex };
  };

  return (
    <div className="w-full">
      <label className="block text-[11px] font-bold text-amber-200 mb-1 flex items-center justify-between">
        <span>{label}:</span>
        <span className="text-[10px] text-indigo-300 font-mono font-normal">
          {selectedMaterial ? selectedMaterial.brand : 'Fotografi/Ngjyra'}
        </span>
      </label>

      {/* Main Trigger Button showing currently selected visual photo tile */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-900 hover:bg-slate-800 border border-indigo-500/50 hover:border-amber-400 rounded-xl p-2 flex items-center justify-between gap-2.5 transition-all cursor-pointer text-left shadow-md group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Swatch thumbnail */}
          <div
            className="w-8 h-8 rounded-lg border border-white/20 shadow-inner flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform"
            style={getSwatchStyle(selectedMaterial)}
          >
            {/* Gloss shine reflection line */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
          </div>

          <div className="overflow-hidden">
            <div className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
              {selectedMaterial ? selectedMaterial.name : (allowDefaultOption ? defaultOptionLabel : 'Zgjidh Materialin...')}
            </div>
            {selectedMaterial && (
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>{selectedMaterial.pricePerM2} €/m²</span>
                <span>•</span>
                <span className="text-amber-400 uppercase text-[9px] font-bold">{selectedMaterial.category.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-400 flex-shrink-0">
          <ImageIcon className="w-4 h-4 text-amber-400/80" />
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {/* MODAL / VISUAL GALLERY DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-indigo-900/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Grid className="w-4 h-4 text-amber-400" />
                  Galeria Visuale e Fotografive të Ngjyrave: <span className="text-amber-300">{label}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klikoni mbi foton e mostrës së materialit për t'ia aplikuar dizajnit
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
              {[
                { id: 'all', label: '🖼️ Të Gjitha' },
                { id: 'mdf_egger', label: '🪵 MDF Egger' },
                { id: 'wood_slat', label: '🎋 Sllata Druri' },
                { id: 'marble', label: '🏛️ Mermer' },
                { id: 'lacquer_mat', label: '🎨 Smalto Mat' },
                { id: 'lacquer_gloss', label: '✨ Smalto Glossy' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md scale-105'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid of Visual Color Photo Cards */}
            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 scrollbar-thin">
              {allowDefaultOption && (
                <button
                  onClick={() => {
                    onSelect('');
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    !selectedMaterialId
                      ? 'bg-indigo-950/90 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-full h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 mb-2">
                    🔄 Bazë
                  </div>
                  <div className="text-xs font-black text-white">{defaultOptionLabel}</div>
                  <div className="text-[10px] text-slate-400">Përdor ngjyrën e përgjithshme</div>
                </button>
              )}

              {filteredMaterials.map((mat) => {
                const isSelected = mat.id === selectedMaterialId;
                return (
                  <button
                    key={mat.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', mat.id);
                      (window as any).__draggedTvWallMaterialId = mat.id;
                    }}
                    onClick={() => {
                      onSelect(mat.id);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/20 to-indigo-950/90 border-amber-400 text-white shadow-xl ring-2 ring-amber-400 scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 hover:border-amber-400/70 hover:bg-slate-900/90'
                    }`}
                    title={`Mund ta tërheqësh (Drag & Drop) te pamja 3D ose ta klikosh për ta zgjedhur`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-md z-10">
                        <Check className="w-3.5 h-3.5 font-black" />
                      </div>
                    )}

                    {/* Realistic Photo/Texture Canvas Preview */}
                    <div
                      className="w-full h-24 rounded-xl border border-white/20 shadow-md mb-2.5 relative overflow-hidden group-hover:scale-105 transition-transform"
                      style={getSwatchStyle(mat)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white font-bold">
                        <span className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                          {mat.brand}
                        </span>
                        <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                          {mat.pricePerM2} €/m²
                        </span>
                      </div>
                    </div>

                    {/* Title & Category Info */}
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {mat.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 capitalize">
                        {mat.category.replace('_', ' ')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Mbyll
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
