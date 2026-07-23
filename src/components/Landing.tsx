import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Calculator, ArrowRight, ShieldCheck, Sparkles, Zap, Award, CheckCircle2 } from 'lucide-react';
import { LOGO_DATA_URL } from '../assets/logo';

interface LandingProps {
  onSelectWork: () => void;
  onSelectCalc: () => void;
}

export function Landing({ onSelectWork, onSelectCalc }: LandingProps) {
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
        className="max-w-4xl w-full text-center relative z-10 my-auto py-8"
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
        
        <p className="text-slate-300 text-sm sm:text-base lg:text-lg mb-10 font-medium leading-relaxed max-w-xl mx-auto drop-shadow-md">
          Zgjidhni modulain e punës ose llogaritësin profesional për të vazhduar.
        </p>

        {/* Entrance Cards Grid - Explosive Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 text-left">
          
          {/* CARD 1: Menaxhimi i Punës */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onSelectWork}
            className="group relative cursor-pointer rounded-[36px] bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-indigo-950/80 p-8 border border-indigo-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden hover:border-indigo-400/80 hover:shadow-[0_20px_60px_rgba(99,102,241,0.35)] transition-all duration-500"
          >
            {/* Top Shine Beam Effect */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-bl-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-all"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-0.5 shadow-[0_10px_25px_rgba(99,102,241,0.4)] group-hover:shadow-[0_10px_35px_rgba(99,102,241,0.7)] group-hover:scale-110 transition-all duration-500">
                  <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center text-white backdrop-blur-md">
                    <Briefcase className="w-8 h-8 text-indigo-300 group-hover:text-white transition-colors" />
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/60 transition-all">
                  Sistem Hyrje/Dalje
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2 group-hover:text-indigo-200 transition-colors">
                Menaxhimi i Punës
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
                Ndiqni orarin e punës, bëni Check-In / Check-Out, kërkoni pauza dhe regjistroni shpenzimet ditore me kontroll të plotë.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-2 mb-8 text-xs text-slate-300/90 font-medium border-t border-indigo-500/20 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Kujtues automatikë për hyrje e dalje</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Njoftime me zë, dridhje & kalendar</span>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between text-indigo-300 group-hover:text-white font-black text-xs uppercase tracking-widest">
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Hyr në Sistem <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-200" />
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
            className="group relative cursor-pointer rounded-[36px] bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-emerald-950/80 p-8 border border-emerald-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden hover:border-emerald-400/80 hover:shadow-[0_20px_60px_rgba(16,185,129,0.35)] transition-all duration-500"
          >
            {/* Top Shine Beam Effect */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-bl-[100px] pointer-events-none group-hover:bg-emerald-600/20 transition-all"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 p-0.5 shadow-[0_10px_25px_rgba(16,185,129,0.4)] group-hover:shadow-[0_10px_35px_rgba(16,185,129,0.7)] group-hover:scale-110 transition-all duration-500">
                  <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center text-white backdrop-blur-md">
                    <Calculator className="w-8 h-8 text-emerald-300 group-hover:text-white transition-colors" />
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/60 transition-all">
                  Llogaritës Masash
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2 group-hover:text-emerald-200 transition-colors">
                Mergim Pro
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
                Llogaritësi i prerjeve dhe masave për Tandembox, fioka alumini, profila xhami me optimizuesin e shfrytëzimit të paneleve.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-2 mb-8 text-xs text-slate-300/90 font-medium border-t border-emerald-500/20 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Optimizues automatik i prerjes së pllakave</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Llogaritja e profilave të xhamit me precizitet</span>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between text-emerald-300 group-hover:text-white font-black text-xs uppercase tracking-widest">
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Hap Mjetin <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-200" />
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-ping"></span>
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
    </div>
  );
}

