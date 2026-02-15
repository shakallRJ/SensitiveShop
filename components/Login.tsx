
import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctUser = 'admin';
    const correctPassword = (import.meta as any).env?.VITE_APP_PASSWORD || 'admin123';
    if (username === correctUser && password === correctPassword) {
      localStorage.setItem('app_session', 'true');
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="mb-16 text-center">
        <div className="text-8xl font-serif-brand font-black text-black leading-none mb-2">S.</div>
        <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.5em] ml-1">Sensitive Shop</p>
      </div>
      
      <div className="w-full space-y-8">
        <div className="text-center">
          <h2 className="text-xs font-black text-black uppercase tracking-[0.3em] mb-1">Acesso Restrito</h2>
          <div className="h-px w-6 bg-gray-100 mx-auto"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-1">Credencial</label>
            <div className="relative">
              <User size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-200" />
              <input 
                type="text" 
                className={`w-full bg-transparent border-b-2 ${error ? 'border-red-500' : 'border-gray-100'} py-4 pl-8 pr-4 text-gray-900 text-sm font-bold focus:border-black transition-all outline-none rounded-none`}
                placeholder="Usuário"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-1">Código</label>
            <div className="relative">
              <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-200" />
              <input 
                type="password" 
                className={`w-full bg-transparent border-b-2 ${error ? 'border-red-500' : 'border-gray-100'} py-4 pl-8 pr-4 text-gray-900 text-sm font-bold focus:border-black transition-all outline-none rounded-none`}
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 justify-center animate-pulse">
              <AlertCircle size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">Incorreto</p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-black text-white py-5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all mt-8"
          >
            Entrar
          </button>
        </form>
      </div>

      <p className="mt-24 text-gray-200 text-[8px] font-black uppercase tracking-[0.3em]">
        Sensitive Suite © 2024
      </p>
    </div>
  );
};

export default Login;
