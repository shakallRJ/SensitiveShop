
import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, AlertCircle, ArrowUpRight, TrendingUp, Users, Target, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({ revenue: 0, salesCount: 0 });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: sales } = await supabase.from('sales').select('value');
      if (sales) {
        const total = sales.reduce((acc, sale) => acc + Number(sale.value), 0);
        setStats({ revenue: total, salesCount: sales.length });
      }
      const { data: products } = await supabase.from('products').select('*').lt('stock', 3);
      if (products) setLowStock(products);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 animate-pulse text-center text-[10px] font-black uppercase tracking-widest text-gray-300">Carregando métricas...</div>;

  return (
    <div className="space-y-6">
      {/* Revenue Card com Link BI */}
      <button 
        onClick={() => onNavigate('analytics')}
        className="w-full bg-gray-950 rounded-[2rem] p-7 text-white shadow-2xl relative overflow-hidden text-left group active:scale-[0.98] transition-all"
      >
        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Faturamento Mensal</span>
            <div className="bg-emerald-500/20 p-2 rounded-full">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-4xl font-black tracking-tighter mb-1">
            R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ver Análise de Lucro</p>
            <ArrowUpRight size={12} className="text-emerald-400" />
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
          <div className="bg-indigo-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingBag size={20} className="text-indigo-600" />
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pedidos</p>
          <p className="text-2xl font-black text-gray-900">{stats.salesCount}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
          <div className="bg-amber-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
            <Target size={20} className="text-amber-600" />
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Estoque Baixo</p>
          <p className="text-2xl font-black text-red-600">{lowStock.length}</p>
        </div>
      </div>

      {/* Alerta de Estoque - Clicável */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
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
              <p className="text-xs text-gray-300 font-black uppercase tracking-widest">Tudo em conformidade ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
