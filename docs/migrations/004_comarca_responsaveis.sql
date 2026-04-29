-- ============================================================
-- EXTRATJUD – Migração: comarca_responsaveis + campos comarcas
-- Execute no painel Supabase → SQL Editor
-- ============================================================

-- 1. Adicionar campo responsavel_comarca à tabela subsidios_trabalhistas
ALTER TABLE subsidios_trabalhistas 
ADD COLUMN IF NOT EXISTS responsavel_comarca TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS area_origem TEXT DEFAULT 'RH';

-- 2. Criar tabela de mapeamento comarca → responsável
CREATE TABLE IF NOT EXISTS comarca_responsaveis (
    id              uuid         default gen_random_uuid() primary key,
    comarca         text         not null unique,
    responsavel     text         not null,
    email           text,
    user_id         uuid         references auth.users(id) on delete set null,
    observacoes     text,
    ativo           boolean      default true,
    created_at      timestamptz  default now(),
    updated_at      timestamptz  default now()
);

-- 3. Criar tabela de áreas (para dropdowns)
CREATE TABLE IF NOT EXISTS areas_enum (
    id              uuid         default gen_random_uuid() primary key,
    area_nome       text         not null unique,
    descricao       text,
    ativo           boolean      default true,
    created_at      timestamptz  default now()
);

-- 4. Inserir áreas padrão confirmadas nas respostas
INSERT INTO areas_enum (area_nome, descricao) VALUES
    ('RH', 'Recursos Humanos'),
    ('GSS', 'Gestão de Segurança de Sistemas'),
    ('Folha', 'Departamento de Folha de Pagamento'),
    ('Remuneração', 'Remuneração'),
    ('Organização', 'Organização'),
    ('Plano de Saúde', 'Plano de Saúde')
ON CONFLICT (area_nome) DO NOTHING;

-- 5. Inserir mapeamento de comarcas padrão
-- (Ajuste conforme necessário - estes são exemplos)
INSERT INTO comarca_responsaveis (comarca, responsavel, email) VALUES
    ('Salvador', 'Antonio Fernando', 'antonio.fernando@empresa.com'),
    ('Camaçari', 'Antonio Fernando', 'antonio.fernando@empresa.com'),
    ('Feira de Santana', 'Iane Naira', 'iane.naira@empresa.com'),
    ('Vitória da Conquista', 'Iane Naira', 'iane.naira@empresa.com'),
    ('Ilhéus', 'Iane Naira', 'iane.naira@empresa.com'),
    ('Jequié', 'Antonio Fernando', 'antonio.fernando@empresa.com'),
    ('Barreiras', 'Antonio Fernando', 'antonio.fernando@empresa.com')
ON CONFLICT (comarca) DO NOTHING;

-- 6. Atualizar RLS para a nova tabela
ALTER TABLE comarca_responsaveis ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode visualizar
CREATE POLICY "Visualizar comarcas responsáveis"
    ON comarca_responsaveis FOR SELECT
    TO authenticated
    USING (true);

-- Apenas admins podem atualizar (simplificado - qualquer autenticado por enquanto)
CREATE POLICY "Atualizar comarcas responsáveis"
    ON comarca_responsaveis FOR UPDATE
    TO authenticated
    USING (true);

ALTER TABLE areas_enum ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode visualizar
CREATE POLICY "Visualizar áreas"
    ON areas_enum FOR SELECT
    TO authenticated
    USING (true);

-- 7. Adicionar índices
CREATE INDEX IF NOT EXISTS idx_subsidios_responsavel_comarca 
    ON subsidios_trabalhistas (responsavel_comarca);
CREATE INDEX IF NOT EXISTS idx_subsidios_area_origem 
    ON subsidios_trabalhistas (area_origem);
CREATE INDEX IF NOT EXISTS idx_comarca_responsaveis_comarca 
    ON comarca_responsaveis (comarca);
