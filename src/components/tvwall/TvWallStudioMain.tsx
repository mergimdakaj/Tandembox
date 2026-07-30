import React, { useState, useEffect } from 'react';
import { TvWallProject, TvWallElement, TvWallMaterial, WallConfig } from '../../types/tvwall';
import { DEFAULT_TV_MODULES, TV_WALL_MATERIALS } from '../../data/tvwallMaterials';
import { TvWallTopBar } from './TvWallTopBar';
import { TvWallLeftPanel } from './TvWallLeftPanel';
import { TvWallRightPanel } from './TvWallRightPanel';
import { TvWallBlueprint2D } from './TvWallBlueprint2D';
import { TvWallThreeViewport } from './TvWallThreeViewport';
import { TvWallPriceModal } from './TvWallPriceModal';

interface Props {
  onBack?: () => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

const DEFAULT_PROJECT: TvWallProject = {
  id: 'proj-default-1',
  name: 'TV Wall Modern Egger & Sllata Lisi',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  wall: {
    width: 3600,
    height: 2600,
    depth: 200,
    wallColor: '#18181b',
    floorMaterial: 'oak',
    ledTone: '3000K',
    ledBrightness: 80,
    ledPricePerMeter: 15,
  },
  elements: [
    {
      id: 'el-slat-1',
      name: 'Panel Sllata Druri Lisi',
      type: 'slat_panel',
      x: 300,
      y: 0,
      z: 0,
      width: 1200,
      height: 2600,
      depth: 35,
      materialId: 'mat-slat-oak-natural'
    },
    {
      id: 'el-marble-1',
      name: 'Panel Mermer Calacatta',
      type: 'marble_panel',
      x: 1500,
      y: 0,
      z: 0,
      width: 1500,
      height: 2600,
      depth: 20,
      materialId: 'mat-marble-calacatta'
    },
    {
      id: 'el-tv-1',
      name: 'Televizor OLED 75"',
      type: 'tv_screen',
      x: 1700,
      y: 1100,
      z: 30,
      width: 1680,
      height: 960,
      depth: 60,
      tvSizeInches: 75,
      materialId: 'mat-egger-anthracite'
    },
    {
      id: 'el-console-1',
      name: 'Konsole TV e Pezulluar',
      type: 'floating_console',
      x: 800,
      y: 350,
      z: 0,
      width: 2200,
      height: 380,
      depth: 400,
      drawerCount: 3,
      materialId: 'mat-egger-sage-green'
    },
    {
      id: 'el-vitrine-1',
      name: 'Vitrinë Xhami Vertikale',
      type: 'glass_vitrine',
      x: 3000,
      y: 300,
      z: 0,
      width: 550,
      height: 2000,
      depth: 380,
      shelfCount: 4,
      materialId: 'mat-egger-anthracite'
    }
  ],
  laborCost: 180,
  hardwareCost: 120,
  customDiscountPercent: 0,
};

export const TvWallStudioMain: React.FC<Props> = ({ onBack, showToast }) => {
  const [project, setProject] = useState<TvWallProject>(() => {
    const saved = localStorage.getItem('tvwall_active_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PROJECT;
      }
    }
    return DEFAULT_PROJECT;
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-console-1');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>('mat-egger-sage-green');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState<boolean>(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<TvWallProject[]>([project]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Auto-save project to localStorage
  useEffect(() => {
    localStorage.setItem('tvwall_active_project', JSON.stringify(project));
  }, [project]);

  // Update history stack
  const updateProjectWithHistory = (newProj: TvWallProject) => {
    setProject(newProj);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newProj);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProject(history[historyIndex - 1]);
      if (showToast) showToast('↩️ U rikthye veprimi i fundit (Undo)', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProject(history[historyIndex + 1]);
      if (showToast) showToast('↪️ U ripërsërit veprimi (Redo)', 'info');
    }
  };

  // Wall Update Handler
  const handleUpdateWall = (newWall: WallConfig) => {
    updateProjectWithHistory({
      ...project,
      wall: newWall,
      updatedAt: new Date().toISOString()
    });
  };

  // Element Update Handler
  const handleUpdateElement = (updatedEl: TvWallElement) => {
    const exists = project.elements.some(e => e.id === updatedEl.id);
    let newElements: TvWallElement[];

    if (exists) {
      newElements = project.elements.map(e => e.id === updatedEl.id ? updatedEl : e);
    } else {
      newElements = [...project.elements, updatedEl];
    }

    updateProjectWithHistory({
      ...project,
      elements: newElements,
      updatedAt: new Date().toISOString()
    });
  };

  // Add Element Module from Library
  const handleAddElementFromLibrary = (mod: any) => {
    const newId = `el-${Date.now()}`;
    const newEl: TvWallElement = {
      id: newId,
      name: mod.name,
      type: mod.type,
      x: 1000,
      y: 400,
      z: 0,
      width: mod.width,
      height: mod.height,
      depth: mod.depth,
      drawerCount: mod.drawerCount,
      shelfCount: mod.shelfCount,
      tvSizeInches: mod.tvSizeInches,
      materialId: mod.materialId || selectedMaterialId || 'mat-egger-silk-white',
      topMaterialId: mod.topMaterialId,
      bottomMaterialId: mod.bottomMaterialId,
      leftMaterialId: mod.leftMaterialId,
      rightMaterialId: mod.rightMaterialId,
      backMaterialId: mod.backMaterialId,
      frontMaterialId: mod.frontMaterialId,
      hasAluminumProfile: mod.hasAluminumProfile,
      aluminumProfileColor: mod.aluminumProfileColor,
      aluminumProfileGapMm: mod.aluminumProfileGapMm,
      aluminumProfilePosition: mod.aluminumProfilePosition,
    };

    updateProjectWithHistory({
      ...project,
      elements: [...project.elements, newEl],
      updatedAt: new Date().toISOString()
    });

    setSelectedElementId(newId);
    if (showToast) showToast(`✨ U shtua "${mod.name}" në projekt!`, 'success');
  };

  // Delete Element Handler
  const handleDeleteElement = (id: string) => {
    const elName = project.elements.find(e => e.id === id)?.name;
    const newElements = project.elements.filter(e => e.id !== id);

    updateProjectWithHistory({
      ...project,
      elements: newElements,
      updatedAt: new Date().toISOString()
    });

    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
    if (showToast) showToast(`🗑️ U hoq "${elName || 'Moduli'}" nga projekti!`, 'info');
  };

  // Material Selection Handler
  const handleSelectMaterial = (mat: TvWallMaterial) => {
    setSelectedMaterialId(mat.id);

    if (selectedElementId) {
      const selectedEl = project.elements.find(e => e.id === selectedElementId);
      if (selectedEl) {
        handleUpdateElement({
          ...selectedEl,
          materialId: mat.id
        });
        if (showToast) showToast(`🎨 Materiali "${mat.name}" u vendos te "${selectedEl.name}"!`, 'success');
      }
    } else {
      if (showToast) showToast(`Zgjodhët materialin "${mat.name}". Klikoni mbi një modul për t'ia vendosur!`, 'info');
    }
  };

  // New Project Handler
  const handleNewProject = () => {
    const blankProj: TvWallProject = {
      ...DEFAULT_PROJECT,
      id: `proj-${Date.now()}`,
      name: 'TV Wall i Ri Custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [],
    };
    updateProjectWithHistory(blankProj);
    setSelectedElementId(null);
    if (showToast) showToast('✨ U krijua një projekt i ri i zbrazët!', 'success');
  };

  // Save Project File Handler
  const handleSaveProjectFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `TV_Wall_Projekti_${project.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (showToast) showToast('💾 Projekti u ruajt si skedar JSON!', 'success');
  };

  // Screenshot Capture
  const handleTakeScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `TV_Wall_Foto_${project.name.replace(/\s+/g, '_')}.png`;
      link.href = image;
      link.click();
      if (showToast) showToast('📸 Fotoja 3D u shkarkua me sukses!', 'success');
    } else {
      if (showToast) showToast('Nuk u gjet canvas-i 3D për screenshot!', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-2 sm:p-4 md:p-6 space-y-4">
      
      {/* Top Header & Actions Bar */}
      <TvWallTopBar
        onBack={onBack}
        project={project}
        onChangeProjectName={(name) => updateProjectWithHistory({ ...project, name })}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProjectFile}
        onLoadProject={(loaded) => updateProjectWithHistory(loaded)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions(!showDimensions)}
        onOpenPriceModal={() => setIsPriceModalOpen(true)}
        onTakeScreenshot={handleTakeScreenshot}
        showToast={showToast}
      />

      {/* Main Studio Viewport & Sidebars Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[580px]">
        
        {/* Left Sidebar: Materials, Textures, MDF Collections & Wall Settings */}
        <div className="lg:col-span-3 h-[580px]">
          <TvWallLeftPanel
            project={project}
            onUpdateWall={handleUpdateWall}
            selectedMaterialId={selectedMaterialId}
            onSelectMaterial={handleSelectMaterial}
            onAddElement={handleAddElementFromLibrary}
          />
        </div>

        {/* Center Canvas: 2D Blueprint or 3D Three.js Studio Viewport */}
        <div className="lg:col-span-6 h-[580px]">
          {viewMode === '3D' ? (
            <TvWallThreeViewport
              project={project}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onUpdateWall={handleUpdateWall}
              showDimensions={showDimensions}
              is3dViewActive={viewMode === '3D'}
            />
          ) : (
            <TvWallBlueprint2D
              project={project}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              showDimensions={showDimensions}
            />
          )}
        </div>

        {/* Right Sidebar: Module Library & Selected Element Inspector */}
        <div className="lg:col-span-3 h-[580px]">
          <TvWallRightPanel
            project={project}
            selectedElementId={selectedElementId}
            onAddElement={handleAddElementFromLibrary}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onSelectMaterial={handleSelectMaterial}
            onUpdateWall={handleUpdateWall}
          />
        </div>

      </div>

      {/* Price Calculator Modal */}
      {isPriceModalOpen && (
        <TvWallPriceModal
          project={project}
          onClose={() => setIsPriceModalOpen(false)}
          showToast={showToast}
        />
      )}

    </div>
  );
};
