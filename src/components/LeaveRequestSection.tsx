import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { LeaveRequest, AttendanceRecord } from '../types';
import { 
  format, 
  eachDayOfInterval, 
  parseISO, 
  differenceInDays 
} from 'date-fns';
import { 
  Palmtree, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Plus, 
  Trash2,
  CalendarCheck,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function LeaveRequestSection() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    const loadRequests = () => {
      const stored = JSON.parse(localStorage.getItem('pl_leave_requests') || '[]');
      setRequests(stored);
    };
    loadRequests();
    window.addEventListener('storage', loadRequests);
    return () => window.removeEventListener('storage', loadRequests);
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) return;
    if (!startDate || !endDate) {
      setError('Ju lutem zgjidhni datën e fillimit dhe të mbarimit.');
      return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (start > end) {
      setError('Data e mbarimit duhet të jetë pas ose e barabartë me datën e fillimit.');
      return;
    }

    const diff = differenceInDays(end, start) + 1;
    if (diff <= 0) {
      setError('Zgjidhni një shtrirje të vlefshme për pushimin.');
      return;
    }

    const newRequest: LeaveRequest = {
      id: Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      userName: user.name || 'Përdorues',
      startDate,
      endDate,
      reason: reason || 'Nuk ka arsye të specifikuara',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const stored = JSON.parse(localStorage.getItem('pl_leave_requests') || '[]');
    stored.push(newRequest);
    localStorage.setItem('pl_leave_requests', JSON.stringify(stored));
    setRequests(stored);
    window.dispatchEvent(new Event('storage'));

    setSuccess(`Kërkesa u dërgua me sukses për ${diff} ditë pushimi!`);
    setStartDate('');
    setEndDate('');
    setReason('');
    
    // Auto-close modal after a delay
    setTimeout(() => {
      setShowApplyModal(false);
      setSuccess('');
    }, 2000);
  };

  const handleDeleteRequest = (id: string) => {
    const stored = JSON.parse(localStorage.getItem('pl_leave_requests') || '[]');
    const updated = stored.filter((r: LeaveRequest) => r.id !== id);
    localStorage.setItem('pl_leave_requests', JSON.stringify(updated));
    setRequests(updated);
    window.dispatchEvent(new Event('storage'));
  };

  // If the user is an admin, let them manage all staff leave requests
  const handleAdminAction = (id: string, status: 'approved' | 'rejected') => {
    const stored = JSON.parse(localStorage.getItem('pl_leave_requests') || '[]');
    const index = stored.findIndex((r: LeaveRequest) => r.id === id);
    
    if (index !== -1) {
      stored[index].status = status;
      localStorage.setItem('pl_leave_requests', JSON.stringify(stored));
      setRequests(stored);

      // If approved, dynamically populate the attendance calendar for those dates as 'vacation'!
      if (status === 'approved') {
        const req = stored[index];
        const attendances = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
        
        try {
          const days = eachDayOfInterval({
            start: parseISO(req.startDate),
            end: parseISO(req.endDate)
          });

          days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            // Skip Sundays perhaps, or mark all
            const isSaturday = day.getDay() === 6;
            
            // Check if there is already an attendance record for this date
            const existingIndex = attendances.findIndex((a: AttendanceRecord) => a.userId === req.userId && a.date === dateStr);
            if (existingIndex !== -1) {
              attendances[existingIndex].status = 'vacation';
            } else {
              attendances.push({
                id: Math.random().toString(36).substring(2, 9),
                userId: req.userId,
                date: dateStr,
                status: 'vacation',
                isSaturday,
                note: `Pushim vjetor i aprovuar (Arsyeja: ${req.reason})`
              });
            }
          });

          localStorage.setItem('pl_attendance', JSON.stringify(attendances));
        } catch (err) {
          console.error('Error auto-filling vacation days: ', err);
        }
      }

      window.dispatchEvent(new Event('storage'));
    }
  };

  const isAdmin = user?.role === 'admin';
  const myRequests = requests.filter(r => r.userId === user?.uid);
  const pendingRequestsForAdmin = requests.filter(r => r.status === 'pending');

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100/60">
        <div>
          <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-[#4239b3]" />
            Pushimet Vjetore
          </h4>
          <p className="text-slate-400 text-[10px] font-semibold">
            Menaxhoni dhe aplikoni për lejet e pushimeve vjetore
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#f4f2ff] hover:bg-[#eae6ff] text-[#4239b3] rounded-2xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> APLIKO SOT
        </button>
      </div>

      {/* Admin Section: Pending review requests */}
      {isAdmin && pendingRequestsForAdmin.length > 0 && (
        <div className="bg-[#fbfcff] border border-indigo-100/65 rounded-2xl p-4.5 space-y-3.5">
          <h5 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            Kërkesat në Pritje ({pendingRequestsForAdmin.length})
          </h5>
          <div className="space-y-3">
            {pendingRequestsForAdmin.map(req => {
              const diff = differenceInDays(parseISO(req.endDate), parseISO(req.startDate)) + 1;
              return (
                <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">{req.userName}</p>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                      {format(parseISO(req.startDate), 'dd/MM/yyyy')} - {format(parseISO(req.endDate), 'dd/MM/yyyy')} ({diff} ditë)
                    </p>
                    <p className="text-[10px] italic text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100/60 inline-block mt-1">
                      "{req.reason}"
                    </p>
                  </div>
                  <div className="flex gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleAdminAction(req.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[9px] font-black tracking-wider uppercase transition-colors"
                    >
                      Refuzo
                    </button>
                    <button
                      onClick={() => handleAdminAction(req.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black tracking-wider uppercase shadow-xs transition-colors"
                    >
                      Aprovo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User requests track log */}
      <div className="space-y-3">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
          Kërkesat tuaja historike
        </h5>

        {myRequests.length === 0 ? (
          <div className="text-center py-6 text-slate-300 italic text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            Nuk keni asnjë kërkesë të regjistruar për pushime.
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
            {myRequests.map(req => {
              const diff = differenceInDays(parseISO(req.endDate), parseISO(req.startDate)) + 1;
              return (
                <div key={req.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-slate-50/80">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-700">
                        {diff} {diff === 1 ? 'Ditë' : 'Ditë'} Pushimi
                      </span>
                      {req.status === 'approved' && (
                        <span className="bg-emerald-50 text-emerald-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5 uppercase tracking-wider">
                          <CheckCircle className="w-2.5 h-2.5" /> Aprovuar
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="bg-rose-50 text-rose-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-0.5 uppercase tracking-wider">
                          <XCircle className="w-2.5 h-2.5" /> Refuzuar
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="bg-amber-50 text-amber-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5 uppercase tracking-wider">
                          <Clock className="w-2.5 h-2.5" /> Në Pritje
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">
                      Prej: {format(parseISO(req.startDate), 'dd/MM/yyyy')} deri më {format(parseISO(req.endDate), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px] leading-tight mt-0.5">
                      Arsyeja: {req.reason}
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50/50 transition-all flex-shrink-0"
                      title="Fshi Kërkesën"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-Up Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8 border border-slate-100 relative"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                    <CalendarCheck className="w-5 h-5 text-[#4239b3]" />
                    Aplikim për Pushim
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">Dërgoni kërkesën për kalendarin vjetor</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-rose-50 text-rose-600 text-[10px] font-bold px-3.5 py-2.5 rounded-xl border border-rose-100 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" /> {error}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3.5 py-2.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> {success}
                </div>
              )}

              <form onSubmit={handleApply} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Data e Fillimit</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-[#4239b3] text-slate-700 font-extrabold text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Data e Mbarimit</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-[#4239b3] text-slate-700 font-extrabold text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Arsyeja / Shënimi</label>
                  <textarea
                    placeholder="Arsyeja p.sh. Pushim veror, çështje familjare..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs md:text-sm font-semibold outline-none focus:ring-2 focus:ring-[#4239b3] placeholder-slate-400 text-slate-700 resize-none font-sans"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-[10px] uppercase tracking-wider"
                  >
                    Anulo
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#4239b3] text-white font-bold rounded-2xl hover:bg-[#342caa] transition-all shadow-lg shadow-[#4239b3]/20 text-[10px] uppercase tracking-wider"
                  >
                    DËRGO
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
