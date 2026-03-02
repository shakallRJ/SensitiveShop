
import React, { useState, useEffect } from 'react';
import { Lock, MessageCircle, Save, X, Shield, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waBirthdayMessage, setWaBirthdayMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPassword(data.password);
        setWaMessage(data.wa_message_template);
        setWaBirthdayMessage(data.wa_birthday_template);
      } else {
        // Fallback se não houver dados
        setPassword('admin123');
        setWaMessage('Olá {name} ✨, temos novidades incríveis na boutique!');
        setWaBirthdayMessage('Parabéns {name}! ✨ Notamos que é seu aniversário hoje e preparamos um cupom especial para você na Sensitive Shop! 🎁');
      }
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'global',
          password: password,
          wa_message_template: waMessage,
          wa_birthday_template: waBirthdayMessage,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
      alert('Erro ao salvar configurações globais.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-black" size={32} />
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Carregando Nuvem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-2xl shadow-lg">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h2 className="text-xs font-black text-black uppercase tracking-[0.3em]">Configurações</h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Personalize sua suite</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-black transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Seção de Segurança */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-purple-500" />
            <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Segurança do Acesso</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative">
              <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input 
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold text-black outline-none focus:border-black transition-all"
                placeholder="Nova Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest ml-1">Esta senha será exigida no próximo login.</p>
          </div>
        </div>

        {/* Seção de Comunicação */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <MessageCircle size={16} className="text-emerald-500" />
            <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Modelos de WhatsApp</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mensagem Padrão</label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none focus:border-black transition-all min-h-[100px] resize-none"
                placeholder="Olá {name}..."
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
              />
              <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest ml-1">Use {"{name}"} para inserir o nome da cliente.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mensagem de Aniversário</label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none focus:border-black transition-all min-h-[100px] resize-none"
                placeholder="Parabéns {name}..."
                value={waBirthdayMessage}
                onChange={e => setWaBirthdayMessage(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full py-5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-black text-white'}`}
        >
          {isSaving ? 'Salvando...' : showSuccess ? 'Configurações Salvas! ✨' : (
            <>
              <Save size={16} />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
