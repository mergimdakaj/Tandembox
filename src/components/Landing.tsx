import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Calculator, ArrowRight, ShieldCheck, Sparkles, Zap, Award, CheckCircle2, Wand2, Lock, KeyRound, X, AlertCircle } from 'lucide-react';
import { LOGO_DATA_URL } from '../assets/logo';

interface LandingProps {
  onSelectWork: () => void;
  onSelectCalc: () => void;
  onSelectAiStudio?: () => void;
}

export function Landing({ onSelectWork, onSelectCalc, onSelectAiStudio }: LandingProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setPinError(false);
      if (nextPin.length === 4) {
        if (nextPin === '1996') {
          setShowPinModal(false);
          setPin('');
          if (onSelectAiStudio) onSelectAiStudio();
        } else {
          setPinError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === '1996') {
      setShowPinModal(false);
      setPin('');
      setPinError(false);
      if (onSelectAiStudio) onSelectAiStudio();
    } else {
      setPinError(true);
      setTimeout(() => setPin(''), 500);
    }
  };
  return (
    <div className="min-h-screen bg-[#050714] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Ambient Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-emerald-600/25 via-teal-600/15 to-transparent rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '7s' }}></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Explosive Background Grid & Star Dust */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl w-full text-center relative z-10 my-auto py-8"
      >
        {/* Top Floating Luxury Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-emerald-950/80 border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.25)] backdrop-blur-xl mb-8"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
            PLATFORMA ZYRTARE • MERGIMGROUP
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </motion.div>

        {/* Central Pedestal & Spinning Logo with Multi-Layered Neon Aura */}
        <div className="mb-8 relative inline-block group">
          {/* Radial Halo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition duration-700 animate-pulse"></div>
          
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-amber-300 to-emerald-400 shadow-[0_0_50px_rgba(99,102,241,0.4)]">
            <div className="w-full h-full bg-slate-950 rounded-full p-1.5 flex items-center justify-center relative overflow-hidden">
              <img 
                src={LOGO_DATA_URL} 
                alt="MergimGroup Logo" 
                className="w-full h-full object-cover rounded-full shadow-inner"
                style={{ animation: 'spin 12s linear infinite' }}
              />
            </div>
          </div>
        </div>

        {/* Explosive Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight leading-none drop-shadow-2xl">
          Sistemi{' '}
          <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-emerald-400 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_35px_rgba(99,102,241,0.5)]">
            MergimGroup
          </span>
        </h1>
        
        <p className="text-slate-300 text-sm sm:text-base lg:text-lg mb-10 font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-md">
          Zgjidhni modulain e punës, llogaritësin profesional ose Studio-n e Gjenerimit me AI.
        </p>

        {/* Entrance Cards Grid - 3 Modules Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* CARD 1: Menaxhimi i Punës */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onSelectWork}
            className="group relative cursor-pointer rounded-[36px] bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-indigo-950/80 p-6 sm:p-8 border border-indigo-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden hover:border-indigo-400/80 hover:shadow-[0_20px_60px_rgba(99,102,241,0.35)] transition-all duration-500"
          >
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-bl-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-all"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-0.5 shadow-[0_10px_25px_rgba(99,102,241,0.4)] group-hover:shadow-[0_10px_35px_rgba(99,102,241,0.7)] group-hover:scale-110 transition-all duration-500">
                  <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center text-white backdrop-blur-md">
                    <Briefcase className="w-7 h-7 text-indigo-300 group-hover:text-white transition-colors" />
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 group-hover:bg-indigo-500/20 transition-all">
                  Hyrje / Dalje
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-indigo-200 transition-colors">
                Menaxhimi i Punës
              </h2>

              <p className="text-slate-300 text-xs font-medium mb-6 leading-relaxed">
                Ndiqni orarin e punës, bëni Check-In / Check-Out, kërkoni pauza dhe regjistroni shpenzimet ditore.
              </p>

              <div className="space-y-2 mb-8 text-[11px] text-slate-300/90 font-medium border-t border-indigo-500/20 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Kujtues automatikë orari</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Njoftime me zë & dridhje</span>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between text-indigo-300 group-hover:text-white font-black text-xs uppercase tracking-widest">
                <span className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                  Hyr <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-200" />
                </span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8] animate-ping"></span>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: Mergim Pro */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onSelectCalc}
            className="group relative cursor-pointer rounded-[36px] bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-emerald-950/80 p-6 sm:p-8 border border-emerald-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden hover:border-emerald-400/80 hover:shadow-[0_20px_60px_rgba(16,185,129,0.35)] transition-all duration-500"
          >
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-bl-[100px] pointer-events-none group-hover:bg-emerald-600/20 transition-all"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 p-0.5 shadow-[0_10px_25px_rgba(16,185,129,0.4)] group-hover:shadow-[0_10px_35px_rgba(16,185,129,0.7)] group-hover:scale-110 transition-all duration-500">
                  <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center text-white backdrop-blur-md">
                    <Calculator className="w-7 h-7 text-emerald-300 group-hover:text-white transition-colors" />
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 group-hover:bg-emerald-500/20 transition-all">
                  Llogaritës Masash
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-emerald-200 transition-colors">
                Mergim Pro
              </h2>

              <p className="text-slate-300 text-xs font-medium mb-6 leading-relaxed">
                Llogaritësi i prerjeve për Tandembox, fioka alumini, profila xhami dhe optimizues pllakash.
              </p>

              <div className="space-y-2 mb-8 text-[11px] text-slate-300/90 font-medium border-t border-emerald-500/20 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Optimizim pllakash 2800x2070</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Formulat Tandembox & Antaro</span>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between text-emerald-300 group-hover:text-white font-black text-xs uppercase tracking-widest">
                <span className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                  Hap Mjetin <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-200" />
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-ping"></span>
              </div>
            </div>
          </motion.div>

          {/* CARD 3: Ai Gjenerim (MODULI: KUZHINA PRO) */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => {
              setPin('');
              setPinError(false);
              setShowPinModal(true);
            }}
            className="group relative cursor-pointer rounded-[36px] bg-gradient-to-b from-slate-900/90 via-purple-950/80 to-indigo-950/90 p-6 sm:p-8 border-2 border-amber-400/50 shadow-[0_15px_50px_rgba(124,58,237,0.3)] backdrop-blur-2xl overflow-hidden hover:border-amber-300 hover:shadow-[0_20px_60px_rgba(245,158,11,0.4)] transition-all duration-500"
          >
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-[100px] pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-purple-600 to-indigo-600 p-0.5 shadow-[0_10px_25px_rgba(245,158,11,0.5)] group-hover:shadow-[0_10px_35px_rgba(245,158,11,0.8)] group-hover:scale-110 transition-all duration-500">
                  <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-white backdrop-blur-md">
                    <Wand2 className="w-7 h-7 text-amber-300 group-hover:text-amber-200 transition-colors animate-pulse" />
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/20 border border-amber-400/50 text-amber-300 group-hover:bg-amber-500/30 transition-all flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-300" /> ME KOD 1996
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-1 group-hover:text-amber-200 transition-colors flex items-center gap-2">
                Ai Gjenerim
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2 block">
                MODULI: KUZHINA PRO (E MBROJTUR)
              </span>

              <p className="text-slate-300 text-xs font-medium mb-6 leading-relaxed">
                Studio e plotë automatike me PIN hyrës: Canvas 2D/3D, Auto-Cutlist, Optimizim pllakash, Kosto & PDF!
              </p>

              <div className="space-y-2 mb-8 text-[11px] text-slate-300/90 font-medium border-t border-purple-500/30 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Kërkohet kodi 4-shifror për hyrje</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Interactive Canvas & Lista e Prerjeve</span>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between text-amber-300 group-hover:text-white font-black text-xs uppercase tracking-widest">
                <span className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                  Hap me Kod <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-200" />
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-ping"></span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Bottom Luxury Stats & Security Badge */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-slate-400 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Transmetim i Sigurt & Enkriptuar</span>
          </div>

          <div className="hidden sm:block w-px h-5 bg-white/10"></div>

          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Standardi MergimGroup Pro</span>
          </div>

          <div className="hidden sm:block w-px h-5 bg-white/10"></div>

          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>Përditësime në Kohë Reale</span>
          </div>
        </div>
      </motion.div>

      {/* 4-DIGIT PIN PROTECTION MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-slate-900 via-purple-950/90 to-slate-950 w-full max-w-md rounded-3xl border-2 border-amber-400/60 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/20">
                  <Lock className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Aksesi i Mbrojtur: Ai Gjenerim</h3>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Moduli është në zhvillim e sipër. Ju lutem shkruani kodin hyrës <span className="text-amber-300 font-bold">4-shifror</span> për të vazhduar:
                  </p>
                </div>

                {/* 4-Digit Display Boxes */}
                <div className="flex justify-center items-center gap-3 py-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                          pinError
                            ? 'border-red-500 bg-red-950/50 text-red-400 animate-shake'
                            : isFilled
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/20 scale-105'
                            : 'border-slate-800 bg-slate-950/80 text-slate-600'
                        }`}
                      >
                        {isFilled ? '●' : '○'}
                      </div>
                    );
                  })}
                </div>

                {/* Error Banner */}
                {pinError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Kodi 4-shifror është i gabuar! Provoni përsëri.</span>
                  </motion.div>
                )}

                {/* Hidden/Direct Input for Keyboard Users */}
                <form onSubmit={handlePinSubmit} className="pt-1">
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPin(val);
                      setPinError(false);
                      if (val.length === 4) {
                        if (val === '1996') {
                          setShowPinModal(false);
                          setPin('');
                          if (onSelectAiStudio) onSelectAiStudio();
                        } else {
                          setPinError(true);
                          setTimeout(() => setPin(''), 500);
                        }
                      }
                    }}
                    placeholder="Shkruaj kodin 1996..."
                    className="w-full bg-slate-950 border border-indigo-900/80 rounded-xl px-4 py-3 text-center text-white font-mono font-black text-lg tracking-[0.5em] focus:outline-none focus:border-amber-400 shadow-inner"
                    autoFocus
                  />
                </form>

                {/* Keypad Buttons */}
                <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleDigitClick(digit)}
                      className="py-3 bg-slate-900/90 hover:bg-indigo-600 text-white font-black text-lg rounded-xl border border-slate-800 hover:border-indigo-400 transition-all active:scale-95 shadow-md"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    onClick={() => setPin('')}
                    className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-all"
                  >
                    FSHIJ
                  </button>
                  <button
                    onClick={() => handleDigitClick('0')}
                    className="py-3 bg-slate-900/90 hover:bg-indigo-600 text-white font-black text-lg rounded-xl border border-slate-800 hover:border-indigo-400 transition-all active:scale-95 shadow-md"
                  >
                    0
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="py-3 bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl border border-slate-800 transition-all flex items-center justify-center"
                  >
                    ⌫
                  </button>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 font-medium">
                  Moduli "Ai Gjenerim" • MergimGroup Pro Studio
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

