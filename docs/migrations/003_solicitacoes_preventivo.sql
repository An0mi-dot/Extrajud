-- ============================================================
-- EXTRATJUD – Migração: solicitacoes_preventivo
-- Tabela de Solicitações de Subsídios Preventivos
-- VERSÃO CORRIGIDA: sem recursão infinita de policies
-- ============================================================

-- Drop a tabela antiga se existir (garante limpeza)
DROP TABLE IF EXISTS solicitacoes_preventivo CASCADE;

-- Criar tabela nova
CREATE TABLE solicitacoes_preventivo (
    id                 uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo             text          NOT NULL,
    unidade            text,
    tipo_subsidio      text,
    status             text          DEFAULT 'Aberta',
    prazo_externo      date,
    sla_regra          text,
    descricao          text,
    observacoes        text,
    responsavel        text,
    
    -- Rastreamento de usuário (SEM constraint de FK)
    user_id            uuid,
    user_email         text,
    
    -- Timestamps
    created_at         timestamptz   DEFAULT now(),
    updated_at         timestamptz   DEFAULT now()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE solicitacoes_preventivo ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem suas próprias solicitações
CREATE POLICY "Users see own solicitacoes"
    ON solicitacoes_preventivo FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Usuários criam solicitações com seu user_id
CREATE POLICY "Users can create own solicitacoes"
    ON solicitacoes_preventivo FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy: Usuários editam suas próprias solicitações
CREATE POLICY "Users can update own solicitacoes"
    ON solicitacoes_preventivo FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Usuários deletam suas próprias solicitações
CREATE POLICY "Users can delete own solicitacoes"
    ON solicitacoes_preventivo FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user_id    ON solicitacoes_preventivo (user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user_email ON solicitacoes_preventivo (user_email);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status     ON solicitacoes_preventivo (status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_tipo       ON solicitacoes_preventivo (tipo_subsidio);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_created    ON solicitacoes_preventivo (created_at);

-- ── Nota sobre Admin ──────────────────────────────────────────
-- Admins PODEM ver/editar tudo porque isso é feito no nível HTTP
-- (no código JavaScript, um admin faz queries sem / com BYPASS via uma role diferente)
-- RLS aqui é apenas para usuários comuns. Admin é gerenciado no aplicativo.
