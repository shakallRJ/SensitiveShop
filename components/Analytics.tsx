
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  X, 
  LineChart, 
  Target, 
  TrendingDown, 
  Activity, 
  Calendar 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Sale, Product, Expense } from '../types';

interface AnalyticsProps {
  onBack: () => void;
}

type FilterType = 'total' | 'mensal' | 'periodo';

interface ProductStats {
  product: Product;
  margin: number;
  totalSold: number;
  totalRevenue: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('mensal');
  const [customDates, setCustomDates] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [totals, setTotals] = useState({ 
    revenue: 0, 
    cogs: 0, 
    netProfit: 0, 
    expenses: 0,
    shippingBalance: 0,
    prevRevenue: 0,
    prevNetProfit: 0 
  });
  
  const [chartData, setChartData] = useState<{label: string, amount: number}[]>([]);
  const [idealProfitGoal, setIdealProfitGoal] = useState<number>(() => {
    return Number(localStorage.getItem('sensitive_ideal_profit') || 5000);
  });
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState(idealProfitGoal.toString());

  useEffect(() => {
    fetchAnalytics();
  }, [filterType, customDates]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: salesData } = await supabase.from('sales').select('*, product:products(*)');
      const { data: expensesData } = await supabase.from('expenses').select('*');
      
      if (salesData) {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date();
        let compareStartDate: Date;
        let compareEndDate: Date;

        if (filterType === 'mensal') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          compareStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          compareEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (filterType === 'periodo') {
          startDate = new Date(customDates.start + 'T00:00:00');
          endDate = new Date(customDates.end + 'T23:59:59');
          const diff = endDate.getTime() - startDate.getTime();
          compareEndDate = new Date(startDate.getTime() - 1);
          compareStartDate = new Date(compareEndDate.getTime() - diff);
        } else {
          startDate = new Date(0); // All time
          endDate = new Date();
          compareStartDate = new Date(0);
          compareEndDate = new Date(0);
        }

        let currentRev = 0;
        let currentCogs = 0;
        let currentShipCharged = 0;
        let currentShipCost = 0;
        let prevRev = 0;
        let prevProfit = 0;
        const timelineMap: Record<string, number> = {};

        salesData.forEach((sale: any) => {
          const product = sale.product;
          if (!product) return;

          const saleDate = new Date(sale.created_at);
          const rev = Number(sale.value);
          const cost = Number(product.purchase_price) * Number(sale.amount);
          const sCharged = Number(sale.shipping_charged || 0);
          const sCost = Number(sale.shipping_cost || 0);
          const profit = (rev + sCharged) - (cost + sCost);

          if (saleDate >= startDate && saleDate <= endDate) {
            currentRev += rev;
            currentCogs += cost;
            currentShipCharged += sCharged;
            currentShipCost += sCost;
            
            // Gerar chave de ordenação cronológica
            const sortKey = filterType === 'total' 
              ? `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`
              : saleDate.getDate().toString().padStart(2, '0');
              
            timelineMap[sortKey] = (timelineMap[sortKey] || 0) + profit;
          } else if (saleDate >= compareStartDate && saleDate <= compareEndDate) {
            prevRev += rev;
            prevProfit += profit;
          }
        });

        let currentExpenses = 0;
        if (expensesData) {
          expensesData.forEach((exp: any) => {
            const d = new Date(exp.date);
            if (d >= startDate && d <= endDate) {
              const amount = Number(exp.amount);
              currentExpenses += amount;
              
              const sortKey = filterType === 'total' 
                ? `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
                : d.getDate().toString().padStart(2, '0');
                
              timelineMap[sortKey] = (timelineMap[sortKey] || 0) - amount;
            }
          });
        }

        // Ordenar as chaves cronologicamente antes de gerar o gráfico
        const evolution = Object.keys(timelineMap)
          .sort((a, b) => a.localeCompare(b))
          .map(key => {
            let label = key;
            if (filterType === 'total') {
              const [y, m] = key.split('-');
              const d = new Date(parseInt(y), parseInt(m) - 1, 1);
              label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
            } else {
              // No modo mensal/período, removemos o zero à esquerda do rótulo se desejado, 
              // mas a chave garantiu a ordem.
              label = parseInt(key).toString();
            }
            return { label, amount: timelineMap[key] };
          });

        const netRealProfit = (currentRev + currentShipCharged) - (currentCogs + currentShipCost + currentExpenses);

        setChartData(evolution);
        setTotals({ 
          revenue: currentRev, 
          cogs: currentCogs, 
          expenses: currentExpenses,
          shippingBalance: currentShipCharged - currentShipCost,
          netProfit: netRealProfit, 
          prevRevenue: prevRev, 
          prevNetProfit: prevProfit 
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = () => {
    const val = parseFloat(newGoalValue) || 0;
    setIdealProfitGoal(val);
    localStorage.setItem('sensitive_ideal_profit', val.toString());
    setShowGoalInput(false);
  };

  const revVariation = totals.prevRevenue > 0 ? ((totals.revenue - totals.prevRevenue) / totals.prevRevenue) * 100 : 0;
  const profitVariation = totals.prevNetProfit > 0 ? ((totals.netProfit - totals.prevNetProfit) / totals.prevNetProfit) * 100 : 0;
  
  // Lógica de Renderização do Gráfico
  const amounts = chartData.map(d => d.amount);
  const maxProfit = amounts.length > 0 ? Math.max(...amounts, 0) : 100;
  const minProfit = amounts.length > 0 ? Math.min(...amounts, 0) : 0;
  const range = (maxProfit - minProfit) || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors">
          <ArrowLeft size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Painel de Controle</span>
        </button>
        <button 
          onClick={() => setShowGoalInput(!showGoalInput)} 
          className={`p-3 rounded-2xl transition-all shadow-lg ${showGoalInput ? 'bg-black text-white' : 'bg-purple-50 text-purple-600'}`}
        >
          <Target size={20} />
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Boutique Intelligence</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Performance Financeira Real</p>
      </div>

      {showGoalInput && (
        <div className="bg-white border-4 border-black p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-300 space-y-6 relative z-50">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-black text-black uppercase">Lucro Ideal</h4>
            <button onClick={() => setShowGoalInput(false)} className="text-gray-300"><X size={20} /></button>
          </div>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-gray-300">R$</span>
            <input type="number" className="w-full bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] py-6 pl-16 pr-6 text-2xl font-black text-black outline-none" value={newGoalValue} onChange={e => setNewGoalValue(e.target.value)} />
          </div>
          <button onClick={handleSaveGoal} className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em]">Confirmar Meta</button>
        </div>
      )}

      {/* Filtro Temporal */}
      <div className="space-y-4">
        <div className="bg-gray-100 p-1.5 rounded-[2rem] flex gap-1 border border-gray-200/50">
          {(['mensal', 'periodo', 'total'] as FilterType[]).map((t) => (
            <button 
              key={t} 
              onClick={() => setFilterType(t)} 
              className={`flex-1 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-black shadow-xl' : 'text-gray-400'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {filterType === 'periodo' && (
          <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-3 duration-500">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-4">Início</label>
              <div className="relative">
                <Calendar size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                <input 
                  type="date" 
                  className="w-full bg-purple-50/50 border border-purple-100 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black text-black outline-none focus:border-purple-300"
                  value={customDates.start}
                  onChange={e => setCustomDates({...customDates, start: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-4">Fim</label>
              <div className="relative">
                <Calendar size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                <input 
                  type="date" 
                  className="w-full bg-purple-50/50 border border-purple-100 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black text-black outline-none focus:border-purple-300"
                  value={customDates.end}
                  onChange={e => setCustomDates({...customDates, end: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-gray-50 rounded-xl text-gray-400"><DollarSign size={16} /></div>
            <div className={`flex items-center gap-0.5 text-[9px] font-black uppercase ${revVariation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {revVariation >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(revVariation).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Vendas Brutas</p>
            <p className="text-xl font-black text-black">R$ {totals.revenue.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Activity size={16} /></div>
            <div className={`flex items-center gap-0.5 text-[9px] font-black uppercase ${profitVariation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {profitVariation >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(profitVariation).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-emerald-800/40 uppercase tracking-widest mb-0.5">Lucro Real (Final)</p>
            <p className="text-xl font-black text-emerald-600">R$ {totals.netProfit.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
        <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-2">
           <Activity size={16} className="text-purple-500" /> Saúde Financeira do Período
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
            <span>(+) Vendas + Logística</span>
            <span className="text-black">R$ {(totals.revenue + (totals.shippingBalance > 0 ? totals.shippingBalance : 0)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-red-400 uppercase">
            <span>(-) Custo de Peças</span>
            <span className="font-black">- R$ {totals.cogs.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-red-400 uppercase">
            <span>(-) Despesas & Custos Fixos</span>
            <span className="font-black">- R$ {totals.expenses.toFixed(2)}</span>
          </div>
          <div className="h-px bg-gray-100"></div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black uppercase text-black">Lucro Final</span>
            <span className={`text-xl font-black ${totals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              R$ {totals.netProfit.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-2">
            <LineChart size={16} className="text-indigo-600" /> Evolução da Lucratividade
          </h3>
          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Saldo Diário (R$)</span>
        </div>

        {chartData.length > 0 ? (
          <div className="h-48 w-full flex items-end gap-2 pt-4">
            {chartData.map((data, i) => {
              const heightPercentage = Math.max(8, ((data.amount - minProfit) / range) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    R$ {data.amount.toFixed(0)}
                  </div>
                  
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-700 shadow-sm ${data.amount >= 0 ? 'bg-indigo-600' : 'bg-rose-500'}`}
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                  
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter truncate w-full text-center">
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] space-y-2">
             <Activity size={24} className="text-gray-100" />
             <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center px-10">Aguardando dados de vendas ou custos para gerar evolução</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
