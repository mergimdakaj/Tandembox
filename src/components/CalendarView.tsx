import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { AttendanceRecord, ExpenseRecord } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  setHours,
  setMinutes,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarCheck, 
  Palmtree, 
  Home, 
  Timer, 
  Euro, 
  Info, 
  X, 
  Briefcase, 
  Zap, 
  Star,
  Coffee,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function CalendarView() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayOvertime, setDayOvertime] = useState('');

  useEffect(() => {
    if (selectedDay) {
      const record = getDayRecord(selectedDay);
      setDayOvertime(record?.overtimeHours?.toString() || '');
    }
  }, [selectedDay]);

  useEffect(() => {
    if (!user) return;

    const loadData = () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const allAttendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
      const filteredRecords = allAttendance.filter((r: AttendanceRecord) => 
        r.userId === user.uid && r.date >= start && r.date <= end
      );
      setRecords(filteredRecords);

      const allExpenses = JSON.parse(localStorage.getItem('pl_expenses') || '[]');
      const filteredExpenses = allExpenses.filter((e: ExpenseRecord) => {
        const expenseDate = format(new Date(e.date), 'yyyy-MM-dd');
        return e.userId === user.uid && expenseDate >= start && expenseDate <= end;
      });
      setExpenses(filteredExpenses);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const stats = {
    fullDays: records.filter(r => r.checkIn && r.status === 'present').length,
    halfDays: records.filter(r => r.status === 'half-day').length,
    holidays: records.filter(r => r.status === 'holiday').length,
    saturdays: records.filter(r => r.isSaturday && r.checkIn).length,
    overtimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
  };

  const markDay = (day: Date, status: 'absent' | 'vacation' | 'half-day' | 'holiday') => {
    if (!user) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    const allAttendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const existingIndex = allAttendance.findIndex((r: AttendanceRecord) => r.userId === user.uid && r.date === dateStr);
    
    if (existingIndex !== -1) {
      allAttendance[existingIndex].status = allAttendance[existingIndex].status === status ? 'present' : status;
    } else {
      allAttendance.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        date: dateStr,
        status: status,
      });
    }

    localStorage.setItem('pl_attendance', JSON.stringify(allAttendance));
    window.dispatchEvent(new Event('storage'));
    refreshData();
  };

  const saveDayOvertime = () => {
    if (!user || !selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const hours = parseFloat(dayOvertime) || 0;
    
    const allAttendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const existingIndex = allAttendance.findIndex((r: AttendanceRecord) => r.userId === user.uid && r.date === dateStr);
    
    if (existingIndex !== -1) {
      allAttendance[existingIndex].overtimeHours = hours;
    } else {
      allAttendance.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        date: dateStr,
        status: 'present',
        overtimeHours: hours,
      });
    }
    
    localStorage.setItem('pl_attendance', JSON.stringify(allAttendance));
    window.dispatchEvent(new Event('storage'));
    refreshData();
  };

  const refreshData = () => {
    if (!user) return;
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    const allAttendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    setRecords(allAttendance.filter((r: AttendanceRecord) => 
      r.userId === user.uid && r.date >= start && r.date <= end
    ));
  };

  const getDayRecord = (day: Date) => records.find(r => r.date === format(day, 'yyyy-MM-dd'));
  const getDayExpenses = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return expenses.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" /> Kalendari i Punës
          </h2>
          <p className="text-slate-500 font-medium text-sm">Gjurmimi i performancës suaj mujore</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-6 font-black text-slate-800 min-w-[150px] text-center uppercase tracking-widest text-xs">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
          {['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {days.map((day) => {
            const record = getDayRecord(day);
            const dayExpenses = getDayExpenses(day);
            const totalExpense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const isSelected = selectedDay && format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');

            return (
              <motion.div 
                key={day.toISOString()}
                whileHover={isSameMonth(day, currentMonth) ? { scale: 1.02, zIndex: 10 } : {}}
                className={cn(
                  "bg-white min-h-[100px] p-2 flex flex-col gap-1 relative group cursor-pointer transition-all duration-300",
                  !isSameMonth(day, currentMonth) && "opacity-20 pointer-events-none grayscale",
                  isSelected && "ring-2 ring-indigo-500 z-10"
                )}
                onClick={() => setSelectedDay(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
                    isToday(day) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 group-hover:text-slate-900"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {totalExpense > 0 && (
                    <div className="flex items-center gap-0.5 text-rose-500 font-black text-[9px] bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                      €{totalExpense.toFixed(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  {record?.checkIn && (
                    <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">PUNUAR</span>
                    </div>
                  )}
                  
                  {record?.status === 'holiday' && (
                    <div className="bg-emerald-600 text-white p-1.5 rounded-xl border border-emerald-700 flex items-center gap-1.5 shadow-md">
                      <Palmtree className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">FESTË</span>
                    </div>
                  )}

                  {record?.status === 'half-day' && (
                    <div className="bg-amber-50 text-amber-700 p-1.5 rounded-xl border border-amber-100 flex items-center gap-1.5 shadow-sm">
                      <Timer className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">GJYSMË</span>
                    </div>
                  )}

                  {record?.status === 'absent' && (
                    <div className="bg-rose-50 text-rose-700 p-1.5 rounded-xl border border-rose-100 flex items-center gap-1.5 shadow-sm">
                      <Home className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">MUNGESË</span>
                    </div>
                  )}

                  {record?.status === 'vacation' && (
                    <div className="bg-sky-50 text-sky-700 p-1.5 rounded-xl border border-sky-100 flex items-center gap-1.5 shadow-sm">
                      <Palmtree className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">PUSHIM</span>
                    </div>
                  )}

                  {record?.overtimeHours ? (
                    <div className="flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-lg border border-indigo-100 mt-auto">
                      <Zap className="w-2.5 h-2.5" /> +{record.overtimeHours}h
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard icon={<Briefcase />} label="DITE" value={stats.fullDays} color="text-emerald-500" />
        <StatCard icon={<Timer />} label="GJYSMË" value={stats.halfDays} color="text-amber-500" />
        <StatCard icon={<Palmtree />} label="FESTA" value={stats.holidays} color="text-emerald-700" />
        <StatCard icon={<Star />} label="SHTUNA" value={stats.saturdays} color="text-indigo-600" />
        <StatCard icon={<Zap />} label="EXTRA" value={stats.overtimeHours} unit="h" color="text-indigo-600" />
        <StatCard icon={<Euro />} label="EURO" value={stats.totalExpenses} color="text-rose-500" highlight />
      </div>

      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl relative"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Më: {format(selectedDay, 'EEEE')}</p>
                  <h3 className="text-2xl font-black text-slate-800">{format(selectedDay, 'd MMMM yyyy')}</h3>
                </div>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-3">
                  <DayActionButton 
                    active={getDayRecord(selectedDay)?.status === 'holiday'} 
                    onClick={() => markDay(selectedDay, 'holiday')}
                    icon={<Palmtree />} 
                    label="Festë" 
                    color="bg-emerald-600" 
                  />
                  <DayActionButton 
                    active={getDayRecord(selectedDay)?.status === 'absent'} 
                    onClick={() => markDay(selectedDay, 'absent')}
                    icon={<Home />} 
                    label="Mungesë" 
                    color="bg-rose-500" 
                  />
                  <DayActionButton 
                    active={getDayRecord(selectedDay)?.status === 'half-day'} 
                    onClick={() => markDay(selectedDay, 'half-day')}
                    icon={<Timer />} 
                    label="Gjysmë" 
                    color="bg-amber-500" 
                  />
                  <DayActionButton 
                    active={getDayRecord(selectedDay)?.status === 'vacation'} 
                    onClick={() => markDay(selectedDay, 'vacation')}
                    icon={<Coffee />} 
                    label="Pushim" 
                    color="bg-blue-500" 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jashtë Orarit (p.sh 2)</p>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="number"
                      step="0.5"
                      value={dayOvertime}
                      onChange={(e) => setDayOvertime(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      onClick={saveDayOvertime}
                      className="bg-indigo-600 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                      Ruaj
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shpenzimet</p>
                  {getDayExpenses(selectedDay).length > 0 ? (
                    <div className="space-y-2">
                      {getDayExpenses(selectedDay).map(exp => (
                        <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <p className="text-sm font-bold text-slate-700">{exp.description}</p>
                          <span className="font-black text-rose-600">€{exp.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300 italic text-center py-4">S'ka shpenzime për këtë ditë</p>
                  )}
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 flex gap-4">
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="w-full py-5 bg-white border border-slate-200 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
                >
                  MBYLL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, unit = "", color, highlight = false }: any) {
  return (
    <div className={cn(
      "p-4 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center transition-all shadow-sm",
      highlight ? "bg-indigo-50/50 border-indigo-100" : "bg-white"
    )}>
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-1", color, "bg-current/10")}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={cn("text-lg font-black", color)}>
        {value}{unit}
      </p>
    </div>
  );
}

function DayActionButton({ active, onClick, icon, label, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all active:scale-95",
        active 
          ? `${color} text-white border-transparent shadow-lg` 
          : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
      )}
    >
      {React.cloneElement(icon, { size: 20 })}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
