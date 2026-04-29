-- ============================================================================
-- FIX_SCHEMA_COMPLETO_SOLICITACOES.sql
-- Adiciona TODAS as colunas faltantes em solicitacoes_preventivo
-- ============================================================================

BEGIN;

-- Adicionar colunas básicas de requisição
ALTER TABLE solicitacoes_preventivo 
ADD COLUMN IF NOT EXISTS unidade_negocio text,
ADD COLUMN IF NOT EXISTS area_solicitante text,
ADD COLUMN IF NOT EXISTS tipo_subsidio text,
ADD COLUMN IF NOT EXISTS orgao_demandante text,
ADD COLUMN IF NOT EXISTS numero_processo text,
ADD COLUMN IF NOT EXISTS origem_dado text,
ADD COLUMN IF NOT EXISTS prazo_externo text,
ADD COLUMN IF NOT EXISTS sla_regra text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS descricao text;

-- Adicionar flags/status
ALTER TABLE solicitacoes_preventivo 
ADD COLUMN IF NOT EXISTS importance_flag boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS indigena_flag boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tradicional_flag boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Novo';

-- Adicionar rastreamento de usuário
ALTER TABLE solicitacoes_preventivo 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS user_email text;

-- Adicionar timestamps se não existirem
ALTER TABLE solicitacoes_preventivo 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT NOW();

COMMIT;

-- ============================================================================
-- Instruções:
-- 1. Copie TODO o conteúdo acima (BEGIN; até COMMIT;)
-- 2. Abra Supabase SQL Editor
-- 3. Cole o script
-- 4. Clique em RUN
-- 5. Espere a confirmação "Query executed successfully"
-- ============================================================================
