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
  setMinutes
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarCheck, Palmtree, Home, Timer, Euro, Info, X, Briefcase, Zap, Star } from 'lucide-react';
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

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const stats = {
    fullDays: records.filter(r => r.checkIn && r.status === 'present').length,
    halfDays: records.filter(r => r.status === 'half-day').length,
    saturdays: records.filter(r => r.isSaturday && r.checkIn).length,
    overtimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
  };

  const markDay = (day: Date, status: 'absent' | 'vacation' | 'half-day') => {
    if (!user) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    const allAttendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const existingIndex = allAttendance.findIndex((r: AttendanceRecord) => r.userId === user.uid && r.date === dateStr);
    
    // Only block if they checkIn (worked full day or started working)
    // If they already have half-day, they can toggle it
    
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
    
    // Manual trigger loadData effect
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kalendari</h2>
          <p className="text-slate-500">Menaxho ditët e punës dhe shpenzimet</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="px-4 font-bold text-slate-700 min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
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

            return (
              <div 
                key={day.toISOString()}
                className={cn(
                  "bg-white min-h-[110px] p-2 flex flex-col gap-1 relative group cursor-pointer hover:bg-slate-50/50 transition-colors",
                  !isSameMonth(day, currentMonth) && "opacity-30 pointer-events-none"
                )}
                onClick={() => setSelectedDay(day)}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isToday(day) ? "bg-indigo-600 text-white" : "text-slate-400"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {totalExpense > 0 && (
                    <div className="flex items-center gap-0.5 text-rose-500 font-black text-[9px] bg-rose-50 px-1 rounded">
                      <Euro className="w-2 h-2" />
                      {totalExpense}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  {record?.checkIn && (
                    <div className="bg-emerald-50 text-emerald-700 p-1 rounded border border-emerald-100 flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase truncate">Punuar</span>
                      {record.overtimeHours ? (
                        <span className="ml-auto text-[8px] bg-emerald-200 px-1 rounded">+{record.overtimeHours}h</span>
                      ) : null}
                    </div>
                  )}
                  {record?.isSaturday && record?.checkIn && (
                    <div className="bg-indigo-50 text-indigo-700 p-0.5 px-1 rounded border border-indigo-100 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span className="text-[8px] font-black uppercase">E Shtunë</span>
                    </div>
                  )}

                  {record?.status === 'absent' && (
                    <div className="bg-rose-50 text-rose-700 p-1 rounded border border-rose-100 flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase truncate">Mungesë</span>
                    </div>
                  )}

                  {record?.status === 'vacation' && (
                    <div className="bg-blue-50 text-blue-700 p-1 rounded border border-blue-100 flex items-center gap-1">
                      <Palmtree className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase truncate">Pushim</span>
                    </div>
                  )}

                  {record?.status === 'half-day' && (
                    <div className="bg-amber-50 text-amber-700 p-1 rounded border border-amber-100 flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase truncate">gjysmë dite</span>
                    </div>
                  )}
                </div>

                {isSameMonth(day, currentMonth) && (
                  <div className="absolute inset-0 bg-white/90 md:opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity z-10 backdrop-blur-sm px-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); markDay(day, 'absent'); }}
                      className="flex-1 h-8 flex items-center justify-center bg-rose-500 text-white rounded-lg shadow-sm"
                      title="Mungesë"
                    >
                      <Home className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); markDay(day, 'half-day'); }}
                      className="flex-1 h-8 flex items-center justify-center bg-amber-500 text-white rounded-lg shadow-sm"
                      title="Gjysmë dite"
                    >
                      <Timer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); markDay(day, 'vacation'); }}
                      className="flex-1 h-8 flex items-center justify-center bg-blue-500 text-white rounded-lg shadow-sm"
                      title="Pushim"
                    >
                      <Palmtree className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Briefcase className="w-5 h-5 text-emerald-500 mb-1" />
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Orar i plotë</p>
          <p className="text-xl font-black text-slate-800">{stats.fullDays} ditë</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Timer className="w-5 h-5 text-amber-500 mb-1" />
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Gjysmë orari</p>
          <p className="text-xl font-black text-slate-800">{stats.halfDays} ditë</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Star className="w-5 h-5 text-indigo-500 mb-1" />
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Të Shtuna</p>
          <p className="text-xl font-black text-slate-800">{stats.saturdays} d</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Zap className="w-5 h-5 text-indigo-600 mb-1" />
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Jashtë orarit</p>
          <p className="text-xl font-black text-slate-800">{stats.overtimeHours} h</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
          <Euro className="w-5 h-5 text-rose-500 mb-1" />
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Shpenzime</p>
          <p className="text-xl font-black text-rose-600">€{stats.totalExpenses.toFixed(0)}</p>
        </div>
      </div>

      {/* Details Dialog */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Detajet e ditës</p>
                <h3 className="text-xl font-black text-slate-800">{format(selectedDay, 'd MMMM yyyy')}</h3>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Attendance Info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500">Statusi i punës</p>
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                  {getDayRecord(selectedDay)?.checkIn ? (
                    <>
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CalendarCheck className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">Punuar</p>
                          {getDayRecord(selectedDay)?.isSaturday && (
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 rounded-full border border-indigo-100">EXTRA: E SHTUNË</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {format(new Date(getDayRecord(selectedDay)!.checkIn!), 'HH:mm')} - {getDayRecord(selectedDay)?.checkOut ? format(new Date(getDayRecord(selectedDay)!.checkOut!), 'HH:mm') : '...'}
                        </p>
                        {getDayRecord(selectedDay)?.overtimeHours ? (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                            <Zap className="w-3 h-3" />
                            Jashtë orarit: {getDayRecord(selectedDay)?.overtimeHours} orë
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        getDayRecord(selectedDay)?.status === 'absent' ? "bg-rose-100 text-rose-600" :
                        getDayRecord(selectedDay)?.status === 'vacation' ? "bg-blue-100 text-blue-600" :
                        getDayRecord(selectedDay)?.status === 'half-day' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {getDayRecord(selectedDay)?.status === 'absent' ? <Home className="w-6 h-6" /> :
                         getDayRecord(selectedDay)?.status === 'vacation' ? <Palmtree className="w-6 h-6" /> :
                         getDayRecord(selectedDay)?.status === 'half-day' ? <Timer className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">
                            {getDayRecord(selectedDay)?.status === 'absent' ? 'Mungesë' :
                             getDayRecord(selectedDay)?.status === 'vacation' ? 'Pushim' :
                             getDayRecord(selectedDay)?.status === 'half-day' ? 'Gjysmë dite' : 'Pa regjistrim'}
                          </p>
                          {getDayRecord(selectedDay)?.overtimeHours ? (
                            <span className="text-[10px] font-black text-indigo-600">+{getDayRecord(selectedDay)?.overtimeHours}h EXTRA</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500">Statusi aktual për këtë ditë</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Overtime Edit Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    Extra orë pas orarit
                  </p>
                  {!getDayRecord(selectedDay)?.checkOut && (
                    <button 
                      onClick={() => {
                        const dateStr = format(selectedDay, 'yyyy-MM-dd');
                        const allAttendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
                        const idx = allAttendance.findIndex((r: any) => r.userId === user?.uid && r.date === dateStr);
                        const checkIn = setMinutes(setHours(new Date(selectedDay), 8), 0).toISOString();
                        const checkOut = setMinutes(setHours(new Date(selectedDay), 16), 0).toISOString();
                        
                        if (idx !== -1) {
                          allAttendance[idx].checkIn = checkIn;
                          allAttendance[idx].checkOut = checkOut;
                          allAttendance[idx].status = 'present';
                        } else {
                          allAttendance.push({
                            id: Math.random().toString(36).substr(2, 9),
                            userId: user?.uid,
                            date: dateStr,
                            checkIn, checkOut,
                            status: 'present',
                            isSaturday: selectedDay.getDay() === 6
                          });
                        }
                        localStorage.setItem('pl_attendance', JSON.stringify(allAttendance));
                        refreshData();
                      }}
                      className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase"
                    >
                      Bëje Ditë të Plotë (08-16)
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="0.5"
                    value={dayOvertime}
                    onChange={(e) => setDayOvertime(e.target.value)}
                    placeholder="Oret p.sh 2"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  <button 
                    onClick={saveDayOvertime}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    Ruaj Orët
                  </button>
                </div>
              </div>

              {/* Expenses Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">Shpenzimet</p>
                  <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase">
                    Total: €{getDayExpenses(selectedDay).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  {getDayExpenses(selectedDay).length > 0 ? (
                    getDayExpenses(selectedDay).map(expense => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white text-slate-400 rounded-lg flex items-center justify-center border border-slate-100">
                            <Euro className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{expense.description}</p>
                            <p className="text-[10px] text-slate-400">{expense.category}</p>
                          </div>
                        </div>
                        <span className="font-black text-slate-700">€{expense.amount.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-slate-400 italic">Nuk ka shpenzime për këtë ditë.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setSelectedDay(null)}
                className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Mbyll
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
