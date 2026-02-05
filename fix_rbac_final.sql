-- ==============================================================================
-- SCRIPT DE CORREÇÃO DEFINITIVA DE PERMISSÕES (RLS)
-- ==============================================================================

-- 1. Desabilitar RLS temporariamente para limpeza segura
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes da tabela profiles (por nome)
-- Isso evita conflitos entre scripts anteriores (ex: nomes com/sem ponto final)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Recriar Função Helper de Admin (Garantia)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- NOVAS POLÍTICAS (SIMPLIFICADAS E ROBUSTAS)
-- ==============================================================================

-- A. SELECT: Todos usuários autenticados podem ver perfis (necessário para listar usuários)
CREATE POLICY "Authenticated can view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- B. INSERT: Usuário pode inserir APENAS seu próprio perfil
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- C. UPDATE: Usuário pode atualizar APENAS seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- D. ADMIN: Admins têm poder total (SELECT, INSERT, UPDATE, DELETE)
-- Esta política cobre operações de gestão de usuários
CREATE POLICY "Admins have full control" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.is_admin());

-- ==============================================================================
-- STORAGE (AVATARS)
-- ==============================================================================

-- Garantir que bucket existe e é público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover policies antigas de storage para evitar duplicação
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

-- Leitura Pública
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Upload (Insert) - Qualquer autenticado pode subir arquivo na pasta avatars
CREATE POLICY "Authenticated Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Update - Dono do arquivo pode atualizar
CREATE POLICY "Owner Update Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
