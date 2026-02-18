
import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, AlertCircle, ArrowUpRight, TrendingUp, Ribbon, ChevronRight, Flower, Gift, Crown, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Customer, Sale } from '../types';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

interface InactiveCustomer {
  name: string;
  days: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({ revenue: 0, salesCount: 0, previousRevenue: 0 });
  const [monthlyData, setMonthlyData] = useState<{month: string, total: number}[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Customer[]>([]);
  const [topSpender, setTopSpender] = useState<{ name: string; total: number } | null>(null);
  const [inactiveCustomers, setInactiveCustomers] = useState<InactiveCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: sales } = await supabase.from('sales').select('*, customer:customers(*)');
      const { data: customers } = await supabase.from('customers').select('*');
      
      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (sales) {
        let currentMonthTotal = 0;
        let prevMonthTotal = 0;
        let todaySalesCount = 0;
        
        // Usar uma chave sortable (YYYY-MM) para garantir ordem cronológica
        const monthsMap: Record<string, number> = {};
        const customerSpendMap: Record<string, { name: string, total: number }> = {};

        sales.forEach(sale => {
          const date = new Date(sale.created_at);
          const saleISO = date.toISOString().split('T')[0];
          const m = date.getMonth();
          const y = date.getFullYear();
          
          // Chave para ordenação: 2024-11, 2024-12, 2025-01...
          const sortKey = `${y}-${(m + 1).toString().padStart(2, '0')}`;
          monthsMap[sortKey] = (monthsMap[sortKey] || 0) + Number(sale.value);

          // Vendas do Dia
          if (saleISO === todayISO) {
            todaySalesCount++;
          }

          // Stats do mês atual e anterior
          if (m === currentMonth && y === currentYear) {
            currentMonthTotal += Number(sale.value);
            const customerName = sale.customer?.name || 'Cliente';
            if (!customerSpendMap[customerName]) customerSpendMap[customerName] = { name: customerName, total: 0 };
            customerSpendMap[customerName].total += Number(sale.value);
          } else if (m === (currentMonth === 0 ? 11 : currentMonth - 1) && y === (currentMonth === 0 ? currentYear - 1 : currentYear)) {
            prevMonthTotal += Number(sale.value);
          }
        });

        // Ordenar as chaves (YYYY-MM) e pegar as últimas 3
        const sortedMonths = Object.keys(monthsMap)
          .sort()
          .slice(-3)
          .map(key => {
            const [y, m] = key.split('-');
            const d = new Date(parseInt(y), parseInt(m) - 1, 1);
            return {
              month: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '') + '/' + y.slice(-2),
              total: monthsMap[key]
            };
          });

        setMonthlyData(sortedMonths);
        setStats({ 
          revenue: currentMonthTotal, 
          salesCount: todaySalesCount, 
          previousRevenue: prevMonthTotal 
        });

