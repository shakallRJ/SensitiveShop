
import React, { useState, useEffect } from 'react';
import { Plus, X, Wallet, Search, Trash2, Calendar, Tag, Filter, ChevronRight, DollarSign, ArrowRight, TrendingDown, Edit2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados de Gerenciamento
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Variável',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (data) setExpenses(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        description: newExpense.description.trim(),
        amount: parseFloat(newExpense.amount.toString().replace(',', '.')),
        category: newExpense.category,
        date: newExpense.date
      };

      if (editingId) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert([payload]);
        if (error) throw error;
      }

      setNewExpense({ description: '', amount: '', category: 'Variável', date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      setEditingId(null);
      fetchExpenses();
    } catch (e) { 
      alert('Erro ao processar despesa.'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setNewExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await supabase.from('expenses').delete().eq('id', deletingId);
      setDeletingId(null);
      fetchExpenses();
    } catch (e) { console.error(e); }
  };

  const totalMonth = expenses.reduce((acc, exp) => {
    const expDate = new Date(exp.date);
    const now = new Date();
    if (expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()) {
      return acc + Number(exp.amount);
    }
    return acc;
  }, 0);

  const totalAllTime = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Modal de Confirmação de Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-black uppercase tracking-widest">Excluir Lançamento?</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                Esta ação removerá o custo permanentemente dos seus registros financeiros.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              >
                Voltar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-200"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 shadow-sm relative overflow-hidden">
        <div className="absolute right-6 top-6 opacity-10">
          <TrendingDown size={40} className="text-red-500" />
        </div>
        <div className="relative z-10 space-y-2">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Gastos do Mês</p>
          <h2 className="text-3xl font-black text-red-600">
            R$ {totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
          <div className="h-px bg-red-200/50 w-full mt-4 mb-2"></div>
          <p className="text-[9px] font-bold text-red-400/60 uppercase tracking-widest">
            Histórico: R$ {totalAllTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {expenses.length} lançamentos
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar despesa..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-xs shadow-sm focus:border-black transition-all font-bold outline-none text-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setNewExpense({ description: '', amount: '', category: 'Variável', date: new Date().toISOString().split('T')[0] });
            }
          }} 
          className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center shrink-0 ${showForm ? 'bg-white text-black border border-gray-100' : 'bg-red-600 text-white'}`}
        >
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveExpense} className={`bg-white border-2 ${editingId ? 'border-purple-100' : 'border-red-50'} rounded-[2.5rem] p-8 shadow-2xl space-y-4 animate-in slide-in-from-top-4 transition-colors`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${editingId ? 'text-purple-600' : 'text-red-600'}`}>
              {editingId ? 'Editar Despesa' : 'Lançar Despesa'}
            </h3>
            <Wallet size={16} className={editingId ? 'text-purple-300' : 'text-red-300'} />
          </div>
          
          <input 
            type="text" 
            placeholder="Descrição (Ex: Aluguel)" 
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none focus:border-black transition-all" 
            value={newExpense.description} 
            onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
            required 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">R$</span>
              <input 
                type="text" 
                placeholder="0,00" 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-10 pr-4 text-xs font-bold text-red-600 outline-none focus:border-black transition-all" 
                value={newExpense.amount} 
                onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
                required 
              />
            </div>
            <select 
              className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-4 text-[10px] font-black uppercase tracking-widest text-black outline-none focus:border-black transition-all" 
              value={newExpense.category} 
              onChange={e => setNewExpense({...newExpense, category: e.target.value})}
            >
              <option value="Fixo">Custo Fixo</option>
              <option value="Variável">Variável</option>
              <option value="Marketing">Marketing</option>
              <option value="Estoque">Estoque</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          
          <input 
            type="date" 
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none focus:border-black transition-all" 
            value={newExpense.date} 
            onChange={e => setNewExpense({...newExpense, date: e.target.value})} 
          />
          
          <div className="flex gap-2 pt-2">
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setShowForm(false);
                  setNewExpense({ description: '', amount: '', category: 'Variável', date: new Date().toISOString().split('T')[0] });
                }}
                className="px-6 bg-gray-100 rounded-2xl text-gray-400 font-black text-[10px] uppercase tracking-widest"
              >
                Cancelar
              </button>
            )}
            <button 
              type="submit" 
              disabled={isSaving} 
              className={`flex-1 ${editingId ? 'bg-purple-600' : 'bg-red-600'} text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all`}
            >
              {isSaving ? 'Processando...' : editingId ? 'Salvar Alterações' : 'Confirmar Saída'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden divide-y divide-gray-50">
        {loading ? (
          <div className="p-16 text-center text-gray-300 text-xs font-black uppercase animate-pulse">Consultando Extrato...</div>
        ) : filteredExpenses.length > 0 ? (
          filteredExpenses.map(exp => (
            <div key={exp.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-black uppercase tracking-tight">{exp.description}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{exp.category} • {new Date(exp.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-black text-red-600">R$ {Number(exp.amount).toFixed(2)}</p>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => startEdit(exp)}
                    className="p-2 text-gray-200 hover:text-purple-500 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setDeletingId(exp.id)} 
                    className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center text-gray-200 text-[10px] font-black uppercase tracking-[0.3em]">Nenhuma despesa lançada</div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
