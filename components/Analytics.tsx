
import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, PieChart as PieIcon, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Sale, Product } from '../types';

interface AnalyticsProps {
  onBack: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const [data, setData] = useState<{name: string, sales: number, profit: number}[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, cost: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#000000', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: salesData } = await supabase.from('sales').select('*, product:products(*)');
      
      if (salesData) {
        let totalRev = 0;
        let totalCost = 0;
        const productStats: Record<string, {name: string, sales: number, profit: number}> = {};
        
        salesData.forEach((sale: any) => {
          const product = sale.product;
          if (!product) return;
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

  // Cálculo do Gráfico de Pizza SVG
  const totalSalesCount = data.reduce((acc, d) => acc + d.sales, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  if (loading) return <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest animate-pulse">Gerando Inteligência...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors">
        <ArrowLeft size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
      </button>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Lucratividade</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Desempenho Real da Boutique</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100">
          <DollarSign size={18} className="text-emerald-600 mb-4" />
          <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-1">Lucro Bruto</p>
          <p className="text-xl font-black text-emerald-600">R$ {totals.profit.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100">
          <PieIcon size={18} className="text-indigo-600 mb-4" />
          <p className="text-[9px] font-black text-indigo-800/40 uppercase tracking-widest mb-1">Margem Média</p>
          <p className="text-xl font-black text-indigo-600">
            {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Gráfico de Pizza SVG Customizado */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8">
        <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
          <PieIcon size={14} className="text-indigo-500" /> Distribuição de Vendas
        </h3>
        
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-48 h-48">
            <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
              {data.map((item, i) => {
                const percent = item.sales / totalSalesCount;
                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += percent;
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                const largeArcFlag = percent > 0.5 ? 1 : 0;
                const pathData = [
                  `M ${startX} ${startY}`,
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  `L 0 0`,
                ].join(' ');
                return <path key={i} d={pathData} fill={COLORS[i % COLORS.length]} />;
              })}
            </svg>
            <div className="absolute inset-10 bg-white rounded-full flex items-center justify-center shadow-inner">
              <span className="text-[10px] font-black text-black uppercase">Mix {data.length}</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            {data.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] font-black text-black uppercase truncate max-w-[150px]">{item.name}</span>
                </div>
                <span className="text-[10px] font-black text-gray-300">{Math.round((item.sales / totalSalesCount) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
          * Dados baseados nas Top 5 peças com maior volume de saída.
        </p>
      </div>
    </div>
  );
};

export default Analytics;
