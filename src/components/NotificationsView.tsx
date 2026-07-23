import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Bell, Trash2, Check, Send, X, Plus, Clock, Settings, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { 
  getScheduleSettings, 
  saveScheduleSettings, 
  requestNotificationPermission, 
  sendDeviceNotification,
  ScheduleSettings 
} from '../lib/notifications';

export interface NotificationRecord {
  id: string;
  sender: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  readBy: string[]; // User uids
}

export function NotificationsView() {
  const { user, profile, showToast } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSender, setNewSender] = useState('BURIMET NJERËZORE');

  // Work Schedule & Device Notification Settings
  const [schedule, setSchedule] = useState<ScheduleSettings>(getScheduleSettings());
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    const loadNotifications = () => {
      const stored = localStorage.getItem('pl_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        // Seed initial notifications
        const defaultNotifications: NotificationRecord[] = [
          {
            id: 'n1',
            sender: 'BURIMET NJERËZORE',
            title: 'Ndryshimi i orarit të punës',
            content: 'Për shkak të temperaturave të larta, orari do të fillojë gjysmë ore më herët. Hyrja duhet të bëhet në ora 08:00.',
            date: '2026-05-27',
            readBy: []
          },
          {
            id: 'n2',
            sender: 'MENAXHMENTI',
            title: 'Mbledhje e Rëndësishme e Stafit',
            content: 'Ju lutemi të gjithëve të jeni të pranishëm ditën e Hënë në zyrën kryesore në ora 09:00 për shpërndarjen e detyrave të reja javore dhe rishikimin e performancës.',
            date: '2026-05-26',
            readBy: []
          }
        ];
        localStorage.setItem('pl_notifications', JSON.stringify(defaultNotifications));
        setNotifications(defaultNotifications);
      }
    };

    loadNotifications();
    window.addEventListener('storage', loadNotifications);
    return () => window.removeEventListener('storage', loadNotifications);
  }, []);

  const handleUpdateSchedule = (updated: Partial<ScheduleSettings>) => {
    const next = { ...schedule, ...updated };
    setSchedule(next);
    saveScheduleSettings(next);
    showToast('Cilësimet e kujtuesit u ruajtën me sukses!', 'success');
  };

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      showToast('Njoftimet në shfletues u aktivizuan! Do të merrni kujtues automatikë.', 'success');
      sendDeviceNotification(
        '🔔 Njoftimet u aktivizuan!',
        'MergimGroup: Tani do të merrni njoftime automatike për hyrje (Check-In) dhe dalje (Check-Out) nga puna.'
      );
    } else {
      showToast('Ju lutemi lejoni njoftimet në cilësimet e shfletuesit/telefonit tuaj.', 'error');
    }
  };

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      handleEnableNotifications();
      return;
    }
    sendDeviceNotification(
      '⏰ Kyçu për të filluar punën!',
      'MergimGroup (PROVË): Ka ardhur ora e fillimit të orarit të punës. Bëj Check-In në sistem.'
    );
    showToast('Njoftim provë u dërgua në pajisje!', 'info');
  };

  const handleMarkAsRead = (id: string) => {
    if (!user) return;
    const updated = notifications.map(notif => {
      if (notif.id === id) {
        const readBy = [...notif.readBy];
        if (!readBy.includes(user.uid)) {
          readBy.push(user.uid);
        }
        return { ...notif, readBy };
      }
      return notif;
    });
    localStorage.setItem('pl_notifications', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDelete = (id: string) => {
    const updated = notifications.filter(notif => notif.id !== id);
    localStorage.setItem('pl_notifications', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newNotif: NotificationRecord = {
      id: Math.random().toString(36).substring(2, 9),
      sender: newSender,
      title: newTitle,
      content: newContent,
      date: format(new Date(), 'yyyy-MM-dd'),
      readBy: []
    };

    const updated = [newNotif, ...notifications];
    localStorage.setItem('pl_notifications', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('storage'));

    // Reset form
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* View Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Njoftimet e Stafit</h2>
          <p className="text-slate-400 text-xs font-semibold">Komunikatat kryesore nga administrata.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#f4f2ff] hover:bg-[#eae6ff] text-[#4239b3] rounded-2xl text-xs font-bold transition-all border border-[#eae6ff] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Njofto
          </button>
        )}
      </div>

      {/* Work Schedule Reminders Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-[32px] p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Clock className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-indigo-200">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Kujtuesit e Orarit të Punës
                  {permission === 'granted' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> Aktiv
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <AlertCircle className="w-3 h-3" /> Jo Aktiv
                    </span>
                  )}
                </h3>
                <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                  Merr njoftime direkte në telefon apo kompjuter për të filluar dhe përfunduar punën.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {permission !== 'granted' ? (
                <button
                  onClick={handleEnableNotifications}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" /> Aktivizo Njoftimet në Pajisje
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-indigo-200 border border-white/10 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4 text-indigo-300" /> Provo Njoftimin
                </button>
              )}
            </div>
          </div>

          {/* Schedule Settings Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-indigo-800/60 text-xs">
            {/* Start Time */}
            <div className="bg-indigo-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                Ora e Hyrjes (Check-In)
              </label>
              <input
                type="time"
                value={schedule.startTime}
                onChange={(e) => handleUpdateSchedule({ startTime: e.target.value })}
                className="w-full bg-indigo-900/60 border border-indigo-700/50 rounded-xl px-3 py-1.5 text-white font-black text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* End Time */}
            <div className="bg-indigo-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                Ora e Daljes (Check-Out)
              </label>
              <input
                type="time"
                value={schedule.endTime}
                onChange={(e) => handleUpdateSchedule({ endTime: e.target.value })}
                className="w-full bg-indigo-900/60 border border-indigo-700/50 rounded-xl px-3 py-1.5 text-white font-black text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Toggle Start Reminder */}
            <div className="bg-indigo-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Kujtues Fillimi
                </span>
                <span className="text-[11px] text-indigo-200/70 font-semibold">Kyçu për punë</span>
              </div>
              <input
                type="checkbox"
                checked={schedule.notifyStart}
                onChange={(e) => handleUpdateSchedule({ notifyStart: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Toggle End Reminder */}
            <div className="bg-indigo-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-800/40 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Kujtues Mbarimi
                </span>
                <span className="text-[11px] text-indigo-200/70 font-semibold">Kyçu për dalje</span>
              </div>
              <input
                type="checkbox"
                checked={schedule.notifyEnd}
                onChange={(e) => handleUpdateSchedule({ notifyEnd: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notif) => {
          const isRead = user ? notif.readBy.includes(user.uid) : false;
          return (
            <div 
              key={notif.id}
              className={`p-6 rounded-[32px] border transition-all relative overflow-hidden bg-white ${
                isRead ? 'border-slate-100 shadow-sm opacity-80' : 'border-[#e6e8ff] shadow-md shadow-[#4239b3]/5'
              }`}
            >
              {/* Envelope design accent */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#eeeeff] text-[#4239b3] flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-black tracking-wider text-[#4239b3] uppercase">
                      {notif.sender}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {notif.date}
                    </span>
                  </div>
                  
                  <h4 className="text-base font-black text-slate-800 tracking-tight mb-2">
                    {notif.title}
                  </h4>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    {notif.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/60">
                    <div>
                      {!isRead ? (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="flex items-center gap-1 text-[10px] font-black text-[#4239b3] uppercase tracking-wider hover:opacity-85"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Shëno si të lexuar
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-xl">
                          Lexuar
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(notif.id)}
                        className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nuk ka njoftime të reja.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Dërgo Njoftim</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dërguesi</label>
                  <select 
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4239b3] font-bold text-slate-700"
                  >
                    <option value="BURIMET NJERËZORE">Burimet Njerëzore</option>
                    <option value="MENAXHMENTI">Menaxhmenti</option>
                    <option value="ADMINISTRATA">Administrata</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Titulli</label>
                  <input 
                    type="text" 
                    placeholder="p.sh. Orari i Festave"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#4239b3] font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Përmbajtja</label>
                  <textarea 
                    placeholder="Shkruani njoftimin këtu..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#4239b3] font-medium text-sm min-h-[120px]"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs"
                  >
                    ANULO
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#4239b3] text-white font-bold rounded-2xl hover:bg-[#342caa] transition-all shadow-lg shadow-[#4239b3]/20 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> DËRGO
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
