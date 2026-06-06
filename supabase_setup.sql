-- ============================================================
-- COLE ESTE CÓDIGO NO "SQL EDITOR" DO SUPABASE
-- Menu lateral > SQL Editor > New Query > Cole e clique em RUN
-- ============================================================

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'un',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  max_stock NUMERIC NOT NULL DEFAULT 999,
  cost NUMERIC NOT NULL DEFAULT 0,
  barcode TEXT,
  supplier TEXT,
  expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de movimentos
CREATE TABLE IF NOT EXISTS movimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity NUMERIC NOT NULL,
  note TEXT,
  user_name TEXT,
  cost_unit NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar acesso público (para app sem login server-side)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total movimentos" ON movimentos FOR ALL USING (true) WITH CHECK (true);

-- Dados iniciais de exemplo
INSERT INTO produtos (name, category, unit, quantity, min_stock, max_stock, cost, barcode, supplier, expiry) VALUES
  ('Filé Mignon', 'Carnes', 'kg', 12.5, 5, 30, 89.90, '7891234560001', 'Frigorífico Sul', '2026-06-10'),
  ('Queijo Mussarela', 'Laticínios', 'kg', 3.2, 4, 20, 34.50, '7891234560002', 'Laticínios Norte', '2026-06-05'),
  ('Tomate', 'Hortifruti', 'kg', 8.0, 5, 25, 6.90, '7891234560003', 'Hortifruti Central', '2026-06-08'),
  ('Refrigerante 2L', 'Bebidas', 'un', 48, 24, 120, 8.50, '7891234560004', 'Distribuidora Bebidas', NULL),
  ('Arroz 5kg', 'Grãos/Cereais', 'cx', 6, 3, 15, 29.90, '7891234560005', 'Grãos & Cia', '2027-01-01'),
  ('Azeite Extra Virgem', 'Temperos', 'un', 4, 6, 24, 42.00, '7891234560006', 'Importados Ltda', '2027-06-01');
