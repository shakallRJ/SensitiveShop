
import React, { useState, useEffect } from 'react';
import { Plus, ShoppingBag, User, Package, DollarSign, Calendar, X, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Customer, Sale } from '../types';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    discount: '0',
    amount: '1',
    date: new Date().toISOString().split('T')[0]
  });

  const [calculatedValue, setCalculatedValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const product = products.find(p => p.id === formData.productId);
    if (product) {
      const basePrice = Number(product.price);
      const qty = parseInt(formData.amount) || 0;
      const desc = parseFloat(formData.discount.replace(',', '.')) || 0;
      setCalculatedValue(Math.max(0, (basePrice * qty) - desc));
    } else {
      setCalculatedValue(0);
    }
  }, [formData.productId, formData.amount, formData.discount, products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.from('sales').select('*, customer:customers(*), product:products(*)').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('products').select('*');
      const { data: c } = await supabase.from('customers').select('*');
      if (s) setSales(s);
      if (p) setProducts(p);
      if (c) setCustomers(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.productId) return;

    const selectedProduct = products.find(p => p.id === formData.productId);
    const saleAmount = parseInt(formData.amount);
    if (!selectedProduct) return;

    if (saleAmount > selectedProduct.stock) {
      alert(`⚠️ Sem estoque! Disponível: ${selectedProduct.stock}`);
      return;
    }

    try {
      const { error: saleError } = await supabase.from('sales').insert([{
        customer_id: formData.customerId,
        product_id: formData.productId,
        value: calculatedValue,
        discount: parseFloat(formData.discount.replace(',', '.')) || 0,
        amount: saleAmount,
        created_at: formData.date
      }]);
      if (saleError) throw saleError;

      await supabase.from('products').update({ stock: selectedProduct.stock - saleAmount }).eq('id', selectedProduct.id);
      
      setShowForm(false);
      fetchData();
      alert('Venda registrada! ✨');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSales = sales.filter(s => 
    s.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Busca e Botão de Nova Venda */}
      <div className="flex gap-3 px-1">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            type="text" 
            placeholder="Filtrar pedidos..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none text-black focus:border-black transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center ${showForm ? 'bg-white border border-gray-100 text-black' : 'bg-black text-white'}`}
        >
          {showForm ? <X size={20} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6 border border-gray-50 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-5">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Diva</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none"
                value={formData.customerId}
                onChange={e => setFormData({...formData, customerId: e.target.value})}
                required
              >
                <option value="">Selecionar Cliente</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Peça</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none"
                value={formData.productId}
                onChange={e => setFormData({...formData, productId: e.target.value})}
                required
              >
                <option value="">Selecionar Produto</option>
                {products.map(p => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name} ({p.stock} un)</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Qtd" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              <input type="text" placeholder="Desconto" className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-red-500 outline-none" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex justify-between items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Final</span>
              <span className="text-xl font-black text-black">R$ {calculatedValue.toFixed(2)}</span>
            </div>
            
            <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>

          <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">Confirmar Venda</button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Últimos Movimentos</h3>
            <Filter size={14} className="text-gray-200" />
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden divide-y divide-gray-50">
            {loading ? (
              <div className="p-20 text-center text-gray-300 text-[10px] font-black uppercase animate-pulse">Consultando Vendas...</div>
            ) : filteredSales.length > 0 ? (
              filteredSales.map(sale => (
                <div key={sale.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-black uppercase tracking-tight">{sale.customer?.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{sale.product?.name} ({sale.amount}x)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-black">R$ {Number(sale.value).toFixed(2)}</p>
                    <p className="text-[8px] text-gray-300 font-bold uppercase mt-1">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center text-gray-200 text-[10px] font-black uppercase tracking-widest">Nenhuma venda encontrada</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
