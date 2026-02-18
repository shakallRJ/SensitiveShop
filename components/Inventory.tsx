
import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Plus, X, Edit2, Save, Tag, Info, DollarSign, Package, Palette, Layers, ArrowRight, RefreshCcw, Lock } from 'lucide-react';
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
  
  // Replenishment Mode State
  const [isReplenishing, setIsReplenishing] = useState<string | null>(null);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      if (isReplenishing) {
        // Modo Atualização de Estoque
        const { error } = await supabase.from('products')
          .update({ stock: parseInt(newProduct.stock) || 0 })
          .eq('id', isReplenishing);
        if (error) throw error;
        alert('Estoque atualizado com sucesso! 📦');
      } else {
        // Modo Novo Cadastro
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
        alert('Produto cadastrado! ✨');
      }
      
      setNewProduct({ name:'', reference:'', purchase_price:'', price:'', stock:'', size:'', color:'' });
      setShowForm(false);
      setIsReplenishing(null);
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

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.reference_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative pb-10">
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
        <button 
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setIsReplenishing(null);
              setNewProduct({ name:'', reference:'', purchase_price:'', price:'', stock:'', size:'', color:'' });
            } else {
              setShowForm(true);
            }
            setSelectedProduct(null);
          }} 
          className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center shrink-0 ${showForm ? 'bg-white text-black border border-gray-100' : 'bg-black text-white'}`}
        >
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddProduct} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">
              {isReplenishing ? 'Reposição Direta' : 'Cadastro Boutique'}
            </h3>
            {isReplenishing ? <Lock size={16} className="text-gray-300" /> : <Tag size={16} className="text-indigo-400" />}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nome da Peça</label>
              <input type="text" readOnly={!!isReplenishing} placeholder="Ex: Conjunto Noir" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none disabled:opacity-50" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required={!isReplenishing} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Ref. Interna</label>
                <input type="text" readOnly={!!isReplenishing} placeholder="REF-000" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none disabled:opacity-50" value={newProduct.reference} onChange={e => setNewProduct({...newProduct, reference: e.target.value})} />
              </div>
              <div>
                <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">Novo Estoque</label>
                <input type="number" placeholder="0" className="w-full bg-white border-2 border-indigo-100 rounded-2xl py-4 px-6 text-xs font-black text-black outline-none ring-4 ring-indigo-50" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Preço Compra</label>
                <input type="text" readOnly={!!isReplenishing} placeholder="R$ 0,00" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none disabled:opacity-50" value={newProduct.purchase_price} onChange={e => setNewProduct({...newProduct, purchase_price: e.target.value})} required={!isReplenishing} />
              </div>
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Preço Venda</label>
                <input type="text" readOnly={!!isReplenishing} placeholder="R$ 0,00" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none disabled:opacity-50" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required={!isReplenishing} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Tamanho</label>
                <input type="text" readOnly={!!isReplenishing} placeholder="P, M, G..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none disabled:opacity-50" value={newProduct.size} onChange={e => setNewProduct({...newProduct, size: e.target.value})} />
              </div>
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Cor</label>
                <input type="text" readOnly={!!isReplenishing} placeholder="Preto, Nude..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none disabled:opacity-50" value={newProduct.color} onChange={e => setNewProduct({...newProduct, color: e.target.value})} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl disabled:opacity-50 active:scale-[0.98] transition-all">
            {isSaving ? 'Gravando...' : isReplenishing ? 'Confirmar Reposição' : 'Finalizar Cadastro'}
          </button>
        </form>
      )}

      {/* Product List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm divide-y divide-gray-50">
        {loading ? (
          <div className="p-20 text-center text-gray-200 text-[10px] font-black uppercase tracking-widest animate-pulse">Consultando Catálogo...</div>
        ) : filtered.map(product => (
          <div 
            key={product.id} 
            onClick={() => setSelectedProduct(product)}
            className="p-6 flex items-center gap-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
          >
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
                <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                  <input autoFocus type="text" className="bg-gray-100 text-[10px] font-black w-20 px-2 py-1 rounded-lg outline-none text-black" value={tempPrice} onChange={e => setTempPrice(e.target.value)} onBlur={() => setEditingPriceId(null)} />
                  <button onMouseDown={() => saveNewPrice(product.id)} className="text-black"><Save size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1 group">
                  <p className="text-[10px] text-emerald-500 font-black uppercase">R$ {Number(product.price).toFixed(2)}</p>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      setEditingPriceId(product.id); 
                      setTempPrice(product.price.toString()); 
                    }} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-200"
                  >
                    <Edit2 size={10} />
                  </button>
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Detalhes da Peça</p>
                <h3 className="text-xl font-black text-black uppercase tracking-tight">{selectedProduct.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-3xl space-y-1">
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                  <Tag size={12} /> Referência
                </div>
                <p className="text-xs font-black text-black uppercase">{selectedProduct.reference_code || '---'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl space-y-1">
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                  <Layers size={12} /> Estoque
                </div>
                <p className={`text-xs font-black ${selectedProduct.stock < 3 ? 'text-red-600' : 'text-black'}`}>{selectedProduct.stock} unidades</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl space-y-1">
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                  <Palette size={12} /> Cor / Tam
                </div>
                <p className="text-xs font-black text-black uppercase">{selectedProduct.color || '-'} / {selectedProduct.size || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl space-y-1">
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                  <DollarSign size={12} /> Venda
                </div>
                <p className="text-xs font-black text-emerald-600 uppercase">R$ {Number(selectedProduct.price).toFixed(2)}</p>
              </div>
            </div>

            <div className="p-6 bg-gray-950 rounded-[2rem] text-white space-y-4">
              <div className="flex justify-between items-center opacity-50">
                <span className="text-[9px] font-black uppercase tracking-widest">Custo de Compra</span>
                <span className="text-xs font-bold">R$ {Number(selectedProduct.purchase_price).toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest">Lucro Estimado</span>
                <span className="text-lg font-black text-emerald-400">R$ {(Number(selectedProduct.price) - Number(selectedProduct.purchase_price)).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  setNewProduct({
                    name: selectedProduct.name,
                    reference: selectedProduct.reference_code || '',
                    purchase_price: selectedProduct.purchase_price.toString(),
                    price: selectedProduct.price.toString(),
                    stock: selectedProduct.stock.toString(),
                    size: selectedProduct.size || '',
                    color: selectedProduct.color || ''
                  });
                  setIsReplenishing(selectedProduct.id);
                  setSelectedProduct(null);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-[1.5] bg-emerald-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Reposição <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
