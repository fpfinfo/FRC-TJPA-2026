-- ==============================================================================
-- SOLUÇÃO DE VÍNCULO AUTOMÁTICO (AUTO-LINK) - VERSÃO COMPLETA
-- ==============================================================================

-- 1. Função que executa a lógica de vinculação (Perfil -> Cartório)
-- Ela procura na tabela 'notaries' um responsável com o mesmo nome do usuário
CREATE OR REPLACE FUNCTION public.sync_user_notary_access()
RETURNS trigger AS $$
BEGIN
  -- Tenta inserir o vínculo se encontrar match de nome (case insensitive e sem espaços extras)
  INSERT INTO public.notary_access (user_id, notary_id)
  SELECT NEW.id, n.id
  FROM public.notaries n
  WHERE LOWER(TRIM(n.responsible_name)) = LOWER(TRIM(NEW.full_name))
  ON CONFLICT (user_id, notary_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Gatilho na tabela de Perfis
DROP TRIGGER IF EXISTS on_profile_change_link_notary ON public.profiles;

CREATE TRIGGER on_profile_change_link_notary
AFTER INSERT OR UPDATE OF full_name ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.sync_user_notary_access();

-- 3. Função REVERSA (Cartório -> Perfil)
-- Quando um cartório é cadastrado ou o responsável muda, busca se já existe usuário
CREATE OR REPLACE FUNCTION public.sync_notary_user_access()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notary_access (user_id, notary_id)
  SELECT p.id, NEW.id
  FROM public.profiles p
  WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(NEW.responsible_name))
  ON CONFLICT (user_id, notary_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Gatilho na tabela de Cartórios
DROP TRIGGER IF EXISTS on_notary_change_link_user ON public.notaries;

CREATE TRIGGER on_notary_change_link_user
AFTER INSERT OR UPDATE OF responsible_name ON public.notaries
FOR EACH ROW
EXECUTE PROCEDURE public.sync_notary_user_access();

-- 5. Execução Imediata (Sincronização Total)
-- Roda a lógica de vinculação para todos os registros existentes.
INSERT INTO public.notary_access (user_id, notary_id)
SELECT 
    p.id as user_id, 
    n.id as notary_id
FROM 
    public.profiles p
JOIN 
    public.notaries n ON LOWER(TRIM(p.full_name)) = LOWER(TRIM(n.responsible_name))
ON CONFLICT (user_id, notary_id) DO NOTHING;
