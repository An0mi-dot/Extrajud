-- ============================================================
-- EXTRATJUD – Migração: subsidios_trabalhistas
-- Execute no painel Supabase → SQL Editor
-- ============================================================

create table if not exists subsidios_trabalhistas (
    id               uuid         default gen_random_uuid() primary key,
    numero_processo  text         not null,
    nome_parte       text,
    cpf              text,
    comarca          text,
    area             text,
    tipo_documento   text,
    responsavel      text,
    prazo            date,
    status           text         not null default 'Novo',
    observacoes      text,
    user_id          uuid         references auth.users(id) on delete set null,
    user_email       text,
    created_at       timestamptz  default now()
);

-- ── Row Level Security ──────────────────────────────────────
alter table subsidios_trabalhistas enable row level security;

-- Qualquer usuário autenticado pode visualizar todos os registros
create policy "Autenticados podem visualizar"
    on subsidios_trabalhistas for select
    to authenticated
    using (true);

-- Qualquer usuário autenticado pode inserir (registrando seu próprio user_id)
create policy "Autenticados podem inserir"
    on subsidios_trabalhistas for insert
    to authenticated
    with check (true);

-- Apenas o dono pode atualizar
create policy "Dono pode atualizar"
    on subsidios_trabalhistas for update
    to authenticated
    using (auth.uid() = user_id);

-- Apenas o dono pode excluir
create policy "Dono pode excluir"
    on subsidios_trabalhistas for delete
    to authenticated
    using (auth.uid() = user_id);

-- ── Índices ─────────────────────────────────────────────────
create index if not exists idx_subsidios_status     on subsidios_trabalhistas (status);
create index if not exists idx_subsidios_prazo      on subsidios_trabalhistas (prazo);
create index if not exists idx_subsidios_user_id    on subsidios_trabalhistas (user_id);
create index if not exists idx_subsidios_created_at on subsidios_trabalhistas (created_at desc);
