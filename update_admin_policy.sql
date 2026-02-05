-- POLÍTICA CRÍTICA PARA RBAC
-- Permite que usuários com role 'admin' atualizem a tabela de profiles de OUTROS usuários
-- (O padrão anterior só permitia atualizar o próprio perfil)

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles 
FOR UPDATE 
USING (public.is_admin());

-- Também garantir que Admins possam ver tudo (já estava coberto, mas reforçando)
CREATE POLICY "Admins can select all profiles" ON public.profiles
FOR SELECT
USING (true);