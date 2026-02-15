
import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Plus, Phone, X, UserPlus, AlertCircle, Gift, Mail, Instagram, ChevronRight, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Customer, Sale } from '../types';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    birthday: ''
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
      if (error) throw error;
      if (data) setCustomers(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchHistory = async (id: string) => {
    if (selectedCustomerId === id) {
      setSelectedCustomerId(null);
      return;
    }
    const { data } = await supabase.from('sales').select('*, product:products(*)').eq('customer_id', id).order('created_at', { ascending: false });
    if (data) setCustomerSales(data);
    setSelectedCustomerId(id);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('customers').insert([{
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.replace(/\D/g, ''),
        email: newCustomer.email.trim(),
        instagram: newCustomer.instagram.trim(),
        birthday: newCustomer.birthday || null
      }]);
      if (error) throw error;
      setNewCustomer({ name: '', phone: '', email: '', instagram: '', birthday: '' });
      setShowForm(false);
      fetchCustomers();
    } catch (e) {
      alert('Erro ao cadastrar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsApp = (phone: string, name: string, isBirthday: boolean) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = isBirthday 
      ? `Parabéns ${name}! ✨ Notamos que é seu aniversário hoje e preparamos um cupom especial para você na Sensitive Shop! 🎁`
      : `Olá ${name} ✨, temos novidades incríveis na boutique!`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isTodayBirthday = (birthdayStr?: string) => {
    if (!birthdayStr) return false;
    const today = new Date();
    const bday = new Date(birthdayStr);
    return today.getDate() + 1 === bday.getDate() + 1 && today.getMonth() === bday.getMonth();
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Minhas Clientes..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-sm shadow-sm focus:border-black transition-all font-bold outline-none text-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center ${showForm ? 'bg-white text-black border border-gray-100' : 'bg-black text-white'}`}>
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddCustomer} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-black uppercase tracking-[0.3em]">Novo Cliente</h3>
            <UserPlus size={16} className="text-gray-300" />
          </div>
          <input type="text" placeholder="Nome Completo" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <input type="tel" placeholder="WhatsApp" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} required />
            <input type="date" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newCustomer.birthday} onChange={e => setNewCustomer({...newCustomer, birthday: e.target.value})} />
          </div>
          <input type="email" placeholder="E-mail" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
          <div className="relative">
            <Instagram size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-pink-400" />
            <input type="text" placeholder="@instagram" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-black outline-none" value={newCustomer.instagram} onChange={e => setNewCustomer({...newCustomer, instagram: e.target.value})} />
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl">{isSaving ? 'Gravando...' : 'Confirmar Cliente'}</button>
        </form>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {loading ? (
          <div className="p-16 text-center text-gray-300 text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando Base...</div>
        ) : filtered.length > 0 ? (
          filtered.map(customer => {
            const isBday = isTodayBirthday(customer.birthday);
            return (
              <div key={customer.id} className="p-2 transition-all">
                <div className={`p-4 flex items-center justify-between rounded-3xl ${selectedCustomerId === customer.id ? 'bg-gray-50 shadow-inner' : 'bg-white hover:bg-gray-50/50'}`}>
                  <div className="flex items-center gap-4 flex-1" onClick={() => fetchHistory(customer.id)}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-4 shadow-sm relative ${isBday ? 'bg-pink-500 text-white border-pink-100 animate-bounce' : 'bg-black text-white border-gray-50'}`}>
                      {customer.name.charAt(0).toUpperCase()}
                      {isBday && <Gift size={14} className="absolute -top-1 -right-1 text-pink-500 bg-white rounded-full p-0.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-black uppercase tracking-tight">{customer.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">{customer.instagram || 'Sem IG'}</span>
                        {isBday && <span className="text-[8px] font-black text-pink-500 uppercase tracking-widest">Aniversário Hoje! ✨</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openWhatsApp(customer.phone, customer.name, isBday)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${isBday ? 'bg-pink-500 text-white' : 'bg-white border border-gray-100 text-black hover:bg-black hover:text-white'}`}
                    >
                      {isBday ? <Gift size={18}/> : <MessageCircle size={18} />}
                    </button>
                    <button onClick={() => fetchHistory(customer.id)} className={`w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center transition-all ${selectedCustomerId === customer.id ? 'rotate-90 bg-black text-white' : ''}`}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Aba de Compras (Histórico) */}
                {selectedCustomerId === customer.id && (
                  <div className="px-4 pb-4 pt-2 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-gray-100 mx-4"></div>
                    <div className="flex gap-3 px-4 py-2">
                      {customer.email && <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase"><Mail size={10}/> {customer.email}</div>}
                      {customer.birthday && <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase"><Gift size={10}/> {new Date(customer.birthday).toLocaleDateString('pt-BR')}</div>}
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                      <h4 className="text-[9px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag size={10} className="text-indigo-400" /> Histórico de Compras
                      </h4>
                      {customerSales.length > 0 ? (
                        <div className="space-y-2">
                          {customerSales.map(s => (
                            <div key={s.id} className="flex justify-between items-center text-[10px] bg-gray-50 p-2 rounded-lg">
                              <div>
                                <span className="font-black text-black uppercase">{s.product?.name}</span>
                                <span className="text-gray-400 ml-2">({s.amount}x)</span>
                              </div>
                              <span className="font-black text-emerald-600">R$ {Number(s.value).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-gray-300 font-bold uppercase text-center py-4 tracking-widest">Nenhuma compra registrada</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">Nenhuma cliente no momento.</div>
        )}
      </div>
    </div>
  );
};

export default Customers;
