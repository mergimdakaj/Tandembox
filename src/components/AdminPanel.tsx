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
    firebaseError,
    syncing: globalSyncing, 
    triggerManualSyncUp, 
    triggerManualSyncDown,
    showToast
  } = useAuth();
  const [employees, setEmployees] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [localSyncing, setLocalSyncing] = useState(false);
  
  // Backup / local sync states
  const [showBackupBlock, setShowBackupBlock] = useState(false);
  const [backupJsonStr, setBackupJsonStr] = useState('');
  const [importString, setImportString] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');
  const [newPassword, setNewPassword] = useState('admin');

  const handleExportData = () => {
    try {
      const exportEnvelope = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
          pl_users: JSON.parse(localStorage.getItem('pl_users') || '[]'),
          pl_tasks: JSON.parse(localStorage.getItem('pl_tasks') || '[]'),
          pl_attendance: JSON.parse(localStorage.getItem('pl_attendance') || '[]'),
          pl_breaks: JSON.parse(localStorage.getItem('pl_breaks') || '[]'),
          pl_expenses: JSON.parse(localStorage.getItem('pl_expenses') || '[]'),
          pl_notifications: JSON.parse(localStorage.getItem('pl_notifications') || '[]')
        }
      };
      const json = JSON.stringify(exportEnvelope, null, 2);
      setBackupJsonStr(json);
      
      // Attempt copy to clipboard
      navigator.clipboard.writeText(json).then(() => {
        showToast("Të dhënat u kopjuan me sukses në Clipboard! Tani dërgoja kolegut p.sh. në Viber/WhatsApp.", "success");
      }).catch(() => {
        showToast("Backup u gjenerua! Kopjoje kodin nga fusha më poshtë.", "info");
      });
    } catch (e) {
      showToast("Dështoi gjenerimi i Backup-it.", "warning");
    }
  };

  const handleImportData = () => {
    if (!importString.trim()) {
      showToast("Ju lutem vendosni kodin e backup-it!", "warning");
      return;
    }
    try {
      const parsed = JSON.parse(importString.trim());
      if (!parsed || parsed.version !== 1 || !parsed.data) {
        showToast("Format i pavlefshëm! Sigurohu që ke kopjuar gjithë kodin e saktë.", "warning");
        return;
      }
      
      const payload = parsed.data;
      if (Array.isArray(payload.pl_users) && payload.pl_users.length > 0) {
        localStorage.setItem('pl_users', JSON.stringify(payload.pl_users));
      }
      if (Array.isArray(payload.pl_tasks)) {
        localStorage.setItem('pl_tasks', JSON.stringify(payload.pl_tasks));
      }
      if (Array.isArray(payload.pl_attendance)) {
        localStorage.setItem('pl_attendance', JSON.stringify(payload.pl_attendance));
      }
      if (Array.isArray(payload.pl_breaks)) {
        localStorage.setItem('pl_breaks', JSON.stringify(payload.pl_breaks));
      }
      if (Array.isArray(payload.pl_expenses)) {
        localStorage.setItem('pl_expenses', JSON.stringify(payload.pl_expenses));
      }
      if (Array.isArray(payload.pl_notifications)) {
        localStorage.setItem('pl_notifications', JSON.stringify(payload.pl_notifications));
      }
      
      // Notify application of structural state changes
      window.dispatchEvent(new Event('storage'));
      loadUsers();
      
      showToast("Të dhënat (Llogaritë/Punët) u importuan me sukses!", "success");
      setImportString('');
      setBackupJsonStr('');
      setShowBackupBlock(false);
    } catch (e) {
      showToast("Kodi i kopjuar nuk është i vlefshëm!", "warning");
    }
  };

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

  useEffect(() => {
    loadUsers();
    window.addEventListener('storage', loadUsers);
    return () => window.removeEventListener('storage', loadUsers);
  }, []);

  const handleSyncUp = async () => {
    setLocalSyncing(true);
    try {
      await triggerManualSyncUp();
      showToast("Llogaritë dhe të dhënat u sinkronizuan me sukses në Cloud!", "success");
    } catch (e) {
      showToast("Dështoi sinkronizimi automatik. Versioni u ruajt lokalisht.", "warning");
    } finally {
      setLocalSyncing(false);
    }
  };

  const handleSyncDown = async () => {
    setLocalSyncing(true);
    try {
      await triggerManualSyncDown();
      loadUsers();
      showToast("Të dhënat më të reja u shkarkuan me sukses nga Cloud!", "success");
    } catch (e) {
      showToast("Dështoi shkarkimi nga Cloud.", "warning");
    } finally {
      setLocalSyncing(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
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
    // Avoid duplicates of same uid
    const exists = users.some((u: any) => u.uid === generatedUid);
    if (exists) {
      showToast("Ky përdorues ekziston tashmë në sistem!", "warning");
      return;
    }

    users.push(newUser);
    localStorage.setItem('pl_users', JSON.stringify(users));
    setEmployees(users);
    window.dispatchEvent(new Event('storage'));

    // Reset Form
    setShowAdd(false);
    setNewName('');
    setNewPassword('admin');

    // Instantly try pushing to Firestore Cloud
    setLocalSyncing(true);
    try {
      await triggerManualSyncUp();
      showToast(`Përdoruesi u krijua dhe u sinkronizua në Cloud: ${generatedUid}`, "success");
    } catch (err) {
      showToast("Përdoruesi u krijua vetëm Lokalisht (Offline).", "info");
    } finally {
      setLocalSyncing(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
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

    // Instantly try pushing deletion to Firestore Cloud
    setLocalSyncing(true);
    try {
      await triggerManualSyncUp();
      showToast("Përdoruesi u fshi dhe ndryshimet u sinkronizuan në Cloud.", "success");
    } catch (err) {
      showToast("Përdoruesi u fshi Lokalisht.", "info");
    } finally {
      setLocalSyncing(false);
    }
  };

  const filteredEmployees = employees.filter(e => 
    (e.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (e.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = profile?.role === 'admin';
  const isSyncingActive = globalSyncing || localSyncing;

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

      {/* Cloud Database Integration Status Panel */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/60 p-5 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm",
              firebaseConnected ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
            )}>
              <CloudLightning className={cn("w-5 h-5", isSyncingActive && "animate-pulse")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Lidhja me Serverin Cloud (Firestore)</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                  firebaseConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {firebaseConnected ? "AKTIVE" : "OFFLINE"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                {firebaseConnected 
                  ? "Sistemi është i lidhur me databazën qëndrore. Çdo përdorues i ri sinkronizohet automatikisht në cloud."
                  : "Sistemi aktualisht është në gjendje të jashtme (offline në këtë domain/server). Ndryshimet do të ruhen lokalisht në këtë browser."}
              </p>
              {!firebaseConnected && firebaseError && (
                <div className="mt-2.5 p-2 px-3 bg-amber-50/75 border border-amber-100 rounded-xl text-[9px] font-mono text-amber-800 break-all max-w-[280px] sm:max-w-md">
                  <strong>Gabimi i lidhjes:</strong> {firebaseError}
                  <div className="mt-1 text-[8px] opacity-80 leading-normal font-sans">
                    * Sugjerim: Mund të konfiguroni variablat e mjedisit (Environment Variables) në panelin Vercel për të lidhur Firebase tuaj personal.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleSyncDown}
              disabled={isSyncingActive || !firebaseConnected}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              title="Shkarko përdoruesit më të rinj nga serveri"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-500", isSyncingActive && "animate-spin")} /> Shkarko
            </button>
            <button
              onClick={handleSyncUp}
              disabled={isSyncingActive || !firebaseConnected}
              className="px-3.5 py-2 bg-[#4239b3] hover:bg-[#342caa] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Ngarko dhe sinkronizo të gjitha të dhënat lokale tek serveri"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Ngarko / Ruaj
            </button>
          </div>
        </div>
      </div>

      {/* Manual Data Sync/Backup Tool (Alternative option for easy manual sync across devices) */}
      <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl shadow-xs">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-500 flex-shrink-0">
              <Database className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Sinkronizimi Manual (pa server)</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">Transfero llogaritë dhe oraret tek telefoni i kolegut pa pasur nevojë për internet cloud.</p>
            </div>
          </div>
          <button
            onClick={() => setShowBackupBlock(!showBackupBlock)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0 self-end sm:self-center"
          >
            {showBackupBlock ? "Mbyll" : "Hap Panelin"}
          </button>
        </div>

        {showBackupBlock && (
          <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Container */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-600">1. Eksporto të dhënat</h5>
                  <button
                    onClick={handleExportData}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-100 flex items-center gap-1 cursor-pointer"
                  >
                    <UploadCloud className="w-3 h-3" /> Gjenero & Kopjo
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                  Kliko butonin për të kopjuar automatikisht të gjithë kodin e llogarive dhe të dhënave, pastaj dërgoja kolegut përmes një mesazhi (e-mail, WhatsApp, etj.).
                </p>
                {backupJsonStr && (
                  <textarea
                    readOnly
                    value={backupJsonStr}
                    onClick={(e) => (e.target as any).select()}
                    className="w-full h-24 p-2 bg-slate-50 border border-slate-100 text-[9px] font-mono rounded-xl focus:outline-none focus:border-indigo-400 text-slate-500"
                    placeholder="Kodi i backup-it do të shfaqet këtu..."
                  />
                )}
              </div>

              {/* Import Container */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-600">2. Importo në pajisjen e re</h5>
                  <button
                    onClick={handleImportData}
                    className="px-2.5 py-1 bg-[#4239b3] hover:bg-[#342caa] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <DownloadCloud className="w-3 h-3" /> Ruaj në këtë Telefon
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                  Në telefonin e kolegut, hap këtë faqe, shto kodin e backup-it të pranuar në fushën më poshtë dhe kliko butonin për të importuar llogaritë menjëherë!
                </p>
                <textarea
                  value={importString}
                  onChange={(e) => setImportString(e.target.value)}
                  className="w-full h-24 p-2 bg-slate-50 border border-slate-100 text-[9px] font-mono rounded-xl focus:outline-none focus:border-[#4239b3]"
                  placeholder="Ngjit (Paste) kodin e backup-it këtu..."
                />
              </div>
            </div>
          </div>
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
