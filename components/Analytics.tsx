
import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, PieChart as PieIcon, Info, Target, ArrowUp, ArrowDown, Settings2, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Sale, Product } from '../types';

interface AnalyticsProps {
  onBack: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ 
    revenue: 0, 
    cogs: 0, 
    netProfit: 0, 
    prevRevenue: 0,
    prevNetProfit: 0 
  });
  const [dailyProfit, setDailyProfit] = useState<{day: number, amount: number}[]>([]);
  const [idealProfitGoal, setIdealProfitGoal] = useState<number>(() => {
    return Number(localStorage.getItem('sensitive_ideal_profit') || 5000);
  });
  const [showGoalInput, setShowGoalInput] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const { data: salesData } = await supabase.from('sales').select('*, product:products(*)');
      
      if (salesData) {
        let currentRev = 0;
        let currentCogs = 0;
        let prevRev = 0;
        let prevNet = 0;
        
        const daysMap: Record<number, number> = {};

        salesData.forEach((sale: any) => {
          const product = sale.product;
          if (!product) return;

          const date = new Date(sale.created_at);
          const m = date.getMonth();
          const y = date.getFullYear();
          const d = date.getDate();

          const rev = Number(sale.value);
          const cost = Number(product.purchase_price) * Number(sale.amount);
          const profit = rev - cost;

          if (m === currentMonth && y === currentYear) {
            currentRev += rev;
            currentCogs += cost;
            daysMap[d] = (daysMap[d] || 0) + profit;
          } else if (m === (currentMonth === 0 ? 11 : currentMonth - 1) && y === (currentMonth === 0 ? currentYear - 1 : currentYear)) {
            prevRev += rev;
            prevNet += profit;
          }
        });

        // Formatar lucro diário (Evolução Acumulada)
        let accumulated = 0;
        const evolution = Object.entries(daysMap)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([day, profit]) => {
            accumulated += profit;
            return { day: Number(day), amount: accumulated };
          });

        setDailyProfit(evolution);
        setTotals({ 
          revenue: currentRev, 
          cogs: currentCogs, 
          netProfit: currentRev - currentCogs,
          prevRevenue: prevRev,
          prevNetProfit: prevNet
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = () => {
    localStorage.setItem('sensitive_ideal_profit', idealProfitGoal.toString());
    setShowGoalInput(false);
  };

  const revVariation = totals.prevRevenue > 0 ? ((totals.revenue - totals.prevRevenue) / totals.prevRevenue) * 100 : 0;
  const profitVariation = totals.prevNetProfit > 0 ? ((totals.netProfit - totals.prevNetProfit) / totals.prevNetProfit) * 100 : 0;
  const goalProgress = Math.min(100, (totals.netProfit / idealProfitGoal) * 100);

  // SVG Line Chart Logic
  const maxProfit = Math.max(...dailyProfit.map(d => d.amount), 1);
  const chartPoints = dailyProfit.map((d, i) => {
    const x = (i / (dailyProfit.length - 1 || 1)) * 100;
    const y = 100 - (d.amount / maxProfit) * 100;
    return `${x},${y}`;
  }).join(' ');

  if (loading) return <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest animate-pulse text-purple-300">Auditoria Financeira...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors">
        <ArrowLeft size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
      </button>

      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Análise Financeira</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inteligência de Boutique</p>
        </div>
        <button 
          onClick={() => setShowGoalInput(!showGoalInput)}
          className="p-3 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-colors"
        >
          <Settings2 size={18} />
        </button>
      </div>

      {showGoalInput && (
        <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 space-y-4 animate-in slide-in-from-top-4">
          <label className="text-[10px] font-black text-purple-900 uppercase tracking-widest block">Definir Meta de Lucro Líquido (R$)</label>
          <div className="flex gap-3">
            <input 
              type="number" 
              className="flex-1 bg-white border-2 border-purple-200 rounded-2xl py-3 px-6 text-sm font-black text-black outline-none focus:border-purple-500"
              value={idealProfitGoal}
              onChange={e => setIdealProfitGoal(Number(e.target.value))}
            />
            <button 
              onClick={handleSaveGoal}
              className="bg-black text-white px-6 rounded-2xl text-[10px] font-black uppercase"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-3">
          <div className="flex justify-between items-start">
            <DollarSign size={18} className="text-gray-400" />
            <div className={`flex items-center gap-0.5 text-[8px] font-black uppercase ${revVariation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {revVariation >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {Math.abs(revVariation).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Faturamento Bruto</p>
            <p className="text-lg font-black text-black">R$ {totals.revenue.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 space-y-3">
          <div className="flex justify-between items-start">
            <TrendingUp size={18} className="text-emerald-600" />
            <div className={`flex items-center gap-0.5 text-[8px] font-black uppercase ${profitVariation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {profitVariation >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {Math.abs(profitVariation).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-0.5">Lucro Líquido</p>
            <p className="text-lg font-black text-emerald-600">R$ {totals.netProfit.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Goal Progress */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
            <Target size={14} className="text-purple-500" /> Meta Alcançada
          </h3>
          <span className="text-[10px] font-black text-purple-500">{goalProgress.toFixed(1)}%</span>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-4 bg-purple-50 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-purple-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              style={{ width: `${goalProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase tracking-widest px-1">
            <span>R$ 0</span>
            <span>Ideal: R$ {idealProfitGoal.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Evolução Diária do Lucro */}
      <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white/50">
            <BarChart3 size={14} className="text-purple-400" /> Evolução do Lucro
          </h3>
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Este Mês</span>
        </div>

        <div className="h-40 w-full relative z-10">
          {dailyProfit.length > 1 ? (
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="#A855F7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartPoints}
              />
              <path
                fill="url(#lineGrad)"
                d={`M 0,100 L ${chartPoints} L 100,100 Z`}
              />
            </svg>
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] font-black text-white/20 uppercase tracking-widest">
              Aguardando primeiras vendas...
            </div>
          )}
        </div>

        <div className="flex justify-between items-end relative z-10">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Margem de Lucro</p>
            <p className="text-xl font-black">
              {totals.revenue > 0 ? ((totals.netProfit / totals.revenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Custo Operacional (Mercadoria)</p>
            <p className="text-sm font-black text-red-400">- R$ {totals.cogs.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-start gap-4">
        <Info size={16} className="text-gray-300 mt-1 shrink-0" />
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
          * Os cálculos consideram o custo de compra cadastrado no produto versus o valor final da nota emitida.
        </p>
      </div>
    </div>
  );
};

export default Analytics;
