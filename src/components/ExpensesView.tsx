import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { ExpenseRecord } from '../types';
import { format } from 'date-fns';
import { Trash2, Euro, TrendingUp, X, Coffee, Wallet, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ExpensesView() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pauzë');

  useEffect(() => {
    if (!user) return;

    const loadData = () => {
      const allExpenses = JSON.parse(localStorage.getItem('pl_expenses') || '[]');
      const userExpenses = allExpenses.filter((e: ExpenseRecord) => e.userId === user.uid);
      
      // Sort by date desc
      userExpenses.sort((a: ExpenseRecord, b: ExpenseRecord) => 
        new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
      );
      setExpenses(userExpenses);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description) return;

    const newExpense: ExpenseRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      amount: parseFloat(amount),
      description,
      category,
      date: new Date().toISOString(),
    };

    const allExpenses = JSON.parse(localStorage.getItem('pl_expenses') || '[]');
    allExpenses.push(newExpense);
    localStorage.setItem('pl_expenses', JSON.stringify(allExpenses));
    window.dispatchEvent(new Event('storage'));

    // Reload
    const userExpenses = allExpenses.filter((e: ExpenseRecord) => e.userId === user.uid);
    userExpenses.sort((a: ExpenseRecord, b: ExpenseRecord) => 
      new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
    );
    setExpenses(userExpenses);

    setAmount('');
    setDescription('');
    setShowAddModal(false);
  };

  const deleteExpense = (id: string) => {
    const allExpenses = JSON.parse(localStorage.getItem('pl_expenses') || '[]');
    const filtered = allExpenses.filter((e: ExpenseRecord) => e.id !== id);
    localStorage.setItem('pl_expenses', JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));
    
    setExpenses(filtered.filter((e: ExpenseRecord) => e.userId === user?.uid));
  };

  // Group expenses by date to find the max day
  const expensesByDate = expenses.reduce((acc, exp) => {
    const dateStr = format(new Date(exp.date), 'yyyy-MM-dd');
    acc[dateStr] = (acc[dateStr] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  let maxSpendingDate = '';
  let maxSpendingAmount = 0;
  Object.keys(expensesByDate).forEach((dateStr) => {
    const sum = expensesByDate[dateStr];
    if (sum > maxSpendingAmount) {
      maxSpendingAmount = sum;
      maxSpendingDate = dateStr;
    }
  });

  const totalRegistered = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Take the 5 latest dates that had expenses to plot dynamically in our custom bar graph
  const barChartData = Object.keys(expensesByDate)
    .map((dateStr) => ({ dateStr, sum: expensesByDate[dateStr] }))
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    .slice(-5);

  const maxBarSum = Math.max(...barChartData.map(d => d.sum), 1);

  return (
    <div className="space-y-6">
      {/* Header Block exactly matching Screenshot 2 */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-1">Llogaria & Shpenzimet</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm">
            Regjistroni dhe monitoroni të gjitha shpenzimet ditore.
          </p>
        </div>
        
        {/* Large Blue Vertical Registration Button */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#4239b3] hover:bg-[#342caa] text-white rounded-[24px] flex items-center justify-center p-3 h-20 w-16 shadow-lg shadow-[#4239b3]/25 active:scale-95 transition-all text-sm font-black relative overflow-hidden flex-shrink-0"
        >
          <div className="flex gap-1.5 items-center leading-[1.1] font-black tracking-tighter text-left">
            <span className="text-sm">+</span>
            <span className="flex flex-col text-[10px] scale-95 font-bold uppercase select-none">
              <span>Re</span>
              <span>gji</span>
              <span>str</span>
              <span>o</span>
            </span>
          </div>
        </button>
      </div>

      {/* Main balance card matching screenshot 2 */}
      <div className="bg-white rounded-[32px] border border-[#eff1ff] shadow-sm p-6 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-[#4239b3]/70 uppercase tracking-widest leading-none mb-2">
            Shpenzimet Totale të Regjistruara
          </p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">
            €{totalRegistered.toFixed(2)}
          </h3>
        </div>

        {maxSpendingDate ? (
          <div className="flex items-center gap-3 bg-[#f3f2ff] p-4 rounded-2xl border border-[#e6e4ff]">
            {/* Wave chart/trending icon */}
            <div className="w-10 h-10 rounded-full bg-[#4239b3] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black tracking-wider text-[#4239b3] uppercase leading-none mb-1">
                DITA ME PASQYRË MË TË LARTË TË SHPENZIMEVE
              </p>
              <p className="text-xs font-bold text-slate-700 leading-none">
                {maxSpendingDate} <span className="font-black text-[#4239b3] ml-1.5">(Shuma: €{maxSpendingAmount.toFixed(2)})</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-medium">Nuk ka të dhëna mjaftueshëm për llogaritjen e ditës më të lartë.</div>
        )}
      </div>

      {/* Custom Bar Graph exactly aligned with Screenshot 2 */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <h4 className="text-base font-black text-slate-800 tracking-tight">Grafiku Financar i Shpenzimeve</h4>
          <p className="text-slate-400 text-xs font-semibold">Pasqyra mujore kualitative sipas datave dhe kategorive.</p>
        </div>

        <div className="pt-4 space-y-6">
          <p className="text-[10px] font-black text-[#4239b3]/90 uppercase tracking-widest">
            Evoluimi Shpenzues sipas datave (€)
          </p>
          
          {barChartData.length > 0 ? (
            <div className="h-44 flex items-end justify-around gap-2 pt-8 pb-2">
              {barChartData.map((data, idx) => {
                const heightPct = (data.sum / maxBarSum) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 max-w-[50px] group">
                    <span className="text-[9px] font-black text-[#4239b3] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                      €{data.sum.toFixed(0)}
                    </span>
                    <div className="w-full flex items-end justify-center h-28 bg-[#f5f6ff] rounded-t-xl overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="w-full bg-gradient-to-t from-[#4239b3] to-[#7f77ff] rounded-t-xl relative min-h-[4px]"
                      >
                        <div className="absolute top-1 left-1 px-1 py-0.5 rounded-full text-[8px] font-black text-white/90 leading-none truncate">
                          €{data.sum.toFixed(0)}
                        </div>
                      </motion.div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 tracking-tighter whitespace-nowrap">
                      {data.dateStr.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-300 italic text-xs">Regjistroni shpenzime për të ndërtuar grafikun.</div>
          )}
        </div>
      </div>

      {/* Expenses History List */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Lista e Shpenzimeve</h4>
        
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div 
              key={expense.id}
              className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-sm leading-snug">{expense.description}</h5>
                  <p className="text-[9px] text-[#4239b3] font-black uppercase tracking-wider">{expense.category} <span className="text-slate-300 mx-1">|</span> {format(new Date(expense.date), 'dd.MM.yyyy HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-slate-800">€{expense.amount.toFixed(2)}</span>
                <button 
                  onClick={() => expense.id && deleteExpense(expense.id)} 
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Nuk ka shpenzime të regjistruara.</p>
            </div>
          )}
        </div>
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
                <h3 className="text-xl font-black text-slate-800">Regjistro Shpenzim</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kategoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4239b3] font-bold text-slate-700"
                  >
                    <option value="Pauzë">Pauzë (Kafene/Ushqim)</option>
                    <option value="Materiale">Materiale Rafta</option>
                    <option value="Karburant">Karburant / Transport</option>
                    <option value="Vegla">Mjete / Vegla pune</option>
                    <option value="Tjetër">Tjetër</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Shuma (€)</label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-5 py-4 outline-none focus:ring-2 focus:ring-[#4239b3] text-lg font-black"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Përshkrimi</label>
                  <input 
                    type="text" 
                    placeholder="p.sh. Kafe apo materiale për punishtë"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#4239b3] font-bold"
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
                    className="flex-1 py-4 bg-[#4239b3] text-white font-bold rounded-2xl hover:bg-[#342caa] transition-all shadow-lg shadow-[#4239b3]/20 text-xs"
                  >
                    REGJISTRO
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
