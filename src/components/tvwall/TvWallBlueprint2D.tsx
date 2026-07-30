import React, { useState, useRef } from 'react';
import { TvWallProject, TvWallElement } from '../../types/tvwall';
import { TV_WALL_MATERIALS } from '../../data/tvwallMaterials';

interface Props {
  project: TvWallProject;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: TvWallElement) => void;
  onDeleteElement: (id: string) => void;
  showDimensions: boolean;
}

export const TvWallBlueprint2D: React.FC<Props> = ({
  project,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  showDimensions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Scale factor from mm to SVG viewport pixels
  const wallW = project.wall.width; // mm
  const wallH = project.wall.height; // mm

  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = (SVG_WIDTH * wallH) / wallW;
  const scale = SVG_WIDTH / wallW; // px per mm

  const handlePointerDown = (e: React.PointerEvent, el: TvWallElement) => {
    e.stopPropagation();
    onSelectElement(el.id);
    setIsDragging(true);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / scale;
      const mouseY = (rect.bottom - e.clientY) / scale; // inverted Y for architectural floor height

      setDragOffset({
        x: mouseX - el.x,
        y: mouseY - el.y
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedElementId || !containerRef.current) return;

    const selectedEl = project.elements.find(el => el.id === selectedElementId);
    if (!selectedEl) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (rect.bottom - e.clientY) / scale;

    // Grid snap 10mm
    const newX = Math.max(0, Math.min(wallW - selectedEl.width, Math.round((mouseX - dragOffset.x) / 10) * 10));
    const newY = Math.max(0, Math.min(wallH - selectedEl.height, Math.round((mouseY - dragOffset.y) / 10) * 10));

    onUpdateElement({
      ...selectedEl,
      x: newX,
      y: newY
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const selectedEl = project.elements.find(e => e.id === selectedElementId);

  return (
    <div className="relative w-full h-full min-h-[520px] bg-slate-950 rounded-2xl p-6 border-2 border-amber-500/80 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
      
      {/* Top Title & Info */}
      <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
            🗺️ Harta 2D CAD e Mureve & Moduleve me Dimensione në MM
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
          <span>Gjerësia (W): <strong className="text-amber-400">{wallW} mm</strong></span>
          <span>•</span>
          <span>Lartësia (H): <strong className="text-indigo-400">{wallH} mm</strong></span>
        </div>
      </div>

      {/* Interactive Blueprint SVG Surface */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl mx-auto aspect-[16/10] bg-slate-900/90 rounded-2xl border-2 border-indigo-700/80 p-2 shadow-2xl overflow-hidden cursor-crosshair bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:20px_20px]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg 
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
          className="w-full h-full overflow-visible"
        >
          {/* Wall Outer Perimeter */}
          <rect 
            x={0} 
            y={0} 
            width={SVG_WIDTH} 
            height={SVG_HEIGHT} 
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="3" 
            strokeDasharray="6,6" 
          />

          {/* Render Elements in 2D Elevation View */}
          {project.elements.map((el) => {
            const isSelected = el.id === selectedElementId;
            const mat = TV_WALL_MATERIALS.find(m => m.id === el.materialId) || TV_WALL_MATERIALS[0];

            // Invert Y coordinate for SVG elevation view (floor is Y=0 at bottom)
            const xPx = el.x * scale;
            const yPx = SVG_HEIGHT - (el.y * scale) - (el.height * scale);
            const wPx = el.width * scale;
            const hPx = el.height * scale;

            return (
              <g 
                key={el.id} 
                className="cursor-grab active:cursor-grabbing transition-opacity hover:opacity-90"
                onPointerDown={(e) => handlePointerDown(e, el)}
              >
                {/* Element Shadow Box */}
                <rect
                  x={xPx + 4}
                  y={yPx + 4}
                  width={wPx}
                  height={hPx}
                  fill="rgba(0,0,0,0.4)"
                  rx={6}
                />

                {/* Element Main Shape */}
                <rect
                  x={xPx}
                  y={yPx}
                  width={wPx}
                  height={hPx}
                  fill={mat.colorHex}
                  stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={isSelected ? 4 : 2}
                  rx={6}
                />

                {/* Slat Lines for Wood Slat panels */}
                {el.type === 'slat_panel' && (
                  <path
                    d={`M ${xPx} ${yPx} L ${xPx} ${yPx + hPx}`}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth={wPx / 15}
                  />
                )}

                {/* Drawer Cutout lines for Consoles */}
                {el.type === 'floating_console' && el.drawerCount && (
                  <g>
                    {Array.from({ length: el.drawerCount - 1 }).map((_, i) => (
                      <line
                        key={i}
                        x1={xPx + ((i + 1) * (wPx / el.drawerCount!))}
                        y1={yPx + 4}
                        x2={xPx + ((i + 1) * (wPx / el.drawerCount!))}
                        y2={yPx + hPx - 4}
                        stroke="#000000"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                      />
                    ))}
                  </g>
                )}

                {/* TV Display Label */}
                {el.type === 'tv_screen' && (
                  <rect
                    x={xPx + 4}
                    y={yPx + 4}
                    width={wPx - 8}
                    height={hPx - 8}
                    fill="#030712"
                    rx={4}
                  />
                )}

                {/* Text Label & Dimension Tag */}
                <text
                  x={xPx + wPx / 2}
                  y={yPx + hPx / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={el.type === 'tv_screen' ? '#38bdf8' : '#ffffff'}
                  fontSize={Math.max(10, Math.min(14, wPx / 12))}
                  fontWeight="900"
                  className="pointer-events-none drop-shadow-md"
                >
                  {el.name}
                </text>

                {/* Dimension Annotation Lines in 2D */}
                {showDimensions && (
                  <g className="pointer-events-none">
                    {/* Width Annotation Arrow Line */}
                    <line
                      x1={xPx}
                      y1={yPx - 8}
                      x2={xPx + wPx}
                      y2={yPx - 8}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <text
                      x={xPx + wPx / 2}
                      y={yPx - 14}
                      textAnchor="middle"
                      fill="#f59e0b"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {el.width} mm
                    </text>

                    {/* Height Annotation Arrow Line */}
                    <line
                      x1={xPx - 8}
                      y1={yPx}
                      x2={xPx - 8}
                      y2={yPx + hPx}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <text
                      x={xPx - 14}
                      y={yPx + hPx / 2}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="10"
                      fontWeight="bold"
                      transform={`rotate(-90 ${xPx - 14} ${yPx + hPx / 2})`}
                    >
                      {el.height} mm
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected Element Floating Controls Bar */}
        {selectedEl && (
          <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-amber-400/80 shadow-2xl flex items-center gap-3 text-xs z-30">
            <span className="font-black text-amber-300">Zgjedhur: {selectedEl.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const cloned: TvWallElement = {
                    ...selectedEl,
                    id: `el-clone-${Date.now()}`,
                    x: Math.min(wallW - selectedEl.width, selectedEl.x + 100),
                    y: Math.min(wallH - selectedEl.height, selectedEl.y + 100),
                  };
                  onUpdateElement(cloned);
                }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg transition-all cursor-pointer"
              >
                📋 Klonoe
              </button>
              <button
                onClick={() => onDeleteElement(selectedEl.id)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg transition-all cursor-pointer"
              >
                🗑️ Fshije
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Blueprint Footer Help Note */}
      <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <span>💡 Tërhiqeni me miun (Drag & Drop) çdo modul në mur për ta vendosur me saktësi 10mm!</span>
        <span>Sipërfaqja e Murit: <strong className="text-amber-300">{((wallW * wallH) / 1000000).toFixed(2)} m²</strong></span>
      </div>

    </div>
  );
};
