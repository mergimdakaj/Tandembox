import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TvWallProject, TvWallElement, TvWallMaterial, WallConfig } from '../../types/tvwall';
import { TV_WALL_MATERIALS } from '../../data/tvwallMaterials';
import { 
  Sparkles, 
  Layers, 
  Download, 
  Compass, 
  Sun, 
  Box, 
  Cpu, 
  Wrench, 
  Image as ImageIcon,
  Paintbrush,
  Check,
  X,
  MousePointer,
  HelpCircle
} from 'lucide-react';

interface Props {
  project: TvWallProject;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement?: (updatedEl: TvWallElement) => void;
  onUpdateWall?: (updatedWall: WallConfig) => void;
  showDimensions: boolean;
  is3dViewActive: boolean;
}

export const TvWallThreeViewport: React.FC<Props> = ({
  project,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onUpdateWall,
  showDimensions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Group>>(new Map());

  // Refs for Room Wall, Floor, and LED Light for 0ms targeted updates
  const wallMeshRef = useRef<THREE.Mesh | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const ledLightRef = useRef<THREE.PointLight | null>(null);

  // Render Style modes
  type RenderStyle = 'ultra_6d' | 'photoreal' | 'sketchup' | 'cabinet_vision' | 'design_2020' | 'polyboard' | 'living_room';
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('ultra_6d');
  
  // Camera Control state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 1200, 0));
  const cameraRotationRef = useRef({ alpha: 0.1, beta: 0.2 }); // radians
  const cameraDistanceRef = useRef(3600); // mm

  // Hovered Part state for interactive Drag & Drop and Raycasting feedback
  const [hoveredElementName, setHoveredElementName] = useState<string | null>(null);
  const [hoveredPartInfo, setHoveredPartInfo] = useState<{
    elementId: string;
    partType: string;
    partLabel: string;
    elementName: string;
  } | null>(null);

  // Active Paintbrush Material state (Click-to-paint mode)
  const [activePaintbrushMatId, setActivePaintbrushMatId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isQuickPaletteOpen, setIsQuickPaletteOpen] = useState<boolean>(true);

  // Helper to find material
  const getMaterial = useCallback((matId: string): TvWallMaterial => {
    return TV_WALL_MATERIALS.find(m => m.id === matId) || TV_WALL_MATERIALS[0];
  }, []);

  // Convert mm to Three.js units (1 unit = 10mm = 1cm for smooth scale)
  const SCALE = 0.1;

  // Cache procedural textures for performance
  const textureCacheRef = useRef<Map<string, THREE.CanvasTexture>>(new Map());

  const getProceduralTexture = useCallback((mat: TvWallMaterial): THREE.CanvasTexture => {
    if (textureCacheRef.current.has(mat.id)) {
      return textureCacheRef.current.get(mat.id)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Base Color Fill
      ctx.fillStyle = mat.colorHex || '#f8fafc';
      ctx.fillRect(0, 0, 512, 512);

      if (mat.category === 'mdf_egger' || mat.category === 'mdf_kronospan' || mat.category === 'wood_slat') {
        // Organic Wood Grain Pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 2;
        for (let y = 0; y < 512; y += 5) {
          ctx.beginPath();
          ctx.moveTo(0, y + Math.sin(y * 0.04) * 5);
          ctx.bezierCurveTo(170, y + 12, 340, y - 12, 512, y + Math.sin(y * 0.03) * 6);
          ctx.stroke();
        }
        // Fine Grain Noise
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        for (let p = 0; p < 1200; p++) {
          ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 7);
        }
      } else if (mat.category === 'marble') {
        // High-end Calacatta Marble Veins
        ctx.strokeStyle = 'rgba(180, 150, 90, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.bezierCurveTo(160, 180, 320, 120, 500, 512);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(70, 70, 80, 0.3)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(350, 0);
        ctx.bezierCurveTo(220, 200, 420, 360, 80, 512);
        ctx.stroke();
      } else if (mat.category === 'lacquer_mat') {
        // Soft Matte Texture Noise
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let p = 0; p < 1500; p++) {
          ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textureCacheRef.current.set(mat.id, texture);
    return texture;
  }, []);

  // Helper to construct materials with PolygonOffset to eliminate Z-Fighting
  const createMaterialForMesh = useCallback((matId?: string) => {
    const mat = getMaterial(matId || 'mat-egger-silk-white');
    const texture = getProceduralTexture(mat);

    if (renderStyle === 'sketchup') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(mat.colorHex),
        map: texture,
        roughness: 0.85,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
    }

    if (renderStyle === 'cabinet_vision' || renderStyle === 'polyboard') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(mat.colorHex),
        map: texture,
        roughness: 0.7,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
    }

    if (renderStyle === 'ultra_6d') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(mat.colorHex),
        map: texture,
        roughness: Math.max(0.1, mat.roughness * 0.7),
        metalness: Math.min(0.9, mat.metalness * 1.3 + 0.05),
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
    }

    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(mat.colorHex),
      map: texture,
      roughness: mat.roughness,
      metalness: mat.metalness,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
  }, [getMaterial, getProceduralTexture, renderStyle]);

  // Helper to attach Edge Outlines
  const attachEdgeOutlines = useCallback((mesh: THREE.Mesh, overrideColor?: number) => {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const isCAD = renderStyle === 'sketchup' || renderStyle === 'cabinet_vision' || renderStyle === 'polyboard';
    
    let defaultColor = 0x1e293b;
    if (renderStyle === 'sketchup') defaultColor = 0x0f172a;
    if (renderStyle === 'cabinet_vision') defaultColor = 0x0369a1;
    if (renderStyle === 'polyboard') defaultColor = 0xd97706;
    
    const lineMat = new THREE.LineBasicMaterial({
      color: overrideColor ?? defaultColor,
      linewidth: overrideColor ? 3 : (isCAD ? 2 : 1),
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.renderOrder = 1;
    mesh.add(wireframe);
  }, [renderStyle]);

  // Apply Material to a specific sub-part of an element, or to room Wall/Floor
  const applyMaterialToSubPart = useCallback((elementId: string, partType: string, materialId: string) => {
    const matObj = getMaterial(materialId);
    const newMat = createMaterialForMesh(materialId);

    if (partType === 'wall') {
      if (wallMeshRef.current) {
        wallMeshRef.current.material = newMat;
      }
      if (onUpdateWall) {
        onUpdateWall({ ...project.wall, wallColor: materialId });
        setToastMessage(`🎨 Sfondi / Muri u vesh me "${matObj.name}"!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
      return;
    }

    if (partType === 'floor') {
      if (floorMeshRef.current) {
        floorMeshRef.current.material = newMat;
      }
      if (onUpdateWall) {
        onUpdateWall({ ...project.wall, floorMaterial: materialId });
        setToastMessage(`🎨 Podeja / Parketi u vesh me "${matObj.name}"!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
      return;
    }

    // Direct targeted update on Three.js scene meshes for 0ms visual feedback
    if (sceneRef.current) {
      sceneRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData) {
          if (child.userData.elementId === elementId && (child.userData.partType === partType || partType === 'main')) {
            (child as THREE.Mesh).material = newMat;
          }
        }
      });
    }

    if (!onUpdateElement) return;

    const targetEl = project.elements.find(e => e.id === elementId);
    if (!targetEl) return;

    const updatedEl = { ...targetEl };

    if (partType === 'top') updatedEl.topMaterialId = materialId;
    else if (partType === 'bottom') updatedEl.bottomMaterialId = materialId;
    else if (partType === 'left') updatedEl.leftMaterialId = materialId;
    else if (partType === 'right') updatedEl.rightMaterialId = materialId;
    else if (partType === 'front') updatedEl.frontMaterialId = materialId;
    else if (partType === 'back') updatedEl.backMaterialId = materialId;
    else updatedEl.materialId = materialId;

    onUpdateElement(updatedEl);

    const partNames: Record<string, string> = {
      top: 'Tavanin (Kapaku)',
      bottom: 'Podin (Baza)',
      left: 'Ansorjen e Majtë',
      right: 'Ansorjen e Djathtë',
      front: 'Portat / Frontin',
      back: 'Shpinën',
      main: 'Materialin Kryesor',
    };

    const label = partNames[partType] || 'Pjesën';
    setToastMessage(`🎨 Veshur me sukses "${matObj.name}" ➔ ${label} e ${targetEl.name}!`);
    setTimeout(() => setToastMessage(null), 3500);
  }, [onUpdateElement, onUpdateWall, project.elements, project.wall, getMaterial, createMaterialForMesh]);

  // Auto-Center & Fit Camera onto All Elements
  const handleResetCamera = useCallback(() => {
    const wallW = project.wall.width * SCALE;
    const wallH = project.wall.height * SCALE;

    if (project.elements.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      project.elements.forEach(el => {
        const x1 = (el.x * SCALE) - (wallW / 2);
        const x2 = x1 + (el.width * SCALE);
        const y1 = el.y * SCALE;
        const y2 = y1 + (el.height * SCALE);
        if (x1 < minX) minX = x1;
        if (x2 > maxX) maxX = x2;
        if (y1 < minY) minY = y1;
        if (y2 > maxY) maxY = y2;
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      cameraTargetRef.current.set(centerX / SCALE, centerY / SCALE, 0);
      
      const boundingW = (maxX - minX) / SCALE;
      const boundingH = (maxY - minY) / SCALE;
      const maxDim = Math.max(boundingW, boundingH, 1800);
      cameraDistanceRef.current = maxDim * 1.8;
    } else {
      cameraTargetRef.current.set(0, (project.wall.height / 2), 0);
      cameraDistanceRef.current = Math.max(project.wall.width, project.wall.height) * 1.5;
    }

    cameraRotationRef.current = { alpha: 0, beta: 0.12 };
  }, [project.elements, project.wall.width, project.wall.height, SCALE]);

  // Download High-Resolution HD Render Image for Client
  const handleDownloadRenderHD = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${project.name.replace(/\s+/g, '_')}_3D_Render.png`;
    link.href = dataUrl;
    link.click();
  };

  // Build / Re-build 3D Meshes for all cabinet elements in sceneRef
  const build3DMeshes = useCallback((targetScene?: THREE.Scene) => {
    const scene = targetScene || sceneRef.current;
    if (!scene) return;

    // Clear existing cabinet groups
    meshesMapRef.current.forEach((group) => {
      scene.remove(group);
    });
    meshesMapRef.current.clear();

    const wallW = project.wall.width * SCALE;

    project.elements.forEach((el) => {
      const isSelected = el.id === selectedElementId;
      const group = new THREE.Group();
      group.name = el.id;

      const w = el.width * SCALE;
      const h = el.height * SCALE;
      const d = el.depth * SCALE;

      // Center offset from wall bottom-left
      const posX = (el.x * SCALE) - (wallW / 2) + (w / 2);
      const posY = (el.y * SCALE) + (h / 2);
      const posZ = (el.z * SCALE) + (d / 2);

      group.position.set(posX, posY, posZ);

      // Base Material
      const meshMat = createMaterialForMesh(el.materialId);

      // Helper to check if a specific part is currently hovered in Drag & Drop / Raycast
      const isPartHovered = (partType: string) => {
        return hoveredPartInfo && hoveredPartInfo.elementId === el.id && hoveredPartInfo.partType === partType;
      };

      if (el.type === 'slat_panel') {
        // 3D Wood Slats
        const backingGeo = new THREE.BoxGeometry(w, h, d * 0.3);
        const backingMesh = new THREE.Mesh(backingGeo, new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 }));
        backingMesh.userData = { elementId: el.id, partType: 'main', partLabel: 'Paneli i Sfondit', elementName: el.name };
        backingMesh.castShadow = true;
        backingMesh.receiveShadow = true;
        attachEdgeOutlines(backingMesh, isPartHovered('main') ? 0xf59e0b : undefined);
        group.add(backingMesh);

        const slatCount = Math.floor(w / 3); // 30mm spacing
        const slatW = 1.8;
        const slatD = d * 0.7;

        for (let i = 0; i < slatCount; i++) {
          const slatGeo = new THREE.BoxGeometry(slatW, h, slatD);
          const slatMesh = new THREE.Mesh(slatGeo, meshMat);
          slatMesh.userData = { elementId: el.id, partType: 'main', partLabel: 'Sllatat e Drurit', elementName: el.name };
          const slatX = - (w / 2) + (i * 3) + (slatW / 2);
          slatMesh.position.set(slatX, 0, (slatD / 2) + (d * 0.15));
          slatMesh.castShadow = true;
          slatMesh.receiveShadow = true;
          attachEdgeOutlines(slatMesh, isPartHovered('main') ? 0xf59e0b : undefined);
          group.add(slatMesh);
        }
      } else if (el.type === 'tv_screen') {
        // TV Bezel Frame
        const tvBoxGeo = new THREE.BoxGeometry(w, h, d);
        const tvFrameMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.2, metalness: 0.8 });
        const tvFrameMesh = new THREE.Mesh(tvBoxGeo, tvFrameMat);
        tvFrameMesh.userData = { elementId: el.id, partType: 'main', partLabel: 'Korniza e TV', elementName: el.name };
        tvFrameMesh.castShadow = true;
        attachEdgeOutlines(tvFrameMesh);
        group.add(tvFrameMesh);

        // TV Display Screen
        const screenGeo = new THREE.PlaneGeometry(w * 0.96, h * 0.94);
        const screenMat = new THREE.MeshBasicMaterial({ color: renderStyle === 'living_room' ? '#1d4ed8' : '#1e1b4b' });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.userData = { elementId: el.id, partType: 'main', partLabel: 'Ekrani TV', elementName: el.name };
        screenMesh.position.set(0, 0, (d / 2) + 0.1);
        group.add(screenMesh);
      } else if (el.type === 'glass_vitrine') {
        // Translucent Glass Body
        const boxGeo = new THREE.BoxGeometry(w, h, d);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#38bdf8'),
          transparent: true,
          opacity: 0.3,
          roughness: 0.1,
          transmission: 0.85,
        });
        const glassMesh = new THREE.Mesh(boxGeo, glassMat);
        glassMesh.userData = { elementId: el.id, partType: 'main', partLabel: 'Vitrina e Xhamit', elementName: el.name };
        attachEdgeOutlines(glassMesh, isPartHovered('main') ? 0xf59e0b : undefined);
        group.add(glassMesh);

        // Glass Shelves
        const shelfCount = el.shelfCount || 3;
        for (let s = 1; s <= shelfCount; s++) {
          const shelfGeo = new THREE.BoxGeometry(w * 0.95, 0.8, d * 0.9);
          const shelfMesh = new THREE.Mesh(shelfGeo, new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1 }));
          shelfMesh.userData = { elementId: el.id, partType: 'main', partLabel: 'Rafti i Xhamit', elementName: el.name };
          shelfMesh.position.set(0, - (h / 2) + (s * (h / (shelfCount + 1))), 0);
          attachEdgeOutlines(shelfMesh);
          group.add(shelfMesh);
        }
      } else if (el.type === 'side_cabinet' || el.type === 'floating_console' || el.topMaterialId || el.leftMaterialId || el.hasAluminumProfile) {
        // Cabinet Vision & SketchUp Parametric Cabinet with Sub-Parts
        const boardT = 1.8; // 18mm standard board thickness
        const topMat = createMaterialForMesh(el.topMaterialId || el.materialId);
        const botMat = createMaterialForMesh(el.bottomMaterialId || el.materialId);
        const leftMat = createMaterialForMesh(el.leftMaterialId || el.materialId);
        const rightMat = createMaterialForMesh(el.rightMaterialId || el.materialId);
        const backMat = createMaterialForMesh(el.backMaterialId || el.materialId);
        const frontMat = createMaterialForMesh(el.frontMaterialId || el.materialId);

        // 1. Left Side Panel
        const leftGeo = new THREE.BoxGeometry(boardT, h, d);
        const leftMesh = new THREE.Mesh(leftGeo, leftMat);
        leftMesh.userData = { elementId: el.id, partType: 'left', partLabel: 'Ansorja e Majtë', elementName: el.name };
        leftMesh.position.set(- (w / 2) + (boardT / 2), 0, 0);
        leftMesh.castShadow = true;
        leftMesh.receiveShadow = true;
        attachEdgeOutlines(leftMesh, isPartHovered('left') ? 0xf59e0b : undefined);
        group.add(leftMesh);

        // 2. Right Side Panel
        const rightGeo = new THREE.BoxGeometry(boardT, h, d);
        const rightMesh = new THREE.Mesh(rightGeo, rightMat);
        rightMesh.userData = { elementId: el.id, partType: 'right', partLabel: 'Ansorja e Djathtë', elementName: el.name };
        rightMesh.position.set((w / 2) - (boardT / 2), 0, 0);
        rightMesh.castShadow = true;
        rightMesh.receiveShadow = true;
        attachEdgeOutlines(rightMesh, isPartHovered('right') ? 0xf59e0b : undefined);
        group.add(rightMesh);

        const profileGapH = el.hasAluminumProfile ? ((el.aluminumProfileGapMm || 20) * SCALE) : 0;

        // 3. Top Panel / Ceiling
        const topGeo = new THREE.BoxGeometry(w - (2 * boardT), boardT, d);
        const topMesh = new THREE.Mesh(topGeo, topMat);
        topMesh.userData = { elementId: el.id, partType: 'top', partLabel: 'Tavani (Kapaku i Sipërm)', elementName: el.name };
        topMesh.position.set(0, (h / 2) - (boardT / 2), 0);
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        attachEdgeOutlines(topMesh, isPartHovered('top') ? 0xf59e0b : undefined);
        group.add(topMesh);

        // 4. Bottom Panel / Floor
        const botGeo = new THREE.BoxGeometry(w - (2 * boardT), boardT, d);
        const botMesh = new THREE.Mesh(botGeo, botMat);
        botMesh.userData = { elementId: el.id, partType: 'bottom', partLabel: 'Podi (Baza e Poshtme)', elementName: el.name };
        botMesh.position.set(0, - (h / 2) + (boardT / 2), 0);
        botMesh.castShadow = true;
        botMesh.receiveShadow = true;
        attachEdgeOutlines(botMesh, isPartHovered('bottom') ? 0xf59e0b : undefined);
        group.add(botMesh);

        // 5. Back Panel
        const backGeo = new THREE.BoxGeometry(w - (2 * boardT), h - (2 * boardT), 0.8);
        const backMesh = new THREE.Mesh(backGeo, backMat);
        backMesh.userData = { elementId: el.id, partType: 'back', partLabel: 'Shpina', elementName: el.name };
        backMesh.position.set(0, 0, - (d / 2) + 0.4);
        backMesh.receiveShadow = true;
        attachEdgeOutlines(backMesh, isPartHovered('back') ? 0xf59e0b : undefined);
        group.add(backMesh);

        // 6. Aluminum Gola Profile
        if (el.hasAluminumProfile) {
          const profColorHex = el.aluminumProfileColor || '#18181b';
          const profMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(profColorHex),
            metalness: 0.85,
            roughness: 0.2,
          });
          
          const profY = (el.aluminumProfilePosition === 'bottom') 
            ? - (h / 2) + boardT + (profileGapH / 2)
            : (h / 2) - boardT - (profileGapH / 2);

          const profGeo = new THREE.BoxGeometry(w - (2 * boardT), profileGapH, 2.5);
          const profMesh = new THREE.Mesh(profGeo, profMat);
          profMesh.position.set(0, profY, (d / 2) - 1.25);
          attachEdgeOutlines(profMesh, 0x000000);
          group.add(profMesh);

          // LED Strip
          const ledStripGeo = new THREE.BoxGeometry(w - (2 * boardT) - 1, 0.4, 0.4);
          const ledStripMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
          const ledStripMesh = new THREE.Mesh(ledStripGeo, ledStripMat);
          ledStripMesh.position.set(0, profY, (d / 2) - 0.2);
          group.add(ledStripMesh);
        }

        // 7. Fronts / Doors / Drawers (Overlay vs Inset Door Placement)
        const isOverlay = el.frontPlacement !== 'inset'; // Default is FULL OVERLAY (Front i Jashtëm - e mbulon kaçën plotësisht sa madhësia e kaçës)!
        const handleStyle = el.handleStyle || (el.hasAluminumProfile ? 'gola' : 'bar_gold');

        const frontH = isOverlay
          ? Math.max(2, h - profileGapH - 0.2)
          : Math.max(2, h - (2 * boardT) - profileGapH - 0.4);

        const frontY = el.hasAluminumProfile && el.aluminumProfilePosition === 'top'
          ? - (profileGapH / 2)
          : (el.hasAluminumProfile && el.aluminumProfilePosition === 'bottom' ? (profileGapH / 2) : 0);

        // Z Position for Front Door:
        // Overlay: Front door sits directly IN FRONT of side panels, at z = (d / 2) + (boardT / 2)
        // Inset: Front door sits INSIDE the side panels, flush at z = (d / 2) - (boardT / 2)
        const frontZ = isOverlay ? (d / 2) + (boardT / 2) : (d / 2) - (boardT / 2);

        // Helper to render handles
        const addDoorHandle = (meshGroup: THREE.Group, hX: number, hY: number, hZ: number, itemW: number) => {
          if (handleStyle === 'gola' || handleStyle === 'push_open') return;

          const isGold = handleStyle === 'knob_gold' || handleStyle === 'bar_gold';
          const handleMat = new THREE.MeshStandardMaterial({
            color: isGold ? '#f59e0b' : '#0f172a',
            metalness: 0.9,
            roughness: 0.15,
          });

          if (handleStyle === 'knob_gold' || handleStyle === 'knob_black') {
            const knobGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
            const knobMesh = new THREE.Mesh(knobGeo, handleMat);
            knobMesh.rotation.x = Math.PI / 2;
            knobMesh.position.set(hX, hY, hZ + 0.6);
            meshGroup.add(knobMesh);
          } else {
            // Bar handle
            const barW = Math.min(12, itemW * 0.4);
            const barGeo = new THREE.BoxGeometry(barW, 0.8, 1.2);
            const barMesh = new THREE.Mesh(barGeo, handleMat);
            barMesh.position.set(hX, hY, hZ + 0.6);
            meshGroup.add(barMesh);
          }
        };

        if (el.drawerCount && el.drawerCount > 1) {
          const totalAvailableW = isOverlay ? w : (w - (2 * boardT));
          const drawerW = (totalAvailableW - (el.drawerCount - 1) * 0.3) / el.drawerCount;

          for (let dr = 0; dr < el.drawerCount; dr++) {
            const frontGeo = new THREE.BoxGeometry(drawerW, frontH, boardT);
            const frontMesh = new THREE.Mesh(frontGeo, frontMat);
            frontMesh.userData = { 
              elementId: el.id, 
              partType: 'front', 
              partLabel: `Fioka #${dr + 1} / Fronti (${isOverlay ? 'Mbivendosur' : 'Brendshëm'})`, 
              elementName: el.name 
            };

            const startX = isOverlay ? - (w / 2) : (- (w / 2) + boardT);
            const frontX = startX + (dr * (drawerW + 0.3)) + (drawerW / 2);

            frontMesh.position.set(frontX, frontY, frontZ);
            frontMesh.castShadow = true;
            attachEdgeOutlines(frontMesh, isPartHovered('front') ? 0xf59e0b : undefined);
            group.add(frontMesh);

            addDoorHandle(group, frontX, frontY, frontZ + (boardT / 2), drawerW);
          }
        } else {
          const doorW = isOverlay ? (w - 0.2) : (w - (2 * boardT) - 0.4);
          const frontGeo = new THREE.BoxGeometry(doorW, frontH, boardT);
          const frontMesh = new THREE.Mesh(frontGeo, frontMat);
          frontMesh.userData = { 
            elementId: el.id, 
            partType: 'front', 
            partLabel: `Porta / Fronti (${isOverlay ? 'Mbivendosur' : 'Brendshëm'})`, 
            elementName: el.name 
          };
          frontMesh.position.set(0, frontY, frontZ);
          frontMesh.castShadow = true;
          attachEdgeOutlines(frontMesh, isPartHovered('front') ? 0xf59e0b : undefined);
          group.add(frontMesh);

          addDoorHandle(group, 0, frontY, frontZ + (boardT / 2), doorW);
        }
      } else {
        // Default Module Box
        const boxGeo = new THREE.BoxGeometry(w, h, d);
        const boxMesh = new THREE.Mesh(boxGeo, meshMat);
        boxMesh.userData = { elementId: el.id, partType: 'main', partLabel: 'Baza e Modulit', elementName: el.name };
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        attachEdgeOutlines(boxMesh, isPartHovered('main') ? 0xf59e0b : undefined);
        group.add(boxMesh);
      }

      // Selected Highlight Wireframe
      if (isSelected) {
        const wireframeGeo = new THREE.BoxGeometry(w + 1.2, h + 1.2, d + 1.2);
        const wireframeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
        const outlineMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
        group.add(outlineMesh);
      }

      scene.add(group);
      meshesMapRef.current.set(el.id, group);
    });
  }, [
    project.elements,
    project.wall.width,
    selectedElementId,
    createMaterialForMesh,
    attachEdgeOutlines,
    renderStyle,
    SCALE
  ]);

  // Main Scene Setup Effect (Runs when container or renderStyle or wall setup changes)
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // Background according to render style
    if (renderStyle === 'sketchup') {
      scene.background = new THREE.Color('#f8fafc');
      scene.fog = new THREE.FogExp2('#f8fafc', 0.00008);
    } else if (renderStyle === 'cabinet_vision') {
      scene.background = new THREE.Color('#0f172a');
      scene.fog = new THREE.FogExp2('#0f172a', 0.00008);
    } else if (renderStyle === 'polyboard') {
      scene.background = new THREE.Color('#111827');
      scene.fog = new THREE.FogExp2('#111827', 0.00008);
    } else if (renderStyle === 'design_2020') {
      scene.background = new THREE.Color('#18181b');
      scene.fog = new THREE.FogExp2('#18181b', 0.00009);
    } else if (renderStyle === 'ultra_6d') {
      scene.background = new THREE.Color('#030712');
      scene.fog = new THREE.FogExp2('#030712', 0.00006);
    } else if (renderStyle === 'living_room') {
      scene.background = new THREE.Color('#1c1917');
      scene.fog = new THREE.FogExp2('#1c1917', 0.0001);
    } else {
      scene.background = new THREE.Color('#0b0f19');
      scene.fog = new THREE.FogExp2('#0b0f19', 0.00012);
    }
    
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 30000);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = renderStyle === 'ultra_6d' ? 1.35 : (renderStyle === 'living_room' ? 1.25 : 1.1);

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Dimensions
    const wallW = project.wall.width * SCALE;
    const wallH = project.wall.height * SCALE;

    // 4. Lights Setup
    const ambIntensity = renderStyle === 'sketchup' ? 1.3 : (renderStyle === 'ultra_6d' ? 0.9 : 0.75);
    const ambientLight = new THREE.AmbientLight(0xffffff, ambIntensity);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff8ed, renderStyle === 'sketchup' ? 1.1 : (renderStyle === 'ultra_6d' ? 2.2 : 1.6));
    mainLight.position.set(200, 450, 350);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, renderStyle === 'ultra_6d' ? 1.0 : 0.6);
    fillLight.position.set(-250, 250, 250);
    scene.add(fillLight);

    if (renderStyle === 'ultra_6d' || renderStyle === 'living_room' || renderStyle === 'design_2020') {
      const spotLight = new THREE.SpotLight(0xfde047, renderStyle === 'ultra_6d' ? 3.5 : 2.5, 4000, Math.PI / 3.5, 0.4);
      spotLight.position.set(0, 220, 250);
      spotLight.castShadow = true;
      scene.add(spotLight);

      const rimLight = new THREE.PointLight(0x38bdf8, 1.8, 2000);
      rimLight.position.set(-wallW * 0.6, wallH * 0.8, -50);
      scene.add(rimLight);
    }

    // Dynamic LED Ambient Backlight
    const ledColorHex = project.wall.ledTone === '3000K' ? 0xfbbf24 : project.wall.ledTone === '4000K' ? 0x38bdf8 : 0xe0f2fe;
    const ledIntensity = project.wall.ledTone === 'Off' ? 0 : (project.wall.ledBrightness / 100) * (renderStyle === 'ultra_6d' ? 5.5 : 4.0);
    
    const ledLight = new THREE.PointLight(ledColorHex, ledIntensity, 3500);
    ledLight.position.set(0, (project.wall.height * SCALE) / 2, 35);
    scene.add(ledLight);
    ledLightRef.current = ledLight;

    // 5. Build Environment (Room Back Wall & Parquet Floor)
    // Room Back Wall
    const wallGeo = new THREE.PlaneGeometry(wallW + 250, wallH + 120);
    const wallMat = createMaterialForMesh(project.wall.wallColor || 'mat-egger-silk-white');
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, wallH / 2, -1.0); // Placed at Z = -1.0 to avoid overlapping back panels at Z = 0
    wallMesh.userData = { elementId: 'wall', partType: 'wall', partLabel: 'Muri / Sfondi i Dhomës', elementName: 'Muri i Dhomës' };
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
    wallMeshRef.current = wallMesh;

    // Room Floor
    const floorGeo = new THREE.PlaneGeometry(wallW + 500, 3500 * SCALE);
    const floorMat = createMaterialForMesh(project.wall.floorMaterial || 'mat-egger-walnut');
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -0.2, (1750 * SCALE));
    floorMesh.userData = { elementId: 'floor', partType: 'floor', partLabel: 'Parketi / Podeja', elementName: 'Podeja' };
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    floorMeshRef.current = floorMesh;

    // Grid Floor Overlay
    const gridColor = renderStyle === 'sketchup' ? 0x94a3b8 : 0x3b82f6;
    const gridHelper = new THREE.GridHelper(wallW + 500, 24, gridColor, 0x334155);
    gridHelper.position.set(0, 0.5, (1750 * SCALE));
    scene.add(gridHelper);

    // BUILD CABINET MESHES IMMEDIATELY FOR NEW SCENE
    build3DMeshes(scene);

    // Update Camera Position
    const updateCamPos = () => {
      if (!cameraRef.current) return;
      const alpha = cameraRotationRef.current.alpha;
      const beta = cameraRotationRef.current.beta;
      const dist = cameraDistanceRef.current * SCALE;

      const x = cameraTargetRef.current.x * SCALE + dist * Math.sin(alpha) * Math.cos(beta);
      const y = cameraTargetRef.current.y * SCALE + dist * Math.sin(beta);
      const z = cameraTargetRef.current.z * SCALE + dist * Math.cos(alpha) * Math.cos(beta);

      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(
        cameraTargetRef.current.x * SCALE,
        cameraTargetRef.current.y * SCALE,
        cameraTargetRef.current.z * SCALE
      );
    };

    updateCamPos();

    // 6. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      updateCamPos();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      wallMeshRef.current = null;
      floorMeshRef.current = null;
      ledLightRef.current = null;
    };
  }, [
    project.wall.width,
    project.wall.height,
    renderStyle,
    SCALE,
    createMaterialForMesh,
    build3DMeshes
  ]);

  // Targeted Wall, Floor & LED Updates without rebuilding the WebGL scene or canvas
  useEffect(() => {
    if (wallMeshRef.current) {
      wallMeshRef.current.material = createMaterialForMesh(project.wall.wallColor || 'mat-egger-silk-white');
    }
    if (floorMeshRef.current) {
      floorMeshRef.current.material = createMaterialForMesh(project.wall.floorMaterial || 'mat-egger-walnut');
    }
    if (ledLightRef.current) {
      const ledColorHex = project.wall.ledTone === '3000K' ? 0xfbbf24 : project.wall.ledTone === '4000K' ? 0x38bdf8 : 0xe0f2fe;
      const ledIntensity = project.wall.ledTone === 'Off' ? 0 : (project.wall.ledBrightness / 100) * (renderStyle === 'ultra_6d' ? 5.5 : 4.0);
      ledLightRef.current.color.setHex(ledColorHex);
      ledLightRef.current.intensity = ledIntensity;
    }
  }, [
    project.wall.wallColor,
    project.wall.floorMaterial,
    project.wall.ledTone,
    project.wall.ledBrightness,
    createMaterialForMesh,
    renderStyle
  ]);

  // Re-build 3D Meshes whenever elements, selection, or sub-part hover changes
  useEffect(() => {
    build3DMeshes();
  }, [build3DMeshes]);

  // Mouse Orbit & Interactive Part Raycasting Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraRotationRef.current.alpha -= deltaX * 0.006;
      cameraRotationRef.current.beta = Math.max(
        -Math.PI / 4,
        Math.min(Math.PI / 2.5, cameraRotationRef.current.beta + deltaY * 0.006)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (cameraRef.current && sceneRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

        if (intersects.length > 0) {
          const hitObj = intersects[0].object;
          if (hitObj.userData && hitObj.userData.elementId) {
            setHoveredElementName(hitObj.userData.elementName || hitObj.name);
            setHoveredPartInfo({
              elementId: hitObj.userData.elementId,
              partType: hitObj.userData.partType || 'main',
              partLabel: hitObj.userData.partLabel || 'Pjesa',
              elementName: hitObj.userData.elementName || 'Kaça',
            });
            return;
          }
        }
        setHoveredElementName(null);
        setHoveredPartInfo(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;

    if (containerRef.current && cameraRef.current && sceneRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        if (hitObj.userData && hitObj.userData.elementId) {
          const elId = hitObj.userData.elementId;
          const partType = hitObj.userData.partType || 'main';

          if (activePaintbrushMatId) {
            // Paintbrush Mode: Apply active paintbrush material directly to clicked part
            applyMaterialToSubPart(elId, partType, activePaintbrushMatId);
          } else {
            // Select Element
            onSelectElement(elId);
          }
          return;
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraDistanceRef.current = Math.max(1200, Math.min(9000, cameraDistanceRef.current + e.deltaY * 3));
  };

  // Drag & Drop Handlers on 3D Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const materialId = 
      (window as any).__draggedTvWallMaterialId || 
      e.dataTransfer.getData('text/plain') || 
      activePaintbrushMatId;
    
    (window as any).__draggedTvWallMaterialId = null;

    if (!materialId || !containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      if (hitObj.userData && hitObj.userData.elementId) {
        const elId = hitObj.userData.elementId;
        const partType = hitObj.userData.partType || 'main';
        applyMaterialToSubPart(elId, partType, materialId);
      }
    }
    setHoveredPartInfo(null);
  };

  const selectedEl = project.elements.find(e => e.id === selectedElementId);
  const activePaintbrushMat = activePaintbrushMatId ? getMaterial(activePaintbrushMatId) : null;

  return (
    <div 
      className="relative w-full h-full min-h-[560px] bg-slate-950 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none border-2 border-indigo-900/60 shadow-2xl flex flex-col"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Canvas */}
      <div ref={containerRef} className="w-full h-full min-h-[560px]" />

      {/* TOP CONTROLS BAR: Render Styles & Actions */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Title Badge */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/40 shadow-xl flex items-center gap-2 text-xs font-bold text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">
            {renderStyle === 'ultra_6d' && '📸 Render Fotorealist 6D (Prezantim te Klienti)'}
            {renderStyle === 'photoreal' && '✨ 3D Studio Engine'}
            {renderStyle === 'sketchup' && '📐 SketchUp CAD Pro (Vija Solide)'}
            {renderStyle === 'cabinet_vision' && '🛠️ Cabinet Vision Prodhimi'}
            {renderStyle === 'design_2020' && '💡 2020 Design Live Light'}
            {renderStyle === 'polyboard' && '📦 PolyBoard Panel Joinery'}
            {renderStyle === 'living_room' && '🛋️ Salon Lux Atmosferë'}
          </span>
        </div>

        {/* Render Mode Switcher Bar */}
        <div className="pointer-events-auto flex items-center flex-wrap bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-indigo-500/40 shadow-xl gap-1 text-[11px] font-bold">
          <button
            onClick={() => setRenderStyle('ultra_6d')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              renderStyle === 'ultra_6d'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-lg scale-105'
                : 'text-amber-300 hover:text-amber-200 hover:bg-slate-900/60'
            }`}
            title="Foto 6D Fotorealistike - Sic i tregohet klientit"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Ultra 6D
          </button>

          <button
            onClick={() => setRenderStyle('photoreal')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              renderStyle === 'photoreal'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
            title="Render 3D Fotoreal Studio"
          >
            <Sparkles className="w-3.5 h-3.5" /> 3D Studio
          </button>

          <button
            onClick={() => setRenderStyle('sketchup')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              renderStyle === 'sketchup'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
            title="Pamje Linjore SketchUp / CAD"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" /> SketchUp CAD
          </button>

          <button
            onClick={() => setRenderStyle('cabinet_vision')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              renderStyle === 'cabinet_vision'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
            title="Cabinet Vision - Pamje Inxhinierike"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Cabinet Vision
          </button>

          <button
            onClick={() => setRenderStyle('design_2020')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              renderStyle === 'design_2020'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
            title="2020 Design Live"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> 2020 Design
          </button>

          <button
            onClick={() => setRenderStyle('polyboard')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              renderStyle === 'polyboard'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
            title="PolyBoard - Modelim Pllaka CNC"
          >
            <Box className="w-3.5 h-3.5 text-amber-500" /> PolyBoard
          </button>

          <button
            onClick={() => setRenderStyle('living_room')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              renderStyle === 'living_room'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
            title="Dizajn i Ngrohtë Saloni"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Salon Lux
          </button>
        </div>

        {/* Action Buttons: Camera Reset & HD Export */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={handleResetCamera}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700/80 shadow-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Qendro Pamjen 3D tek të gjitha kaçat"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Qendro Pamjen</span>
          </button>

          <button
            onClick={handleDownloadRenderHD}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-xl shadow-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Shkarko Render Foto HD për Klientin"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Foto HD</span>
          </button>
        </div>
      </div>

      {/* Active Paintbrush Mode Banner */}
      {activePaintbrushMat && (
        <div className="absolute top-16 left-3 z-30 bg-amber-400 text-slate-950 px-3.5 py-2 rounded-2xl shadow-2xl font-black text-xs border-2 border-white flex items-center gap-2.5 animate-bounce">
          <Paintbrush className="w-4 h-4 text-slate-950" />
          <span>Lyerësi me Ngjyrë: <strong>{activePaintbrushMat.name}</strong></span>
          <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-mono">
            Klikoni mbi Tavanin, Ansoret apo Frontet me mi
          </span>
          <button 
            onClick={() => setActivePaintbrushMatId(null)}
            className="ml-2 bg-slate-900 hover:bg-slate-800 text-white p-1 rounded-full cursor-pointer"
            title="Dil nga Mënyra Lyerje"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Toast Confirmation Message */}
      {toastMessage && (
        <div className="absolute top-16 right-3 z-30 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-2xl font-black text-xs border-2 border-white flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-slate-950 font-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hover Info Tooltip showing exact Sub-part targeted */}
      {hoveredPartInfo && (
        <div className="absolute bottom-16 left-4 z-20 bg-slate-950/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl font-black text-xs shadow-2xl border border-amber-400/80 flex items-center gap-2.5">
          <MousePointer className="w-4 h-4 text-amber-400 animate-pulse" />
          <div>
            <span className="text-amber-300 block text-[10px] font-mono uppercase">{hoveredPartInfo.elementName}</span>
            <span className="text-white text-xs font-extrabold font-mono">🎯 Target: {hoveredPartInfo.partLabel}</span>
          </div>
        </div>
      )}

      {/* FLOATING QUICK MATERIAL SWATCH PALETTE AT BOTTOM OF VIEWPORT */}
      <div className="absolute bottom-2 left-3 right-3 z-20 pointer-events-auto">
        <div className="bg-slate-950/90 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-2 shadow-2xl flex flex-col gap-1.5">
          
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 border-b border-indigo-900/60 pb-1 px-1">
            <span className="flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>🎨 Zgjidh / Tërhiq (Drag & Drop) Ngjyrën direkt mbi Pjesën e Kaçës (Tavani, Ansoret, Portat):</span>
            </span>
            <button 
              onClick={() => setIsQuickPaletteOpen(!isQuickPaletteOpen)}
              className="text-[10px] bg-indigo-950 hover:bg-indigo-900 text-amber-200 px-2 py-0.5 rounded-lg border border-indigo-700/60 font-mono cursor-pointer"
            >
              {isQuickPaletteOpen ? 'Fshih Paletën ▲' : 'Shfaq Paletën ▼'}
            </button>
          </div>

          {isQuickPaletteOpen && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
              {TV_WALL_MATERIALS.slice(0, 10).map((mat) => {
                const isActive = activePaintbrushMatId === mat.id;
                return (
                  <button
                    key={mat.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', mat.id);
                      (window as any).__draggedTvWallMaterialId = mat.id;
                      setActivePaintbrushMatId(mat.id);
                    }}
                    onClick={() => {
                      if (hoveredPartInfo) {
                        applyMaterialToSubPart(hoveredPartInfo.elementId, hoveredPartInfo.partType, mat.id);
                        return;
                      }
                      if (activePaintbrushMatId === mat.id) {
                        setActivePaintbrushMatId(null);
                      } else {
                        setActivePaintbrushMatId(mat.id);
                        setToastMessage(`🖌️ Lyerësi u aktivizua: ${mat.name}. Klikoni mbi Tavanin, Ansoret apo Frontin!`);
                        setTimeout(() => setToastMessage(null), 3000);
                      }
                    }}
                    className={`flex-shrink-0 p-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing text-left group ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-white shadow-lg scale-105 font-black ring-2 ring-amber-300'
                        : 'bg-slate-900/90 text-white border-indigo-800/80 hover:border-amber-400 hover:bg-slate-800/90'
                    }`}
                    title={`Tërhiq ose kliko për të veshur ${mat.name}`}
                  >
                    {/* Visual Swatch Circle */}
                    <div
                      className="w-6 h-6 rounded-lg border border-white/30 shadow-inner flex-shrink-0"
                      style={{
                        backgroundColor: mat.colorHex,
                        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%, rgba(0,0,0,0.2) 100%)`,
                      }}
                    />
                    <div className="overflow-hidden pr-1">
                      <div className={`text-[10.5px] font-bold truncate max-w-[90px] ${isActive ? 'text-slate-950 font-extrabold' : 'text-slate-200 group-hover:text-amber-300'}`}>
                        {mat.name}
                      </div>
                      <div className={`text-[9px] font-mono ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                        {mat.pricePerM2} €/m²
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dimension Line Badge Overlay */}
      {showDimensions && selectedEl && (
        <div className="absolute top-20 right-4 z-20 bg-indigo-950/90 border border-indigo-500/80 text-white px-4 py-2.5 rounded-2xl shadow-2xl space-y-1 text-xs backdrop-blur-md">
          <div className="text-[10px] uppercase font-black tracking-wider text-amber-300 border-b border-indigo-800/60 pb-1">
            Masa Zyrtare në MM ({selectedEl.name})
          </div>
          <div className="font-mono text-amber-300 font-bold flex gap-3 pt-0.5">
            <span>W: {selectedEl.width} mm</span>
            <span>H: {selectedEl.height} mm</span>
            <span>D: {selectedEl.depth} mm</span>
            <span>Y: {selectedEl.y} mm</span>
          </div>
        </div>
      )}
    </div>
  );
};
