-- ============================================================
-- DIAGNÓSTICO: Verificar estado ATUAL das policies
-- ============================================================

-- Ver todas as policies da tabela user_roles
-- (se houver recursão, aparecerá aqui)
SELECT 
  policyname,
  permissive,
  roles,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Ver se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_class
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE relname = 'user_roles';

-- Ver funções existentes relacionadas a admin
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%admin%' OR routine_name LIKE '%is_user%'
ORDER BY routine_name;

-- ============================================================
-- TESTE SIMPLES (sem auth)
-- ============================================================
-- Tentar contar quantos registros existem em user_roles
-- (funciona mesmo com RLS porque estamos como superuser)
SELECT COUNT(*) as total_roles FROM user_roles;

-- Ver os registros (para debug)
SELECT id, user_email, cargo FROM user_roles ORDER BY created_at DESC;
