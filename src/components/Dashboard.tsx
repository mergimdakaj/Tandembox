import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { AttendanceRecord, BreakRecord, ExpenseRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  Coffee, 
  Clock, 
  CheckCircle2,
  Timer,
  PlusCircle,
  History,
  Sun,
  Briefcase
} from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { user } = useAuth();
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [activeBreak, setActiveBreak] = useState<BreakRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [overtime, setOvertime] = useState('');
  const [todayExpenses, setTodayExpenses] = useState<ExpenseRecord[]>([]);
  const [overtimeSaved, setOvertimeSaved] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    if (!user) return;

    const loadData = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
      const todayRecord = attendance.find((r: AttendanceRecord) => r.userId === user.uid && r.date === today);
      
      setCurrentAttendance(todayRecord || null);
      if (todayRecord?.overtimeHours) {
        setOvertime(todayRecord.overtimeHours.toString());
      }

      if (todayRecord) {
        const breaks = JSON.parse(localStorage.getItem('pl_breaks') || '[]');
        const activeBrk = breaks.find((b: BreakRecord) => b.attendanceId === todayRecord.id && !b.endTime);
        setActiveBreak(activeBrk || null);
      }

      // Load today's expenses
      const allExpenses = JSON.parse(localStorage.getItem('pl_expenses') || '[]');
      const filteredExpenses = allExpenses.filter((e: ExpenseRecord) => 
        e.userId === user.uid && format(new Date(e.date), 'yyyy-MM-dd') === today
      );
      setTodayExpenses(filteredExpenses);
      
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCheckIn = () => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const isSaturday = new Date().getDay() === 6;
    
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const existingIndex = attendance.findIndex((r: AttendanceRecord) => r.userId === user.uid && r.date === today);

    if (existingIndex !== -1) {
      attendance[existingIndex].checkIn = new Date().toISOString();
      if (attendance[existingIndex].status === 'absent' || attendance[existingIndex].status === 'vacation') {
        attendance[existingIndex].status = 'present';
      }
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance({ ...attendance[existingIndex] });
    } else {
      const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        date: today,
        checkIn: new Date().toISOString(),
        status: 'present',
        isSaturday,
      };
      attendance.push(newRecord);
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance(newRecord);
    }
  };

  const toggleHalfDay = () => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const existingIndex = attendance.findIndex((r: AttendanceRecord) => r.userId === user.uid && r.date === today);

    if (existingIndex !== -1) {
      const newStatus = attendance[existingIndex].status === 'half-day' ? 'present' : 'half-day';
      attendance[existingIndex].status = newStatus;
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance({ ...attendance[existingIndex] });
    } else {
      const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        date: today,
        status: 'half-day',
        isSaturday: new Date().getDay() === 6,
      };
      attendance.push(newRecord);
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance(newRecord);
    }
  };

  const markFullDay = () => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Set 08:00 to 16:00
    const checkIn = setMinutes(setHours(new Date(), 8), 0).toISOString();
    const checkOut = setMinutes(setHours(new Date(), 16), 0).toISOString();
    
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const existingIndex = attendance.findIndex((r: AttendanceRecord) => r.userId === user.uid && r.date === today);

    if (existingIndex !== -1) {
      attendance[existingIndex].checkIn = checkIn;
      attendance[existingIndex].checkOut = checkOut;
      attendance[existingIndex].status = 'present';
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance({ ...attendance[existingIndex] });
    } else {
      const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        date: today,
        checkIn,
        checkOut,
        status: 'present',
        isSaturday: new Date().getDay() === 6,
      };
      attendance.push(newRecord);
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance(newRecord);
    }
  };

  const saveOvertime = () => {
    if (!currentAttendance?.id) return;
    const hours = parseFloat(overtime) || 0;
    
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const index = attendance.findIndex((r: AttendanceRecord) => r.id === currentAttendance.id);
    
    if (index !== -1) {
      attendance[index].overtimeHours = hours;
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance({ ...attendance[index] });
      setOvertimeSaved(true);
      setTimeout(() => setOvertimeSaved(false), 2000);
    }
  };

  const handleAddQuickExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !expAmount || !expDesc) return;

    const newExpense: ExpenseRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      amount: parseFloat(expAmount),
      description: expDesc,
      category: 'Pauzë',
      date: new Date().toISOString(),
    };

    const allExpenses = JSON.parse(localStorage.getItem('pl_expenses') || '[]');
    allExpenses.push(newExpense);
    localStorage.setItem('pl_expenses', JSON.stringify(allExpenses));
    
    // Update local state for immediate feedback
    setTodayExpenses(prev => [...prev, newExpense]);
    
    setExpAmount('');
    setExpDesc('');
    setShowExpenseModal(false);
  };

  const resetToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const filtered = attendance.filter((r: AttendanceRecord) => !(r.userId === user?.uid && r.date === today));
    localStorage.setItem('pl_attendance', JSON.stringify(filtered));
    
    const breaks = JSON.parse(localStorage.getItem('pl_breaks') || '[]');
    const filteredBreaks = breaks.filter((b: BreakRecord) => b.userId !== user?.uid || !b.startTime.startsWith(today));
    localStorage.setItem('pl_breaks', JSON.stringify(filteredBreaks));
    
    setCurrentAttendance(null);
    setActiveBreak(null);
  };

  const handleCheckOut = () => {
    if (!currentAttendance?.id) return;
    
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const index = attendance.findIndex((r: AttendanceRecord) => r.id === currentAttendance.id);
    
    if (index !== -1) {
      attendance[index].checkOut = new Date().toISOString();
      localStorage.setItem('pl_attendance', JSON.stringify(attendance));
      setCurrentAttendance(attendance[index]);
      
      // End any active break
      if (activeBreak) {
        endBreak();
      }
    }
  };

  const startBreak = () => {
    if (!user || !currentAttendance?.id) return;
    
    const newBreak: BreakRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      attendanceId: currentAttendance.id,
      startTime: new Date().toISOString(),
    };

    const breaks = JSON.parse(localStorage.getItem('pl_breaks') || '[]');
    breaks.push(newBreak);
    localStorage.setItem('pl_breaks', JSON.stringify(breaks));
    setActiveBreak(newBreak);
  };

  const endBreak = () => {
    if (!activeBreak?.id) return;
    
    const breaks = JSON.parse(localStorage.getItem('pl_breaks') || '[]');
    const index = breaks.findIndex((b: BreakRecord) => b.id === activeBreak.id);
    
    if (index !== -1) {
      breaks[index].endTime = new Date().toISOString();
      localStorage.setItem('pl_breaks', JSON.stringify(breaks));
      setActiveBreak(null);
    }
  };

  if (loading) return null;

  const getStatusColor = () => {
    if (activeBreak) return 'bg-amber-500';
    if (currentAttendance?.checkOut) return 'bg-slate-400';
    if (currentAttendance?.status === 'half-day') return 'bg-indigo-500';
    if (currentAttendance?.checkIn) return 'bg-emerald-500';
    return 'bg-blue-600';
  };

  const getStatusText = () => {
    if (activeBreak) return 'NË PAUZË';
    if (currentAttendance?.checkOut) return 'PUNA PËRFUNDOI';
    if (currentAttendance?.status === 'half-day') return 'GJYSMË DITE';
    if (currentAttendance?.checkIn) return 'NË PUNË';
    return 'JO AKTIV';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Përshëndetje!</h2>
          <p className="text-slate-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
      </div>

      <motion.div 
        layout
        className={cn(
          "rounded-3xl p-8 text-white shadow-xl relative overflow-hidden transition-colors duration-500",
          getStatusColor()
        )}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 font-medium uppercase tracking-widest text-xs mb-1">Statusi Aktual</p>
              <h3 className="text-4xl font-black mb-6">{getStatusText()}</h3>
            </div>
            <button 
              onClick={resetToday}
              className="mb-6 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95"
              title="Fshi të dhënat e sotme për testim"
            >
              Reset Test
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div>
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Fillimi</p>
              <p className="text-lg font-bold">
                {currentAttendance?.checkIn ? format(new Date(currentAttendance.checkIn), 'HH:mm') : '--:--'}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Mbarimi</p>
              <p className="text-lg font-bold">
                {currentAttendance?.checkOut ? format(new Date(currentAttendance.checkOut), 'HH:mm') : '--:--'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
          <CheckCircle2 size={240} strokeWidth={1} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {!currentAttendance?.checkIn ? (
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleCheckIn}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-lg border-b-4 border-indigo-800 transition-all active:translate-y-1 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" />
              REGJISTRO HYRJEN
            </button>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={markFullDay}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-lg border-b-4 border-emerald-700 transition-all active:translate-y-1 flex items-center justify-center gap-3"
              >
                <Sun className="w-6 h-6" />
                DITË E PLOTË
              </button>
              <button 
                onClick={toggleHalfDay}
                className={cn(
                  "w-full font-bold py-5 rounded-2xl shadow-lg border-b-4 transition-all active:translate-y-1 flex items-center justify-center gap-3",
                  currentAttendance?.status === 'half-day' 
                    ? "bg-amber-100 text-amber-700 border-amber-300" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Timer className="w-6 h-6" />
                {currentAttendance?.status === 'half-day' ? 'GJYSMË DITE (AKTIVE)' : 'GJYSMË DITE'}
              </button>
            </div>
          </div>
        ) : !currentAttendance.checkOut ? (
          <div className="space-y-4">
            <button 
              onClick={handleCheckOut}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-5 rounded-2xl shadow-lg border-b-4 border-rose-800 transition-all active:translate-y-1 flex items-center justify-center gap-3"
            >
              <Square className="w-6 h-6 fill-current" />
              REGJISTRO DALJEN
            </button>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {!activeBreak ? (
                <button 
                  onClick={startBreak}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-2 shadow-md border-b-4 border-amber-700 transition-all active:translate-y-1"
                >
                  <Coffee className="w-6 h-6" />
                  <span className="text-xs">Fillo Pauzën</span>
                </button>
              ) : (
                <button 
                  onClick={endBreak}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-2 shadow-md border-b-4 border-indigo-700 transition-all active:translate-y-1"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-xs">Mbaro Pauzën</span>
                </button>
              )}
              
              <button 
                onClick={markFullDay}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-2 shadow-md border-b-4 border-emerald-700 transition-all active:translate-y-1"
              >
                <Sun className="w-6 h-6" />
                <span className="text-xs">Ditë e Plotë</span>
              </button>

              <button 
                onClick={toggleHalfDay}
                className={cn(
                  "font-bold py-4 rounded-2xl flex flex-col items-center gap-2 shadow-md border-b-4 transition-all active:translate-y-1",
                  currentAttendance?.status === 'half-day' 
                    ? "bg-indigo-600 text-white border-indigo-800" 
                    : "bg-white text-slate-500 border-slate-200"
                )}
              >
                <Timer className="w-6 h-6" />
                <span className="text-xs">Gjysmë Dite</span>
              </button>

              <button 
                onClick={() => setShowExpenseModal(true)}
                className="bg-white hover:bg-slate-50 text-rose-500 font-bold py-4 rounded-2xl flex flex-col items-center gap-2 shadow-md border-b-4 border-slate-200 transition-all active:translate-y-1"
              >
                <PlusCircle className="w-6 h-6" />
                <span className="text-xs">Shto Shpenzim</span>
              </button>

              <div className="hidden lg:flex bg-white rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Clock className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-widest leading-none">Pasqyra</span>
              </div>
            </div>

            {/* Overtime Selector */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <History className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-wider">Jashtë Orarit (Pas orës 16:00)</h4>
                {overtimeSaved && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase"
                  >
                    U Ruajt!
                  </motion.span>
                )}
              </div>
              <div className="flex gap-3">
                <input 
                  type="number"
                  step="0.5"
                  value={overtime}
                  onChange={(e) => setOvertime(e.target.value)}
                  placeholder="Oret p.sh 1.5"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                />
                <button 
                  onClick={saveOvertime}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
                >
                  RUAJ
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 italic">Shtoni oret e punuara mbas orarit te rregullt.</p>
            </div>

          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-8 rounded-[32px] border border-indigo-100 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-indigo-900 leading-tight">MIRËUPAFSHIM!</h3>
                <p className="text-sm text-indigo-600/70 font-medium">Puna për sot u regjistrua me sukses.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="bg-white hover:bg-slate-50 text-rose-500 font-bold py-4 rounded-2xl flex flex-col items-center gap-2 shadow-md border-b-4 border-slate-200 transition-all active:translate-y-1"
              >
                <PlusCircle className="w-6 h-6" />
                <span className="text-xs">Shto Shpenzim</span>
              </button>
              
              <button 
                onClick={resetToday}
                className="bg-white hover:bg-slate-50 text-slate-400 font-bold py-4 rounded-2xl flex flex-col items-center gap-2 shadow-md border-b-4 border-slate-200 transition-all active:translate-y-1"
              >
                <History className="w-6 h-6" />
                <span className="text-xs">Rifillo Ditën</span>
              </button>
            </div>
          </div>
        )}

        {/* Today's Summary Section - Always visible if there is data */}
        {currentAttendance && (todayExpenses.length > 0 || currentAttendance?.overtimeHours) && (
          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Përmbledhja e sotme</h4>
              <span className="text-[10px] font-black text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-50 leading-none">Vëzhgim</span>
            </div>
            
            <div className="space-y-3">
              {currentAttendance?.overtimeHours ? (
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Jashtë orarit</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase">Statistikë</p>
                    </div>
                  </div>
                  <span className="font-black text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg">+{currentAttendance.overtimeHours} orë</span>
                </div>
              ) : null}

              {todayExpenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-rose-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{expense.description}</p>
                      <p className="text-[9px] text-rose-400 font-black uppercase">Shpenzim</p>
                    </div>
                  </div>
                  <span className="font-black text-rose-600 bg-rose-50/50 px-3 py-1 rounded-lg">€{expense.amount.toFixed(2)}</span>
                </div>
              ))}
              
              {todayExpenses.length > 0 && (
                <div className="flex justify-between items-center px-4 pt-3 border-t border-slate-200/60 mt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Shpenzime sot:</span>
                  <span className="text-lg font-black text-rose-600">€{todayExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8"
            >
              <h3 className="text-2xl font-black text-slate-800 mb-6">Shto Shpenzim</h3>
              <form onSubmit={handleAddQuickExpense} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shuma (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-rose-500 text-xl font-black"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Përshkrimi</label>
                  <input 
                    type="text" 
                    placeholder="p.sh. Kafja e mëngjesit"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    ANULO
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                  >
                    SHTO
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
