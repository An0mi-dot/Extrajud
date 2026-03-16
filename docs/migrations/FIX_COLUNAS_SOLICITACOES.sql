-- ============================================================
-- FIX: Adicionar colunas ausentes em solicitacoes_preventivo
-- O Frontend estava tentando salvar nessas colunas e dando ERRO
-- ============================================================

ALTER TABLE solicitacoes_preventivo 
ADD COLUMN IF NOT EXISTS unidade_negocio text,
ADD COLUMN IF NOT EXISTS area_solicitante text,
ADD COLUMN IF NOT EXISTS orgao_demandante text,
ADD COLUMN IF NOT EXISTS numero_processo text,
ADD COLUMN IF NOT EXISTS origem_dado text;

-- Opcional: transferir dados de 'unidade' para 'unidade_negocio' (caso existam)
UPDATE solicitacoes_preventivo 
SET unidade_negocio = unidade 
WHERE unidade IS NOT NULL AND (unidade_negocio IS NULL OR unidade_negocio = '');

-- Recarrega o cache do schema no Supabase de forma rápida
NOTIFY pgrst, 'reload schema';
