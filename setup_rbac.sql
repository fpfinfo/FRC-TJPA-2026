-- 1. Adicionar coluna de Role ao perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- 2. Criar tabela associativa Usuário <-> Cartório (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.notary_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  notary_id uuid REFERENCES public.notaries(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(user_id, notary_id) -- Evita duplicidade de vínculo
);

-- Habilitar RLS na tabela associativa
ALTER TABLE public.notary_access ENABLE ROW LEVEL SECURITY;

-- 3. Função Helper para verificar se é Admin
-- Essa função simplifica as policies abaixo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função Helper para verificar se o usuário tem acesso a um cartório específico
CREATE OR REPLACE FUNCTION public.user_has_access_to_notary(target_notary_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Se for admin, tem acesso a tudo
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  -- Se for user, verifica na tabela associativa
  RETURN EXISTS (
    SELECT 1 FROM public.notary_access
    WHERE user_id = auth.uid() AND notary_id = target_notary_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- REFAZENDO AS POLÍTICAS DE SEGURANÇA (RLS)
-- =========================================================

-- A. Policies para Tabela PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Todo mundo pode ler perfis (necessário para UI básica), mas edição é restrita
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- B. Policies para Tabela NOTARIES (Cartórios)
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados em notaries" ON public.notaries;

-- Admin vê e edita tudo
CREATE POLICY "Admin full access notaries" ON public.notaries
FOR ALL TO authenticated
USING (public.is_admin());

-- Usuário Comum vê APENAS os cartórios vinculados a ele
CREATE POLICY "User view assigned notaries" ON public.notaries
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT notary_id FROM public.notary_access WHERE user_id = auth.uid()
  )
);

-- C. Policies para Tabela PAYMENTS (Pagamentos)
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados em payments" ON public.payments;

-- Admin vê e edita tudo
CREATE POLICY "Admin full access payments" ON public.payments
FOR ALL TO authenticated
USING (public.is_admin());

-- Usuário Comum vê APENAS pagamentos dos seus cartórios
CREATE POLICY "User view assigned payments" ON public.payments
FOR SELECT TO authenticated
USING (
  public.user_has_access_to_notary(notary_id)
);

-- Usuário Comum pode INSERIR pagamentos apenas para seus cartórios
CREATE POLICY "User insert assigned payments" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (
  public.user_has_access_to_notary(notary_id)
);

-- D. Policies para Tabela NOTARY_ACCESS
-- Apenas Admin pode criar vínculos de acesso
CREATE POLICY "Admin manage access" ON public.notary_access
FOR ALL TO authenticated
USING (public.is_admin());

-- Usuário pode ver seus próprios vínculos
CREATE POLICY "User view own access" ON public.notary_access
FOR SELECT TO authenticated
USING (user_id = auth.uid());
