
export interface Product {
  id: string;
  name: string;
  reference_code?: string;
  purchase_price: number;
  price: number;
  stock: number;
  size?: string;
  color?: string;
  purchase_date?: string;
  expected_days?: number;
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

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
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
  shipping_charged: number;
  shipping_cost: number;
  created_at: string;
  customer?: Customer;
  product?: Product;
}
