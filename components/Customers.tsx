
import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Plus, Phone, X, UserPlus, AlertCircle, Gift, Mail, Instagram, ChevronRight, ReceiptText, Calendar, ArrowUpRight, TrendingUp, History, Edit2, DollarSign, Clock, Crown, Star, Gem } from 'lucide-react';
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
  
  // Estado para Edição
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.replace(/\D/g, ''),
        email: newCustomer.email.trim(),
        instagram: newCustomer.instagram.trim().replace('@', ''),
        birthday: newCustomer.birthday || null
      };

      if (editingId) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert([payload]);
        if (error) throw error;
      }

      setNewCustomer({ name: '', phone: '', email: '', instagram: '', birthday: '' });
      setShowForm(false);
      setEditingId(null);
      fetchCustomers();
    } catch (e) {
      alert('Erro ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      instagram: customer.instagram || '',
      birthday: customer.birthday || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateMetrics = (sales: Sale[]) => {
    const totalValue = sales.reduce((acc, s) => acc + Number(s.value), 0);
    const uniqueOrders = new Set(sales.map(s => s.order_id)).size;
    const avgTicket = uniqueOrders > 0 ? totalValue / uniqueOrders : 0;
    
    let lastPurchaseDate = null;
    let daysInactive = 0;
    
    if (sales.length > 0) {
      lastPurchaseDate = new Date(sales[0].created_at);
      daysInactive = Math.floor((new Date().getTime() - lastPurchaseDate.getTime()) / (1000 * 3600 * 24));
    }

    return { totalValue, frequency: uniqueOrders, avgTicket, daysInactive, lastPurchaseDate };
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
    <div className="space-y-6 pb-20">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou celular..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-sm shadow-sm focus:border-black transition-all font-bold outline-none text-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) setEditingId(null);
          }} 
          className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center shrink-0 ${showForm ? 'bg-white text-black border border-gray-100' : 'bg-black text-white'}`}
        >
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveCustomer} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-black uppercase tracking-[0.3em]">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
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
            <input type="text" placeholder="instagram (sem @)" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-black outline-none" value={newCustomer.instagram} onChange={e => setNewCustomer({...newCustomer, instagram: e.target.value})} />
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-[0.98] transition-all">
            {isSaving ? 'Gravando...' : editingId ? 'Salvar Alterações' : 'Confirmar Cliente'}
          </button>
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
                  <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => fetchHistory(customer.id)}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-4 shadow-sm relative ${isBday ? 'bg-pink-500 text-white border-pink-100 animate-bounce' : 'bg-black text-white border-gray-50'}`}>
                      {customer.name.charAt(0).toUpperCase()}
                      {isBday && <Gift size={14} className="absolute -top-1 -right-1 text-pink-500 bg-white rounded-full p-0.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-black uppercase tracking-tight">{customer.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">{customer.instagram ? `@${customer.instagram}` : 'Sem IG'}</span>
                        {isBday && <span className="text-[8px] font-black text-pink-500 uppercase tracking-widest">Aniversário Hoje! ✨</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEdit(customer)}
                      className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-200 hover:text-black transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => openWhatsApp(customer.phone, customer.name, isBday)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${isBday ? 'bg-pink-500 text-white' : 'bg-white border border-gray-100 text-black hover:bg-black hover:text-white'}`}
                    >
                      {isBday ? <Gift size={20}/> : <MessageCircle size={20} />}
                    </button>
                    <button onClick={() => fetchHistory(customer.id)} className={`w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center transition-all ${selectedCustomerId === customer.id ? 'rotate-90 bg-black text-white' : ''}`}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {selectedCustomerId === customer.id && (
                  <div className="px-4 pb-6 pt-2 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-gray-100 mx-4 border-t border-dashed border-gray-200"></div>
                    
                    {/* Dashboard CRM da Cliente */}
                    {(() => {
                      const metrics = calculateMetrics(customerSales);
                      return (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm text-center">
                            <Gem size={12} className="text-purple-300 mx-auto mb-1 opacity-50" />
                            <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Lifetime Value</p>
                            <p className="text-sm font-black text-black">R$ {metrics.totalValue.toFixed(0)}</p>
                          </div>
                          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm text-center">
                            <Star size={12} className="text-amber-300 mx-auto mb-1 opacity-50" />
                            <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Ticket Médio</p>
                            <p className="text-sm font-black text-black">R$ {metrics.avgTicket.toFixed(0)}</p>
                          </div>
                          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm text-center">
                            <History size={12} className="text-emerald-300 mx-auto mb-1 opacity-50" />
                            <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Frequência</p>
                            <p className="text-sm font-black text-black">{metrics.frequency}x</p>
                          </div>
                          
                          {/* Alerta de Inatividade */}
                          <div className={`col-span-3 p-3 rounded-2xl border flex items-center justify-between px-5 ${
                            metrics.daysInactive > 60 ? 'bg-red-50 border-red-100 text-red-500' :
                            metrics.daysInactive > 30 ? 'bg-amber-50 border-amber-100 text-amber-600' :
                            'bg-emerald-50 border-emerald-100 text-emerald-600'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                {metrics.daysInactive === 0 ? 'Comprou hoje!' : `Última compra há ${metrics.daysInactive} dias`}
                              </span>
                            </div>
                            <span className="text-[8px] font-black uppercase bg-white/50 px-3 py-1 rounded-full">
                              {metrics.daysInactive > 60 ? 'Risco de Perda' : metrics.daysInactive > 30 ? 'Atenção' : 'Fiel / Ativa'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                          <Crown size={16} className="text-amber-500" /> 
                          Pedidos Realizados
                        </h4>
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      </div>

                      {customerSales.length > 0 ? (
                        <div className="space-y-3">
                          {customerSales.map(s => (
                            <div key={s.id} className="flex justify-between items-center group bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                  <ArrowUpRight size={16} className="text-emerald-500" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-black uppercase truncate max-w-[120px]">{s.product?.name}</p>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{new Date(s.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-emerald-600">R$ {Number(s.value).toFixed(2)}</p>
                                <p className="text-[8px] font-bold text-gray-300 uppercase">{s.amount} un.</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center space-y-2">
                          <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 border border-gray-100">
                            <ReceiptText size={18} className="text-gray-300" />
                          </div>
                          <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Nenhuma compra registrada</p>
                        </div>
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
