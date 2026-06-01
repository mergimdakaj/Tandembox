import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useAuth } from '../App';
import { cn } from '../lib/utils';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  X, 
  Shield, 
  User as UserIcon,
  Plus,
  Database,
  RefreshCw,
  CheckCircle2,
  CloudLightning,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffUser extends UserProfile {
  password?: string;
}

export function AdminPanel() {
  const { 
    profile, 
    firebaseConnected, 
    syncing, 
    triggerManualSyncUp, 
    triggerManualSyncDown 
  } = useAuth();
  const [employees, setEmployees] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');
  const [newPassword, setNewPassword] = useState('admin');

  useEffect(() => {
    const loadUsers = () => {
      const users = JSON.parse(localStorage.getItem('pl_users') || '[]');
      if (users.length === 0) {
        const defaultUsers: StaffUser[] = [
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
        setEmployees(defaultUsers);
      } else {
        setEmployees(users);
      }
    };

    loadUsers();
    window.addEventListener('storage', loadUsers);
    return () => window.removeEventListener('storage', loadUsers);
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    // Auto-generate uid and email by slugifying the name (e.g. Alban Berisha -> alban.berisha)
    const normalized = newName.toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.');

    const generatedUid = normalized || `user-${Date.now()}`;
    const generatedEmail = `${generatedUid}@primelink.com`;

    const newUser: StaffUser = {
      uid: generatedUid,
      name: newName,
      email: generatedEmail,
      role: newRole,
      password: newPassword,
      createdAt: new Date().toISOString(),
    };

    const users = JSON.parse(localStorage.getItem('pl_users') || '[]');
    users.push(newUser);
    localStorage.setItem('pl_users', JSON.stringify(users));
    setEmployees(users);
    window.dispatchEvent(new Event('storage'));

    // Reset Form
    setShowAdd(false);
    setNewName('');
    setNewPassword('admin');
  };

  const handleDeleteUser = (uid: string) => {
    if (uid === 'mergim-id') {
      alert("Nuk mund të fshini llogarinë kryesore të administratorit.");
      return;
    }
    const confirmed = window.confirm("A jeni të sigurt që dëshironi të fshini këtë punonjës?");
    if (!confirmed) return;

    const users = JSON.parse(localStorage.getItem('pl_users') || '[]');
    const updated = users.filter((u: UserProfile) => u.uid !== uid);
    localStorage.setItem('pl_users', JSON.stringify(updated));
    setEmployees(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const filteredEmployees = employees.filter(e => 
    (e.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (e.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">


      {/* Page Title & Search Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Menaxhimi i Përdoruesve</h2>
          <p className="text-slate-400 text-xs font-semibold">Krijo dhe menaxho llogaritë për stafin</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#f4f2ff] hover:bg-[#eae6ff] text-[#4239b3] rounded-2xl text-xs font-bold transition-all border border-[#eae6ff] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Shto
          </button>
        )}
      </div>

      {/* Roster list */}
      <div className="space-y-4">
        {/* Simple Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Kërko staf..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 focus:border-[#4239b3] text-sm font-medium outline-none transition-all shadow-sm"
          />
        </div>

        {/* User profile list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmployees.map((emp) => {
            return (
              <div 
                key={emp.uid}
                className="p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="min-w-0">
                    <h4 className="text-base font-black text-slate-800 tracking-tight leading-tight">
                      {emp.name}
                    </h4>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5 leading-none">
                      <span className="capitalize">{emp.role === 'admin' ? 'Administrator' : 'Punonjës'}</span>
                    </p>
                    <p className="text-[#594fd7] text-xs font-semibold mt-1.5 bg-[#f3f2ff] px-2.5 py-1 rounded-xl inline-block leading-none">
                      Përdoruesi: <span className="font-extrabold">{emp.uid}</span> | Fjalëkalimi: {emp.password || 'admin'}
                    </p>
                  </div>
                </div>

                {isAdmin && emp.uid !== 'mergim-id' && (
                  <button 
                    onClick={() => handleDeleteUser(emp.uid)}
                    className="p-2.5 hover:bg-rose-50 rounded-2xl text-rose-400 hover:text-rose-600 transition-all flex-shrink-0"
                    title="Fshi Përdoruesin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Nuk u gjet asnjë punonjës.</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Shto Punonjës të Ri</h3>
                <button 
                  onClick={() => setShowAdd(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Emri i Plotë (Përdoruesi)</label>
                  <input 
                    type="text" 
                    placeholder="p.sh. Alban Berisha"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#4239b3] font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fjalëkalimi</label>
                  <input 
                    type="text" 
                    placeholder="Fjalëkalimi"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#4239b3] font-bold text-[#4239b3]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Roli në Sistem</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4239b3] font-bold text-slate-700"
                  >
                    <option value="employee">Punonjës (Staf)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs"
                  >
                    ANULO
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#4239b3] text-white font-bold rounded-2xl hover:bg-[#342caa] transition-all shadow-lg shadow-[#4239b3]/20 text-xs"
                  >
                    KRIJO
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
