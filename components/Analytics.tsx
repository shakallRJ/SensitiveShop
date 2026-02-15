
import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, PieChart, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Sale, Product } from '../types';

interface AnalyticsProps {
  onBack: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const [data, setData] = useState<{name: string, sales: number, profit: number}[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, cost: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: salesData } = await supabase.from('sales').select('*, product:products(*)');
      const { data: productsData } = await supabase.from('products').select('*');
      
      if (salesData && productsData) {
        let totalRev = 0;
        let totalCost = 0;
        
        // Agrupar por produto
        const productStats: Record<string, {name: string, sales: number, profit: number}> = {};
        
        salesData.forEach((sale: any) => {
          const product = sale.product;
          const rev = Number(sale.value);
          const cost = Number(product.purchase_price) * Number(sale.amount);
          
          totalRev += rev;
          totalCost += cost;
          
          if (!productStats[product.id]) {
            productStats[product.id] = { name: product.name, sales: 0, profit: 0 };
          }
          productStats[product.id].sales += Number(sale.amount);
          productStats[product.id].profit += (rev - cost);
        });

        const chartData = Object.values(productStats).sort((a, b) => b.sales - a.sales).slice(0, 5);
        setData(chartData);
        setTotals({ revenue: totalRev, cost: totalCost, profit: totalRev - totalCost });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const maxSales = Math.max(...data.map(d => d.sales), 1);

  if (loading) return <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest animate-pulse">Gerando Inteligência...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors">
        <ArrowLeft size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
      </button>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Lucratividade</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Desempenho Real da Boutique</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100">
          <div className="flex justify-between items-start mb-4">
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-1">Lucro Bruto</p>
          <p className="text-xl font-black text-emerald-600">R$ {totals.profit.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100">
          <div className="flex justify-between items-start mb-4">
            <PieChart size={18} className="text-indigo-600" />
          </div>
          <p className="text-[9px] font-black text-indigo-800/40 uppercase tracking-widest mb-1">Margem Média</p>
          <p className="text-xl font-black text-indigo-600">
            {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Gráfico de Peças */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} className="text-indigo-500" />
            Top Peças Vendidas
          </h3>
          <Info size={14} className="text-gray-200" />
        </div>

        <div className="space-y-8">
          {data.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-black uppercase tracking-tight truncate max-w-[60%]">{item.name}</span>
                <span className="text-[9px] font-black text-gray-300 uppercase">{item.sales} un | +R$ {item.profit.toFixed(0)}</span>
              </div>
              <div className="h-4 bg-gray-50 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-black rounded-full transition-all duration-1000" 
                  style={{ width: `${(item.sales / maxSales) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
          {data.length === 0 && <p className="text-center text-gray-300 text-[10px] font-black uppercase py-10">Sem dados suficientes</p>}
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
          * A margem é baseada no Preço de Compra vs Preço Final da Venda (já com descontos aplicados).
        </p>
      </div>
    </div>
  );
};

export default Analytics;
