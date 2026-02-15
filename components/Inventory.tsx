
import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Plus, X, Edit2, Save, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    reference: '',
    purchase_price: '',
    price: '',
    stock: '',
    size: '',
    color: ''
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('products').insert([{
        name: newProduct.name.trim(),
        reference_code: newProduct.reference.trim(),
        purchase_price: parseFloat(newProduct.purchase_price.replace(',', '.')),
        price: parseFloat(newProduct.price.replace(',', '.')),
        stock: parseInt(newProduct.stock) || 0,
        size: newProduct.size.trim(),
        color: newProduct.color.trim()
      }]);
      if (error) throw error;
      setNewProduct({ name:'', reference:'', purchase_price:'', price:'', stock:'', size:'', color:'' });
      setShowForm(false);
      fetchProducts();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const saveNewPrice = async (id: string) => {
    const newPrice = parseFloat(tempPrice.replace(',', '.'));
    if (isNaN(newPrice)) return;
    try {
      await supabase.from('products').update({ price: newPrice }).eq('id', id);
      setEditingPriceId(null);
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.reference_code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou ref..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-xs shadow-sm focus:border-black transition-all font-bold outline-none text-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center ${showForm ? 'bg-white text-black border border-gray-100' : 'bg-black text-white'}`}>
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddProduct} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Cadastro Boutique</h3>
            <Tag size={16} className="text-indigo-400" />
          </div>
          <input type="text" placeholder="Nome da Peça" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Ref. Interna" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.reference} onChange={e => setNewProduct({...newProduct, reference: e.target.value})} />
            <input type="number" placeholder="Estoque Inicial" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Custo (Compra)" className="bg-gray-50 border border-indigo-100 rounded-2xl py-4 px-6 text-xs font-bold text-indigo-600 outline-none" value={newProduct.purchase_price} onChange={e => setNewProduct({...newProduct, purchase_price: e.target.value})} required />
            <input type="text" placeholder="Preço (Venda)" className="bg-gray-50 border border-emerald-100 rounded-2xl py-4 px-6 text-xs font-bold text-emerald-600 outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Tamanho" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.size} onChange={e => setNewProduct({...newProduct, size: e.target.value})} />
            <input type="text" placeholder="Cor" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.color} onChange={e => setNewProduct({...newProduct, color: e.target.value})} />
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl disabled:opacity-50">
            {isSaving ? 'Gravando...' : 'Finalizar Cadastro'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm divide-y divide-gray-50">
        {loading ? (
          <div className="p-20 text-center text-gray-200 text-[10px] font-black uppercase tracking-widest animate-pulse">Consultando Catálogo...</div>
        ) : filtered.map(product => (
          <div key={product.id} className="p-6 flex items-center gap-5 hover:bg-gray-50/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-black shadow-inner">
              <Sparkles size={24} className="text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-black uppercase tracking-tight truncate">{product.name}</p>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-400">{product.size}</span>
              </div>
              <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">REF: {product.reference_code || '---'}</p>
              
              {editingPriceId === product.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input autoFocus type="text" className="bg-gray-100 text-[10px] font-black w-20 px-2 py-1 rounded-lg outline-none text-black" value={tempPrice} onChange={e => setTempPrice(e.target.value)} onBlur={() => setEditingPriceId(null)} />
                  <button onMouseDown={() => saveNewPrice(product.id)} className="text-black"><Save size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1 group">
                  <p className="text-[10px] text-emerald-500 font-black uppercase">R$ {Number(product.price).toFixed(2)}</p>
                  <button onClick={() => { setEditingPriceId(product.id); setTempPrice(product.price.toString()); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-200"><Edit2 size={10} /></button>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">QTD</div>
              <div className={`text-sm font-black ${product.stock < 3 ? 'text-red-500' : 'text-black'}`}>{product.stock}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
