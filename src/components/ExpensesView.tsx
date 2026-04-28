import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { ExpenseRecord } from '../types';
import { format } from 'date-fns';
import { Trash2, Wallet, Euro, Coffee } from 'lucide-react';

export function ExpensesView() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category] = useState('Pauzë');

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
    
    // Sort and update state
    allExpenses.sort((a: ExpenseRecord, b: ExpenseRecord) => 
      new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
    );
    setExpenses(allExpenses.filter((e: ExpenseRecord) => e.userId === user.uid));
    
    setAmount('');
    setDescription('');
  };

  const deleteExpense = (id: string) => {
    const allExpenses = JSON.parse(localStorage.getItem('pl_expenses') || '[]');
    const filtered = allExpenses.filter((e: ExpenseRecord) => e.id !== id);
    localStorage.setItem('pl_expenses', JSON.stringify(filtered));
    setExpenses(filtered.filter((e: ExpenseRecord) => e.userId === user?.uid));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Shpenzimet</h2>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3">
          <Wallet className="w-5 h-5" />
          <span className="text-lg font-black">€{expenses.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">Shto Shpenzim</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  placeholder="Shuma (€)"
                  required
                />
              </div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[100px] text-sm"
                placeholder="Përshkrimi..."
                required
              />
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg"
              >
                RUAJ
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {expenses.map((expense) => (
            <div 
              key={expense.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">{expense.description}</h5>
                  <p className="text-[10px] text-slate-400 uppercase font-black">{expense.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-lg font-black text-slate-800">€{expense.amount.toFixed(2)}</span>
                <button onClick={() => expense.id && deleteExpense(expense.id)} className="p-2 text-rose-500 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Nuk ka shpenzime të regjistruara.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
