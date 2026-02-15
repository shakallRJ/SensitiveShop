
import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Plus, Phone, X, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setCustomers(data);
    } catch (e) { 
      console.error('Erro ao buscar clientes:', e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;

    setIsSaving(true);
    setErrorMessage('');
    
    try {
      const payload = {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.replace(/\D/g, '')
      };

      const { error } = await supabase
        .from('customers')
        .insert([payload]);

      if (error) {
        console.error("Erro no Supabase:", error);
        throw new Error(error.message);
      }

      setNewCustomer({ name: '', phone: '' });
      setShowForm(false);
      fetchCustomers();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao registrar diva.');
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name} ✨, tudo bem?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Minhas Divas..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-sm shadow-sm focus:ring-2 focus:ring-black transition-all font-bold outline-none text-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-14 h-14 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center ${showForm ? 'bg-white text-black border border-gray-200' : 'bg-black text-white'}`}
        >
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddCustomer} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in slide-in-from-top-6 duration-300 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-black uppercase tracking-[0.3em]">Novo Cadastro</h3>
            <UserPlus size={16} className="text-gray-300" />
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nome da Diva"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-sm font-bold focus:border-black outline-none transition-all text-black"
              value={newCustomer.name}
              onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              required
            />
            <input 
              type="tel" 
              placeholder="WhatsApp (Ex: 11999998888)"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-sm font-bold focus:border-black outline-none transition-all text-black"
              value={newCustomer.phone}
              onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
              required
            />
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-[10px] font-bold flex gap-2 items-center border border-red-100">
              <AlertCircle size={14} /> {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Registrando...' : 'Confirmar Diva'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-300 text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando Divas...</div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filtered.map(customer => (
              <div key={customer.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-black text-lg border-4 border-gray-50 shadow-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-black uppercase tracking-tight leading-tight">{customer.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest flex items-center gap-1 mt-1">
                      <Phone size={10} className="text-gray-300" /> {customer.phone}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => openWhatsApp(customer.phone, customer.name)}
                  className="w-12 h-12 bg-white border border-gray-100 text-black rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm active:scale-90"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">Nenhuma diva no momento.</div>
        )}
      </div>
    </div>
  );
};

export default Customers;
