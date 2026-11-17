import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LOGO_DATA_URL } from '../assets/logo';

interface GcfGateProps {
  onUnlock: () => void;
}

export function GcfGate({ onUnlock }: GcfGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const userClean = username.trim().toLowerCase();
    const passClean = password.trim().toLowerCase();

    // Check for "gcf" / "gcf"
    if (userClean === 'gcf' && passClean === 'gcf') {
      setSuccess(true);
      setTimeout(() => {
        if (rememberMe) {
          localStorage.setItem('gcf_gate_authenticated', 'true');
        } else {
          sessionStorage.setItem('gcf_gate_authenticated', 'true');
        }
        onUnlock();
      }, 600);
    } else {
      setTimeout(() => {
        setLoading(false);
        setError('Përdoruesi ose fjalëkalimi është i gabuar. Ju lutem provoni përsëri.');
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-[#050714] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white select-none">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-tl from-emerald-600/25 via-teal-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" style={{ animationDuration: '6s' }}></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-indigo-950/90 rounded-[36px] p-6 sm:p-8 border border-indigo-500/30 shadow-[0_20px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          
          {/* Top subtle glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Brand & Spinning Logo */}
          <div className="text-center mb-6 relative">
            <div className="relative inline-block mb-4">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-500 rounded-full blur-md opacity-70 animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-amber-300 to-emerald-400 shadow-xl">
                <div className="w-full h-full bg-slate-950 rounded-full p-1 flex items-center justify-center overflow-hidden">
                  <img
                    src={LOGO_DATA_URL}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-full"
                    style={{ animation: 'spin 12s linear infinite' }}
                  />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>KODI HYRËS I SISTEMIT • GCF</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              Autorizimi <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-emerald-400 bg-clip-text text-transparent">GCF</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">
              Ju lutem shkruani të dhënat hyrëse për të hapur faqen
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block ml-1">
                Përdoruesi (Username)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Përdoruesi"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-indigo-900/60 hover:border-indigo-500/50 focus:border-indigo-400 rounded-2xl text-white font-medium text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block ml-1">
                Fjalëkalimi (Password)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Fjalëkalimi"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-indigo-900/60 hover:border-indigo-500/50 focus:border-indigo-400 rounded-2xl text-white font-medium text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title={showPassword ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>Më mbaj mend në këtë pajisje</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                success
                  ? 'bg-emerald-500 text-white shadow-emerald-500/40 scale-102'
                  : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50'
              }`}
            >
              {success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>U Autorizua Me Sukses!</span>
                </>
              ) : loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Duke Verifikuar...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Hyr në Faqe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Info */}
          <div className="mt-6 pt-5 border-t border-indigo-950/80 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sistem i Mbrojtur • MergimGroup GCF Gate</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
