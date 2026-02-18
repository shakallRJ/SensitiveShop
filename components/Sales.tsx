
import React, { useState, useEffect } from 'react';
import { Plus, ShoppingBag, User, Package, DollarSign, Calendar, X, Search, Filter, Trash2, CreditCard, Banknote, QrCode, ReceiptText, Printer, Share2, Truck } from 'lucide-react';
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

  const [selectedOrderItems, setSelectedOrderItems] = useState<Sale[] | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQty, setSelectedProductQty] = useState(1);

  const [formData, setFormData] = useState({
    customerId: '',
    discount: '0',
    discountDescription: '',
    paymentMethod: 'pix',
    shippingCharged: '0',
    shippingCost: '0',
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

  const handleShowReceipt = (orderId: string) => {
    const orderItems = sales.filter(s => s.order_id === orderId);
    if (orderItems.length > 0) {
      setSelectedOrderItems(orderItems);
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
  const shippingCharge = parseFloat(formData.shippingCharged.replace(',', '.')) || 0;
  const shippingCost = parseFloat(formData.shippingCost.replace(',', '.')) || 0;
  const finalTotal = Math.max(0, cartTotal + shippingCharge - (parseFloat(formData.discount.replace(',', '.')) || 0));
  const shippingBalance = shippingCharge - shippingCost;

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
        shipping_charged: shippingCharge / cart.length,
        shipping_cost: shippingCost / cart.length,
        created_at: formData.date
      }));

      const { error: saleError } = await supabase.from('sales').insert(salesPayload);
      if (saleError) throw saleError;

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
        shippingCharged: '0',
        shippingCost: '0',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
      alert('Nota emitida com sucesso! ✨');
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
      <div className="flex items-stretch gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            type="text" 
            placeholder="Buscar nota ou cliente..."
            className="w-full h-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none text-black focus:border-black transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-14 h-14 rounded-2xl shadow-xl transition-all flex items-center justify-center shrink-0 ${showForm ? 'bg-white border border-gray-100 text-black' : 'bg-black text-white'}`}
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

            <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Carrinho</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-bold text-black outline-none"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                >
                  <option value="">Peça</option>
                  {products.map(p => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name}</option>)}
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
                  className="bg-black text-white p-3 rounded-xl"
                >
                  <Plus size={18} />
                </button>
              </div>

              {cart.length > 0 && (
                <div className="space-y-2 mt-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-black uppercase text-black truncate flex-1">{item.product.name}</p>
                      <button type="button" onClick={() => removeFromCart(index)} className="text-red-300 ml-2">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nova Seção de Frete */}
            <div className="bg-purple-50 p-5 rounded-[2rem] border border-purple-100 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Truck size={14} className="text-purple-400" />
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Logística & Frete</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-purple-300 uppercase block mb-1">Cobrado da Cliente</label>
                  <input type="text" placeholder="0,00" className="w-full bg-white border border-purple-100 rounded-xl py-3 px-4 text-xs font-bold text-black outline-none" value={formData.shippingCharged} onChange={e => setFormData({...formData, shippingCharged: e.target.value})} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-purple-300 uppercase block mb-1">Custo Real (Pago)</label>
                  <input type="text" placeholder="0,00" className="w-full bg-white border border-purple-100 rounded-xl py-3 px-4 text-xs font-bold text-black outline-none" value={formData.shippingCost} onChange={e => setFormData({...formData, shippingCost: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[8px] font-black text-purple-300 uppercase">Resultado Logístico</span>
                <span className={`text-[10px] font-black ${shippingBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {shippingBalance >= 0 ? '+' : ''} R$ {shippingBalance.toFixed(2)}
                </span>
              </div>
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

            <div className="bg-gray-950 p-7 rounded-[2rem] text-white flex justify-between items-center shadow-2xl">
              <div>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Total Geral</span>
                <p className="text-2xl font-black">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <ShoppingBag size={24} className="text-white/20" />
            </div>
            
            <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xs font-bold text-black outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>

          <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">Finalizar Nota</button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Notas Emitidas</h3>
            <Filter size={14} className="text-gray-200" />
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden divide-y divide-gray-50">
            {loading ? (
              <div className="p-20 text-center text-gray-300 text-[10px] font-black uppercase animate-pulse">Buscando Notas...</div>
            ) : filteredSales.length > 0 ? (
              filteredSales.map(sale => (
                <div 
                  key={sale.id} 
                  onClick={() => handleShowReceipt(sale.order_id)}
                  className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:scale-[0.99]"
                >
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
                    <p className="text-xs font-black text-black">R$ {Number(sale.value + (sale.shipping_charged || 0)).toFixed(2)}</p>
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

      {selectedOrderItems && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="border-t-8 border-black absolute top-0 left-0 right-0"></div>
            
            <button 
              onClick={() => setSelectedOrderItems(null)}
              className="absolute right-6 top-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
            >
              <X size={18} />
            </button>

            <div className="space-y-8 mt-4">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-serif-brand font-black text-black">S.</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Sensitive Shop</p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                <p className="text-sm font-black text-black uppercase tracking-tight">{selectedOrderItems[0].customer?.name}</p>
              </div>

              <div className="space-y-4">
                <div className="border-y border-dashed border-gray-200 py-3 grid grid-cols-12 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="col-span-8">Item</span>
                  <span className="col-span-4 text-right">Subtotal</span>
                </div>
                
                <div className="space-y-3">
                  {selectedOrderItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-start text-[10px] font-bold text-black uppercase">
                      <div className="col-span-8 leading-tight">
                        {item.product?.name}
                        <p className="text-[7px] text-gray-400 font-bold mt-0.5">Qt: {item.amount}</p>
                      </div>
                      <span className="col-span-4 text-right font-black">R$ {Number(item.value).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Frete Cobrado</span>
                    <span className="text-black font-black">R$ {(selectedOrderItems.reduce((acc, i) => acc + (i.shipping_charged || 0), 0)).toFixed(2)}</span>
                  </div>
                  {selectedOrderItems[0].discount > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-red-400 uppercase tracking-widest">
                      <span>Desconto</span>
                      <span className="font-black">- R$ {(selectedOrderItems.reduce((acc, i) => acc + (i.discount || 0), 0)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-black text-black uppercase tracking-widest">Total Geral</span>
                    <span className="text-xl font-black text-black">
                      R$ {selectedOrderItems.reduce((acc, i) => acc + Number(i.value) + Number(i.shipping_charged || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <button 
                  onClick={() => setSelectedOrderItems(null)}
                  className="w-full bg-black text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest"
                >
                  Fechar Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
