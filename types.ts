
export interface Product {
  id: string;
  name: string;
  reference_code?: string;
  purchase_price: number;
  price: number;
  stock: number;
  size?: string;
  color?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  birthday?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  order_id: string;
  customer_id: string;
  product_id: string;
  amount: number;
  value: number;
  discount: number;
  discount_description?: string;
  payment_method: string;
  created_at: string;
  customer?: Customer;
  product?: Product;
}
