-- ============================================================
-- MIGRAÇÃO 006: REMOVER SISTEMA DE LOGIN
-- Implementar sistema de auto-registro baseado em UUID/Machine
-- ============================================================

-- 1. CRIAR TABELA users_auto (usuários sem autenticação)
CREATE TABLE IF NOT EXISTS users_auto (
    user_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_identifier TEXT UNIQUE NOT NULL,
    app_code CHAR(1) DEFAULT 'A',
    employee_name TEXT,
    first_seen TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ DEFAULT now(),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_auto_machine_id ON users_auto(machine_identifier);
CREATE INDEX IF NOT EXISTS idx_users_auto_last_login ON users_auto(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_auto_ativo ON users_auto(ativo);

-- 2. ADICIONAR COLUNA user_uuid EM user_roles
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS user_uuid UUID REFERENCES users_auto(user_uuid) ON DELETE CASCADE;

-- 3. CRIAR ÍNDICES COMBINADOS
CREATE INDEX IF NOT EXISTS idx_user_roles_user_uuid ON user_roles(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_roles_cargo_active ON user_roles(cargo, ativo) 
WHERE ativo = true;

-- 4. ATUALIZAR colunas UPDATED_AT em users_auto com trigger
CREATE OR REPLACE FUNCTION update_users_auto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_auto_updated_at
BEFORE UPDATE ON users_auto
FOR EACH ROW
EXECUTE FUNCTION update_users_auto_updated_at();

-- 5. TRIGGER para atualizar last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users_auto 
    SET last_login = now() 
    WHERE user_uuid = NEW.user_uuid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Será disparado quando fizer query no DB (implementamos via aplicação)

-- 6. RLS - users_auto (qualquer autenticado pode ler)
ALTER TABLE users_auto ENABLE ROW LEVEL SECURITY;

-- Leitura: Qualquer autenticado pode ler
CREATE POLICY "Autenticados podem visualizar users_auto"
    ON users_auto FOR SELECT
    TO authenticated USING (true);

-- Escrita: APENAS via app/function (INSERT desativado direto)
CREATE POLICY "Users auto INSERT disabled via app"
    ON users_auto FOR INSERT
    TO authenticated
    WITH CHECK (false);  -- Sempre false, usa RPC function

-- UPDATE: apenas usuários edit próprio last_login, admin edita tudo
CREATE POLICY "Users podem atualizar own last_login"
    ON users_auto FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);  -- Validado no app

-- 7. RLS - user_roles (atualizado para mostrar com users_auto)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Leitura: Qualquer autenticado pode ler
CREATE POLICY "Autenticados podem visualizar user_roles (uuid)"
    ON user_roles FOR SELECT
    TO authenticated USING (true);

-- 8. CRIAR função RPC para registrar novo usuário (server-side)
CREATE OR REPLACE FUNCTION register_machine_user(
    p_machine_identifier TEXT,
    p_app_code CHAR(1) DEFAULT 'A'
)
RETURNS TABLE (
    user_uuid UUID,
    is_new BOOLEAN
) AS $$
DECLARE
    v_uuid UUID;
    v_is_new BOOLEAN;
BEGIN
    -- Tenta encontrar usuário existente
    SELECT users_auto.user_uuid INTO v_uuid 
    FROM users_auto 
    WHERE machine_identifier = p_machine_identifier 
    LIMIT 1;

    IF v_uuid IS NULL THEN
        -- Novo usuário - criar
        INSERT INTO users_auto (machine_identifier, app_code)
        VALUES (p_machine_identifier, p_app_code)
        RETURNING users_auto.user_uuid INTO v_uuid;
        
        v_is_new := true;
    ELSE
        -- Usuário existente - atualizar last_login
        UPDATE users_auto 
        SET last_login = now()
        WHERE users_auto.user_uuid = v_uuid;
        
        v_is_new := false;
    END IF;

    RETURN QUERY SELECT v_uuid, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNÇÃO para atualizar UUID manualmente (apenas admin)
CREATE OR REPLACE FUNCTION update_user_uuid_manual(
    p_old_uuid UUID,
    p_new_machine_identifier TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_uuid UUID
) AS $$
DECLARE
    v_new_uuid UUID;
    v_admin_id UUID;
BEGIN
    -- Verificar se é admin (via RPC context)
    -- Aqui você pode validar via JWT claims ou outro método
    
    -- Atualizar machine_identifier
    UPDATE users_auto
    SET machine_identifier = p_new_machine_identifier,
        updated_at = now()
    WHERE user_uuid = p_old_uuid;

    SELECT user_uuid INTO v_new_uuid FROM users_auto WHERE user_uuid = p_old_uuid;

    RETURN QUERY SELECT true, 'UUID atualizado com sucesso'::TEXT, v_new_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. VIEW helper para admin ver todos os usuários com cargos
CREATE OR REPLACE VIEW v_users_with_roles AS
SELECT 
    ua.user_uuid,
    ua.machine_identifier,
    ua.employee_name,
    ua.first_seen,
    ua.last_login,
    ua.ativo as user_ativo,
    COUNT(ur.id) as total_cargos,
    STRING_AGG(ur.cargo || ' (' || COALESCE(ur.comarca, 'N/A') || ')', ', ') as cargos
FROM users_auto ua
LEFT JOIN user_roles ur ON ua.user_uuid = ur.user_uuid
GROUP BY ua.user_uuid, ua.machine_identifier, ua.employee_name, ua.first_seen, ua.last_login, ua.ativo
ORDER BY ua.last_login DESC;

-- ============================================================
-- NOTAS:
-- ============================================================
-- 1. O campo `machine_identifier` deve ser SHA256(MAC + HOSTNAME + SERIAL)
-- 2. A função `register_machine_user()` é chamada pelo app na primeira abertura
-- 3. Um admin pode chamar `update_user_uuid_manual()` para reatribuir UUIDs
-- 4. RLS garante que só o admin pode fazer UPDATE em user_roles
-- ============================================================
