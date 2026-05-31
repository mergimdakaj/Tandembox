import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Bell, Trash2, Check, Send, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export interface NotificationRecord {
  id: string;
  sender: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  readBy: string[]; // User uids
}

export function NotificationsView() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSender, setNewSender] = useState('BURIMET NJERËZORE');

  useEffect(() => {
    const loadNotifications = () => {
      const stored = localStorage.getItem('pl_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        // Seed initial notifications as shown in screenshot 3
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
