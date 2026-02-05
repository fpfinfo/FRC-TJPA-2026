-- 1. Tabela de Cartórios (Notaries)
create table public.notaries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  code text,
  ens_code text,
  responsible_name text,
  responsible_cpf text,
  comarca text,
  status text default 'ATIVO',
  address text,
  city text,
  state text,
  cep text,
  phone text,
  email text
);

-- 2. Tabela de Pagamentos (Payments)
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notary_id uuid references public.notaries(id),
  notary_name text, -- Armazenado para manter histórico caso o nome mude
  code text,
  responsible_name text,
  cpf text,
  date date,
  month_reference text,
  year_reference integer,
  comarca text,
  gross_value numeric,
  irrf_value numeric,
  net_value numeric,
  history_type text,
  status text default 'PAGO'
);

-- 3. Tabela de Faixas de IRRF (Para futura integração dinâmica)
create table public.irrf_brackets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  year integer not null,
  min_value numeric not null,
  max_value numeric, -- NULL indica infinito (faixa teto)
  rate numeric not null, -- Ex: 0.275 para 27.5%
  deduction numeric not null
);

-- 4. Habilitar Segurança a Nível de Linha (RLS)
alter table public.notaries enable row level security;
alter table public.payments enable row level security;
alter table public.irrf_brackets enable row level security;

-- 5. Criar Políticas de Acesso (RLS Policies)
-- Permite que qualquer usuário autenticado faça CRUD (Create, Read, Update, Delete)

-- Políticas para Notaries
create policy "Permitir acesso total a usuários autenticados em notaries"
on public.notaries for all to authenticated using (true);

-- Políticas para Payments
create policy "Permitir acesso total a usuários autenticados em payments"
on public.payments for all to authenticated using (true);

-- Políticas para IRRF Brackets
create policy "Permitir acesso total a usuários autenticados em irrf_brackets"
on public.irrf_brackets for all to authenticated using (true);

-- NOTA: Se precisar testar sem login durante o desenvolvimento, descomente as linhas abaixo para liberar acesso público (anon):
-- create policy "Acesso público (anon) em notaries" on public.notaries for all to anon using (true);
-- create policy "Acesso público (anon) em payments" on public.payments for all to anon using (true);
