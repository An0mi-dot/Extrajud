-- ============================================================
-- EXTRATJUD – Migração: user_roles
-- Cargos e Responsabilidades para Subsidios Trabalhistas
-- ============================================================

-- ── Tabela de Cargos ─────────────────────────────────────
create table if not exists user_roles (
    id               uuid         default gen_random_uuid() primary key,
    user_id          uuid         not null unique references auth.users(id) on delete cascade,
    user_email       text         not null,
    cargo            text         not null, -- 'Responsável Juridico', 'Responsável Comarca', 'Gestor Area', etc.
    comarca          text,        -- preenchido para Responsável Comarca (ex: 'Salvador', 'Itabuna')
    area             text,        -- preenchido para Gestor Area (ex: 'RH', 'GSS', etc.)
    ativo            boolean      default true,
    created_at       timestamptz  default now(),
    updated_at       timestamptz  default now()
);

-- ── Row Level Security ──────────────────────────────────────
alter table user_roles enable row level security;

drop policy if exists "Autenticados podem visualizar roles" on user_roles;
drop policy if exists "Admin pode gerenciar roles" on user_roles;

-- Qualquer usuário autenticado pode visualizar roles (para filtros e notificações)
create policy "Autenticados podem visualizar roles"
    on user_roles for select
    to authenticated
    using (true);

-- Apenas administradores (usuários com user_id específicos) podem inserir
create policy "Admin pode inserir roles"
    on user_roles for insert
    to authenticated
    with check (auth.uid() = '00000000-0000-0000-0000-000000000000'); -- Placeholder para admin check

-- Apenas administradores podem atualizar
create policy "Admin pode atualizar roles"
    on user_roles for update
    to authenticated
    using (auth.uid() = '00000000-0000-0000-0000-000000000000') 
    with check (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- ── Índices ─────────────────────────────────────────────────
create index if not exists idx_user_roles_user_id   on user_roles (user_id);
create index if not exists idx_user_roles_cargo     on user_roles (cargo);
create index if not exists idx_user_roles_comarca   on user_roles (comarca);
create index if not exists idx_user_roles_area      on user_roles (area);
create index if not exists idx_user_roles_email     on user_roles (user_email);

-- ── Transações para Criar Usuários ──────────────────────────
-- NOTA: Usuários devem ser criados manualmente via Supabase Console / Admin API
-- (Não suporta INSERT direto em auth.users via SQL)
-- 
-- Usuários criados:
-- 1. Antonio Fernando (antonio.flima@neoenergia.com) - Responsável Comarca Salvador
--    UUID: f259c83d-0a80-432f-b65d-a55b5cfba473
-- 
-- 2. Iane Naira (iane.velame@neoenergia.com) - Responsável Comarca Itabuna
--    UUID: 93e01ebc-68aa-45f4-a815-4ea94df3ca40
--
-- Execute o INSERT abaixo para registrar os cargos:
INSERT INTO user_roles (user_id, user_email, cargo, comarca, ativo)
VALUES 
  ('f259c83d-0a80-432f-b65d-a55b5cfba473', 'antonio.flima@neoenergia.com', 'Responsável Comarca', 'Salvador', true),
  ('93e01ebc-68aa-45f4-a815-4ea94df3ca40', 'iane.velame@neoenergia.com', 'Responsável Comarca', 'Itabuna', true);

comment on table user_roles is 'Cargos e responsabilidades dos usuários do EXTRATJUD.';
