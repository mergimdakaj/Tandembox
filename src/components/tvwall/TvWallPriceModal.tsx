import React from 'react';
import { TvWallProject } from '../../types/tvwall';
import { TV_WALL_MATERIALS } from '../../data/tvwallMaterials';
import { jsPDF } from 'jspdf';
import { Printer, Download, Calculator } from 'lucide-react';

interface Props {
  project: TvWallProject;
  onClose: () => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const TvWallPriceModal: React.FC<Props> = ({ project, onClose, showToast }) => {
  // Calculate itemized materials & pricing
  let totalMaterialM2 = 0;
  let totalMaterialCost = 0;
  let totalDrawerHardware = 0;
  let totalLedMeters = 0;

  const itemizedList = project.elements.map((el) => {
    const mat = TV_WALL_MATERIALS.find(m => m.id === el.materialId) || TV_WALL_MATERIALS[0];
    const m2 = (el.width * el.height) / 1000000; // convert mm2 to m2
    const m2Cost = m2 * mat.pricePerM2;

    totalMaterialM2 += m2;
    totalMaterialCost += m2Cost;

    if (el.drawerCount) {
      totalDrawerHardware += el.drawerCount * 28; // 28€ per Tandembox drawer hardware
    }

    if (el.type === 'led_strip' || project.wall.ledTone !== 'Off') {
      totalLedMeters += (el.width / 1000);
    }

    return {
      name: el.name,
      dimensions: `${el.width} x ${el.height} x ${el.depth} mm`,
      m2: m2.toFixed(2),
      materialName: mat.name,
      price: m2Cost.toFixed(2),
    };
  });

  const ledProfileCost = totalLedMeters * 15; // 15€ per meter including aluminum profile & power supply
  const subtotal = totalMaterialCost + totalDrawerHardware + ledProfileCost + project.laborCost + project.hardwareCost;
  const discountAmount = (subtotal * project.customDiscountPercent) / 100;
  const finalPrice = subtotal - discountAmount;

  const handleExportPdfQuote = () => {
    const doc = new jsPDF();

    // PDF Header
    doc.setFillColor(15, 23, 42); // Dark slate
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('OFERTË ZYRTARE - TV WALL STUDIO PRO', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Datë: ${new Date().toLocaleDateString('sq-AL')}`, 14, 32);
    doc.text(`Projekti: ${project.name}`, 130, 32);

    // Client & Project Specs
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Specifikimet e Murit TV:', 14, 52);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Përmasat e Murit: ${project.wall.width} mm (W) x ${project.wall.height} mm (H)`, 14, 60);
    doc.text(`Ndriçimi LED: Profile Alumini ${project.wall.ledTone} (${project.wall.ledBrightness}%)`, 14, 66);
    doc.text(`Sipërfaqja e Përgjithshme: ${totalMaterialM2.toFixed(2)} m²`, 14, 72);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 82, 182, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('Moduli', 18, 88);
    doc.text('Përmasat (mm)', 80, 88);
    doc.text('Sipërfaqja', 130, 88);
    doc.text('Materiali', 160, 88);

    // Table Rows
    let y = 98;
    itemizedList.forEach((item) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(item.name.substring(0, 28), 18, y);
      doc.text(item.dimensions, 80, y);
      doc.text(`${item.m2} m²`, 130, y);
      doc.text(item.materialName.substring(0, 20), 160, y);
      y += 8;
    });

    // Summary Box
    y += 10;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 50, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('PËRMBLEDHJA E ÇMIMIT TË TV WALL:', 20, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.text(`Shpenzimi i Materialit & MDF-së: ${totalMaterialCost.toFixed(2)} €`, 20, y + 20);
    doc.text(`Aksesorë & Mekanizma (Tandembox / Hinges): ${totalDrawerHardware.toFixed(2)} €`, 20, y + 28);
    doc.text(`Ndriçim LED & Trafo: ${ledProfileCost.toFixed(2)} €`, 20, y + 36);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`ÇMIMI PËRFUNDIMTAR: ${finalPrice.toFixed(2)} €`, 110, y + 30);

    doc.save(`Oferta_TV_Wall_${project.name.replace(/\s+/g, '_')}.pdf`);
    if (showToast) showToast('📄 Oferta PDF u shkarkua me sukses!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border-2 border-emerald-500/80 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-900/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-black text-white">Llogaritësi Automatik i Çmimit të TV Wall</h3>
              <p className="text-xs text-slate-400">Kostoja e saktë sipas m² të materialit, mekanizmave dhe LED profiles</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Breakdown List */}
        <div className="space-y-2 text-xs font-bold">
          <span className="text-amber-300 font-black uppercase tracking-wider block">
            1. Përmbledhja e Moduleve Të Vendosura:
          </span>

          <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {itemizedList.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 last:border-0 text-[11px]">
                <div>
                  <span className="text-white font-black">{item.name}</span>
                  <span className="text-slate-400 font-mono ml-2">({item.dimensions})</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-300 font-mono font-bold">{item.m2} m²</span>
                  <span className="text-emerald-400 font-mono font-bold ml-3">{item.price} €</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Costing Factors */}
        <div className="grid grid-cols-2 gap-3 text-xs font-bold pt-2 border-t border-slate-800">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Mekanizma Tandembox & Hinges:</span>
            <span className="text-base text-amber-300 font-mono font-black">{totalDrawerHardware.toFixed(2)} €</span>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Ndriçim LED & Trafo ({totalLedMeters.toFixed(1)}m):</span>
            <span className="text-base text-amber-300 font-mono font-black">{ledProfileCost.toFixed(2)} €</span>
          </div>
        </div>

        {/* Total Highlight */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border-2 border-emerald-500/80 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-black text-emerald-300 tracking-wider block">
              Totali Përfundimtar me TV Wall Studio
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Përfshin materialet, ndriçimin LED dhe punën</p>
          </div>
          <span className="text-2xl font-mono font-black text-emerald-400 drop-shadow">
            {finalPrice.toFixed(2)} €
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleExportPdfQuote}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Shkarko Ofertën PDF
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-800 cursor-pointer"
          >
            Mbyll
          </button>
        </div>

      </div>
    </div>
  );
};
