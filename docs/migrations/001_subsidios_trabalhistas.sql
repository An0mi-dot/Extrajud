-- ============================================================
-- EXTRATJUD – Migração: subsidios_trabalhistas
-- Execute no painel Supabase → SQL Editor
-- ============================================================

create table if not exists subsidios_trabalhistas (
    id               uuid         default gen_random_uuid() primary key,
    numero_processo  text,
    nome_parte       text,
    cpf              text,
    email            text,
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

drop policy if exists "Autenticados podem visualizar"     on subsidios_trabalhistas;
drop policy if exists "Formulário público pode inserir"   on subsidios_trabalhistas;
drop policy if exists "Autenticados podem inserir"        on subsidios_trabalhistas;
drop policy if exists "Dono pode atualizar"               on subsidios_trabalhistas;
drop policy if exists "Dono pode excluir"                 on subsidios_trabalhistas;

-- Qualquer usuário autenticado pode visualizar todos os registros
create policy "Autenticados podem visualizar"
    on subsidios_trabalhistas for select
    to authenticated
    using (true);

-- Formulário público: usuários não autenticados (anon) podem inserir
create policy "Formulário público pode inserir"
    on subsidios_trabalhistas for insert
    to anon
    with check (true);

-- Qualquer usuário autenticado pode inserir (registro via EXTRATJUD)
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

-- ── Storage: bucket para arquivos do formulário ─────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('subsidios-arquivos', 'subsidios-arquivos', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "Formulário pode enviar arquivos" on storage.objects;
drop policy if exists "Autenticados podem ler arquivos" on storage.objects;

-- Formulário público pode fazer upload de arquivos
create policy "Formulário pode enviar arquivos"
    on storage.objects for insert
    to anon
    with check (bucket_id = 'subsidios-arquivos');

-- Autenticados podem ler os arquivos no EXTRATJUD
create policy "Autenticados podem ler arquivos"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'subsidios-arquivos');
