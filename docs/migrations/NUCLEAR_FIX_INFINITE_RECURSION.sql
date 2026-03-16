-- ============================================================
-- NUCLEAR FIX: Infinite Recursion em user_roles
-- Execute isto NO SUPABASE SQL EDITOR COM CUIDADO!
-- ============================================================

-- =====================================================
-- PASSO 1: DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 2: REMOVER TODAS AS POLICIES ANTIGAS
-- =====================================================
DROP POLICY IF EXISTS "Autenticados podem visualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode gerenciar roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode inserir roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode atualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode deletar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins podem gerenciar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins podem atualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins podem deletar roles" ON user_roles;
DROP POLICY IF EXISTS "Usuários autenticados podem ver roles" ON user_roles;
DROP POLICY IF EXISTS "Public Read Access" ON user_roles;
DROP POLICY IF EXISTS "Admin Write Access" ON user_roles;
DROP POLICY IF EXISTS "Admin Update Access" ON user_roles;
DROP POLICY IF EXISTS "Admin Delete Access" ON user_roles;

-- =====================================================
-- PASSO 3: REMOVER FUNÇÃO ANTIGA SE EXISTIR
-- =====================================================
DROP FUNCTION IF EXISTS public.check_is_admin(text) CASCADE;

-- =====================================================
-- PASSO 4: CRIAR FUNÇÃO SEGURA com SECURITY DEFINER
-- =====================================================
-- Esta função roda com privilégios do criador, ignorando RLS
-- e evitando recursão infinita
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_check uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_cargo text;
BEGIN
  SELECT cargo INTO user_cargo
  FROM user_roles
  WHERE id = user_id_check
  LIMIT 1;
  
  RETURN user_cargo = 'admin';
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- =====================================================
-- PASSO 5: HABILITAR RLS NOVAMENTE
-- =====================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 6: CRIAR POLICIES NOVAS (SEM RECURSÃO)
-- =====================================================

-- Policy 1: Leitura - Qualquer autenticado pode ver roles
-- (Sem SubQuery, sem recursão)
CREATE POLICY "select_all_roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Insert - Apenas admins (usa função segura)
CREATE POLICY "insert_admin_only"
    ON user_roles FOR INSERT
    TO authenticated
    WITH CHECK ( public.is_user_admin(auth.uid()) );

-- Policy 3: Update - Apenas admins (usa função segura)
CREATE POLICY "update_admin_only"
    ON user_roles FOR UPDATE
    TO authenticated
    USING ( public.is_user_admin(auth.uid()) )
    WITH CHECK ( public.is_user_admin(auth.uid()) );

-- Policy 4: Delete - Apenas admins (usa função segura)
CREATE POLICY "delete_admin_only"
    ON user_roles FOR DELETE
    TO authenticated
    USING ( public.is_user_admin(auth.uid()) );

-- =====================================================
-- PASSO 7: VERIFICAR POLICIES
-- =====================================================
-- Executar isto para confirmar que há 4 policies sem recursão:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Resultado esperado:
-- 4 policies: delete_admin_only, insert_admin_only, select_all_roles, update_admin_only

-- =====================================================
-- PASSO 8: TESTAR (como usuário autenticado)
-- =====================================================
-- SELECT * FROM user_roles LIMIT 1;
-- Se isto funciona SEM erro de recursão, estamos bons!

COMMIT;
