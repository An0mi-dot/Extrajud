-- ============================================================
-- EXTRATJUD – Migração: Adicionar coluna prioridade
-- Execute no painel Supabase → SQL Editor
-- ============================================================

-- Adicionar coluna prioridade à tabela subsidios_trabalhistas
alter table subsidios_trabalhistas 
add column if not exists prioridade text default 'Normal';

-- Criar índice para prioridade
create index if not exists idx_subsidios_prioridade on subsidios_trabalhistas (prioridade);

-- Atualizar registros existentes para garantir que tenham valor
update subsidios_trabalhistas 
set prioridade = 'Normal' 
where prioridade is null;
