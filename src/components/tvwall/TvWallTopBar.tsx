import React, { useRef } from 'react';
import { TvWallProject } from '../../types/tvwall';
import { 
  FolderPlus, 
  Save, 
  FolderOpen, 
  RotateCcw, 
  RotateCw, 
  Camera, 
  Printer, 
  Ruler, 
  Calculator, 
  Box, 
  Map,
  ArrowLeft
} from 'lucide-react';

interface Props {
  onBack?: () => void;
  project: TvWallProject;
  onChangeProjectName: (name: string) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: (proj: TvWallProject) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  viewMode: '2D' | '3D';
  onToggleViewMode: (mode: '2D' | '3D') => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  onOpenPriceModal: () => void;
  onTakeScreenshot: () => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const TvWallTopBar: React.FC<Props> = ({
  onBack,
  project,
  onChangeProjectName,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  viewMode,
  onToggleViewMode,
  showDimensions,
  onToggleDimensions,
  onOpenPriceModal,
  onTakeScreenshot,
  showToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.wall && parsed.elements) {
          onLoadProject(parsed);
          if (showToast) showToast(`Projekt " ${parsed.name}" u hap me sukses!`, 'success');
        } else {
          if (showToast) showToast('Skedari JSON nuk është në formatin e duhur të TV Wall!', 'warning');
        }
      } catch (err) {
        if (showToast) showToast('Gabim gjatë leximit të projektit!', 'warning');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-indigo-900/80 shadow-2xl space-y-3">
      
      <div className="flex items-center justify-between flex-wrap gap-3">
        
        {/* Project Name & CAD Badge */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Kthehu në Portalin Kryesor"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Portali</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-lg border border-amber-400">
            TV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={project.name}
                onChange={(e) => onChangeProjectName(e.target.value)}
                className="bg-transparent text-white font-black text-sm sm:text-base border-b border-transparent hover:border-amber-400 focus:border-amber-400 focus:outline-none transition-all py-0.5"
                placeholder="Emri i Projektit..."
              />
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold uppercase">
                CAD Studio Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Program Profesional për Projektimin 2D / 3D të Mureve Dekorative
            </p>
          </div>
        </div>

        {/* View Switcher (2D Blueprint vs 3D Three.js Studio) */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1 shadow-inner">
          <button
            onClick={() => onToggleViewMode('2D')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === '2D'
                ? 'bg-amber-400 text-slate-950 shadow scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" /> Harta 2D CAD
          </button>
          <button
            onClick={() => onToggleViewMode('3D')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === '3D'
                ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Studio 3D (Three.js)
          </button>
        </div>

      </div>

      {/* Main Action Buttons Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold border-t border-slate-800/80 pt-2.5">
        
        {/* Left Action Cluster: New, Save, Open, Undo, Redo */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewProject}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Projekt i Ri"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" /> Projekt i Ri
          </button>

          <button
            onClick={onSaveProject}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ruaj Projektin"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" /> Ruaj
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Hap Projektin nga Kompjuteri"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> Hap
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <div className="h-5 w-px bg-slate-800 mx-1" />

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              canUndo ? 'bg-slate-900 text-slate-200 border-slate-800 hover:text-white' : 'opacity-40 cursor-not-allowed border-transparent'
            }`}
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              canRedo ? 'bg-slate-900 text-slate-200 border-slate-800 hover:text-white' : 'opacity-40 cursor-not-allowed border-transparent'
            }`}
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Action Cluster: Dimension Overlay, Price, Screenshot, Export PDF */}
        <div className="flex items-center gap-1.5">
          
          <button
            onClick={onToggleDimensions}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              showDimensions
                ? 'bg-amber-400 text-slate-950 font-black border-amber-300'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Shfaq/Fshih Matësin e Dimensioneve"
          >
            <Ruler className="w-3.5 h-3.5" /> Matësi (MM)
          </button>

          <button
            onClick={onOpenPriceModal}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl border border-emerald-400 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" /> Kalkulo Çmimin
          </button>

          <button
            onClick={onTakeScreenshot}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl border border-purple-400 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Shkarko Screenshot Foto"
          >
            <Camera className="w-3.5 h-3.5" /> Photo
          </button>

          <button
            onClick={onOpenPriceModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl border border-indigo-400 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> PDF
          </button>

        </div>

      </div>

    </div>
  );
};
