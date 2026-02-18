
import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  Gem, 
  UserRound, 
  LogOut,
  Wallet,
  LayoutDashboard
} from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Login from './components/Login';
import Analytics from './components/Analytics';
import Expenses from './components/Expenses';

enum View {
  Dashboard = 'dashboard',
  Sales = 'sales',
  Inventory = 'inventory',
  Customers = 'customers',
  Financial = 'financial',
  Expenses = 'expenses'
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [configured, setConfigured] = useState<boolean>(true);

  useEffect(() => {
    const isConfigured = isSupabaseConfigured();
    setConfigured(isConfigured);

    if (isConfigured) {
      const session = localStorage.getItem('app_session');
      if (session === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  if (!configured) return <div className="p-10 text-center">Configuração pendente no Supabase.</div>;
  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  const renderView = () => {
    switch (currentView) {
      case View.Dashboard: return <Dashboard onNavigate={(v) => setCurrentView(v as View)} />;
      case View.Sales: return <Sales />;
      case View.Inventory: return <Inventory />;
      case View.Customers: return <Customers />;
      case View.Expenses: return <Expenses />;
      case View.Financial: return <Analytics onBack={() => setCurrentView(View.Dashboard)} />;
      default: return <Dashboard onNavigate={(v) => setCurrentView(v as View)} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full py-2 transition-all ${
        currentView === view ? 'text-black' : 'text-purple-300'
      }`}
    >
      <div className={`p-2 rounded-2xl transition-all ${currentView === view ? 'bg-white shadow-sm' : ''}`}>
        <Icon size={20} strokeWidth={currentView === view ? 2.5 : 2} />
      </div>
      <span className={`text-[9px] mt-1 font-black uppercase tracking-[0.2em] transition-all ${currentView === view ? 'opacity-100' : 'opacity-60'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-x-hidden">
      <header className="bg-white border-b border-gray-50 px-6 py-6 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-serif-brand font-black text-black">S.</span>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">
            {currentView === View.Financial ? 'Analytics' : currentView}
          </span>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('app_session');
            setIsAuthenticated(false);
          }}
          className="p-2 text-gray-200 hover:text-black transition-colors"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 px-6 pt-6 no-scrollbar">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#fefafe] border-t border-purple-50 px-4 py-4 flex justify-around items-center z-30 max-w-md mx-auto shadow-[0_-15px_40px_rgba(147,51,234,0.06)]">
        <NavItem view={View.Dashboard} icon={LayoutDashboard} label="Início" />
        <NavItem view={View.Sales} icon={ShoppingBag} label="Venda" />
        <NavItem view={View.Expenses} icon={Wallet} label="Custos" />
        <NavItem view={View.Inventory} icon={Gem} label="Peças" />
        <NavItem view={View.Customers} icon={UserRound} label="Clientes" />
      </nav>
    </div>
  );
};

export default App;
