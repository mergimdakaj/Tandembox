import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { WorkNote } from '../types';
import { format } from 'date-fns';
import { 
  Scissors, 
  Check, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle, 
  ClipboardList,
  AlertCircle,
  X,
  Ruler,
  Download,
  PlusCircle,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface WorkNotesSectionProps {
  selectedDate: Date;
}

interface DimensionRow {
  length: string;
  width: string;
  qty: string;
  detail: string;
}

export function WorkNotesSection({ selectedDate }: WorkNotesSectionProps) {
  const { user, showToast } = useAuth();
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteType, setNoteType] = useState<'work' | 'cut'>('cut');

  // Cutting measurement modal states (with multiple rows)
  const [selectedTemplate, setSelectedTemplate] = useState<{ text: string; label: string; type: 'cut' | 'work' } | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [dimensionRows, setDimensionRows] = useState<DimensionRow[]>([
    { length: '', width: '', qty: '1', detail: '' },
    { length: '', width: '', qty: '1', detail: '' },
    { length: '', width: '', qty: '1', detail: '' },
    { length: '', width: '', qty: '1', detail: '' },
  ]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Load notes safely
  const loadNotes = () => {
    const stored = JSON.parse(localStorage.getItem('pl_work_notes') || '[]');
    setNotes(stored);
  };

  useEffect(() => {
    loadNotes();
    window.addEventListener('storage', loadNotes);
    return () => window.removeEventListener('storage', loadNotes);
  }, []);

  // Filter notes belonging to current user and selected date
  const activeNotes = notes.filter(n => n.userId === user?.uid && n.date === dateStr);
  const completedCount = activeNotes.filter(n => n.completed).length;

  const handleAddNote = (textToAdd: string, type: 'work' | 'cut' = noteType) => {
    if (!user || !textToAdd.trim()) return;

    const newNote: WorkNote = {
      id: Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      date: dateStr,
      text: textToAdd.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      noteType: type
    };

    const stored = JSON.parse(localStorage.getItem('pl_work_notes') || '[]');
    stored.push(newNote);
    localStorage.setItem('pl_work_notes', JSON.stringify(stored));
    setNotes(stored);
    
    // Dispatch save event to keep tabs synchronized
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddMultipleNotes = (items: Array<{ text: string; type: 'work' | 'cut' }>) => {
    if (!user || items.length === 0) return;

    const stored = JSON.parse(localStorage.getItem('pl_work_notes') || '[]');
    
    items.forEach(item => {
      const newNote: WorkNote = {
        id: Math.random().toString(36).substring(2, 9),
        userId: user.uid,
        date: dateStr,
        text: item.text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        noteType: item.type
      };
      stored.push(newNote);
    });

    localStorage.setItem('pl_work_notes', JSON.stringify(stored));
    setNotes(stored);
    window.dispatchEvent(new Event('storage'));
    showToast(`📝 U shtuan ${items.length} shënime të prerjes me sukses!`, 'success');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    handleAddNote(newNoteText, noteType);
    showToast(`📝 Shënimi u shtua!`, 'success');
    setNewNoteText('');
  };

  const handleTemplateClick = (tmpl: { text: string; label: string; type: 'cut' | 'work' }) => {
    if (tmpl.type === 'cut') {
      // Open the measurement dialogue with editing capability and multiple rows
      setSelectedTemplate(tmpl);
      setMaterialName(tmpl.text);
      setDimensionRows([
        { length: '', width: '', qty: '1', detail: '' },
        { length: '', width: '', qty: '1', detail: '' },
        { length: '', width: '', qty: '1', detail: '' },
        { length: '', width: '', qty: '1', detail: '' },
      ]);
    } else {
      // Directly add work/general notes or pre-populate input
      handleAddNote(tmpl.text, 'work');
      showToast(`📝 Shënimi u shtua: "${tmpl.text}"`, 'success');
    }
  };

  const addDimensionRow = () => {
    setDimensionRows([...dimensionRows, { length: '', width: '', qty: '1', detail: '' }]);
  };

  const removeDimensionRow = (index: number) => {
    if (dimensionRows.length <= 1) return;
    setDimensionRows(dimensionRows.filter((_, idx) => idx !== index));
  };

  const updateDimensionRow = (index: number, field: keyof DimensionRow, value: string) => {
    const updated = [...dimensionRows];
    updated[index][field] = value;
    setDimensionRows(updated);
  };

  const submitCutMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    // Filter valid rows where either length or width is filled
    const validRows = dimensionRows.filter(row => row.length.trim() || row.width.trim());
    if (validRows.length === 0) {
      showToast("⚠️ Shkruani të paktën një dimension valide!", "warning");
      return;
    }

    const material = materialName.trim() || selectedTemplate.text;
    const notesToCreate = validRows.map(row => {
      const length = row.length.trim();
      const width = row.width.trim();
      const qty = row.qty.trim() || '1';
      const detail = row.detail.trim();

      let formattedText = `${material}`;
      if (length || width) {
        formattedText += `: ${length || '?'} x ${width || '?'} mm`;
      }
      if (qty) {
        formattedText += ` (${qty} copë)`;
      }
      if (detail) {
        formattedText += ` - [${detail}]`;
      }

      return {
        text: formattedText,
        type: 'cut' as const
      };
    });

    handleAddMultipleNotes(notesToCreate);
    setSelectedTemplate(null);
  };

  const handleDownload = () => {
    if (activeNotes.length === 0) {
      showToast("⚠️ S'ka shënime për të shkarkuar për këtë datë!", "warning");
      return;
    }
    
    let text = `=========================================\n`;
    text += `LISTA E PRERJES DHE PUNËS - ${dateStr}\n`;
    text += `=========================================\n`;
    text += `Përdoruesi: ${user?.email || 'N/A'}\n`;
    text += `Data e listës: ${dateStr}\n\n`;

    const cuts = activeNotes.filter(n => n.noteType === 'cut');
    const works = activeNotes.filter(n => n.noteType === 'work');

    if (cuts.length > 0) {
      text += `✂ LISTA E PRERJEVE:\n`;
      text += `-----------------------------------------\n`;
      cuts.forEach((c, index) => {
        text += `${index + 1}. [${c.completed ? 'KRYER' : 'NË PROCES'}] ${c.text}\n`;
      });
      text += `\n`;
    }

    if (works.length > 0) {
      text += `🛠 LISTA E PUNIMEVE:\n`;
      text += `-----------------------------------------\n`;
      works.forEach((w, index) => {
        text += `${index + 1}. [${w.completed ? 'KRYER' : 'NË PROCES'}] ${w.text}\n`;
      });
      text += `\n`;
    }

    text += `=========================================\n`;
    text += `Gjithsej: ${activeNotes.length} shënime (${completedCount} të kryera)\n`;
    text += `Gjeneruar më: ${new Date().toLocaleString()}\n`;
    text += `Sistemi i Planifikimit të Prodhimit\n`;
    text += `=========================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lista-e-Prerjes-${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast("💾 Shkarkimi i listës u krye me sukses!", "success");
  };

  const toggleNote = (id: string) => {
    const stored = JSON.parse(localStorage.getItem('pl_work_notes') || '[]');
    let updatedMessage = '';
    let messageType: 'success' | 'warning' = 'success';

    const updated = stored.map((n: WorkNote) => {
      if (n.id === id) {
        const nextState = !n.completed;
        updatedMessage = nextState 
          ? `✅ Përfundoi: "${n.text.substring(0, 25)}..."`
          : `⚠️ U kthye në proces: "${n.text.substring(0, 25)}..."`;
        messageType = nextState ? 'success' : 'warning';
        return { ...n, completed: nextState };
      }
      return n;
    });

    localStorage.setItem('pl_work_notes', JSON.stringify(updated));
    setNotes(updated);
    window.dispatchEvent(new Event('storage'));
    
    if (updatedMessage) {
      showToast(updatedMessage, messageType);
    }
  };

  const deleteNote = (id: string) => {
    const stored = JSON.parse(localStorage.getItem('pl_work_notes') || '[]');
    const toDelete = stored.find((n: WorkNote) => n.id === id);
    const updated = stored.filter((n: WorkNote) => n.id !== id);
    
    localStorage.setItem('pl_work_notes', JSON.stringify(updated));
    setNotes(updated);
    window.dispatchEvent(new Event('storage'));
    
    if (toDelete) {
      showToast(`🗑️ U fshi shënimi: "${toDelete.text.substring(0, 20)}..."`, 'info');
    }
  };

  // Pre-configured templates suitable for carpentry shop activities
  const templates = [
    { text: 'Prerje MDF 18mm', type: 'cut' as const, label: '✂️ Prerje MDF' },
    { text: 'Prerje Fletëza druri', type: 'cut' as const, label: '✂️ Fletëza' },
    { text: 'Prerje Melaminë', type: 'cut' as const, label: '✂️ Melaminë' },
    { text: 'Montim Mergim Pro / Sirtarë', type: 'work' as const, label: '⚙️ Mergim Pro' },
    { text: 'Prerje profile alumini', type: 'cut' as const, label: '✂️ Alumini' },
    { text: 'Veshje skajesh (Kantin)', type: 'work' as const, label: '🪵 Kantin' },
  ];

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
      
      {/* Header design aligned with visual specs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100/60">
        <div>
          <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#4239b3]" />
            Shënimet e Punës & Prerjes
          </h4>
          <p className="text-slate-400 text-[10px] font-semibold">
            Plani ditor: Çfarë keni për të punuar ose prerë sot
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeNotes.length > 0 && (
            <button
              onClick={handleDownload}
              className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-50 hover:bg-[#4239b3] hover:text-white hover:border-transparent text-[#4239b3] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 duration-150"
              title="Shkarko shënimet e sotme"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" /> Shkarko Listën
            </button>
          )}

          <span className="text-[10px] font-black text-[#4239b3] bg-[#f4f2ff] border border-[#eae6ff] px-3 py-2 rounded-xl leading-none">
            {activeNotes.length > 0 ? `${completedCount}/${activeNotes.length} Kryer` : 'Paplotësuar'}
          </span>
        </div>
      </div>

      {/* Quick Templates Section */}
      <div className="space-y-2">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-0.5">
          Shto ose vendos masat nga shabllonet e gatave
        </span>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleTemplateClick(tmpl)}
              className="text-[10px] font-extrabold px-3 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-100 rounded-xl text-slate-600 hover:text-indigo-700 transition-all active:scale-95 duration-150"
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note submission form */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            type="button"
            onClick={() => setNoteType('cut')}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all",
              noteType === 'cut' 
                ? "bg-white text-indigo-700 shadow-sm border border-slate-100" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Scissors className="w-3.5 h-3.5" /> Për Prerje
          </button>
          <button
            type="button"
            onClick={() => setNoteType('work')}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all",
              noteType === 'work' 
                ? "bg-white text-indigo-700 shadow-sm border border-slate-100" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <FileText className="w-3.5 h-3.5" /> Për Punim
          </button>
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            placeholder={noteType === 'cut' ? "Psh: Prerje MDF i zi 18mm - 12 copë (200x45)" : "Psh: Montim sirtari apo doreza..."}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 placeholder-slate-400 text-xs font-semibold outline-none focus:bg-white focus:border-[#4239b3] focus:ring-1 focus:ring-[#4239b3]/20 transition-all font-sans"
            required
          />
          <button
            type="submit"
            className="w-11 h-11 rounded-full bg-[#4239b3] hover:bg-[#342caa] text-white flex items-center justify-center transition-all active:scale-95 flex-shrink-0 shadow-md shadow-[#4239b3]/15"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </form>

      {/* Interactive Notes List */}
      <div className="space-y-2.5">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
          Lista e shënimeve të sotme ({dateStr})
        </h5>

        <AnimatePresence initial={false}>
          {activeNotes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-slate-300 italic text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-slate-300" />
              S'ka shënime të regjistruara për këtë datë.
            </motion.div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {activeNotes.map(n => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:shadow-xs",
                    n.completed 
                      ? "bg-slate-50 border-slate-100 opacity-60" 
                      : n.noteType === 'cut'
                        ? "bg-indigo-50/20 border-indigo-100/50"
                        : "bg-emerald-50/10 border-emerald-100/40"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleNote(n.id)}
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 active:scale-90",
                        n.completed 
                          ? "bg-emerald-500 border-emerald-600 text-white" 
                          : "border-slate-300 bg-white hover:border-slate-400"
                      )}
                    >
                      {n.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <p className={cn(
                        "text-xs font-semibold leading-relaxed break-words",
                        n.completed ? "text-slate-400 line-through" : "text-slate-800"
                      )}>
                        {n.text}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn(
                          "text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-0.5",
                          n.noteType === 'cut'
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100/60"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100/50"
                        )}>
                          {n.noteType === 'cut' ? <Scissors className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                          {n.noteType === 'cut' ? 'Prerje' : 'Punim'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteNote(n.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50/50 transition-all flex-shrink-0"
                    title="Fshi Shënimin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Cutting Measurements Modal Overlay - Group Addition */}
      <AnimatePresence>
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl p-6 md:p-8 border border-slate-100 text-slate-800"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-slate-800">
                      Bashkësia e Masave të Prerjes (Shumë Dimensionale)
                    </h3>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                      Shkruaj masat e pllakës ose materialit për këtë prerje
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTemplate(null)}
                  className="p-1.5 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={submitCutMeasurement} className="space-y-5">
                {/* Materiali Input */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Materiali / Pllaka (psh. Bardh Mat, MDF tjetër)
                  </label>
                  <input
                    type="text"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 placeholder-slate-400 text-xs font-bold outline-none focus:bg-white focus:border-[#4239b3] focus:ring-1 focus:ring-[#4239b3]/20 transition-all"
                    placeholder="MDF Bardh Mat 18mm"
                    required
                  />
                </div>

                {/* Multi rows container headings */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    <div className="col-span-3">Gjatësia (mm)</div>
                    <div className="col-span-3">Gjerësia (mm)</div>
                    <div className="col-span-2">Sasia</div>
                    <div className="col-span-3">Detaje ( Kant / Pozicioni )</div>
                    <div className="col-span-1 text-center">Largimi</div>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {dimensionRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="gjatë"
                            value={row.length}
                            onChange={(e) => updateDimensionRow(idx, 'length', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-indigo-600 font-bold text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="gjerë"
                            value={row.width}
                            onChange={(e) => updateDimensionRow(idx, 'width', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-indigo-600 font-bold text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={row.qty}
                            onChange={(e) => updateDimensionRow(idx, 'qty', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-indigo-600 font-bold text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Psh: 2G+2GJ"
                            value={row.detail}
                            onChange={(e) => updateDimensionRow(idx, 'detail', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-indigo-600 font-semibold text-xs text-slate-700"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeDimensionRow(idx)}
                            disabled={dimensionRows.length <= 1}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              dimensionRows.length <= 1
                                ? "text-slate-200 cursor-not-allowed"
                                : "text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                            )}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addDimensionRow}
                    className="mt-2 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-[#4239b3] hover:underline flex items-center gap-1 pl-1"
                  >
                    <PlusCircle className="w-4 h-4 inline-block" /> Shto rresht tjetër dimensionesh
                  </button>
                </div>

                {/* Call to action buttons */}
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all text-[10px] uppercase tracking-wider"
                  >
                    Anulo
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow-[2] py-3 bg-[#4239b3] text-white font-black rounded-2xl hover:bg-[#342caa] transition-all shadow-md text-[10px] uppercase tracking-wider text-center"
                  >
                    Shto në listë ({dimensionRows.filter(row => row.length.trim() || row.width.trim()).length} rreshta)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
