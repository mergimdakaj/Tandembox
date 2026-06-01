import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, AlertCircle, ArrowLeft, Database, Download } from 'lucide-react';
import { useAuth } from '../App';

interface LoginProps {
  onBack?: () => void;
}

export function Login({ onBack }: LoginProps) {
  const { login, showToast } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importString, setImportString] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Actively pull the latest users list directly from Firebase Firestore 
      // to support new devices / colleague phones immediately without delay
      let users = [];
      try {
        const { loadCollectionFromFirebase } = await import('../lib/firebase');
        const freshUsers = await loadCollectionFromFirebase('users');
        if (freshUsers && freshUsers.length > 0) {
          localStorage.setItem('pl_users', JSON.stringify(freshUsers));
          window.dispatchEvent(new Event('storage'));
          users = freshUsers;
          console.log("Successfully retrieved fresh users list from Firebase Firestore during login.");
        } else {
          users = JSON.parse(localStorage.getItem('pl_users') || '[]');
        }
      } catch (fbErr) {
        console.warn("Could not retrieve fresh users from cloud, falling back to cached local storage:", fbErr);
        users = JSON.parse(localStorage.getItem('pl_users') || '[]');
      }
      
      const inputVal = username.toLowerCase().trim();
      const inputNoSpaces = inputVal.replace(/\s+/g, '');
      const inputPass = password.trim();

      const matchedUser = users.find((u: any) => {
        if (!u) return false;
        
        const uEmail = String(u.email || '').toLowerCase().trim();
        const uUid = String(u.uid || '').toLowerCase().trim();
        const uName = String(u.name || '').toLowerCase().trim();
        const uNameNoSpaces = uName.replace(/\s+/g, '');
        
        // Match conditions:
        const matchEmail = uEmail === inputVal;
        const matchUid = uUid === inputVal || uUid.replace(/\./g, '') === inputNoSpaces;
        const matchName = uName === inputVal || uNameNoSpaces === inputNoSpaces;
        
        // Also allow first name match if they just write their first name (e.g. "alban" instead of "Alban Berisha")
        const firstName = uName.split(' ')[0] || '';
        const matchFirstName = firstName && firstName === inputVal;

        // Check if matching credentials
        const credentialsMatch = matchEmail || matchUid || matchName || matchFirstName;
        const passMatch = String(u.password || '').trim() === inputPass;

        return credentialsMatch && passMatch;
      });

      if ((inputVal === 'mergim' || inputVal === 'mergim-id') && inputPass === 'mergim') {
        login(
          { uid: 'mergim-id', email: 'mergim@primelink.com' },
          { 
            uid: 'mergim-id', 
            name: 'Mergim', 
            email: 'mergim@primelink.com', 
            role: 'admin',
            createdAt: new Date().toISOString() 
          }
        );
      } else if (matchedUser) {
        login(
          { uid: matchedUser.uid, email: matchedUser.email },
          {
            uid: matchedUser.uid,
            name: matchedUser.name,
            email: matchedUser.email,
            role: matchedUser.role,
            createdAt: matchedUser.createdAt || new Date().toISOString()
          }
        );
      } else {
        setError('Përdoruesi ose fjalëkalimi i pasaktë.');
      }
    } catch (err) {
      setError('Ndodhi një gabim gjatë verifikimit të llogarisë tuaj.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Mbrapa në Portal
        </button>
      )}
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4">MG</div>
          <h1 className="text-2xl font-bold text-slate-800">MergimGroup</h1>
          <p className="text-slate-500 mt-1">Sistemi i Menaxhimit</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              placeholder="Përdoruesi"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              placeholder="Fjalëkalimi"
              required
            />
          </div>
          {error && <div className="text-rose-500 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Duke u kyqur...' : 'KYQU'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
