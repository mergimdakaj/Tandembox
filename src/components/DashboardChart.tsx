import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { AttendanceRecord } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getWeekOfMonth,
  parseISO
} from 'date-fns';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid
} from 'recharts';
import { 
  Clock, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  CalendarDays,
  Target,
  Award,
  User,
  Coins,
  Settings2,
  X,
  Euro
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardChartProps {
  records?: AttendanceRecord[];
  selectedDate: Date;
}

export function DashboardChart({ records, selectedDate }: DashboardChartProps) {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<'weekly' | 'daily'>('weekly');
  
  // Selection states for administrators
  const isAdmin = user?.role === 'admin';
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);

  // Hourly wage rates setup with fallback and state
  const [normalRate, setNormalRate] = useState<number>(5.00);
  const [overtimeRate, setOvertimeRate] = useState<number>(7.50);
  const [showRateModal, setShowRateModal] = useState(false);
  const [inputNormal, setInputNormal] = useState('5.00');
  const [inputOvertime, setInputOvertime] = useState('7.50');

  useEffect(() => {
    if (selectedUserId) {
      const persistedNormal = localStorage.getItem(`pl_wage_normal_rate_${selectedUserId}`) 
        || localStorage.getItem('pl_wage_normal_rate') 
        || '5.00';
      const persistedOvertime = localStorage.getItem(`pl_wage_overtime_rate_${selectedUserId}`)
        || localStorage.getItem('pl_wage_overtime_rate')
        || '7.50';
      
      setNormalRate(parseFloat(persistedNormal));
      setOvertimeRate(parseFloat(persistedOvertime));
      setInputNormal(persistedNormal);
      setInputOvertime(persistedOvertime);
    }
  }, [selectedUserId]);

  const saveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNorm = parseFloat(inputNormal) || 0;
    const rateOvr = parseFloat(inputOvertime) || 0;

    setNormalRate(rateNorm);
    setOvertimeRate(rateOvr);
    
    if (selectedUserId) {
      localStorage.setItem(`pl_wage_normal_rate_${selectedUserId}`, rateNorm.toFixed(2));
      localStorage.setItem(`pl_wage_overtime_rate_${selectedUserId}`, rateOvr.toFixed(2));
      
      // Also save as global default if changing own or none specific
      if (selectedUserId === user?.uid) {
        localStorage.setItem(`pl_wage_normal_rate`, rateNorm.toFixed(2));
        localStorage.setItem(`pl_wage_overtime_rate`, rateOvr.toFixed(2));
      }
    }
    
    window.dispatchEvent(new Event('storage'));
    setShowRateModal(false);
  };

  useEffect(() => {
    if (user) {
      setSelectedUserId(user.uid);
    }
  }, [user]);

  // Load registered users and update full attendance
  useEffect(() => {
    const handleStorageUpdate = () => {
      const storedUsers = JSON.parse(localStorage.getItem('pl_users') || '[]');
      const list = [...storedUsers];
      
      // Ensure current user is in list 
      if (user && !list.some(u => u.uid === user.uid)) {
        list.push({ uid: user.uid, name: user.name || 'Përdorues', email: user.email });
      }
      
      // Ensure mergim-id fallback exists
      if (!list.some(u => u.uid === 'mergim-id')) {
        list.push({ uid: 'mergim-id', name: 'Mergim', email: 'mergim@primelink.com' });
      }

      setEmployees(list);

      const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
      setAllAttendance(attendance);
    };

    handleStorageUpdate();
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [user]);

  // Determine active records based on selected user or generic props
  const activeMonthStr = format(selectedDate, 'yyyy-MM');
  const activeRecords = selectedUserId
    ? allAttendance.filter(r => r.userId === selectedUserId && r.date.startsWith(activeMonthStr))
    : (records || allAttendance.filter(r => r.userId === user?.uid && r.date.startsWith(activeMonthStr)));

  // Calculates regular & overtime hours for a given attendance record
  const calculateHours = (record: AttendanceRecord) => {
    const overtime = record.overtimeHours || 0;
    let regular = 0;

    if (record.status === 'present') {
      if (record.checkIn && record.checkOut) {
        const diff = (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (3600 * 1000);
        regular = Math.min(8, Math.max(0, diff));
      } else if (record.checkIn) {
        const isTodayStr = format(new Date(), 'yyyy-MM-dd');
        if (record.date === isTodayStr) {
          const diff = (new Date().getTime() - new Date(record.checkIn).getTime()) / (3600 * 1000);
          regular = Math.min(8, Math.max(0, diff));
        } else {
          regular = 8;
        }
      } else {
        regular = 8;
      }
    } else if (record.status === 'half-day') {
      regular = 4;
    }

    return { regular, overtime };
  };

  // Compile monthly statistics
  const totalRegular = activeRecords.reduce((sum, r) => sum + calculateHours(r).regular, 0);
  const totalOvertime = activeRecords.reduce((sum, r) => sum + calculateHours(r).overtime, 0);
  const totalWorked = totalRegular + totalOvertime;
  
  // Weekly aggregation code
  const daysInMonth = eachDayOfInterval({ 
    start: startOfMonth(selectedDate), 
    end: endOfMonth(selectedDate) 
  });

  const weeklyDataMap: { [key: number]: { regular: number; overtime: number } } = {
    1: { regular: 0, overtime: 0 },
    2: { regular: 0, overtime: 0 },
    3: { regular: 0, overtime: 0 },
    4: { regular: 0, overtime: 0 },
    5: { regular: 0, overtime: 0 },
    6: { regular: 0, overtime: 0 },
  };

  daysInMonth.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = activeRecords.find(r => r.date === dateStr);
    const weekNum = getWeekOfMonth(day, { weekStartsOn: 1 }); // Monday start

    if (record) {
      const { regular, overtime } = calculateHours(record);
      if (weeklyDataMap[weekNum]) {
        weeklyDataMap[weekNum].regular += regular;
        weeklyDataMap[weekNum].overtime += overtime;
      }
    }
  });

  const weeklyChartData = Object.keys(weeklyDataMap)
    .map(key => {
      const num = parseInt(key);
      return {
        name: `Java ${num}`,
        'Orë Pune': parseFloat(weeklyDataMap[num].regular.toFixed(1)),
        'Orë Shtesë': parseFloat(weeklyDataMap[num].overtime.toFixed(1)),
      };
    })
    .filter(item => item['Orë Pune'] > 0 || item['Orë Shtesë'] > 0);

  // Daily chronological aggregation code 
  const dailyChartData = activeRecords
    .map(record => {
      const { regular, overtime } = calculateHours(record);
      let dayLabel = '';
      try {
        dayLabel = format(new Date(record.date + 'T12:00:00'), 'dd/MM');
      } catch (e) {
        dayLabel = record.date;
      }
      return {
        name: dayLabel,
        'Orë Pune': parseFloat(regular.toFixed(1)),
        'Orë Shtesë': parseFloat(overtime.toFixed(1)),
        rawDate: record.date,
      };
    })
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 shadow-2xl border border-slate-800 rounded-2xl p-3 text-white text-[11px] font-sans font-semibold space-y-1.5 min-w-[130px]">
          <p className="text-[#a599ff] font-black text-[9px] uppercase tracking-widest">{label}</p>
          <div className="space-y-1 font-bold">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-mono text-white">{entry.value}h</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = viewType === 'weekly' ? weeklyChartData : dailyChartData;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100/60">
        <div className="space-y-1">
          <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#4239b3]" />
            Analiza e Orëve të Punës
          </h4>
          <p className="text-slate-400 text-[10px] font-semibold">
            Krahasimi i orëve të rregullta kundrejt orëve shtesë për muajin {format(selectedDate, 'MMMM yyyy')}
          </p>
        </div>

        {/* Administrator profile Selector Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-2 bg-[#f4f2ff] border border-indigo-100 rounded-xl px-3.5 py-1.5">
              <User className="w-3.5 h-3.5 text-[#4239b3]" />
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-transparent text-[10px] font-black text-[#4239b3] uppercase tracking-wider outline-none cursor-pointer"
              >
                {employees.map(emp => (
                  <option key={emp.uid} value={emp.uid}>
                    {emp.name || emp.email || emp.uid}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle (Weekly / Daily) */}
          <div className="flex items-center p-1 bg-slate-50 border border-slate-200/50 rounded-xl">
            <button
              onClick={() => setViewType('weekly')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                viewType === 'weekly'
                  ? 'bg-white text-[#4239b3] shadow-xs border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-3 h-3" /> Javore
            </button>
            <button
              onClick={() => setViewType('daily')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                viewType === 'daily'
                  ? 'bg-white text-[#4239b3] shadow-xs border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3 h-3" /> Ditore
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#fcfcff] border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 leading-none">
            <Clock className="w-3 h-3 text-[#4239b3]" /> PRregullta
          </span>
          <div className="mt-2.5 flex items-baseline gap-0.5">
            <span className="text-xl font-black text-slate-800 leading-none">{totalRegular.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-slate-400">orë</span>
          </div>
        </div>

        <div className="bg-[#fffcfa] border border-[#fffaeb] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1 leading-none">
            <Zap className="w-3 h-3 text-amber-500" /> Overtime
          </span>
          <div className="mt-2.5 flex items-baseline gap-0.5">
            <span className="text-xl font-black text-amber-600 leading-none">{totalOvertime.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-amber-400">orë</span>
          </div>
        </div>

        <div className="bg-[#f5fbf7] border border-[#eef9f1] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1 leading-none">
            <Target className="w-3 h-3 text-emerald-500" /> Totali i Punës
          </span>
          <div className="mt-2.5 flex items-baseline gap-0.5">
            <span className="text-xl font-black text-emerald-700 leading-none">{totalWorked.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-slate-400">orë</span>
          </div>
        </div>
      </div>

      {/* Paga / Salary Llogaritësi Block */}
      <div className="bg-indigo-950 text-white rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-900 shadow-md relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 flex-shrink-0 animate-pulse">
            <Coins className="w-5.5 h-5.5 stroke-[2]" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5 leading-none">
              Paga e Llogaritur ({format(selectedDate, 'MMMM yyyy')})
            </span>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-xl sm:text-2xl font-black tracking-tight select-all">
                € {((totalRegular * normalRate) + (totalOvertime * overtimeRate)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-bold text-indigo-200">
                (Normale: €{normalRate}/h • Shtesë: €{overtimeRate}/h)
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowRateModal(true)}
          className="z-10 bg-white/10 hover:bg-white/15 text-indigo-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all text-center shrink-0 border border-white/5"
        >
          <Settings2 className="w-3.5 h-3.5" /> Vendos Tarifat
        </button>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Award className="w-8 h-8 text-slate-300 mb-2" />
          <h5 className="text-xs font-bold text-slate-400">Nuk ka të dhëna për këtë muaj</h5>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
            Nuk ka hyrje-dalje të regjistruara për periudhën e përzgjedhur.
          </p>
        </div>
      ) : (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={9} 
                fontWeight={700}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={9} 
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                iconSize={6}
                formatter={(value) => (
                  <span className="text-[10px] font-bold text-slate-600 px-1">{value}</span>
                )}
                wrapperStyle={{ paddingBottom: 15 }}
              />
              <Bar 
                dataKey="Orë Pune" 
                fill="#4239b3" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={28}
              />
              <Bar 
                dataKey="Orë Shtesë" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rate Editing Modal */}
      <AnimatePresence>
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-7 border border-slate-100 text-slate-800"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black tracking-tight text-slate-800 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-indigo-600" /> Tarifat e Pagesës
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Rregullo pagesën për orë pune për punonjësin
                  </p>
                </div>
                <button 
                  onClick={() => setShowRateModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={saveRates} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Ora Normale (€/h)
                  </label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="5.00"
                      value={inputNormal}
                      onChange={(e) => setInputNormal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-5 py-3.5 outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Ora Shtesë (Overtime €/h)
                  </label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="7.50"
                      value={inputOvertime}
                      onChange={(e) => setInputOvertime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-5 py-3.5 outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setShowRateModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-[11px] uppercase tracking-wider"
                  >
                    Anulo
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-[#4239b3] text-white font-black rounded-2xl hover:bg-[#342caa] transition-all shadow-lg shadow-[#4239b3]/20 text-[11px] uppercase tracking-wider"
                  >
                    Ruaj Tarifat
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
