
import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, AlertCircle, ArrowUpRight, TrendingUp, Users, Target, ChevronRight, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({ revenue: 0, salesCount: 0, previousRevenue: 0 });
  const [monthlyData, setMonthlyData] = useState<{month: string, total: number}[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: sales } = await supabase.from('sales').select('value, created_at');
      
      if (sales) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let currentTotal = 0;
        let prevTotal = 0;
        const monthsMap: Record<string, number> = {};

        sales.forEach(sale => {
          const date = new Date(sale.created_at);
          const monthLabel = date.toLocaleString('pt-BR', { month: 'short' });
          const m = date.getMonth();
          const y = date.getFullYear();
          
          const key = `${monthLabel}/${y.toString().slice(-2)}`;
          monthsMap[key] = (monthsMap[key] || 0) + Number(sale.value);

          if (m === currentMonth && y === currentYear) {
            currentTotal += Number(sale.value);
          } else if (m === (currentMonth === 0 ? 11 : currentMonth - 1) && y === (currentMonth === 0 ? currentYear - 1 : currentYear)) {
            prevTotal += Number(sale.value);
          }
        });

        const sortedMonths = Object.entries(monthsMap)
          .map(([month, total]) => ({ month, total }))
          .slice(-3); // Pega os últimos 3 meses

        setMonthlyData(sortedMonths);
        setStats({ revenue: currentTotal, salesCount: sales.filter(s => new Date(s.created_at).getMonth() === currentMonth).length, previousRevenue: prevTotal });
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
      {/* Revenue Card Multi-Mês */}
      <div className="bg-gray-950 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-5">
          <TrendingUp size={150} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Faturamento Mensal</span>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${growth >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs anterior
            </div>
          </div>

          <div>
            <p className="text-4xl font-black tracking-tighter mb-1">
              R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Saldo Atual {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
          </div>

          <div className="h-px bg-white/10 w-full"></div>

          <div className="grid grid-cols-3 gap-4">
            {monthlyData.map((data, i) => (
              <div key={i} className="space-y-1">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
          <div className="bg-indigo-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingBag size={20} className="text-indigo-600" />
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Vendas (Mês)</p>
          <p className="text-2xl font-black text-gray-900">{stats.salesCount}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
          <div className="bg-amber-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
            <Target size={20} className="text-amber-600" />
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Reposição</p>
          <p className="text-2xl font-black text-red-600">{lowStock.length}</p>
        </div>
      </div>

      {/* Alerta de Estoque */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
            Alertas de Loja
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
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
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
              <p className="text-xs text-gray-300 font-black uppercase tracking-widest">Estoque Impecável ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
