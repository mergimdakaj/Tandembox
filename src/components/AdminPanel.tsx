import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  UserPlus, 
  Search, 
  MoreVertical
} from 'lucide-react';

export function AdminPanel() {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUid, setNewUid] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');

  useEffect(() => {
    const loadUsers = () => {
      const users = JSON.parse(localStorage.getItem('pl_users') || '[]');
      // Add default mergim user if not exists
      if (users.length === 0) {
        const defaultUsers = [
          {
            uid: 'mergim-id',
            name: 'Mergim',
            email: 'mergim@primelink.com',
            role: 'admin',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('pl_users', JSON.stringify(defaultUsers));
        setEmployees(defaultUsers);
      } else {
        setEmployees(users);
      }
    };

    loadUsers();
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newUid) return;

    const newUser: UserProfile = {
      uid: newUid,
      name: newName,
      email: newEmail,
      role: newRole,
      createdAt: new Date().toISOString(),
    };

    const users = JSON.parse(localStorage.getItem('pl_users') || '[]');
    users.push(newUser);
    localStorage.setItem('pl_users', JSON.stringify(users));
    setEmployees(users);

    setShowAdd(false);
    setNewName('');
    setNewEmail('');
    setNewUid('');
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Admin</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          {showAdd ? 'Anulo' : 'Shto Punonjës'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              placeholder="Emri i Plotë"
              required
            />
            <input 
              type="email" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              placeholder="Emaili"
              required
            />
            <input 
              type="text" 
              value={newUid}
              onChange={(e) => setNewUid(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              placeholder="Firebase UID"
              required
            />
            <select 
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            >
              <option value="employee">Punonjës</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="md:col-span-2 bg-slate-900 text-white font-bold py-4 rounded-xl">KRIJO</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Punonjësit ({employees.length})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Kërko..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map((emp) => (
              <tr key={emp.uid} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                  <p className="text-[10px] text-slate-500">{emp.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-slate-100">{emp.role}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <MoreVertical className="w-4 h-4 text-slate-300 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