        const spender = Object.values(customerSpendMap).sort((a, b) => b.total - a.total)[0];
        setTopSpender(spender || null);
      }

      if (customers) {
        const upcoming = customers.filter(c => {
          if (!c.birthday) return false;
          const bday = new Date(c.birthday);
          const bdayThisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
          if (bdayThisYear < now) bdayThisYear.setFullYear(now.getFullYear() + 1);
          const diffDays = Math.ceil((bdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 15;
        }).slice(0, 3);
        setUpcomingBirthdays(upcoming);

        if (sales) {
          const inactive = customers.map(c => {
            const customerSales = sales
              .filter(s => s.customer_id === c.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            if (customerSales.length === 0) return { name: c.name, days: 999 };
            const lastSale = new Date(customerSales[0].created_at);
            const diff = Math.floor((now.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24));
            return { name: c.name, days: diff };
          }).filter(item => item.days >= 30).sort((a, b) => b.days - a.days).slice(0, 3);
          setInactiveCustomers(inactive);
        }
      }

      const { data: products } = await supabase.from('products').select('*').lt('stock', 3);
      if (products) setLowStock(products);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const growth = stats.previousRevenue > 0 ? ((stats.revenue - stats.previousRevenue) / stats.previousRevenue) * 100 : 0;

  if (loading) return <div className="p-10 animate-pulse text-center text-[10px] font-black uppercase tracking-widest text-gray-300">Sincronizando Boutique...</div>;

  return (
    <div className="space-y-6">
      {/* Revenue Card - FLUXO DA BOUTIQUE */}
      <div className="bg-gray-950 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute -right-10 -top-10 p-8 opacity-10 blur-2xl bg-purple-500 w-40 h-40 rounded-full"></div>
        <div className="absolute right-6 top-6 opacity-20">
          <Sparkles size={40} className="text-purple-300" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Fluxo da Boutique</span>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${growth >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% performance
            </div>
          </div>

          <div className="text-center">
            <p className="text-4xl font-black tracking-tighter mb-1">
              R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Saldo Atual {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
          </div>

          <div className="h-px bg-white/10 w-full border-t border-dashed border-white/20"></div>

          {/* Meses Centralizados */}
          <div className="flex justify-center gap-8 items-center">
            {monthlyData.map((data, i) => (
              <div key={i} className="space-y-1 text-center">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{data.month}</p>
                <p className="text-xs font-black">R$ {data.total > 1000 ? (data.total / 1000).toFixed(1) + 'k' : data.total.toFixed(0)}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onNavigate('financial')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Análise Financeira Completa</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Quadros de Vendas e Reposição Centralizados */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="bg-pink-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
            <Ribbon size={28} className="text-pink-400" />
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Vendas do Dia</p>
          <p className="text-3xl font-black text-gray-900">{stats.salesCount}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
            <Flower size={28} className="text-purple-400" />
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Reposição</p>
          <p className="text-3xl font-black text-red-600">{lowStock.length}</p>
        </div>
      </div>

      {/* Seção de Inteligência & CRM */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm space-y-4 p-2">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
           <TrendingUp size={16} className="text-indigo-400" />
           <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Inteligência CRM</h2>
        </div>
        
        <div className="px-4 space-y-4 pb-4">
          {topSpender && (
            <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                  <Crown size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Estrela do Mês</p>
                  <p className="text-xs font-black text-gray-900 uppercase">{topSpender.name}</p>
                </div>
              </div>
              <p className="text-sm font-black text-indigo-600">R$ {topSpender.total.toFixed(0)}</p>
            </div>
          )}

          {upcomingBirthdays.length > 0 && (
            <div className="bg-pink-50/50 p-4 rounded-3xl border border-pink-100 space-y-3">
              <div className="flex items-center gap-2 text-pink-400">
                <Gift size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Aniversariantes (Próx. 15 dias)</span>
              </div>
              <div className="space-y-2">
                {upcomingBirthdays.map(c => (
                  <div key={c.id} className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-700 uppercase">{c.name}</p>
                    <p className="text-[8px] font-black text-pink-500 bg-white px-2 py-1 rounded-lg shadow-sm uppercase">
                      {c.birthday ? new Date(c.birthday).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveCustomers.length > 0 && (
            <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Clock size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Recuperação (+30 dias)</span>
              </div>
              <div className="space-y-2">
                {inactiveCustomers.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group cursor-pointer" onClick={() => onNavigate('customers')}>
                    <p className="text-[10px] font-bold text-gray-700 uppercase">{item.name}</p>
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Há {item.days} dias</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de Estoque - Reposição Urgente */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-400" />
            Reposição Urgente
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {lowStock.length > 0 ? (
            lowStock.map(product => (
              <button 
                key={product.id} 
                onClick={() => onNavigate('inventory')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-300">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{product.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">{product.reference_code || 'S/ REF'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-black text-red-600">{product.stock} un</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-200" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-xs text-gray-200 font-black uppercase tracking-widest">Estoque Impecável ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
