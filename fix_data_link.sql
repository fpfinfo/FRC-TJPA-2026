-- Script de Correção de Vínculos (Auto-Link)
-- Este script procura usuários (profiles) e cartórios (notaries) que tenham o mesmo nome
-- (comparando 'full_name' com 'responsible_name') e cria o vínculo na tabela de acesso se não existir.

INSERT INTO public.notary_access (user_id, notary_id)
SELECT 
    p.id as user_id, 
    n.id as notary_id
FROM 
    public.profiles p
JOIN 
    public.notaries n ON lower(trim(p.full_name)) = lower(trim(n.responsible_name))
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM public.notary_access na 
        WHERE na.user_id = p.id AND na.notary_id = n.id
    );

-- Verificação (Opcional - para log)
-- SELECT p.full_name, n.name FROM public.notary_access na 
-- JOIN public.profiles p ON p.id = na.user_id 
-- JOIN public.notaries n ON n.id = na.notary_id;
