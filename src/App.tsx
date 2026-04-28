import { useEffect, useState, createContext, useContext } from 'react';
import { 
  Calendar as CalendarIcon, 
  Settings, 
  LogOut, 
  Wallet, 
  LayoutDashboard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from './types';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { ExpensesView } from './components/ExpensesView';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { TandemboxCalculator } from './components/TandemboxCalculator';
import { cn } from './lib/utils';

type View = 'dashboard' | 'calendar' | 'expenses' | 'admin';
type AppMode = 'portal' | 'work-management' | 'calculator';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (user: { uid: string; email: string }, profile: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [appMode, setAppMode] = useState<AppMode>('portal');

  useEffect(() => {
    const savedUser = localStorage.getItem('pl_user');
    const savedProfile = localStorage.getItem('pl_profile');
    
    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));
      setAppMode('work-management');
    }
    setLoading(false);
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    if (appMode === 'portal') {
      return <Landing 
        onSelectWork={() => setAppMode('work-management')} 
        onSelectCalc={() => setAppMode('calculator')} 
      />;
    }

    if (appMode === 'calculator') {
      return <TandemboxCalculator onBack={() => setAppMode('portal')} />;
    }

    if (!user) {
      return <Login onBack={() => setAppMode('portal')} />;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen transition-all">
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              MG
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">MergimGroup</span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  currentView === item.id 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  currentView === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
                )} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium text-xs">
                {profile?.name?.split(' ').map(n => n[0]).join('') || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name || 'Përdorues'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{profile?.role}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Shkyqu</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-24 md:pb-0 relative h-screen overflow-y-auto">
          {/* Header - Mobile */}
          <header className="md:hidden bg-white px-6 py-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="font-bold text-lg tracking-tight">MergimGroup</span>
            </div>
            <button 
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center text-rose-500 rounded-full bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Nav - Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 flex justify-around items-center z-20">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all",
                currentView === item.id ? "text-indigo-600" : "text-slate-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <CalendarView />;
      case 'expenses': return <ExpensesView />;
      case 'admin': return profile?.role === 'admin' ? <AdminPanel /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Paneli', icon: LayoutDashboard },
    { id: 'calendar', label: 'Kalendari', icon: CalendarIcon },
    { id: 'expenses', label: 'Shpenzimet', icon: Wallet },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Settings });
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {renderContent()}
    </AuthContext.Provider>
  );
}
