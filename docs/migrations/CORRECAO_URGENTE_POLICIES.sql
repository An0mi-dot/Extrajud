-- ============================================================
-- CORREÇÃO URGENTE: Policies com UUID Placeholder
-- Execute IMEDIATAMENTE no Supabase SQL Editor
-- ============================================================

-- ── PASSO 1: REMOVER as policies com UUID placeholder ──
DROP POLICY IF EXISTS "Admin pode inserir roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode atualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode deletar roles" ON user_roles;

-- ── PASSO 2: RECRIAR policies CORRETAS (sem policy loops) ──

-- Qualquer autenticado pode ler roles
CREATE POLICY "Usuários autenticados podem ver roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

-- Apenas admins podem adionar/editar roles
-- (Verifica se user_id do usuário tem cargo='admin' em user_roles)
CREATE POLICY "Admins podem gerenciar roles"
    ON user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Verifica se O USUÁRIO que está fazendo a action é admin
        -- sem fazer recursão (SELECT from table dentro da policy de INSERT da mesma table)
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND cargo = 'admin')
    );

CREATE POLICY "Admins podem atualizar roles"
    ON user_roles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND cargo = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND cargo = 'admin')
    );

CREATE POLICY "Admins podem deletar roles"
    ON user_roles FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND cargo = 'admin')
    );

-- ── VERIFICAR: São essas agora as 4 policies? ──
SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' ORDER BY policyname;

-- Resultado esperado:
-- - Admins podem atualizar roles
-- - Admins podem deletar roles
-- - Admins podem gerenciar roles
-- - Autenticados podem visualizar roles
-- - Usuários autenticados podem ver roles
