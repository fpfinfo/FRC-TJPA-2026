-- ==============================================================================
-- CORREÇÃO DE RECURSÃO INFINITA NAS POLÍTICAS DE SEGURANÇA (RLS)
-- ==============================================================================

-- 1. Desabilitar RLS para limpeza
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas antigas para garantir um estado limpo
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full control" ON public.profiles;
DROP POLICY IF EXISTS "Admins update/delete" ON public.profiles;
DROP POLICY IF EXISTS "Admins insert" ON public.profiles;

-- 3. Função is_admin segura
-- Esta função verifica se o usuário é admin. 
-- SECURITY DEFINER garante que ela rode com permissões limpas, mas a chave é evitar policies conflitantes.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLÍTICAS CORRIGIDAS (Separando SELECT de UPDATE/DELETE para evitar loop)

-- A. SELECT (Leitura): Todos autenticados podem ler (necessário para a função is_admin funcionar sem recursão)
CREATE POLICY "Everyone can view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- B. INSERT: Usuários podem criar seu próprio perfil (primeiro login)
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- C. INSERT (ADMIN): Admins podem criar perfis para outros
CREATE POLICY "Admins can insert profiles" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- D. UPDATE (USUÁRIO): Usuário atualiza APENAS seus dados básicos
-- Nota: Um trigger abaixo impedirá que ele mude o campo 'role'
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- E. UPDATE/DELETE (ADMIN): Admins podem alterar qualquer perfil
-- IMPORTANTE: Não usamos FOR ALL aqui para evitar que o SELECT do is_admin caia nesta regra.
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admins can delete any profile" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- 5. Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. PROTEÇÃO EXTRA: Trigger para impedir que usuários comuns virem admins sozinhos
CREATE OR REPLACE FUNCTION public.protect_role_change()
RETURNS trigger AS $$
BEGIN
  -- Se o campo role foi alterado
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Verifica se quem está fazendo a alteração É admin
    IF NOT public.is_admin() THEN
       RAISE EXCEPTION 'Apenas administradores podem alterar permissões de usuário.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;

CREATE TRIGGER on_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_role_change();
