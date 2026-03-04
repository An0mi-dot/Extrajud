-- CORREÇÃO DE ERRO DE RECURSÃO INFINITA (RLS)

-- 1. Remover políticas antigas que estavam causando loop
DROP POLICY IF EXISTS "Enable insert/update for admins only" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Allow Read All" ON public.user_roles;
DROP POLICY IF EXISTS "Allow Write Admin" ON public.user_roles;

-- 2. Recriar Política de LEITURA (Simples, sem restrições)
-- Permite que qualquer usuário logado veja a tabela de cargos.
CREATE POLICY "Public Read Access" ON public.user_roles
FOR SELECT TO authenticated
USING (true);

-- 3. Criar Função Auxiliar para verificar Admin (Security Definer)
-- "SECURITY DEFINER" faz a função rodar com privilégios do criador (Admin),
-- ignorando o RLS da tabela durante a checagem, evitando o loop infinito.
CREATE OR REPLACE FUNCTION public.check_is_admin(check_email text)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE email = check_email 
    AND role = 'admin'
  );
END;
$$;

-- 4. Recriar Políticas de ESCRITA (Insert, Update, Delete) usando a função segura
CREATE POLICY "Admin Write Access" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK ( public.check_is_admin(auth.jwt() ->> 'email') );

CREATE POLICY "Admin Update Access" ON public.user_roles
FOR UPDATE TO authenticated
USING ( public.check_is_admin(auth.jwt() ->> 'email') );

CREATE POLICY "Admin Delete Access" ON public.user_roles
FOR DELETE TO authenticated
USING ( public.check_is_admin(auth.jwt() ->> 'email') );
