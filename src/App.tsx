import { useEffect, useState, createContext, useContext } from 'react';
import { 
  Calendar as CalendarIcon, 
  Settings, 
  LogOut, 
  Wallet, 
  LayoutList,
  CalendarDays,
  Bell,
  TrendingUp,
  Users,
  ArrowLeft,
  Sun,
  CheckCircle,
  AlertCircle,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from './types';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { ExpensesView } from './components/ExpensesView';
import { AdminPanel } from './components/AdminPanel';
import { NotificationsView } from './components/NotificationsView';
import { checkAndTriggerWorkReminders } from './lib/notifications';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { TandemboxCalculator } from './components/TandemboxCalculator';
import { KuzhinaProStudio } from './components/KuzhinaProStudio';
import { LOGO_DATA_URL } from './assets/logo';
import { DashboardChart } from './components/DashboardChart';
import { cn } from './lib/utils';
import { format, addDays } from 'date-fns';
import { 
  testFirebaseConnection, 
  syncAllFromFirebase, 
  syncAllToFirebase, 
  initSyncCache, 
  syncLocalChangesToFirebase 
} from './lib/firebase';

type View = 'dashboard' | 'calendar' | 'notifications' | 'expenses' | 'admin' | 'salary';
type AppMode = 'portal' | 'work-management' | 'calculator' | 'kuzhina-pro';


interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (user: { uid: string; email: string }, profile: UserProfile) => void;
  logout: () => void;
  firebaseConnected: boolean;
  firebaseError: string | null;
  syncing: boolean;
  triggerManualSyncUp: () => Promise<void>;
  triggerManualSyncDown: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  login: () => {},
  logout: () => {},
  firebaseConnected: false,
  firebaseError: null,
  syncing: false,
  triggerManualSyncUp: async () => {},
  triggerManualSyncDown: async () => {},
  showToast: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [appMode, setAppMode] = useState<AppMode>('portal');
  
  // High fidelity selectedDate state synchronized globally with top visual scroller
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Toast notification state
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [pushModalAlert, setPushModalAlert] = useState<{ title: string; body: string } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    const handleToastEvent = (e: any) => {
      if (e.detail && e.detail.message) {
        showToast(e.detail.message, e.detail.type || 'info');
      }
    };
    const handlePushAlert = (e: any) => {
      if (e.detail && e.detail.title) {
        setPushModalAlert({ title: e.detail.title, body: e.detail.body });
      }
    };
    window.addEventListener('show-toast', handleToastEvent);
    window.addEventListener('mergim_push_alert', handlePushAlert);
    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
      window.removeEventListener('mergim_push_alert', handlePushAlert);
    };
  }, []);

  // Dynamic status indicators badges
  const [uncompletedTasksCount, setUncompletedTasksCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Ensure pl_users is initialized on startup so fresh or guest sessions can log in
    const existingUsers = localStorage.getItem('pl_users');
    if (!existingUsers || JSON.parse(existingUsers).length === 0) {
      const defaultUsers = [
        {
          uid: 'mergim-id',
          name: 'Administrator',
          email: 'admin',
          role: 'admin',
          password: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('pl_users', JSON.stringify(defaultUsers));
    }

    const savedUser = localStorage.getItem('pl_user');
    const savedProfile = localStorage.getItem('pl_profile');
    
    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));
      setAppMode('work-management');
    }
    setLoading(false);
  }, []);

  // Synchronize with Firebase Firestore
  useEffect(() => {
    async function initFirebaseSync() {
      const isConnected = await testFirebaseConnection();
      setFirebaseConnected(isConnected);
      const { lastFirebaseError } = await import('./lib/firebase');
      setFirebaseError(lastFirebaseError);
      
      if (isConnected) {
        setSyncing(true);
        try {
          // Pull down any fresh cloud data from Firebase
          await syncAllFromFirebase();
          console.log("Firebase connection established and database pulled down!");
        } catch (e) {
          console.error("Initial sync down failed, starting in cached offline mode:", e);
        } finally {
          setSyncing(false);
        }
      }
      
      // Initialize our memory change-tracker cache
      initSyncCache();

      // Listen for local writes (which emit standard 'storage' event) and mirror them to Firestore!
      const handleSyncTrigger = async () => {
        try {
          await syncLocalChangesToFirebase();
        } catch (err) {
          console.error("Failed to push changes to Firebase:", err);
        }
      };

      window.addEventListener('storage', handleSyncTrigger);
      return () => {
        window.removeEventListener('storage', handleSyncTrigger);
      };
    }

    initFirebaseSync();
  }, []);

  const triggerManualSyncUp = async () => {
    setSyncing(true);
    try {
      await syncAllToFirebase();
    } finally {
      setSyncing(false);
    }
  };

  const triggerManualSyncDown = async () => {
    setSyncing(true);
    try {
      await syncAllFromFirebase();
    } finally {
      setSyncing(false);
    }
  };

  // Listen to storage sync events to dynamically drive real-time counter changes
  useEffect(() => {
    if (!user) {
      setUncompletedTasksCount(0);
      setUnreadNotificationsCount(0);
      return;
    }

    const calculateCounts = () => {
      // Uncompleted tasks count
      const allTasks = JSON.parse(localStorage.getItem('pl_tasks') || '[]');
      const undone = allTasks.filter((t: any) => t.userId === user.uid && !t.completed).length;
      setUncompletedTasksCount(undone);

      // Unread notifications count
      const allNotifications = JSON.parse(localStorage.getItem('pl_notifications') || '[]');
      const unread = allNotifications.filter((n: any) => !n.readBy || !n.readBy.includes(user.uid)).length;
      setUnreadNotificationsCount(unread);

      // Automatic Work Schedule Reminders Check
      const todayStr = new Date().toISOString().split('T')[0];
      const attendance = JSON.parse(localStorage.getItem('pl_attendance') || '[]');
      const todayRecord = attendance.find((r: any) => r.userId === user.uid && r.date === todayStr);
      checkAndTriggerWorkReminders(user.uid, todayRecord, showToast);
    };

    calculateCounts();
    window.addEventListener('storage', calculateCounts);
    // Listen to localized custom updates inside the same tab
    const interval = setInterval(calculateCounts, 1200);

    return () => {
      window.removeEventListener('storage', calculateCounts);
      clearInterval(interval);
    };
  }, [user]);

  const login = (userData: { uid: string; email: string }, profileData: UserProfile) => {
    setUser(userData);
    setProfile(profileData);
    localStorage.setItem('pl_user', JSON.stringify(userData));
    localStorage.setItem('pl_profile', JSON.stringify(profileData));
    setAppMode('work-management');
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('pl_user');
    localStorage.removeItem('pl_profile');
    setAppMode('portal');
  };

  const getAlbanianDayName = (date: Date) => {
    const dayNames = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë'];
    return dayNames[date.getDay()];
  };

  const getAlbanianMonthName = (date: Date) => {
    const monthNames = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
    ];
    return monthNames[date.getMonth()];
  };

  const getAlbanianDayShort = (date: Date) => {
    const shortDays = ['Di', 'Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh'];
    return shortDays[date.getDay()];
  };

  const getAlbanianMonthShort = (date: Date) => {
    const shortMonths = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
    return shortMonths[date.getMonth()];
  };

  // Generate 5 days centered on the currently active selectedDate
  const generateDateScrollerCols = () => {
    const cols = [];
    for (let i = -2; i <= 2; i++) {
      const d = addDays(selectedDate, i);
      cols.push(d);
    }
    return cols;
  };

  const dateScrollerDays = generateDateScrollerCols();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': 
        return <Dashboard selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case 'calendar': 
        return <CalendarView />;
      case 'notifications': 
        return <NotificationsView />;
      case 'salary':
        return <DashboardChart selectedDate={selectedDate} />;
      case 'expenses': 
        return <ExpensesView />;
      case 'admin': 
        return <AdminPanel />;
      default: 
        return <Dashboard selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Detyrat', icon: LayoutList, badgeCount: uncompletedTasksCount },
    { id: 'calendar', label: 'Kalendari', icon: CalendarDays },
    { id: 'notifications', label: 'Njoftimet', icon: Bell, badgeCount: unreadNotificationsCount },
    { id: 'salary', label: 'Paga', icon: Coins },
    { id: 'expenses', label: 'Financat', icon: TrendingUp },
    ...(profile?.role === 'admin' ? [{ id: 'admin', label: 'Përdoruesit', icon: Users }] : []),
  ];

  const renderContent = () => {
    if (appMode === 'portal') {
      return <Landing 
        onSelectWork={() => setAppMode('work-management')} 
        onSelectCalc={() => setAppMode('calculator')} 
        onSelectAiStudio={() => setAppMode('kuzhina-pro')}
      />;
    }

    if (appMode === 'calculator') {
      return <TandemboxCalculator onBack={() => setAppMode('portal')} />;
    }

    if (appMode === 'kuzhina-pro') {
      return <KuzhinaProStudio onBack={() => setAppMode('portal')} showToast={showToast} />;
    }

    if (!user) {
      return <Login onBack={() => setAppMode('portal')} />;
    }

    // Active User Avatar Initial
    const userInitial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'A';

    return (
      // Slate background enclosing a highly polished iPhone/Smartphone container
      <div className="bg-[#0f111a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-0 sm:p-4 md:p-6 flex items-center justify-center min-h-screen text-slate-800 font-sans select-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Dynamic Smartphone Mockup Layout Frame */}
        <div className="w-full max-w-sm sm:max-w-md bg-[#fafbfe] sm:min-h-[85vh] sm:max-h-[94vh] sm:rounded-[48px] sm:ring-[14px] sm:ring-slate-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] relative flex flex-col overflow-hidden border border-slate-700/30 h-screen sm:h-auto">
          
          {/* TOAST PANEL OVERLAY */}
          <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none space-y-2">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -25, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                  className={cn(
                    "p-4 rounded-2xl border text-xs font-semibold shadow-lg flex items-start gap-3 pointer-events-auto backdrop-blur-md",
                    t.type === 'success' && "bg-emerald-50/95 border-emerald-100 text-emerald-800",
                    t.type === 'warning' && "bg-amber-50/95 border-amber-200 text-amber-800",
                    t.type === 'info' && "bg-indigo-50/95 border-indigo-100 text-indigo-900"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {t.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 animate-bounce" />}
                    {t.type === 'info' && <Bell className="w-4 h-4 text-[#4239b3]" />}
                  </div>
                  <div className="flex-1">
                    <p className="leading-tight text-[11px] font-black">{t.message}</p>
                  </div>
                  <button 
                    onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* TOP APPLET SCROLLING HEADER BODY */}
          <div className="flex-1 overflow-y-auto px-6 pt-7 pb-28 space-y-6 scrollbar-thin">
            
            {/* Top Shell Row Layout (Icon, title, buttons) */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                {/* Logo Indigo Circle with Spinning Face */}
                <div 
                  onClick={() => setAppMode('portal')}
                  className="w-11 h-11 bg-[#4239b3] rounded-full overflow-hidden flex items-center justify-center text-white border-2 border-indigo-500 shadow-md transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Kthehu në portal"
                >
                  <img 
                    src={LOGO_DATA_URL} 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-full"
                    style={{ animation: 'spin 10s linear infinite' }}
                  />
                </div>
                <div>
                  <h1 className="text-[#131131] text-base font-black tracking-tight leading-snug">Menaxhimi i Punës</h1>
                  <p className="text-slate-400 text-[10px] font-bold">
                    {getAlbanianDayName(selectedDate)}, {selectedDate.getDate()} {getAlbanianMonthName(selectedDate)}
                  </p>
                </div>
              </div>

              {/* Action Circle Buttons Row */}
              <div className="flex items-center gap-2">
                {/* Logout button */}
                <button 
                  onClick={logout} 
                  className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-500 shadow-sm hover:bg-rose-100 transition-all active:scale-95"
                  title="Shkyqu"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                
                {/* Avatar Icon Profile */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-[#fcfcff] flex items-center justify-center border border-indigo-100 text-[#4239b3] font-black text-xs shadow-inner">
                    {userInitial}
                  </div>
                  {/* Notifications Alert Dot badge count */}
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#d11122] border-2 border-white rounded-full text-[8.5px] text-white flex items-center justify-center font-black leading-none">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* HORIZONTAL DATE SELECTOR (ZGJIDHNI DATËN E PUNËS) */}
            <div className="space-y-2 mb-2">
              <p className="text-[9px] font-black uppercase text-[#4239b3] tracking-[0.18em] leading-none">
                Zgjidhni datën e punës
              </p>
              
              <div className="flex justify-between items-center gap-1.5 pt-1">
                {dateScrollerDays.map((dateVal, idx) => {
                  const isSelected = format(dateVal, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <button 
                      key={idx}
                      onClick={() => setSelectedDate(dateVal)}
                      className={cn(
                        "flex flex-col items-center justify-center flex-1 py-3 px-1.5 rounded-2xl border transition-all duration-300 select-none outline-none active:scale-95",
                        isSelected 
                          ? "bg-white border-[#e3e2ff] shadow-md shadow-[#4239b3]/5 scale-102 font-black border-b-[3px] border-b-[#4239b3]" 
                          : "bg-slate-100/50 border-transparent opacity-65 hover:opacity-100"
                      )}
                    >
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                        {getAlbanianMonthShort(dateVal)}
                      </span>
                      <span className={cn(
                        "text-lg font-black leading-none mb-1",
                        isSelected ? "text-[#4239b3]" : "text-slate-800"
                      )}>
                        {dateVal.getDate()}
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-400">
                        {getAlbanianDayShort(dateVal)}-{dateVal.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RENDER ACTIVE PAGE VIEW */}
            <div className="relative pt-1 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          {/* BOTTOM PREMIUM FIXED NAVIGATION */}
          <nav className="absolute bottom-0 left-0 right-0 bg-[#ffffff]/95 backdrop-blur-md border-t border-[#f1effc] py-3.5 px-3 flex justify-around items-center z-20 rounded-b-[44px]">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-[18px] transition-all relative outline-none select-none active:scale-90",
                    isActive ? "text-[#4239b3]" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {/* Icon with scaling effect and dynamic badges */}
                  <div className="relative">
                    <item.icon className={cn(
                      "w-[22px] h-[22px] transition-all duration-300",
                      isActive ? "scale-105 stroke-[2.5]" : "stroke-[2]"
                    )} />
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#d11122] text-white text-[8.5px] font-black w-4.5 h-4.5 rounded-full border border-white flex items-center justify-center leading-none shadow-sm animate-pulse">
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                  
                  {/* Small absolute indicator dot on active item */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 w-1.5 h-1.5 bg-[#4239b3] rounded-full" 
                    />
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    );
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      login, 
      logout,
      firebaseConnected,
      firebaseError,
      syncing,
      triggerManualSyncUp,
      triggerManualSyncDown,
      showToast
    }}>
      {renderContent()}

      {/* Push Notification Mobile Popup Alert Modal */}
      <AnimatePresence>
        {pushModalAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-500/80 rounded-[32px] p-6 max-w-sm w-full text-white shadow-2xl text-center space-y-4 relative overflow-hidden">
              <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-full flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/40 border-2 border-indigo-400/80 animate-bounce">
                ⏰
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-700/50">
                  Njoftim nga MergimGroup
                </span>
                <h3 className="text-xl font-black text-white mt-3 leading-snug">{pushModalAlert.title}</h3>
                <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">{pushModalAlert.body}</p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setPushModalAlert(null);
                    setCurrentView('dashboard');
                  }}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" /> Bëj Check-In Tani
                </button>
                <button
                  onClick={() => setPushModalAlert(null)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 font-bold rounded-2xl transition-all text-xs"
                >
                  Mbyll Njoftimin
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}
