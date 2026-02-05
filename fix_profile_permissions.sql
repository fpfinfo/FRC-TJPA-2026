-- 1. Restaurar política de INSERT para profiles (necessário para usuários sem perfil criado via trigger)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. Garantir que políticas de Storage para 'avatars' existam
-- Primeiro, garantir que o bucket existe (idempotente)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Recriar policies de storage para evitar conflitos ou ausências
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;

-- Leitura pública
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Upload (Insert) - Autenticado
CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Update - Próprio usuário
CREATE POLICY "Anyone can update their own avatar."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Delete - Próprio usuário (Opcional, bom para limpeza)
CREATE POLICY "Anyone can delete their own avatar."
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
