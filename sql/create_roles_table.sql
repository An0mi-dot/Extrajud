-- Tabela de Cargos (Roles)
-- Armazena os privilégios de cada usuário por email.

CREATE TABLE IF NOT EXISTS public.user_roles (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tester', 'pastas')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Todos os usuários autenticados podem ler (para verificar seu próprio cargo e outros se necessário, ou idealmente restrito)
-- Simplificação: Todos podem ler a tabela de cargos para verificar permissões.
CREATE POLICY "Enable read access for all users" ON public.user_roles
    FOR SELECT USING (true);

-- Política de Escrita: Apenas admins podem adicionar/editar cargos.
-- ATENÇÃO: Para o boostrap inicial (criar o primeiro admin), você pode precisar desativar RLS temporariamente ou inserir via painel do Supabase.
CREATE POLICY "Enable insert/update for admins only" ON public.user_roles
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (SELECT email FROM public.user_roles WHERE role = 'admin')
    );

-- Inserir um Admin Inicial (SUBSTITUA PELO SEU EMAIL)
-- INSERT INTO public.user_roles (email, role) VALUES ('seu-email@exemplo.com', 'admin') ON CONFLICT DO NOTHING;
