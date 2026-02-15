
-- 1. Ativar Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Limpar Tabelas Antigas (CUIDADO: Isso apaga os dados atuais)
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

-- 3. Criar Tabela de Clientes
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar Tabela de Produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  reference_code TEXT,
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  size TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar Tabela de Vendas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 1,
  value DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DESABILITAR RLS
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- 7. Dados de Exemplo
INSERT INTO public.products (name, reference_code, purchase_price, price, stock, size, color) VALUES 
('Conjunto Noir Renda Chantilly', 'CN-001', 85.00, 189.90, 5, 'M', 'Preto'),
('Body Modelador Sensitive Silky', 'BM-002', 110.00, 219.00, 2, 'G', 'Bege'),
('Sutiã Bojo Invisível Lux', 'SB-003', 42.00, 98.00, 10, '42', 'Branco'),
('Calcinha Silk Minimalist', 'CS-004', 18.00, 45.00, 20, 'P', 'Nude');

INSERT INTO public.customers (name, phone) VALUES 
('Ana Clara Boutique', '11988887777'),
('Heloisa Lingerie Store', '11977776666');
