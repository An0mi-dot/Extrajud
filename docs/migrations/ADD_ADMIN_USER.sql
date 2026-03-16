-- ============================================================
-- SCRIPT: Adicionar usuário como Admin
-- Objetivo: Permitir que joao.aviana@neoenergia.com gerencie cargos
-- ============================================================

-- Execute este script no Supabase SQL Editor
-- Caminho: Seu Projeto Supabase → SQL Editor → Criar nova query

-- 1. Encontrar o UUID do usuário autenticado no Supabase
-- (Vá para Authentication → Users e copie o UUID de joao.aviana@neoenergia.com)
-- SUBSTITUA 'UUID_AQUI' pelo UUID real do usuário

INSERT INTO user_roles (user_id, user_email, cargo, ativo)
VALUES (
    'UUID_AQUI',
    'joao.aviana@neoenergia.com',
    'admin',
    true
)
ON CONFLICT (user_id) DO UPDATE SET
    cargo = 'admin',
    ativo = true,
    updated_at = now();

-- Se tiver erro "FOREIGN KEY constraint", você precisa:
-- 1. Criar o usuário primeiro no Authentication
-- 2. Copiar o UUID exato
-- 3. Colar aqui em 'UUID_AQUI'

-- Query alternativa se souber apenas o UUID:
-- DELETE FROM user_roles WHERE user_email = 'joao.aviana@neoenergia.com';
-- INSERT INTO user_roles (user_id, user_email, cargo, ativo)
-- VALUES ('seu-uuid-aqui', 'joao.aviana@neoenergia.com', 'admin', true);
