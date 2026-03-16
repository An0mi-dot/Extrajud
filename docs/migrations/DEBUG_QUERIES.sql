-- ============================================================
-- DEBUG SCRIPT: Verificar estado das tabelas e policies
-- Objetivo: Diagnosticar problemas de carregamento de dados
-- ============================================================

-- 1. Verificar se a tabela subsidios_trabalhistas existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subsidios_trabalhistas'
) as tabela_existe;

-- 2. Verificar se a tabela user_roles existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_roles'
) as tabela_existe;

-- 3. Ver conteúdo da tabela user_roles
SELECT id, user_id, user_email, cargo, ativo, created_at 
FROM user_roles 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Contar registros em cada tabela
SELECT 
    (SELECT COUNT(*) FROM user_roles) as total_user_roles,
    (SELECT COUNT(*) FROM subsidios_trabalhistas) as total_subsidios;

-- 5. Ver User ID do seu usuário na tabela auth.users
-- (Substitua o email com seu email)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'joao.aviana@neoenergia.com';

-- 6. Verificar RLS Policies na tabela subsidios_trabalhistas
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'subsidios_trabalhistas'
ORDER BY policyname;

-- 7. Verificar RLS Policies na tabela user_roles
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 8. Ver se há problemas com as colunas de user_roles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- 9. Ver se há problemas com as colunas de subsidios_trabalhistas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subsidios_trabalhistas'
ORDER BY ordinal_position;
