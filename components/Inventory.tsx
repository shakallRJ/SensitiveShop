
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Trash2, Calendar, Clock, AlertTriangle, Zap, ShoppingBag, Info, DollarSign, Tag, Layers, ArrowRight, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

type InventoryTab = 'catalogo' | 'giro';

interface ProductGroup {
  name: string;
  ref: string;
  total: number;
  variants: Product[];
}

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('catalogo');
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados de Modais
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    reference: '',
    purchase_price: '',
    price: '',
    stock: '',
    size: '',
    color: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_days: '30'
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
        reference_code: newProduct.reference.trim().toUpperCase(),
        purchase_price: parseFloat(newProduct.purchase_price.toString().replace(',', '.')),
        price: parseFloat(newProduct.price.toString().replace(',', '.')),
        stock: parseInt(newProduct.stock.toString()) || 0,
        size: newProduct.size.trim().toUpperCase(),
        color: newProduct.color.trim(),
        purchase_date: newProduct.purchase_date,
        expected_days: parseInt(newProduct.expected_days.toString()) || 30
      }]);
      
      if (error) throw error;
      
      setNewProduct({ name:'', reference:'', purchase_price:'', price:'', stock:'', size:'', color:'', purchase_date: new Date().toISOString().split('T')[0], expected_days: '30' });
      setShowForm(false);
      fetchProducts();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleReposition = (product: Product) => {
    setNewProduct({
      name: product.name,
      reference: product.reference_code || '',
      purchase_price: product.purchase_price.toString(),
      price: product.price.toString(),
      stock: '', // Limpa estoque para nova entrada
      size: product.size || '',
      color: product.color || '',
      purchase_date: new Date().toISOString().split('T')[0],
      expected_days: (product.expected_days || 30).toString()
    });
    setSelectedProduct(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await supabase.from('products').delete().eq('id', deletingId);
      setDeletingId(null);
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const groupedProducts = products.reduce((acc, p) => {
    const ref = p.reference_code || 'SEM-REF';
    if (!acc[ref]) acc[ref] = { name: p.name, ref, total: 0, variants: [] };
    acc[ref].total += p.stock;
    acc[ref].variants.push(p);
    return acc;
  }, {} as Record<string, ProductGroup>);

  const filteredGroups = (Object.values(groupedProducts) as ProductGroup[]).filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.ref.toLowerCase().includes(search.toLowerCase())
  );

  const getAgingStatus = (product: Product) => {
    if (!product.purchase_date) return null;
    const purchase = new Date(product.purchase_date);
    const today = new Date();
    const daysInStock = Math.floor((today.getTime() - purchase.getTime()) / (1000 * 3600 * 24));
    const expected = product.expected_days || 30;

    if (daysInStock > expected && product.stock > 0) return { label: 'Peça Parada', color: 'text-red-500 bg-red-50', icon: AlertTriangle, days: daysInStock };
    if (daysInStock < expected / 2 && product.stock < 2) return { label: 'Saída Rápida', color: 'text-amber-500 bg-amber-50', icon: Zap, days: daysInStock };
    return { label: 'Em Giro', color: 'text-emerald-500 bg-emerald-50', icon: Clock, days: daysInStock };
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Modal de Detalhes da Peça */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gray-950 p-8 text-white relative">
              <button onClick={() => setSelectedProduct(null)} className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 mb-2">Ficha Técnica</p>
              <h3 className="text-xl font-black uppercase tracking-tight leading-tight mb-1">{selectedProduct.name}</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">REF: {selectedProduct.reference_code || '---'}</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tamanho / Cor</p>
                  <p className="text-xs font-black text-black uppercase">{selectedProduct.size} • {selectedProduct.color}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Estoque Atual</p>
                  <p className={`text-xs font-black ${selectedProduct.stock < 2 ? 'text-red-500' : 'text-black'}`}>{selectedProduct.stock} unidades</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Preço de Custo</span>
                  <span className="text-[10px] font-bold text-black">R$ {Number(selectedProduct.purchase_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Preço de Venda</span>
                  <span className="text-sm font-black text-emerald-600">R$ {Number(selectedProduct.price).toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Margem Bruta</span>
                  <span className="text-[10px] font-black text-black">
                    {(((selectedProduct.price - selectedProduct.purchase_price) / selectedProduct.price) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {getAgingStatus(selectedProduct) && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${getAgingStatus(selectedProduct)?.color}`}>
                  {React.createElement(getAgingStatus(selectedProduct)!.icon, { size: 16 })}
                  <div>
                    <p className="text-[9px] font-black uppercase">{getAgingStatus(selectedProduct)?.label}</p>
                    <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest">{getAgingStatus(selectedProduct)?.days} dias em loja</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => handleReposition(selectedProduct)}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-gray-200"
                >
                  <RefreshCcw size={14} /> Reposição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-black uppercase tracking-widest">Remover do Estoque?</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                Esta ação é irreversível. A peça será removida permanentemente do catálogo da boutique.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-200"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-50 p-1.5 rounded-2xl gap-1">
        <button 
          onClick={() => setActiveTab('catalogo')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalogo' ? 'bg-white text-black shadow-sm' : 'text-gray-300'}`}
        >
          Catálogo & Conjuntos
        </button>
        <button 
          onClick={() => setActiveTab('giro')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'giro' ? 'bg-white text-black shadow-sm' : 'text-gray-300'}`}
        >
          Giro de Peças
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar conjunto ou ref..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-xs shadow-sm focus:border-black transition-all font-bold outline-none text-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center shrink-0 ${showForm ? 'bg-white text-black border border-gray-100' : 'bg-black text-white'}`}
        >
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddProduct} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Cadastro de Variante</h3>
            {newProduct.name && (
              <span className="text-[8px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded-md uppercase tracking-widest">Modo Reposição</span>
            )}
          </div>
          
          <div className="space-y-4">
            <input type="text" placeholder="Nome do Conjunto" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
            
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Referência" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.reference} onChange={e => setNewProduct({...newProduct, reference: e.target.value})} required />
              <input type="number" placeholder="Quantidade" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none focus:ring-2 ring-black" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Cor (Ex: Rosê)" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.color} onChange={e => setNewProduct({...newProduct, color: e.target.value})} required />
              <input type="text" placeholder="Tam (Ex: P)" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.size} onChange={e => setNewProduct({...newProduct, size: e.target.value})} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Custo R$" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.purchase_price} onChange={e => setNewProduct({...newProduct, purchase_price: e.target.value})} required />
              <input type="text" placeholder="Venda R$" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
            </div>

            <div className="h-px bg-gray-50 my-2"></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Data da Compra</label>
                <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-[10px] font-bold text-black outline-none" value={newProduct.purchase_date} onChange={e => setNewProduct({...newProduct, purchase_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Meta de Giro (Dias)</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-[10px] font-bold text-black outline-none" value={newProduct.expected_days} onChange={e => setNewProduct({...newProduct, expected_days: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {newProduct.name && (
               <button type="button" onClick={() => setNewProduct({ name:'', reference:'', purchase_price:'', price:'', stock:'', size:'', color:'', purchase_date: new Date().toISOString().split('T')[0], expected_days: '30' })} className="px-6 bg-gray-100 rounded-2xl text-gray-400"><X size={18}/></button>
            )}
            <button type="submit" disabled={isSaving} className="flex-1 bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-[0.98] transition-all">
              {isSaving ? 'Gravando...' : 'Salvar no Conjunto'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-20 text-center text-gray-200 text-[10px] font-black uppercase animate-pulse">Consultando...</div>
      ) : activeTab === 'catalogo' ? (
        <div className="space-y-4">
          {filteredGroups.map(group => (
            <div key={group.ref} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <div>
                  <p className="text-xs font-black text-black uppercase tracking-tight">{group.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">REF: {group.ref}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-300 uppercase">Total Peças</p>
                  <p className="text-sm font-black text-black">{group.total}</p>
                </div>
              </div>
              
              <div className="divide-y divide-gray-50">
                {group.variants.map(variant => (
                  <div 
                    key={variant.id} 
                    className="px-6 py-4 flex items-center justify-between group hover:bg-gray-50/80 transition-all cursor-pointer active:scale-[0.99]"
                    onClick={() => setSelectedProduct(variant)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-black bg-gray-100 px-2 py-0.5 rounded-md self-start mb-1">{variant.size}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{variant.color}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-600">R$ {Number(variant.price).toFixed(2)}</p>
                        <p className={`text-[10px] font-black ${variant.stock < 2 ? 'text-red-500' : 'text-gray-400'}`}>{variant.stock} un</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(variant.id);
                        }}
                        className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Aba de Giro (Aging) */
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
             <Info size={14} className="text-purple-400 mt-0.5" />
             <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
               Aqui você monitora o tempo de prateleira de cada item para evitar estoque parado.
             </p>
          </div>
          {products.map(product => {
            const status = getAgingStatus(product);
            return (
              <div 
                key={product.id} 
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-black text-black uppercase">{product.name} ({product.size})</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Estoque: {product.stock} un</p>
                  </div>
                  {status && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase ${status.color}`}>
                      <status.icon size={10} />
                      {status.label} • {status.days} dias em loja
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Expectativa</p>
                  <p className="text-xs font-black text-black">{product.expected_days} dias</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredGroups.length === 0 && !loading && (
        <div className="p-20 text-center text-gray-200 text-[10px] font-black uppercase tracking-widest">Nenhuma peça encontrada</div>
      )}
    </div>
  );
};

export default Inventory;
