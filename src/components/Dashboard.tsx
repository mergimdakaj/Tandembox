import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { AttendanceRecord, BreakRecord, ExpenseRecord } from '../types';
import { DashboardChart } from './DashboardChart';
import { WorkNotesSection } from './WorkNotesSection';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  Clock, 
  Check, 
  CheckCircle2,
  Timer,
  PlusCircle,
  Plus,
  History,
  Sun,
  Briefcase,
  Home,
  Palmtree,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { cn } from '../lib/utils';

// Shared task record structure
export interface TaskRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
}

interface DashboardProps {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}

export function Dashboard({ selectedDate, setSelectedDate }: DashboardProps) {
  const { user, showToast } = useAuth();
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tasks state
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [allUncompletedTasks, setAllUncompletedTasks] = useState<TaskRecord[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Local state copy for UI sliders/inputs
  const [overtime, setOvertime] = useState(0);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Dynamic check for working hours near completion
  useEffect(() => {
    if (!currentAttendance?.checkIn || currentAttendance?.checkOut) return;

    const checkWorkingHoursCompletion = () => {
      const checkInTime = new Date(currentAttendance.checkIn).getTime();
      const now = new Date().getTime();
      const elapsedHours = (now - checkInTime) / (3600 * 1000);

      // Notify if user worked >= 7.5 hours and less than 8.2 hours
      if (elapsedHours >= 7.5 && elapsedHours < 8.2) {
        const lastAlert = localStorage.getItem(`pl_work_hours_alert_${currentAttendance.date}`);
        if (!lastAlert) {
          showToast('⏳ Koha e rregullt e punës është pranë përfundimit! Mos harroni të bëni Sign Out bashkë me shënimet tuaja.', 'info');
          localStorage.setItem(`pl_work_hours_alert_${currentAttendance.date}`, 'true');
        }
      }
    };

    // Run on startup
    checkWorkingHoursCompletion();

    // Recheck every 60 seconds
    const timer = setInterval(checkWorkingHoursCompletion, 60000);
    return () => clearInterval(timer);
  }, [currentAttendance, showToast]);

  // Load attendance record, breaks, and tasks for the active date Str
  useEffect(() => {
    if (!user) return;

    const loadData = () => {
      const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
      const record = attendance.find((r: AttendanceRecord) => r.userId === user.uid && r.date === dateStr);
      
      setCurrentAttendance(record || null);
      setOvertime(record?.overtimeHours || 0);

      // Load all records for the current month
      const activeMonthStr = format(selectedDate, 'yyyy-MM');
      const currentMonthRecords = attendance.filter((r: AttendanceRecord) => 
        r.userId === user.uid && r.date.startsWith(activeMonthStr)
      );
      setMonthlyRecords(currentMonthRecords);

      // Load tasks
      const allTasks = JSON.parse(localStorage.getItem('pl_tasks') || '[]');
      const filteredTasks = allTasks.filter((t: TaskRecord) => t.userId === user.uid && t.date === dateStr);
      setTasks(filteredTasks);

      // Load all uncompleted tasks globally for notification warning
      const uncompletedTasks = allTasks.filter((t: TaskRecord) => t.userId === user.uid && !t.completed);
      setAllUncompletedTasks(uncompletedTasks);

      setLoading(false);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user, dateStr, selectedDate]);

  const saveAttendanceRecord = (record: AttendanceRecord) => {
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const index = attendance.findIndex((r: AttendanceRecord) => r.userId === user?.uid && r.date === dateStr);
    
    if (index !== -1) {
      attendance[index] = record;
    } else {
      attendance.push(record);
    }
    localStorage.setItem('pl_attendance', JSON.stringify(attendance));
    setCurrentAttendance(record);
    window.dispatchEvent(new Event('storage'));
  };

  const handleCheckIn = () => {
    if (!user) return;
    const isSaturday = selectedDate.getDay() === 6;

    const item: AttendanceRecord = {
      id: currentAttendance?.id || Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      date: dateStr,
      checkIn: new Date().toISOString(),
      status: 'present',
      isSaturday,
      overtimeHours: overtime,
    };
    saveAttendanceRecord(item);
  };

  const handleCheckOut = () => {
    if (!currentAttendance) return;
    const item: AttendanceRecord = {
      ...currentAttendance,
      checkOut: new Date().toISOString(),
    };
    saveAttendanceRecord(item);
  };

  const toggleHalfDay = () => {
    if (!user) return;
    const isSaturday = selectedDate.getDay() === 6;
    const targetStatus = currentAttendance?.status === 'half-day' ? 'present' : 'half-day';

    const item: AttendanceRecord = {
      id: currentAttendance?.id || Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      date: dateStr,
      status: targetStatus,
      isSaturday,
      overtimeHours: overtime,
    };
    saveAttendanceRecord(item);
  };

  const markFullDayVal = () => {
    if (!user) return;
    const checkIn = setMinutes(setHours(new Date(selectedDate), 8), 0).toISOString();
    const checkOut = setMinutes(setHours(new Date(selectedDate), 16), 0).toISOString();
    const isSaturday = selectedDate.getDay() === 6;

    const item: AttendanceRecord = {
      id: currentAttendance?.id || Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      date: dateStr,
      checkIn,
      checkOut,
      status: 'present',
      isSaturday,
      overtimeHours: overtime,
    };
    saveAttendanceRecord(item);
  };

  const changeOvertimeVal = (delta: number) => {
    const newVal = Math.max(0, overtime + delta);
    setOvertime(newVal);

    if (currentAttendance) {
      const item: AttendanceRecord = {
        ...currentAttendance,
        overtimeHours: newVal,
      };
      saveAttendanceRecord(item);
    }
  };

  const handleMarkNoWork = () => {
    if (!user) return;
    const item: AttendanceRecord = {
      id: currentAttendance?.id || Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      date: dateStr,
      status: 'absent',
    };
    saveAttendanceRecord(item);
  };

  const handleMarkHoliday = () => {
    if (!user) return;
    const item: AttendanceRecord = {
      id: currentAttendance?.id || Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      date: dateStr,
      status: 'holiday',
    };
    saveAttendanceRecord(item);
  };

  const handleResetDay = () => {
    const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
    const filtered = attendance.filter((r: AttendanceRecord) => !(r.userId === user?.uid && r.date === dateStr));
    localStorage.setItem('pl_attendance', JSON.stringify(filtered));

    setCurrentAttendance(null);
    setOvertime(0);
    window.dispatchEvent(new Event('storage'));
  };

  // Checklist action triggers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskText.trim()) return;

    const newTask: TaskRecord = {
      id: Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      date: dateStr,
      text: newTaskText.trim(),
      completed: false,
    };

    const allTasks = JSON.parse(localStorage.getItem('pl_tasks') || '[]');
    allTasks.push(newTask);
    localStorage.setItem('pl_tasks', JSON.stringify(allTasks));

    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
    window.dispatchEvent(new Event('storage'));
  };

  const toggleTask = (id: string) => {
    let wasCheckedAsUnfinished = false;
    let taskName = '';
    const allTasks = JSON.parse(localStorage.getItem('pl_tasks') || '[]');
    const updated = allTasks.map((t: TaskRecord) => {
      if (t.id === id) {
        if (t.completed) {
          wasCheckedAsUnfinished = true;
          taskName = t.text;
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    localStorage.setItem('pl_tasks', JSON.stringify(updated));
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
    window.dispatchEvent(new Event('storage'));

    if (wasCheckedAsUnfinished) {
      showToast(`⚠️ Detyra "${taskName || 'Detyra'}" u shënua si e pakryer / papërfunduar!`, 'warning');
    } else {
      showToast(`✅ Detyra u shënua si e përfunduar me sukses!`, 'success');
    }
  };

  const deleteTask = (id: string) => {
    const allTasks = JSON.parse(localStorage.getItem('pl_tasks') || '[]');
    const filtered = allTasks.filter((t: TaskRecord) => t.id !== id);
    localStorage.setItem('pl_tasks', JSON.stringify(filtered));
    setTasks(prev => prev.filter(t => t.id !== id));
    window.dispatchEvent(new Event('storage'));
  };

  if (loading) return null;

  // Status computation for header tag
  const getStatusText = () => {
    if (currentAttendance?.status === 'holiday') return 'DITË PUSHIMI';
    if (currentAttendance?.status === 'absent') return 'JO PUNE SOT';
    if (currentAttendance?.checkOut) return 'PUNA PËRFUNDOI';
    if (currentAttendance?.status === 'half-day') return 'GJYSMË DITE';
    if (currentAttendance?.checkIn) return 'DUKE PUNUAR';
    return 'PUNA SKAS FILLUAR';
  };

  const getStatusColorClass = () => {
    if (currentAttendance?.status === 'holiday') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (currentAttendance?.status === 'absent') return 'text-rose-500 bg-rose-50 border-rose-100';
    if (currentAttendance?.checkOut) return 'text-slate-400 bg-slate-50 border-slate-100';
    if (currentAttendance?.status === 'half-day') return 'text-indigo-500 bg-indigo-50 border-indigo-100';
    if (currentAttendance?.checkIn) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    return 'text-slate-300 bg-slate-50 border-dashed border-slate-200';
  };

  const completedTasksCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">

      {/* NOTIFICATION BOX PREMIUM ALERT (QKA NUK KOM KRY) */}
      {user?.role === 'admin' && (
        <AnimatePresence>
          {allUncompletedTasks.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-amber-50/90 border border-amber-200/80 rounded-[28px] p-5 space-y-3 shadow-md shadow-amber-500/5 relative overflow-hidden"
            >
              {/* Ambient decorative warning highlight indicator gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0 animate-pulse mt-0.5">
                  <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider leading-snug">
                    Njoftim: Detyra të Pakryera!
                  </h4>
                  <p className="text-[10px] font-semibold text-amber-600 mt-0.5 leading-tight">
                    Keni <span className="font-extrabold text-amber-700">{allUncompletedTasks.length} detyra</span> të papërfunduara në total. Klikoni mbi to për të shkuar te data ose kryejini direkt këtu:
                  </p>
                </div>
              </div>

              {/* List of uncompleted tasks scrollable */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {allUncompletedTasks.map((task) => {
                  const taskDateParsed = new Date(task.date);
                  const isSelectedDate = task.date === dateStr;

                  return (
                    <div 
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors",
                        isSelectedDate 
                          ? "bg-[#fff9eb] border-amber-200/60" 
                          : "bg-white/80 border-slate-100 hover:border-amber-200/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 w-5/6">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className="w-4.5 h-4.5 rounded-full border border-amber-400 bg-white hover:bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 transition-colors"
                          title="Shëno si të kryer"
                        >
                          <Check className="w-3 h-3 stroke-[3.5]" />
                        </button>

                        <span 
                          onClick={() => {
                            const parsed = new Date(task.date + "T12:00:00");
                            setSelectedDate(parsed);
                          }}
                          className="font-bold text-slate-700 hover:text-amber-700 cursor-pointer break-all truncate text-[11px] select-none"
                          title="Zgjidh këtë datë"
                        >
                          {task.text}
                        </span>
                      </div>

                      <span 
                        onClick={() => {
                          const parsed = new Date(task.date + "T12:00:00");
                          setSelectedDate(parsed);
                        }}
                        className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded-lg border flex-shrink-0 select-none cursor-pointer uppercase tracking-wider font-mono",
                          isSelectedDate 
                            ? "bg-amber-100 text-amber-700 border-amber-200" 
                            : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100"
                        )}
                      >
                        {format(taskDateParsed, 'dd/MM')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* DETYRAT DITORE CHECKLIST (Placed at the top) */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100/60">
            <div>
              <h4 className="text-base font-black text-slate-800 tracking-tight">Detyrat Ditore</h4>
              <p className="text-slate-400 text-[10px] font-semibold">Projektet për gjatë ditës së zgjedhur.</p>
            </div>
            
            <span className="text-[10px] font-black text-indigo-600 bg-[#f3f2ff] border border-[#e6e4ff] px-2.5 py-1 rounded-xl leading-none">
              {tasks.length > 0 ? `${completedTasksCount}/${tasks.length} Kryer` : '0 Puna'}
            </span>
          </div>

          {/* Dynamic Task List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:bg-slate-50/50 Group",
                  task.completed ? "bg-slate-50 border-slate-100/65 opacity-65" : "bg-white border-slate-100"
                )}
              >
                <div className="flex items-center gap-3 w-5/6">
                  {/* Custom circular checkbox trigger */}
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90",
                      task.completed 
                        ? "bg-indigo-600 border-indigo-700 text-white" 
                        : "border-slate-300 bg-white hover:border-slate-400"
                    )}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <span className={cn(
                    "text-xs font-semibold leading-tight break-all cursor-pointer select-none",
                    task.completed ? "text-slate-400 line-through" : "text-slate-700"
                  )}
                  onClick={() => toggleTask(task.id)}
                  >
                    {task.text}
                  </span>
                </div>

                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-6 text-slate-300 italic text-xs">
                S'ka detyra të regjistruara për këtë datë.
              </div>
            )}
          </div>

          {/* Input adding Form */}
          <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
            <input 
              type="text" 
              placeholder="Shkruani një detyrë të re..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 placeholder-slate-400 text-xs font-medium outline-none focus:bg-white focus:border-[#4239b3] focus:ring-1 focus:ring-[#4239b3]/20 transition-all font-sans"
              required
            />
            <button 
              type="submit"
              className="w-10 h-10 rounded-full bg-[#4239b3] text-white flex items-center justify-center hover:bg-[#342caa] transition-all active:scale-95 flex-shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}

      {/* SEKSIONI I DEDIKUAR PER SHËNIMET E PUNËS / PRERJES */}
      <WorkNotesSection selectedDate={selectedDate} />

      {/* STATUSI I DITES HEADER BOX */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Statusi i Ditës
          </span>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border leading-none transition-all duration-300", 
            getStatusColorClass()
          )}>
            {getStatusText()}
          </span>
        </div>

        {/* List of interactive panels matching Screenshot 1/5 */}
        <div className="space-y-3.5">
          {/* 1. Chekin state bar */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/60 border border-slate-100/60 transition-all">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                currentAttendance?.checkIn ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
              )}>
                <Check className="w-4.5 h-4.5 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 leading-snug">
                  {currentAttendance?.checkIn ? "Duke punuar në kohë reale" : "Puna nuk mund të regjistrohet"}
                </p>
                <p className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">
                  {currentAttendance?.checkIn 
                    ? `Koha e hyrjes sot: ${format(new Date(currentAttendance.checkIn), 'HH:mm')}` 
                    : "Regjistroni hyrjen për të filluar ndjekjen automatike"}
                </p>
              </div>
            </div>

            {/* If not checked in, show check-in trigger */}
            {!currentAttendance?.checkIn && (
              <button 
                onClick={handleCheckIn}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-current" /> Hyr
              </button>
            )}
          </div>

          {/* 2. Half Day Toggle Switch Option */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/60 border border-slate-100/60 transition-all">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                currentAttendance?.status === 'half-day' ? "bg-amber-100 text-amber-500" : "bg-slate-200 text-slate-400"
              )}>
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 leading-snug">
                  Statusi: {currentAttendance?.status === 'half-day' ? "Gjysmë dite" : "Orar i plotë"}
                </p>
                <p className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">
                  {currentAttendance?.status === 'half-day' ? "Gjysmë pune (4 orë)" : "Punë e plotë (8 orë)"}
                </p>
              </div>
            </div>

            {/* Custom Interactive Switch Handle */}
            <button 
              onClick={toggleHalfDay}
              className={cn(
                "w-11 h-6 rounded-full p-0.5 transition-colors relative focus:outline-none flex items-center shadow-sm border",
                currentAttendance?.status === 'half-day' ? "bg-indigo-600 border-indigo-700" : "bg-slate-200 border-slate-300"
              )}
            >
              <div className={cn(
                "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm transform",
                currentAttendance?.status === 'half-day' ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>

          {/* 3. Overtime hours Stepper Control */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/60 border border-slate-100/60 transition-all">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                overtime > 0 ? "bg-indigo-100 text-[#4239b3]" : "bg-slate-200 text-slate-400"
              )}>
                <Timer className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 leading-snug">
                  Orë shtesë (Paguhen Extra)
                </p>
                <p className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">
                  {overtime > 0 ? `Shtuar +${overtime.toFixed(1)}h orë shtesë sot` : "Pa orë shtesë"}
                </p>
              </div>
            </div>

            {/* Incrementor Buttons Row */}
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => changeOvertimeVal(-0.5)}
                disabled={overtime <= 0}
                className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
              >
                -
              </button>
              <span className="text-xs font-black text-slate-800 w-8 text-center select-none font-mono">
                {overtime.toFixed(1)}h
              </span>
              <button 
                onClick={() => changeOvertimeVal(0.5)}
                className="w-6 h-6 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4239b3] font-bold flex items-center justify-center text-xs transition-all active:scale-95"
              >
                +
              </button>
            </div>
          </div>



          {/* 5. Big Exit / Close Day button */}
          {currentAttendance?.checkIn && !currentAttendance?.checkOut && (
            <button 
              onClick={handleCheckOut}
              className="w-full mt-2 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 uppercase text-xs tracking-wider"
            >
              <Square className="w-4 h-4 fill-current text-white/90" />
              Mbyll Ditën e Punës (Dalje)
            </button>
          )}
        </div>
      </div>

      {/* QUICK INACTIVE ALTERNATIVES FOR ABSENCE OR HOLIDAYS */}
      {!currentAttendance?.checkIn && (
        <div className="grid grid-cols-2 gap-3.5">
          <button 
            onClick={handleMarkNoWork}
            className={cn(
              "p-4 rounded-3xl border text-center flex flex-col items-center justify-center gap-1 bg-white hover:border-slate-300 transition-all duration-200 active:scale-95 shadow-sm",
              currentAttendance?.status === 'absent' && 'ring-2 ring-rose-500 border-transparent bg-rose-50/20'
            )}
          >
            <Home className="w-6 h-6 text-rose-500 mb-1" />
            <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Jo Punë Sot</span>
            <span className="text-[8px] text-slate-400 font-bold">Mungesë</span>
          </button>

          <button 
            onClick={handleMarkHoliday}
            className={cn(
              "p-4 rounded-3xl border text-center flex flex-col items-center justify-center gap-1 bg-white hover:border-slate-300 transition-all duration-200 active:scale-95 shadow-sm",
              currentAttendance?.status === 'holiday' && 'ring-2 ring-emerald-500 border-transparent bg-emerald-50/20'
            )}
          >
            <Palmtree className="w-6 h-6 text-emerald-500 mb-1" />
            <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Festë Zyrtare</span>
            <span className="text-[8px] text-slate-400 font-bold">Pushim me Pagesë</span>
          </button>
        </div>
      )}

      {/* FULL DAY PRESET AND TEST RESET CLOCK ACTIONS */}
      {!currentAttendance?.checkIn ? (
        <button 
          onClick={markFullDayVal}
          className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Sun className="w-5 h-5" /> Regjistro orar të plotë (08:00 - 16:00)
        </button>
      ) : (
        <div className="flex justify-end text-slate-400">
          <button 
            onClick={handleResetDay}
            className="text-[9px] font-black uppercase tracking-widest bg-red-50 border border-red-100 text-red-500 px-3.5 py-1.5 rounded-xl hover:bg-rose-600 hover:text-white hover:border-transparent transition-all active:scale-95 duration-200"
          >
            Reset Ditën
          </button>
        </div>
      )}

    </div>
  );
}
