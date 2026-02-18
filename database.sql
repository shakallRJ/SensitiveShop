
-- 1. Criar Tabela de Despesas
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Geral',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar campos de frete na tabela de vendas
ALTER TABLE public.sales ADD COLUMN shipping_charged DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0;

-- 3. Desabilitar RLS para a nova tabela
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- 4. Inserir algumas despesas de exemplo
INSERT INTO public.expenses (description, amount, category, date) VALUES 
('Aluguel Showroom', 1200.00, 'Fixo', CURRENT_DATE),
('Tráfego Pago Instagram', 450.00, 'Marketing', CURRENT_DATE),
('Embalagens de Luxo', 280.00, 'Variável', CURRENT_DATE);
