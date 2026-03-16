-- ============================================================
-- FIX: Case-Insensitive Cargo Comparison
-- ============================================================

-- PASSO 1: Converter TODOS os cargos para MINÚSCULAS no banco
UPDATE user_roles
SET cargo = LOWER(cargo),
    updated_at = now();

-- PASSO 2: Verificar resultado
SELECT id, user_email, cargo FROM user_roles ORDER BY created_at DESC;

-- Resultado esperado: Todos os cargos em minúsculas (admin, tester, etc)

-- ============================================================
-- PASSO 3: Atualizar função is_user_admin para ser case-insensitive
-- ============================================================
DROP FUNCTION IF EXISTS public.is_user_admin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_check uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_cargo text;
BEGIN
  SELECT LOWER(cargo) INTO user_cargo
  FROM user_roles
  WHERE id = user_id_check
  LIMIT 1;
  
  RETURN user_cargo = 'admin';
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- ============================================================
-- PASSO 4: Testar
-- ============================================================
SELECT * FROM user_roles WHERE LOWER(cargo) = 'admin';

-- Resultado esperado: Deve retornar SEU USUÁRIO com cargo='admin'
