-- ============================================================
-- DIAGNÓSTICO RÁPIDO: Por que o Admin não aparece?
-- Copie e cole CADA BLOCO por vez no Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- QUERY 1: Você existe no Supabase?
-- ─────────────────────────────────────────────────────────────
SELECT 
    id as "UUID",
    email as "Email",
    created_at as "Criado em"
FROM auth.users
WHERE email = 'joao.aviana@neoenergia.com';

-- ESPERADO: 1 linha com seu UUID
-- NÃO ESPERADO: 0 linhas (usuário não existe)


-- ─────────────────────────────────────────────────────────────
-- QUERY 2: Você está em user_roles?
-- ─────────────────────────────────────────────────────────────
SELECT 
    id,
    user_id,
    user_email,
    cargo,
    ativo,
    created_at
FROM user_roles
WHERE user_email = 'joao.aviana@neoenergia.com';

-- ESPERADO: 1 linha com cargo = 'admin' e ativo = true
-- PROBLEMA A: 0 linhas (você não foi adicionado)
-- PROBLEMA B: cargo ≠ 'admin' (foi adicionado mas com role errada)
-- PROBLEMA C: ativo = false (precisa virar true)


-- ─────────────────────────────────────────────────────────────
-- QUERY 3: Quais policies existem em user_roles?
-- ─────────────────────────────────────────────────────────────
SELECT 
    policyname as "Policy",
    permissive as "Tipo",
    roles as "Para Roles",
    qual as "Condição Query",
    with_check as "Condição Write"
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- ESPERADO: Pelo menos uma policy com SELECT para authenticated
-- PROBLEMA: Nenhuma policy ou policies muito restritivas


-- ─────────────────────────────────────────────────────────────
-- QUERY 4: FIX - Se você não está em user_roles, execute:
-- ─────────────────────────────────────────────────────────────
-- ANTES: copie seu UUID da QUERY 1 acima
-- Depois: substitua SEU-UUID-AQUI abaixo

INSERT INTO user_roles (user_id, user_email, cargo, ativo)
VALUES (
    'SEU-UUID-AQUI',
    'joao.aviana@neoenergia.com',
    'admin',
    true
)
ON CONFLICT (user_id) DO UPDATE SET
    cargo = 'admin',
    ativo = true,
    updated_at = now();


-- ─────────────────────────────────────────────────────────────
-- QUERY 5: FIX - Se policies estão bloqueando:
-- ─────────────────────────────────────────────────────────────
-- Execute para permitir qualquer usuário autenticado ler roles

DROP POLICY IF EXISTS "Autenticados podem visualizar roles" ON user_roles;

CREATE POLICY "Autenticados podem visualizar roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);


-- ─────────────────────────────────────────────────────────────
-- QUERY 6: FIX - Se policies estão bloqueando INSERT/UPDATE:
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin pode inserir roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode atualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode deletar roles" ON user_roles;

-- Admin pode fazer tudo com roles
CREATE POLICY "Admin pode gerenciar roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        -- O usuário é admin?
        (SELECT COUNT(*) FROM user_roles 
         WHERE user_id = auth.uid() AND cargo = 'admin') > 0
    );
