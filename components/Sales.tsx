
import React, { useState, useEffect } from 'react';
import { Plus, ShoppingBag, User, Package, DollarSign, Calendar, X, Search, Filter, Trash2, CreditCard, Banknote, QrCode } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Customer, Sale } from '../types';

interface CartItem {
  product: Product;
  amount: number;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do Carrinho
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQty, setSelectedProductQty] = useState(1);

  const [formData, setFormData] = useState({
    customerId: '',
    discount: '0',
    discountDescription: '',
    paymentMethod: 'pix',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const addToCart = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (selectedProductQty > prod.stock) {
      alert(`⚠️ Estoque insuficiente! (${prod.stock} un disponíveis)`);
      return;
    }

    setCart([...cart, { product: prod, amount: selectedProductQty }]);
    setSelectedProductId('');
    setSelectedProductQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.amount), 0);
  const finalTotal = Math.max(0, cartTotal - parseFloat(formData.discount.replace(',', '.')) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || cart.length === 0) {
      alert('Selecione uma cliente e adicione itens ao carrinho.');
      return;
    }

    setLoading(true);
    try {
      const orderId = crypto.randomUUID();
      const totalDiscount = parseFloat(formData.discount.replace(',', '.')) || 0;
      
      // Proporção de desconto por item (simplificado para o BI não quebrar)
      const discountPerItem = cart.length > 0 ? totalDiscount / cart.length : 0;

      const salesPayload = cart.map(item => ({
        order_id: orderId,
        customer_id: formData.customerId,
        product_id: item.product.id,
        amount: item.amount,
        value: (item.product.price * item.amount) - discountPerItem,
        discount: discountPerItem,
        discount_description: formData.discountDescription,
        payment_method: formData.paymentMethod,
        created_at: formData.date
      }));

      const { error: saleError } = await supabase.from('sales').insert(salesPayload);
      if (saleError) throw saleError;

      // Baixa de estoque para cada item
      for (const item of cart) {
        await supabase.from('products').update({ stock: item.product.stock - item.amount }).eq('id', item.product.id);
      }
      
      setShowForm(false);
      setCart([]);
      setFormData({
        customerId: '',
        discount: '0',
        discountDescription: '',
        paymentMethod: 'pix',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
      alert('Pedido realizado com sucesso! ✨');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar venda.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(s => 
    s.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-3 px-1">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            type="text" 
            placeholder="Buscar nota ou cliente..."
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
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cliente</label>
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

            {/* Seletor de Produtos para o Carrinho */}
            <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Adicionar Peças</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-bold text-black outline-none"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                >
                  <option value="">Escolher Item</option>
                  {products.map(p => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name} ({p.stock} un)</option>)}
                </select>
                <input 
                  type="number" 
                  className="w-16 bg-white border border-gray-200 rounded-xl py-3 px-2 text-xs font-bold text-black outline-none text-center"
                  value={selectedProductQty}
                  onChange={e => setSelectedProductQty(parseInt(e.target.value))}
                  min="1"
                />
                <button 
                  type="button"
                  onClick={addToCart}
                  className="bg-black text-white p-3 rounded-xl hover:scale-105 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Lista do Carrinho */}
              {cart.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-in fade-in scale-in">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-black uppercase truncate">{item.product.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{item.amount}x R$ {item.product.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(index)} className="text-red-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'cartao'})} className={`p-3 rounded-xl flex justify-center border transition-all ${formData.paymentMethod === 'cartao' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-300 border-gray-200'}`}><CreditCard size={18}/></button>
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'dinheiro'})} className={`p-3 rounded-xl flex justify-center border transition-all ${formData.paymentMethod === 'dinheiro' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-300 border-gray-200'}`}><Banknote size={18}/></button>
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'pix'})} className={`p-3 rounded-xl flex justify-center border transition-all ${formData.paymentMethod === 'pix' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-300 border-gray-200'}`}><QrCode size={18}/></button>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Desconto (R$)</label>
                <input type="text" placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-red-500 outline-none" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Motivo do desconto (Ex: Campanha Maio)" 
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none"
              value={formData.discountDescription}
              onChange={e => setFormData({...formData, discountDescription: e.target.value})}
            />

            <div className="bg-gray-950 p-7 rounded-[2rem] text-white flex justify-between items-center shadow-2xl">
              <div>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Total Nota</span>
                <p className="text-2xl font-black">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <ShoppingBag size={24} className="text-white/20" />
            </div>
            
            <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>

          <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">Confirmar Nota</button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Histórico de Vendas</h3>
            <Filter size={14} className="text-gray-200" />
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden divide-y divide-gray-50">
            {loading ? (
              <div className="p-20 text-center text-gray-300 text-[10px] font-black uppercase animate-pulse">Buscando Notas...</div>
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
                      <span className="text-[7px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 uppercase">{sale.payment_method}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-black">R$ {Number(sale.value).toFixed(2)}</p>
                    <p className="text-[8px] text-gray-300 font-bold uppercase mt-1">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center text-gray-200 text-[10px] font-black uppercase tracking-widest">Nenhuma nota emitida</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
