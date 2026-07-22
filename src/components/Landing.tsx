import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Calculator, ArrowRight } from 'lucide-react';
import { LOGO_DATA_URL } from '../assets/logo';

interface LandingProps {
  onSelectWork: () => void;
  onSelectCalc: () => void;
}

export function Landing({ onSelectWork, onSelectCalc }: LandingProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        <div className="mb-12 inline-flex items-center justify-center p-3 bg-transparent">
          <div className="w-20 h-20 bg-indigo-600 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-black border-2 border-indigo-400/60 shadow-lg shadow-indigo-500/30">
            <img 
              src={LOGO_DATA_URL} 
              alt="MergimGroup Logo" 
              className="w-full h-full object-cover rounded-full"
              style={{ animation: 'spin 10s linear infinite' }}
            />
          </div>
        </div>

        <h1 className="text-5xl font-black text-white mb-6 tracking-tight">
          Sistemi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">MergimGroup</span>
        </h1>
        
        <p className="text-slate-400 text-lg mb-12 font-medium leading-relaxed max-w-lg mx-auto">
          Zgjidhni mjetin që ju nevojitet për të filluar punën sot.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectWork}
            className="group relative flex flex-col items-center p-8 bg-white/5 backdrop-blur-lg rounded-[32px] border border-white/10 transition-all hover:bg-white/[0.08] hover:border-indigo-500/50 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Briefcase size={80} />
            </div>
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Menaxhimi i Punës</h2>
            <p className="text-slate-400 text-sm mb-6">Orari, pauzat dhe shpenzimet për punëtorë.</p>
            <div className="mt-auto flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest">
              Hyr në sistem <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectCalc}
            className="group relative flex flex-col items-center p-8 bg-white/5 backdrop-blur-lg rounded-[32px] border border-white/10 transition-all hover:bg-white/[0.08] hover:border-emerald-500/50 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calculator size={80} />
            </div>
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20">
              <Calculator className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Mergim Pro</h2>
            <p className="text-slate-400 text-sm mb-6">Llogaritësi i masave për Mergim Pro, fioka dhe profila xhami.</p>
            <div className="mt-auto flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-widest">
              Hap mjetin <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 border-t border-white/5 pt-8">
          <div className="text-center">
            <p className="text-xl font-black text-white">PRO</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Tools</p>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-center">
            <p className="text-xl font-black text-white">24/7</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Akses</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
